import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    direction?: 'horizontal' | 'vertical';
}

const steps = ['Profile', 'Context', 'Baseline'];

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, direction = 'vertical' }) => {
    if (direction === 'horizontal') {
        return (
            <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
                <div className="flex items-start justify-between relative">
                    {/* Progress Line */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-border-light dark:bg-border-dark rounded-full">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>
                    </div>
                    {steps.map((step, index) => {
                        const stepNumber = index + 1;
                        const isActive = stepNumber === currentStep;
                        const isCompleted = stepNumber < currentStep;

                        return (
                            <div key={step} className="z-10 flex flex-col items-center flex-1">
                                <div className={`
                                    size-8 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300
                                    ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                                    ${isActive ? 'bg-background-light dark:bg-background-dark border-primary text-primary scale-110' : ''}
                                    ${!isCompleted && !isActive ? 'bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark' : ''}
                                `}>
                                    {isCompleted ? <span className="material-symbols-outlined !text-base">check</span> : stepNumber}
                                </div>
                                <p className={`
                                    mt-2 text-xs text-center font-semibold transition-colors duration-300
                                    ${isActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}
                                `}>
                                    {step}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
    
    // Vertical layout
    return (
        <div className="w-full relative">
             {/* Progress Line */}
            <div className="absolute left-6 top-0 h-full w-1 bg-border-light dark:bg-border-dark rounded-full">
                <div
                    className="w-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ height: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
            </div>
            
            <div className="flex flex-col items-start justify-between gap-16">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isActive = stepNumber === currentStep;
                    const isCompleted = stepNumber < currentStep;

                    return (
                        <div key={step} className="z-10 flex items-center gap-4">
                            <div className={`
                                size-12 rounded-full flex items-center justify-center border-4 font-bold transition-all duration-300 flex-shrink-0
                                ${isCompleted ? 'bg-primary border-primary text-white' : ''}
                                ${isActive ? 'bg-background-light dark:bg-card-dark border-primary text-primary scale-110' : ''}
                                ${!isCompleted && !isActive ? 'bg-background-light dark:bg-card-dark border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark' : ''}
                            `}>
                                {isCompleted ? <span className="material-symbols-outlined">check</span> : stepNumber}
                            </div>
                             <div>
                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Step {stepNumber}</p>
                                <p className={`
                                    text-lg font-bold transition-colors duration-300
                                    ${isActive ? 'text-primary' : 'text-text-primary-light dark:text-text-primary-dark'}
                                `}>
                                    {step}
                                </p>
                             </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressBar;
