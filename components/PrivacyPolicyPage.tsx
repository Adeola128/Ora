import React from 'react';

interface PrivacyPolicyPageProps {
    onBack: () => void; // A generic back function handled by App.tsx
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                <div className="bg-card-light dark:bg-card-dark p-8 sm:p-10 rounded-xl shadow-md">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Privacy Policy</h1>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8">Last updated: July 26, 2024</p>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none text-text-light dark:text-text-dark prose-headings:font-bold prose-headings:text-text-light dark:prose-headings:text-text-dark">
                        <p>Oratora Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Oratora application (the "Service").</p>

                        <h3>1. Information We Collect</h3>
                        <p>We may collect information about you in a variety of ways. The information we may collect via the Service includes:</p>
                        <ul>
                            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name and email address, that you voluntarily give to us when you register with the Service.</li>
                            <li><strong>User Content:</strong> Audio files, video files, and transcripts that you upload or record within the Service for analysis. This data is essential for the core functionality of our coaching features.</li>
                            <li><strong>Usage Data:</strong> Information your browser automatically sends, such as your IP address, browser type, and information about your use of the Service (e.g., features used, session duration).</li>
                        </ul>

                        <h3>2. How We Use Your Information</h3>
                        <p>Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:</p>
                        <ul>
                            <li>Create and manage your account.</li>
                            <li>Provide the core AI analysis of your speeches. Your User Content is processed by our AI models to generate feedback and reports.</li>
                            <li>Email you regarding your account or order.</li>
                            <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                            <li>Notify you of updates to the Service.</li>
                        </ul>

                        <h3>3. Data Sharing and Disclosure</h3>
                        <p>We do not share, sell, rent, or trade your information with third parties for their commercial purposes.</p>
                        <p>Your User Content (audio/video) is shared with Google's Gemini AI API for the sole purpose of transcription and analysis to provide the Service's features. Google's use of this data is governed by their API terms of service and privacy policies. We do not store your audio or video files long-term after processing is complete.</p>
                        
                        <h3>4. Data Security</h3>
                        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>

                        <h3>5. Your Rights and Choices</h3>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access and update your account information at any time through your profile settings.</li>
                            <li>Request deletion of your account and associated personal data by contacting us.</li>
                            <li>Opt-out of promotional communications.</li>
                        </ul>

                        <h3>6. Children's Privacy</h3>
                        <p>Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13.</p>

                        <h3>7. Changes to This Privacy Policy</h3>
                        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.</p>

                        <h3>8. Contact Us</h3>
                        <p>If you have questions or comments about this Privacy Policy, please contact us at: privacy@oratora.ai</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;