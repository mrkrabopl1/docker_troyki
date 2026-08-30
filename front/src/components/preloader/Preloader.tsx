// src/components/preloader/Preloader.tsx
import React, { useEffect, useState } from 'react';
import { useAppSelector } from 'src/store/hooks/redux';

const Preloader: React.FC = () => {
    const { isLoading, totalImages, loadedCount, isHydrated } = useAppSelector(state => state.loading);
    const [isHidden, setIsHidden] = useState(true); // 👈 По умолчанию скрыт
    const [isClient, setIsClient] = useState(false);

    // Отмечаем, что мы на клиенте
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Управление видимостью прелоадера
    useEffect(() => {
        // На сервере или до гидратации - не показываем
        if (!isClient || !isHydrated) {
            setIsHidden(true);
            return;
        }

        // Если загрузка завершена - скрываем
        if (!isLoading && loadedCount >= totalImages) {
            setIsHidden(true);
            return;
        }

        // Если идет загрузка - показываем
        if (isLoading && totalImages > 0) {
            setIsHidden(false);
            return;
        }

        // Если нет изображений - скрываем
        if (totalImages === 0) {
            setIsHidden(true);
            return;
        }

    }, [isLoading, totalImages, loadedCount, isHydrated, isClient]);

    // Не рендерим на сервере и если скрыт
    if (!isClient || isHidden) return null;

    const progress = totalImages > 0 ? Math.round((loadedCount / totalImages) * 100) : 0;

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
            transition: 'opacity 0.3s ease',
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
                    width: '280px',
                    maxWidth: '80vw',
                }}>
                    <div style={{
                        width: '100%',
                        height: '3px',
                        background: '#f0f0f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: '#000',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                </div>
                
                <div style={{
                    fontSize: '13px',
                    color: '#999',
                    letterSpacing: '1px',
                }}>
                    {totalImages > 0 ? `${progress}%` : 'Загрузка...'}
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
            `}</style>
        </div>
    );
};

export default Preloader;