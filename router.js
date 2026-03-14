// ── SIMPLE HASH ROUTER ─────────────────────────────────────────────

const routes = {};
let currentRoute = null;

// Register a route
function registerRoute(path, componentFn) {
    routes[path] = componentFn;
}

// Navigate to a route
function navigate(path) {
    window.location.hash = path;
}

// Get current route from hash
function getRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash.startsWith('/') ? hash : '/' + hash;
}

// Render the current route
async function render() {
    const path = getRoute();
    const app = document.getElementById('app');

    if (!app) {
        console.error('App container not found');
        return;
    }

    // Check if route exists
    if (!routes[path]) {
        // Try to find closest match or default to login
        if (path === '/' || path === '' || path === '/home') {
            navigate('#/login');
            return;
        }
        // 404 - redirect to login
        app.innerHTML = '<div class="error">Page not found</div>';
        return;
    }

    // Don't re-render if same route
    if (currentRoute === path && app.innerHTML) {
        return;
    }

    currentRoute = path;

    try {
        // Show loading
        app.innerHTML = '<div class="loading">Loading...</div>';

        // Render the component
        const html = await routes[path]();
        app.innerHTML = html;

        // Run any post-render scripts
        executeScripts(app);

        // Scroll to top
        window.scrollTo(0, 0);

        // Update active nav links
        updateActiveNav(path);

    } catch (error) {
        console.error('Route render error:', error);
        app.innerHTML = `<div class="error">Error loading page: ${error.message}</div>`;
    }
}

// Execute scripts in the rendered HTML
function executeScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        script.replaceWith(newScript);
    });
}

// Update active state on navigation
function updateActiveNav(path) {
    document.querySelectorAll('nav a, .bottom-nav a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.replace('#', '') === path) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Handle browser back/forward
window.addEventListener('hashchange', render);

// Initialize router
function initRouter() {
    // Handle initial route
    if (!window.location.hash) {
        // Check if user is logged in
        const token = localStorage.getItem('masar_token');
        if (token) {
            window.location.hash = '#/home';
        } else {
            window.location.hash = '#/login';
        }
    }

    // Render on load
    render();
}

// Export functions
window.Router = {
    registerRoute,
    navigate,
    getRoute,
    render,
    initRouter
};
