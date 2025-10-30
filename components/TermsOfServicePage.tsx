import React from 'react';

interface TermsOfServicePageProps {
    onBack: () => void; // A generic back function handled by App.tsx
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                <div className="bg-card-light dark:bg-card-dark p-8 sm:p-10 rounded-xl shadow-md">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Terms of Service</h1>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8">Last updated: July 26, 2024</p>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none text-text-light dark:text-text-dark prose-headings:font-bold prose-headings:text-text-light dark:prose-headings:text-text-dark">
                        <p>Welcome to Oratora! These Terms of Service ("Terms") govern your use of the Oratora application and services ("Services") provided by Oratora Inc. By accessing or using our Services, you agree to be bound by these Terms.</p>

                        <h3>1. Acceptance of Terms</h3>
                        <p>By creating an account and using Oratora, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree with any part of these terms, you may not use our Services.</p>

                        <h3>2. Description of Service</h3>
                        <p>Oratora is an AI-powered public speaking coach that provides analysis, feedback, and practice tools. The Services include, but are not limited to, audio and video analysis, live practice sessions, and a resource library. We reserve the right to modify or discontinue the Services at any time.</p>

                        <h3>3. User Accounts and Responsibilities</h3>
                        <ul>
                            <li>You must be at least 13 years old to use Oratora.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You are responsible for all content (audio, video, text) you upload to the Service ("Your Content"). You retain all rights to Your Content, but you grant Oratora a limited license to process it for the purpose of providing the Services to you.</li>
                        </ul>

                        <h3>4. User Conduct</h3>
                        <p>You agree not to use the Services for any unlawful purpose or to upload any content that is defamatory, obscene, or infringes on the rights of others. We reserve the right to suspend or terminate accounts that violate these guidelines.</p>

                        <h3>5. Subscription and Payment</h3>
                        <p>Certain features of Oratora are available under paid subscription plans. By selecting a paid plan, you agree to pay the specified fees. All fees are non-refundable. We use a third-party payment processor (Paystack) to handle payments.</p>

                        <h3>6. Intellectual Property</h3>
                        <p>The Oratora name, logo, and all related technology are the exclusive property of Oratora Inc. You may not use our branding or intellectual property without our prior written consent.</p>

                        <h3>7. Disclaimer of Warranties</h3>
                        <p>The Services are provided "as is" without any warranties, express or implied. We do not guarantee that the feedback provided by our AI will be perfectly accurate or that the service will be uninterrupted or error-free.</p>

                        <h3>8. Limitation of Liability</h3>
                        <p>To the fullest extent permitted by law, Oratora Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Services.</p>
                        
                        <h3>9. Termination</h3>
                        <p>We may terminate or suspend your access to our Services immediately, without prior notice, for any reason, including a breach of these Terms. You may terminate your account at any time by contacting support.</p>
                        
                        <h3>10. Changes to Terms</h3>
                        <p>We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.</p>

                        <h3>11. Contact Us</h3>
                        <p>If you have any questions about these Terms, please contact us at abdulrahmanadebambo@gmail.com.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfServicePage;