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
  isDragging?: boolean;
  dragOffset?: number;
};

const ContentSlider: React.FC<SliderProps> = ({ 
  content, 
  className,
  currentStep = 1,
  onChange,
  transitionDuration = 300,
  isDragging = false,
  dragOffset = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [stepSize, setStepSize] = useState(0);
  const [position, setPosition] = useState(0);

  // Вычисляем размеры
  useEffect(() => {
    if (!containerRef.current || !trackRef.current || content.length === 0) return;

    const containerWidth = containerRef.current.clientWidth;
    const trackWidth = trackRef.current.scrollWidth;
    
    const itemWidth = trackWidth / content.length;
    const visibleItems = Math.floor(containerWidth / itemWidth) || 1;
    const hiddenItems = Math.max(0, content.length - visibleItems);
    const newTotalSteps = Math.max(1, hiddenItems + 1);
    const newStepSize = hiddenItems > 0 
      ? (trackWidth - containerWidth) / hiddenItems 
      : 0;
    
    setStepSize(newStepSize);
    onChange?.(newTotalSteps);
  }, [content, onChange]);

  // Обновляем позицию
  useEffect(() => {
    let newPosition = -(currentStep - 1) * stepSize;
    if (isDragging) {
      newPosition += dragOffset;
    }
    setPosition(newPosition);
  }, [currentStep, stepSize, isDragging, dragOffset]);

  // Пересчет при изменении размера окна
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !trackRef.current || content.length === 0) return;

      const containerWidth = containerRef.current.clientWidth;
      const trackWidth = trackRef.current.scrollWidth;
      
      const itemWidth = trackWidth / content.length;
      const visibleItems = Math.floor(containerWidth / itemWidth) || 1;
      const hiddenItems = Math.max(0, content.length - visibleItems);
      const newTotalSteps = Math.max(1, hiddenItems + 1);
      const newStepSize = hiddenItems > 0 
        ? (trackWidth - containerWidth) / hiddenItems 
        : 0;
      
      setStepSize(newStepSize);
      onChange?.(newTotalSteps);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [content.length, onChange]);

  const trackStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    transform: `translateX(${position}px)`,
    transition: isDragging ? 'none' : `transform ${transitionDuration}ms ease-out`,
    willChange: 'transform',
    height: '100%',
    width: '100%',
  }), [position, transitionDuration, isDragging]);

  // Добавляем flex: 0 0 auto каждому ребенку
  const childrenWithStyle = useMemo(() => {
    return React.Children.map(content, (child) => {
      return React.cloneElement(child, {
        style: {
          ...child.props.style,
          flex: '0 0 auto',
          height: '100%',
          minWidth: '100%',
        }
      });
    });
  }, [content]);

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', width: '100%', height: '100%' }}>
      <div ref={trackRef} className={className} style={trackStyle}>
        {childrenWithStyle}
      </div>
    </div>
  );
};

export default memo(ContentSlider);