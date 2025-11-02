

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isGeminiConfigured, toCamelCase, toSnakeCase } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import Dashboard from './components/Dashboard';
import ContextSelectionPage from './components/ContextSelectionPage';
import UploadPage from './components/UploadPage';
import ProcessingPage from './components/ProcessingPage';
import { User, AnalysisContext, AnalysisReport, UserGoals, Achievement, OnboardingData, TrackableGoal, UserSubscription, SubscriptionPlan, SpeakingContextType } from './types';
import LivePracticeSetupPage from './components/LivePracticeSetupPage';
import LivePracticeSessionPage from './components/LivePracticeSessionPage';
import AnalysisResultPage from './components/AnalysisResultPage';
import MainLayout from './components/MainLayout';
import HistoryPage from './components/HistoryPage';
import GoalsPage from './components/GoalsPage';
import CoursesPage from './components/CoursesPage';
import ProgressPage from './components/ProgressPage';
import ResourcesPage from './components/ResourcesPage';
import AchievementModal from './components/AchievementModal';
import { calculateAchievements, XP_MAP, calculateLevelAndXP, processGoalsWithNewReport } from './components/lib/gamification';
import Toast from './components/Toast';
import ResourceArticlePage from './components/ResourceArticlePage';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import ComponentsPage from './components/ComponentsPage';
import LandingPage from './components/LandingPage';
import BillingPage from './components/BillingPage';
import TermsOfServicePage from './components/TermsOfServicePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import SecurityPage from './components/SecurityPage';
import ContactPage from './components/ContactPage';
import CareerPage from './components/CareerPage';
import { sendEmailNotification, generateGoalCompletionEmail } from './components/lib/email';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import PaymentFailedPage from './components/PaymentFailedPage';
import ErrorPage from './components/ErrorPage';
import SupportButton from './components/SupportButton';
import ReferralPage from './components/ReferralPage';


type Page = 
    | 'landing'
    | 'login' 
    | 'signup' 
    | 'forgotPassword' 
    | 'onboarding' 
    | 'dashboard'
    | 'history'
    | 'goals'
    | 'courses'
    | 'progress'
    | 'resources'
    | 'resourceArticle'
    | 'profile'
    | 'settings'
    | 'components'
    | 'billing'
    | 'referral'
    | 'termsOfService'
    | 'privacyPolicy'
    | 'security'
    | 'contact'
    | 'career'
    | 'newAnalysis' // Represents the start of a pre-recorded analysis flow
    | 'livePractice' // Represents the start of a live practice flow
    | 'contextSelection'
    | 'upload'
    | 'processing'
    | 'analysisResult'
    | 'livePracticeSetup'
    | 'livePracticeSession'
    | 'paymentSuccess'
    | 'paymentFailed'
    | 'error';

const defaultUserGoals: UserGoals = {
    primaryGoals: ['Improve Confidence', 'Manage Pace'],
    targetMetrics: {
        pacingWPM: { enabled: true, value: 150 },
        fillerWordsPerMinute: { enabled: true, value: 2 },
        clarityScore: { enabled: false, value: 90 },
    },
    practiceCommitment: {
        sessionsPerWeek: 3,
    },
};


