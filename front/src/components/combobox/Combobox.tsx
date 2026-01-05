import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import s from "./style.module.css";
import { ReactComponent as Cart } from "../../../public/cart.svg";

interface ComboboxProps {
    enumProp?: boolean;
    data: string[];
    placeholder?: string;
    onChangeIndex?: (index: string) => void;
    onChangeData?: (data: string) => void;
    className?: string;
}

const Combobox: React.FC<ComboboxProps> = memo(({
    className,
    enumProp,
    data,
    placeholder,
    onChangeIndex,
    onChangeData
}) => {
    const [active, setActive] = useState(false);
    const [currentValue, setCurrentValue] = useState(placeholder || data[0]);
    const comboRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Обработчик клика вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(event.target as Node)) {
                setActive(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = useCallback((value: string, index: number) => {
        setCurrentValue(value);
        setActive(false);
        
        if (enumProp) {
            onChangeIndex?.(String(index));
        } else {
            onChangeData?.(value);
        }
    }, [enumProp, onChangeIndex, onChangeData]);

    const toggleDropdown = useCallback(() => {
        setActive(prev => !prev);
    }, []);

    const renderItems = useCallback(() => {
        if (!active) return null;

        return data.map((value, index) => (
            <div 
                key={`${value}-${index}`}
                ref={el => itemRefs.current[index] = el}
                className={s.comboboxItem}
                onClick={() => handleItemClick(value, index)}
            >
                {value}
            </div>
        ));
    }, [active, data, handleItemClick]);

    return (
        <div 
            ref={comboRef}
            className={className || s.combobox} 
            style={{ position: "relative", width: "100%" }}
        >
            <div 
                className={s.mainBlock} 
                onClick={toggleDropdown}
                aria-expanded={active}
                role="combobox"
            >
                <span>{currentValue}</span>
                <div className={s.arrowMain}>
                    <span className={`${s.arrowLeft} ${active ? s.arrowLeftOpen : ''}`}></span>
                    <span className={`${s.arrowRight} ${active ? s.arrowRightOpen : ''}`}></span>
                </div>
            </div>
            
            {active && (
                <div className={s.list} style={{ position: "absolute", width: "100%" }}>
                    {renderItems()}
                </div>
            )}
        </div>
    );
});

export default Combobox;