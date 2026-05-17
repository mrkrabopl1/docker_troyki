import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import s from "./style.module.css";

interface ComboboxProps {
    enumProp?: boolean;
    data: { [key: number | string]: string } | string[];
    placeholder?: string;
    onChangeIndex?: (index: string) => void;
    onChangeData?: (data: string) => void;
    className?: string;
    currentIndex?: number|string;
    width?: string | number;
}

const Combobox: React.FC<ComboboxProps> = memo(({
    className,
    enumProp,
    data,
    placeholder,
    onChangeIndex,
    onChangeData,
    width = '100%',
    currentIndex = -1
}) => {
    const [active, setActive] = useState(false);
    const [currentValue, setCurrentValue] = useState(data[currentIndex] || placeholder || data[0]);
    const comboRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Обработчик клика вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(event.target as Node)) {
                setActive(false);
            }
        };
        setCurrentValue(data[currentIndex] || placeholder || data[0]);
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    useEffect(() => {

        setCurrentValue(data[currentIndex] || placeholder || data[0]);

    }, [data,currentIndex]);
    // Обработчик скролла с stopPropagation
    const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
        e.stopPropagation();
    }, []);

    const handleItemClick = useCallback((value: string, index: string) => {
        setCurrentValue(value);
        setActive(false);
        onChangeIndex?.(index);
        onChangeData?.(value);
    }, [enumProp, onChangeIndex, onChangeData]);

    const toggleDropdown = useCallback(() => {
        setActive(prev => !prev);
    }, []);

    const renderItems = useCallback(() => {
        if (!active) return null;

        return (
            <div
                ref={dropdownRef}
                className={s.dropdown}
                onWheel={handleWheel}
            >
                {Object.entries(data).map(([key, value]) => (
                    <div
                        key={`${value}-${key}`}
                        ref={el => itemRefs.current[Number(key)] = el}
                        className={`${s.comboboxItem} ${currentValue === value ? s.selected : ''}`}
                        onClick={() => handleItemClick(value, key)}
                    >
                        {value}
                    </div>
                ))}
            </div>
        );
    }, [active, data, currentValue, handleItemClick, handleWheel]);

    return (
        <div
            ref={comboRef}
            style={{ width: typeof width === 'number' ? `${width}px` : width }}
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