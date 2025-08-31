import React, { useState, useEffect, useCallback, memo } from 'react';
import check from '../../../public/check.svg';
import s from "./style.module.css";

interface CheckboxProps {
    onChange?: (isActive: boolean) => void;
    className?: string;
    enable: boolean;
    activeData: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
    onChange = () => {},
    className = s.checkbox,
    enable,
    activeData
}) => {
    const [active, setActive] = useState(activeData);

    useEffect(() => {
        setActive(activeData);
    }, [activeData]);

    const handleClick = useCallback(() => {
        if (enable) {
            const newValue = !active;
            setActive(newValue);
            onChange(newValue);
        }
    }, [active, enable, onChange]);

    const getStyles = useCallback(() => ({
        backgroundImage: active && enable ? `url(${check})` : undefined,
        borderColor: enable ? undefined : 'grey'
    }), [active, enable]);

    return (
        <div 
            onClick={handleClick}
            className={className}
            style={getStyles()}
            role="checkbox"
            aria-checked={active}
            aria-disabled={!enable}
            tabIndex={enable ? 0 : undefined}
        />
    );
};

export default memo(Checkbox);