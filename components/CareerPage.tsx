import React from 'react';

interface CareerPageProps {
    onBack: () => void;
}

const benefits = [
    {
        icon: 'paid',
        title: 'Cash Prizes & Rewards',
        description: 'Earn rewards for community engagement, hosting successful events, and achieving milestones.',
        color: 'text-green-500',
    },
    {
        icon: 'work',
        title: 'Internship Opportunities',
        description: 'Top-performing ambassadors get exclusive access and priority consideration for internship roles at Oratora.',
        color: 'text-blue-500',
    },
    {
        icon: 'workspace_premium',
        title: 'Free Premium Access',
        description: 'Enjoy complimentary access to all Oratora Pro & Premium features, including unlimited live practice sessions.',
        color: 'text-purple-500',
    },
    {
        icon: 'school',
        title: 'Direct Mentorship',
        description: 'Connect directly with the Oratora team for mentorship, career advice, and insider knowledge.',
        color: 'text-yellow-500',
    },
    {
        icon: 'groups',
        title: 'Build Your Network',
        description: 'Join a global community of ambitious communicators, leaders, and creators.',
        color: 'text-teal-500',
    },
    {
        icon: 'apparel',
        title: 'Exclusive Swag',
        description: 'Receive a welcome kit packed with exclusive Oratora merchandise to represent the brand in style.',
        color: 'text-red-500',
    },
];

const roles = [
    {
        icon: 'campaign',
        title: 'Champion Oratora',
        description: 'Spread the word on your campus or in your community. Introduce new users to the platform and guide them on their journey.'
    },
    {
        icon: 'event',
        title: 'Host Events & Workshops',
        description: 'Organize and lead practice sessions, workshops, and fun challenges to help others build their confidence.'
    },
    {
        icon: 'edit_note',
        title: 'Create & Share Content',
        description: 'Share your public speaking journey, tips, and Oratora experiences on social media to inspire others.'
    },
    {
        icon: 'feedback',
        title: 'Provide Product Feedback',
        description: 'Be a key voice in shaping the future of Oratora. Your insights will help us build better features for everyone.'
    }
];

const CareerPage: React.FC<CareerPageProps> = ({ onBack }) => {
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen animate-fade-in">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>

                {/* Hero Section */}
                <section className="text-center py-16">
                    <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-text-primary dark:text-white md:text-5xl lg:text-6xl">
                        Become an Oratora Ambassador
                    </h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-secondary-text-light dark:text-secondary-text-dark">
                        Shape the future of communication. Join a passionate community dedicated to empowering confident speakers worldwide. Connect, learn, and lead with us.
                    </p>
                    <button className="mt-8 flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 mx-auto">
                        Apply Now
                    </button>
                </section>

                {/* Role Section */}
                <section className="py-16">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">Your Role as an Ambassador</h2>
                        <p className="mt-3 max-w-2xl mx-auto text-lg text-secondary-text-light dark:text-secondary-text-dark">
                            As an Oratora Ambassador, you'll be a leader in your community, helping others find their voice.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {roles.map((role) => (
                            <div key={role.title} className="flex items-start gap-6 p-6 bg-card-light dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-4xl">{role.icon}</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-text-light dark:text-text-dark">{role.title}</h3>
                                    <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">{role.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                {/* Benefits Section */}
                <section className="py-16 bg-primary/5 dark:bg-primary/10 rounded-2xl">
                    <div className="text-center mb-12 px-4">
                        <h2 className="text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">Perks & Benefits</h2>
                        <p className="mt-3 max-w-2xl mx-auto text-lg text-secondary-text-light dark:text-secondary-text-dark">
                            We empower our ambassadors with the resources and rewards they need to succeed.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                        {benefits.map((benefit) => (
                             <div key={benefit.title} className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md text-center hover:shadow-lg hover:-translate-y-1 transition-all">
                                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${benefit.color.replace('text-', 'bg-')}/10`}>
                                    <span className={`material-symbols-outlined text-4xl ${benefit.color}`}>{benefit.icon}</span>
                                </div>
                                <h3 className="mt-4 text-lg font-bold text-text-light dark:text-text-dark">{benefit.title}</h3>
                                <p className="mt-2 text-sm text-text-muted-light dark:text-text-muted-dark">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Call to Action Section */}
                <section className="text-center py-20">
                     <div className="mx-auto max-w-3xl">
                        <h2 className="font-display text-3xl font-bold tracking-tight text-text-primary dark:text-white sm:text-4xl">
                           Ready to Join Our Mission?
                        </h2>
                        <p className="mt-4 text-lg text-secondary-text-light dark:text-secondary-text-dark">
                            If you're passionate about communication, a natural leader, and love helping others grow, we want to hear from you. Apply today to become a part of the Oratora family!
                        </p>
                        <button className="mt-8 flex h-12 transform cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-playful_green px-8 font-bold text-white shadow-lg transition-transform duration-200 ease-in-out hover:scale-105 mx-auto">
                            Become an Ambassador
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CareerPage;