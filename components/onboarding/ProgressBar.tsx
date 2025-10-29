import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps }) => {
    const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-text-primary dark:text-white">
                    Step {currentStep} of {totalSteps}
                </p>
                <p className="text-sm font-semibold text-primary">{Math.round(progressPercentage)}%</p>
            </div>
            <div className="h-2 w-full bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;