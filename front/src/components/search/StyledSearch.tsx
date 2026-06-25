import React, { useRef, useCallback, useState } from 'react';
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
    placeholder?: string
}

const StyledSearch: React.FC<Props> = ({
    val = "",
    className,
    onDataRecieve,
    searchCallback, 
    onChange,
    onBlur,
    onFocus,
    placeholder = "Search..."
}) => {
    const throttlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);
    const text = useRef<string>(val);
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(val);
    
    const containerClassName = className ? `${s.container} ${className}` : s.container;
    const searchBoxClassName = s.searchBox;
    
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
        onBlur?.();
    }, [onBlur]);

    return (
        <div className={containerClassName}>
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