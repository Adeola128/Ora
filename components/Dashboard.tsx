import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { User, AnalysisReport, UserGoals, Achievement, UserSubscription, TrackableGoal } from '../types';
import { calculateAchievements, calculateLevelAndXP, calculateStreak } from './lib/gamification';
import AchievementBadge from './AchievementBadge';
import { supabase } from '../lib/supabaseClient';

// This is a temporary fix to make the linter happy.
// In a real app, you would initialize this once in a client/config file.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'placeholder' });


interface DashboardProps {
    user: User | null;
    history: AnalysisReport[];
    userGoals: UserGoals;
    trackableGoals: TrackableGoal[];
    subscription: UserSubscription | null;
    onViewReport: (report: AnalysisReport) => void;
    onNavigateToNewAnalysis: () => void;
    onNavigateToLivePractice: (topic?: string) => void;
    onNavigateToGoals: () => void;
    onNavigateToBilling: () => void;
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

type Exercise = { title: string; description: string; icon: string; color: string; tags: string[]; };
const EXERCISE_POOL: Exercise[] = [
    { title: 'Perfecting Your Pitch', description: 'Practice a timed session to nail your key points concisely.', icon: 'timer', color: 'red', tags: ['pacing'] },
    { title: 'Pacing Pyramids', description: 'Start slow, speed up, then return to a normal pace. Builds control.', icon: 'signal_cellular_alt', color: 'red', tags: ['pacing', 'intonation'] },
    { title: 'Clarity Drills', description: 'Improve your articulation with fun tongue twisters.', icon: 'mic', color: 'purple', tags: ['fluency'] },
    { title: 'The "Pause" Challenge', description: 'Instead of "um" or "ah," practice embracing the silent pause.', icon: 'pause_circle', color: 'purple', tags: ['fluency', 'pacing'] },
    { title: 'Mastering Vocal Tone', description: 'Focus on exercises to control your pitch and volume.', icon: 'campaign', color: 'teal', tags: ['intonation'] },
    { title: 'Vocal Projection', description: 'Exercises to make your voice stronger and carry further.', icon: 'volume_up', color: 'green', tags: ['volume'] },
    { title: 'Pitch Rollercoaster', description: 'Read a passage with exaggerated pitch changes to expand your vocal range.', icon: 'moving', color: 'teal', tags: ['intonation'] },
    { title: 'Emotional Range', description: 'Say a neutral phrase with different emotions (happy, sad, angry) to practice tonal variety.', icon: 'theater_comedy', color: 'teal', tags: ['intonation', 'sentiment'] },
    { title: 'Volume Control', description: 'Practice speaking at different volumes: whisper, conversational, and projecting.', icon: 'settings_voice', color: 'green', tags: ['volume'] },
    { title: 'Confident Posture', description: 'Practice power poses to improve your stage presence.', icon: 'accessibility_new', color: 'blue', tags: ['confidence', 'body_language'] },
    { title: 'Calming Techniques', description: 'Breathing exercises to manage speech anxiety.', icon: 'spa', color: 'yellow', tags: ['confidence'] },
    { title: 'Story Arc Practice', description: 'Structure a short story with a clear beginning, middle, and end.', icon: 'auto_stories', color: 'orange', tags: ['storytelling'] }
];
const DEFAULT_EXERCISES: Exercise[] = [ EXERCISE_POOL.find(e => e.tags.includes('pacing'))!, EXERCISE_POOL.find(e => e.tags.includes('fluency'))!, EXERCISE_POOL.find(e => e.tags.includes('confidence'))! ].filter(Boolean);
const GOAL_TO_TAG_MAP: { [key: string]: string } = { 'Improve Confidence': 'confidence', 'Reduce Filler Words': 'fluency', 'Better Storytelling': 'storytelling', 'Manage Pace': 'pacing', 'Engage the Audience': 'intonation', 'Improve Clarity': 'fluency', };
const METRIC_TO_TAG_MAP: { [key: string]: string } = { pacing: 'pacing', fluency: 'fluency', intonation: 'intonation', volume: 'volume', sentiment: 'confidence', bodyLanguage: 'body_language', eyeContact: 'confidence', gestures: 'body_language' };

const DAILY_CHALLENGES = [
    { title: "The One-Minute Story", description: "Tell a compelling story in 60 seconds. Focus on having a clear beginning, middle, and end.", icon: "auto_stories" },
    { title: "Filler Word Fast", description: "Speak for 90 seconds about your favorite hobby without using any filler words (um, uh, like).", icon: "mic_off" },
    { title: "Pacing Pyramid", description: "Start speaking slowly, gradually speed up to a fast pace, then return to slow, all in 2 minutes.", icon: "speed" },
    { title: "The Impromptu Pitch", description: "You have 30 seconds to pitch a random object on your desk as a must-have product.", icon: "lightbulb" },
    { title: "Emotional Range", description: "Read a neutral sentence, but say it with 3 different emotions: happy, sad, and angry.", icon: "theater_comedy" },
    { title: "The Power of the Pause", description: "Give a 1-minute speech where you intentionally pause for 3 seconds after every sentence.", icon: "pause" },
];

const getPersonalizedRecommendations = (report: AnalysisReport, goals: UserGoals): Exercise[] => {
    const weaknesses: string[] = [];
    const checkMetrics = (metrics: any) => {
        for (const [key, metric] of Object.entries(metrics)) {
            if (metric && typeof metric === 'object' && 'rating' in metric && (metric.rating === 'poor' || metric.rating === 'average')) {
                const tag = METRIC_TO_TAG_MAP[key as keyof typeof METRIC_TO_TAG_MAP];
                if (tag) weaknesses.push(tag);
            }
        }
    }
    checkMetrics(report.metrics);
    if(report.metrics.video) checkMetrics(report.metrics.video);
    const goalTags = goals.primaryGoals.map(goal => GOAL_TO_TAG_MAP[goal]).filter(Boolean);
    const focusAreas = [...new Set([...goalTags, ...weaknesses])];
    if (focusAreas.length === 0) return [...EXERCISE_POOL].sort(() => 0.5 - Math.random()).slice(0, 3);
    let recommended: Exercise[] = [];
    for (const area of focusAreas) { recommended.push(...EXERCISE_POOL.filter(ex => ex.tags.includes(area))); }
    recommended = [...new Set(recommended)];
    if (recommended.length < 3) {
        const remaining = EXERCISE_POOL.filter(ex => !recommended.find(r => r.title === ex.title));
        recommended.push(...[...remaining].sort(() => 0.5 - Math.random()).slice(0, 3 - recommended.length));
    }
    return [...recommended].sort(() => 0.5 - Math.random()).slice(0, 3);
};

const getRelativeDate = (sessionDate: string) => {
    const date = new Date(sessionDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';
    const diffDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};


const StatCard: React.FC<{ icon: string, label: string, value: string | number, colorClass: string }> = ({ icon, label, value, colorClass }) => (
    <div className={`flex items-center gap-4 rounded-xl bg-card-light p-4 shadow-sm dark:bg-card-dark`}>
        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${colorClass.split(' ')[1]}`}>
            <span className={`material-symbols-outlined text-3xl ${colorClass.split(' ')[0]}`}>{icon}</span>
        </div>
        <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
            <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{value}</p>
        </div>
    </div>
);

const ActionCard: React.FC<{ icon: string, title: string, description: string, buttonText: string, onClick: () => void, colorClass: string, disabled?: boolean, disabledText?: string }> = ({ icon, title, description, buttonText, onClick, colorClass, disabled = false, disabledText }) => (
    <div className={`flex flex-col gap-4 rounded-xl bg-card-light p-6 shadow-sm dark:bg-card-dark transition-all duration-300 ${!disabled && 'hover:shadow-lg hover:-translate-y-1'}`}>
        <div className="flex items-center gap-4">
            <span className={`material-symbols-outlined text-4xl ${colorClass}`}>{icon}</span>
            <h3 className="font-heading text-xl font-bold">{title}</h3>
        </div>
        <p className="flex-grow text-text-secondary-light dark:text-text-secondary-dark">{description}</p>
        <button onClick={onClick} disabled={disabled} className={`mt-2 w-full rounded-lg py-3 font-bold text-white transition-colors ${colorClass === 'text-teal-500' ? 'bg-teal-500 hover:bg-teal-600' : 'bg-accent hover:bg-accent/90'} disabled:bg-gray-400 disabled:cursor-not-allowed`}>
            {disabled ? disabledText : buttonText}
        </button>
    </div>
);

const ChallengeCard: React.FC<{ challenge: typeof DAILY_CHALLENGES[0]; onStart: (topic: string) => void; }> = ({ challenge, onStart }) => (
    <div className="flex flex-col gap-4 rounded-xl bg-card-light p-6 shadow-sm dark:bg-card-dark transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-dashed border-mustard">
        <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-4xl text-mustard">military_tech</span>
            <h3 className="font-heading text-xl font-bold">Today's Challenge</h3>
        </div>
        <div>
            <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{challenge.title}</p>
            <p className="flex-grow text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">{challenge.description}</p>
        </div>
        <button onClick={() => onStart(challenge.description)} className="mt-auto w-full rounded-lg py-3 font-bold text-black transition-colors bg-mustard hover:bg-mustard/80">
            Start Challenge
        </button>
    </div>
);

const Sparkline: React.FC<{ data: number[]; color?: string; className?: string }> = ({ data, color = '#06f9e0', className = '' }) => {
    if (data.length < 2) {
        return (
            <div className={`flex h-10 w-24 items-center justify-center text-xs text-text-secondary-light dark:text-text-secondary-dark ${className}`}>
                No trend data
            </div>
        );
    }

    const width = 100;
    const height = 40;
    const dataMin = Math.min(...data);
    const dataMax = Math.max(...data);
    const range = dataMax - dataMin === 0 ? 1 : dataMax - dataMin;


    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - dataMin) / range) * (height - 8) + 4; // Add padding
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    
    const lastPoint = points.split(' ').pop()?.split(',');
    const lastX = lastPoint ? parseFloat(lastPoint[0]) : 0;
    const lastY = lastPoint ? parseFloat(lastPoint[1]) : 0;


    return (
        <svg viewBox={`0 0 ${width} ${height}`} className={`w-24 h-10 overflow-visible ${className}`}>
             <defs>
                <linearGradient id={`sparkline-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polyline fill={`url(#sparkline-gradient-${color.replace('#', '')})`} points={`0,${height} ${points} ${width},${height}`} />
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
            <circle cx={lastX} cy={lastY} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
        </svg>
    );
};

const RadialProgress: React.FC<{ score: number; change: number }> = ({ score, change }) => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    const changeColor = change >= 0 ? 'text-teal-400' : 'text-accent';
    const changeIcon = change >= 0 ? 'arrow_upward' : 'arrow_downward';

