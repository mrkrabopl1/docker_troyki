import React, { useState, useCallback, useMemo, ReactElement } from 'react';
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

    // Обработчик изменения шага - БЕЗ debounce для мгновенного обновления
    const handleStepChange = useCallback((deltaPos: number, proportional?: boolean) => {
        if (proportional) {
            // deltaPos от 0 до 1, конвертируем в шаг
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
        <div onClick={e=>e.stopPropagation()} style={{ padding:"20px", position: "relative" }} data-slider-container>
           <ContentSliderWithoutSteps {...contentSliderProps} />
           <div onClick={e=>e.stopPropagation()} onMouseDown={e=>e.stopPropagation()} style={{ width: "400px", paddingTop: "10px", position: "relative", margin: "0 auto" }}>
              <ScrollerThumb {...scrollThumbProps} />
           </div>
        </div>
    );
};

export default ContentSliderWithScroll;