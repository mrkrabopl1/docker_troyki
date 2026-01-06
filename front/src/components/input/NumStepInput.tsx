import React, { memo, useCallback } from 'react';
import s from "./numInput.module.css";

interface NumInputHorizontalProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    disabled?: boolean;
    showValue?: boolean;
}

const NumStepInput: React.FC<NumInputHorizontalProps> = memo(({
    value,
    onChange,
    min = 1,
    max = 99,
    step = 1,
    className = '',
    disabled = false,
    showValue = true
}) => {
    const handleIncrement = useCallback(() => {
        if (disabled) return;
        const newValue = Math.min(max, value + step);
        if (newValue !== value) {
            onChange(newValue);
        }
    }, [value, onChange, max, step, disabled]);

    const handleDecrement = useCallback(() => {
        if (disabled) return;
        const newValue = Math.max(min, value - step);
        if (newValue !== value) {
            onChange(newValue);
        }
    }, [value, onChange, min, step, disabled]);

    return (
        <div className={`${s.numStepInput} ${className} ${disabled ? s.disabled : ''}`}>
            <button
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className={s.stepBtn}
            >
                -
            </button>
            
            {showValue && (
                <div className={s.valueDisplay}>
                    {value}
                </div>
            )}
            
            <button
                onClick={handleIncrement}
                disabled={disabled || value >= max}
                className={s.stepBtn}
            >
                +
            </button>
        </div>
    );
});

export default NumStepInput;