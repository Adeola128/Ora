import React from 'react';

interface StreakTrackerProps {
    streak: number;
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ streak }) => {
    const getMessage = () => {
        if (streak === 0) return "Start your first session!";
        if (streak === 1) return "First day down, keep going!";
        if (streak < 5) return "Great consistency!";
        if (streak < 10) return "You're on a roll!";
        return "Incredible dedication!";
    };

    return (
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md h-full flex flex-col items-center justify-center text-center">
            <div className={`relative w-24 h-24 flex items-center justify-center rounded-full ${streak > 0 ? 'bg-orange-100 dark:bg-orange-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <span className={`material-symbols-outlined text-6xl transition-colors ${streak > 0 ? 'text-orange-500' : 'text-slate-400'}`}>
                    local_fire_department
                </span>
                {streak > 1 && (
                     <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold border-2 border-card-light dark:border-card-dark">
                        {streak}
                    </div>
                )}
            </div>
            <h3 className="text-xl font-bold mt-4 text-text-light dark:text-text-dark">Practice Streak</h3>
            <p className="text-text-muted-light dark:text-text-muted-dark text-sm">{getMessage()}</p>
        </div>
    );
};

export default StreakTracker;