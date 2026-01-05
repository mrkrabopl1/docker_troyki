import React, { useRef, useState, useEffect, useCallback } from 'react';
import s from "./style.module.css";

type InputValidationProps = {
    valid: boolean;
    invalidText: string;
    validRule?: (value: string) => boolean;
    onChange: (value: string | null) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    invalidClassName?: string;
    placeholder?: string;
    val?: string;
};

const defaultValidRule = (val: string) => val !== "";

const InputWithLabelWithValidation: React.FC<InputValidationProps> = ({
    valid,
    invalidText,
    validRule = defaultValidRule,
    onChange,
    onFocus,
    onBlur,
    className = '',
    invalidClassName = '',
    placeholder = '',
    val = ''
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const startValidationOnBlur = useRef(false);
    const [value, setValue] = useState(val);
    const [isValid, setIsValid] = useState(valid);
     const hasChange = useRef<boolean>(false);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setValue(val);
    }, [val]);

    useEffect(() => {
          if (!hasChange.current && !valid) {
            hasChange.current = true;
            return
        }
        setIsValid(valid);
    }, [valid]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        hasChange.current = true;
        const newValue = e.target.value;
        startValidationOnBlur.current = true;
        setValue(newValue);
        
        const isValidValue = validRule(newValue);
        setIsValid(true);
        onChange(isValidValue ? newValue : null);
    }, [onChange, validRule]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (startValidationOnBlur.current) {
            const newValue = e.target.value;
            const isValidValue = validRule(newValue);
            setIsValid(isValidValue);
            onBlur?.(newValue);
        }
    }, [onBlur, validRule]);

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
                value={value}
                className={inputClasses}
                style={{ boxSizing: 'border-box', width: "100%" }}
                type="text"
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder=""
                onBlur={handleBlur}
                required
                aria-invalid={!isValid}
            />
            {placeholder && (
                <label onClick={focusInput} className={s.label}>
                    {placeholder}
                </label>
            )}
            {!isValid && invalidText && (
                <div className={s.errorMessage} style={{ color: "red" }}>
                    {invalidText}
                </div>
            )}
        </div>
    );
};

export default React.memo(InputWithLabelWithValidation);