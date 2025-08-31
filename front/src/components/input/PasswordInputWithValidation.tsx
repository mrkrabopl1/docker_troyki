import React, { useRef, useState, useEffect, useCallback ,useMemo} from 'react';
import s from "./style.module.css";

type PasswordInputProps = {
    valid?: boolean;
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    validRule?: (value: string) => string | null;
    className?: string;
    placeholder?: string;
    value?: string;
    invalidText: string;
    showToggle?: boolean;
};

const PasswordInputWithValidation: React.FC<PasswordInputProps> = ({
    valid = true,
    onChange,
    onFocus,
    onBlur,
    validRule,
    className = '',
    placeholder = '',
    value = '',
    invalidText,
    showToggle = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(valid);
    const [isVisible, setIsVisible] = useState(false);
    const errorMessageRef = useRef(invalidText);
       const hasChange = useRef<boolean>(false);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
         if (!hasChange.current && !valid) {
            hasChange.current = true;
            return
        }
        setIsValid(valid);
        errorMessageRef.current = invalidText;
    }, [valid, invalidText]);

    // Обработчики с useCallback
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
          hasChange.current = true;
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsValid(true);
        onChange(newValue);
    }, [onChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (validRule) {
            const error = validRule(inputValue);
            if (error) {
                errorMessageRef.current = error;
                setIsValid(false);
            }
        }
        onBlur?.(e.target.value);
    }, [validRule, onBlur, inputValue]);

    const toggleVisibility = useCallback((visible: boolean) => {
        setIsVisible(visible);
    }, []);

    // Иконка видимости
    const visibilityIcon = useMemo(() => (
        showToggle && (
            <div 
                className={s.visibilityToggle}
                onMouseDown={() => toggleVisibility(true)}
                onMouseUp={() => toggleVisibility(false)}
                onMouseLeave={() => toggleVisibility(false)}
                style={{
                    backgroundImage: `url('/${isVisible ? 'visOn' : 'visOff'}.svg')`,
                    width: "24px",
                    height: "24px",
                    backgroundSize: "contain"
                }}
                aria-label={isVisible ? "Hide password" : "Show password"}
                role="button"
            />
        )
    ), [showToggle, isVisible, toggleVisibility]);

    // Классы для контейнера
    const containerClasses = [
        s.inputPass,
        className,
        !isValid && s.invalid
    ].filter(Boolean).join(' ');

    return (
        <div className={s.inputContainer}>
            <div className={containerClasses} style={{ width: "100%", display: "flex", backgroundColor: "white" }}>
                <input 
                    ref={inputRef}
                    value={inputValue}
                    placeholder={placeholder}
                    className={s.passwordInput}
                    type={isVisible ? "text" : "password"}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    aria-invalid={!isValid}
                />
                {visibilityIcon}
            </div>
            {!isValid && (
                <div className={s.errorMessage} style={{ color: "red" }}>
                    {errorMessageRef.current}
                </div>
            )}
        </div>
    );
};

export default React.memo(PasswordInputWithValidation);