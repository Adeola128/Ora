import React, { useState, useEffect, useRef } from 'react';
import { Achievement } from '../types';

interface AchievementBadgeProps {
    achievement: Achievement;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement }) => {
    const { unlocked, progress = 0, target = 1 } = achievement;
    const [isAnimating, setIsAnimating] = useState(false);
    const prevUnlockedRef = useRef(unlocked);

    useEffect(() => {
        if (unlocked && !prevUnlockedRef.current) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 600); // Duration should match transition
            return () => clearTimeout(timer);
        }
        prevUnlockedRef.current = unlocked;
    }, [unlocked]);
    
    const progressPercent = unlocked ? 100 : Math.min(100, (progress / target) * 100);
    
    const radius = 26;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;

    return (
        <div className="relative group flex flex-col items-center text-center gap-2 w-20">
            <div className={`
                relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
                ${unlocked ? 'bg-primary/10 cursor-pointer hover:scale-110' : 'bg-slate-100 dark:bg-slate-700'}
                ${isAnimating ? 'scale-125 ring-4 ring-primary/50' : ''}
            `}>
                {/* Progress Circle for locked achievements */}
                {!unlocked && progress > 0 && target > 1 && (
                    <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                        <circle className="text-border-light dark:text-border-dark" strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx="30" cy="30" />
                        <circle
                            className="text-primary"
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r={radius}
                            cx="30"
                            cy="30"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                        />
                    </svg>
                )}
                <span className={`material-symbols-outlined text-4xl z-10 transition-colors ${unlocked ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                    {unlocked ? achievement.icon : 'lock'}
                </span>
            </div>
            <p className={`
                text-xs font-semibold w-full truncate transition-colors
                ${unlocked ? 'text-text-light dark:text-text-dark' : 'text-text-muted-light dark:text-text-muted-dark'}
                ${isAnimating ? 'text-primary' : ''}
            `}>
                {achievement.name}
            </p>
            {/* Popover remains the same as it already shows progress */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 bg-card-light dark:bg-card-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-20 group-hover:delay-200 transform scale-95 group-hover:scale-100 origin-bottom">
                <h4 className="font-bold text-text-light dark:text-text-dark">{achievement.name}</h4>
                <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">{achievement.description}</p>
                
                {unlocked ? (
                    <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-green-500">
                        <span className="material-symbols-outlined !text-base">check_circle</span>
                        Unlocked
                    </div>
                ) : (
                    target > 1 && (
                        <div className="mt-3">
                            <div className="flex justify-between items-center text-xs text-text-muted-light dark:text-text-muted-dark mb-1">
                                <span>Progress</span>
                                <span className="font-semibold">{progress} / {target}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>
                    )
                )}
                
                <svg className="absolute text-white dark:text-[#1a3835] h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255">
                    <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                </svg>
            </div>
        </div>
    );
};

export default AchievementBadge;