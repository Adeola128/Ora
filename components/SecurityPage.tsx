import React from 'react';

interface SecurityPageProps {
    onBack: () => void; // A generic back function handled by App.tsx
}

const SecurityPage: React.FC<SecurityPageProps> = ({ onBack }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                <div className="bg-card-light dark:bg-card-dark p-8 sm:p-10 rounded-xl shadow-md">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Security at Oratora</h1>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mb-8">Last updated: July 26, 2024</p>
                    
                    <div className="prose prose-lg dark:prose-invert max-w-none text-text-light dark:text-text-dark prose-headings:font-bold prose-headings:text-text-light dark:prose-headings:text-text-dark">
                        <p>At Oratora, the security of your data is a top priority. We are committed to protecting your information and ensuring the integrity of our platform. This page outlines some of the key measures we take to keep your data safe.</p>

                        <h3>1. Data Encryption</h3>
                        <ul>
                            <li><strong>In Transit:</strong> All data transferred between your device and our servers is encrypted using industry-standard TLS (Transport Layer Security) protocols.</li>
                            <li><strong>At Rest:</strong> Your personal information and uploaded content are stored in encrypted databases. We utilize the built-in encryption features of our cloud providers (Supabase on AWS) to protect data at rest.</li>
                        </ul>

                        <h3>2. Infrastructure Security</h3>
                        <p>Our infrastructure is built on modern, secure cloud services. We leverage the robust security controls provided by our partners, including Supabase and Google Cloud, to protect against unauthorized access and common vulnerabilities.</p>

                        <h3>3. User Content Handling</h3>
                        <p>Your audio and video uploads are treated with the utmost care. They are sent securely to Google's Gemini AI API for processing. We do not store your media files on our servers long-term after the analysis is complete. Your analysis reports are stored securely in your user account.</p>
                        
                        <h3>4. Authentication and Access Control</h3>
                        <p>We use Supabase Auth for secure user authentication, which includes features like password hashing and secure session management. We enforce strict access control policies internally to ensure that only authorized personnel can access system resources.</p>
                        
                        <h3>5. Payment Security</h3>
                        <p>We do not store your credit card information on our servers. All payment processing is handled by our PCI-compliant payment partner, Paystack. Your payment details are sent directly to Paystack over a secure connection.</p>

                        <h3>6. Responsible Disclosure</h3>
                        <p>If you believe you have discovered a security vulnerability in our platform, we encourage you to let us know right away. Please email us at <a href="mailto:security@oratora.ai">security@oratora.ai</a> with the details. We are committed to working with security researchers to resolve any verified vulnerabilities.</p>

                        <h3>7. Continuous Improvement</h3>
                        <p>The security landscape is always evolving. We are dedicated to continuously monitoring our systems, reviewing our practices, and updating our security measures to protect you and your data.</p>
                        
                        <h3>8. Contact Us</h3>
                        <p>If you have any questions about our security practices, please don't hesitate to contact us.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityPage;
