import React, { memo, useCallback, useRef, useState } from 'react';
import s from "./style.module.css";
import ArrowButton from 'src/components/button/ArrowButton';

interface NumInputVerticalProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    disabled?: boolean;
}

const NumInputVertical: React.FC<NumInputVerticalProps> = memo(({
    value,
    onChange,
    min = 1,
    max = 99,
    step = 1,
    className = '',
    disabled = false
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState<string>(value.toString());

    const handleIncrement = useCallback(() => {
        if (disabled) return;
        const newValue = Math.min(max, value + step);
        if (newValue !== value) {
            onChange(newValue);
            setInputValue(newValue.toString());
        }
    }, [value, onChange, max, step, disabled]);

    const handleDecrement = useCallback(() => {
        if (disabled) return;
        const newValue = Math.max(min, value - step);
        if (newValue !== value) {
            onChange(newValue);
            setInputValue(newValue.toString());
        }
    }, [value, onChange, min, step, disabled]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return;
        const rawValue = e.target.value;

        // Разрешаем только цифры и пустую строку
        if (rawValue === '' || /^\d+$/.test(rawValue)) {
            setInputValue(rawValue);
        }
    }, [disabled]);

    const handleInputBlur = useCallback(() => {
        if (disabled) return;

        let newValue: number;

        if (inputValue === '') {
            newValue = min;
        } else {
            newValue = parseInt(inputValue);

            // Проверка на положительное число
            if (isNaN(newValue) || newValue <= 0) {
                newValue = min;
            }

            // Ограничение по min/max
            newValue = Math.min(max, Math.max(min, newValue));
        }

        onChange(newValue);
        setInputValue(newValue.toString());
    }, [inputValue, onChange, min, max, disabled]);

    const handleInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        // Блокируем ввод не-цифр
        if (!/[0-9]/.test(e.key)) {
            e.preventDefault();
        }
    }, []);

    return (
        <div className={`${s.numInputVertical} ${className} ${disabled ? s.disabled : ''}`}>
            <div style={{ position: "relative" }}>
                <ArrowButton
                    direction="up"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                />
            </div>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyPress={handleInputKeyPress}
                inputMode="numeric"
                pattern="[0-9]*"
                className={s.numberInput}
                disabled={disabled}
            />
            <div style={{ position: "relative" }}>
                <ArrowButton
                    direction="down"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                />
            </div>
        </div>
    );
});

export default NumInputVertical;