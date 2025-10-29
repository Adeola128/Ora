import React, { useState } from 'react';
import { AnalysisReport, UserGoals, User } from '../types';
import AchievementBadge from './AchievementBadge';
import ShareButton from './ShareButton';
import { calculateAchievements, calculateLevelAndXP, calculateStreak } from './lib/gamification';
import ShareProgressModal from './ShareProgressModal';

interface ProgressPageProps {
    user: User | null;
    history: AnalysisReport[];
    userGoals: UserGoals;
    onNavigateToGoals: () => void;
    onViewReport: (report: AnalysisReport) => void;
    onNavigateToNewAnalysis: () => void;
}

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#06f9e0' }) => {
    if (data.length < 2) return <div className="h-10 w-24 text-xs text-text-muted-light dark:text-text-muted-dark flex items-center justify-center">Not enough data</div>;

    const width = 96;
    const height = 40;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * (height - 4) + 2;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');
    
    const lastPoint = points.split(' ').pop()?.split(',');
    const lastX = lastPoint ? parseFloat(lastPoint[0]) : 0;
    const lastY = lastPoint ? parseFloat(lastPoint[1]) : 0;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-10 overflow-visible">
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
            <circle cx={lastX} cy={lastY} r="2.5" fill="white" stroke={color} strokeWidth="1.5" />
        </svg>
    );
};

