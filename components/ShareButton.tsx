import React, { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
    shareData: {
        title: string;
        text: string;
        url: string;
    };
    children: React.ReactNode;
    className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ shareData, children, className }) => {
    const [showFallback, setShowFallback] = useState(false);
    const fallbackRef = useRef<HTMLDivElement>(null);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support the Web Share API
            setShowFallback(true);
        }
    };

    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);

    const socialLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent(shareData.title)}&summary=${encodedText}`,
    };

    // Close fallback when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fallbackRef.current && !fallbackRef.current.contains(event.target as Node)) {
                setShowFallback(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative inline-block">
            <button onClick={handleShare} className={className}>
                {children}
            </button>

            {showFallback && (
                <div ref={fallbackRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-card-dark rounded-lg shadow-lg p-2 flex gap-2 z-20 animate-fade-in-up-small">
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-700" aria-label="Share on Twitter">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.39.106-.803.163-1.227.163-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"></path></svg>
                    </a>
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-700" aria-label="Share on Facebook">
                         <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path></svg>
                    </a>
                     <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-slate-700" aria-label="Share on LinkedIn">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.98v16h4.98v-8.369c0-2.025 1.72-3.631 3.631-3.631 1.911 0 3.369 1.606 3.369 3.631v8.369h4.98v-10.428c0-5.283-3.094-9.572-8.375-9.572-3.844 0-6.625 2.144-7.625 4.218z"></path></svg>
                    </a>
                </div>
            )}
        </div>
    );
};

export default ShareButton;