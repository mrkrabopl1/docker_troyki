import React, { useEffect, useCallback } from 'react';
import s from "./style.module.css";
import { setGlobalScroller } from 'src/global';

interface ModalProps {
    active: boolean;
    onChange: (isActive: boolean) => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ active, onChange, children }) => {
    // Управление скроллом
    useEffect(() => {
        setGlobalScroller(active);
        return () => {
            setGlobalScroller(false);
            console.debug("Modal unmounted");
        };
    }, [active]);

    // Обработчик клика по фону
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(false);
    }, [onChange]);

    // Обработчик колеса мыши
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
    }, []);

    if (!active) return null;

    return (
        <div 
            className={s.modalBack}
            onClick={handleBackdropClick}
            onWheel={handleWheel}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className={s.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export default React.memo(Modal, (prevProps, nextProps) => {
    return prevProps.active === nextProps.active && 
           prevProps.children === nextProps.children;
});