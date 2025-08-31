import React, { memo, useCallback,useEffect,useRef } from 'react';
import s from "./style.module.scss"

interface IButtonProps {
    text?: string;
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
    onHold?: boolean;
    preset?: 'small' | 'medium' | 'big';
    direction: 'left' | 'right' | 'up' | 'down';
}

const presetEnum = {
  small: 16,
  medium: 32,
  big: 200
}

const ArrowButton: React.FC<IButtonProps> = ({ 
    text, 
    onClick, 
    onHold,
    className,
    style,
    disabled = false ,
    preset = 'small',
    direction = 'right'
}) => {

      const intervalRef = useRef<NodeJS.Timeout | null>(null);
      const isHoldingRef = useRef<boolean>(false);
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
       onClick(e);
    }, [onClick]);

    const buttonStyle: React.CSSProperties = {
        cursor: 'pointer',
        display: 'inline-block',
        ...style
    };

      const clearHoldInterval = useCallback(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        isHoldingRef.current = false;
      }, []);
    
      const startHold = useCallback((e) => {
        if (!onHold) return; 
        
        isHoldingRef.current = true;
        onClick(e); // Первое нажатие сразу
        
        intervalRef.current = setInterval(() => {
          if (isHoldingRef.current) {
            onClick(e);
          }
        }, 200); // Интервал 200ms для повторных нажатий
      }, [onHold, onClick]);
    
  
      // Очищаем интервал при размонтировании компонента
      useEffect(() => {
        return () => clearHoldInterval();
      }, [clearHoldInterval]);
 const buttonSize = presetEnum[preset];
    return (
        <button 
        style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }} 
        onMouseDown={onHold ? startHold : undefined}
        onMouseUp={onHold ? clearHoldInterval : undefined}
        onMouseLeave={onHold ? clearHoldInterval : undefined}
        onTouchStart={onHold ? startHold : undefined}
        onTouchEnd={onHold ? clearHoldInterval : undefined}
        onClick={onHold ? undefined : onClick}
        className={`${s.paginate} ${s[`${direction}`]} ${className}`}
      >
        <i style={{ width: `${buttonSize}px` }} className={s.def}></i>
        <i style={{ width: `${buttonSize}px` }} className={s.def}></i>
      </button>
    );
};

export default memo(ArrowButton);