// ── PAGE COMPONENTS ────────────────────────────────────────────────

// Login Page Component
async function LoginComponent() {
    return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Masar — Login</title>
    <link rel="icon" type="image/png" href="./user-icon.png" sizes="32x32">
    <link rel="stylesheet" href="shared.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#8b5cf6">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #050505; }
        .auth-container { width: 100%; max-width: 400px; padding: 20px; }
        .auth-card { background: #0a0a0a; border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 20px; padding: 32px 24px; }
        .logo { text-align: center; margin-bottom: 32px; }
        .logo h1 { color: #8b5cf6; font-size: 36px; margin: 0; font-weight: 800; }
        .logo p { color: #666; margin: 8px 0 0; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 14px; }
        .form-group input { width: 100%; padding: 14px 16px; background: #111; border: 1px solid #222; border-radius: 12px; color: #fff; font-size: 16px; box-sizing: border-box; }
        .form-group input:focus { outline: none; border-color: #8b5cf6; }
        .btn { width: 100%; padding: 16px; background: #8b5cf6; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #7c3aed; }
        .btn-secondary { background: #222; margin-top: 12px; }
        .divider { text-align: center; margin: 24px 0; color: #444; position: relative; }
        .divider::before, .divider::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: #222; }
        .divider::before { left: 0; }
        .divider::after { right: 0; }
        .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 14px; background: #fff; color: #333; border: none; border-radius: 12px; font-size: 16px; font-weight: 500; cursor: pointer; }
        .google-btn:hover { background: #f5f5f5; }
        .footer { text-align: center; margin-top: 24px; color: #444; font-size: 14px; }
        .footer a { color: #8b5cf6; text-decoration: none; }
        .error { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; display: none; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="logo">
                <h1>Masar</h1>
                <p>Your Fitness Journey</p>
            </div>
            <div class="error" id="error"></div>
            <form id="loginForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required placeholder="Enter your password">
                </div>
                <button type="submit" class="btn">Sign In</button>
            </form>
            <div class="divider">or</div>
            <button class="google-btn" id="googleBtn">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
            </button>
            <div class="footer">
                Don't have an account? <a href="#/signup">Sign up</a>
            </div>
        </div>
    </div>
    <script>
        // Check if already logged in
        const token = localStorage.getItem('masar_token');
        if (token) {
            window.Router.navigate('/home');
        }

        // Email login
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('error');
            
            try {
                const res = await fetch(API_URL + '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Login failed');
                
                localStorage.setItem('masar_token', data.token);
                localStorage.setItem('masar', JSON.stringify(data.user || {}));
                window.Router.navigate('/home');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            }
        });

        // Google login
        document.getElementById('googleBtn').addEventListener('click', () => {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: '758236261474-2g4lrqir83avkfo7pn8laao77h5i8noc.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                callback: async (response) => {
                    if (response.access_token) {
                        try {
                            const res = await fetch(API_URL + '/google-login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: response.access_token })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Google login failed');
                            
                            localStorage.setItem('masar_token', data.token);
                            localStorage.setItem('masar', JSON.stringify(data.user || {}));
                            window.Router.navigate('/home');
                        } catch (err) {
                            document.getElementById('error').textContent = err.message;
                            document.getElementById('error').style.display = 'block';
                        }
                    }
                }
            });
            client.requestAccessToken();
        });
    </script>
</body>
</html>\`;
}

// Signup Page Component
async function SignupComponent() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Masar — Sign Up</title>
    <link rel="icon" type="image/png" href="./user-icon.png" sizes="32x32">
    <link rel="stylesheet" href="shared.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#8b5cf6">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <style>
        body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #050505; }
        .auth-container { width: 100%; max-width: 400px; padding: 20px; }
        .auth-card { background: #0a0a0a; border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 20px; padding: 32px 24px; }
        .logo { text-align: center; margin-bottom: 32px; }
        .logo h1 { color: #8b5cf6; font-size: 36px; margin: 0; font-weight: 800; }
        .logo p { color: #666; margin: 8px 0 0; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; color: #aaa; margin-bottom: 8px; font-size: 14px; }
        .form-group input { width: 100%; padding: 14px 16px; background: #111; border: 1px solid #222; border-radius: 12px; color: #fff; font-size: 16px; box-sizing: border-box; }
        .form-group input:focus { outline: none; border-color: #8b5cf6; }
        .btn { width: 100%; padding: 16px; background: #8b5cf6; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; }
        .btn:hover { background: #7c3aed; }
        .divider { text-align: center; margin: 24px 0; color: #444; position: relative; }
        .divider::before, .divider::after { content: ''; position: absolute; top: 50%; width: 40%; height: 1px; background: #222; }
        .divider::before { left: 0; }
        .divider::after { right: 0; }
        .google-btn { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 14px; background: #fff; color: #333; border: none; border-radius: 12px; font-size: 16px; font-weight: 500; cursor: pointer; }
        .google-btn:hover { background: #f5f5f5; }
        .footer { text-align: center; margin-top: 24px; color: #444; font-size: 14px; }
        .footer a { color: #8b5cf6; text-decoration: none; }
        .error { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; display: none; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="logo">
                <h1>Masar</h1>
                <p>Create Your Account</p>
            </div>
            <div class="error" id="error"></div>
            <form id="signupForm">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" id="name" required placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="email" required placeholder="Enter your email">
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="password" required placeholder="Create a password">
                </div>
                <button type="submit" class="btn">Create Account</button>
            </form>
            <div class="divider">or</div>
            <button class="google-btn" id="googleBtn">
                <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
            </button>
            <div class="footer">
                Already have an account? <a href="#/login">Sign in</a>
            </div>
        </div>
    </div>
    <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorEl = document.getElementById('error');
            
            try {
                const res = await fetch(API_URL + '/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Signup failed');
                
                localStorage.setItem('masar_token', data.token);
                localStorage.setItem('masar', JSON.stringify(data.user || {}));
                window.Router.navigate('/home');
            } catch (err) {
                errorEl.textContent = err.message;
                errorEl.style.display = 'block';
            }
        });

        document.getElementById('googleBtn').addEventListener('click', () => {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: '758236261474-2g4lrqir83avkfo7pn8laao77h5i8noc.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                callback: async (response) => {
                    if (response.access_token) {
                        try {
                            const res = await fetch(API_URL + '/google-login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token: response.access_token })
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Google login failed');
                            
                            localStorage.setItem('masar_token', data.token);
                            localStorage.setItem('masar', JSON.stringify(data.user || {}));
                            window.Router.navigate('/home');
                        } catch (err) {
                            document.getElementById('error').textContent = err.message;
                            document.getElementById('error').style.display = 'block';
                        }
                    }
                }
            });
            client.requestAccessToken();
        });
    </script>
</body>
</html>\`;
}

// Home Page Component
async function HomeComponent() {
  return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masar — Dashboard</title>
    <link rel="icon" type="image/png" href="./user-icon.png" sizes="32x32">
    <link rel="stylesheet" href="shared.css">
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#8b5cf6">
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>
    <script src="shared-animations.js"></script>
    <style>
        * { box-sizing: border-box; }
        body { background: #050505; min-height: 100vh; margin: 0; font-family: 'Outfit', 'Inter', sans-serif; color: #fff; padding-bottom: 80px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px 16px; }
        .hero { background: linear-gradient(135deg, rgba(139, 92, 246, .12) 0%, rgba(34, 211, 238, .08) 100%); border: 1px solid rgba(139, 92, 246, .2); border-radius: 20px; padding: 32px; margin-bottom: 28px; }
        .hero h1 { font-size: 28px; margin: 0 0 8px; }
        .hero p { color: #888; margin: 0; font-size: 14px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px; }
        .card { background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 16px; padding: 20px; text-decoration: none; color: inherit; transition: transform 0.2s, border-color 0.2s; }
        .card:hover { transform: translateY(-2px); border-color: #8b5cf6; }
        .card-icon { width: 48px; height: 48px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #8b5cf6; }
        .card h3 { margin: 0 0 4px; font-size: 16px; }
        .card p { margin: 0; color: #666; font-size: 12px; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #0a0a0a; border-top: 1px solid #1a1a1a; display: flex; justify-content: space-around; padding: 12px 0; }
        .nav-item { display: flex; flex-direction: column; align-items: center; text-decoration: none; color: #666; font-size: 12px; gap: 4px; }
        .nav-item.active { color: #8b5cf6; }
        .nav-item i { width: 24px; height: 24px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>Welcome to Masar</h1>
            <p>Your ultimate fitness companion</p>
        </div>
        
        <div class="grid">
            <a href="#/workout" class="card">
                <div class="card-icon"><i data-lucide="dumbbell"></i></div>
                <h3>Workout</h3>
                <p>Start your training</p>
            </a>
            <a href="#/diet" class="card">
                <div class="card-icon"><i data-lucide="utensils"></i></div>
                <h3>Diet Plan</h3>
                <p>Nutrition tracking</p>
            </a>
            <a href="#/progress" class="card">
                <div class="card-icon"><i data-lucide="trending-up"></i></div>
                <h3>Progress</h3>
                <p>Track your growth</p>
            </a>
            <a href="#/stats" class="card">
                <div class="card-icon"><i data-lucide="bar-chart-2"></i></div>
                <h3>Stats</h3>
                <p>View analytics</p>
            </a>
            <a href="#/shopping" class="card">
                <div class="card-icon"><i data-lucide="shopping-bag"></i></div>
                <h3>Shopping</h3>
                <p>Supplements & gear</p>
            </a>
            <a href="#/settings" class="card">
                <div class="card-icon"><i data-lucide="settings"></i></div>
                <h3>Settings</h3>
                <p>Customize app</p>
            </a>
        </div>
    </div>
    
    <nav class="bottom-nav">
        <a href="#/home" class="nav-item active"><i data-lucide="home"></i><span>Home</span></a>
        <a href="#/workout" class="nav-item"><i data-lucide="dumbbell"></i><span>Workout</span></a>
        <a href="#/progress" class="nav-item"><i data-lucide="trending-up"></i><span>Progress</span></a>
        <a href="#/settings" class="nav-item"><i data-lucide="settings"></i><span>Settings</span></a>
    </nav>
    
    <script>
        lucide.createIcons();
    </script>
</body>
</html>\`;
}

// Export for router
window.PageComponents = {
    LoginComponent,
    SignupComponent,
    HomeComponent
};
