const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

function rateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
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

const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'gymos_super_secret_123';
const DB_FILE = '/data/db.json';

// ── EMAIL TRANSPORTER ───────────────────────────────────────────────
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

app.use(cors());
app.use(express.json());

// Set correct MIME types for PWA files
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

app.use(express.static(__dirname));

// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Ensure DB exists
if (!fs.existsSync(DB_FILE)) {
    fs.writeJsonSync(DB_FILE, { users: [] });
}

const getUsers = () => fs.readJsonSync(DB_FILE).users;
const saveUsers = (users) => fs.writeJsonSync(DB_FILE, { users });

// ── AUTH ENDPOINTS ─────────────────────────────────────────────

app.post('/api/signup', rateLimit, async (req, res) => {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'all_fields_required' });
    }
    if (name.length > 50 || email.length > 100 || password.length > 100) {
        return res.status(400).json({ error: 'input_too_long' });
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'invalid_email' });
    }
    // Password strength
    if (password.length < 6) {
        return res.status(400).json({ error: 'password_too_short' });
    }

    const users = getUsers();

    if (users.find(u => u.email === email)) {
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
        createdAt: new Date().toISOString(),
        data: {}
    };

    users.push(newUser);
    saveUsers(users);

    // Send real verification email, fall back to console on error
    sendVerificationEmail(email, verificationCode)
        .then(() => console.log(`[EMAIL SENT] To: ${email}`))
        .catch(err => console.error(`[EMAIL FAILED] ${err.message} | Code: ${verificationCode}`));

    res.json({ message: 'verification_sent' });
});

app.post('/api/verify', (req, res) => {
    const { email, code } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.verificationCode !== code) {
        return res.status(400).json({ error: 'invalid_code' });
    }

    user.isVerified = true;
    saveUsers(users);

    const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email } });
});

app.post('/api/login', rateLimit, async (req, res) => {
    const { identifier, password } = req.body;

    // Input validation
    if (!identifier || !password) {
        return res.status(400).json({ error: 'all_fields_required' });
    }
    if (identifier.length > 100 || password.length > 100) {
        return res.status(400).json({ error: 'input_too_long' });
    }

    const users = getUsers();
    const user = users.find(u => u.email === identifier.toLowerCase() || u.name.toLowerCase() === identifier.toLowerCase());

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

app.post('/api/google-auth', async (req, res) => {
    const { idToken, accessToken } = req.body;

    // Support both idToken (Google Sign-In) and accessToken (OAuth2)
    if (!idToken && !accessToken) {
        return res.status(400).json({ error: 'missing_token' });
    }

    try {
        let name, email, picture;

        if (idToken) {
            // Google Sign-In with ID token
            const ticket = await gClient.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            name = payload.name;
            email = payload.email;
            picture = payload.picture;
        } else if (accessToken) {
            // OAuth2 with access token - call userinfo API
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

        const users = getUsers();
        let user = users.find(u => u.email === email);

        if (!user) {
            // Auto-create verified Google account (no password needed)
            user = {
                name,
                email,
                password: null,
                isVerified: true,
                provider: 'google',
                profilePhoto: picture || null,
                createdAt: new Date().toISOString(),
                data: {}
            };
            users.push(user);
            saveUsers(users);
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

app.get('/api/data', auth, (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.email === req.user.email);
    res.json(user.data || {});
});

app.post('/api/data', auth, (req, res) => {
    const users = getUsers();
    const userIdx = users.findIndex(u => u.email === req.user.email);

    // Sanitize input data to prevent XSS
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    };

    const sanitizeData = (data) => {
        if (!data || typeof data !== 'object') return data;
        const sanitized = {};
        for (const key in data) {
            if (typeof data[key] === 'string') {
                sanitized[key] = sanitizeString(data[key]).substring(0, 10000); // Limit string length
            } else if (typeof data[key] === 'object') {
                sanitized[key] = sanitizeData(data[key]);
            } else {
                sanitized[key] = data[key];
            }
        }
        return sanitized;
    };

    users[userIdx].data = sanitizeData(req.body);

    // Validate and sanitize name
    if (req.body.user && typeof req.body.user === 'string') {
        users[userIdx].name = sanitizeString(req.body.user).substring(0, 50);
    }

    // Validate photo URL
    if (req.body.userprofile?.photo) {
        const photoUrl = req.body.userprofile.photo;
        if (typeof photoUrl === 'string' && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('data:'))) {
            users[userIdx].profilePhoto = photoUrl.substring(0, 500);
        }
    }

    saveUsers(users);
    res.json({ success: true });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});