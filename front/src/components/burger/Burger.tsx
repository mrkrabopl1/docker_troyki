import React, { useState, useEffect, useCallback,memo } from 'react';
import s from "./style.module.css";

interface BurgerProps {
    onChange?: (isActive: boolean) => void;
    activeProps: boolean;
}

const Burger: React.FC<BurgerProps> = ({ 
    onChange = () => null, 
    activeProps 
}) => {
    const [active, setActive] = useState(activeProps);

    const toggleActive = useCallback(() => {
        const newActive = !active;
        setActive(newActive);
        onChange(newActive);
    }, [active, onChange]);

    const getMainClassName = useCallback(() => {
        const baseClasses = [s.hamburger, s.hamburger_slider];
        if (active) baseClasses.push(s.is_active);
        return baseClasses.join(' ');
    }, [active]);

    useEffect(() => {
        setActive(activeProps);
    }, [activeProps]);

    return (
        <div 
            onClick={toggleActive} 
            className={getMainClassName()}
            role="button"
            aria-pressed={active}
            tabIndex={0}
        >
            <div className={s.hamburger_box}>
                <div className={s.hamburger_inner}></div>
            </div>
        </div>
    );
};

export default memo(Burger);