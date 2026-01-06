import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./style.module.css";

type MailInputProps = {
    valid?: boolean;
    invalidText?: string;
    onChange: (value: string | null) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    invalidClassName?: string;
    placeholder?: string;
    value?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateEmail = (email: string): boolean => EMAIL_REGEX.test(email);

const MailInputWithValidation: React.FC<MailInputProps> = ({
    valid = true,
    invalidText = 'Введите корректный email',
    onChange,
    onFocus,
    onBlur,
    className = '',
    invalidClassName = '',
    placeholder = '',
    value = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(valid);
    const shouldValidate = useRef(false);
    const hasChange = useRef<boolean>(false);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
       
        setIsValid(valid);
    }, [valid]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsValid(true);
        hasChange.current = true;
        shouldValidate.current = true;
        onChange(validateEmail(newValue) ? newValue : null);
    }, [onChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (shouldValidate.current) {
            const isValidEmail = validateEmail(e.target.value);
            setIsValid(isValidEmail);
            onBlur?.(e.target.value);
        }
    }, [onBlur]);

    const focusInput = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const inputClasses = [
        s.inputWithLabel,
        className,
        !isValid && (invalidClassName || s.invalid)
    ].filter(Boolean).join(' ');

    return (
        <div className={s.inputContainer}>
            <input
                ref={inputRef}
                value={inputValue}
                className={isValid ? s.inputWithLabel : s.inputWithLabel + " " + s.invalid}
                style={{ boxSizing: 'border-box', width: "100%" }}
                type="email"
                placeholder=""
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                required
                aria-invalid={!isValid}
            />
            {placeholder && (

            <label onClick={
                () => inputRef.current && inputRef.current.focus()
            } className={s.label}>{placeholder}</label>
            )}
            {!isValid && (
                <div className={s.errorMessage} style={{ color: "red" }}>
                    {invalidText}
                </div>
            )}
        </div>
    );
};

export default React.memo(MailInputWithValidation);