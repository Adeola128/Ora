// Fix: Populated with necessary type definitions for the application.
export interface User {
    id: string; // Corresponds to Supabase auth.users.id (UUID)
    name: string;
    email: string;
    avatarUrl?: string;
    createdAt?: string;
    onboardingCompleted: boolean;
    referralCode?: string;
}

export type SpeakingContextType = 'presentation' | 'interview' | 'meeting' | 'keynote' | 'sales_pitch' | 'toast' | 'other';

export interface OnboardingData {
    name: string;
    speakingGoals: string[];
    selectedContext: SpeakingContextType | null;
    baselineRecording: Blob | null;
    profilePicture?: File | null;
}

export interface AnalysisContext {
    category: string;
    name: string;
    audienceSize: number;
    formality: 'Formal' | 'Semi-Formal' | 'Casual';
    duration: number;
    goals: string[];
    script?: File | null;
}

export interface TranscriptionWord {
    word: string;
    startTime: number; // in seconds
    endTime: number; // in seconds
}

export interface TranscriptionResult {
    transcript: string;
    confidence: number;
    words: TranscriptionWord[];
}

// Types for the new Analysis Report Page
export interface Metric {
    score: number;
    max?: number;
    label: string;
    unit: string;
    rating: 'good' | 'average' | 'poor' | string; // Allow string for sentiment rating
    details?: string;
    idealRange?: string;
}

export interface Feedback {
    transformativeTip: string;
    strengths: string[];
    areasToWatch: string[];
    phraseAlternatives: { original: string; suggestion: string }[];
}

export interface ActionPlanDay {
    day: number;
    task: string;
    isToday?: boolean;
}

export interface ComparisonData {
    overallScore: { previous: number; current: number };
    fluency: { communityAverage: number; userScore: number };
}

export interface TranscriptAnnotation {
    textToHighlight: string;
    type: 'strength' | 'weakness' | 'issue';
    comment: string;
}
export interface AnnotatedTranscriptSegment {
    startTime: number;
    text: string;
    annotations: TranscriptAnnotation[];
}

export interface AnalysisReport {
    title: string;
    overallScore: number;
    sessionDate: string;
    videoUrl?: string;
    durationSeconds: number;
    transcriptSegments: AnnotatedTranscriptSegment[];
    metrics: {
        fluency: Metric;
        pacing: Metric;
        pacingVariability: Metric;
        intonation: Metric;
        volume: Metric;
        sentiment: Metric;
        video?: {
            eyeContact: Metric;
            bodyLanguage: Metric;
            gestures: Metric;
        }
    };
    feedback: Feedback;
    actionPlan: ActionPlanDay[];
    comparison: ComparisonData;
}

// Types for Goal Setting and Progress Tracking
export interface TargetMetric {
    enabled: boolean;
    value: number;
}

export interface UserGoals {
    primaryGoals: string[];
    targetMetrics: {
        pacingWPM: TargetMetric;
        fillerWordsPerMinute: TargetMetric;
        clarityScore: TargetMetric;
    };
    practiceCommitment: {
        sessionsPerWeek: number;
    };
}

export type GoalMetric = 'overallScore' | 'pacing' | 'fluency' | 'fillerWordsPerMinute' | 'intonation' | 'sentiment';

export interface TrackableGoal {
    id: number | string; // number from DB, string for temp client-side goals
    title: string;
    description: string;
    icon: string; // Material Symbols icon name
    progress: number;
    target: number;
    unit: string; // e.g., 'sessions', 'weeks', '%'
    isCompleted: boolean;
    // New fields for automatic tracking
    trackingType: 'manual' | 'auto';
    metric?: GoalMetric;
    condition?: 'above' | 'below';
    metricTarget?: number;
}


// Types for Gamification
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
    target?: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    reward: string; // e.g., "+50 XP", "Special Badge"
    isCompleted: (history: AnalysisReport[]) => boolean;
}

// Types for Subscriptions
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due';

export interface UserSubscription {
    id?: string; // id is part of the type, but optional as it's not always used
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    periodEndsAt: string | null;
}

export interface Payment {
    id: number;
    createdAt: string;
    plan: SubscriptionPlan;
    amount: number;
    status: 'Paid' | 'Failed';
    providerReference: string;
}

// Types for Resource Library
export interface ContentBlock {
    type: 'heading' | 'paragraph' | 'list' | 'tip';
    text?: string;
    items?: string[];
}
export interface Resource {
    title: string;
    subtitle: string;
    icon: string;
    content: ContentBlock[];
}

// Types for Referral System
export interface Referral {
    id: number;
    referrerId: string;
    referredEmail: string | null;
    referredId: string | null;
    status: 'pending' | 'completed';
    createdAt: string;
    // Joined data from profiles table
    referredUser?: { 
        name: string | null;
        avatarUrl: string | null;
    };
}

// Types for Notification Settings
export interface NotificationSettings {
    userId: string;
    practiceReminders: boolean;
    weeklySummary: boolean;
    newFeatures: boolean;
    createdAt?: string;
    updatedAt?: string;
}