// src/components/preloader/Preloader.tsx
import React, { useState, useEffect } from 'react';
import { useAppSelector } from 'src/store/hooks/redux';

const Preloader: React.FC = () => {
    const { isLoading, totalImages, loadedCount } = useAppSelector(state => state.loadingReducer);
    const [isHidden, setIsHidden] = useState(false);
    
    useEffect(() => {
        if (!isLoading && totalImages > 0 && loadedCount >= totalImages) {
            const timer = setTimeout(() => setIsHidden(true), 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading, totalImages, loadedCount]);
    
    if (isHidden) return null;
    
    // ⚡ ВСЕ СТИЛИ ИНЛАЙН — РАБОТАЮТ МГНОВЕННО
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            zIndex: 999999,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    border: '3px solid #f0f0f0',
                    borderTop: '3px solid #000000',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                
                <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    letterSpacing: '4px',
                    color: '#000',
                    animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                    TROYKI BENCH
                </div>
                
                <div style={{
                    width: '200px',
                    height: '2px',
                    background: '#f0f0f0',
                    borderRadius: '2px',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        height: '100%',
                        width: '0%',
                        background: '#000',
                        borderRadius: '2px',
                        animation: 'loading 2s ease-in-out infinite',
                    }} />
                </div>
            </div>
            
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes loading {
                    0% { width: 0%; transform: translateX(0); }
                    50% { width: 70%; transform: translateX(0); }
                    100% { width: 100%; transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default Preloader;