import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./style.module.css";

type InputWithLabelProps = {
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    val?: string;
};

const InputWithLabel: React.FC<InputWithLabelProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = '',
    val = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [value, setValue] = useState(val);

    // Синхронизация с внешним значением
    useEffect(() => {
        setValue(val);
    }, [val]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        onChange(newValue);
    }, [onChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(e.target.value);
    }, [onBlur]);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const containerClass = className || s.inputWithLabel;

    return (
        <div className={s.inputContainer}>
            <input
                ref={inputRef}
                value={value}
                className={s.inputWithLabel}
                style={{ boxSizing: 'border-box', width: "100%" }}
                type="text"
                onChange={handleChange}
                placeholder=''
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                aria-label={placeholder}
            />
            {placeholder && (
                <label 
                    onClick={focusInput} 
                    className={s.label}
                    htmlFor={inputRef.current?.id}
                >
                    {placeholder}
                </label>
            )}
        </div>
    );
};

export default React.memo(InputWithLabel);