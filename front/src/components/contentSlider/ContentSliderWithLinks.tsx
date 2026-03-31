import React, { useState, useCallback, useMemo, ReactElement, useRef, useEffect } from 'react';
import LinkController from './slidersSwitchers/LinkController';
import ContentSlider from './ContentSlider';

type ContentSliderProps = {
  content: ReactElement[];
  className?: string;
};

const ContentSliderWithLinks: React.FC<ContentSliderProps> = ({ content, className }) => {
  // Состояние с минимальным необходимым количеством переменных
  const [sliderState, setSliderState] = useState({
    currentStep: 1,
    totalSteps: 1
  });

  // Refs для хранения актуальных значений для drag-обработчиков
  const currentStepRef = useRef(sliderState.currentStep);
  const totalStepsRef = useRef(sliderState.totalSteps);
  
  // Refs для обработки drag
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const dragThreshold = 50; // Минимальное расстояние для смены шага

  // Обновляем refs при изменении состояния
  useEffect(() => {
    currentStepRef.current = sliderState.currentStep;
    totalStepsRef.current = sliderState.totalSteps;
  }, [sliderState.currentStep, sliderState.totalSteps]);

  // Мемоизированный обработчик изменения шага
  const handleStepChange = useCallback((newStep: number) => {
    setSliderState(prev => ({ ...prev, currentStep: newStep }));
  }, []);

  // Мемоизированный обработчик изменения общего количества шагов
  const handleTotalStepsChange = useCallback((steps: number) => {
    setSliderState(prev => ({ 
      ...prev, 
      totalSteps: steps,
      // Автоматически сбросить на первый шаг при изменении количества шагов
      currentStep: steps < prev.currentStep ? 1 : prev.currentStep
    }));
  }, []);

  // Обработчик движения (мышь) - используем refs для актуальных значений
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - dragStartX.current;
    const deltaY = e.clientY - dragStartY.current;
    
    // Проверяем, что движение больше по горизонтали, чем по вертикали
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
      if (deltaX > 0 && currentStepRef.current > 1) {
        // Свайп вправо - предыдущий шаг
        handleStepChange(currentStepRef.current - 1);
        resetDrag();
      } else if (deltaX < 0 && currentStepRef.current < totalStepsRef.current) {
        // Свайп влево - следующий шаг
        handleStepChange(currentStepRef.current + 1);
        resetDrag();
      }
    }
  }, [handleStepChange]);

  // Обработчик движения (touch) - используем refs для актуальных значений
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartX.current;
    const deltaY = touch.clientY - dragStartY.current;
    
    // Проверяем, что движение больше по горизонтали, чем по вертикали
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > dragThreshold) {
      if (deltaX > 0 && currentStepRef.current > 1) {
        // Свайп вправо - предыдущий шаг
        handleStepChange(currentStepRef.current - 1);
        resetDrag();
      } else if (deltaX < 0 && currentStepRef.current < totalStepsRef.current) {
        // Свайп влево - следующий шаг
        handleStepChange(currentStepRef.current + 1);
        resetDrag();
      }
    }
  }, [handleStepChange]);

  // Обработчик начала drag (мышь)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDragging.current = true;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Обработчик начала drag (touch)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragStartX.current = touch.clientX;
    dragStartY.current = touch.clientY;
    isDragging.current = true;
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  // Сброс drag состояния
  const resetDrag = useCallback(() => {
    isDragging.current = false;
    dragStartX.current = 0;
    dragStartY.current = 0;
  }, []);

  // Обработчик окончания drag (мышь)
  const handleMouseUp = useCallback(() => {
    resetDrag();
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Обработчик окончания drag (touch)
  const handleTouchEnd = useCallback(() => {
    resetDrag();
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  }, [handleTouchMove]);

  // Очистка событий при размонтировании
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Мемоизированные пропсы для ContentSlider
  const contentSliderProps = useMemo(() => ({
    content,
    className,
    currentStep: sliderState.currentStep,
    onChange: handleTotalStepsChange
  }), [content, className, sliderState.currentStep, handleTotalStepsChange]);

  // Мемоизированные пропсы для LinkController
  const pageControllerProps = useMemo(() => ({
    currentPosition: sliderState.currentStep,
    positions: sliderState.totalSteps,
    callback: handleStepChange
  }), [sliderState.currentStep, sliderState.totalSteps, handleStepChange]);

  return (
    <div 
      ref={containerRef}
      style={{
        position: "relative", 
        height: "100%",
        cursor: isDragging.current ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'pan-y pinch-zoom',
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
        {sliderState.totalSteps > 1 && <LinkController {...pageControllerProps} />}
      </div>
    </div>
  );
};

export default React.memo(ContentSliderWithLinks);