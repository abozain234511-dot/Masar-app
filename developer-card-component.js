const { useState, useEffect } = React;
const e = React.createElement;

function DeveloperCard() {
    const S = typeof loadState === 'function' ? loadState() : {};
    const lang = S.lang || 'en';

    const t = {
        en: {
            role: "Software Engineer",
            web_dev: "Web Developer",
            bio: "Student at Faculty of Computers & AI",
            university: "Cairo University",
            email: "Email",
            phone: "Phone",
            github: "GitHub",
            open: "Open",
            copy: "Copy",
            copied: "Copied!",
            visit: "Visit",
            open_app: "Open Masar App",
            footer: "Ahmed Zain · 2026"
        },
        ar: {
            role: "مهندس برمجيات",
            web_dev: "مطور ويب",
            bio: "طالب بكلية الحاسبات والذكاء الاصطناعي",
            university: "جامعة القاهرة",
            email: "البريد الإلكتروني",
            phone: "الهاتف",
            github: "جيتهاب",
            open: "فتح",
            copy: "نسخ",
            copied: "تم النسخ!",
            visit: "زيارة",
            open_app: "فتح تطبيق Masar",
            footer: "أحمد زين · ٢٠٢٦"
        }
    }[lang];

    const handleCopy = (text, msg, evt) => {
        if (evt) evt.preventDefault();
        navigator.clipboard.writeText(text).then(() => {
            if (typeof showToast === 'function') showToast(msg);
        });
    };

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [lang]);

    return e("div", {
        className: "dev-card-wrapper",
        style: { position: 'relative', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
    },
        e("div", { className: "blob blob-1" }),
        e("div", { className: "blob blob-2" }),
        e("div", { className: "premium-dev-card" },
            e("div", { className: "shimmer-bar" }),
            e("div", { className: "avatar-section" },
                e("div", { className: "bg-text" }, "AHMED ZAIN"),
                e("div", { className: "avatar-container" },
                    e("div", { className: "avatar-inner" },
                        e("img", {
                            src: "WhatsApp Image 2026-02-09 at 11.05.47 PM.jpeg",
                            alt: "Ahmed Zain",
                            onError: (evt) => {
                                evt.target.onerror = null;
                                evt.target.src = 'profile.jpg';
                                evt.target.onerror = () => {
                                    evt.target.style.display = 'none';
                                    evt.target.parentElement.innerHTML += '<i data-lucide="user" style="color:#fff;width:48px;height:48px"></i>';
                                    if (window.lucide) window.lucide.createIcons();
                                };
                            }
                        })
                    ),
                    e("span", { className: "status-dot" })
                )
            ),
            e("div", { className: "info-section" },
                e("h3", { className: "dev-name" }, "Ahmed Zain"),
                e("div", { className: "dev-role" }, t.web_dev),
                e("p", { className: "dev-bio" },
                    e("strong", null, "Student"), t.bio.split('Student')[1], e("br"),
                    t.university, " 🎓"
                )
            ),
            e("div", { className: "dev-divider" }),
            e("div", { className: "contact-list" },
                e("a", { href: "mailto:az967252@gmail.com", className: "dev-contact-btn" },
                    e("div", { className: "dev-btn-icon icon-email" }, e("i", { "data-lucide": "mail" })),
                    e("div", { className: "dev-btn-text" },
                        e("span", { className: "dev-btn-label" }, t.email),
                        e("span", { className: "dev-btn-value" }, "az967252@gmail.com")
                    ),
                    e("span", { className: "dev-btn-action" }, "Open ↗")
                ),
                e("a", { href: "#", className: "dev-contact-btn", onClick: (evt) => handleCopy('01276031874', t.copied, evt) },
                    e("div", { className: "dev-btn-icon icon-phone" }, e("i", { "data-lucide": "phone" })),
                    e("div", { className: "dev-btn-text" },
                        e("span", { className: "dev-btn-label" }, t.phone),
                        e("span", { className: "dev-btn-value" }, "+20 1276031874")
                    ),
                    e("span", { className: "dev-btn-action" }, "Copy ✓")
                ),
                e("a", { href: "https://github.com/az967252-creator", target: "_blank", rel: "noopener", className: "dev-contact-btn" },
                    e("div", { className: "dev-btn-icon icon-github" }, e("i", { "data-lucide": "github" })),
                    e("div", { className: "dev-btn-text" },
                        e("span", { className: "dev-btn-label" }, t.github),
                        e("span", { className: "dev-btn-value" }, "az967252-creator")
                    ),
                    e("span", { className: "dev-btn-action" }, "Visit ↗")
                )
            ),
            e("div", { className: "dev-footer-text" }, "✦ " + t.footer),
            e("style", null, `
                .premium-dev-card {
                    position: relative;
                    width: 100%;
                    max-width: 380px;
                    background: rgba(10, 10, 10, 0.85);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(139, 92, 246, 0.25);
                    border-radius: 28px;
                    padding: 40px 32px 32px;
                    overflow: hidden;
                    box-shadow: 0 0 60px rgba(139, 92, 246, 0.15), 0 30px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
                    z-index: 2;
                }

                .blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.25;
                    pointer-events: none;
                    animation: blobAnim 8s ease-in-out infinite alternate;
                    z-index: 1;
                }
                .blob-1 { width: 300px; height: 300px; background: #8b5cf6; top: -50px; left: -50px; }
                .blob-2 { width: 250px; height: 250px; background: #22d3ee; bottom: -40px; right: -40px; animation-delay: 2s; }

                @keyframes blobAnim {
                    0% { transform: translate(0, 0) scale(1) }
                    100% { transform: translate(30px, 20px) scale(1.1) }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) }
                    to { opacity: 1; transform: translateY(0) }
                }

                .shimmer-bar {
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    background: linear-gradient(90deg, #8b5cf6, #22d3ee, #8b5cf6);
                    background-size: 200%;
                    animation: shimmer 3s linear infinite;
                }

                @keyframes shimmer {
                    0% { background-position: 200% center }
                    100% { background-position: -200% center }
                }

                .avatar-section { display: flex; justify-content: center; margin-bottom: 24px; position: relative; }
                
                .bg-text {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    font-size: 4rem; font-weight: 900; color: rgba(255, 255, 255, 0.03);
                    white-space: nowrap; letter-spacing: 10px; pointer-events: none; z-index: 0;
                }

                .avatar-container {
                    width: 100px; height: 100px; border-radius: 50%;
                    background: linear-gradient(135deg, #8b5cf6, #22d3ee);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
                    position: relative; padding: 3px; z-index: 1;
                }
                
                .avatar-container::after {
                    content: ''; position: absolute; inset: -3px; border-radius: 50%;
                    background: linear-gradient(135deg, #8b5cf6, #22d3ee);
                    z-index: -1; animation: spin 4s linear infinite;
                }

                @keyframes spin { to { filter: hue-rotate(360deg) } }

                .avatar-inner {
                    width: 100%; height: 100%; border-radius: 50%;
                    background: #050505; display: flex; align-items: center;
                    justify-content: center; overflow: hidden; position: relative;
                }

                .avatar-inner img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

                @media (max-width: 768px) {
                    .avatar-container {
                        width: 60px !important;
                        height: 60px !important;
                    }
                    .bg-text {
                        font-size: 2rem !important;
                        letter-spacing: 5px !important;
                    }
                    .dev-name {
                        font-size: 1.2rem !important;
                    }
                    .dev-role {
                        font-size: 0.7rem !important;
                    }
                    .avatar-section {
                        margin-bottom: 12px !important;
                    }
                    .info-section {
                        margin-bottom: 12px !important;
                    }
                }

                .status-dot {
                    position: absolute; bottom: 4px; right: 4px;
                    width: 14px; height: 14px; background: #10b981;
                    border-radius: 50%; border: 2px solid #050505;
                    animation: pulse 2s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6) }
                    50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0) }
                }

                .info-section { text-align: center; margin-bottom: 24px; }
                .dev-name { font-size: 1.55rem; font-weight: 700; color: #fff; margin: 0 0 4px 0; text-align: center; }
                .dev-role { font-size: 0.85rem; font-weight: 500; color: #c4b5fd; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; text-align: center; }
                .dev-bio { font-size: 0.8rem; color: #7a7a9a; line-height: 1.6; margin-bottom: 0; text-align: center; }

                .dev-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(181, 106, 255, 0.2), transparent); margin-bottom: 24px; }

                .contact-list { display: flex; flex-direction: column; gap: 10px; }

                .dev-contact-btn {
                    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
                    border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.07);
                    background: rgba(255, 255, 255, 0.04); cursor: pointer;
                    transition: all 0.25s ease; text-decoration: none; position: relative; overflow: hidden;
                }
                .dev-contact-btn:hover {
                    border-color: rgba(181, 106, 255, 0.45); transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(181, 106, 255, 0.15);
                }
                .dev-contact-btn::before {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(135deg, rgba(181, 106, 255, 0.12), rgba(109, 242, 255, 0.06));
                    opacity: 0; transition: opacity 0.25s;
                }
                .dev-contact-btn:hover::before { opacity: 1; }

                .dev-btn-icon {
                    width: 36px; height: 36px; border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1rem; flex-shrink: 0;
                }
                .icon-email { background: rgba(181, 106, 255, 0.15); color: #d18cff }
                .icon-phone { background: rgba(109, 242, 255, 0.12); color: #6df2ff }
                .icon-github { background: rgba(255, 255, 255, 0.08); color: #e0e0f0 }

                .dev-btn-text { flex: 1; text-align: \${lang === 'ar' ? 'right' : 'left'}; }
                .dev-btn-label { display: block; font-size: 0.65rem; color: #6a6a8a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px }
                .dev-btn-value { display: block; font-size: 0.82rem; color: #d0d0e8; font-weight: 500 }
                .dev-btn-action { font-size: 0.7rem; color: #6a6a8a; opacity: 0; transition: opacity 0.25s; white-space: nowrap; flex-shrink: 0 }
                .dev-contact-btn:hover .dev-btn-action { opacity: 1; color: #b56aff }


                .dev-footer-text { margin-top: 12px; text-align: center; font-size: 0.65rem; color: #4a4a6a; letter-spacing: 0.5px; }

                body.rtl .dev-btn-text { text-align: right; }
                body.rtl .dev-contact-btn { flex-direction: row-reverse; }
                body.rtl .dev-btn-action { margin-right: auto; margin-left: 0; }
            `)
        )
    );
}

const root = ReactDOM.createRoot(document.getElementById('developer-card-root'));
root.render(e(DeveloperCard));
