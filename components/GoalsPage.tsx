import React, { useState } from 'react';
import { TrackableGoal, AnalysisReport } from '../types';
import GoalModal from './GoalModal';

/*
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
*/

interface GoalsPageProps {
    goals: TrackableGoal[];
    onUpdateGoals: (updatedGoals: TrackableGoal[]) => void;
    history: AnalysisReport[];
}

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, onUpdateGoals, history }) => {
    /*
    // Original implementation is preserved here for future development.
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
        <div className="animate-fade-in p-4 sm:p-0">
             <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
                <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Set & Achieve Your Goals</p>
                <button onClick={handleAddNewGoal} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-white text-base font-bold transition-transform hover:scale-105 shadow-lg shadow-primary/30">
                    <span className="material-symbols-outlined mr-2">add</span>
                    <span className="truncate">Add New Goal</span>
                </button>
            </header>
            
            {goals.length === 0 ? (
                 <div className="text-center p-12 bg-card-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark">
                    <span className="material-symbols-outlined text-6xl text-primary mb-4">flag</span>
                    <h3 className="text-xl font-bold">No Goals Yet</h3>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2">Click 'Add New Goal' to create your first goal and start tracking your progress.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {automaticGoals.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">Automatic Goals</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {automaticGoals.map(goal => (
                                    <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
                                ))}
                            </div>
                        </section>
                    )}
                    {manualGoals.length > 0 && (
                        <section>
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">Manual Goals</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {manualGoals.map(goal => (
                                   <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} onIncrementProgress={handleIncrementProgress} />
                                ))}
                            </div>
                        </section>
                    )}
                    {completedGoals.length > 0 && (
                         <section>
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer">
                                    <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">Completed Goals</h3>
                                    <span className="material-symbols-outlined transition-transform duration-300 group-open:rotate-180">expand_more</span>
                                </summary>
                                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {completedGoals.map(goal => (
                                        <GoalCard key={goal.id} goal={goal} onEdit={handleEditGoal} />
                                    ))}
                                </div>
                            </details>
                        </section>
                    )}
                </div>
            )}

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
    */

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in min-h-[50vh]">
            <span className="material-symbols-outlined text-6xl text-primary mb-4">construction</span>
            <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Coming soon.</h1>
            <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">Under development: "Comment soon."</p>
        </div>
    );
};

export default GoalsPage;
