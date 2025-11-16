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
};

const PHONE_FORMAT = {
    prefix: "+7 ",
    codeSeparator: " ",
    mainSeparator: "-",
    fullLength: 16 // Длина полного форматированного номера
};

const PhoneInputWithValidation: React.FC<PhoneInputProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = "+7 999 999-99-99",
    val = "+7",
    valid,
    invalidEmpty,
    invalidIncorrect
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [phoneValue, setPhoneValue] = useState(val);
    const [isValid, setIsValid] = useState(valid);
    const shouldValidate = useRef(false);
    const cursorPos = useRef(2);
     const hasChange = useRef<boolean>(false);

    // Форматирование номера телефона
    const formatPhoneNumber = useCallback((value: string): string => {
        const cleanValue = value.replace(/[^\d]/g, '').slice(1); // Удаляем все нецифры и первый символ
        let formatted = PHONE_FORMAT.prefix;
        
        if (cleanValue.length > 0) {
            formatted += cleanValue.slice(0, 3);
            if (cleanValue.length > 3) {
                formatted += PHONE_FORMAT.codeSeparator + cleanValue.slice(3, 6);
                if (cleanValue.length > 6) {
                    formatted += PHONE_FORMAT.codeSeparator + cleanValue.slice(6, 8);
                    if (cleanValue.length > 8) {
                        formatted += PHONE_FORMAT.mainSeparator + cleanValue.slice(8, 10);
                    }
                }
            }
        }

        return formatted;
    }, []);

    // Установка позиции курсора
    const setCursorPosition = useCallback((position: number) => {
        cursorPos.current = position;
        setTimeout(() => {
            inputRef.current?.setSelectionRange(position, position);
        }, 0);
    }, []);

    // Синхронизация с внешними значениями
    useEffect(() => {
         setPhoneValue(val);
         if (!hasChange.current && !valid) {
            hasChange.current = true;
            return
        }
        setIsValid(valid);
    }, [val, valid]);

    // Обработчик ввода
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        hasChange.current=true;
        e.preventDefault();
        shouldValidate.current = true;
        const { key } = e;
        const cursorPosition = inputRef.current?.selectionStart || 0;

        // Обработка навигации
        if (['ArrowLeft', 'ArrowRight'].includes(key)) {
            const newPos = key === 'ArrowLeft' ? cursorPosition - 1 : cursorPosition + 1;
            setCursorPosition(newPos);
            return;
        }

        // Обработка удаления
        if (['Delete', 'Backspace'].includes(key)) {
            handleDelete(key, cursorPosition);
            return;
        }

        // Обработка цифр
        if (/\d/.test(key)) {
            handleDigitInput(key, cursorPosition);
        }
    }, [phoneValue]);

    // Обработка ввода цифр
const handleDigitInput = useCallback((digit: string, cursorPosition: number) => {
    // Получаем текущее значение без форматирования
    const cleanValue = phoneValue.replace(/[^\d]/g, '').slice(1);

    if(cursorPosition < PHONE_FORMAT.prefix.length) {
        cursorPosition = PHONE_FORMAT.prefix.length; 
    }
    
    // Вставляем новую цифру в нужную позицию
    let newCleanValue = cleanValue.slice(0, cursorPosition - PHONE_FORMAT.prefix.length) + 
                       digit + 
                       cleanValue.slice(cursorPosition - PHONE_FORMAT.prefix.length);
    
    // Форматируем новое значение
    let formatted = PHONE_FORMAT.prefix;
    if (newCleanValue.length > 0) {
        formatted += newCleanValue.slice(0, 3);
        if (newCleanValue.length > 3) {
            formatted += PHONE_FORMAT.codeSeparator + newCleanValue.slice(3, 6);
            if (newCleanValue.length > 6) {
                formatted += PHONE_FORMAT.codeSeparator + newCleanValue.slice(6, 8);
                if (newCleanValue.length > 8) {
                    formatted += PHONE_FORMAT.mainSeparator + newCleanValue.slice(8, 10);
                }
            }
        }
    }

    // Вычисляем новую позицию курсора
    let newCursorPosition = cursorPosition + 1;
    
    // Корректируем позицию курсора при переходе через разделители
    if (cursorPosition === PHONE_FORMAT.prefix.length + 3) {
        newCursorPosition += PHONE_FORMAT.codeSeparator.length;
    } else if (cursorPosition === PHONE_FORMAT.prefix.length + 3 + PHONE_FORMAT.codeSeparator.length + 3) {
        newCursorPosition += PHONE_FORMAT.codeSeparator.length;
    } else if (cursorPosition === PHONE_FORMAT.prefix.length + 3 + PHONE_FORMAT.codeSeparator.length + 3 + PHONE_FORMAT.codeSeparator.length + 2) {
        newCursorPosition += PHONE_FORMAT.mainSeparator.length;
    }

    if (formatted.length <= PHONE_FORMAT.fullLength) {
        setPhoneValue(formatted);
        setCursorPosition(newCursorPosition);
        validatePhone(formatted);
    }
}, [phoneValue, formatPhoneNumber]);

