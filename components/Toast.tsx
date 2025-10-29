import React, { useEffect, useState, useRef, useCallback } from 'react';

type ToastType = 'success' | 'info' | 'error';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

const icons: { [key in ToastType]: string } = {
    success: 'check_circle',
    info: 'info',
    error: 'error',
};

const themeClasses: { [key in ToastType]: { container: string; iconContainer: string; progressBar: string; title: string; message: string; close: string; } } = {
    success: {
        container: 'dark:bg-green-500/20 bg-green-100 border-green-500/30 dark:border-green-500/50',
        iconContainer: 'bg-green-500/20 text-green-600 dark:text-green-300',
        progressBar: 'bg-green-500',
        title: 'text-green-800 dark:text-green-200',
        message: 'text-green-700 dark:text-green-300/90',
        close: 'text-green-800/70 hover:text-green-800 dark:text-green-200/70 dark:hover:text-green-200',
    },
    info: {
        container: 'dark:bg-primary/20 bg-primary/10 border-primary/30 dark:border-primary/50',
        iconContainer: 'bg-primary/20 text-primary',
        progressBar: 'bg-primary',
        title: 'text-teal-800 dark:text-primary',
        message: 'text-teal-700 dark:text-primary/90',
        close: 'text-teal-800/70 hover:text-teal-800 dark:text-primary/70 dark:hover:text-primary',
    },
    error: {
        container: 'dark:bg-red-500/20 bg-red-100 border-red-500/30 dark:border-red-500/50',
        iconContainer: 'bg-red-500/20 text-red-600 dark:text-red-300',
        progressBar: 'bg-red-500',
        title: 'text-red-800 dark:text-red-200',
        message: 'text-red-700 dark:text-red-300/90',
        close: 'text-red-800/70 hover:text-red-800 dark:text-red-200/70 dark:hover:text-red-200',
    }
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 5000 }) => {
    const [isExiting, setIsExiting] = useState(false);
    
    const timerRef = useRef<number | null>(null);
    const remainingTimeRef = useRef(duration);
    const startTimeRef = useRef(Date.now());

    const handleClose = useCallback(() => {
        setIsExiting(true);
    }, []);

    const pauseTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        const elapsedTime = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsedTime);
    }, []);

    const resumeTimer = useCallback(() => {
        startTimeRef.current = Date.now();
        timerRef.current = window.setTimeout(handleClose, remainingTimeRef.current);
    }, [handleClose]);
    
    useEffect(() => {
        resumeTimer(); // Start the timer on mount
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [resumeTimer]);

    const handleAnimationEnd = () => {
        if (isExiting) {
            onClose();
        }
    };

    const theme = themeClasses[type];

    return (
        <div
            role="alert"
            aria-live="assertive"
            className={`toast-container fixed top-5 right-5 w-full max-w-sm rounded-xl shadow-2xl border backdrop-blur-md z-50 flex items-start gap-4 overflow-hidden
                ${theme.container}
                ${isExiting ? 'animate-slide-out-to-right' : 'animate-slide-in-from-right'}`
            }
            onMouseEnter={pauseTimer}
            onMouseLeave={resumeTimer}
            onAnimationEnd={handleAnimationEnd}
        >
            <div className={`flex-shrink-0 w-10 h-10 mt-1 rounded-lg flex items-center justify-center ${theme.iconContainer}`}>
                <span className="material-symbols-outlined text-2xl">{icons[type]}</span>
            </div>
            <div className="flex-1 py-1">
                <p className={`font-bold capitalize ${theme.title}`}>{type}</p>
                <p className={`text-sm ${theme.message}`}>{message}</p>
            </div>
            <button
                onClick={handleClose}
                className={`p-1 rounded-full absolute top-2 right-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${theme.close}`}
                aria-label="Close notification"
            >
                <span className="material-symbols-outlined text-base">close</span>
            </button>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-black/10 dark:bg-white/10 w-full overflow-hidden">
                <div
                    className={`h-full toast-progress-bar ${theme.progressBar}`}
                    style={{ '--toast-duration': `${duration}ms` } as React.CSSProperties}
                />
            </div>
        </div>
    );
};

export default Toast;