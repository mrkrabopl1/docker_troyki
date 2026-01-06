import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import s from "./style.module.css";

type PhoneInputProps = {
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    val?: string;
    valid: boolean;
    invalidEmpty: string;
    invalidIncorrect: string;
    checkValid?: boolean;
};

const PHONE_FORMAT = {
    prefix: "+7 ",
    codeSeparator: " ",
    mainSeparator: "-",
    fullLength: 16 // +7 999 999-99-99
};

const PhoneInputWithValidation: React.FC<PhoneInputProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = "+7 999 999-99-99",
    val = "+7 ",
    valid,
    invalidEmpty,
    invalidIncorrect,
    checkValid
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [phoneValue, setPhoneValue] = useState(val);
    const [isValid, setIsValid] = useState(valid);
    const [isFocused, setIsFocused] = useState(false);
    const shouldValidate = useRef(false);
    const hasChange = useRef<boolean>(false);

    // Синхронизация с внешними значениями
    useEffect(() => {
        setPhoneValue(val);
        if (checkValid) {
            setIsValid(valid);
        }
    }, [val, valid, checkValid]);

    // Получение чистого номера без форматирования
    const getCleanPhone = useCallback((value: string): string => {
        return value.replace(/[^\d]/g, '').slice(1); // Убираем +7
    }, []);

    // Форматирование номера
    const formatPhone = useCallback((cleanValue: string): string => {
        let formatted = PHONE_FORMAT.prefix;
        
        if (cleanValue.length > 0) {
            formatted += cleanValue.slice(0, 3);
            if (cleanValue.length > 3) {
                formatted += PHONE_FORMAT.codeSeparator + cleanValue.slice(3, 6);
                if (cleanValue.length > 6) {
                    formatted += PHONE_FORMAT.mainSeparator + cleanValue.slice(6, 8);
                    if (cleanValue.length > 8) {
                        formatted += PHONE_FORMAT.mainSeparator + cleanValue.slice(8, 10);
                    }
                }
            }
        }
        return formatted;
    }, []);

    // Валидация номера
    const validatePhone = useCallback((value: string) => {
        const cleanValue = getCleanPhone(value);
        const isValid = cleanValue.length === 10;
        setIsValid(isValid);
        // Всегда передаем отформатированное значение, даже если невалидно
        onChange(value);
    }, [onChange, getCleanPhone]);

    // Получение позиции курсора в очищенном номере
    const getCleanCursorPosition = useCallback((formattedValue: string, cursorPosition: number): number => {
        let cleanPosition = 0;
        for (let i = PHONE_FORMAT.prefix.length; i < cursorPosition && i < formattedValue.length; i++) {
            if (/\d/.test(formattedValue[i])) {
                cleanPosition++;
            }
        }
        return cleanPosition;
    }, []);

    // Получение позиции курсора в отформатированном номере из позиции в очищенном
    const getFormattedCursorPosition = useCallback((formattedValue: string, cleanPosition: number): number => {
        let position = PHONE_FORMAT.prefix.length;
        let digitsCount = 0;
        
        for (let i = PHONE_FORMAT.prefix.length; i < formattedValue.length && digitsCount < cleanPosition; i++) {
            if (/\d/.test(formattedValue[i])) {
                digitsCount++;
            }
            position++;
        }
        
        return position;
    }, []);

    // Обработчик нажатия клавиш
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        const { key } = e;
        const selectionStart = inputRef.current?.selectionStart || 0;
        const selectionEnd = inputRef.current?.selectionEnd || 0;
        const cleanValue = getCleanPhone(phoneValue);

        // Навигация - разрешаем стандартное поведение
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab', 'Escape'].includes(key)) {
            return;
        }

        // Разрешаем комбинации клавиш
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }

        e.preventDefault();
        hasChange.current = true;
        shouldValidate.current = true;

        // Удаление
        if (['Backspace', 'Delete'].includes(key)) {
            handleDeletion(key, selectionStart, selectionEnd, cleanValue);
            return;
        }

        // Ввод цифр
        if (/^\d$/.test(key)) {
            handleDigitInput(key, selectionStart, selectionEnd, cleanValue);
        }
    }, [phoneValue, getCleanPhone]);

    // Обработка удаления
    const handleDeletion = useCallback((key: string, selectionStart: number, selectionEnd: number, cleanValue: string) => {
        if (selectionStart <= PHONE_FORMAT.prefix.length && key === 'Backspace') return;

        // Если есть выделение
        if (selectionStart !== selectionEnd) {
            const cleanStart = getCleanCursorPosition(phoneValue, selectionStart);
            const cleanEnd = getCleanCursorPosition(phoneValue, selectionEnd);
            
            const newCleanValue = cleanValue.slice(0, cleanStart) + cleanValue.slice(cleanEnd);
            const formatted = formatPhone(newCleanValue);
            
            setPhoneValue(formatted);
            validatePhone(formatted);

            setTimeout(() => {
                const newPosition = getFormattedCursorPosition(formatted, cleanStart);
                inputRef.current?.setSelectionRange(newPosition, newPosition);
            }, 0);
            return;
        }

        let cleanPosition = getCleanCursorPosition(phoneValue, selectionStart);
        let newCleanValue = cleanValue;

        if (key === 'Backspace' && selectionStart > PHONE_FORMAT.prefix.length) {
            // Удаляем цифру перед курсором
            if (cleanPosition > 0) {
                newCleanValue = cleanValue.slice(0, cleanPosition - 1) + cleanValue.slice(cleanPosition);
                cleanPosition--;
            }
        } else if (key === 'Delete' && selectionStart < phoneValue.length) {
            // Удаляем цифру после курсора
            if (cleanPosition < cleanValue.length) {
                newCleanValue = cleanValue.slice(0, cleanPosition) + cleanValue.slice(cleanPosition + 1);
            }
        }

        const formatted = formatPhone(newCleanValue);
        setPhoneValue(formatted);
        validatePhone(formatted);

        setTimeout(() => {
            const newPosition = getFormattedCursorPosition(formatted, cleanPosition);
            inputRef.current?.setSelectionRange(newPosition, newPosition);
        }, 0);
    }, [phoneValue, formatPhone, validatePhone, getCleanCursorPosition, getFormattedCursorPosition]);

    // Обработка ввода цифр
    const handleDigitInput = useCallback((digit: string, selectionStart: number, selectionEnd: number, cleanValue: string) => {
        if (cleanValue.length >= 10 && selectionStart === selectionEnd) return;

        // Если есть выделение - заменяем выделенный текст
        if (selectionStart !== selectionEnd) {
            const cleanStart = getCleanCursorPosition(phoneValue, selectionStart);
            const cleanEnd = getCleanCursorPosition(phoneValue, selectionEnd);
            
            const newCleanValue = cleanValue.slice(0, cleanStart) + digit + cleanValue.slice(cleanEnd);
            const formatted = formatPhone(newCleanValue);
            
            setPhoneValue(formatted);
            validatePhone(formatted);

            setTimeout(() => {
                const newPosition = getFormattedCursorPosition(formatted, cleanStart + 1);
                inputRef.current?.setSelectionRange(newPosition, newPosition);
            }, 0);
            return;
        }

        // Обычный ввод одной цифры
        let cleanPosition = getCleanCursorPosition(phoneValue, selectionStart);
        
        if (cleanPosition >= 10) return;

        const newCleanValue = cleanValue.slice(0, cleanPosition) + digit + cleanValue.slice(cleanPosition);
        const formatted = formatPhone(newCleanValue);
        
        setPhoneValue(formatted);
        validatePhone(formatted);

        setTimeout(() => {
            const newPosition = getFormattedCursorPosition(formatted, cleanPosition + 1);
            inputRef.current?.setSelectionRange(newPosition, newPosition);
        }, 0);
    }, [phoneValue, formatPhone, validatePhone, getCleanCursorPosition, getFormattedCursorPosition]);

    // Обработчики фокуса
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        onFocus?.(e.target.value);
        
        setTimeout(() => {
            // Если поле пустое, ставим курсор после префикса
            const cleanValue = getCleanPhone(phoneValue);
            if (cleanValue.length === 0) {
                inputRef.current?.setSelectionRange(PHONE_FORMAT.prefix.length, PHONE_FORMAT.prefix.length);
            } else {
                inputRef.current?.setSelectionRange(phoneValue.length, phoneValue.length);
            }
        }, 0);
    }, [onFocus, phoneValue, getCleanPhone]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (shouldValidate.current) {
            validatePhone(e.target.value);
        }
        onBlur?.(e.target.value);
    }, [onBlur, validatePhone]);

    // Обработчик вставки из буфера обмена
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        hasChange.current = true;
        shouldValidate.current = true;

        const pastedData = e.clipboardData.getData('text');
        const digits = pastedData.replace(/[^\d]/g, '');
        
        if (digits) {
            // Если есть российский код, убираем его
            const cleanDigits = digits.startsWith('7') || digits.startsWith('8') ? digits.slice(1) : digits;
            const limitedDigits = cleanDigits.slice(0, 10);
            
            const formatted = formatPhone(limitedDigits);
            setPhoneValue(formatted);
            validatePhone(formatted);

            setTimeout(() => {
                inputRef.current?.setSelectionRange(formatted.length, formatted.length);
            }, 0);
        }
    }, [formatPhone, validatePhone]);

    // Текст ошибки
    const errorMessage = useMemo(() => {
        if (!hasChange.current) return '';
        const cleanValue = getCleanPhone(phoneValue);
        return cleanValue.length === 0 ? invalidEmpty : invalidIncorrect;
    }, [phoneValue, invalidEmpty, invalidIncorrect, getCleanPhone]);

    // Классы инпута
    const inputClasses = useMemo(() => {
        const classes = [s.inputWithLabel, className];
        if (!isValid && hasChange.current) {
            classes.push(s.invalid);
        }
        if (isFocused) {
            classes.push(s.focused);
        }
        return classes.filter(Boolean).join(' ');
    }, [className, isValid, isFocused]);

    return (
        <div className={s.inputContainer}>
            <input
                ref={inputRef}
                value={phoneValue}
                aria-label={placeholder}
                className={inputClasses}
                placeholder={''}
                type="tel"
                onKeyDown={handleKeyDown}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onPaste={handlePaste}
                aria-invalid={!isValid && hasChange.current}
            />
            {placeholder && (
                <label className={s.label}>
                    {placeholder}
                </label>
            )}
            {!isValid && hasChange.current && (
                <div className={s.errorMessage}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default React.memo(PhoneInputWithValidation);