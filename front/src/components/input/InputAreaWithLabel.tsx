import React, { useRef, useState, useEffect, useCallback, ChangeEvent, FocusEvent } from 'react';
import s from "./style.module.css";

type InputAreaWithLabelProps = {
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    val?: string;
    rows?: number;
    maxLength?: number;
    maxHeight?: string;
    label?: string;
};

const InputArea: React.FC<InputAreaWithLabelProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = '',
    val = '',
    rows = 3,
    maxLength,
    maxHeight = '200px',
    label
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(val);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setValue(val);
    }, [val]);

    const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (maxLength && newValue.length > maxLength) {
            return;
        }
        setValue(newValue);
        onChange(newValue);
    }, [onChange, maxLength]);

    const handleFocus = useCallback((e: FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        onFocus?.(e.target.value);
    }, [onFocus]);

    const handleBlur = useCallback((e: FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        onBlur?.(e.target.value);
    }, [onBlur]);

    const focusTextarea = useCallback(() => {
        textareaRef.current?.focus();
    }, []);

    const containerClass = `${s.inputContainer} ${className}`;
    const textareaClass = `${s.inputWithLabel} ${s.textarea}`;

    return (
        <div className={containerClass}>
            {/* Лейбл сверху */}
            {label && (
                <label 
                    onClick={focusTextarea} 
                    className={s.label}
                    style={{ 
                        display: 'block', 
                        marginBottom: '8px',
                        cursor: 'pointer'
                    }}
                >
                    {label}
                </label>
            )}
            
            {/* Textarea с плавающим placeholder */}
            {placeholder && !label && (
                <div className={s.floatingLabelContainer}>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        className={textareaClass}
                        style={{ 
                            maxHeight,
                            paddingTop: '24px', // Место для плавающего лейбла
                            resize: 'vertical'
                        }}
                        rows={rows}
                        maxLength={maxLength}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        required
                        aria-label={placeholder}
                    />
                    <label 
                        onClick={focusTextarea} 
                        className={`${s.label} ${s.floatingLabel}`}
                        data-focused={isFocused}
                        data-has-content={!!value}
                    >
                        {placeholder}
                    </label>
                </div>
            )}
            
            {/* Textarea без плавающего placeholder (только с лейблом сверху) */}
            {(!placeholder || label) && (
                <textarea
                    ref={textareaRef}
                    value={value}
                    className={textareaClass}
                    style={{ 
                        maxHeight,
                        resize: 'vertical'
                    }}
                    rows={rows}
                    maxLength={maxLength}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    aria-label={placeholder || label}
                    placeholder={label ? placeholder : ''} // placeholder только если есть лейбл сверху
                />
            )}
            
            {/* Счетчик символов */}
            {maxLength && (
                <div className={s.charCounter}>
                    {value.length}/{maxLength}
                </div>
            )}
        </div>
    );
};

export default React.memo(InputArea);