const SkillInsight: React.FC<{ icon: string; name: string; score: number; previousScore: number; color: string; animationDelay: string; }> = ({ icon, name, score, previousScore, color, animationDelay }) => {
    const change = score - previousScore;
    return (
        <div className="flex items-center gap-4 animate-fade-in-up p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border-light dark:border-border-dark" style={{ animationDelay }}>
            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${color.replace('text-','bg-')}/10`}>
                <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-text-light dark:text-text-dark">{name}</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-text-light dark:text-text-dark">{score}</span>
                        <span className={`text-xs font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change > 0 ? '▲' : change < 0 ? '▼' : ''} {Math.abs(change)}
                        </span>
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 h-full rounded-full ${color.replace('text-','bg-')}/30`} style={{ width: `${previousScore}%` }}></div>
                    <div className={`absolute top-0 left-0 h-full rounded-full ${color.replace('text-','bg-')} animate-fill-bar`} style={{ width: `${score}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const EmptyState: React.FC<{ onStartAnalysis: () => void }> = ({ onStartAnalysis }) => (
    <div className="text-center p-12 bg-card-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark animate-fade-in">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">rocket_launch</span>
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Your Journey Begins Now!</h2>
        <p className="mt-2 text-text-muted-light dark:text-text-muted-dark max-w-md mx-auto">You haven't completed any sessions yet. Analyze your first speech to unlock your progress dashboard and start tracking your growth.</p>
        <button onClick={onStartAnalysis} className="mt-6 flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-8 bg-primary text-white text-base font-bold transition-transform hover:scale-105 shadow-lg shadow-primary/30 mx-auto">
             <span className="material-symbols-outlined mr-2">add_chart</span>
             Start Your First Analysis
        </button>
    </div>
);


const ProgressPage: React.FC<ProgressPageProps> = ({ user, history, userGoals, onViewReport, onNavigateToGoals, onNavigateToNewAnalysis }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    if (history.length === 0) {
        return (
            <main className="flex-1 p-4 md:p-8 w-full animate-fade-in">
                 <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Progress Dashboard</h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Review your journey and celebrate your milestones.</p>
                    </div>
                </header>
                <EmptyState onStartAnalysis={onNavigateToNewAnalysis} />
            </main>
        )
    }

    const latestReport = history[0];
    const previousReport = history.length > 1 ? history[1] : null;
    
    const currentStreak = calculateStreak(history);
    const achievements = calculateAchievements(history);
    const levelData = calculateLevelAndXP(history, achievements);

    const calculateOverallImprovement = (history: AnalysisReport[]) => {
        if (history.length < 2) return null;
        const firstScore = Number(history[history.length - 1].overallScore);
        const latestScore = Number(history[0].overallScore);
        if (firstScore === 0) return latestScore > 0 ? 100.0 : 0.0;
        const improvement = ((latestScore - firstScore) / firstScore) * 100;
        return parseFloat(improvement.toFixed(1));
    };
    const overallImprovement = calculateOverallImprovement(history);
    
    const skillsData = [
        { name: 'Pacing', icon: 'speed', key: 'pacing', color: 'text-blue-500' },
        { name: 'Clarity', icon: 'lightbulb', key: 'fluency', color: 'text-yellow-500' }, 
        { name: 'Confidence', icon: 'sentiment_satisfied', key: 'sentiment', color: 'text-green-500' },
        { name: 'Intonation', icon: 'graphic_eq', key: 'intonation', color: 'text-purple-500' },
    ];
    
    const getFillersPerMinute = (report: AnalysisReport): number => {
        const fillerCountMatch = report.metrics.fluency.details?.match(/\d+/);
        const fillerCount = fillerCountMatch ? parseInt(fillerCountMatch[0], 10) : 0;
        const durationInMinutes = report.durationSeconds > 0 ? report.durationSeconds / 60 : 1;
        return parseFloat((fillerCount / durationInMinutes).toFixed(1));
    };

    const getTrendData = (metricKey: 'pacingWPM' | 'fillerWordsPerMinute' | 'clarityScore'): number[] => {
        if (history.length < 2) return [];
        const trendHistory = history.slice(0, 5).reverse(); // Oldest to newest
        switch(metricKey) {
            case 'pacingWPM':
                return trendHistory.map(r => r.metrics.pacing.score);
            case 'fillerWordsPerMinute':
                return trendHistory.map(getFillersPerMinute);
            case 'clarityScore':
                return trendHistory.map(r => r.metrics.fluency.score);
            default:
                return [];
        }
    }

    const getGoalStatus = (metricKey: 'pacingWPM' | 'fillerWordsPerMinute' | 'clarityScore') => {
        const goal = userGoals.targetMetrics[metricKey];
        if (!goal.enabled || !latestReport) {
            return {
                enabled: goal.enabled,
                progress: 0,
                currentValue: "N/A",
                targetValue: goal.value,
                statusText: "Not Set",
                statusColor: "bg-gray-400",
                trendData: []
            };
        }

        let currentValue: number;
        let progress: number;
        let statusText: string;
        let statusColor: string;
        const trendData = getTrendData(metricKey);

        switch (metricKey) {
            case 'pacingWPM':
                currentValue = latestReport.metrics.pacing.score;
                const idealRange = [goal.value - 10, goal.value + 10];
                if (currentValue >= idealRange[0] && currentValue <= idealRange[1]) {
                    statusText = "On Track";
                    statusColor = "text-green-500";
                    progress = 100;
                } else {
                    statusText = "Needs Work";
                    statusColor = "text-yellow-500";
                    progress = 50;
                }
                break;
            case 'fillerWordsPerMinute':
                currentValue = getFillersPerMinute(latestReport);
                if (currentValue <= goal.value) {
                    statusText = "Goal Met";
                    statusColor = "text-green-500";
                    progress = 100;
                } else {
                    statusText = "Needs Work";
                    statusColor = "text-yellow-500";
                    progress = Math.max(0, (1 - (currentValue - goal.value) / (goal.value * 2)) * 100);
                }
                break;
            case 'clarityScore':
                currentValue = latestReport.metrics.fluency.score;
                if (currentValue >= goal.value) {
                    statusText = "Goal Met";
                    statusColor = "text-green-500";
                    progress = 100;
                } else {
                    statusText = "Needs Work";
                    statusColor = "text-yellow-500";
                    progress = Math.min(100, (currentValue / goal.value) * 100);
                }
                break;
        }

        return { enabled: true, progress, currentValue, targetValue: goal.value, statusText, statusColor, trendData };
    };

    const goalsData = [
        { key: 'pacingWPM' as const, title: 'Pacing', icon: 'speed', unit: 'WPM', color: '#3b82f6'},
        { key: 'fillerWordsPerMinute' as const, title: 'Filler Words', icon: 'chat_error', unit: '/min', color: '#f59e0b'},
        { key: 'clarityScore' as const, title: 'Clarity', icon: 'lightbulb', unit: '%', color: '#10b981'},
    ];
    
    const chartData = history.slice(0, 5).map(h => ({score: h.overallScore, date: new Date(h.sessionDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})})).reverse();
    const chartPoints = chartData.map((data, index) => {
        const x = (index / (chartData.length - 1 || 1)) * 100;
        const y = 100 - Number(data.score);
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <>
        <main className="flex-1 p-4 md:p-8 w-full animate-fade-in">
            <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Your Journey of Growth</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-1">Review your journey, celebrate your milestones, and plan your next steps.</p>
                </div>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsShareModalOpen(true)} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-teal-500 text-white text-base font-bold transition-transform hover:scale-105 shadow-lg shadow-teal-500/30">
                        <span className="material-symbols-outlined mr-2">image</span>
                        <span className="truncate">Create Share Image</span>
                    </button>
                    <button onClick={onNavigateToGoals} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold transition-transform hover:scale-105 shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined mr-2">edit</span>
                        <span className="truncate">Manage Goals</span>
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Overall Score Trend</h2>
                        <div className="h-64 relative">
                            {chartData.length > 1 ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#06f9e0" stopOpacity="0.3" />
                                            <stop offset="100%" stopColor="#06f9e0" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    <polyline fill="url(#chartGradient)" points={`0,100 ${chartPoints} 100,100`} />
                                    <polyline fill="none" stroke="#06f9e0" strokeWidth="2" points={chartPoints} />
                                    {chartData.map((data, index) => {
                                        const x = (index / (chartData.length - 1 || 1)) * 100;
                                        const y = 100 - Number(data.score);
                                        return (
                                            <g key={index} className="group cursor-pointer">
                                                <circle cx={x} cy={y} r="4" fill="white" stroke="#06f9e0" strokeWidth="2" className="group-hover:r-6 transition-all" />
                                                <foreignObject x={x-50} y={y-40} width="100" height="30" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <div className="bg-slate-800 text-white text-xs rounded-md px-2 py-1 shadow-lg text-center">{data.score}% on {data.date}</div>
                                                </foreignObject>
                                            </g>
                                        )
                                    })}
                                </svg>
                            ) : (
                                <div className="flex items-center justify-center h-full text-text-muted-light dark:text-text-muted-dark text-sm">Not enough data for a trend line.</div>
                            )}
                        </div>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Progress Towards Your Goals</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {goalsData.map(goalInfo => {
                                const data = getGoalStatus(goalInfo.key);
                                const radius = 52;
                                const circumference = 2 * Math.PI * radius;
                                const offset = circumference - (data.progress / 100) * circumference;

                                if (!data.enabled) return null;

                                return (
                                     <div key={goalInfo.key} className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-text-light dark:text-text-dark">{goalInfo.title}</h3>
                                                <p className={`text-sm font-semibold ${data.statusColor}`}>{data.statusText}</p>
                                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-4">Latest: <span className="font-bold text-text-light dark:text-text-dark">{data.currentValue}{goalInfo.unit}</span></p>
                                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Target: {goalInfo.key === 'fillerWordsPerMinute' ? '<' : goalInfo.key === 'clarityScore' ? '>' : '≈'} {data.targetValue}{goalInfo.unit}</p>
                                            </div>
                                             <div className="relative w-32 h-32 flex-shrink-0">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                                                    <circle className="text-slate-200 dark:text-slate-700" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                                                    <circle
                                                        strokeWidth="10"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={offset}
                                                        strokeLinecap="round"
                                                        stroke="currentColor"
                                                        fill="transparent"
                                                        r={radius}
                                                        cx="60"
                                                        cy="60"
                                                        className="transition-all duration-500"
                                                        style={{color: goalInfo.color}}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Sparkline data={data.trendData} color={goalInfo.color} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">Skill Evolution</h2>
                        <div className="space-y-4">
                            {skillsData.map((skill, index) => {
                                const latestScore = latestReport ? Number(latestReport.metrics[skill.key as keyof typeof latestReport.metrics].score) : 0;
                                const previousScore = previousReport ? Number(previousReport.metrics[skill.key as keyof typeof latestReport.metrics].score) : latestScore;
                                return (
                                    <SkillInsight 
                                        key={skill.name} icon={skill.icon} name={skill.name}
                                        score={latestScore} previousScore={previousScore}
                                        color={skill.color} animationDelay={`${index * 100}ms`}
                                    />
                                );
                            })}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-6">
                        <div className="rounded-2xl p-6 text-white bg-gradient-to-br from-primary to-teal-400 dark:from-primary/80 dark:to-teal-500 shadow-lg shadow-primary/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm opacity-80">Level {levelData.level}</p>
                                    <p className="text-2xl font-bold">{levelData.levelName}</p>
                                </div>
                                <span className="material-symbols-outlined text-4xl opacity-50">workspace_premium</span>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-xs font-medium mb-1">
                                    <span>{levelData.currentLevelXp.toLocaleString()} / {levelData.xpForNextLevel.toLocaleString()} XP</span>
                                    <span>{levelData.progressPercent}%</span>
                                </div>
                                <div className="w-full bg-white/20 rounded-full h-2.5">
                                    <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${levelData.progressPercent}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                             <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-md flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-500/10">
                                    <span className="material-symbols-outlined text-3xl text-orange-500">local_fire_department</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-text-light dark:text-text-dark">Current Streak</p>
                                    <p className="text-lg font-bold text-text-muted-light dark:text-text-muted-dark">{currentStreak} Days</p>
                                </div>
                            </div>
                            <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-md flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-500/10">
                                    <span className="material-symbols-outlined text-3xl text-purple-500">event_repeat</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-text-light dark:text-text-dark">Total Sessions</p>
                                    <p className="text-lg font-bold text-text-muted-light dark:text-text-muted-dark">{history.length}</p>
                                </div>
                            </div>
                            <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-md flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-500/10">
                                    <span className="material-symbols-outlined text-3xl text-green-500">trending_up</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-text-light dark:text-text-dark">Overall Improvement</p>
                                    <p className={`text-lg font-bold ${overallImprovement === null ? 'text-text-muted-light dark:text-text-muted-dark' : overallImprovement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {overallImprovement !== null ? `${overallImprovement >= 0 ? '+' : ''}${overallImprovement}%` : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md">
                             <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Achievements</h2>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                                {achievements.map(ach => (
                                    <AchievementBadge key={ach.id} achievement={ach} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        {isShareModalOpen && (
            <ShareProgressModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                user={user}
                levelData={levelData}
                streak={currentStreak}
                achievements={achievements}
            />
        )}
        </>
    );
};

export default ProgressPage;