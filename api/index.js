require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// Vercel serverless environment variables
const SECRET = process.env.JWT_SECRET || 'gymos_super_secret_123';
const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'masar_gym';

// MongoDB client and database reference
let db = null;
let usersCollection = null;

// In-memory fallback for local development
let memoryUsers = [];
let useMemory = false;

// Database helper functions
async function findUser(query) {
    if (useMemory) {
        if (query.$or) {
            const emailQuery = query.$or[0].email;
            const nameRegex = query.$or[1].name.$regex;
            const namePattern = nameRegex instanceof RegExp ? nameRegex.source : nameRegex;
            return memoryUsers.find(u =>
                u.email === emailQuery ||
                u.name.toLowerCase() === namePattern.toLowerCase()
            );
        }
        return memoryUsers.find(u => u.email === query.email);
    }
    return usersCollection.findOne(query);
}

async function insertUser(user) {
    if (useMemory) {
        memoryUsers.push(user);
        return { insertedId: 'memory' };
    }
    return usersCollection.insertOne(user);
}

async function updateUserData(query, update) {
    if (useMemory) {
        const idx = memoryUsers.findIndex(u => u.email === query.email);
        if (idx !== -1) {
            if (update.$set) {
                memoryUsers[idx] = { ...memoryUsers[idx], ...update.$set };
            }
            if (update.$unset) {
                for (const key in update.$unset) {
                    delete memoryUsers[idx][key];
                }
            }
        }
        return { modifiedCount: 1 };
    }
    return usersCollection.updateOne(query, update);
}

// Connect to MongoDB
async function connectToMongoDB() {
    if (db) return db;

    // Check if MONGODB_URI is defined
    if (!MONGODB_URI) {
        console.log('⚠️ MONGODB_URI not defined, using in-memory storage');
        useMemory = true;
        return null;
    }

    try {
        console.log('Connecting to MongoDB...');
        const client = new MongoClient(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000
        });
        await client.connect();
        db = client.db(DB_NAME);
        usersCollection = db.collection('users');

        // Create indexes
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await usersCollection.createIndex({ createdAt: -1 });

        console.log('✅ Connected to MongoDB successfully');
        useMemory = false;
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('⚠️ Falling back to in-memory storage');
        useMemory = true;
        return null;
    }
}

// Rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const MAX_REQUESTS = 5;

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
        record.count++;
    }

    rateLimitMap.set(ip, record);

    if (record.count > MAX_REQUESTS) {
        return res.status(429).json({ error: 'too_many_requests' });
    }
    next();
}