    return (
        <div className="relative w-52 h-52">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle className="text-border-light dark:text-border-dark" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" />
                <circle
                    className="text-primary"
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                    style={{
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 1s ease-out',
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">Latest Score</p>
                <span className="font-display text-6xl font-bold text-primary">{score}<span className="text-3xl text-text-secondary-light dark:text-text-secondary-dark">%</span></span>
                {change !== 0 && (
                     <div className={`mt-1 flex items-center gap-1 text-sm font-bold ${changeColor}`}>
                        <span className="material-symbols-outlined !text-base">{changeIcon}</span>
                        <span>{Math.abs(change)}% vs. previous</span>
                    </div>
                )}
            </div>
        </div>
    );
};


const PerformanceSnapshotCard: React.FC<{ history: AnalysisReport[] }> = ({ history }) => {
    if (history.length === 0) {
        return (
            <div className="flex flex-col gap-6 rounded-xl bg-card-light p-6 shadow-sm dark:bg-card-dark text-center items-center justify-center min-h-[16rem]">
                <span className="material-symbols-outlined text-5xl text-primary">analytics</span>
                <h3 className="font-heading text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Performance Snapshot</h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">Complete your first session to see your stats here.</p>
            </div>
        )
    }

    const latestReport = history[0];
    const previousReport = history[1];
    
    const latestScore = latestReport.overallScore;
    const change = previousReport ? latestReport.overallScore - previousReport.overallScore : 0;
    
    const trendHistory = history.slice(0, 7).reverse();

    const metricsToShow = [
        { 
            key: 'pacing', 
            label: 'Pacing', 
            unit: ' WPM',
            color: '#3b82f6', // blue-500
            score: latestReport.metrics.pacing.score,
            trend: trendHistory.map(r => r.metrics.pacing.score)
        },
        { 
            key: 'fluency', 
            label: 'Clarity', 
            unit: '%',
            color: '#f59e0b', // amber-500
            score: latestReport.metrics.fluency.score,
            trend: trendHistory.map(r => r.metrics.fluency.score)
        },
        { 
            key: 'sentiment', 
            label: 'Confidence', 
            unit: '%',
            color: '#10b981', // emerald-500
            score: latestReport.metrics.sentiment.score,
            trend: trendHistory.map(r => r.metrics.sentiment.score)
        },
    ];

    return (
        <div className="flex flex-col gap-6 rounded-xl bg-card-light p-6 shadow-sm dark:bg-card-dark">
            <h3 className="font-heading text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Performance Snapshot</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="flex justify-center">
                    <RadialProgress score={latestScore} change={change} />
                </div>
                <div className="space-y-4">
                    {metricsToShow.map(metric => (
                         <div key={metric.key} className="flex items-center justify-between gap-4 rounded-lg bg-background-light dark:bg-background-dark/50 p-3">
                            <div>
                                <p className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">{metric.label}</p>
                                <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{metric.score}<span className="text-base">{metric.unit}</span></p>
                            </div>
                            <Sparkline data={metric.trend} color={metric.color} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ user, history, userGoals, trackableGoals, subscription, onViewReport, onNavigateToNewAnalysis, onNavigateToLivePractice, onNavigateToGoals, onNavigateToBilling, setToast }) => {
    const [owlTip, setOwlTip] = useState("Remember to pause and breathe. It gives you a moment to think and your audience a moment to absorb!");
    const [isTipLoading, setIsTipLoading] = useState(true);

    const userName = user?.name?.split(' ')[0] || 'User';
    
    const isPro = subscription?.plan === 'pro' || subscription?.plan === 'premium';
    const isTrial = subscription?.status === 'trialing';
    const freeAnalysesUsed = history.length;
    const freeAnalysesLimit = 2;
    const hasReachedFreeLimit = !isPro && !isTrial && freeAnalysesUsed >= freeAnalysesLimit;


    useEffect(() => {
        const fetchTip = async () => {
            setIsTipLoading(true);
            try {
                const latestReport = history.length > 0 ? history[0] : null;
                let prompt = 'You are a friendly and encouraging public speaking coach owl named Oratora. Provide one short, actionable, and encouraging public speaking tip under 20 words.';

                if (latestReport) {
                    const weakAreas = latestReport.feedback.areasToWatch.join(', ');
                    if (weakAreas) {
                         prompt = `You are a friendly and encouraging public speaking coach owl named Oratora. A user's last performance showed they need to work on "${weakAreas}". Based on this, provide one short, actionable, and encouraging tip (under 20 words) to help them improve. Do not mention their past performance directly. Just give the tip.`;
                    }
                }

                const response = await ai.models.generateContent({ 
                    model: 'gemini-2.5-flash', 
                    contents: prompt,
                });
                if (response.text) {
                    setOwlTip(response.text.replace(/"/g, ''));
                }
            } catch (error) { 
                console.error("Failed to fetch owl tip, using default:", error);
            } finally {
                setIsTipLoading(false);
            }
        };
        fetchTip();
    }, [history]);
    
    const achievements = useMemo(() => calculateAchievements(history), [history]);
    const { level, levelName, progressPercent } = useMemo(() => calculateLevelAndXP(history, achievements), [history, achievements]);
    const averageScore = useMemo(() => history.length === 0 ? 0 : Math.round(history.reduce((sum, report) => sum + Number(report.overallScore), 0) / history.length), [history]);
    const streak = useMemo(() => calculateStreak(history), [history]);
    const activeGoals = useMemo(() => trackableGoals.filter(g => !g.isCompleted).slice(0, 3), [trackableGoals]);

    const recommendedExercises = useMemo(() => history.length > 0 ? getPersonalizedRecommendations(history[0], userGoals) : DEFAULT_EXERCISES, [history, userGoals]);
    const exerciseColors = { teal: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-500' }, red: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-500' }, purple: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-500' }, blue: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-500' }, green: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-500' }, yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-500' }, orange: { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-500' } };
    
    const todaysChallenge = useMemo(() => {
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
    }, []);

    return (
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500 to-primary p-6 shadow-lg animate-fade-in text-white">
                <div className="relative z-10">
                    <h2 className="font-heading text-3xl font-bold">{getGreeting()}, {userName}!</h2>
                    <p className="mt-1 text-lg text-white/80">Ready to continue your journey to confident speaking?</p>
                    
                    <div className="mt-6 flex items-start gap-4 rounded-lg bg-black/20 p-4 backdrop-blur-sm border border-white/10">
                        <img className="h-12 w-12 flex-shrink-0" alt="Friendly owl mascot" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2vhxj0qCuHMMSbAiZMakCRI-A3hSgSIRaYrPpBIFwwoOEyrXilW1tn1V2yxu8qvjxbb4Gld6_JYCbpqZNjK2DZVGOD9mvtoSlFH8zQDW83bF0D2C6LQzn7EJ-x7O30CaSS0S1zCZmUVmKrXnVC6P-WcQuW0x8w5-JdQwPOPdu3k3xQBT3HxmGekjJ3u-TTcIxO_PHBnL0CgBf5420nKA02HT-tZDAQnQlJogEPUhF2Vlp5mEN-QBzjZxSf_Cej8tIjYdM4zjZQO4" />
                        <div className="flex-grow">
                            <p className="text-sm font-bold text-white/90">A tip from Oratora:</p>
                            {isTipLoading ? (
                                <div className="flex items-center h-5 mt-1"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div></div>
                            ) : (
                                <p className="text-sm font-medium text-white/90">"{owlTip}"</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {hasReachedFreeLimit && (
                <div className="p-4 bg-mustard/20 border border-mustard rounded-xl flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-mustard">Free Analyses Limit Reached</h3>
                        <p className="text-sm text-mustard/80">You've used your {freeAnalysesLimit}/{freeAnalysesLimit} free analyses for the month. Upgrade to Pro for unlimited reports.</p>
                    </div>
                    <button onClick={onNavigateToBilling} className="px-4 py-2 bg-mustard text-black font-bold rounded-lg whitespace-nowrap hover:bg-mustard/80 transition-colors">Upgrade Now</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <StatCard icon="event_repeat" label="Total Sessions" value={history.length} colorClass="text-purple-500 bg-purple-100 dark:bg-purple-900/50" />
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <StatCard icon="military_tech" label="Average Score" value={`${averageScore}%`} colorClass="text-blue-500 bg-blue-100 dark:bg-blue-900/50" />
                </div>
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <StatCard icon="local_fire_department" label="Current Streak" value={`${streak} Days`} colorClass="text-orange-500 bg-orange-100 dark:bg-orange-900/50" />
                </div>
            </div>

            <div className="rounded-xl bg-card-light p-4 shadow-sm dark:bg-card-dark animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <div className="flex justify-between text-sm font-semibold mb-2">
                    <p className="text-text-primary-light dark:text-text-primary-dark">Level {level}: {levelName}</p>
                    <p className="text-primary">{progressPercent}% to next level</p>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-background-light dark:bg-background-dark">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <ActionCard 
                    icon="record_voice_over" 
                    title="Live Practice Session" 
                    description="Get real-time feedback from your AI coach in a simulated environment." 
                    buttonText={isPro || isTrial ? "Start Live Practice" : "Upgrade to Pro"}
                    onClick={isPro || isTrial ? () => onNavigateToLivePractice() : onNavigateToBilling}
                    colorClass="text-teal-500" 
                />
                <ActionCard 
                    icon="upload_file" 
                    title="Analyze a Recording" 
                    description="Upload a pre-recorded audio or video file for a detailed analysis report." 
                    buttonText="Analyze Now" 
                    onClick={onNavigateToNewAnalysis} 
                    colorClass="text-accent"
                    disabled={hasReachedFreeLimit}
                    disabledText="Limit Reached"
                />
                <ChallengeCard challenge={todaysChallenge} onStart={onNavigateToLivePractice} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <PerformanceSnapshotCard history={history} />
                    
                    <div className="flex flex-col gap-6">
                        <h3 className="font-heading text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Recent Sessions</h3>
                         {history.length > 0 ? (
                            <div className="flex flex-col gap-4">
                                {history.slice(0, 2).map((session) => (
                                    <a key={session.sessionDate} onClick={() => onViewReport(session)} className="group flex cursor-pointer items-center gap-4 rounded-xl bg-card-light p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-primary/5 dark:bg-card-dark dark:hover:bg-primary/10">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><span className="material-symbols-outlined text-2xl">history</span></div>
                                        <div className="flex-grow">
                                            <p className="font-heading font-semibold">{session.title}</p>
                                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{getRelativeDate(session.sessionDate)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Score</p>
                                            <p className={`font-semibold ${Number(session.overallScore) >= 70 ? 'text-teal-500' : 'text-accent'}`}>{session.overallScore}/100</p>
                                        </div>
                                        <span className="material-symbols-outlined ml-4 text-text-secondary-light transition-transform duration-200 group-hover:translate-x-1">arrow_forward_ios</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                             <div className="text-center p-8 bg-card-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark">
                                <span className="material-symbols-outlined text-5xl text-primary mb-2">history</span>
                                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">No sessions yet</p>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">Your past analysis reports will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-card-light p-6 dark:border-border-dark dark:bg-card-dark">
                        <div className="flex justify-between items-center">
                            <h3 className="font-heading text-lg font-bold">Focus on Your Goals</h3>
                            <button onClick={onNavigateToGoals} className="text-sm font-semibold text-primary hover:underline">Manage Goals</button>
                        </div>
                        {activeGoals.length > 0 ? (
                            <ul className="space-y-4">
                                {activeGoals.map(goal => {
                                    const progressPercent = goal.target > 0 ? (goal.progress / goal.target) * 100 : 0;
                                    return (
                                        <li key={goal.id}>
                                            <div className="flex justify-between items-center text-sm font-semibold mb-1">
                                                <p className="flex items-center gap-2 text-text-light dark:text-text-dark">
                                                    <span className="material-symbols-outlined text-primary !text-base">{goal.icon}</span>
                                                    <span>{goal.title}</span>
                                                </p>
                                                <p className="text-text-secondary-light dark:text-text-secondary-dark">{goal.progress}/{goal.target} {goal.unit}</p>
                                            </div>
                                            <div className="h-2 w-full bg-background-light dark:bg-background-dark rounded-full">
                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: `${progressPercent}%`}}></div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                             <>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">You have no active goals. Set a new goal to start tracking your progress!</p>
                                <button onClick={onNavigateToGoals} className="mt-2 text-sm font-semibold text-primary hover:underline self-start">Set a Goal</button>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        <div><h3 className="font-heading text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">Recommended Exercises</h3>{history.length > 0 && (<p className="text-sm text-text-secondary-light dark:text-text-secondary-dark -mt-1">Tailored for you based on your latest session.</p>)}</div>
                        <div className="flex flex-col gap-4">{recommendedExercises.map(exercise => { const colorClass = exerciseColors[exercise.color as keyof typeof exerciseColors] || exerciseColors.teal; return (<div key={exercise.title} className="flex cursor-pointer items-center gap-4 rounded-xl bg-card-light p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:bg-card-dark"><div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg ${colorClass.bg}`}><span className={`material-symbols-outlined text-3xl ${colorClass.text}`}>{exercise.icon}</span></div><div className="flex-grow"><p className="font-heading font-bold">{exercise.title}</p><p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{exercise.description}</p></div></div>); })}</div>
                    </div>
                    
                    <div className="flex flex-col gap-4 rounded-xl border border-border-light bg-card-light p-6 dark:border-border-dark dark:bg-card-dark">
                        <h3 className="font-heading text-lg font-bold">Your Badge Collection</h3>
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">{achievements.map(ach => (<AchievementBadge key={ach.id} achievement={ach} />))}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;