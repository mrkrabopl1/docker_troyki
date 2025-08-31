import React, { useState, useEffect, useCallback, useRef } from 'react';
import ZoneSliderSimple from 'src/components/slider/ZoneSliderSimple';
import NumInput from 'src/components/input/NumInput';
import s from './style.module.css';

interface ZoneSliderSetterProps {
    max: number;
    min: number;
    dataLeft?: number;
    dataRight?: number;
    onChange?: (value: [number, number]) => void;
}

const ZoneSliderValueSetter: React.FC<ZoneSliderSetterProps> = ({ 
    onChange, 
    max, 
    min, 
    dataRight = Infinity, 
    dataLeft = -Infinity 
}) => {
    const [values, setValues] = useState<[number, number]>([
        dataLeft >= min && dataLeft <= max ? dataLeft : min,
        dataRight <= max && dataRight >= min ? dataRight : max
    ]);
    const throttlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Update internal state when props change
    useEffect(() => {
        setValues([
            dataLeft >= min && dataLeft <= max ? dataLeft : min,
            dataRight <= max && dataRight >= min ? dataRight : max
        ]);
    }, [min, max, dataRight, dataLeft]);

    // Throttled callback for slider changes
    const handleSliderChange = useCallback((sliderMin: number, sliderMax: number) => {
        const newLeft = min + (max - min) * sliderMin;
        const newRight = min + (max - min) * sliderMax;
        
        setValues([newLeft, newRight]);
        
        if (throttlingTimerId.current) {
            clearTimeout(throttlingTimerId.current);
        }
        
        throttlingTimerId.current = setTimeout(() => {
            onChange?.([newLeft, newRight]);
        }, 500);
    }, [min, max, onChange]);

    // Handle left input change
    const handleLeftChange = useCallback((value: number) => {
        if (value >= min && value <= values[1]) {
            const newValues: [number, number] = [value, values[1]];
            setValues(newValues);
            onChange?.(newValues);
        }
    }, [min, values, onChange]);

    // Handle right input change
    const handleRightChange = useCallback((value: number) => {
        if (value <= max && value >= values[0]) {
            const newValues: [number, number] = [values[0], value];
            setValues(newValues);
            onChange?.(newValues);
        }
    }, [max, values, onChange]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (throttlingTimerId.current) {
                clearTimeout(throttlingTimerId.current);
            }
        };
    }, []);

    return (
        <div>
            <ZoneSliderSimple 
                onChange={handleSliderChange} 
                min={(values[0] - min) / (max - min)} 
                max={(values[1] - min) / (max - min)} 
            />
            <div className={s.inputContainer}>
                <NumInput 
                    className={s.numInput} 
                    value={values[0]} 
                    onChange={handleLeftChange} 
                />
                <span>-</span>
                <NumInput 
                    className={s.numInput} 
                    value={values[1]} 
                    onChange={handleRightChange} 
                />
            </div>
        </div>
    );
};

export default React.memo(ZoneSliderValueSetter);