// components/input/PasswordInputWithValidation.tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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
    invalidText?: string;
    showToggle?: boolean;
    checkValid?: boolean;
};

// Дефолтное правило валидации
const DEFAULT_PASSWORD_VALIDATION = (value: string): string | null => {
    if (!value || value.trim() === '') {
        return 'Пароль обязателен';
    }
    if (value.length < 6) {
        return 'Пароль должен быть не менее 6 символов';
    }
    return null;
};

const PasswordInputWithValidation: React.FC<PasswordInputProps> = ({
    valid = true,
    onChange,
    onFocus,
    onBlur,
    validRule = DEFAULT_PASSWORD_VALIDATION,
    className = '',
    placeholder = '',
    value = '',
    invalidText = 'Некорректный пароль',
    showToggle = false,
    checkValid
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [isValid, setIsValid] = useState(valid);
    const [isVisible, setIsVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState(invalidText);
    const hasChange = useRef<boolean>(false);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (checkValid) {
            setIsValid(valid);
            setErrorMessage(invalidText);
        }
    }, [valid, invalidText, checkValid]);

    // Валидация значения
    const validateValue = useCallback((val: string): boolean => {
        const error = validRule(val);
        if (error) {
            setErrorMessage(error);
            return false;
        }
        return true;
    }, [validRule]);

    // Обработчики с useCallback
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        hasChange.current = true;
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // При изменении сбрасываем ошибку
        setIsValid(true);
        
        onChange(newValue);
    }, [onChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const isValidValue = validateValue(val);
        setIsValid(isValidValue);
        onBlur?.(val);
    }, [validateValue, onBlur]);

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
                    backgroundSize: "contain",
                    cursor: "pointer"
                }}
                aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
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
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default React.memo(PasswordInputWithValidation);