const App: React.FC = () => {
    // Auth and User Data State
    const [user, setUser] = useState<User | null>(null);
    const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisReport[]>([]);
    const [userGoals, setUserGoals] = useState<UserGoals>(defaultUserGoals);
    const [trackableGoals, setTrackableGoals] = useState<TrackableGoal[]>([]);
    
    // UI and Transient State
    const [page, setPage] = useState<Page>('landing');
    const [isLoading, setIsLoading] = useState(true);
    const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
    const [mediaForAnalysis, setMediaForAnalysis] = useState<Blob | File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisReport | null>(null);
    const [livePracticeTopic, setLivePracticeTopic] = useState<string>('');
    const [initialLiveTopic, setInitialLiveTopic] = useState<string>('');
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [appError, setAppError] = useState<{ title: string; message: string } | null>(null);
    const [liveSessionSummary, setLiveSessionSummary] = useState<{ duration: number; feedback: string[]; fillerWords: Map<string, number>; avgWpm: number; } | null>(null);
    const [lastSessionGains, setLastSessionGains] = useState<{ xp: number; newAchievements: Achievement[] } | null>(null);
    const [selectedResource, setSelectedResource] = useState<string | null>(null);
    const [showAchievementModal, setShowAchievementModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<{ reference: string; plan: SubscriptionPlan; amount: number; } | null>(null);
    
    const initialAuthCheckCompleted = useRef(false);

    // --- Data Fetching and Auth Listener ---
    useEffect(() => {
        // Handle referral codes on initial load
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get('ref');
            if (refCode) {
                localStorage.setItem('oratora_ref_code', refCode);
                // Clean the URL so the ref code isn't visible after load
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.warn("Could not process referral URL parameter.", e);
        }

        // A single, robust function to process a session, whether it's the initial one or from a state change.
        const processSession = async (session: Session | null) => {
            if (!session?.user) {
                setUser(null);
                setUserSubscription(null);
                setAnalysisHistory([]);
                setUserGoals(defaultUserGoals);
                setTrackableGoals([]);
                setPage('landing');
                setIsLoading(false);
                initialAuthCheckCompleted.current = true;
                return;
            }

            try {
                // The RPC is the preferred, efficient path.
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_initial_user_data', { p_user_id: session.user.id });
                
                let initialData;

                if (!rpcError && rpcData?.profile) {
                    // Happy path: RPC succeeded and returned a profile.
                    initialData = rpcData;
                } else {
                    // Fallback path: RPC failed or (more likely) the user's profile wasn't ready yet (race condition).
                    // We will now retry fetching the profile with a delay, but we will NOT attempt to create it from the client.
                    if (rpcError) console.warn("RPC failed, falling back to individual fetches.", rpcError);

                    let profileData: any = null;
                    // Retry fetching the profile up to 5 times with increasing delay.
                    // This gives the database trigger time to run after sign-up.
                    for (let i = 0; i < 5; i++) {
                        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                        if (data) {
                            profileData = data;
                            break; // Success!
                        }
                        if (error && error.code !== 'PGRST116') { // 'PGRST116' is "No rows found"
                            throw error; // A different, unexpected DB error occurred.
                        }
                        // Wait and retry
                        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                    }

                    if (!profileData) {
                        // If the profile is still not found after multiple retries, it's a critical issue.
                        throw new Error("User profile could not be found after several attempts. The user record might be incomplete or the creation trigger may have failed.");
                    }

                    // Since RPC failed, we fetch the rest of the data individually.
                    const [subscriptionRes, historyRes, goalsRes, trackableGoalsRes] = await Promise.all([
                        supabase.from('subscriptions').select('*').eq('id', session.user.id).single(),
                        supabase.from('analysis_reports').select('report').eq('user_id', session.user.id).order('created_at', { ascending: false }),
                        supabase.from('user_goals').select('goals').eq('user_id', session.user.id).single(),
                        supabase.from('trackable_goals').select('*').eq('user_id', session.user.id).order('created_at')
                    ]);
                    
                    // Error handling for individual fetches (log but don't fail the whole process if possible)
                    if (subscriptionRes.error && subscriptionRes.error.code !== 'PGRST116') console.error("Error fetching subscription:", subscriptionRes.error);
                    if (historyRes.error) console.error("Error fetching history:", historyRes.error);
                    if (goalsRes.error && goalsRes.error.code !== 'PGRST116') console.error("Error fetching user goals:", goalsRes.error);
                    if (trackableGoalsRes.error) console.error("Error fetching trackable goals:", trackableGoalsRes.error);

                    initialData = {
                        profile: profileData,
                        subscription: subscriptionRes.data,
                        analysis_history: historyRes.data ? historyRes.data.map(h => h.report) : [],
                        user_goals: goalsRes.data ? (goalsRes.data as any).goals : null,
                        trackable_goals: trackableGoalsRes.data,
                    };
                }
                
                if (!initialData.profile) {
                     throw new Error("User profile is missing after initial data fetch.");
                }

                const { 
                    profile, 
                    subscription: sub, 
                    analysisHistory: history,
                    userGoals: goals, 
                    trackableGoals: trackable 
                } = toCamelCase<any>(initialData);

                setUser(profile);
                setUserSubscription(sub);
                setAnalysisHistory(history || []);
                setUserGoals(goals || defaultUserGoals);
                setTrackableGoals(trackable || []);
                
                if (!profile.onboardingCompleted) {
                    setPage('onboarding');
                } else {
                    setPage('dashboard');
                }

            } catch (error) {
                console.error("Critical error during user session processing:", error);
                setAppError({ title: "Failed to load your profile", message: (error as Error).message });
                setPage('error');
            } finally {
                setIsLoading(false);
                initialAuthCheckCompleted.current = true;
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // After initial load, any auth change (login, logout) will trigger this.
            if (initialAuthCheckCompleted.current) {
                await processSession(session);
            }
        });

        // Initial check on component mount.
        supabase.auth.getSession().then(({ data: { session } }) => {
            processSession(session);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // --- Navigation and Flow Handlers ---
    const navigateTo = (p: Page) => setPage(p);
    
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The onAuthStateChange listener will handle resetting state and navigating to 'landing'.
    };

    const handleUpdateUser = useCallback(async (updates: Partial<User>) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            setToast({ message: 'You must be logged in to update your profile.', type: 'error' });
            return;
        }
    
        const { error } = await supabase.from('profiles').update(toSnakeCase(updates)).eq('id', session.user.id);
    
        if (error) {
            setToast({ message: `Failed to update profile: ${error.message}`, type: 'error' });
        } else {
            setUser(prevUser => (prevUser ? { ...prevUser, ...updates } : null));
            // Only show toast for user-initiated updates, not silent background ones.
            if (!('referralCode' in updates && Object.keys(updates).length === 1)) {
                setToast({ message: 'Profile updated successfully!', type: 'success' });
            }
        }
    }, [setToast]);

    const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
        if (!user) return;
        setIsLoading(true);
        try {
            const updates: Partial<User> & { onboardingCompleted: boolean } = {
                name: data.name,
                onboardingCompleted: true,
            };

            if (data.profilePicture) {
                const fileExt = data.profilePicture.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, data.profilePicture);
                if (uploadError) throw uploadError;
                
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                updates.avatarUrl = urlData.publicUrl;
            }
            
            await handleUpdateUser(updates);

            if (data.baselineRecording) {
                setMediaForAnalysis(data.baselineRecording);
                setAnalysisContext({
                    category: data.selectedContext || 'Personal',
                    name: 'Onboarding Baseline',
                    audienceSize: 1,
                    formality: 'Casual',
                    duration: 30,
                    goals: data.speakingGoals,
                });
                navigateTo('processing');
            } else {
                navigateTo('dashboard');
            }

        } catch (error) {
            console.error("Onboarding completion error:", error);
            setToast({ message: "Failed to save onboarding data.", type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [user, handleUpdateUser, setToast]);
    
    const handleAnalysisComplete = useCallback(async (report: AnalysisReport) => {
        if (!user) return;

        const { error } = await supabase.from('analysis_reports').insert({ user_id: user.id, report });
        if (error) {
            setToast({ message: `Failed to save your report: ${error.message}`, type: 'error' });
        }

        const newHistory = [report, ...analysisHistory];
        setAnalysisHistory(newHistory);
        setAnalysisResult(report);

        const oldAchievements = calculateAchievements(analysisHistory);
        const newAchievements = calculateAchievements(newHistory);
        const newlyUnlocked = newAchievements.filter((ach, i) => ach.unlocked && !oldAchievements[i].unlocked);
        
        const { updatedGoals, newlyCompleted } = processGoalsWithNewReport(trackableGoals, report);
        // Here you would save updatedGoals to the database
        setTrackableGoals(updatedGoals);

        for (const goal of newlyCompleted) {
            setToast({ message: `Goal Completed: ${goal.title}!`, type: 'success' });
            // Fix: Added 'to' property to email options to match EmailOptions type.
            if (user.email) sendEmailNotification({ to: user.email, ...generateGoalCompletionEmail(user, goal) });
        }
        
        const xpFromReport = Math.round(report.overallScore);
        const xpFromAchievements = newlyUnlocked.reduce((sum, ach) => sum + (XP_MAP[ach.id] || 0), 0);
        
        setLastSessionGains({ xp: xpFromReport + xpFromAchievements, newAchievements: newlyUnlocked });

        if (analysisHistory.length === 0 && newHistory.length > 0) {
            setShowAchievementModal(true);
        }

        navigateTo('analysisResult');
    }, [user, analysisHistory, trackableGoals, setToast]);
    
    const handleSubscriptionUpdate = useCallback(async (newPlan: SubscriptionPlan) => {
        if (!user) return;
        setToast({ message: 'Updating your subscription...', type: 'info' });
        
        const endsAt = new Date();
        endsAt.setMonth(endsAt.getMonth() + 1);

        const newSubscription: UserSubscription = {
            plan: newPlan,
            status: 'active',
            periodEndsAt: newPlan === 'free' ? null : endsAt.toISOString(),
            trialEndsAt: null
        };
        
        const { error } = await supabase.from('subscriptions').upsert(toSnakeCase({ id: user.id, ...newSubscription }));

        if(error) {
            setToast({ message: `Failed to update subscription: ${error.message}`, type: 'error' });
        } else {
            setUserSubscription(newSubscription);
            setToast({ message: `Subscription updated to ${newPlan}!`, type: 'success' });
        }
    }, [user, setToast]);

    const handleVerifyPayment = useCallback(async () => {
        if (!user || !paymentInfo) {
            navigateTo('paymentFailed');
            return;
        }
        
        const { error: paymentError } = await supabase.from('payments').insert(toSnakeCase({
            userId: user.id,
            plan: paymentInfo.plan,
            amount: paymentInfo.amount,
            status: 'Paid',
            providerReference: paymentInfo.reference,
        }));
        
        if (paymentError) {
            setToast({ message: 'Error recording payment, but we will upgrade your plan.', type: 'error' });
        }

        await handleSubscriptionUpdate(paymentInfo.plan);
        setToast({ message: 'Payment verified and plan upgraded!', type: 'success' });
        navigateTo('dashboard');

    }, [user, paymentInfo, handleSubscriptionUpdate, setToast]);

    // --- RENDER LOGIC ---
    if (isLoading && !initialAuthCheckCompleted.current) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (appError) {
        return <ErrorPage title={appError.title} message={appError.message} />;
    }

    const renderPage = () => {
        if (!user) {
            switch (page) {
                case 'signup': return <SignUpPage onNavigateToLogin={() => navigateTo('login')} />;
                case 'forgotPassword': return <ForgotPasswordPage onNavigateToLogin={() => navigateTo('login')} setToast={setToast} />;
                case 'termsOfService': return <TermsOfServicePage onBack={() => navigateTo('landing')} />;
                case 'privacyPolicy': return <PrivacyPolicyPage onBack={() => navigateTo('landing')} />;
                case 'security': return <SecurityPage onBack={() => navigateTo('landing')} />;
                case 'contact': return <ContactPage onBack={() => navigateTo('landing')} />;
                case 'career': return <CareerPage onBack={() => navigateTo('landing')} />;
                case 'login': return <LoginPage onNavigateToSignUp={() => navigateTo('signup')} onNavigateToForgotPassword={() => navigateTo('forgotPassword')} />;
                case 'landing': default: return <LandingPage onNavigateToLogin={() => navigateTo('login')} onNavigateToSignUp={() => navigateTo('signup')} onNavigateToTermsOfService={() => navigateTo('termsOfService')} onNavigateToPrivacyPolicy={() => navigateTo('privacyPolicy')} onNavigateToSecurity={() => navigateTo('security')} onNavigateToContact={() => navigateTo('contact')} onNavigateToCareer={() => navigateTo('career')} />;
            }
        }
        
        if (page === 'onboarding') {
            return <OnboardingFlow user={user} onOnboardingComplete={handleOnboardingComplete} />;
        }
        
        const AppOverlays = () => (
            <>
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                {showAchievementModal && <AchievementModal isOpen={showAchievementModal} onClose={() => setShowAchievementModal(false)} onNavigateToProgress={() => navigateTo('progress')} />}
                <SupportButton />
            </>
        );

        switch(page) {
            case 'contextSelection': return <><ContextSelectionPage onBackToDashboard={() => navigateTo('dashboard')} onContextSelected={(ctx) => { setAnalysisContext(ctx); navigateTo('upload'); }} /><AppOverlays/></>;
            case 'upload': return <><UploadPage context={analysisContext} onBack={() => navigateTo('contextSelection')} onAnalysisStart={(media) => { setMediaForAnalysis(media); navigateTo('processing'); }} onNavigateToLivePractice={() => navigateTo('livePracticeSetup')} /><AppOverlays/></>;
            case 'processing': return <ProcessingPage media={mediaForAnalysis} context={analysisContext} history={analysisHistory} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={(err) => { setAnalysisError(err); }} onRetry={() => { setAnalysisError(null); navigateTo('processing'); }} onBackToUpload={() => navigateTo('upload')} error={analysisError} />;
            case 'analysisResult': return <><AnalysisResultPage user={user} report={analysisResult} media={mediaForAnalysis} sessionGains={lastSessionGains} onBackToDashboard={() => navigateTo('dashboard')} onNavigateToNewAnalysis={() => navigateTo('contextSelection')} onNavigateToLivePracticeSetup={() => navigateTo('livePracticeSetup')} onNavigateToProgress={() => navigateTo('progress')} /><AppOverlays/></>;
            case 'livePracticeSetup': return <><LivePracticeSetupPage onBackToDashboard={() => navigateTo('dashboard')} onStartSession={(topic) => { setLivePracticeTopic(topic); navigateTo('livePracticeSession'); }} initialTopic={initialLiveTopic} /><AppOverlays/></>;
            case 'livePracticeSession': return <><LivePracticeSessionPage topic={livePracticeTopic} onEndSession={(summary) => { setLiveSessionSummary(summary); }} onBackToDashboard={() => navigateTo('dashboard')} onAnalyzeLiveSession={(audio, context) => { setMediaForAnalysis(audio); setAnalysisContext(context); navigateTo('processing'); }} /><AppOverlays/></>;
            case 'paymentSuccess': return <PaymentSuccessPage onVerifyPayment={handleVerifyPayment} />;
            case 'paymentFailed': return <PaymentFailedPage onRetry={() => navigateTo('billing')} onBackToDashboard={() => navigateTo('dashboard')} />;
        }
        
        const commonLayoutProps = {
            user, history: analysisHistory, subscription: userSubscription, activePage: page as any,
            onLogout: handleLogout,
            onNavigateToDashboard: () => navigateTo('dashboard'), onNavigateToHistory: () => navigateTo('history'),
            onNavigateToGoals: () => navigateTo('goals'), onNavigateToProgress: () => navigateTo('progress'),
            onNavigateToCourses: () => navigateTo('courses'), onNavigateToResources: () => navigateTo('resources'), onNavigateToProfile: () => navigateTo('profile'),
            onNavigateToSettings: () => navigateTo('settings'), onNavigateToBilling: () => navigateTo('billing'),
            onNavigateToReferral: () => navigateTo('referral'),
            onNavigateToTermsOfService: () => navigateTo('termsOfService'),
            onNavigateToPrivacyPolicy: () => navigateTo('privacyPolicy'),
            onNavigateToSecurity: () => navigateTo('security'),
            onNavigateToContact: () => navigateTo('contact'),
            onNavigateToCareer: () => navigateTo('career'),
        };

        const MainContent = () => {
            switch(page) {
                case 'dashboard': return <Dashboard user={user} history={analysisHistory} userGoals={userGoals} trackableGoals={trackableGoals} subscription={userSubscription} onViewReport={(report) => { setAnalysisResult(report); setMediaForAnalysis(null); navigateTo('analysisResult'); }} onNavigateToNewAnalysis={() => navigateTo('contextSelection')} onNavigateToLivePractice={(topic) => { setInitialLiveTopic(topic || ''); navigateTo('livePracticeSetup'); }} onNavigateToGoals={() => navigateTo('goals')} onNavigateToBilling={() => navigateTo('billing')} setToast={setToast} />;
                case 'history': return <HistoryPage history={analysisHistory} onViewReport={(report) => { setAnalysisResult(report); setMediaForAnalysis(null); navigateTo('analysisResult'); }} onNavigateToNewAnalysis={() => navigateTo('contextSelection')} />;
                case 'goals': return <GoalsPage goals={trackableGoals} onUpdateGoals={(goals) => setTrackableGoals(goals)} history={analysisHistory} />;
                case 'courses': return <CoursesPage />;
                case 'progress': return <ProgressPage user={user} history={analysisHistory} userGoals={userGoals} onNavigateToGoals={() => navigateTo('goals')} onViewReport={(report) => { setAnalysisResult(report); setMediaForAnalysis(null); navigateTo('analysisResult'); }} onNavigateToNewAnalysis={() => navigateTo('contextSelection')} />;
                case 'resources': return <ResourcesPage onNavigateToResource={(id) => { setSelectedResource(id); navigateTo('resourceArticle'); }} />;
                case 'resourceArticle': return <ResourceArticlePage articleId={selectedResource} onBack={() => navigateTo('resources')} />;
                case 'profile': return <ProfilePage user={user} onUpdateUser={handleUpdateUser} />;
                case 'settings': return <SettingsPage user={user} history={analysisHistory} setToast={setToast} />;
                case 'billing': return <BillingPage user={user} subscription={userSubscription} onSubscriptionUpdate={handleSubscriptionUpdate} onNavigateToPaymentSuccess={(ref, plan, amt) => { setPaymentInfo({ reference: ref, plan, amount: amt }); navigateTo('paymentSuccess'); }} onNavigateToPaymentFailed={() => navigateTo('paymentFailed')} onBackToDashboard={() => navigateTo('dashboard')} setToast={setToast} />;
                case 'referral': return <ReferralPage user={user} setToast={setToast} onUpdateUser={handleUpdateUser} />;
                case 'components': return <ComponentsPage />;
                case 'termsOfService': return <TermsOfServicePage onBack={() => navigateTo('dashboard')} />;
                case 'privacyPolicy': return <PrivacyPolicyPage onBack={() => navigateTo('dashboard')} />;
                case 'security': return <SecurityPage onBack={() => navigateTo('dashboard')} />;
                case 'contact': return <ContactPage onBack={() => navigateTo('dashboard')} />;
                case 'career': return <CareerPage onBack={() => navigateTo('dashboard')} />;
                default: return <div>Page not found</div>;
            }
        };

        return (
            <MainLayout {...commonLayoutProps}>
                <MainContent />
            </MainLayout>
        );
    };

    return <>{renderPage()}</>;
};

export default App;