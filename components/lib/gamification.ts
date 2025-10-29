

import { AnalysisReport, Achievement, Challenge, TrackableGoal, GoalMetric } from '../../types';

// Expanded achievement definitions
const POTENTIAL_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'progress' | 'target'>[] = [
    { id: 'first_session', name: 'Ice Breaker', description: 'Complete your first session.', icon: 'flag' },
    { id: 'high_score', name: 'High Achiever', description: 'Score 90% or higher in any session.', icon: 'military_tech' },
    { id: 'five_sessions', name: 'Consistent', description: 'Complete 5 sessions.', icon: 'event_repeat' },
    { id: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day practice streak.', icon: 'local_fire_department' },
    { id: 'ten_sessions', name: 'Dedicated Learner', description: 'Complete 10 sessions.', icon: 'event_repeat' },
    { id: 'twenty_sessions', name: 'Veteran Speaker', description: 'Complete 20 sessions.', icon: 'school' },
    { id: 'streak_7', name: 'Week-Long Warrior', description: 'Maintain a 7-day practice streak.', icon: 'calendar_month' },
    { id: 'pacing_pro', name: 'Pacing Pro', description: 'Score above 85 in Pacing in 3 sessions.', icon: 'speed' },
    { id: 'clarity_champ', name: 'Clarity Champion', description: 'Score above 85 in Fluency in 3 sessions.', icon: 'lightbulb' },
    { id: 'filler_word_ninja', name: 'Filler Word Ninja', description: 'Have fewer than 2 filler words per minute in a session.', icon: 'stealth' },
    { id: 'perfect_score', name: 'Flawless Delivery', description: 'Achieve a 100% overall score in a session.', icon: 'workspace_premium' },
    { id: 'first_live_session', name: 'Live Debut', description: 'Complete your first Live Practice session.', icon: 'podcasts' },
];

// XP rewards for each achievement
export const XP_MAP: { [key: string]: number } = {
    first_session: 50,
    high_score: 100,
    five_sessions: 150,
    streak_3: 75,
    ten_sessions: 200,
    twenty_sessions: 400,
    streak_7: 150,
    pacing_pro: 100,
    clarity_champ: 100,
    filler_word_ninja: 75,
    perfect_score: 500,
    first_live_session: 125,
};

// Expanded level definitions
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000, 5000];
export const LEVEL_NAMES = ['Newcomer', 'Beginner', 'Apprentice', 'Speaker', 'Communicator', 'Orator', 'Virtuoso', 'Master', 'Champion', 'Legend'];


/**
 * Calculates the user's current practice streak based on session history.
 * @param history Array of analysis reports.
 * @returns The current streak in days.
 */
