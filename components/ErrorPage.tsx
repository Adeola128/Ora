import React from 'react';

interface ErrorPageProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryText?: string;
    onBack?: () => void;
    backText?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
    title = "Oops! Something Went Wrong.",
    message = "We've encountered an unexpected error. Please try again later or contact support.",
    onRetry,
    retryText = "Try Again",
    onBack,
    backText = "Go Back"
}) => {
    return (
        <div className="flex min-h-full flex-grow flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
            </div>
            <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">{title}</h1>
            <p className="mt-2 max-w-md text-text-muted-light dark:text-text-muted-dark">{message}</p>
            <div className="flex gap-4 mt-8">
                {onRetry && (
                    <button onClick={onRetry} className="h-12 px-8 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        {retryText}
                    </button>
                )}
                {onBack && (
                    <button onClick={onBack} className="h-12 px-8 bg-slate-200 dark:bg-slate-700 text-text-light dark:text-text-dark font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        {backText}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorPage;
