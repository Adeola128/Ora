
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Resource } from '../types';

interface ResourceArticlePageProps {
    articleId: string | null;
    onBack: () => void;
}

const ResourceArticlePage: React.FC<ResourceArticlePageProps> = ({ articleId, onBack }) => {
    const [article, setArticle] = useState<Resource | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            if (!articleId) {
                setError("No article ID provided.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const { data, error } = await supabase
                .from('resources')
                .select('title, subtitle, icon, content')
                .eq('id', articleId)
                .single();

            if (error) {
                setError(error.message);
                console.error("Error fetching article:", error);
            } else if (data) {
                setArticle(data as Resource);
            }
            setIsLoading(false);
        };
        fetchArticle();
    }, [articleId]);

    if (isLoading) {
         return (
            <div className="p-4 md:p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="p-4 md:p-8 text-center">
                <h1 className="text-2xl font-bold">Resource Not Found</h1>
                <p className="mt-2 text-text-muted-light dark:text-text-muted-dark">{error || "The requested article could not be found."}</p>
                <button onClick={onBack} className="mt-6 px-6 py-2 bg-primary text-white font-semibold rounded-lg">Back to Resources</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <div className="max-w-3xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-primary font-semibold mb-6 hover:underline">
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Resources
                </button>

                <article className="bg-card-light dark:bg-card-dark p-6 sm:p-8 rounded-xl shadow-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-primary/10">
                            <span className="material-symbols-outlined text-primary text-4xl">{article.icon}</span>
                        </div>
                        <div>
                             <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{article.title}</h1>
                             <p className="text-text-muted-light dark:text-text-muted-dark mt-1">{article.subtitle}</p>
                        </div>
                    </div>
                   
                    <div className="prose prose-lg dark:prose-invert max-w-none mt-6 text-text-light dark:text-text-dark prose-headings:font-bold prose-headings:text-text-light dark:prose-headings:text-text-dark prose-a:text-primary hover:prose-a:underline prose-strong:text-text-light dark:prose-strong:text-text-dark">
                        {article.content.map((block, index) => {
                            switch (block.type) {
                                case 'paragraph':
                                    return <p key={index}>{block.text}</p>;
                                case 'heading':
                                    return <h3 key={index}>{block.text}</h3>;
                                case 'list':
                                    return (
                                        <ul key={index}>
                                            {block.items && block.items.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    );
                                case 'tip':
                                    return (
                                        <div key={index} className="bg-blue-50 dark:bg-primary/20 p-4 rounded-lg border-l-4 border-primary my-6 not-prose">
                                            <p className="text-blue-800 dark:text-blue-200">{block.text}</p>
                                        </div>
                                    );
                                default:
                                    return null;
                            }
                        })}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ResourceArticlePage;