export const calculateStreak = (history: AnalysisReport[]): number => {
    if (history.length === 0) return 0;
    
    // Get unique dates (day-start timestamps) from history, sorted descending.
    const sessionDates = [...new Set(history.map(h => {
        const date = new Date(h.sessionDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }))].sort((a, b) => b - a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const mostRecentSessionDate = sessionDates[0];

    // If the last session wasn't today or yesterday, streak is broken.
    if (mostRecentSessionDate !== today.getTime() && mostRecentSessionDate !== yesterday.getTime()) {
        return 0;
    }

    let streak = 1;
    let lastDate = mostRecentSessionDate;

    // Iterate through the rest of the unique dates
    for (let i = 1; i < sessionDates.length; i++) {
        const currentDate = sessionDates[i];
        const expectedPreviousDate = new Date(lastDate);
        expectedPreviousDate.setDate(expectedPreviousDate.getDate() - 1);

        if (currentDate === expectedPreviousDate.getTime()) {
            streak++;
            lastDate = currentDate;
        } else {
            // Gap in dates, streak ends.
            break;
        }
    }
    
    return streak;
};

/**
 * Determines which achievements the user has unlocked based on their history.
 * @param history Array of analysis reports.
 * @returns An array of all possible achievements with their current unlocked status.
 */
export const calculateAchievements = (history: AnalysisReport[]): Achievement[] => {
    const streak = calculateStreak(history);
    const totalSessions = history.length;

    // Pre-calculate complex conditions
    const sessionsWithPacingPro = history.filter(r => r.metrics.pacing.score > 85).length;
    const sessionsWithClarityChamp = history.filter(r => r.metrics.fluency.score > 85).length;
    
    const hasFewFillerWords = history.some(r => {
        const fillerCountMatch = r.metrics.fluency.details?.match(/(\d+)\s+filler/i);
        const fillerCount = fillerCountMatch ? parseInt(fillerCountMatch[1], 10) : 0;
        const durationInMinutes = r.durationSeconds > 0 ? r.durationSeconds / 60 : 1;
        return (fillerCount / durationInMinutes) < 2;
    });

    const hasPerfectScore = history.some(r => Number(r.overallScore) >= 100);
    const hasLiveSession = history.some(r => r.title.toLowerCase().includes('live practice'));

    return POTENTIAL_ACHIEVEMENTS.map(ach => {
        let unlocked = false;
        let progress: number | undefined = undefined;
        let target: number | undefined = undefined;

        switch (ach.id) {
            case 'first_session': 
                progress = Math.min(totalSessions, 1);
                target = 1;
                unlocked = progress >= target; 
                break;
            case 'high_score': 
                unlocked = history.some(r => Number(r.overallScore) >= 90); 
                progress = unlocked ? 1 : 0;
                target = 1;
                break;
            case 'five_sessions': 
                progress = Math.min(totalSessions, 5);
                target = 5;
                unlocked = progress >= target; 
                break;
            case 'ten_sessions':
                progress = Math.min(totalSessions, 10);
                target = 10;
                unlocked = progress >= target;
                break;
            case 'twenty_sessions':
                progress = Math.min(totalSessions, 20);
                target = 20;
                unlocked = progress >= target;
                break;
            case 'streak_3': 
                progress = Math.min(streak, 3);
                target = 3;
                unlocked = progress >= target; 
                break;
            case 'streak_7':
                progress = Math.min(streak, 7);
                target = 7;
                unlocked = progress >= target;
                break;
            case 'pacing_pro':
                progress = Math.min(sessionsWithPacingPro, 3);
                target = 3;
                unlocked = progress >= target;
                break;
            case 'clarity_champ':
                progress = Math.min(sessionsWithClarityChamp, 3);
                target = 3;
                unlocked = progress >= target;
                break;
            case 'filler_word_ninja':
                progress = hasFewFillerWords ? 1 : 0;
                target = 1;
                unlocked = hasFewFillerWords;
                break;
            case 'perfect_score':
                progress = hasPerfectScore ? 1 : 0;
                target = 1;
                unlocked = hasPerfectScore;
                break;
            case 'first_live_session':
                progress = hasLiveSession ? 1 : 0;
                target = 1;
                unlocked = hasLiveSession;
                break;
        }
        return { ...ach, unlocked, progress, target };
    });
};

/**
 * Calculates the user's total XP, current level, and progress towards the next level.
 * @param history Array of analysis reports.
 * @param achievements Array of the user's unlocked achievements.
 * @returns An object containing detailed level and XP information.
 */
export const calculateLevelAndXP = (history: AnalysisReport[], achievements: Achievement[]) => {
    const historyXp = history.reduce((sum, report) => sum + Math.round(Number(report.overallScore)), 0);
    const achievementXp = achievements
        .filter(a => a.unlocked)
        .reduce((sum, ach) => sum + (XP_MAP[ach.id] || 0), 0);
    const totalXp = historyXp + achievementXp;

    let level = 1;
    while (level < LEVEL_THRESHOLDS.length && totalXp >= LEVEL_THRESHOLDS[level]) {
        level++;
    }

    const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextLevelThreshold = LEVEL_THRESHOLDS[level] || (currentLevelThreshold + 1000); // Handle max level

    const xpIntoLevel = totalXp - currentLevelThreshold;
    const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold;
    const progressPercent = xpNeededForLevel > 0 ? Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100)) : 100;

    return {
        level,
        levelName: LEVEL_NAMES[level - 1] || 'Legend',
        currentLevelXp: xpIntoLevel,
        xpForNextLevel: xpNeededForLevel,
        progressPercent,
        totalXp,
    };
};

