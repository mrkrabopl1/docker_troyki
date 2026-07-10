// src/components/preloader/Preloader.tsx
import React from 'react';
import s from './style.module.css';
import { useAppSelector } from 'src/store/hooks/redux';
const Preloader: React.FC = () => {
    const isLoading = useAppSelector(state => state.loadingReducer.isLoading);

    if (!isLoading) return null;
    return (
        <div className={s.preloaderWrapper}>
            <div className={s.preloaderContainer}>
                <div className={s.spinner} />
                <div className={s.logo}>TROYKI BENCH</div>
                <div className={s.loadingBar}>
                    <div className={s.loadingBarFill} />
                </div>
            </div>
        </div>
    );
};

export default Preloader;