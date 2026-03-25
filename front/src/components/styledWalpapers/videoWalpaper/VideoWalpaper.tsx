// VideoWallpaper.tsx
import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import s from './style.module.css';

interface VideoWallpaperProps {
    /** Путь к видео файлу */
    src: string;
    /** MIME тип видео */
    type?: string;
    /** Затемнение видео (0 - 1) */
    overlay?: number;
    /** Цвет затемнения */
    overlayColor?: string;
    /** Без звука */
    muted?: boolean;
    /** Зацикленное воспроизведение */
    loop?: boolean;
    /** Дополнительные CSS классы */
    className?: string;
    /** Inline стили */
    style?: React.CSSProperties;
    /** Скорость воспроизведения */
    playbackRate?: number;
    /** Колбэк при ошибке */
    onError?: (error: Event) => void;
}

const VideoWallpaper: React.FC<VideoWallpaperProps> = memo((props) => {
    const {
        src,
        type = 'video/mp4',
        overlay = 0,
        overlayColor = '#000',
        muted = true,
        loop = true,
        className = '',
        style = {},
        playbackRate = 1,
        onError
    } = { ...props };

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    const handleLoadedData = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback((e: Event) => {
        console.error('Video wallpaper error:', e);
        if (onError) onError(e);
    }, [onError]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const playVideo = async () => {
            try {
                video.playbackRate = playbackRate;
                await video.play();
            } catch (error) {
                console.warn('Auto-play was prevented:', error);
            }
        };

        playVideo();

        return () => {
            video.pause();
        };
    }, [playbackRate]);

    const containerClasses = [
        s.videoWallpaper,
        isLoaded ? s.loaded : s.loading,
        className
    ].filter(Boolean).join(' ');

    const overlayStyle: React.CSSProperties = {
        backgroundColor: overlayColor,
        opacity: overlay
    };

    return (
        <div
            ref={containerRef}
            className={containerClasses}
            style={style}
        >
            <video
                ref={videoRef}
                className={s.video}
                src={src}
                muted={muted}
                loop={loop}
                playsInline
                preload="auto"
                onLoadedData={handleLoadedData}
            />

            {overlay > 0 && (
                <div
                    className={s.overlay}
                    style={overlayStyle}
                />
            )}
        </div>
    );
});

export default VideoWallpaper;