

import React, { useState, useEffect, useRef } from 'react';
import { User, AnalysisReport, UserSubscription } from '../types';
import { calculateStreak, calculateLevelAndXP, calculateAchievements } from './lib/gamification';

type ActivePage = 'dashboard' | 'history' | 'goals' | 'progress' | 'resources' | 'profile' | 'settings' | 'components' | 'billing' | 'referral';

interface MainLayoutProps {
    user: User | null;
    history: AnalysisReport[];
    subscription: UserSubscription | null;
    activePage: ActivePage;
    onLogout?: () => void;
    onNavigateToDashboard: () => void;
    onNavigateToHistory: () => void;
    onNavigateToGoals: () => void;
    onNavigateToProgress: () => void;
    onNavigateToResources: () => void;
    onNavigateToProfile: () => void;
    onNavigateToSettings: () => void;
    onNavigateToBilling: () => void;
    onNavigateToReferral: () => void;
    onNavigateToTermsOfService: () => void;
    onNavigateToPrivacyPolicy: () => void;
    onNavigateToSecurity: () => void;
    onNavigateToContact: () => void;
    onNavigateToCareer: () => void;
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
    user, 
    history,
    subscription,
    activePage, 
    onLogout, 
    onNavigateToDashboard,
    onNavigateToHistory,
    onNavigateToGoals, 
    onNavigateToProgress,
    onNavigateToResources,
    onNavigateToProfile,
    onNavigateToSettings,
    onNavigateToBilling,
    onNavigateToReferral,
    onNavigateToTermsOfService,
    onNavigateToPrivacyPolicy,
    onNavigateToSecurity,
    onNavigateToContact,
    onNavigateToCareer,
    children 
}) => {
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const streak = calculateStreak(history);
    const achievements = calculateAchievements(history);
    const { totalXp } = calculateLevelAndXP(history, achievements);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', action: onNavigateToDashboard, icon: 'dashboard' },
        { id: 'history', label: 'History', action: onNavigateToHistory, icon: 'history' },
        { id: 'progress', label: 'Progress', action: onNavigateToProgress, icon: 'trending_up' },
        { id: 'goals', label: 'Goals', action: onNavigateToGoals, icon: 'flag' },
        { id: 'resources', label: 'Resources', action: onNavigateToResources, icon: 'school' },
    ];
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const SubscriptionStatusBanner = () => {
        const [timeLeft, setTimeLeft] = useState('');
        const [isWarning, setIsWarning] = useState(false);

        useEffect(() => {
            if (!subscription) {
                setTimeLeft('');
                return;
            }

            const getBannerMessage = () => {
                const now = new Date();
                
                if (subscription.status === 'trialing' && subscription.trialEndsAt) {
                    const endDate = new Date(subscription.trialEndsAt);
                    const diff = endDate.getTime() - now.getTime();

                    if (diff <= 0) {
                        setIsWarning(true);
                        return 'Your Premium trial has expired.';
                    }

                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                    setIsWarning(days < 1); // Set warning if less than a day is left

                    if (days > 0) {
                        return `Your Premium trial ends in ${days} ${days === 1 ? 'day' : 'days'} and ${hours} ${hours === 1 ? 'hour' : 'hours'}.`;
                    }
                    if (hours > 0) {
                        return `Your Premium trial ends in ${hours} ${hours === 1 ? 'hour' : 'hours'} and ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
                    }
                    if (minutes > 0) {
                        return `Your Premium trial ends in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} and ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
                    }
                    return `Your Premium trial ends in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
                } 
                else if (subscription.plan !== 'free' && subscription.status === 'active' && subscription.periodEndsAt) {
                    const endDate = new Date(subscription.periodEndsAt);
                    const diff = endDate.getTime() - now.getTime();

                    if (diff > 0) {
                        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        if (daysLeft <= 7) {
                           setIsWarning(daysLeft <= 3);
                           return `Your ${subscription.plan} plan renews in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}.`;
                        }
                    } else {
                        setIsWarning(true);
                        return `Your ${subscription.plan} plan may have expired.`;
                    }
                }
                else if (subscription.status === 'past_due') {
                    setIsWarning(true);
                    return 'Your payment is past due. Please update your payment method.';
                }
                
                return '';
            };

            const initialMessage = getBannerMessage();
            if (initialMessage) {
                setTimeLeft(initialMessage);
            } else {
                setTimeLeft('');
                return;
            }
            
            // Update every second for a live countdown
            const timer = setInterval(() => {
                const newMessage = getBannerMessage();
                if (newMessage) {
                    setTimeLeft(newMessage);
                } else {
                    setTimeLeft('');
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        }, [subscription]);

        if (!timeLeft) {
            return null;
        }

        const bannerClass = isWarning ? 'bg-mustard text-black' : 'bg-primary/20 text-primary dark:text-primary';
        const buttonClass = isWarning ? 'hover:text-slate-700' : 'hover:text-teal-700 dark:hover:text-teal-200';

        return (
            <div className={`${bannerClass} text-center text-sm font-semibold py-1.5 px-4 transition-colors duration-300`}>
                {timeLeft}
                <button onClick={onNavigateToBilling} className={`ml-2 font-bold underline ${buttonClass}`}>
                    {subscription?.status === 'trialing' || subscription?.status === 'past_due' ? 'Upgrade Now' : 'Manage Subscription'}
                </button>
            </div>
        );
    };

    return (
        <div className="group/design-root flex min-h-screen w-full flex-col">
            <header className="sticky top-0 z-30 w-full border-b border-border-light dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
                <SubscriptionStatusBanner />
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-10">
                    <a href="#" className="flex items-center gap-3" aria-label="Oratora Home">
                        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                            <path d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                            <path d="M16 24C19.9298 24 23.141 21.412 24 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            <path d="M16 20C17.5752 20 18.9664 19.1411 19.6085 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                        <span className="font-heading text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Oratora</span>
                    </a>
                    <nav className="hidden h-full items-center gap-2 lg:flex">
                        {navItems.map(item => (
                            <a key={item.id} onClick={item.action} className={`flex h-full cursor-pointer items-center border-b-4 px-4 transition-all duration-200 ${activePage === item.id ? 'border-primary bg-primary/10' : 'border-transparent text-text-secondary-light hover:text-text-primary-light dark:text-text-secondary-dark dark:hover:text-text-primary-dark hover:bg-primary/5'}`}>
                                <p className={`font-heading font-bold ${activePage === item.id ? 'text-teal-600 dark:text-teal-300' : ''}`}>{item.label}</p>
                            </a>
                        ))}
                    </nav>
                    <div className="hidden items-center gap-4 sm:flex">
                        {subscription?.plan === 'free' && subscription.status !== 'trialing' && (
                           <button onClick={onNavigateToBilling} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary/90 transition-colors">Upgrade</button>
                        )}
                        <div className="flex items-center gap-2 rounded-full border border-orange-400 bg-orange-100 px-3 py-1.5 text-orange-600 dark:border-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
                            <span className="material-symbols-outlined !text-base">local_fire_department</span>
                            <p className="text-sm font-bold">{streak}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-full border border-blue-400 bg-blue-100 px-3 py-1.5 text-blue-600 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                            <span className="material-symbols-outlined !text-base">workspace_premium</span>
                            <p className="text-sm font-bold">{totalXp.toLocaleString()}</p>
                        </div>
                        <div className="relative" ref={menuRef}>
                            <div onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} className="aspect-square size-12 rounded-full bg-cover bg-center cursor-pointer ring-2 ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark ring-transparent hover:ring-primary transition-all" style={{backgroundImage: `url(${user?.avatarUrl})`}} />
                             {isProfileMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark animate-fade-in-up-small z-20 overflow-hidden">
                                    <div className="p-4 border-b border-border-light dark:border-border-dark">
                                        <p className="font-semibold text-sm truncate text-text-light dark:text-text-dark">{user?.name}</p>
                                        <p className="text-xs truncate text-text-muted-light dark:text-text-muted-dark">{user?.email}</p>
                                    </div>
                                    <div className="py-2">
                                        <a onClick={() => { onNavigateToProfile(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">person</span> Profile
                                        </a>
                                        <a onClick={() => { onNavigateToBilling(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">credit_card</span> Billing
                                        </a>
                                        <a onClick={() => { onNavigateToReferral(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">redeem</span> Refer & Earn
                                        </a>
                                        <a onClick={() => { onNavigateToSettings(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">settings</span> Settings
                                        </a>
                                        <a onClick={() => { onNavigateToCareer(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">business_center</span> Careers
                                        </a>
                                        <a onClick={() => { onNavigateToContact(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">contact_support</span> Contact
                                        </a>
                                        <div className="h-px bg-border-light dark:bg-border-dark my-1"></div>
                                        <a onClick={() => { onNavigateToTermsOfService(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">gavel</span> Terms of Service
                                        </a>
                                        <a onClick={() => { onNavigateToPrivacyPolicy(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">privacy_tip</span> Privacy Policy
                                        </a>
                                        <a onClick={() => { onNavigateToSecurity(); setProfileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer">
                                            <span className="material-symbols-outlined text-base">security</span> Security
                                        </a>
                                    </div>
                                    <div className="h-px bg-border-light dark:bg-border-dark"></div>
                                    <div className="p-2">
                                        <a onClick={onLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer rounded-md">
                                            <span className="material-symbols-outlined text-base">logout</span> Logout
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                     {/* Hamburger for mobile */}
                    <div className="lg:hidden" ref={menuRef}>
                        <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                         {isMobileMenuOpen && (
                            <div className="absolute top-full right-4 mt-2 w-64 bg-card-light dark:bg-card-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark animate-fade-in-up-small z-20 p-2">
                                {navItems.map(item => (
                                     <a key={item.id} onClick={() => { item.action(); setMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 text-sm rounded-lg cursor-pointer ${activePage === item.id ? 'bg-primary/10 text-primary font-bold' : 'text-text-light dark:text-text-dark'}`}>
                                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                                        {item.label}
                                    </a>
                                ))}
                                <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                                 <a onClick={() => { onNavigateToProfile(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">person</span> Profile
                                </a>
                                 <a onClick={() => { onNavigateToBilling(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">credit_card</span> Billing
                                </a>
                                <a onClick={() => { onNavigateToReferral(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">redeem</span> Refer & Earn
                                </a>
                                <a onClick={() => { onNavigateToSettings(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">settings</span> Settings
                                </a>
                                 <a onClick={() => { onNavigateToCareer(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">business_center</span> Careers
                                </a>
                                <a onClick={() => { onNavigateToContact(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">contact_support</span> Contact
                                </a>
                                <div className="h-px bg-border-light dark:bg-border-dark my-2"></div>
                                <a onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer rounded-lg">
                                    <span className="material-symbols-outlined text-base">logout</span> Logout
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-10">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;