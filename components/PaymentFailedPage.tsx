import React from 'react';

interface PaymentFailedPageProps {
    onRetry: () => void;
    onBackToDashboard: () => void;
}

const PaymentFailedPage: React.FC<PaymentFailedPageProps> = ({ onRetry, onBackToDashboard }) => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 text-center">
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-red-500 text-6xl">error_outline</span>
            </div>
            <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Payment Failed</h1>
            <p className="mt-2 max-w-md text-text-muted-light dark:text-text-muted-dark">
                Unfortunately, we were unable to process your payment. This could be due to a network issue, incorrect details, or the transaction being cancelled.
            </p>
            <div className="flex gap-4 mt-8">
                <button onClick={onRetry} className="h-12 px-8 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                    Try Again
                </button>
                <button onClick={onBackToDashboard} className="h-12 px-8 bg-slate-200 dark:bg-slate-700 text-text-light dark:text-text-dark font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default PaymentFailedPage;