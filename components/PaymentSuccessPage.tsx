import React, { useEffect } from 'react';

interface PaymentSuccessPageProps {
    onVerifyPayment: () => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onVerifyPayment }) => {
    useEffect(() => {
        // Trigger the verification process in the parent component
        onVerifyPayment();
    }, [onVerifyPayment]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">Payment Successful!</h1>
            <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">
                Please wait while we verify your payment and update your account.
            </p>
        </div>
    );
};

export default PaymentSuccessPage;