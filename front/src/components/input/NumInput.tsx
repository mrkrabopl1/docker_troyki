import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import s from "./numInput.module.css";
import { clamp } from 'src/global';

type NumInputProps = {
    onChange: (value: number) => void;
    className?: string;
    min?: number;
    max?: number;
    step?: number;
    showArrows?: boolean;
    value: number;
    disabled?: boolean;
    precision?: number;
};

const NumInput: React.FC<NumInputProps> = ({
    value,
    onChange,
    className = '',
    showArrows = true,
    min = -Infinity,
    max = Infinity,
    disabled = false,
    step = 1,
    precision = 0
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = useState<string>(value.toString());

    // Мемоизированная функция форматирования значения
    const formatValue = useCallback((val: number): string => {
        return clamp(val, min, max).toFixed(precision);
    }, [min, max, precision]);

    // Мемоизированная функция валидации и обработки значения
    const processValue = useCallback((input: string | number): number => {
        let num = typeof input === 'string' ? parseFloat(input) || 0 : input;
        return Number(formatValue(num));
    }, [formatValue]);

    // Обработчик изменения значения
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setDisplayValue(processValue(newValue).toString()); // Обновляем отображаемое значение сразу, но валидацию проводим при полном вводе

        // Валидация только при полном вводе (не при каждом нажатии)
        if (!isNaN(parseFloat(newValue)) || newValue === '' || newValue === '-') {
            const processedValue = processValue(newValue);
            onChange(processedValue);
        }
    }, [onChange, processValue]);

    // Обработчики инкремента/декремента
    const handleStep = useCallback((direction: 'up' | 'down') => {
        const currentValue = parseFloat(displayValue) || 0;
        const newValue = direction === 'up' ? currentValue + step : currentValue - step;
        const processedValue = processValue(newValue);

        setDisplayValue(formatValue(processedValue));
        onChange(processedValue);
    }, [displayValue, step, processValue, formatValue, onChange]);

    // Синхронизация с внешним значением



    useEffect(() => {
        const processedValue = processValue(value);
        const formattedValue = formatValue(processedValue);

        if (formattedValue !== displayValue) {
            setDisplayValue(formattedValue);
        }
    }, [value]);

    // Мемоизированные JSX элементы стрелок
    const arrows = useMemo(() => (
        showArrows && (
            <div className={s.arrows}>
                <button
                    className={s.arrowUp}
                    onClick={() => handleStep('up')}
                    aria-label="Increase value"
                    disabled={disabled}
                >
                    ▲
                </button>
                <button
                    disabled={disabled}
                    className={s.arrowDown}
                    onClick={() => handleStep('down')}
                    aria-label="Decrease value"
                >
                    ▼
                </button>
            </div>
        )
    ), [showArrows, handleStep]);

    return (
        <div className={`${s.inputHolder} ${className}`} style={{ display: "flex" }}>
            <input
                ref={inputRef}
                disabled={disabled}
                className={s.numInput}
                value={displayValue}
                type="text"
                inputMode="decimal"
                onChange={handleChange}
                onBlur={() => {
                    const processedValue = processValue(displayValue);
                    setDisplayValue(formatValue(processedValue));
                }}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={parseFloat(displayValue) || 0}
            />
            {arrows}
        </div>
    );
};

export default React.memo(NumInput);