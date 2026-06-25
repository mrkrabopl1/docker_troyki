// src/components/LazyImage/LazyImage.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { addImageToLoad, imageLoaded } from 'src/store/reducers/loadingSlice';
import s from './style.module.css';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, onLoad, onError }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const dispatch = useAppDispatch();

    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
        
        // Сообщаем о новом изображении для загрузки
        dispatch(addImageToLoad(1));

        const img = new Image();
        img.src = src;
        
        img.onload = () => {
            setIsLoaded(true);
            dispatch(imageLoaded());
            onLoad?.();
        };
        
        img.onerror = () => {
            setHasError(true);
            dispatch(imageLoaded()); // Все равно считаем как загруженное
            onError?.();
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    if (hasError) {
        return <div className={s.errorPlaceholder}>Ошибка загрузки</div>;
    }

    return (
        <div className={`${s.imageWrapper} ${className || ''}`}>
            {!isLoaded && <div className={s.skeleton} />}
            <img
                src={src}
                alt={alt}
                className={`${s.image} ${isLoaded ? s.loaded : s.loading}`}
                style={{ opacity: isLoaded ? 1 : 0 }}
            />
        </div>
    );
};

export default LazyImage;