// New section for challenges
export const CHALLENGES: Challenge[] = [
    {
        id: 'weekly_pacing',
        title: 'Weekly Pacing Challenge',
        description: 'Complete one session this week with a pace between 140-160 WPM.',
        icon: 'speed',
        reward: '+50 XP',
        isCompleted: (history: AnalysisReport[]) => {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return history.some(r => 
                new Date(r.sessionDate) > oneWeekAgo &&
                r.metrics.pacing.score >= 140 &&
                r.metrics.pacing.score <= 160
            );
        }
    },
    {
        id: 'clarity_quest',
        title: 'Clarity Quest',
        description: 'Achieve a Fluency score of 90% or higher in your next session.',
        icon: 'lightbulb',
        reward: '+75 XP',
        isCompleted: (history: AnalysisReport[]) => {
            if (history.length === 0) return false;
            // Checks if the LATEST session meets the criteria
            return history[0].metrics.fluency.score >= 90;
        }
    },
    {
        id: 'weekend_warrior',
        title: 'Weekend Warrior',
        description: 'Complete two practice sessions over the weekend (Saturday or Sunday).',
        icon: 'calendar_view_week',
        reward: '+100 XP',
        isCompleted: (history: AnalysisReport[]) => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0=Sun, 6=Sat
            if (dayOfWeek !== 0 && dayOfWeek !== 6) return false; // Only check on weekends

            const weekendSessions = history.filter(r => {
                const sessionDate = new Date(r.sessionDate);
                const sessionDay = sessionDate.getDay();
                return sessionDay === 0 || sessionDay === 6;
            });
            // Get unique days
            const uniqueWeekendDays = new Set(weekendSessions.map(s => new Date(s.sessionDate).toDateString()));
            return uniqueWeekendDays.size >= 2;
        }
    }
];


// --- Goal Processing ---

const getMetricValueFromReport = (metric: GoalMetric, report: AnalysisReport): number => {
    switch (metric) {
        case 'overallScore':
            return report.overallScore;
        case 'pacing':
            return report.metrics.pacing.score;
        case 'fluency':
            return report.metrics.fluency.score;
        case 'intonation':
            return report.metrics.intonation.score;
        case 'sentiment':
            return report.metrics.sentiment.score;
        case 'fillerWordsPerMinute': {
            const fillerCountMatch = report.metrics.fluency.details?.match(/(\d+)\s+filler/i);
            const fillerCount = fillerCountMatch ? parseInt(fillerCountMatch[0], 10) : 0;
            const durationInMinutes = report.durationSeconds > 0 ? report.durationSeconds / 60 : 1;
            return parseFloat((fillerCount / durationInMinutes).toFixed(1));
        }
        default:
            return 0;
    }
};

export const processGoalsWithNewReport = (
    goals: TrackableGoal[],
    report: AnalysisReport
): { updatedGoals: TrackableGoal[]; newlyCompleted: TrackableGoal[] } => {
    const newlyCompleted: TrackableGoal[] = [];

    const updatedGoals = goals.map(goal => {
        // Don't update completed or manual goals
        if (goal.isCompleted || goal.trackingType === 'manual') {
            return goal;
        }
        
        // Check for required auto-tracking fields
        if (!goal.metric || !goal.condition || goal.metricTarget === undefined || goal.metricTarget === null) {
            console.warn("Skipping automatic goal due to missing fields:", goal);
            return goal;
        }

        const currentValue = getMetricValueFromReport(goal.metric, report);
        let conditionMet = false;

        if (goal.condition === 'above' && currentValue >= goal.metricTarget) {
            conditionMet = true;
        } else if (goal.condition === 'below' && currentValue <= goal.metricTarget) {
            conditionMet = true;
        }

        if (conditionMet) {
            const newProgress = goal.progress + 1;
            const newGoal = { ...goal, progress: newProgress };

            if (newProgress >= goal.target) {
                newGoal.isCompleted = true;
                if (!goal.isCompleted) { // Only add if it wasn't already completed
                    newlyCompleted.push(newGoal);
                }
            }
            return newGoal;
        }

        return goal;
    });

    return { updatedGoals, newlyCompleted };
};