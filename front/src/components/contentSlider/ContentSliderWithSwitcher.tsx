import React, { useState, useCallback, useMemo,ReactElement,CSSProperties } from 'react';
import SliderDefaultController from './slidersSwitchers/SliderDefaultController';
import ContentSlider from './ContentSlider';

type ContentSliderProps = {
  content: ReactElement[];
  className?: {
    slider?: string;
    holder?: string;
  };
};

const ContentSliderWithSwitcher: React.FC<ContentSliderProps> = ({ 
  content, 
  className = { slider: '', holder: '' } 
}) => {
  // Объединенное состояние для лучшей производительности
  const [sliderState, setSliderState] = useState({
    currentStep: 1,
    totalSteps: 1
  });

  // Мемоизированный обработчик изменения шага
  const handleStepChange = useCallback((newStep: number) => {
    setSliderState(prev => ({ ...prev, currentStep: newStep }));
  }, []);

  // Мемоизированный обработчик изменения общего количества шагов
  const handleTotalStepsChange = useCallback((steps: number) => {
    setSliderState(prev => ({
      ...prev,
      totalSteps: steps,
      // Автоматическая корректировка текущего шага
      currentStep: steps < prev.currentStep ? 1 : prev.currentStep
    }));
  }, []);

  // Мемоизированные пропсы для ContentSlider
  const contentSliderProps = useMemo(() => ({
    content,
    className: className.slider,
    currentStep: sliderState.currentStep,
    onChange: handleTotalStepsChange
  }), [content, className.slider, sliderState.currentStep, handleTotalStepsChange]);

  // Мемоизированные пропсы для SliderDefaultController
  const controllerProps = useMemo(() => ({
    currentPosition: sliderState.currentStep,
    positions: sliderState.totalSteps,
    onChange: handleStepChange
  }), [sliderState.currentStep, sliderState.totalSteps, handleStepChange]);

  // Мемоизированный стиль контейнера
  const containerStyle:CSSProperties = useMemo(() => ({
    position: "relative",
    height:"100%"
  }), []);

  return (
    <div style={containerStyle} className={className.holder}>
      <ContentSlider {...contentSliderProps} />
      {sliderState.totalSteps > 1 && <SliderDefaultController {...controllerProps} />}
    </div>
  );
};

export default React.memo(ContentSliderWithSwitcher)