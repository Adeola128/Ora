import React from 'react';

const CoursesPage: React.FC = () => {
    return (
        <div className="p-4 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[60vh] animate-fade-in">
            <div className="w-48 h-48 rounded-full flex items-center justify-center bg-primary/10 mb-8">
                <span className="material-symbols-outlined text-primary text-9xl">school</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Courses are Coming Soon!</h1>
            <p className="mt-4 max-w-lg text-lg text-text-muted-light dark:text-text-muted-dark">
                We're developing a library of interactive courses to help you master public speaking. Check back later for updates!
            </p>
        </div>
    );
};

export default CoursesPage;
