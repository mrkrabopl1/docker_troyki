import React, { memo, useCallback } from 'react';

interface IButtonProps {
    text?: string;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
}

const Button: React.FC<IButtonProps> = ({ 
    text, 
    onClick, 
    className,
    style,
    disabled = false 
}) => {
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
       onClick(e);
    }, [onClick]);

    const buttonStyle: React.CSSProperties = {
        cursor: 'pointer',
      
        ...style
    };

    return (
        <button 
            style={buttonStyle}
            className={className}
            onClick={handleClick}
            disabled={disabled}
        >
            {text}
        </button>
    );
};

export default memo(Button);