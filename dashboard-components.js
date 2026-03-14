const { useState, useEffect } = React;
const e = React.createElement;

function HeroSection({ language, tdee, goal, userprofile }) {
    const goals = {
        loss: t('weight_loss'),
        gain: t('muscle_gain'),
        maintain: t('maintenance')
    };

    const isRtl = language === 'ar';
    const xOffset = isRtl ? 20 : -20;

    const title = !tdee
        ? (userprofile?.name && userprofile?.name !== 'Guest' ? userprofile.name : t('fitness_os'))
        : (userprofile?.name && userprofile?.name !== 'Guest' ? t('welcome_back_user', { user: userprofile.name }) : t('welcome_hero_wa'));

    const sub = !tdee
        ? t('hero_desc')
        : `${Math.round(tdee)} ${t('kcal_per_day')} · ${t('goal')}: ${goals[goal] || t('maintenance')}`;

    return e(window.Motion.motion.div, {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, ease: "easeOut" },
        className: "hero"
    },
        e(window.Motion.motion.div, {
            key: title,
            initial: { opacity: 0, x: xOffset },
            animate: { opacity: 1, x: 0 },
            className: "hero-title"
        }, title),
        e(window.Motion.motion.div, {
            initial: { opacity: 0 },
            animate: { opacity: 0.6 },
            transition: { delay: 0.5 },
            className: "hero-greeting",
            "data-i18n": "welcome_hero"
        }, t('welcome_hero')),
        e(window.Motion.motion.div, {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.6 },
            style: {
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--purple-l)',
                marginBottom: '8px',
                textAlign: 'center'
            }
        }, "✨ Define Your Masar"),
        e(window.Motion.motion.div, {
            key: sub,
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 0.2 },
            className: "hero-sub"
        }, sub),
        e("div", { className: "quick-links" },
            [
                { href: "stats.html", label: "Calculate Stats", icon: "⚡", i18n: "setup_stats" },
                { href: "diet.html", label: "Diet Plan", icon: "🗓", i18n: "diet" },
                { href: "workout.html", label: "Workout", icon: "🏋️", i18n: "workout" },
                { href: "progress.html", label: "Progress", icon: "📈", i18n: "progress" }
            ].map((link, i) =>
                e(window.Motion.motion.a, {
                    key: link.href,
                    href: link.href,
                    whileHover: { scale: 1.05, backgroundColor: "rgba(124, 58, 237, 0.15)" },
                    whileTap: { scale: 0.95 },
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                    transition: { delay: 0.4 + (i * 0.1) },
                    className: "quick-link"
                },
                    link.icon, " ", e("span", { "data-i18n": link.i18n }, link.label)
                )
            )
        )
    );
}

function SnapshotCard({ icon, label, val, colorClass, delay, i18n }) {
    return e(window.Motion.motion.div, {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { delay, duration: 0.5, type: "spring" },
        whileHover: { y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)" },
        className: "stat-card"
    },
        e("div", { className: "stat-icon-box" },
            e("i", { "data-lucide": icon, className: colorClass })
        ),
        e("div", null,
            e(window.Motion.motion.div, {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                className: "stat-val"
            }, val),
            e("div", { className: "stat-lbl", "data-i18n": i18n }, label)
        )
    );
}

function FeatureCard({ href, icon, name, desc, colorClass, delay, i18nName, i18nDesc }) {
    return e(window.Motion.motion.a, {
        href: href,
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.6 },
        whileHover: { scale: 1.02, y: -5 },
        className: `fc ${colorClass}`
    },
        e("div", { className: "fc-icon" },
            e("i", { "data-lucide": icon, className: `icon-glow-${colorClass.split('-')[1]}` })
        ),
        e("div", { className: "fc-name", "data-i18n": i18nName }, name),
        e("div", { className: "fc-desc", "data-i18n": i18nDesc }, desc),
        e("div", { className: "fc-arrow" }, "Open →")
    );
}

