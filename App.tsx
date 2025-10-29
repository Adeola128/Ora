
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


type Page = 
    | 'landing'
    | 'login' 
    | 'signup' 
    | 'forgotPassword' 
    | 'onboarding' 
    | 'dashboard'
    | 'history'
    | 'goals'
    | 'progress'
    | 'resources'
    | 'resourceArticle'
    | 'profile'
    | 'settings'
    | 'components'
    | 'billing'
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
        const processSession = async (session: Session | null) => {
            if (!session?.user) {
                setUser(null);
                setUserSubscription(null);
                setAnalysisHistory([]);
                setUserGoals(defaultUserGoals);
                setTrackableGoals([]);
                setPage('landing');
                return;
            }

            try {
                const { data: rpcData, error: rpcError } = await supabase
                    .rpc('get_initial_user_data', { p_user_id: session.user.id });
                
                let initialData;

                if (rpcError) {
                    console.warn("RPC 'get_initial_user_data' failed, falling back to individual fetches. Please ensure the RPC is deployed.", rpcError);
                    
                    const [profileRes, subscriptionRes, historyRes, goalsRes, trackableGoalsRes] = await Promise.all([
                        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
                        supabase.from('subscriptions').select('*').eq('id', session.user.id).single(),
                        supabase.from('analysis_reports').select('report').eq('user_id', session.user.id).order('created_at', { ascending: false }),
                        supabase.from('user_goals').select('goals').eq('user_id', session.user.id).single(),
                        supabase.from('trackable_goals').select('*').eq('user_id', session.user.id).order('created_at')
                    ]);

                    let profileData = profileRes.data;

                    if (profileRes.error) {
                         if (profileRes.error.code === 'PGRST116') { // "No rows found"
                            console.warn("Profile not found for authenticated user. Attempting to create one to prevent loop.");
                            const { data: newProfile, error: insertError } = await supabase
                                .from('profiles')
                                .insert({
                                    id: session.user.id,
                                    name: session.user.user_metadata?.full_name || session.user.email,
                                    avatar_url: session.user.user_metadata?.avatar_url,
                                    onboarding_completed: false,
                                })
                                .select()
                                .single();
                            if (insertError) {
                                throw new Error(`Failed to self-heal and create profile: ${insertError.message}`);
                            }
                            profileData = newProfile;
                        } else {
                            throw profileRes.error;
                        }
                    }

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

                } else {
                     initialData = rpcData;
                }
                
                if (!initialData || !initialData.profile) {
                    throw new Error("User authenticated but profile data could not be found or created.");
                }
                
                const camelCaseData = toCamelCase<any>(initialData);

                const userData: User = {
                    ...camelCaseData.profile,
                    id: session.user.id,
                    email: session.user.email || '',
                };
                setUser(userData);
                
                setUserSubscription(camelCaseData.subscription || null);
                setAnalysisHistory(camelCaseData.analysisHistory || []);
                setUserGoals(camelCaseData.userGoals || defaultUserGoals);
                setTrackableGoals(camelCaseData.trackableGoals || []);

                if (userData.onboardingCompleted) {
                    setPage('dashboard');
                } else {
                    setPage('onboarding');
                }

            } catch (error) {
                console.error("Auth state handling error:", error);
                setAppError({
                    title: "Application Error",
                    message: `We couldn't load your user data due to an unexpected issue. Please try logging out and starting over. If the problem persists, contact support.`,
                });
                setPage('error');
            }
        };
    
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            await processSession(session);
            
            // This ensures we only set loading to false on the very first auth event.
            if (!initialAuthCheckCompleted.current) {
                setIsLoading(false);
                initialAuthCheckCompleted.current = true;
            }
        });

        return () => subscription.unsubscribe();
    }, []); // Empty dependency array ensures this runs only once on mount.

    const isConfigured = isGeminiConfigured;
    if (!isConfigured) {
        // ... (Error component remains the same)
    }

    // --- Data Update Handlers ---
    const handleSubscriptionUpdate = useCallback(async (newPlan: SubscriptionPlan) => {
        if (!user) return;
        
        const eligibleForTrial = (userSubscription?.plan === 'free' || !userSubscription) && newPlan === 'premium';
    
        const newSubscriptionData: UserSubscription = {
            plan: newPlan,
            status: eligibleForTrial ? 'trialing' : 'active',
            trialEndsAt: eligibleForTrial ? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() : null,
            periodEndsAt: (newPlan !== 'free' && !eligibleForTrial) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        };
        
        if (newPlan === 'free') {
            newSubscriptionData.status = 'active';
            newSubscriptionData.trialEndsAt = null;
        }

        const { data, error } = await supabase
            .from('subscriptions')
            .upsert(toSnakeCase({ ...newSubscriptionData, id: user.id }))
            .select()
            .single();
        
        if (error) {
            throw new Error(`Failed to update subscription: ${error.message}`);
        } else if (data) {
            setUserSubscription(toCamelCase<UserSubscription>(data));
             if (eligibleForTrial) {
                setToast({ message: `Your 3-week Premium trial has started!`, type: 'success' });
            } else if (newPlan === 'free') {
                 setToast({ message: 'Successfully downgraded to the Free plan.', type: 'info' });
            } else {
                 setToast({ message: `Successfully upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)}!`, type: 'success' });
            }
        }
    }, [user, userSubscription]);
    
    const handlePaymentVerification = async () => {
        if (!paymentInfo || !user) {
            setToast({ message: 'Payment verification failed: Missing data.', type: 'error' });
            setPage('paymentFailed');
            return;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        const isVerified = true;

        if (isVerified) {
            try {
                await handleSubscriptionUpdate(paymentInfo.plan);
                
                const { error: paymentError } = await supabase.from('payments').insert(toSnakeCase({
                    userId: user.id,
                    plan: paymentInfo.plan,
                    amount: paymentInfo.amount,
                    status: 'Paid',
                    providerReference: paymentInfo.reference,
                }));
                
                if (paymentError) throw paymentError;

                setToast({ message: 'Your new plan is now active!', type: 'success' });
                setPage('dashboard');

            } catch (error) {
                console.error("Error during post-payment processing:", error);
                let message = 'An unknown error occurred.';
                if (error instanceof Error) {
                    message = error.message;
                } else if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
                    message = (error as { message: string }).message;
                }
                setToast({ message: `An error occurred while activating your plan: ${message}`, type: 'error' });
                setPage('paymentFailed');
            }
        } else {
            setToast({ message: 'Payment could not be verified.', type: 'error' });
            setPage('paymentFailed');
        }
    };

    const handleGoalsUpdate = useCallback(async (newGoals: UserGoals) => {
        if (!user) return;
        const { error } = await supabase.from('user_goals').upsert(toSnakeCase({ userId: user.id, goals: newGoals }));
        if (error) {
            setToast({ message: `Failed to update goals: ${error.message}`, type: 'error' });
        } else {
            setUserGoals(newGoals);
            setToast({ message: "Your goal settings have been updated!", type: 'success' });
        }
    }, [user]);

    const handleTrackableGoalsUpdate = useCallback(async (newGoals: TrackableGoal[]) => {
        if (!user) return;
    
        const { data: currentGoalsData, error: fetchError } = await supabase
            .from('trackable_goals')
            .select('id')
            .eq('user_id', user.id);
    
        if (fetchError) {
            setToast({ message: `Failed to fetch current goals: ${fetchError.message}`, type: 'error' });
            return;
        }
    
        const currentGoals = toCamelCase<TrackableGoal[]>(currentGoalsData || []);
        const currentGoalIds = new Set(currentGoals.map(g => g.id as number));
        const newGoalIds = new Set(newGoals.map(g => g.id).filter(id => typeof id === 'number'));
        const deletedIds = [...currentGoalIds].filter(id => !newGoalIds.has(id));
    
        const upsertableGoals = newGoals.map(goal => {
            const isNewGoal = typeof goal.id !== 'number';
            // Create a copy to avoid mutating state, and add the user_id
            const goalData: Partial<TrackableGoal> & { userId?: string } = { ...goal, userId: user.id };

            if (isNewGoal) {
                // For new goals, we must NOT include the `id` property at all.
                // The database will generate it, and our temporary string ID must be removed.
                delete goalData.id;
            }
            
            return goalData;
        });
        
        if (deletedIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('trackable_goals')
                .delete()
                .in('id', deletedIds);
    
            if (deleteError) {
                setToast({ message: `Failed to delete old goals: ${deleteError.message}`, type: 'error' });
                return;
            }
        }
    
        if (upsertableGoals.length > 0) {
            const { data, error: upsertError } = await supabase
                .from('trackable_goals')
                .upsert(toSnakeCase(upsertableGoals))
                .select();
    
            if (upsertError) {
                setToast({ message: `Failed to update goals: ${upsertError.message}`, type: 'error' });
            } else if (data) {
                setTrackableGoals(toCamelCase<TrackableGoal[]>(data));
                setToast({ message: "Your goals have been updated!", type: 'success' });
            }
        } else {
            setTrackableGoals([]);
            setToast({ message: "Your goals have been updated!", type: 'success' });
        }
    }, [user, setToast]);

    const handleUserUpdate = useCallback(async (updatedUser: Partial<User>) => {
        if (!user) return;
        
        // The `updated_at` field is automatically handled by the database trigger.
        // Sending it from the client was causing an error because the Date object was being converted improperly.
        const snakeCaseUpdate = toSnakeCase(updatedUser);
        const { data, error } = await supabase.from('profiles').update(snakeCaseUpdate).eq('id', user.id).select().single();
        
        if (error) {
            setToast({ message: `Profile update failed: ${error.message}`, type: 'error' });
        } else if (data) {
            setUser(prev => ({...prev!, ...toCamelCase<User>(data)}));
            setToast({ message: "Your profile has been updated!", type: 'success' });
        }
    }, [user, setToast]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setUserSubscription(null);
        setAnalysisHistory([]);
        setUserGoals(defaultUserGoals);
        setTrackableGoals([]);
        setPage('landing');
    };

    const handleOnboardingComplete = async (data: OnboardingData) => {
        if (!user) return;
        
        let profileUpdate: Partial<User> = {
            name: data.name,
            onboardingCompleted: true,
        };
        
        if (data.profilePicture) {
            const file = data.profilePicture;
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                profileUpdate.avatarUrl = urlData.publicUrl;
            } else {
                 setToast({ message: `Avatar upload failed: ${uploadError.message}`, type: 'error' });
            }
        }
        
        await handleUserUpdate(profileUpdate);
        
        if (data.speakingGoals.length > 0) {
            await handleGoalsUpdate({ ...userGoals, primaryGoals: data.speakingGoals });
        }
        
        if (!userSubscription) {
            await handleSubscriptionUpdate('premium');
        }

        if (data.baselineRecording) {
            const baselineContext: AnalysisContext = {
                category: data.selectedContext || 'Personal',
                name: 'My First Baseline Analysis',
                audienceSize: 1,
                formality: 'Casual',
                duration: 30,
                goals: data.speakingGoals,
                script: null,
            };
            setAnalysisContext(baselineContext);
            handleAnalysisStart(data.baselineRecording);
        } else {
            setPage('dashboard');
        }
    };
    
    const handleLogin = () => setPage('dashboard');
    const handleSignUp = () => {};

    const handleContextSelected = (context: AnalysisContext) => {
        setAnalysisContext(context);
        setPage('upload');
    };

    const handleAnalysisStart = (media: Blob | File) => {
        setMediaForAnalysis(media);
        setAnalysisError(null);
        setPage('processing');
    };

    const handleAnalysisComplete = async (report: AnalysisReport) => {
        if (!user) {
            setToast({ message: "Your session has expired. Please log in again.", type: 'error' });
            handleLogout();
            return;
        }
    
        try {
            const { updatedGoals, newlyCompleted } = processGoalsWithNewReport(trackableGoals, report);
            if (JSON.stringify(updatedGoals) !== JSON.stringify(trackableGoals)) {
                setTrackableGoals(updatedGoals);
                await handleTrackableGoalsUpdate(updatedGoals);
                
                newlyCompleted.forEach(async (goal) => {
                    setToast({ message: `Goal Completed: ${goal.title}!`, type: 'success' });
                    if (user) {
                        const emailContent = generateGoalCompletionEmail(user, goal);
                        await sendEmailNotification({ to: user.email, subject: emailContent.subject, html: emailContent.html });
                    }
                });
            }

            const { error } = await supabase.from('analysis_reports').insert(toSnakeCase({ userId: user.id, report: report }));
    
            if (error) {
                console.error("Failed to save report to Supabase:", error);
                setToast({ message: `Your report was generated but could not be saved to your history. Error: ${error.message}`, type: 'error' });
                setAnalysisResult(report);
                setLastSessionGains(null);
            } else {
                setAnalysisResult(report);
                const newHistory = [report, ...analysisHistory];
                setAnalysisHistory(newHistory);
                
                const oldAchievements = calculateAchievements(analysisHistory);
                const newAchievements = calculateAchievements(newHistory);
                const newlyUnlocked = newAchievements.filter((newAch, index) => newAch.unlocked && !oldAchievements[index].unlocked);
                
                const oldXp = calculateLevelAndXP(analysisHistory, oldAchievements).totalXp;
                const newXp = calculateLevelAndXP(newHistory, newAchievements).totalXp;
                const xpGained = newXp - oldXp;
                
                setLastSessionGains({ xp: xpGained, newAchievements: newlyUnlocked });
                if (newlyUnlocked.length > 0) setShowAchievementModal(true);
            }
        } catch (e) {
            console.error("Error during analysis completion handling:", e);
            setToast({ message: "An unexpected error occurred while processing your results.", type: 'error' });
            setAnalysisResult(report);
            setLastSessionGains(null);
        } finally {
            setPage('analysisResult');
        }
    };
    
    const handleAnalysisError = (error: string) => setAnalysisError(error);
    const handleEndLiveSession = (summary: { duration: number; feedback: string[]; fillerWords: Map<string, number>; avgWpm: number; }) => {
        setLiveSessionSummary(summary);
    };
    const handleAnalyzeLiveSession = (audio: Blob, context: AnalysisContext) => { 
        setAnalysisContext(context); 
        handleAnalysisStart(audio); 
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        )
    }

    const mainLayoutPages: Page[] = ['dashboard', 'history', 'goals', 'progress', 'resources', 'profile', 'settings', 'components', 'billing', 'termsOfService', 'privacyPolicy', 'security', 'contact', 'career', 'resourceArticle'];

    const renderPage = () => {
        if (!user) { // Unauthenticated users
            switch(page) {
                case 'login': return <LoginPage onNavigateToSignUp={() => setPage('signup')} onNavigateToForgotPassword={() => setPage('forgotPassword')} />;
                case 'signup': return <SignUpPage onNavigateToLogin={() => setPage('login')} />;
                case 'forgotPassword': return <ForgotPasswordPage onNavigateToLogin={() => setPage('login')} setToast={setToast} />;
                case 'error': return <ErrorPage title={appError?.title} message={appError?.message} onRetry={handleLogout} retryText="Back to Login" />;
                default: return <LandingPage onNavigateToLogin={() => setPage('login')} onNavigateToSignUp={() => setPage('signup')} onNavigateToTermsOfService={() => setPage('termsOfService')} onNavigateToPrivacyPolicy={() => setPage('privacyPolicy')} onNavigateToSecurity={() => setPage('security')} onNavigateToContact={() => setPage('contact')} onNavigateToCareer={() => setPage('career')} />;
            }
        }

        if (user && !user.onboardingCompleted && page !== 'onboarding' && page !== 'processing' && page !== 'analysisResult') {
             return <OnboardingFlow user={user} onOnboardingComplete={handleOnboardingComplete} />;
        }
        
        if (page === 'onboarding') {
             return <OnboardingFlow user={user} onOnboardingComplete={handleOnboardingComplete} />;
        }
        
        if (mainLayoutPages.includes(page) || (page === 'error' && user)) {
            return (
                 <MainLayout
                    user={user} history={analysisHistory} subscription={userSubscription} activePage={page as any} onLogout={handleLogout}
                    onNavigateToDashboard={() => setPage('dashboard')} onNavigateToHistory={() => setPage('history')}
                    onNavigateToGoals={() => setPage('goals')} onNavigateToProgress={() => setPage('progress')}
                    onNavigateToResources={() => setPage('resources')} onNavigateToProfile={() => setPage('profile')}
                    onNavigateToSettings={() => setPage('settings')} onNavigateToBilling={() => setPage('billing')}
                    onNavigateToTermsOfService={() => setPage('termsOfService')} onNavigateToPrivacyPolicy={() => setPage('privacyPolicy')}
                    onNavigateToSecurity={() => setPage('security')} onNavigateToContact={() => setPage('contact')}
                    onNavigateToCareer={() => setPage('career')}
                 >
                    {page === 'error' && <ErrorPage title={appError?.title} message={appError?.message} onRetry={handleLogout} retryText="Logout & Start Over" />}
                    {page === 'dashboard' && <Dashboard user={user} history={analysisHistory} userGoals={userGoals} trackableGoals={trackableGoals} subscription={userSubscription} onViewReport={(report) => { setAnalysisResult(report); setPage('analysisResult'); }} onNavigateToNewAnalysis={() => setPage('contextSelection')} onNavigateToLivePractice={(topic) => { setInitialLiveTopic(topic || ''); setPage('livePracticeSetup'); }} onNavigateToGoals={() => setPage('goals')} onNavigateToBilling={() => setPage('billing')} setToast={setToast} />}
                    {page === 'history' && <HistoryPage history={analysisHistory} onViewReport={(report) => { setAnalysisResult(report); setPage('analysisResult'); }} onNavigateToNewAnalysis={() => setPage('contextSelection')} />}
                    {page === 'goals' && <GoalsPage goals={trackableGoals} onUpdateGoals={handleTrackableGoalsUpdate} history={analysisHistory} />}
                    {page === 'progress' && <ProgressPage user={user} history={analysisHistory} userGoals={userGoals} onNavigateToGoals={() => setPage('goals')} onViewReport={(report) => { setAnalysisResult(report); setPage('analysisResult'); }} onNavigateToNewAnalysis={() => setPage('contextSelection')} />}
                    {page === 'resources' && <ResourcesPage onNavigateToResource={(id) => { setSelectedResource(id); setPage('resourceArticle'); }} />}
                    {page === 'resourceArticle' && <ResourceArticlePage articleId={selectedResource} onBack={() => setPage('resources')} />}
                    {page === 'profile' && <ProfilePage user={user} onUpdateUser={handleUserUpdate} />}
                    {page === 'settings' && <SettingsPage user={user} history={analysisHistory} setToast={setToast} />}
                    {page === 'components' && <ComponentsPage />}
                    {page === 'billing' && <BillingPage user={user} subscription={userSubscription} onSubscriptionUpdate={handleSubscriptionUpdate} onNavigateToPaymentSuccess={(ref, plan, amount) => { setPaymentInfo({reference: ref, plan, amount }); setPage('paymentSuccess'); }} onNavigateToPaymentFailed={() => setPage('paymentFailed')} onBackToDashboard={() => setPage('dashboard')} setToast={setToast} />}
                    {page === 'termsOfService' && <TermsOfServicePage onBack={() => setPage('dashboard')} />}
                    {page === 'privacyPolicy' && <PrivacyPolicyPage onBack={() => setPage('dashboard')} />}
                    {page === 'security' && <SecurityPage onBack={() => setPage('dashboard')} />}
                    {page === 'contact' && <ContactPage onBack={() => setPage('dashboard')} />}
                    {page === 'career' && <CareerPage onBack={() => setPage('dashboard')} />}
                </MainLayout>
            )
        }
        
        switch (page) {
            case 'newAnalysis':
            case 'contextSelection':
                 return <ContextSelectionPage onBackToDashboard={() => setPage('dashboard')} onContextSelected={handleContextSelected} />;
            case 'upload':
                return <UploadPage context={analysisContext} onBack={() => setPage('contextSelection')} onAnalysisStart={handleAnalysisStart} onNavigateToLivePractice={() => setPage('livePracticeSetup')} />;
            case 'processing':
                return <ProcessingPage media={mediaForAnalysis} context={analysisContext} history={analysisHistory} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} onRetry={() => handleAnalysisStart(mediaForAnalysis!)} onBackToUpload={() => setPage('upload')} error={analysisError} />;
            case 'analysisResult':
                return <AnalysisResultPage user={user} report={analysisResult} media={mediaForAnalysis} sessionGains={lastSessionGains} onBackToDashboard={() => setPage('dashboard')} onNavigateToNewAnalysis={() => setPage('contextSelection')} onNavigateToLivePracticeSetup={() => setPage('livePracticeSetup')} onNavigateToProgress={() => setPage('progress')} />;
            case 'livePractice':
            case 'livePracticeSetup':
                return <LivePracticeSetupPage onBackToDashboard={() => setPage('dashboard')} onStartSession={(topic) => { setLivePracticeTopic(topic); setLiveSessionSummary(null); setPage('livePracticeSession'); }} initialTopic={initialLiveTopic} />;
            case 'livePracticeSession':
                return <LivePracticeSessionPage topic={livePracticeTopic} onEndSession={handleEndLiveSession} onBackToDashboard={() => setPage('dashboard')} onAnalyzeLiveSession={handleAnalyzeLiveSession} />;
            case 'paymentSuccess':
                return <PaymentSuccessPage onVerifyPayment={handlePaymentVerification} />;
            case 'paymentFailed':
                return <PaymentFailedPage onRetry={() => setPage('billing')} onBackToDashboard={() => setPage('dashboard')} />;
            default:
                return <Dashboard user={user} history={analysisHistory} userGoals={userGoals} trackableGoals={trackableGoals} subscription={userSubscription} onViewReport={(report) => { setAnalysisResult(report); setPage('analysisResult'); }} onNavigateToNewAnalysis={() => setPage('contextSelection')} onNavigateToLivePractice={(topic) => { setInitialLiveTopic(topic || ''); setPage('livePracticeSetup'); }} onNavigateToGoals={() => setPage('goals')} onNavigateToBilling={() => setPage('billing')} setToast={setToast} />;
        }
    };
    
    return (
        <>
            {renderPage()}
            <SupportButton />
            {showAchievementModal && <AchievementModal isOpen={showAchievementModal} onClose={() => setShowAchievementModal(false)} onNavigateToProgress={() => { setPage('progress'); setShowAchievementModal(false); }} />}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </>
    );
};

export default App;
