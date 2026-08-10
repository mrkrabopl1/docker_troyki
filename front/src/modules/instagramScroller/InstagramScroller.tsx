// src/modules/instagramScroller/InstagramScroller.tsx
import React, { memo, useMemo } from 'react';
import CarouselSlider from 'src/components/contentSlider/CarouselSlider';
import { useAppSelector } from 'src/store/hooks/redux';
import s from './style.module.css';

const InstagramScroller: React.FC = memo(() => {
    const { photos, loading } = useAppSelector(state => state.instagram);

    const instagramItems = useMemo(() => {
        if (!photos || photos.length === 0) {
            return [
                <div key="empty" className={s.emptyState}>
                    <p>Нет фотографий</p>
                </div>
            ];
        }
        
        return photos.map(post => (
            <div key={post.id} className={s.instagramItem}>
                <img 
                    src={post.image_url} 
                    alt="Instagram"
                    className={s.instagramImage}
                    loading="lazy"
                />
            </div>
        ));
    }, [photos]);

    if (loading && photos.length === 0) {
        return (
            <div className={s.instagramWrapper}>
                <div className={s.instagramHeader}>
                    <h2 className={s.instagramTitle}>Мы в Instagram</h2>
                </div>
                <div className={s.loadingState}>
                    <div className={s.loader}></div>
                </div>
            </div>
        );
    }

    if (photos.length === 0) {
        return null;
    }

    return (
        <div className={s.instagramWrapper}>
            <div className={s.instagramHeader}>
                <h2 className={s.instagramTitle}>Мы в Instagram</h2>
            </div>
            <div className={s.instagramScroller}>
                <CarouselSlider items={instagramItems} />
            </div>
        </div>
    );
});

export default InstagramScroller;