// src/components/Preloader/Preloader.tsx
import React from 'react';
import { useAppSelector } from 'src/store/hooks/redux';
import s from './style.module.css';

const Preloader: React.FC = () => {
    const isLoading = useAppSelector(state => state.loadingReducer.isLoading);

    if (!isLoading) return null;

    return (
        <div className={s.preloader}>
            <div className={s.spinner} />
            <p className={s.text}>Загрузка...</p>
        </div>
    );
};

export default Preloader;