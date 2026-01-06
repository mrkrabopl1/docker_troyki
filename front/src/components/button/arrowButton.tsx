import React, { memo, useCallback, useRef ,useState} from 'react';
import s from "./style.module.scss";

interface ArrowButtonProps {
  direction: 'up' | 'down' | 'left' | 'right';
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
  buttonSize?: number;
  onHold?: boolean;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
  direction,
  onClick,
  disabled = false,
  className = '',
  buttonSize = 30,
  onHold = false
}) => {
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
   const [active, setActive] = useState(false);
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

  const rotation = {
    up: 180,
    right: 90,
    down: 0,
    left: 270
  }[direction];

  return (
    <button
      style={{ 
        width: `${buttonSize}px`, 
        height: `${buttonSize}px`,
        transform: `rotate(${rotation}deg)`
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onHold ? (e) => { e.stopPropagation(); } : handleClick}
      className={`${s.paginate} ${className}`}
      disabled={disabled}
    >
      <div className={s.arrowMain}>
        <i  className={s.arrowLeft}></i>
        <i  className={s.arrowRight}></i>
      </div>
    </button>
  );
};
export default memo(ArrowButton);