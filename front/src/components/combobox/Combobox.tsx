import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import s from "./style.module.css";
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

        return (
            <div className={s.dropdown}>
                {data.map((value, index) => (
                    <div 
                        key={`${value}-${index}`}
                        ref={el => itemRefs.current[index] = el}
                        className={`${s.comboboxItem} ${currentValue === value ? s.selected : ''}`}
                        onClick={() => handleItemClick(value, index)}
                    >
                        {value}
                    </div>
                ))}
            </div>
        );
    }, [active, data, currentValue, handleItemClick]);

    return (
        <div 
            ref={comboRef}
            className={`${s.combobox} ${className || ''} ${active ? s.active : ''}`}
        >
            <div 
                className={s.mainBlock} 
                onClick={toggleDropdown}
                aria-expanded={active}
                role="combobox"
            >
                <span className={s.currentValue}>{currentValue}</span>
                  <div className={s.arrowMain}>
                    <span className={`${s.arrowLeft} ${active ? s.arrowLeftOpen : ''}`}></span>
                    <span className={`${s.arrowRight} ${active ? s.arrowRightOpen : ''}`}></span>
                </div>
            </div>
            
            {renderItems()}
        </div>
    );
});

export default Combobox;