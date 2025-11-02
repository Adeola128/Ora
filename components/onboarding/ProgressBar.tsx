import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

const steps = ['Profile', 'Context', 'Baseline'];

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep }) => {
    return (
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-0">
            <div className="flex items-start justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-4 left-0 w-full h-1 bg-border-light dark:bg-border-dark">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
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
};

export default ProgressBar;
