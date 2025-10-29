import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthLayout from './AuthLayout';

const ForgotPasswordPage: React.FC<{
    onNavigateToLogin: () => void;
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}> = ({ onNavigateToLogin, setToast }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setShowSuccess(false);
        
        if (!email) {
            setError("Please enter an email address.");
            setIsLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // You might want to redirect to a specific password update page
        });

        if (error) {
            setError(error.message);
        } else {
            setToast({ message: `Password reset link sent to ${email}`, type: 'success' });
            setShowSuccess(true);
        }
        setIsLoading(false);
    };

    return (
        <AuthLayout
            imageSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuDQqA8yV2uU6kK1YDTiPCNEP5nZpMqz8S9d7u2a0m-8lP_3d2P_pxdt9cT0iAFOZN0kChOq_C55543c7BwQh4747m0aLq85wE1s859eU3zB9dG6c1B6hL20u-7s9Vq9U7g_VdE8_XN_fE_6xP9B1J2_qN1qD7q3A"
            imageAlt="A friendly mascot looking thoughtful, with a question mark."
        >
            <h1 className="mb-4 text-center text-3xl font-bold leading-tight tracking-tight text-[#333333] dark:text-text-primary-dark" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Forgot Your Password?
            </h1>

            {!showSuccess ? (
                <>
                    <p className="text-gray-600 dark:text-gray-400 text-base text-center mb-6">
                        It happens! Enter your email and we'll send you a link to get back in.
                    </p>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        <div className="flex w-full flex-col">
                            <label className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400" htmlFor="email">Email Address</label>
                            <input
                                className="form-input h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-base text-[#333333] placeholder:text-gray-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400/50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                id="email"
                                placeholder="you@example.com"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#23B2A4] to-[#48D1CC] px-5 text-lg font-bold text-white shadow-lg shadow-teal-500/30 transition-transform hover:scale-[1.02] disabled:opacity-70"
                            >
                                <span className="truncate">{isLoading ? 'Sending Link...' : 'Send Reset Link'}</span>
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <div className="text-center w-full animate-fade-in">
                    <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/50">
                        <h3 className="font-bold text-green-800 dark:text-green-200">Check your inbox!</h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            If an account with <strong>{email}</strong> exists, a password reset link has been sent.
                        </p>
                    </div>
                </div>
            )}
            <div className="pt-8 text-center">
                <a className="cursor-pointer text-sm font-bold text-[#23B2A4] hover:underline" onClick={onNavigateToLogin}>
                    Back to Sign In
                </a>
            </div>
        </AuthLayout>
    );
};

export default ForgotPasswordPage;