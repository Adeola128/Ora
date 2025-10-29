import React from 'react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-12">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4 pb-2 border-b-2 border-primary">{title}</h2>
        <div className="space-y-6">{children}</div>
    </section>
);

const ComponentDisplay: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-3">{title}</h3>
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md border border-border-light dark:border-border-dark flex flex-wrap items-center justify-center gap-4">
            {children}
        </div>
    </div>
);

const ComponentsPage: React.FC = () => {
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Component Showcase</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-1">A visual guide to the UI elements used in Oratora.</p>
            </header>

            <div className="max-w-4xl mx-auto">
                <Section title="Buttons">
                    <ComponentDisplay title="Primary Buttons">
                        <button className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors">Default</button>
                        <button className="px-6 py-2 bg-primary text-white font-semibold rounded-lg flex items-center gap-2"><span className="material-symbols-outlined">add</span>With Icon</button>
                        <button className="px-6 py-2 bg-primary text-white font-semibold rounded-lg opacity-50 cursor-not-allowed">Disabled</button>
                    </ComponentDisplay>
                    <ComponentDisplay title="Secondary Buttons">
                        <button className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-text-light dark:text-text-dark font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Default</button>
                        <button className="px-6 py-2 bg-secondary text-white font-semibold rounded-lg">Success</button>
                        <button className="px-6 py-2 text-primary font-semibold hover:underline">Text Button</button>
                    </ComponentDisplay>
                </Section>

                <Section title="Form Elements">
                    <ComponentDisplay title="Text Inputs">
                        <div className="w-full max-w-sm space-y-4">
                            <input type="text" placeholder="Default input" className="w-full px-4 py-2 border rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary" />
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light dark:text-text-muted-dark">mail</span>
                                <input type="email" placeholder="Input with icon" className="w-full pl-11 p-3 border rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary focus:border-primary" />
                            </div>
                            <input type="text" placeholder="Error state" className="w-full px-4 py-2 border-2 rounded-lg bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark border-red-500 focus:ring-2 focus:ring-red-500/50" />
                        </div>
                    </ComponentDisplay>
                     <ComponentDisplay title="Toggle Switch">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                     </ComponentDisplay>
                </Section>

                <Section title="Cards">
                    <ComponentDisplay title="Standard Card">
                         <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md w-full max-w-sm">
                            <h3 className="font-bold text-lg text-text-light dark:text-text-dark">Card Title</h3>
                            <p className="text-text-muted-light dark:text-text-muted-dark mt-2">This is a standard card component used for containing content sections.</p>
                            <button className="mt-4 text-primary font-semibold hover:underline">Action</button>
                        </div>
                    </ComponentDisplay>
                    <ComponentDisplay title="Glass Card (Dark Mode Only)">
                         <div className="dark w-full max-w-sm">
                            <div className="glass-card p-6 rounded-xl">
                                <h3 className="font-bold text-lg text-white">Glassmorphism Card</h3>
                                <p className="text-text-muted-dark mt-2">This card has a blurred background effect, often used in overlays.</p>
                            </div>
                         </div>
                    </ComponentDisplay>
                </Section>
                
                <Section title="Notifications">
                    <ComponentDisplay title="Toasts">
                        <div className="space-y-4 w-full max-w-sm">
                             <div className="relative p-4 rounded-xl shadow-lg text-white border flex items-start gap-3 bg-secondary border-secondary/50">
                                <span className="material-symbols-outlined text-2xl mt-0.5">check_circle</span>
                                <div className="flex-1">
                                    <p className="font-bold">Success</p>
                                    <p className="text-sm">This is a success message.</p>
                                </div>
                            </div>
                            <div className="relative p-4 rounded-xl shadow-lg text-white border flex items-start gap-3 bg-red-500 border-red-500/50">
                                <span className="material-symbols-outlined text-2xl mt-0.5">error</span>
                                <div className="flex-1">
                                    <p className="font-bold">Error</p>
                                    <p className="text-sm">This is an error message.</p>
                                </div>
                            </div>
                        </div>
                    </ComponentDisplay>
                </Section>
            </div>
        </div>
    );
};

export default ComponentsPage;