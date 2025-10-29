import React, { useState } from 'react';

interface ContactPageProps {
    onBack: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.subject || !formData.message) return;
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
        }, 1500);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen animate-fade-in">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                <div className="bg-card-light dark:bg-card-dark p-8 sm:p-10 rounded-xl shadow-md">
                    <div className="text-center">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Get in Touch</h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark mt-2 max-w-2xl mx-auto">We’d love to hear from you! Whether you have a question about features, trials, or anything else, our team is ready to answer all your questions.</p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">mail</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Email Us</h3>
                                    <p className="text-text-muted-light dark:text-text-muted-dark">Our team is here to help. Drop us a line!</p>
                                    <a href="mailto:support@oratora.ai" className="text-primary font-semibold hover:underline mt-1 block">support@oratora.ai</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-3xl">help_center</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">Help Center</h3>
                                    <p className="text-text-muted-light dark:text-text-muted-dark">Find answers to common questions in our FAQ.</p>
                                    <a href="/#faq" className="text-primary font-semibold hover:underline mt-1 block">Visit FAQ section</a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div>
                            {isSubmitted ? (
                                <div className="flex flex-col items-center justify-center text-center p-8 bg-green-50 dark:bg-green-900/30 rounded-lg h-full">
                                    <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
                                    <h3 className="text-xl font-bold mt-4 text-green-800 dark:text-green-200">Message Sent!</h3>
                                    <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Full Name</label>
                                        <input type="text" name="name" id="name" required onChange={handleChange} value={formData.name} className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Email</label>
                                        <input type="email" name="email" id="email" required onChange={handleChange} value={formData.email} className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Subject</label>
                                        <input type="text" name="subject" id="subject" required onChange={handleChange} value={formData.subject} className="w-full form-input rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">Message</label>
                                        <textarea name="message" id="message" rows={4} required onChange={handleChange} value={formData.message} className="w-full form-textarea rounded-lg border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary"></textarea>
                                    </div>
                                    <div>
                                        <button type="submit" disabled={isSubmitting} className="w-full h-12 flex items-center justify-center rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors disabled:opacity-70">
                                            {isSubmitting ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            ) : (
                                                'Send Message'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