function DashboardApp() {
    const [S, setS] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadAppState = async () => {
            try {
                if (typeof fetchAndSaveState === 'function') {
                    await fetchAndSaveState();
                }
                const state = typeof loadState === 'function' ? loadState() : {};
                setS(state);
                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading state:', error);
                setIsLoaded(true);
            }
        };
        loadAppState();
    }, []);

    useEffect(() => {
        if (isLoaded && window.lucide) {
            window.lucide.createIcons();
        }
    }, [S, isLoaded]);

    if (!isLoaded) {
        return e("div", { style: { padding: '50px', textAlign: 'center', color: 'white' } }, "Loading...");
    }

    const lang = S.lang || 'en';

    const snapshotData = [
        { icon: "flame", label: t('daily_calories'), val: S.tdee ? Math.round(S.tdee) + ' ' + t('kcal') : '—', colorClass: "icon-glow-orange", i18n: "daily_calories" },
        { icon: "activity", label: t('protein'), val: S.tdee ? Math.round((S.tdee * .25) / 4) + 'g' : '—', colorClass: "icon-glow-purple", i18n: "protein_target" },
        { icon: "droplets", label: t('water'), val: S.weight ? ((S.weight * 35) / 1000).toFixed(1) + ' ' + t('liter') : '—', colorClass: "icon-glow-cyan", i18n: "water_intake" },
        { icon: "target", label: t('goal'), val: S.goal ? (S.goal === 'loss' ? '🔻 ' + t('loss') : S.goal === 'gain' ? '💪 ' + t('gain') : '⚖️ ' + t('maintain')) : '—', colorClass: "icon-glow-emerald", i18n: "goal" }
    ];

    return e(React.Fragment, null,
        ReactDOM.createPortal(
            e(HeroSection, { language: lang, tdee: S.tdee, goal: S.goal, userprofile: S.userprofile }),
            document.getElementById('dashboard-hero-root')
        ),
        ReactDOM.createPortal(
            !S.tdee ? e("div", { className: "setup-banner fade-up-2", style: { display: 'flex' } },
                e("span", { "data-i18n": "setup_desc" }, "⚠️ Start by calculating your profile — "),
                e("a", { href: "stats.html", "data-i18n": "setup_stats" }, "Setup Stats →")
            ) : null,
            document.getElementById('setup-banner')
        ),
        ReactDOM.createPortal(
            e("div", { className: "section" },
                e(window.Motion.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, className: "section-title", "data-i18n": "today_snapshot" }, t('today_snapshot')),
                e("div", { className: "snap-grid" },
                    snapshotData.map((item, idx) => e(SnapshotCard, { key: idx, ...item, delay: 0.2 + idx * 0.1 }))
                )
            ),
            document.getElementById('dashboard-snap-root')
        ),
        ReactDOM.createPortal(
            e("div", { className: "section" },
                e(window.Motion.motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, className: "section-title", "data-i18n": "features" }, t('features')),
                e("div", { className: "feature-grid" },
                    e(FeatureCard, { href: "stats.html", icon: "calculator", name: "Stats Calculator", desc: "BMR, TDEE, macros & water intake tailored to you", colorClass: "fc-p", delay: 0.6, i18nName: "stats_calc", i18nDesc: "stats_desc" }),
                    e(FeatureCard, { href: "diet.html", icon: "utensils", name: "Monthly Diet", desc: "30-day meal plan with 60+ foods & per-meal swapping", colorClass: "fc-c", delay: 0.7, i18nName: "monthly_diet", i18nDesc: "diet_sub" }),
                    e(FeatureCard, { href: "workout.html", icon: "dumbbell", name: "Workout", desc: "Fat Burn, PPL or Balanced — 30-day schedule", colorClass: "fc-p", delay: 0.8, i18nName: "workout_btn", i18nDesc: "workout_sub" }),
                    e(FeatureCard, { href: "progress.html", icon: "trending-up", name: "Progress Tracker", desc: "Log weight trends over time with visual charts", colorClass: "fc-o", delay: 0.9, i18nName: "progress_tracker", i18nDesc: "weight_trend" }),
                    e(FeatureCard, { href: "shopping.html", icon: "shopping-cart", name: "Shopping List", desc: "Weekly grocery guide with auto-check progress", colorClass: "fc-c", delay: 1.0, i18nName: "shopping_list", i18nDesc: "pantry" }),
                    e(FeatureCard, { href: "settings.html", icon: "user", name: "Developer", desc: "Ahmed Zain — Web Developer, Cairo University", colorClass: "fc-o", delay: 1.1, i18nName: "developer", i18nDesc: "role" })
                )
            ),
            document.getElementById('dashboard-features-root')
        )
    );
}

const rootElement = document.createElement('div');
const root = ReactDOM.createRoot(rootElement);
root.render(e(DashboardApp));

