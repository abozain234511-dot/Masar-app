// Shared Page Transitions Utility
document.addEventListener('DOMContentLoaded', () => {
    // Only apply if Framer Motion is loaded (via CDN)
    if (window.Motion) {
        const { animate } = window.Motion;
        if (typeof animate !== 'function') {
            console.warn('Motion.animate is not a function. Falling back.');
            return;
        }

        // Target the main content area
        const mainInner = document.querySelector('.main-inner');
        if (mainInner) {
            // Initial state (hidden and shifted)
            mainInner.style.opacity = '0';
            mainInner.style.transform = 'translateY(15px)';

            // Animate in
            animate(
                mainInner,
                { opacity: 1, translateY: 0 },
                { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
            );
        }

        // Animate sidebar items sequentially
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, idx) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-10px)';
            animate(
                item,
                { opacity: 1, translateX: 0 },
                { delay: 0.1 + (idx * 0.05), duration: 0.4 }
            );
        });
    }
});
