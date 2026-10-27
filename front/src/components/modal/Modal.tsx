import React, { useEffect, useCallback } from 'react';
import s from "./style.module.css";
import { setGlobalScroller } from 'src/global';

interface ModalProps {
    active: boolean;
    onChange: (isActive: boolean) => void;
    children: React.ReactNode;
    showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
    active, 
    onChange, 
    children, 
    showCloseButton = true 
}) => {
    useEffect(() => {
        setGlobalScroller(active);
        return () => {
            setGlobalScroller(false);
            console.debug("Modal unmounted");
        };
    }, [active]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(false);
    }, [onChange]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.stopPropagation();
    }, []);

    const handleCloseClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(false);
    }, [onChange]);

    if (!active) return null;

    return (
        <div 
            className={s.modalBack}
            onClick={handleBackdropClick}
            onWheel={handleWheel}
            onScroll={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className={s.modalContent}
                onClick={(e) => {
                    // e.stopPropagation()
                }}
            >
                {showCloseButton && (
                    <button
                        type="button"
                        className={s.close}
                        onClick={handleCloseClick}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                )}
                {children}
            </div>
        </div>
    );
};

export default React.memo(Modal, (prevProps, nextProps) => {
    return prevProps.active === nextProps.active && 
           prevProps.children === nextProps.children &&
           prevProps.showCloseButton === nextProps.showCloseButton;
});