// Обработка удаления символов
const handleDelete = useCallback((key: string, cursorPosition: number) => {
    // Получаем текущее значение без форматирования
    const cleanValue = phoneValue.replace(/[^\d]/g, '').slice(2);
    
    let newCleanValue = cleanValue;
    let newCursorPosition = cursorPosition;
    
    if (key === 'Backspace' && cursorPosition > PHONE_FORMAT.prefix.length) {
        // Удаляем цифру перед курсором
        const posInClean = cursorPosition - PHONE_FORMAT.prefix.length;
        newCleanValue = cleanValue.slice(0, posInClean - 1) + cleanValue.slice(posInClean);
        newCursorPosition = cursorPosition - 1;
        
        // Корректируем позицию если переходим через разделитель
        if (phoneValue[cursorPosition - 1] === PHONE_FORMAT.codeSeparator || 
            phoneValue[cursorPosition - 1] === PHONE_FORMAT.mainSeparator) {
            newCursorPosition -= 1;
        }
    } else if (key === 'Delete' && cursorPosition < phoneValue.length) {
        // Удаляем цифру после курсора
        const posInClean = cursorPosition - PHONE_FORMAT.prefix.length;
        newCleanValue = cleanValue.slice(0, posInClean) + cleanValue.slice(posInClean + 1);
    }

    // Форматируем новое значение
    let formatted = PHONE_FORMAT.prefix;
    if (newCleanValue.length > 0) {
        formatted += newCleanValue.slice(0, 3);
        if (newCleanValue.length > 3) {
            formatted += PHONE_FORMAT.codeSeparator + newCleanValue.slice(3, 6);
            if (newCleanValue.length > 6) {
                formatted += PHONE_FORMAT.codeSeparator + newCleanValue.slice(6, 8);
                if (newCleanValue.length > 8) {
                    formatted += PHONE_FORMAT.mainSeparator + newCleanValue.slice(8, 10);
                }
            }
        }
    }

    setPhoneValue(formatted);
    setCursorPosition(newCursorPosition);
    validatePhone(formatted);
}, [phoneValue, formatPhoneNumber]);
    const validatePhone = useCallback((value: string) => {
        const isValid = value.length === PHONE_FORMAT.fullLength;
        setIsValid(isValid);
        onChange(isValid ? value : "");
    }, [onChange]);
    // Обработчик потери фокуса
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        if (shouldValidate.current) {
            if (phoneValue.length < PHONE_FORMAT.fullLength && phoneValue.length !== 0) {
                setIsValid(false);
            }
            onBlur?.(e.target.value);
        }
    }, [phoneValue, onBlur]);

    // Текст ошибки
    const errorMessage = useMemo(() => {
        return phoneValue.length === 0 ? invalidEmpty : invalidIncorrect;
    }, [phoneValue, invalidEmpty, invalidIncorrect]);

    // Классы инпута
    const inputClasses = useMemo(() => {
        return [s.inputWithLabel, className, !isValid && s.invalid].filter(Boolean).join(' ');
    }, [className, isValid]);

    return (
        <div className={s.inputContainer}>
            <span>Phone</span>
            <input
                ref={inputRef}
                value={phoneValue}
                className={inputClasses}
                style={{ boxSizing: 'border-box', width: "100%" }}
                placeholder={placeholder}
                type="tel"
                onKeyDown={handleKeyDown}
                onFocus={(e) => onFocus?.(e.target.value)}
                onBlur={handleBlur}
                aria-invalid={!isValid}
            />
            {!isValid && (
                <div className={s.errorMessage} style={{ color: "red" }}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
};

export default React.memo(PhoneInputWithValidation);