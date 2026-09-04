import React, { useState, useCallback, useMemo, ReactElement, useRef, useEffect } from 'react';
import ContentSlider from './ContentSlider';
import LinkController from './slidersSwitchers/LinkController';

type ContentSliderProps = {
  content: ReactElement[];
  className?: string;
};

const ContentSliderWithLinks: React.FC<ContentSliderProps> = ({ content, className }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(1);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const currentStepRef = useRef(currentStep);
  const totalStepsRef = useRef(totalSteps);
  const stepSizeRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  // Обновляем refs
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    totalStepsRef.current = totalSteps;
  }, [totalSteps]);

  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  // Получаем размер шага
  const getStepSize = useCallback(() => {
    if (!containerRef.current) return 0;
    
    const container = containerRef.current;
    const track = container.querySelector('[style*="display: flex"]') as HTMLElement;
    
    if (!track || content.length === 0) return 0;
    
    const containerWidth = container.clientWidth;
    const trackWidth = track.scrollWidth;
    const itemWidth = trackWidth / content.length;
    const visibleItems = Math.floor(containerWidth / itemWidth) || 1;
    const hiddenItems = Math.max(0, content.length - visibleItems);
    
    return hiddenItems > 0 ? (trackWidth - containerWidth) / hiddenItems : 0;
  }, [content.length]);

  // Завершение drag
  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    const stepSize = stepSizeRef.current || getStepSize();
    const currentOffset = dragOffsetRef.current;
    const percentage = Math.abs(currentOffset) / stepSize;
    
    if (percentage > 0.5 && stepSize > 0) {
      const direction = currentOffset > 0 ? -1 : 1;
      const newStep = currentStepRef.current + direction;
      
      if (newStep >= 1 && newStep <= totalStepsRef.current) {
        setCurrentStep(newStep);
      }
    }
    
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }, [getStepSize]);

  // Обработчик движения
  const handleMove = useCallback((clientX: number) => {
    if (!isDraggingRef.current) return;
    
    const deltaX = clientX - dragStartX.current;
    const stepSize = stepSizeRef.current || getStepSize();
    
    const maxOffset = stepSize;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
    
    dragOffsetRef.current = clampedOffset;
    setDragOffset(clampedOffset);
  }, [getStepSize]);

  // Обработчики мыши
  const onMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX);
  }, [handleMove]);

  const onMouseUp = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Обработчики touch
  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX);
  }, [handleMove]);

  const onTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Начало drag
  const startDrag = useCallback((clientX: number) => {
    stepSizeRef.current = getStepSize();
    dragStartX.current = clientX;
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }, [getStepSize]);

  // Mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(e.clientX);
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [startDrag, onMouseMove, onMouseUp]);

  // Touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startDrag(touch.clientX);
    
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, [startDrag, onTouchMove, onTouchEnd]);

  // Очистка
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const handleTotalStepsChange = useCallback((steps: number) => {
    setTotalSteps(steps);
    if (currentStep > steps) {
      setCurrentStep(1);
    }
  }, [currentStep]);

  const contentSliderProps = useMemo(() => ({
    content,
    className,
    currentStep,
    onChange: handleTotalStepsChange,
    isDragging,
    dragOffset,
    transitionDuration: 300
  }), [content, className, currentStep, handleTotalStepsChange, isDragging, dragOffset]);

  const pageControllerProps = useMemo(() => ({
    currentPosition: currentStep,
    positions: totalSteps,
    callback: setCurrentStep
  }), [currentStep, totalSteps]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: "relative", 
        height: "100%",
        width: "100%",
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <ContentSlider {...contentSliderProps} />
      
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        pointerEvents: 'auto'
      }}>
        {totalSteps > 1 && <LinkController {...pageControllerProps} />}
      </div>
    </div>
  );
};

export default React.memo(ContentSliderWithLinks);