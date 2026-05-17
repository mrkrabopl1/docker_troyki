import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from 'react';
import s from "./comboboxWithSearch.module.css";

interface ComboboxWithSearchProps {
    data: { [key: number | string]: string } | string[];
    placeholder?: string;
    onChangeIndex?: (index: string) => void;
    onChangeData?: (data: string) => void;
    className?: string;
    currentIndex?: number | string;
    width?: string | number;
    searchPlaceholder?: string;
    noResultsText?: string;
}

const ComboboxWithSearch: React.FC<ComboboxWithSearchProps> = memo(({
    className,
    data,
    placeholder,
    onChangeIndex,
    onChangeData,
    width = '100%',
    currentIndex = -1,
    searchPlaceholder = "Search...",
    noResultsText = "No results found"
}) => {
    const [active, setActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentValue, setCurrentValue] = useState(data[currentIndex] || placeholder || Object.values(data)[0] || "");
    const comboRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const itemsContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        return Object.entries(data).reduce((acc, [key, value]) => {
            if (value.toLowerCase().includes(searchTerm.toLowerCase())) {
                acc[Number(key)] = value;
            }
            return acc;
        }, {} as { [key: number]: string });
    }, [data, searchTerm]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(event.target as Node)) {
                setActive(false);
                setSearchTerm("");
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update current value when data or currentIndex changes
    useEffect(() => {
        setCurrentValue(data[currentIndex] || placeholder || Object.values(data)[0] || "");
    }, [data, currentIndex, placeholder]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (active && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 0);
        }
    }, [active]);

    const handleItemClick = useCallback((value: string, index: string) => {
        setCurrentValue(value);
        setActive(false);
        setSearchTerm("");

        onChangeIndex?.(index);
        onChangeData?.(value);
    }, [onChangeIndex, onChangeData]);

    const toggleDropdown = useCallback(() => {
        setActive(prev => !prev);
        if (!active) {
            setSearchTerm("");
        }
    }, [active]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        // Scroll to top of items container when searching
        if (itemsContainerRef.current) {
            itemsContainerRef.current.scrollTop = 0;
        }
    }, []);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();

        // Select first item on Enter if there are results
        if (e.key === 'Enter' && Object.keys(filteredData).length > 0) {
            const firstItem = Object.entries(filteredData)[0];
            if (firstItem) {
                handleItemClick(firstItem[1], firstItem[0]);
            }
        }
    }, [filteredData, handleItemClick]);

    const renderDropdown = useCallback(() => {
        if (!active) return null;

        const hasResults = Object.keys(filteredData).length > 0;

        return (
            <div
            onWheel={(e) => e.stopPropagation()}
                onScroll={(e) => e.stopPropagation()}
                ref={dropdownRef}
                className={s.dropdown}
            >
                {/* Fixed Search Input */}
                <div className={s.searchContainer}>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className={s.searchInput}
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>

                {/* Scrollable Items Container */}
                <div
                    ref={itemsContainerRef}
                    onScroll={(e) => e.stopPropagation()}
                    className={s.itemsContainer}
                >
                    {hasResults ? (
                        Object.entries(filteredData).map(([key, value]) => (
                            <div
                                key={`${value}-${key}`}
                                className={`${s.comboboxItem} ${currentValue === value ? s.selected : ''}`}
                                onClick={() => handleItemClick(value, key)}
                            >
                                {value}
                            </div>
                        ))
                    ) : (
                        <div className={s.noResults}>
                            {noResultsText}
                        </div>
                    )}
                </div>
            </div>
        );
    }, [active, filteredData, currentValue, handleItemClick, searchTerm, handleSearchChange, handleSearchKeyDown, searchPlaceholder, noResultsText]);

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

            {renderDropdown()}
        </div>
    );
});

export default ComboboxWithSearch;