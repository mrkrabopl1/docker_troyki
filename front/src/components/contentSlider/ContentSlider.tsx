import React, { 
  useEffect, 
  useRef, 
  useState, 
  useMemo,
  ReactElement, 
  CSSProperties,
  memo
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
  
  // Храним content в ref для ResizeObserver
  const contentRef = useRef(content);
  
  // Синхронизируем ref при изменении content
  useEffect(() => {
    contentRef.current = content;
    console.log('Content ref updated:', content.length);
  }, [content]);

  // Функция для ResizeObserver (использует ref)
  const handleResize = () => {
    if (!trackRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    const currentContent = contentRef.current; // ← Берем из ref!

    console.log('handleResize called, content length:', currentContent.length);
    
    if (currentContent.length === 0) {
      console.log('Skipping: no content');
      return;
    }

    const itemWidth = trackWidth / currentContent.length;
    const visibleItems = Math.floor(containerWidth / itemWidth);
    const hiddenItems = Math.max(0, currentContent.length - visibleItems);
    const newTotalSteps = Math.max(1, hiddenItems + 1);
    const newStepSize = hiddenItems > 0 
      ? (trackWidth - containerWidth) / hiddenItems 
      : 0;
    
    setDimensions(prev => {
      if (prev.containerWidth === containerWidth && prev.trackWidth === trackWidth) {
        return prev;
      }
      return {
        stepSize: newStepSize,
        totalSteps: newTotalSteps,
        containerWidth,
        trackWidth
      };
    });

    onChange?.(newTotalSteps);
  };

  // Обновление позиции
  useEffect(() => {
    const newPosition = -(currentStep - 1) * dimensions.stepSize;
    setInternalPosition(newPosition);
  }, [currentStep, dimensions.stepSize]);

  // ResizeObserver - БЕЗ зависимостей!
  useEffect(() => {
    console.log('Setting up ResizeObserver');
    
    resizeObserverRef.current = new ResizeObserver(handleResize);
    
    const container = containerRef.current;
    if (container) {
      resizeObserverRef.current.observe(container);
    }

    // Первоначальный расчет
    const timeoutId = setTimeout(handleResize, 100);

    return () => {
      if (resizeObserverRef.current && container) {
        resizeObserverRef.current.unobserve(container);
      }
      clearTimeout(timeoutId);
    };
  }, []); // Пустой массив - только при монтировании

  // Перерасчет при изменении content (кроме первого раза)
  useEffect(() => {
    console.log('Content changed, triggering recalculation');
    const timeoutId = setTimeout(handleResize, 100);
    return () => clearTimeout(timeoutId);
  }, [content]);

  const trackStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    transform: `translateX(${internalPosition}px)`,
    transition: `transform ${transitionDuration}ms ease-out`,
    willChange: 'transform',
    justifyContent: "space-between",
    height: '100%'
  }), [internalPosition, transitionDuration]);

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

export default memo(ContentSlider);