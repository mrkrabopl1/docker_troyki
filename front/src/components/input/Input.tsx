import React, { useRef, useState, useCallback, ChangeEvent, FocusEvent,useEffect } from 'react';

type InputProps = {
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    value?: string;
};

const Input: React.FC<InputProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = '',
    value = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [internalValue, setInternalValue] = useState(value);

    // Обновление внутреннего состояния при изменении внешнего value
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInternalValue(newValue);
        onChange(newValue);
    }, [onChange]);

    const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
        onBlur?.(e.target.value);
    }, [onBlur]);

    return (
        <input
            ref={inputRef}
            value={internalValue}
            placeholder={placeholder}
            style={{ boxSizing: 'border-box', width: "100%" }}
            className={className}
            type="text"
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
        />
    );
};

export default React.memo(Input);