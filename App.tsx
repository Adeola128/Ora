

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
                
                // Now that we have `initialData` from either RPC or fallback, process it.
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
    
        // Load theme preferences
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');

        // This function runs once to handle the initial authentication check.
        const initializeAndSubscribe = async () => {
            // First, get the current session to immediately determine auth state on load.
            const { data: { session } } = await supabase.auth.getSession();
            await processSession(session);
            
            // This is the key fix: guarantee that the loading state is turned off after the initial check.
            setIsLoading(false);
            initialAuthCheckCompleted.current = true;

            // Now, set up the listener for any subsequent changes (e.g., user logs in/out in another tab).
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                // We only need to react to explicit sign-in/out events.
                // The initial 'INITIAL_SESSION' event is ignored because we already handled it with getSession().
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    await processSession(session);
                }
            });

            return subscription;
        };
        
        const subscriptionPromise = initializeAndSubscribe();

        // Return a cleanup function to unsubscribe when the component unmounts.
        return () => {
            subscriptionPromise.then(subscription => subscription?.unsubscribe());
        };
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
    
        // 1. Fetch current DB state to determine deletions
        const { data: currentGoalsData, error: fetchError } = await supabase
            .from('trackable_goals')
            .select('id')
            .eq('user_id', user.id);
    
        if (fetchError) {
            setToast({ message: `Failed to fetch current goals: ${fetchError.message}`, type: 'error' });
            return;
        }
    
        // 2. Calculate which goals to delete
        const currentGoalIds = new Set((currentGoalsData || []).map(g => g.id));
        const newGoalIds = new Set(newGoals.map(g => g.id).filter(id => typeof id === 'number'));
        const deletedIds = [...currentGoalIds].filter(id => !newGoalIds.has(id));
    
        // 3. Separate new goals (to insert) from existing goals (to update)
        const goalsToInsert: any[] = [];
        const goalsToUpdate: any[] = [];
    
        newGoals.forEach(goal => {
            const { id, ...restOfGoal } = goal;
            const goalPayload = { ...restOfGoal, userId: user.id };
            if (typeof id === 'number') {
                goalsToUpdate.push({ id, ...goalPayload });
            } else {
                goalsToInsert.push(goalPayload); // New goals have temp string IDs that are stripped
            }
        });
    
        const errors: string[] = [];
    
        // 4. Perform DB operations in parallel for efficiency
        const promises = [];
        if (deletedIds.length > 0) {
            promises.push(supabase.from('trackable_goals').delete().in('id', deletedIds));
        }
        if (goalsToInsert.length > 0) {
            promises.push(supabase.from('trackable_goals').insert(toSnakeCase(goalsToInsert)));
        }
        if (goalsToUpdate.length > 0) {
            promises.push(supabase.from('trackable_goals').upsert(toSnakeCase(goalsToUpdate)));
        }
        
        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res.error) errors.push(res.error.message);
        });
    
        // 5. Re-fetch all goals from DB to ensure UI is perfectly in sync with the source of truth
        const { data: finalGoalsData, error: finalFetchError } = await supabase
            .from('trackable_goals')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at');
    
        // 6. Report final status to user and update local state
        if (finalFetchError) {
            setToast({ message: `Goals updated, but failed to refresh view: ${finalFetchError.message}`, type: 'error' });
        } else if (errors.length > 0) {
            setToast({ message: `Some errors occurred: ${errors.join(', ')}`, type: 'error' });
        } else {
            setToast({ message: "Your goals have been updated!", type: 'success' });
        }
        
        if (finalGoalsData) {
            setTrackableGoals(toCamelCase<TrackableGoal[]>(finalGoalsData));
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
            
            // This `try...catch` block specifically handles errors that might occur during goal updates,
            // which could be caused by `JSON.stringify` on complex objects or other processing steps.
            // By isolating this, we prevent a goal-update failure from stopping the entire analysis completion flow.
            try {
                if (JSON.stringify(updatedGoals) !== JSON.stringify(trackableGoals)) {
                    // We call the main update handler which will persist changes to the DB
                    await handleTrackableGoalsUpdate(updatedGoals); 
                    setTrackableGoals(updatedGoals); // Also update local state immediately
                    
                    newlyCompleted.forEach(async (goal) => {
                        setToast({ message: `Goal Completed: ${goal.title}!`, type: 'success' });
                        if (user) {
                            const emailContent = generateGoalCompletionEmail(user, goal);
                            await sendEmailNotification({ to: user.email, subject: emailContent.subject, html: emailContent.html });
                        }
                    });
                }
            } catch (e: unknown) {
                console.error("Error processing goals after analysis:", e);
                let message = "Could not update your goal progress.";
                if (e instanceof Error) {
                    message = `Error updating goals: ${e.message}`;
                } else if (typeof e === 'string') {
                    message = `Error updating goals: ${e}`;
                } else if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
                    message = `Error updating goals: ${(e as { message: string }).message}`;
                }
                setToast({ message, type: 'error' });
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
            let message = "An unexpected error occurred while processing your results.";
            if (e instanceof Error) {
                message = e.message;
            } else if (typeof e === 'string') {
                message = e;
            }
            setToast({ message, type: 'error' });
            setAnalysisResult(report);
            setLastSessionGains(null);
        } finally {
            setPage('analysisResult');
        }
    };
    
    const handleAnalysisError = (error: string) => setAnalysisError(error);
    const handleEndLiveSession = (summary: { duration: number; feedback: string[]; fillerWords: Map<string, number>; avgWpm: number; }) => {
        setLiveSessionSummary(summary);
        setPage('livePracticeSession'); // stay on this page to show summary
    };
    
    const handleAnalyzeLiveRecording = (audio: Blob, context: AnalysisContext) => {
        setAnalysisContext(context);
        handleAnalysisStart(audio);
    };

    const handleViewReport = (report: AnalysisReport) => {
        setAnalysisResult(report);
        setMediaForAnalysis(null); // Clear media as we don't have it for old reports
        setLastSessionGains(null); // No new gains for viewing old reports
        setPage('analysisResult');
    }

    const navigateTo = (targetPage: Page) => setPage(targetPage);
    
    const mainLayoutPages: Page[] = ['dashboard', 'history', 'goals', 'progress', 'resources', 'profile', 'settings', 'components', 'billing', 'referral'];

    const renderPage = () => {
        switch (page) {
            case 'landing': return <LandingPage onNavigateToLogin={() => navigateTo('login')} onNavigateToSignUp={() => navigateTo('signup')} onNavigateToTermsOfService={() => navigateTo('termsOfService')} onNavigateToPrivacyPolicy={() => navigateTo('privacyPolicy')} onNavigateToSecurity={() => navigateTo('security')} onNavigateToContact={() => navigateTo('contact')} onNavigateToCareer={() => navigateTo('career')} />;
            case 'login': return <LoginPage onNavigateToSignUp={() => navigateTo('signup')} onNavigateToForgotPassword={() => navigateTo('forgotPassword')} />;
            case 'signup': return <SignUpPage onNavigateToLogin={() => navigateTo('login')} />;
            case 'forgotPassword': return <ForgotPasswordPage onNavigateToLogin={() => navigateTo('login')} setToast={setToast} />;
            case 'onboarding': return <OnboardingFlow user={user} onOnboardingComplete={handleOnboardingComplete} />;
            case 'newAnalysis': return <ContextSelectionPage onBackToDashboard={() => navigateTo('dashboard')} onContextSelected={handleContextSelected} />;
            case 'livePractice': return <LivePracticeSetupPage onBackToDashboard={() => navigateTo('dashboard')} onStartSession={(topic) => { setLivePracticeTopic(topic); navigateTo('livePracticeSession'); }} />;
            case 'contextSelection': return <ContextSelectionPage onBackToDashboard={() => navigateTo('dashboard')} onContextSelected={handleContextSelected} />;
            case 'upload': return <UploadPage context={analysisContext} onBack={() => navigateTo('contextSelection')} onAnalysisStart={handleAnalysisStart} onNavigateToLivePractice={() => navigateTo('livePractice')} />;
            case 'processing': return <ProcessingPage media={mediaForAnalysis} context={analysisContext} history={analysisHistory} onAnalysisComplete={handleAnalysisComplete} onAnalysisError={handleAnalysisError} error={analysisError} onRetry={() => handleAnalysisStart(mediaForAnalysis!)} onBackToUpload={() => navigateTo('upload')} />;
            case 'analysisResult': return <AnalysisResultPage user={user} report={analysisResult} media={mediaForAnalysis} sessionGains={lastSessionGains} onBackToDashboard={() => navigateTo('dashboard')} onNavigateToNewAnalysis={() => navigateTo('newAnalysis')} onNavigateToLivePracticeSetup={() => navigateTo('livePractice')} onNavigateToProgress={() => navigateTo('progress')} />;
            case 'livePracticeSetup': return <LivePracticeSetupPage onBackToDashboard={() => navigateTo('dashboard')} onStartSession={(topic) => { setLivePracticeTopic(topic); navigateTo('livePracticeSession'); }} initialTopic={initialLiveTopic} />;
            case 'livePracticeSession': return <LivePracticeSessionPage topic={livePracticeTopic} onEndSession={handleEndLiveSession} onBackToDashboard={() => navigateTo('dashboard')} onAnalyzeLiveSession={handleAnalyzeLiveRecording} />;
            case 'paymentSuccess': return <PaymentSuccessPage onVerifyPayment={handlePaymentVerification} />;
            case 'paymentFailed': return <PaymentFailedPage onRetry={() => navigateTo('billing')} onBackToDashboard={() => navigateTo('dashboard')} />;
            case 'resourceArticle': return <ResourceArticlePage articleId={selectedResource} onBack={() => navigateTo('resources')} />;
            case 'termsOfService': return <TermsOfServicePage onBack={() => window.history.back()} />;
            case 'privacyPolicy': return <PrivacyPolicyPage onBack={() => window.history.back()} />;
            case 'security': return <SecurityPage onBack={() => window.history.back()} />;
            case 'contact': return <ContactPage onBack={() => window.history.back()} />;
            case 'career': return <CareerPage onBack={() => window.history.back()} />;
            case 'error': return <ErrorPage title={appError?.title} message={appError?.message} onBack={handleLogout} backText="Logout & Start Over" />;
            default: return <p>Page not found</p>;
        }
    };
    
    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div></div>;
    }

    if (!user && (page !== 'landing' && page !== 'login' && page !== 'signup' && page !== 'forgotPassword' && page !== 'termsOfService' && page !== 'privacyPolicy' && page !== 'security' && page !== 'contact' && page !== 'career')) {
        return <LandingPage onNavigateToLogin={() => navigateTo('login')} onNavigateToSignUp={() => navigateTo('signup')} onNavigateToTermsOfService={() => navigateTo('termsOfService')} onNavigateToPrivacyPolicy={() => navigateTo('privacyPolicy')} onNavigateToSecurity={() => navigateTo('security')} onNavigateToContact={() => navigateTo('contact')} onNavigateToCareer={() => navigateTo('career')} />;
    }

    return (
        <>
            {mainLayoutPages.includes(page) && user ? (
                <MainLayout 
                    user={user}
                    history={analysisHistory}
                    subscription={userSubscription}
                    activePage={page as any} 
                    onLogout={handleLogout}
                    onNavigateToDashboard={() => navigateTo('dashboard')}
                    onNavigateToHistory={() => navigateTo('history')}
                    onNavigateToGoals={() => navigateTo('goals')}
                    onNavigateToProgress={() => navigateTo('progress')}
                    onNavigateToResources={() => navigateTo('resources')}
                    onNavigateToProfile={() => navigateTo('profile')}
                    onNavigateToSettings={() => navigateTo('settings')}
                    onNavigateToBilling={() => navigateTo('billing')}
                    onNavigateToReferral={() => navigateTo('referral')}
                    onNavigateToTermsOfService={() => navigateTo('termsOfService')}
                    onNavigateToPrivacyPolicy={() => navigateTo('privacyPolicy')}
                    onNavigateToSecurity={() => navigateTo('security')}
                    onNavigateToContact={() => navigateTo('contact')}
                    onNavigateToCareer={() => navigateTo('career')}
                >
                    {page === 'dashboard' && <Dashboard user={user} history={analysisHistory} userGoals={userGoals} trackableGoals={trackableGoals} subscription={userSubscription} onViewReport={handleViewReport} onNavigateToNewAnalysis={() => navigateTo('newAnalysis')} onNavigateToLivePractice={(topic) => { setInitialLiveTopic(topic || ''); navigateTo('livePracticeSetup'); }} onNavigateToGoals={() => navigateTo('goals')} onNavigateToBilling={() => navigateTo('billing')} setToast={setToast} />}
                    {page === 'history' && <HistoryPage history={analysisHistory} onViewReport={handleViewReport} onNavigateToNewAnalysis={() => navigateTo('newAnalysis')} />}
                    {page === 'goals' && <GoalsPage goals={trackableGoals} onUpdateGoals={handleTrackableGoalsUpdate} history={analysisHistory} />}
                    {page === 'progress' && <ProgressPage user={user} history={analysisHistory} userGoals={userGoals} onViewReport={handleViewReport} onNavigateToGoals={() => navigateTo('goals')} onNavigateToNewAnalysis={() => navigateTo('newAnalysis')} />}
                    {page === 'resources' && <ResourcesPage onNavigateToResource={(id) => { setSelectedResource(id); navigateTo('resourceArticle'); }} />}
                    {page === 'profile' && <ProfilePage user={user} onUpdateUser={handleUserUpdate} />}
                    {page === 'settings' && <SettingsPage user={user} history={analysisHistory} setToast={setToast} />}
                    {page === 'components' && <ComponentsPage />}
                    {page === 'billing' && <BillingPage user={user} subscription={userSubscription} onSubscriptionUpdate={handleSubscriptionUpdate} onNavigateToPaymentSuccess={(ref, plan, amount) => { setPaymentInfo({ reference: ref, plan, amount }); navigateTo('paymentSuccess'); }} onNavigateToPaymentFailed={() => navigateTo('paymentFailed')} onBackToDashboard={() => navigateTo('dashboard')} setToast={setToast} />}
                    {page === 'referral' && <ReferralPage user={user} setToast={setToast} />}
                </MainLayout>
            ) : (
                renderPage()
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <AchievementModal isOpen={showAchievementModal} onClose={() => setShowAchievementModal(false)} onNavigateToProgress={() => { setShowAchievementModal(false); navigateTo('progress'); }} />
            {user && <SupportButton />}
        </>
    );
};

export default App;
