import React, { useEffect, useRef } from 'react';

interface LandingPageProps {
    onNavigateToLogin: () => void;
    onNavigateToSignUp: () => void;
    onNavigateToTermsOfService: () => void;
    onNavigateToPrivacyPolicy: () => void;
    onNavigateToSecurity: () => void;
    onNavigateToContact: () => void;
    onNavigateToCareer: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToSignUp, onNavigateToTermsOfService, onNavigateToPrivacyPolicy, onNavigateToSecurity, onNavigateToContact, onNavigateToCareer }) => {
    
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1 }
        );

        const elements = document.querySelectorAll('.animate-on-scroll');
        elements.forEach((el) => {
            observer.observe(el);
        });

        const header = document.querySelector('header');
        const handleScroll = () => {
            if (header) {
                if (window.scrollY > 10) {
                    header.classList.add('border-border-light', 'dark:border-border-dark', 'shadow-md');
                    header.classList.remove('h-[72px]', 'bg-background-light/80', 'dark:bg-background-dark/80');
                    header.classList.add('h-[60px]', 'bg-background-light/95', 'dark:bg-background-dark/95');
                } else {
                    header.classList.remove('border-border-light', 'dark:border-border-dark', 'shadow-md');
                    header.classList.remove('h-[60px]', 'bg-background-light/95', 'dark:bg-background-dark/95');
                    header.classList.add('h-[72px]', 'bg-background-light/80', 'dark:bg-background-dark/80');
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        
        // Initial check in case page is already scrolled
        handleScroll();

        return () => {
            elements.forEach((el) => {
                if (el) {
                    observer.unobserve(el);
                }
            });
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleChoosePlan = () => {
        // In the landing page, we direct users to sign up first.
        // Payment will be handled inside the app once they are logged in.
        onNavigateToSignUp();
    };

    return (
        <div className="relative w-full overflow-x-hidden">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 w-full border-b border-border-light/0 dark:border-border-dark/0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md transition-all duration-300">
                <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4">
                    <a href="#" className="flex items-center gap-3" aria-label="Oratora Home">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                    </a>
                    <div className="hidden items-center gap-8 md:flex">
                        <a className="text-sm font-medium text-text-primary/80 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors" href="#features">Product</a>
                        <a className="text-sm font-medium text-text-primary/80 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors" href="#about">How it works</a>
                        <a className="text-sm font-medium text-text-primary/80 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors" href="#pricing">Pricing</a>
                        <a className="text-sm font-medium text-text-primary/80 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors" href="#faq">Resources</a>
                    </div>
                    <button onClick={onNavigateToSignUp} className="flex h-10 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green px-6 text-sm font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105">
                        <span className="truncate">Get Started</span>
                    </button>
                </div>
            </header>
            <main>
                {/* Hero Section */}
                <section className="relative">
                    <div className="absolute inset-0 z-[-1] opacity-5">
                        <video autoPlay className="h-full w-full object-cover" loop muted playsInline>
                            <source src="https://cdn.dribbble.com/userupload/12470198/file/original-b8555c82273b5b630263158e370a597a.mp4" type="video/mp4" />
                        </video>
                    </div>
                    <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-20">
                        <div className="flex items-center justify-center lg:order-last">
                            <div className="w-full max-w-md lg:max-w-none animate-float">
                                <img className="h-auto w-full object-contain" alt="A playful and friendly mascot character with a speech bubble, looking encouraging." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0nJAckBRNmJFNqlAqv5tNTcBi47GvgkXkJl5l6N2XemPTQRA8IhNddcxF2YrCLydSwyYYVkNO-3Txl0jl_JmQolR7tzgjihkHX5RHLe5t40xLwZp-S-3tois2kk5ZCEI0paVskx5CAPcEkH5yNZChvm_XSpsQbqtxoxOozq95vS_Ipz21u07aUKAWgjFrbOiXWqegc_CIcY_l3AHF0iDMCqYyGycSymt0n6JXLp85Kt3NECm0mcarUCtoxqkIllble7w1tlKDwWo" />
                            </div>
                        </div>
                        <div className="flex flex-col items-start text-left animate-fade-in-up">
                            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text-primary dark:text-white md:text-5xl lg:text-6xl">
                                Free. Fun. Effective. Speak Better. Sound Confident.
                            </h1>
                            <p className="mt-4 max-w-xl text-lg text-secondary-text-light dark:text-secondary-text-dark" style={{ animationDelay: '200ms' }}>
                                A playful, AI-powered coach that helps you practice, polish and deliver speeches — fast.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4" style={{ animationDelay: '400ms' }}>
                                <button onClick={onNavigateToSignUp} className="flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105">
                                    <span className="truncate">Get Started</span>
                                </button>
                                <button onClick={onNavigateToLogin} className="flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-border-light dark:border-border-dark bg-transparent px-8 font-bold text-text-primary dark:text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/10">
                                    <span className="truncate">I already have an account</span>
                                </button>
                            </div>
                            <p className="mt-8 text-sm font-medium text-secondary-text-light dark:text-secondary-text-dark" style={{ animationDelay: '600ms' }}>Used by students, Trusted by professionals, Loved by creators</p>
                        </div>
                    </div>
                </section>
                {/* Feature Section */}
                <section id="features" className="py-16 sm:py-24 animate-on-scroll">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">
                                A new, fun way to practice speaking
                            </h2>
                            <p className="mt-4 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                                Oratora helps you build confidence and deliver your message with impact, using playful exercises and instant feedback.
                            </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
                            <div className="flex flex-col gap-3 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-2 animate-on-scroll">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-3xl">timer</span>
                                </div>
                                <h3 className="font-display text-xl font-bold text-text-primary dark:text-white">Bite-size practice</h3>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark">Fit practice into your busy schedule with short, effective exercises you can do anytime.</p>
                            </div>
                            <div className="flex flex-col gap-3 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-playful_green/10 text-playful_green">
                                    <span className="material-symbols-outlined text-3xl">sentiment_satisfied</span>
                                </div>
                                <h3 className="font-display text-xl font-bold text-text-primary dark:text-white">Playful feedback</h3>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark">Get instant, AI-powered suggestions in a friendly, encouraging tone to improve your delivery.</p>
                            </div>
                            <div className="flex flex-col gap-3 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 text-center shadow-sm transition-transform duration-300 hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '400ms' }}>
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-mustard/10 text-mustard">
                                    <span className="material-symbols-outlined text-3xl">local_fire_department</span>
                                </div>
                                <h3 className="font-display text-xl font-bold text-text-primary dark:text-white">Track streaks &amp; confidence</h3>
                                <p className="text-secondary-text-light dark:text-secondary-text-dark">Build a consistent habit by maintaining your practice streak and watch your confidence score grow.</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* About Section */}
                <section id="about" className="bg-primary/5 dark:bg-primary/10 py-16 sm:py-24 animate-on-scroll">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
                            <div className="flex flex-col gap-6 animate-on-scroll">
                                <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">Why We're Here</h2>
                                <p className="text-lg leading-relaxed text-secondary-text-light dark:text-secondary-text-dark">Oratora was born from a simple idea: public speaking shouldn't be scary. We're here to make speech coaching accessible, enjoyable, and incredibly effective through playful practice and a supportive community.</p>
                                <div className="mt-4 grid grid-cols-1 gap-6">
                                    <div className="flex items-start gap-4 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                                        <span className="material-symbols-outlined mt-1 text-3xl text-primary">emoji_events</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-display text-lg font-semibold text-text-primary dark:text-white">Confidence Through Practice</h3>
                                            <p className="text-secondary-text-light dark:text-secondary-text-dark">Our platform provides a safe and structured environment to build your skills and find your voice.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 animate-on-scroll" style={{ transitionDelay: '400ms' }}>
                                        <span className="material-symbols-outlined mt-1 text-3xl text-primary">stadia_controller</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-display text-lg font-semibold text-text-primary dark:text-white">Playful Learning</h3>
                                            <p className="text-secondary-text-light dark:text-secondary-text-dark">Engage with fun, gamified exercises that make learning feel less like a chore and more like a game.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 animate-on-scroll" style={{ transitionDelay: '600ms' }}>
                                        <span className="material-symbols-outlined mt-1 text-3xl text-primary">groups</span>
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-display text-lg font-semibold text-text-primary dark:text-white">Supportive Community</h3>
                                            <p className="text-secondary-text-light dark:text-secondary-text-dark">Join a network of peers and mentors who are all on the same journey to become powerful communicators.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex w-full items-center justify-center animate-on-scroll">
                                <div className="aspect-[4/5] w-full max-w-md rounded-xl bg-cover bg-center bg-no-repeat" alt="Playful mascot characters cheering and supporting each other on their public speaking journey." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD5DPmWT3l_epUw-3iQWO-GFdkHkK0ayuKiZzPGtHrHqgVYWV-oE1aghS1uyQfzlFaXiKKfyKIKytA-wjity4-00gTYpYynS9bVNTsJM3AJ9rA12VwghOJf3eFHpgkol_hMGAJY9m227yCwuP89Pd84WuTL0HTiwCeCnd3u_W9PtawiaUhhc-vX6CiZVHZ_PkG49_9G8_C0v17BozFNZMthYwMRJ55cvyO2m4LS1972IYX3-pBacnVKMkDmNKSlbUmMaolz-VNrtxU')" }}></div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Pricing Section */}
                <section id="pricing" className="py-16 sm:py-24 animate-on-scroll">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">
                                Find the perfect plan
                            </h2>
                            <p className="mt-4 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                                Start for free, and unlock more powerful features as you grow. New users get a 3-week free trial of Premium!
                            </p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Free Plan */}
                            <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-on-scroll">
                                <h3 className="font-display text-2xl font-bold">Free</h3>
                                <p className="mt-2 text-secondary-text-light dark:text-secondary-text-dark">For getting started</p>
                                <p className="mt-6"><span className="font-display text-5xl font-extrabold">₦0</span><span className="text-secondary-text-light dark:text-secondary-text-dark">/month</span></p>
                                <ul className="mt-8 space-y-4 text-secondary-text-light dark:text-secondary-text-dark">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>2 AI analyses / month</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Audio analysis only</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Standard progress tracking</span></li>
                                </ul>
                                <button onClick={onNavigateToSignUp} className="mt-auto w-full h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-transparent font-bold text-primary transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/10">Sign up for free</button>
                            </div>
                            {/* Pro Plan (Most Popular) */}
                            <div className="relative flex flex-col rounded-lg border-2 border-primary bg-card-light dark:bg-card-dark p-8 shadow-2xl shadow-primary/20 transition-all duration-300 hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '200ms' }}>
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-mustard px-4 py-1 text-sm font-bold text-text-primary">Most Popular</div>
                                <div className="absolute inset-0 rounded-lg animate-pulse-border -z-10"></div>
                                <h3 className="font-display text-2xl font-bold">Pro</h3>
                                <p className="mt-2 text-secondary-text-light dark:text-secondary-text-dark">For individuals ready to excel</p>
                                <p className="mt-6"><span className="font-display text-5xl font-extrabold">₦2,500</span><span className="text-secondary-text-light dark:text-secondary-text-dark">/month</span></p>
                                <ul className="mt-8 space-y-4 text-secondary-text-light dark:text-secondary-text-dark">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Unlimited AI analyses</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Audio & Video analysis</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Live practice sessions</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Advanced feedback metrics</span></li>
                                </ul>
                                <button onClick={handleChoosePlan} className="mt-auto w-full h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105">Choose Plan</button>
                            </div>
                            {/* Premium Plan */}
                            <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 animate-on-scroll" style={{ transitionDelay: '400ms' }}>
                                <h3 className="font-display text-2xl font-bold">Premium</h3>
                                <p className="mt-2 text-secondary-text-light dark:text-secondary-text-dark">For power users &amp; teams</p>
                                <p className="mt-6"><span className="font-display text-5xl font-extrabold">₦3,500</span><span className="text-secondary-text-light dark:text-secondary-text-dark">/month</span></p>
                                <ul className="mt-8 space-y-4 text-secondary-text-light dark:text-secondary-text-dark">
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>All Pro features</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Personalized action plans</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Priority AI processing</span></li>
                                    <li className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span><span>Priority support</span></li>
                                </ul>
                                <button onClick={handleChoosePlan} className="mt-auto w-full h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-primary bg-transparent font-bold text-primary transition-all duration-200 ease-in-out hover:scale-105 hover:bg-primary/10">Choose Plan</button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* FAQ Section */}
                <section id="faq" className="py-16 sm:py-24 bg-primary/5 dark:bg-primary/10 animate-on-scroll">
                    <div className="mx-auto max-w-6xl px-4">
                        <div className="mx-auto max-w-3xl text-center">
                            <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">Frequently Asked Questions</h2>
                            <p className="mt-4 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                                Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
                            </p>
                        </div>
                        <div className="mt-16 max-w-3xl mx-auto space-y-4">
                            <details className="group rounded-lg bg-card-light dark:bg-card-dark p-6 border border-border-light dark:border-border-dark shadow-sm">
                                <summary className="flex cursor-pointer items-center justify-between font-semibold text-text-primary dark:text-white list-none">
                                    How does the AI analysis work?
                                    <span className="material-symbols-outlined text-secondary-text-light dark:text-secondary-text-dark transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="overflow-hidden transition-all duration-500 max-h-0 group-open:max-h-screen">
                                    <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">Oratora uses advanced machine learning models trained on vast datasets of speeches. It analyzes your audio for vocal patterns (pacing, tone, fillers) and your video for visual cues (gestures, posture, eye contact) to provide comprehensive, data-driven feedback.</p>
                                </div>
                            </details>
                            <details className="group rounded-lg bg-card-light dark:bg-card-dark p-6 border border-border-light dark:border-border-dark shadow-sm">
                                <summary className="flex cursor-pointer items-center justify-between font-semibold text-text-primary dark:text-white list-none">
                                    Is my data private and secure?
                                    <span className="material-symbols-outlined text-secondary-text-light dark:text-secondary-text-dark transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="overflow-hidden transition-all duration-500 max-h-0 group-open:max-h-screen">
                                    <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">Absolutely. Your privacy is our top priority. All uploaded speeches are encrypted and processed securely on Google Cloud. We never share your data or use it for any purpose other than providing you with personalized feedback.</p>
                                </div>
                            </details>
                            <details className="group rounded-lg bg-card-light dark:bg-card-dark p-6 border border-border-light dark:border-border-dark shadow-sm">
                                <summary className="flex cursor-pointer items-center justify-between font-semibold text-text-primary dark:text-white list-none">
                                    What kind of equipment do I need?
                                    <span className="material-symbols-outlined text-secondary-text-light dark:text-secondary-text-dark transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="overflow-hidden transition-all duration-500 max-h-0 group-open:max-h-screen">
                                    <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">All you need is a computer or smartphone with a modern web browser, a microphone, and a webcam (for video analysis). No special software or hardware is required to get started.</p>
                                </div>
                            </details>
                            <details className="group rounded-lg bg-card-light dark:bg-card-dark p-6 border border-border-light dark:border-border-dark shadow-sm">
                                <summary className="flex cursor-pointer items-center justify-between font-semibold text-text-primary dark:text-white list-none">
                                    Can I cancel my subscription anytime?
                                    <span className="material-symbols-outlined text-secondary-text-light dark:text-secondary-text-dark transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="overflow-hidden transition-all duration-500 max-h-0 group-open:max-h-screen">
                                    <p className="mt-4 text-secondary-text-light dark:text-secondary-text-dark">Yes, you can cancel your Pro subscription at any time from your account settings. You will retain access to Pro features until the end of your current billing period, and you won't be charged again.</p>
                                </div>
                            </details>
                        </div>
                    </div>
                </section>
            </main>
            {/* Footer */}
            <footer className="border-t border-border-light dark:border-border-dark bg-background-light dark:bg-card-dark">
                <div className="mx-auto max-w-6xl px-4 py-16">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                        <div>
                            <a href="#" className="flex items-center gap-3" aria-label="Oratora Home">
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                                    <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                                    <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                    <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                </svg>
                                <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                            </a>
                            <p className="mt-4 text-sm text-secondary-text-light dark:text-secondary-text-dark">A playful, AI-powered coach that helps you practice, polish and deliver speeches — fast.</p>
                            <form className="mt-6">
                                <label className="block font-medium text-text-primary dark:text-white mb-2" htmlFor="footer-email">Stay up to date</label>
                                <div className="flex gap-2">
                                    <input className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark focus:border-primary focus:ring-primary" id="footer-email" placeholder="Enter your email" type="email" />
                                    <button className="flex-shrink-0 rounded-lg bg-primary px-4 text-white hover:bg-primary/90">Subscribe</button>
                                </div>
                            </form>
                        </div>
                        <div className="grid grid-cols-2 gap-8 lg:col-span-2 sm:grid-cols-3">
                            <div>
                                <p className="font-display font-semibold text-text-primary dark:text-white">Product</p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#features">Features</a></li>
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#pricing">Pricing</a></li>
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#about">How it works</a></li>
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#faq">Resources</a></li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-display font-semibold text-text-primary dark:text-white">Company</p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#">About Us</a></li>
                                    <li><a className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors" href="#">Blog</a></li>
                                    <li><a onClick={onNavigateToCareer} className="cursor-pointer text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">Careers</a></li>
                                    <li><a onClick={onNavigateToContact} className="cursor-pointer text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">Contact</a></li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-display font-semibold text-text-primary dark:text-white">Legal</p>
                                <ul className="mt-4 space-y-2 text-sm">
                                    <li><a onClick={onNavigateToTermsOfService} className="cursor-pointer text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">Terms of Service</a></li>
                                    <li><a onClick={onNavigateToPrivacyPolicy} className="cursor-pointer text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">Privacy Policy</a></li>
                                    <li><a onClick={onNavigateToSecurity} className="cursor-pointer text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">Security</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-border-light dark:border-border-dark pt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
                        <p className="text-sm text-secondary-text-light dark:text-secondary-text-dark">© 2024 Oratora. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
                            </a>
                            <a href="#" className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                            </a>
                            <a href="#" className="text-secondary-text-light dark:text-secondary-text-dark hover:text-primary dark:hover:text-primary transition-colors">
                                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zM8.339 18.337H5.667v-8.59h2.672v8.59zM7.003 8.574a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096zm11.335 9.763h-2.669V14.16c0-.996-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.206v4.248h-2.667v-8.59h2.56v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.71z"></path></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;