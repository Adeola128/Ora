import React, { useState } from 'react';
import { TrackableGoal, AnalysisReport } from '../types';
import GoalModal from './GoalModal';

interface GoalCardProps {
    goal: TrackableGoal;
    onEdit: (goal: TrackableGoal) => void;
    onIncrementProgress?: (goalId: string | number) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onIncrementProgress }) => {
    const progressPercent = goal.target > 0 ? Math.min(100, (goal.progress / goal.target) * 100) : 0;
    const isCompleted = goal.isCompleted;

    return (
        <div className={`bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark flex flex-col gap-4 transition-all hover:shadow-lg hover:-translate-y-1 ${isCompleted ? 'opacity-60 bg-slate-50 dark:bg-slate-800/50' : ''}`}>
            <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center rounded-full ${isCompleted ? 'bg-green-500/20 text-green-500' : 'bg-primary/20 text-primary'} size-12 shrink-0`}>
                    <span className="material-symbols-outlined text-3xl">{isCompleted ? 'check_circle' : goal.icon}</span>
                </div>
                <div className="flex-grow">
                    <p className="text-text-light dark:text-text-dark text-lg font-bold leading-tight flex items-center gap-2">
                        {goal.title}
                        {goal.trackingType === 'auto' ? (
                            <span className="material-symbols-outlined text-sm text-primary" title="Automatically tracked">smart_toy</span>
                        ) : (
                             <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark" title="Manually tracked">edit_note</span>
                        )}
                    </p>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal leading-normal">{goal.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                    {goal.trackingType === 'manual' && !goal.isCompleted && onIncrementProgress && (
                        <button
                            onClick={() => onIncrementProgress(goal.id)}
                            className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            aria-label={`Increment progress for ${goal.title}`}
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    )}
                    <button onClick={() => onEdit(goal)} className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors p-1">
                        {isCompleted ? 'View' : 'Edit'}
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
                <div className="flex justify-between items-center">
                     <p className="text-text-secondary-light dark:text-secondary-dark text-sm font-normal leading-normal">
                        {isCompleted ? 'Completed!' : `${goal.progress} / ${goal.target} ${goal.unit}`}
                    </p>
                    <p className={`text-sm font-bold ${isCompleted ? 'text-green-500' : 'text-primary'}`}>{Math.round(progressPercent)}%</p>
                </div>
                <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-2.5">
                    <div className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>
        </div>
    );
};


interface GoalsPageProps {
    goals: TrackableGoal[];
    onUpdateGoals: (updatedGoals: TrackableGoal[]) => void;
    history: AnalysisReport[];
}

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, onUpdateGoals, history }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<TrackableGoal | null>(null);

    const handleAddNewGoal = () => {
        setEditingGoal(null);
        setIsModalOpen(true);
    };

    const handleEditGoal = (goal: TrackableGoal) => {
        setEditingGoal(goal);
        setIsModalOpen(true);
    };
    
    const handleIncrementProgress = (goalId: string | number) => {
        const newGoals = goals.map(g => {
            if (g.id === goalId && g.trackingType === 'manual' && !g.isCompleted) {
                const newProgress = g.progress + 1;
                const isCompleted = newProgress >= g.target;
                return { ...g, progress: newProgress, isCompleted };
            }
            return g;
        });
        onUpdateGoals(newGoals);
    };

    const handleSaveGoal = (goalToSave: Omit<TrackableGoal, 'id'> & { id?: string | number }) => {
        let newGoals = [...goals];
        const goalWithId = { ...goalToSave, id: goalToSave.id || `temp-${Date.now()}` };

        const existingIndex = newGoals.findIndex(g => g.id === goalWithId.id);
        if (existingIndex > -1) {
            newGoals[existingIndex] = goalWithId as TrackableGoal;
        } else {
            newGoals.push(goalWithId as TrackableGoal);
        }
        
        onUpdateGoals(newGoals);
        setIsModalOpen(false);
    };
    
    const handleDeleteGoal = (goalId: string | number) => {
        onUpdateGoals(goals.filter(g => g.id !== goalId));
        setIsModalOpen(false);
    };

    const automaticGoals = goals.filter(g => g.trackingType === 'auto' && !g.isCompleted);
    const manualGoals = goals.filter(g => g.trackingType === 'manual' && !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);

    return (
        <div className="p-4 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[60vh] animate-fade-in">
            <div className="w-48 h-48 rounded-full flex items-center justify-center bg-primary/10 mb-8">
                <span className="material-symbols-outlined text-primary text-9xl">construction</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Goals Page Under Construction</h1>
            <p className="mt-4 max-w-lg text-lg text-text-muted-light dark:text-text-muted-dark">
                We're hard at work building an amazing goal-tracking experience for you. This feature is currently under development. Please check back later!
            </p>
            {isModalOpen && (
                <GoalModal 
                    goal={editingGoal} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveGoal}
                    onDelete={handleDeleteGoal}
                    history={history}
                />
            )}
        </div>
    );
};

export default GoalsPage;