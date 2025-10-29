import React from 'react';

interface PasswordStrengthIndicatorProps {
    strength: number; // 0 to 4
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ strength }) => {
    const strengthLevels = [
        { width: '0%', color: 'bg-border-light dark:bg-border-dark', label: '', labelColor: '' }, // 0 - Empty
        { width: '25%', color: 'bg-red-500', label: 'Weak', labelColor: 'text-red-500' }, // 1 - Weak
        { width: '50%', color: 'bg-orange-500', label: 'Medium', labelColor: 'text-orange-500' }, // 2 - Medium
        { width: '75%', color: 'bg-yellow-500', label: 'Strong', labelColor: 'text-yellow-500' }, // 3 - Strong
        { width: '100%', color: 'bg-green-500', label: 'Very Strong', labelColor: 'text-green-500' }, // 4 - Very Strong
    ];

    const currentLevel = strengthLevels[strength] || strengthLevels[0];

    return (
        <div>
            <div className="h-1.5 w-full bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${currentLevel.color}`}
                    style={{ width: currentLevel.width }}
                ></div>
            </div>
            {currentLevel.label && (
                <p className={`text-xs text-right mt-1 font-medium ${currentLevel.labelColor}`}>
                    {currentLevel.label}
                </p>
            )}
        </div>
    );
};

export default PasswordStrengthIndicator;
