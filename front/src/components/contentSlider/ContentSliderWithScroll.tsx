import React, { useState, useCallback, useMemo, ReactElement, useRef, useEffect } from 'react';
import ContentSliderWithoutSteps from './ContentSliderWithoutSteps';
import ScrollerThumb from './slidersSwitchers/ScrollerThumb';

type ContentSliderProps = {
    content: ReactElement[];
    className?: string;
};

const ContentSliderWithScroll: React.FC<ContentSliderProps> = ({ content, className }) => {
    const [sliderState, setSliderState] = useState({
        currentStep: 0,
        totalSteps: 1
    });

    // Обработчик изменения шага
    const handleStepChange = useCallback((deltaPos: number, proportional?: boolean) => {
        if (proportional) {
            const newStep = Math.round(deltaPos * (sliderState.totalSteps - 1));
            setSliderState(prev => ({ 
                ...prev, 
                currentStep: newStep 
            }));
        } else {
            setSliderState(prev => ({
                ...prev,
                currentStep: Math.max(0, Math.min(prev.currentStep + deltaPos, prev.totalSteps - 1))
            }));
        }
    }, [sliderState.totalSteps]);

    // Обработчик изменения общего количества шагов
    const handleTotalStepsChange = useCallback((totalWidth: number) => {
        const container = document.querySelector('[data-slider-container]') as HTMLElement;
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        const steps = Math.max(1, Math.ceil(totalWidth - containerWidth));
        
        setSliderState(prev => ({
            totalSteps: steps,
            currentStep: prev.currentStep >= steps ? steps - 1 : prev.currentStep
        }));
    }, []);

    // Drag функционал с проверкой направления
    const [isDragging, setIsDragging] = useState(false);
    const [isHorizontalDrag, setIsHorizontalDrag] = useState(false);
    const dragStartX = useRef(0);
    const dragStartY = useRef(0);
    const dragStartStep = useRef(0);
    const dragDirectionDetermined = useRef(false);

    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        setIsDragging(true);
        dragStartX.current = clientX;
        dragStartY.current = clientY;
        dragStartStep.current = sliderState.currentStep;
        dragDirectionDetermined.current = false;
        setIsHorizontalDrag(false);
    }, [sliderState.currentStep]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;
        
        const deltaX = Math.abs(clientX - dragStartX.current);
        const deltaY = Math.abs(clientY - dragStartY.current);
        
        // Определяем направление движения, если еще не определили
        if (!dragDirectionDetermined.current && (deltaX > 5 || deltaY > 5)) {
            dragDirectionDetermined.current = true;
            // Если горизонтальное перемещение больше вертикального, считаем что это горизонтальный свайп
            setIsHorizontalDrag(deltaX > deltaY);
        }
        
        // Если определили, что это не горизонтальное движение, не обрабатываем
        if (dragDirectionDetermined.current && !isHorizontalDrag) {
            return;
        }
        
        // Только горизонтальное движение
        if (!dragDirectionDetermined.current || isHorizontalDrag) {
            const deltaXAbs = clientX - dragStartX.current;
            const container = document.querySelector('[data-slider-container]') as HTMLElement;
            if (!container || sliderState.totalSteps <= 1) return;
            
            const containerWidth = container.clientWidth;
            const stepWidth = containerWidth / (sliderState.totalSteps - 1);
            const stepDelta = deltaXAbs / stepWidth;
            
            let newStep = Math.round(dragStartStep.current + stepDelta);
            newStep = Math.max(0, Math.min(newStep, sliderState.totalSteps - 1));
            
            if (newStep !== sliderState.currentStep) {
                setSliderState(prev => ({ ...prev, currentStep: newStep }));
            }
        }
    }, [isDragging, sliderState.totalSteps, sliderState.currentStep, isHorizontalDrag]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setIsHorizontalDrag(false);
        dragDirectionDetermined.current = false;
    }, []);

    // Обработчики для мыши
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        handleDragStart(e.clientX, e.clientY);
    }, [handleDragStart]);

    // Обработчики для touch
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, [handleDragStart]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
        
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleDragEnd);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleDragEnd);
            document.body.style.userSelect = 'none';
        }
        
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleDragEnd);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleDragEnd);
            document.body.style.userSelect = '';
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    // Мемоизированные пропсы для ContentSlider
    const contentSliderProps = useMemo(() => ({
        content,
        className,
        currentShift: sliderState.currentStep,
        onChange: handleTotalStepsChange
    }), [content, className, sliderState.currentStep, handleTotalStepsChange]);

    // Рассчитываем позицию для скроллбара
    const scrollThumbProps = useMemo(() => ({
        kSize: Math.min(1 / Math.max(sliderState.totalSteps, 1), 1),
        kPos: sliderState.totalSteps > 1 ? sliderState.currentStep / (sliderState.totalSteps - 1) : 0,
        callback: handleStepChange,
        wheelDelta: 0.03
    }), [sliderState.currentStep, sliderState.totalSteps, handleStepChange]);

    return (
        <div 
            onClick={e=>e.stopPropagation()} 
            style={{ padding:"20px", position: "relative", cursor: isDragging && isHorizontalDrag ? 'grabbing' : 'grab' }} 
            data-slider-container
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
           <ContentSliderWithoutSteps {...contentSliderProps} />
           <div onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} style={{ paddingTop: "10px", position: "relative", margin: "0 auto" }}>
              <ScrollerThumb {...scrollThumbProps} />
           </div>
        </div>
    );
};

export default ContentSliderWithScroll;