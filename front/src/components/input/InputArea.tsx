import React, { useRef, useState, useCallback, ChangeEvent, FocusEvent, useEffect } from 'react';

type InputAreaWithLabelProps = {
    onChange: (value: string) => void;
    onFocus?: (value: string) => void;
    onBlur?: (value: string) => void;
    className?: string;
    placeholder?: string;
    value?: string;
    rows?: number;
    maxLength?: number;
    resize?: 'none' | 'both' | 'horizontal' | 'vertical';
    label?: string;
    optional?: boolean;
};

const InputArea: React.FC<InputAreaWithLabelProps> = ({
    onChange,
    onFocus,
    onBlur,
    className = '',
    placeholder = '',
    value = '',
    rows = 3,
    maxLength,
    resize = 'vertical',
    label,
    optional = false
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);

    // Обновление внутреннего состояния при изменении внешнего value
    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (maxLength && newValue.length > maxLength) {
            return;
        }
        setInternalValue(newValue);
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

    // Стиль для textarea
    const textareaStyle: React.CSSProperties = {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: `${rows * 24}px`,
        resize,
        fontFamily: 'inherit',
        fontSize: '14px',
        padding: '12px',
        border: `1px solid ${isFocused ? '#2e7d32' : '#e0e0e0'}`,
        borderRadius: '8px',
        outline: 'none',
        transition: 'all 0.2s ease',
        backgroundColor: isFocused ? '#f8fff8' : '#fafafa',
        marginTop: '8px'
    };

    return (
        <div style={{ width: '100%' }}>
            {label && (
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#333',
                    marginBottom: '4px'
                }}>
                    {label}
                    {optional && (
                        <span style={{
                            color: '#888',
                            fontSize: '12px',
                            marginLeft: '4px',
                            fontWeight: 'normal'
                        }}>
                            (необязательно)
                        </span>
                    )}
                </label>
            )}
            
            <textarea
                ref={textareaRef}
                value={internalValue}
                placeholder={placeholder}
                style={textareaStyle}
                className={className}
                rows={rows}
                maxLength={maxLength}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            
            {maxLength && (
                <div style={{
                    textAlign: 'right',
                    fontSize: '12px',
                    color: internalValue.length > maxLength * 0.9 ? '#f44336' : '#888',
                    marginTop: '4px'
                }}>
                    {internalValue.length}/{maxLength}
                </div>
            )}
        </div>
    );
};
export default React.memo(InputArea);