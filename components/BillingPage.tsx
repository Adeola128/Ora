import React, { useState, useEffect } from 'react';
import { supabase, toCamelCase } from '../lib/supabaseClient';
import { User, UserSubscription, SubscriptionPlan, Payment } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface BillingPageProps {
    user: User | null;
    subscription: UserSubscription | null;
    onSubscriptionUpdate: (newPlan: SubscriptionPlan) => void;
    onNavigateToPaymentSuccess: (reference: string, plan: SubscriptionPlan, amount: number) => void;
    onNavigateToPaymentFailed: () => void;
    onBackToDashboard: () => void;
    setToast: (toast: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

const plans = [
    {
        name: 'Free',
        price: 0,
        features: [
            '2 AI analyses / month',
            'Audio analysis only',
            'Standard progress tracking',
            'Access to free resources'
        ],
        planId: 'free' as SubscriptionPlan,
        ctaText: 'Downgrade to Free',
    },
    {
        name: 'Pro',
        price: 2500,
        features: [
            'Unlimited AI analyses',
            'Audio & Video analysis',
            'Live practice sessions',
            'Advanced feedback metrics',
            'Full resource library access',
        ],
        planId: 'pro' as SubscriptionPlan,
        popular: true,
        ctaText: 'Upgrade to Pro',
    },
    {
        name: 'Premium',
        price: 3500,
        features: [
            'All Pro features',
            'Personalized action plans',
            'Priority AI processing',
            'Priority support',
        ],
        planId: 'premium' as SubscriptionPlan,
        ctaText: 'Upgrade to Premium',
    },
];

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const BillingPage: React.FC<BillingPageProps> = ({ user, subscription, onSubscriptionUpdate, onNavigateToPaymentSuccess, onNavigateToPaymentFailed, onBackToDashboard, setToast }) => {
    const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null);
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; confirmText: string; confirmClass: string; } | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<{ cardType: string; last4: string; } | null>(null);
    const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

    useEffect(() => {
        const fetchBillingInfo = async () => {
            if (!user) return;
            setIsLoadingHistory(true);
            
            // Fetch payment history
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                setToast({ message: `Failed to load billing history: ${error.message}`, type: 'error' });
            } else if (data) {
                setPaymentHistory(toCamelCase<Payment[]>(data));
            }

            // In a real app, you would fetch payment method from your backend,
            // which gets it from Paystack. For now, we'll mock it.
            if (subscription && subscription.plan !== 'free') {
                setPaymentMethod({ cardType: 'Visa', last4: '1234' });
            } else {
                setPaymentMethod(null); // No payment method for free users
            }

            setIsLoadingHistory(false);
        };

        fetchBillingInfo();
    }, [user, setToast, subscription]);
    
    const handleUpdatePaymentMethod = () => {
        if (!user) {
            setToast({ message: "You must be logged in.", type: 'error' });
            return;
        }

        if (!(window as any).PaystackPop || !process.env.VITE_PAYSTACK_PUBLIC_KEY) {
            setToast({ message: "Payment service is currently unavailable.", type: 'error' });
            return;
        }

        setIsUpdatingPayment(true);
        let paymentHandled = false;

        const handler = (window as any).PaystackPop.setup({
            key: process.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: 50 * 100, // NGN 50 verification charge
            currency: 'NGN',
            ref: `oratora-update-${user.id}-${Date.now()}`,
            metadata: {
                user_id: user.id,
                action: 'update_payment_method',
            },
            callback: (response: { reference: string }) => {
                paymentHandled = true;
                setIsUpdatingPayment(false);
                setToast({ message: "Payment method updated successfully!", type: 'success' });
                // Simulate updating the card display. In a real app, you'd re-fetch this from your backend.
                const newLast4 = Math.floor(1000 + Math.random() * 9000).toString();
                setPaymentMethod({ cardType: 'Visa', last4: newLast4 });
            },
            onClose: () => {
                if (!paymentHandled) {
                    setToast({ message: 'Update process was cancelled.', type: 'info' });
                    setIsUpdatingPayment(false);
                }
            },
        });
        handler.openIframe();
    };

    const handlePayment = (plan: SubscriptionPlan, price: number) => {
        if (!user) {
            setToast({ message: "You must be logged in to subscribe.", type: 'error' });
            return;
        }

        if (!(window as any).PaystackPop || !process.env.VITE_PAYSTACK_PUBLIC_KEY) {
            setToast({ message: "Payment service is currently unavailable. Please try again later.", type: 'error' });
            return;
        }

        setProcessingPlan(plan);
        let paymentHandled = false;

        const handler = (window as any).PaystackPop.setup({
            key: process.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: user.email,
            amount: price * 100, // Amount in kobo
            currency: 'NGN',
            ref: `oratora-${user.id}-${Date.now()}`,
            metadata: {
                user_id: user.id,
                plan: plan,
            },
            callback: (response: { reference: string }) => {
                paymentHandled = true;
                setProcessingPlan(null);
                onNavigateToPaymentSuccess(response.reference, plan, price);
            },
            onClose: () => {
                if (!paymentHandled) {
                    setToast({ message: 'Payment process was cancelled.', type: 'info' });
                    setProcessingPlan(null);
                }
            },
        });
        handler.openIframe();
    };
    
    const handleDowngrade = () => {
        setModalState({
            isOpen: true,
            title: 'Downgrade to Free Plan',
            message: 'Are you sure? You will lose access to Pro features at the end of your current billing period.',
            onConfirm: async () => {
                setProcessingPlan('free');
                await onSubscriptionUpdate('free');
                setProcessingPlan(null);
                setModalState(null);
            },
            confirmText: 'Confirm Downgrade',
            confirmClass: 'bg-yellow-500 hover:bg-yellow-600'
        });
    };

    const handleCancelSubscription = () => {
        setModalState({
            isOpen: true,
            title: 'Cancel Subscription',
            message: 'Are you sure you want to cancel? Your access will end after your current billing period.',
            onConfirm: async () => {
                // Simulate cancellation by downgrading to free at period end
                setProcessingPlan('free');
                await onSubscriptionUpdate('free'); 
                setProcessingPlan(null);
                setModalState(null);
            },
            confirmText: 'Confirm Cancellation',
            confirmClass: 'bg-red-600 hover:bg-red-700'
        });
    };

    const currentPlanId = subscription?.plan || 'free';
    const currentPlanDetails = plans.find(p => p.planId === currentPlanId);
    const isTrial = subscription?.status === 'trialing';

    const getPlanDateInfo = () => {
        if (isTrial && subscription?.trialEndsAt) {
            return `Your trial ends on ${new Date(subscription.trialEndsAt).toLocaleDateString()}`;
        }
        if (subscription?.periodEndsAt) {
            return `Renews on ${new Date(subscription.periodEndsAt).toLocaleDateString()}`;
        }
        return 'You are on the free plan.';
    };
    
    const getButtonText = (plan: typeof plans[0], isCurrentPlan: boolean) => {
        if (processingPlan === plan.planId) return <LoadingSpinner />;
        
        if (isTrial && isCurrentPlan) {
            return 'Your Current Trial';
        }

        if (isCurrentPlan && !isTrial) {
            return 'Your Current Plan';
        }
        
        return plan.ctaText;
    };

    return (
        <>
            <div className="p-4 md:p-8 animate-fade-in">
                <header className="mb-12 max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Billing & Subscriptions</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2">
                        Manage your plan, view payment history, and update your billing details.
                    </p>
                </header>
                
                 {isTrial && subscription?.trialEndsAt && (
                    <div className="max-w-4xl mx-auto mb-12 p-4 bg-mustard/20 border border-mustard rounded-xl text-center">
                        <h2 className="font-bold text-mustard">You are on a 21-day Pro Trial!</h2>
                        <p className="text-sm text-mustard/80">
                            Your trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}. 
                            Select a plan below to activate it after your trial ends.
                        </p>
                    </div>
                )}
                
                {/* Current Subscription Section */}
                 <section className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Your Plan Card */}
                        <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-md border border-border-light dark:border-border-dark flex flex-col">
                            <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Your Plan</h2>
                            <div className="flex items-baseline gap-3 my-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${isTrial ? 'bg-mustard/20 text-mustard' : 'bg-primary/10 text-primary'}`}>
                                    {currentPlanDetails?.name} {isTrial && '(Trial)'}
                                </span>
                            </div>
                            <p className="text-text-muted-light dark:text-text-muted-dark text-sm mb-4">{getPlanDateInfo()}</p>
                            <ul className="space-y-2 text-sm text-text-muted-light dark:text-text-muted-dark flex-grow">
                                {(currentPlanDetails?.features || []).map(feature => (
                                    <li key={feature} className="flex items-start gap-3">
                                        <span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            {currentPlanId !== 'free' && (
                                <button onClick={handleCancelSubscription} className="mt-6 w-full h-11 px-6 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/50">
                                    Cancel Subscription
                                </button>
                            )}
                        </div>

                        {/* Payment Method Card */}
                        <div className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-md border border-border-light dark:border-border-dark flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Payment Method</h2>
                                {paymentMethod ? (
                                    <div className="flex items-center gap-4 my-4 p-4 bg-background-light dark:bg-background-dark rounded-lg border border-border-light dark:border-border-dark">
                                        <img src="https://js.paystack.co/v1/assets/images/paystack-logo-primary.svg" alt="Paystack" className="h-6" />
                                        <div>
                                            <p className="font-semibold text-text-light dark:text-text-dark">{paymentMethod.cardType} Card</p>
                                            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">ending in **** {paymentMethod.last4}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-24 my-4 bg-background-light dark:bg-background-dark rounded-lg border-2 border-dashed border-border-light dark:border-border-dark">
                                        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">No payment method on file.</p>
                                    </div>
                                )}
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                                    Your payments are securely processed by our PCI-compliant partner.
                                </p>
                            </div>
                            <button 
                                onClick={handleUpdatePaymentMethod}
                                disabled={isUpdatingPayment}
                                className="mt-6 w-full h-11 px-6 text-sm font-bold text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center disabled:opacity-70"
                            >
                                {isUpdatingPayment ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    'Update Payment Method'
                                )}
                            </button>
                        </div>
                    </div>
                </section>


                {/* Plan Selection Section */}
                <section className="max-w-6xl mx-auto mt-16">
                    <div className="mx-auto max-w-3xl text-center mb-12">
                        <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">
                            Choose the plan that's right for you
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {plans.map((plan) => {
                            const isCurrentPlan = plan.planId === currentPlanId;
                            const isProcessingThisPlan = processingPlan === plan.planId;
                            
                            return (
                                <div 
                                    key={plan.name} 
                                    className={`relative flex flex-col rounded-lg border bg-card-light dark:bg-card-dark p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${isCurrentPlan ? 'border-2 border-primary' : 'border-border-light dark:border-border-dark'}`}
                                >
                                    {plan.popular && !isCurrentPlan && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-mustard px-4 py-1 text-sm font-bold text-text-primary">Most Popular</div>
                                    )}
                                    <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                                    <p className="mt-6">
                                        <span className="font-display text-5xl font-extrabold">₦{plan.price.toLocaleString()}</span>
                                        <span className="text-secondary-text-light dark:text-secondary-text-dark">/month</span>
                                    </p>
                                    <ul className="mt-8 space-y-4 text-secondary-text-light dark:text-secondary-text-dark">
                                        {plan.features.map(feature => (
                                            <li key={feature} className="flex items-start gap-3">
                                                <span className="material-symbols-outlined mt-0.5 text-playful_green text-lg">check_circle</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => (plan.planId === 'free' ? handleDowngrade() : handlePayment(plan.planId, plan.price))}
                                        disabled={isCurrentPlan || processingPlan !== null}
                                        className={`mt-auto w-full h-12 flex items-center justify-center overflow-hidden rounded-full font-bold shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isCurrentPlan ? 'bg-slate-400 dark:bg-slate-600 text-white' : 'bg-gradient-to-r from-primary to-playful_green text-white'}`}
                                    >
                                        {getButtonText(plan, isCurrentPlan)}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
                
                {/* Billing History Section */}
                <section className="max-w-4xl mx-auto mt-16">
                    <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">Billing History</h2>
                    <div className="bg-card-light dark:bg-card-dark rounded-xl shadow-md overflow-hidden border border-border-light dark:border-border-dark">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                                <thead className="bg-background-light dark:bg-background-dark/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Plan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Download</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {isLoadingHistory ? (
                                        <tr><td colSpan={5} className="text-center p-6 text-text-muted-light dark:text-text-muted-dark">Loading history...</td></tr>
                                    ) : paymentHistory.length > 0 ? (
                                        paymentHistory.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-background-light dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium capitalize">{invoice.plan}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">₦{invoice.amount.toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>{invoice.status}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <a href="#" className="text-primary font-semibold hover:underline flex items-center justify-end gap-1">
                                                        <span className="material-symbols-outlined">download</span> Download
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="text-center p-6 text-text-muted-light dark:text-text-muted-dark">No payment history found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
            {modalState?.isOpen && (
                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState(null)}
                    onConfirm={modalState.onConfirm}
                    title={modalState.title}
                    message={modalState.message}
                    confirmText={modalState.confirmText}
                    confirmButtonClass={modalState.confirmClass}
                />
            )}
        </>
    );
};

export default BillingPage;
