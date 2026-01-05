import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import s from "./style.module.css";

type PropsRowType = {
    className?: {
        main?: string;
        second?: string;
    };
    info: string;
    children: React.ReactNode;
};

const DoubleInfoDrop: React.FC<PropsRowType> = ({ 
    className = {}, 
    info, 
    children 
}) => {
    const [active, setActive] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);
    
    // Мемоизированный обработчик переключения
    const toggleActive = useCallback(() => {
        setActive(prev => !prev);
    }, []);

    // Мемоизированные стили для выпадающего блока
    const dropStyle = useMemo(() => ({
        transition: "height 0.3s ease-in-out",
        height: active ? `${dropRef.current?.scrollHeight}px` : "0px",
        overflow: "hidden"
    }), [active]);

    // Мемоизированные классы для стрелок
    const arrowLeftClass = useMemo(() => (
        [s.arrowLeft, active ? s.arrowLeftOpen : null].filter(Boolean).join(" ")
    ), [active]);

    const arrowRightClass = useMemo(() => (
        [s.arrowRight, active ? s.arrowRightOpen : null].filter(Boolean).join(" ")
    ), [active]);

    // Мемоизированный класс для текста
    const textClass = useMemo(() => (
        active && className.second ? className.second : ""
    ), [active, className.second]);

    return (
        <div style={{ position: "relative" }} className={className.main || ""}>
            <div
                onClick={toggleActive}
                style={{ display: "flex", cursor: "pointer" }}
                role="button"
                aria-expanded={active}
            >
                <p style={{ paddingRight: "15px" }} className={textClass}>
                    {info}
                </p>
                <div className={s.arrowMain}>
                    <span className={arrowLeftClass}></span>
                    <span className={arrowRightClass}></span>
                </div>
            </div>
            <div style={dropStyle}>
                <div ref={dropRef}>{children}</div>
            </div>
        </div>
    );
};

export default React.memo(DoubleInfoDrop);