// Email transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendVerificationEmail(to, code) {
    const mailOptions = {
        from: process.env.EMAIL_FROM || `"Masar 🏋️" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Masar — Your Verification Code',
        html: `
        <div style="font-family:'Segoe UI',sans-serif;background:#0f0f14;color:#fff;padding:40px;border-radius:16px;max-width:480px;margin:auto">
            <div style="text-align:center;margin-bottom:32px">
                <div style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#22d3ee);padding:16px;border-radius:16px;font-size:2rem">🏋️</div>
                <h2 style="margin:16px 0 4px;font-size:1.6rem;letter-spacing:-0.5px">Masar Verification</h2>
                <p style="color:#a1a1aa;margin:0">Enter this code to activate your account</p>
            </div>
            <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
                <span style="font-size:3rem;font-weight:800;letter-spacing:16px;color:#fff">${code}</span>
            </div>
            <p style="color:#71717a;font-size:0.85rem;text-align:center">This code expires in 15 minutes. If you didn't sign up, ignore this email.</p>
        </div>
        `,
    };
    await transporter.sendMail(mailOptions);
}

// Set correct MIME types
app.use((req, res, next) => {
    if (req.url.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
    } else if (req.url.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
    } else if (req.url.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
    }
    next();
});

// Middleware to ensure MongoDB connection
async function ensureDB(req, res, next) {
    try {
        await connectToMongoDB();
        next();
    } catch (error) {
        console.error('Database connection failed:', error);
        res.status(500).json({ error: 'database_error' });
    }
}

// ── AUTH ENDPOINTS ─────────────────────────────────────────────

app.post('/api/signup', rateLimit, ensureDB, async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'all_fields_required' });
    }
    if (name.length > 50 || email.length > 100 || password.length > 100) {
        return res.status(400).json({ error: 'input_too_long' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'invalid_email' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'password_too_short' });
    }

    // Check if user exists
    const existingUser = await findUser({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'email_exists' });
    }

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        createdAt: new Date(),
        data: {}
    };

    await insertUser(newUser);

    sendVerificationEmail(email, verificationCode)
        .then(() => console.log(`[EMAIL SENT] To: ${email}`))
        .catch(err => console.error(`[EMAIL FAILED] ${err.message} | Code: ${verificationCode}`));

    res.json({ message: 'verification_sent' });
});

app.post('/api/verify', ensureDB, async (req, res) => {
    const { email, code } = req.body;
    const user = await findUser({ email });

    if (!user || user.verificationCode !== code) {
        return res.status(400).json({ error: 'invalid_code' });
    }

    await updateUserData(
        { email },
        { $set: { isVerified: true }, $unset: { verificationCode: "" } }
    );

    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email } });
});

app.post('/api/login', rateLimit, ensureDB, async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: 'all_fields_required' });
    }
    if (identifier.length > 100 || password.length > 100) {
        return res.status(400).json({ error: 'input_too_long' });
    }

    const user = await findUser({
        $or: [
            { email: identifier.toLowerCase() },
            { name: { $regex: new RegExp(`^${identifier}$`, 'i') } }
        ]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'invalid_creds' });
    }

    if (!user.isVerified) {
        return res.status(403).json({ error: 'not_verified' });
    }

    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email, photo: user.profilePhoto } });
});

// ── GOOGLE OAUTH ───────────────────────────────────────────────

app.post('/api/google-auth', ensureDB, async (req, res) => {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
        return res.status(400).json({ error: 'missing_token' });
    }

    try {
        let name, email, picture;

        if (idToken) {
            const ticket = await gClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
        } else if (accessToken) {
            const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!userInfoRes.ok) {
                throw new Error('Failed to get user info from Google');
            }
            const userInfo = await userInfoRes.json();
            name = userInfo.name;
            email = userInfo.email;
            picture = userInfo.picture;
        }

        let user = await findUser({ email });

        if (!user) {
            user = {
                name,
                email,
                password: null,
                isVerified: true,
                provider: 'google',
                profilePhoto: picture || null,
                createdAt: new Date(),
                data: {}
            };
            await insertUser(user);
            console.log(`[GOOGLE] New user created: ${email}`);
        } else {
            console.log(`[GOOGLE] Existing user signed in: ${email}`);
        }

        const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { name: user.name, email: user.email, photo: user.profilePhoto }
        });
    } catch (e) {
        console.error('[GOOGLE AUTH ERROR]', e.message);
        res.status(401).json({ error: 'google_auth_failed' });
    }
});

// ── DATA ENDPOINTS ─────────────────────────────────────────────

const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'unauthorized' });
    try {
        req.user = jwt.verify(token, SECRET);
        next();
    } catch (e) {
        res.status(401).json({ error: 'unauthorized' });
    }
};

app.get('/api/data', ensureDB, auth, async (req, res) => {
    const user = await findUser({ email: req.user.email });
    res.json(user?.data || {});
});

app.post('/api/data', ensureDB, auth, async (req, res) => {
    const user = await findUser({ email: req.user.email });

    if (!user) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    };

    const sanitizeData = (data) => {
        if (!data || typeof data !== 'object') return data;
        const sanitized = {};
        for (const key in data) {
            if (typeof data[key] === 'string') {
                sanitized[key] = sanitizeString(data[key]).substring(0, 10000);
            } else if (typeof data[key] === 'object') {
                sanitized[key] = sanitizeData(data[key]);
            } else {
                sanitized[key] = data[key];
            }
        }
        return sanitized;
    };

    const updateData = { data: sanitizeData(req.body) };

    if (req.body.user && typeof req.body.user === 'string') {
        updateData.name = sanitizeString(req.body.user).substring(0, 50);
    }

    if (req.body.userprofile?.photo) {
        const photoUrl = req.body.userprofile.photo;
        if (typeof photoUrl === 'string' && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:'))) {
            updateData.profilePhoto = photoUrl.substring(0, 500);
        }
    }

    await updateUserData({ email: req.user.email }, { $set: updateData });

    res.json({ success: true });
});

// Global error handler to ensure JSON response
app.use((err, req, res, next) => {
    console.error('[SERVER ERROR]', err);
    res.status(500).json({ error: 'internal_server_error' });
});

// Export for Vercel
module.exports = app;

// Local development server
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', async () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        await connectToMongoDB();
    });
}
