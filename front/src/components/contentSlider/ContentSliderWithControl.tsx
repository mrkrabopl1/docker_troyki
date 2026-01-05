import React, { useState, useCallback,useMemo,ReactElement } from 'react';
import PageController from './slidersSwitchers/PageController';
import ContentSlider from './ContentSlider';

type ContentSliderProps = {
  content: ReactElement[];
  className?: string;
};

const ContentSliderWithControl: React.FC<ContentSliderProps> = ({ content, className }) => {
  // Состояние с минимальным необходимым количеством переменных
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
      // Автоматически сбросить на первый шаг при изменении количества шагов
      currentStep: steps < prev.currentStep ? 1 : prev.currentStep
    }));
  }, []);

  // Мемоизированные пропсы для ContentSlider
  const contentSliderProps = useMemo(() => ({
    content,
    className,
    currentStep: sliderState.currentStep,
    onChange: handleTotalStepsChange
  }), [content, className, sliderState.currentStep, handleTotalStepsChange]);

  // Мемоизированные пропсы для PageController
  const pageControllerProps = useMemo(() => ({
    currentPosition: sliderState.currentStep,
    positions: sliderState.totalSteps,
    callback: handleStepChange
  }), [sliderState.currentStep, sliderState.totalSteps, handleStepChange]);

  return (
    <div>
      <ContentSlider {...contentSliderProps} />
      {sliderState.totalSteps > 1 && <PageController {...pageControllerProps} />}
    </div>
  );
};

export default React.memo(ContentSliderWithControl);