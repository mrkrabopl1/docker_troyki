import React, { memo, useCallback, useRef, useState } from 'react';
import s from "./style.module.scss";

interface CloseButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  buttonSize?: number;
  onHold?: boolean;
}

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  buttonSize = 30,
  onHold = false
}) => {
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleMouseDown = useCallback((e) => {
    if (onHold && !disabled) {
      holdTimeoutRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => {
          onClick(e);
        }, 100);
      }, 300);
    }
  }, [onHold, disabled, onClick]);

  const handleMouseUp = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleTouchStart = useCallback((e) => {
    handleMouseDown(e);
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled && !onHold) {
      onClick(e);
    }
  }, [disabled, onHold, onClick]);

  // Рассчитываем размеры элементов относительно buttonSize
  const crossSize = buttonSize * 0.8; // 40% от размера кнопки
  const lineWidth = buttonSize * 0.12; // 12% от размера кнопки (толщина линии)
  const lineLength = crossSize * 0.7; // 70% от размера крестика

  return (
    <button
      style={{ 
        width: `${buttonSize}px`, 
        height: `${buttonSize}px`
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onHold ? (e) => { e.stopPropagation(); } : handleClick}
      className={`${s.closeButton} ${className}`}
      disabled={disabled}
    >
      <div className={s.crossMain}>
        <i 
          className={s.crossLine1} 
          style={{
            width: `${lineLength}px`,
            height: `${lineWidth}px`
          }}
        ></i>
        <i 
          className={s.crossLine2} 
          style={{
            width: `${lineLength}px`,
            height: `${lineWidth}px`
          }}
        ></i>
      </div>
    </button>
  );
};

export default memo(CloseButton);