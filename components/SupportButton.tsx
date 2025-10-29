
import React from 'react';

const SupportButton: React.FC = () => {
    const phoneNumber = '2349138643405';
    const defaultMessage = 'Hello Oratora Support, I need help with the app.';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

    return (
        <div className="group fixed bottom-6 right-6 z-40">
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-16 w-16 transform cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl"
                aria-label="Contact support on WhatsApp"
            >
                <span className="material-symbols-outlined text-4xl">support_agent</span>
            </a>
            <div className="absolute bottom-1/2 right-full mr-4 mb-2 translate-y-1/2 whitespace-nowrap rounded-md bg-card-dark px-3 py-1.5 text-sm font-semibold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Need help? Chat on WhatsApp
            </div>
        </div>
    );
};

export default SupportButton;
