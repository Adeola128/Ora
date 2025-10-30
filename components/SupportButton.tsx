import React, { useState, useEffect, useRef } from 'react';

const SupportButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    const phoneNumber = '2349138643405';
    const defaultMessage = 'Hello Oratora Support, I need help with the app.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;
    const emailUrl = 'mailto:abdulrahmanadebambo@gmail.com';
    const faqUrl = '/#faq';

    // Close widget when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={widgetRef} className="fixed bottom-6 right-6 z-40">
            {/* Widget Content */}
            {isOpen && (
                <div 
                    className="w-72 bg-card-light dark:bg-card-dark rounded-xl shadow-2xl border border-border-light dark:border-border-dark mb-4 animate-fade-in-up"
                    role="dialog"
                    aria-labelledby="support-widget-title"
                >
                    <header className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                        <h3 id="support-widget-title" className="font-bold text-lg text-text-light dark:text-text-dark">Get Help</h3>
                        <p className="text-xs text-green-500 font-semibold flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            We're online
                        </p>
                    </header>
                    <div className="p-2">
                        <a 
                            href={whatsappUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-primary text-3xl">sms</span>
                            <div>
                                <p className="font-semibold text-text-light dark:text-text-dark">Chat with us</p>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Typically replies in a few minutes</p>
                            </div>
                        </a>
                        <a 
                            href={emailUrl} 
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-primary text-3xl">mail</span>
                            <div>
                                <p className="font-semibold text-text-light dark:text-text-dark">Email support</p>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Get a response within 24 hours</p>
                            </div>
                        </a>
                        <a 
                            href={faqUrl} 
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <span className="material-symbols-outlined text-primary text-3xl">quiz</span>
                            <div>
                                <p className="font-semibold text-text-light dark:text-text-dark">Help Center</p>
                                <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Find answers to common questions</p>
                            </div>
                        </a>
                    </div>
                </div>
            )}

            {/* Launcher Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-16 w-16 transform cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl ml-auto"
                aria-label={isOpen ? 'Close support widget' : 'Open support widget'}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
            >
                <span className={`material-symbols-outlined text-4xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? 'close' : 'support_agent'}
                </span>
            </button>
        </div>
    );
};

export default SupportButton;