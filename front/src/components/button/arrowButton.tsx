import React, { memo, useCallback, useEffect, useRef } from 'react';
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
  disabled = false,
  preset = 'small',
  direction = 'right'
}) => {

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const startHold = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!onHold) return;

    // Останавливаем всплытие для всех типов событий
    if ('stopPropagation' in e) {
      e.stopPropagation();
      e.preventDefault();
    }

    isHoldingRef.current = true;
    
    // Создаем синтетическое событие для onClick
    const syntheticEvent = e as React.MouseEvent;
    onClick(syntheticEvent);

    intervalRef.current = setInterval(() => {
      if (isHoldingRef.current) {
        onClick(syntheticEvent);
      }
    }, 200);
  }, [onHold, onClick]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
       e.stopPropagation();
      e.preventDefault();
    if (onHold) {
      startHold(e);
    }
  }, [onHold, startHold]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (onHold) {
      startHold(e);
    }
  }, [onHold, startHold]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
       e.stopPropagation();
      e.preventDefault();
    if (onHold) {
      clearHoldInterval();
    }
  }, [onHold, clearHoldInterval]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (onHold) {
      e.stopPropagation();
      // Для TouchEvent preventDefault может быть проблематичным
      // e.preventDefault();
      clearHoldInterval();
    }
  }, [onHold, clearHoldInterval]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    if (onHold) {
      e.stopPropagation();
      clearHoldInterval();
    }
  }, [onHold, clearHoldInterval]);

  // Очищаем интервал при размонтировании компонента
  useEffect(() => {
    return () => clearHoldInterval();
  }, [clearHoldInterval]);

  const buttonSize = presetEnum[preset];
  
  return (
    <button
      style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onHold ? (e) => { e.stopPropagation(); } : handleClick}
      className={`${s.paginate} ${s[`${direction}`]} ${className}`}
      disabled={disabled}
    >
      <i style={{ width: `${buttonSize}px` }} className={s.def}></i>
      <i style={{ width: `${buttonSize}px` }} className={s.def}></i>
    </button>
  );
};

export default memo(ArrowButton);