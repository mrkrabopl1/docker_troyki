import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

type SliderProps = {
  content: ReactElement[];
  className?: string;
  currentStep?: number;
  onChange?: (steps: number) => void;
};

const ContentSlider: React.FC<SliderProps> = ({ 
  content, 
  className,
  currentStep = 1,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [stepSize, setStepSize] = useState(0);
  const [totalSteps, setTotalSteps] = useState(1);
  const [internalPosition, setInternalPosition] = useState(0);

  const calculateDimensions = useCallback(() => {
    if (!trackRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    const itemWidth = trackWidth / content.length;
    
    const visibleItems = Math.floor(containerWidth / itemWidth);
    const hiddenItems = Math.max(0, content.length - visibleItems);
    const newTotalSteps = Math.max(1, hiddenItems + 1);
    
    const newStepSize = hiddenItems > 0 ? (trackWidth - containerWidth) / hiddenItems : 0;
    
    setTotalSteps(newTotalSteps);
    setStepSize(newStepSize);
    onChange?.(newTotalSteps);
    
    // Обновляем позицию (CSS transition сделает анимацию)
    setInternalPosition(-(currentStep - 1) * newStepSize);
  }, [content.length, currentStep, onChange]);

  useEffect(() => {
    calculateDimensions();
    const resizeObserver = new ResizeObserver(calculateDimensions);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [calculateDimensions]);

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', width: '100%' }}>
      <div
        ref={trackRef}
        className={className}
        style={{
          display: 'flex',
          transform: `translateX(${internalPosition}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      >
        {content}
      </div>
    </div>
  );
};

export default ContentSlider;