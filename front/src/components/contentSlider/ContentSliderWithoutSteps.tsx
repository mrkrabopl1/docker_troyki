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
  currentShift?: number;
  onChange?: (steps: number) => void;
  transitionDuration?: number;
};

const ContentSliderWithoutSteps: React.FC<SliderProps> = ({ 
  content, 
  className,
  currentShift = 1,
  onChange,
  transitionDuration = 300
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    containerWidth: 0,
    trackWidth: 0
  });
  const [internalPosition, setInternalPosition] = useState(0);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const animationFrameId = useRef<number | null>(null);


// И в calculateDimensions:
const calculateDimensions = useCallback(() => {
    if (!trackRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    
    setDimensions({
        containerWidth,
        trackWidth
    });

    // Передаем общую ширину трека
    onChange?.(trackWidth - containerWidth);
}, [onChange]);
  // Расчет размеров и параметров слайдера

  // Оптимизированная версия с requestAnimationFrame
  const debouncedCalculateDimensions = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    animationFrameId.current = requestAnimationFrame(() => {
      calculateDimensions();
    });
  }, [calculateDimensions]);

  // Обновление позиции при изменении currentShift
useEffect(() => {
    if (!containerRef.current) return;
    const newPosition = -currentShift; // Умножаем на ширину контейнера
    setInternalPosition(newPosition);
}, [currentShift]);

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
    //transition: `transform ${transitionDuration}ms ease-out`,
    willChange: 'transform',
    justifyContent: "space-between"
  }), [internalPosition, transitionDuration]);

  // Стиль контейнера
  const containerStyle: CSSProperties = useMemo(() => ({
    overflow: 'hidden',
    width: '100%',
    position: 'relative'
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

export default ContentSliderWithoutSteps;