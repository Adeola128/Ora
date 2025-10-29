import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ResourceFromDB {
    id: string;
    category: string;
    title: string;
    subtitle: string;
    icon: string;
}

interface GroupedResource {
    title: string;
    icon: string;
    resources: { id: string; title: string; subtitle: string }[];
}

interface ResourcesPageProps {
    onNavigateToResource: (resourceId: string) => void;
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ onNavigateToResource }) => {
    const [groupedResources, setGroupedResources] = useState<GroupedResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResources = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('resources')
                .select('id, category, title, subtitle, icon');

            if (error) {
                setError(error.message);
                console.error("Error fetching resources:", error);
            } else if (data) {
                const groups: { [key: string]: GroupedResource } = {};
                (data as ResourceFromDB[]).forEach(resource => {
                    if (!groups[resource.category]) {
                        groups[resource.category] = {
                            title: resource.category,
                            icon: resource.icon, // Use icon from first item in category
                            resources: [],
                        };
                    }
                    groups[resource.category].resources.push({
                        id: resource.id,
                        title: resource.title,
                        subtitle: resource.subtitle,
                    });
                });
                setGroupedResources(Object.values(groups));
            }
            setIsLoading(false);
        };
        fetchResources();
    }, []);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }
    
    if (error) {
         return <div className="p-4 md:p-8 text-center text-red-500">Error loading resources: {error}</div>;
    }


    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Resource Library</h1>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-1">
                    A curated library of articles, videos, and exercises to help you improve.
                </p>
            </header>
            
            <div className="space-y-10">
                {groupedResources.map(category => (
                    <section key={category.title}>
                        <div className="flex items-center gap-3 mb-4">
                             <span className="material-symbols-outlined text-primary text-3xl">{category.icon}</span>
                            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">{category.title}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {category.resources.map(resource => (
                                <button 
                                    key={resource.id}
                                    onClick={() => onNavigateToResource(resource.id)}
                                    className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-lg text-text-light dark:text-text-dark">{resource.title}</h3>
                                    </div>
                                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1">{resource.subtitle}</p>
                                    <p className="text-primary mt-4 font-semibold group-hover:underline flex items-center gap-1">
                                        Read More <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className="mt-12 text-center p-8 bg-background-light dark:bg-card-dark rounded-xl border-2 border-dashed border-border-light dark:border-border-dark">
                <h2 className="text-xl font-bold">More Coming Soon!</h2>
                <p className="text-text-muted-light dark:text-text-muted-dark mt-2">We are constantly adding new resources to help you on your journey.</p>
            </div>
        </div>
    );
};

export default ResourcesPage;