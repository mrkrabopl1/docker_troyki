import React, { useState, useCallback,useMemo,ReactElement } from 'react';
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
  <div style={{position:"relative", height: "100%"}}>
    <ContentSlider {...contentSliderProps} />
    <div style={{
      position: "absolute",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10
    }}>
      {sliderState.totalSteps > 1 && <LinkController {...pageControllerProps} />}
    </div>
  </div>
);
};

export default React.memo(ContentSliderWithLinks);