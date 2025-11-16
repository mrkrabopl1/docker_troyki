import React, { 
  useCallback, 
  useEffect, 
  useRef, 
  useState, 
  useMemo,
  ReactElement, 
  CSSProperties 
} from 'react';

type SliderProps = {
  content: ReactElement[];
  className?: string;
  currentStep?: number;
  onChange?: (steps: number) => void;
  transitionDuration?: number;
};

const ContentSlider: React.FC<SliderProps> = ({ 
  content, 
  className,
  currentStep = 1,
  onChange,
  transitionDuration = 300
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    stepSize: 0,
    totalSteps: 1,
    containerWidth: 0,
    trackWidth: 0
  });
  const [internalPosition, setInternalPosition] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Расчет размеров и параметров слайдера
  const calculateDimensions = useCallback(() => {
    if (!trackRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    
    if (
      dimensions.containerWidth === containerWidth && 
      dimensions.trackWidth === trackWidth
    ) {
      return;
    }

    const itemWidth = trackWidth / content.length;
    const visibleItems = Math.floor(containerWidth / itemWidth);
    const hiddenItems = Math.max(0, content.length - visibleItems);
    const newTotalSteps = Math.max(1, hiddenItems + 1);
    const newStepSize = hiddenItems > 0 
      ? (trackWidth - containerWidth) / hiddenItems 
      : 0;
    
    setDimensions({
      stepSize: newStepSize,
      totalSteps: newTotalSteps,
      containerWidth,
      trackWidth
    });

    onChange?.(newTotalSteps);
  }, [content.length, dimensions, onChange]);

  // Оптимизированная версия с requestAnimationFrame
  const debouncedCalculateDimensions = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    animationFrameId.current = requestAnimationFrame(() => {
      calculateDimensions();
    });
  }, [calculateDimensions]);

  // Обновление позиции при изменении currentStep
  useEffect(() => {
    const newPosition = -(currentStep - 1) * dimensions.stepSize;
    setInternalPosition(newPosition);
  }, [currentStep, dimensions.stepSize]);

  // Инициализация ResizeObserver
  useEffect(() => {
    debouncedCalculateDimensions();
    
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(debouncedCalculateDimensions);
    }
    
    const container = containerRef.current;
    if (container) {
      resizeObserverRef.current.observe(container);
    }

    return () => {
      if (resizeObserverRef.current && container) {
        resizeObserverRef.current.unobserve(container);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [debouncedCalculateDimensions]);

  // Стиль трека
  const trackStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    transform: `translateX(${internalPosition}px)`,
    transition: `transform ${transitionDuration}ms ease-out`,
    willChange: 'transform',
    justifyContent:"space-between"
  }), [internalPosition, transitionDuration]);

  // Стиль контейнера
  const containerStyle: CSSProperties = useMemo(() => ({
    overflow: 'hidden',
    width: '100%',
    position: 'relative',
    height: '100%'
  }), []);

  return (
    <div ref={containerRef} style={containerStyle}>
      <div
        ref={trackRef}
        className={className}
        style={trackStyle}
      >
        {content}
      </div>
    </div>
  );
};

export default ContentSlider;