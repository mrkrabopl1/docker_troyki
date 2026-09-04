import React, { useRef, useCallback, useState, useEffect } from 'react';
import { searchNames } from "src/providers/searchProvider";
import s from "./style.module.css";

type Props = {
    onDataRecieve: (...args: any) => void,
    searchCallback: (...args: any) => void,
    onChange?: (...args: any) => void,
    onFocus?: (...args: any) => void,
    onBlur?: (...args: any) => void,
    className?: string,
    val?: string,
    placeholder?: string,
    isExpanded?: boolean
}

const StyledSearch: React.FC<Props> = ({
    val = "",
    className,
    onDataRecieve,
    searchCallback,
    onChange,
    onBlur,
    onFocus,
    placeholder = "Search...",
    isExpanded = false
}) => {
    const throttlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text = useRef<string>(val);
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(val);

    const containerClassName = `${s.container} ${className || ''} ${isExpanded ? s.expanded : ''}`;
    const searchBoxClassName = `${s.searchBox} ${isExpanded ? s.expanded : ''}`;

    const handleEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            searchCallback(text.current);
        }
    }, [searchCallback]);

    const createSearchRequest = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange?.(newValue);
        text.current = newValue;

        if (throttlingTimerId.current) {
            clearTimeout(throttlingTimerId.current);
        }

        throttlingTimerId.current = setTimeout(() => {
            searchNames(newValue, 5, onDataRecieve);
        }, 1000);
    }, [onChange, onDataRecieve]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        onFocus?.();
    }, [onFocus]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        setTimeout(() => onBlur?.(), 400)
        
    }, [onBlur]);

    return (
        <div style={{ flex: isFocused ? 1 : 0, paddingLeft: isFocused ? "45px" : 0 }} className={containerClassName}>
            <div className={`${searchBoxClassName} ${isFocused ? s.focused : ''}`}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={createSearchRequest}
                    onKeyUp={handleEnter}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                />
                <span></span>
            </div>
        </div>
    );
};

export default React.memo(StyledSearch);