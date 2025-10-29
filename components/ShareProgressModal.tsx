import React, { useRef, useEffect, useState } from 'react';
import { User, Achievement } from '../types';

interface LevelData {
    level: number;
    levelName: string;
    totalXp: number;
}

interface ShareProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    levelData: LevelData;
    streak: number;
    achievements: Achievement[];
}

const FLYER_WIDTH = 600;
const FLYER_HEIGHT = 900;

// Helper to load an image with error handling
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Only set crossOrigin for non-blob URLs to prevent CORS issues with local object URLs
        if (!src.startsWith('blob:')) {
            img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
};


// Helper for drawing rounded rectangles
const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
};

const ShareProgressModal: React.FC<ShareProgressModalProps> = ({ isOpen, onClose, user, levelData, streak, achievements }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const shareOptionsRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [showShareOptions, setShowShareOptions] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const drawFlyer = async () => {
            setIsDrawing(true);
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!canvas || !ctx) return;

            // Set high-res dimensions
            canvas.width = FLYER_WIDTH * 2;
            canvas.height = FLYER_HEIGHT * 2;
            ctx.scale(2, 2);

            try {
                // --- Asset Loading ---
                await document.fonts.ready;

                await Promise.all([
                    document.fonts.load('700 48px "Plus Jakarta Sans"'),
                    document.fonts.load('700 24px "Poppins"'),
                    document.fonts.load('400 36px "Material Symbols Outlined"'),
                    document.fonts.load('60px "Material Symbols Outlined"'), // For fallback icon
                ]);
                
                const defaultAvatar = 'https://i.pravatar.cc/150?u=a042581f4e29026704d';
                const profileImgSrc = user?.avatarUrl || defaultAvatar;

                const [mascotImg, profileImg] = await Promise.all([
                    loadImage('https://lh3.googleusercontent.com/aida-public/AB6AXuA0nJAckBRNmJFNqlAqv5tNTcBi47GvgkXkJl5l6N2XemPTQRA8IhNddcxF2YrCLydSwyYYVkNO-3Txl0jl_JmQolR7tzgjihkHX5RHLe5t40xLwZp-S-3tois2kk5ZCEI0paVskx5CAPcEkH5yNZChvm_XSpsQbqtxoxOozq95vS_Ipz21u07aUKAWgjFrbOiXWqegc_CIcY_l3AHF0iDMCqYyGycSymt0n6JXLp85Kt3NECm0mcarUCtoxqkIllble7w1tlKDwWo'),
                    loadImage(profileImgSrc).catch(err => {
                        console.error("Could not load profile image, will use placeholder.", err);
                        return null; // Return null on failure
                    })
                ]);


                // --- Drawing Sections ---
                // Background
                const bgGradient = ctx.createLinearGradient(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
                bgGradient.addColorStop(0, '#1a3835');
                bgGradient.addColorStop(1, '#0f2321');
                ctx.fillStyle = bgGradient;
                ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);

                // Glow behind mascot
                const glow = ctx.createRadialGradient(FLYER_WIDTH / 2, FLYER_HEIGHT - 150, 50, FLYER_WIDTH / 2, FLYER_HEIGHT - 150, 400);
                glow.addColorStop(0, 'rgba(6, 249, 224, 0.15)');
                glow.addColorStop(1, 'rgba(6, 249, 224, 0)');
                ctx.fillStyle = glow;
                ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
                
                // Mascot
                if(mascotImg) ctx.drawImage(mascotImg, 50, FLYER_HEIGHT - 450, 500, 500);

                // Header
                ctx.font = 'bold 24px "Poppins"';
                ctx.fillStyle = '#06f9e0';
                ctx.textAlign = 'center';
                ctx.fillText('Oratora', FLYER_WIDTH / 2, 60);

                // Profile Section
                ctx.save();
                ctx.beginPath();
                ctx.arc(FLYER_WIDTH / 2, 140, 52, 0, Math.PI * 2);
                ctx.fillStyle = '#06f9e0';
                ctx.shadowColor = 'rgba(6, 249, 224, 0.5)';
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.clip(); // Clip to the circle
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                if (profileImg) {
                    // If image loaded, draw it
                    ctx.drawImage(profileImg, FLYER_WIDTH / 2 - 50, 90, 100, 100);
                } else {
                    // If image failed, draw a placeholder icon
                    ctx.fillStyle = '#1a3835'; // Background for icon
                    ctx.fillRect(FLYER_WIDTH / 2 - 50, 90, 100, 100);
                    ctx.font = '60px "Material Symbols Outlined"';
                    ctx.fillStyle = '#06f9e0';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('person', FLYER_WIDTH / 2, 140);
                }
                ctx.restore(); // Restore from clipping
                
                ctx.font = 'bold 32px "Plus Jakarta Sans"';
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center'; // ensure text align is correct for name
                ctx.textBaseline = 'alphabetic'; // reset baseline
                ctx.fillText(user?.name || 'A Speaker', FLYER_WIDTH / 2, 230);

                // Level Info
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                drawRoundRect(ctx, 50, 260, FLYER_WIDTH - 100, 140, 20);
                
                ctx.font = 'bold 48px "Plus Jakarta Sans"';
                ctx.fillStyle = '#06f9e0';
                ctx.fillText(`Level ${levelData.level}`, FLYER_WIDTH / 2, 325);
                
                ctx.font = '24px "Poppins"';
                ctx.fillStyle = '#E0E0E0';
                ctx.fillText(levelData.levelName, FLYER_WIDTH / 2, 365);
                
                // Stats
                const stats = [
                    { label: 'Total XP', value: levelData.totalXp.toLocaleString(), icon: 'workspace_premium' },
                    { label: 'Practice Streak', value: `${streak} Days`, icon: 'local_fire_department' },
                ];
                stats.forEach((stat, index) => {
                    const cardWidth = (FLYER_WIDTH - 150) / 2;
                    const x = 50 + index * (cardWidth + 50);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    drawRoundRect(ctx, x, 430, cardWidth, 120, 15);
                    
                    ctx.font = '36px "Material Symbols Outlined"';
                    ctx.fillStyle = '#06f9e0';
                    ctx.fillText(stat.icon, x + cardWidth / 2, 470);

                    ctx.font = 'bold 28px "Plus Jakarta Sans"';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText(stat.value, x + cardWidth / 2, 510);
                    
                    ctx.font = '14px "Poppins"';
                    ctx.fillStyle = '#a0b5b3';
                    ctx.fillText(stat.label, x + cardWidth / 2, 530);
                });

                // Achievements
                const unlockedAchievements = achievements.filter(a => a.unlocked).slice(0, 4);
                if (unlockedAchievements.length > 0) {
                    ctx.font = 'bold 20px "Poppins"';
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillText('Recent Achievements', FLYER_WIDTH / 2, 750);
                    
                    const achievementIconSize = 50;
                    const totalWidth = unlockedAchievements.length * achievementIconSize + (unlockedAchievements.length - 1) * 20;
                    let startX = (FLYER_WIDTH - totalWidth) / 2;
                    
                    unlockedAchievements.forEach(ach => {
                        ctx.fillStyle = 'rgba(6, 249, 224, 0.1)';
                        ctx.beginPath();
                        ctx.arc(startX + achievementIconSize / 2, 810, achievementIconSize / 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.font = '32px "Material Symbols Outlined"';
                        ctx.fillStyle = '#06f9e0';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(ach.icon, startX + achievementIconSize / 2, 810);
                        startX += achievementIconSize + 20;
                    });
                }
                
                // Footer
                ctx.font = '16px "Poppins"';
                ctx.fillStyle = '#a0b5b3';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText('Join me on Oratora!', FLYER_WIDTH / 2, FLYER_HEIGHT - 40);

            } catch (error) {
                console.error("Failed to draw canvas:", error);
                ctx.fillStyle = '#1a3835';
                ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Error generating image.', FLYER_WIDTH / 2, FLYER_HEIGHT / 2);
            } finally {
                setIsDrawing(false);
            }
        };

        drawFlyer();
    }, [isOpen, user, levelData, streak, achievements]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `oratora-progress-${user?.name?.toLowerCase()?.replace(/\s/g, '-') || 'speaker'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
    
    const handleShare = async () => {
        const canvas = canvasRef.current;
        if (!canvas || isDrawing) return;
    
        setIsSharing(true);
        try {
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob.'));
                    }
                }, 'image/png');
            });
    
            if (navigator.share) {
                const file = new File([blob], 'oratora-progress.png', { type: 'image/png' });
                const shareData = {
                    files: [file],
                    title: 'My Oratora Progress!',
                    text: `I've reached Level ${levelData.level} (${levelData.levelName}) on Oratora! Join me and become a more confident speaker. #OratoraAI #PublicSpeaking`,
                };
    
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share(shareData);
                } else {
                    console.warn("File sharing is not supported by this browser, showing fallback.");
                    setShowShareOptions(true);
                }
            } else {
                setShowShareOptions(true);
            }
        } catch (error) {
            // The user cancelling the share dialog is not an error we need to show.
            if ((error as DOMException).name !== 'AbortError') {
                console.error('Error sharing:', error);
                // If sharing fails for any reason (e.g., user gesture error), show fallback options.
                setShowShareOptions(true);
            }
        } finally {
            setIsSharing(false);
        }
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target as Node)) {
                setShowShareOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!isOpen) return null;
    
    const shareData = {
        text: `I've reached Level ${levelData.level} (${levelData.levelName}) on Oratora! Join me and become a more confident speaker. #OratoraAI #PublicSpeaking`,
        url: "https://oratora.ai",
        title: "My Oratora Progress!"
    };
    const encodedText = encodeURIComponent(shareData.text);
    const encodedUrl = encodeURIComponent(shareData.url);
    const socialLinks = {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent(shareData.title)}&summary=${encodedText}`,
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
            <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-xl bg-card-dark shadow-xl p-6 m-4 flex flex-col items-center">
                <h2 className="text-2xl font-bold text-white mb-4">Share Your Progress</h2>
                <div className="w-full" style={{ aspectRatio: `${FLYER_WIDTH} / ${FLYER_HEIGHT}` }}>
                    <canvas ref={canvasRef} className="w-full h-full rounded-lg" />
                    {isDrawing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-card-dark rounded-lg">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
                <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full">
                    <div className="relative w-full">
                        <button onClick={handleShare} disabled={isDrawing || isSharing} className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white text-base font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                            {isSharing ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">share</span>
                                    <span>Share</span>
                                </>
                            )}
                        </button>
                         {showShareOptions && (
                            <div ref={shareOptionsRef} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-800 rounded-lg shadow-lg p-2 flex gap-2 z-20 animate-fade-in-up-small">
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
                    <button onClick={handleDownload} disabled={isDrawing} className="w-full flex items-center justify-center gap-2 h-12 px-6 bg-slate-700 text-white text-base font-bold rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50">
                        <span className="material-symbols-outlined">download</span>
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareProgressModal;