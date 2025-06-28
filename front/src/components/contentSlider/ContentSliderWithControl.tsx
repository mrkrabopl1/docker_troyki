import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import PageController from './slidersSwitchers/PageController';
import ContentSlider from './ContentSlider';


type ContentSliderProps = {
    content: ReactElement[];
    className?: string;
};

const ContentSliderWithControl: React.FC<ContentSliderProps> = ({ content, className }) => {
    // Refs for DOM elements
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(1);
    const [sliderPosition, setSliderPosition] = useState(0);
  
    const handleStepChange = (newStep: number) => {
      setCurrentStep(newStep);
    };
  
    return (
      <div>
        <ContentSlider
          content={content}
          className={className}
          currentStep={currentStep}
          onChange={setTotalSteps}
        />
        <PageController
          currentPosition={currentStep}
          positions={totalSteps}
          callback={handleStepChange}
        />
      </div>
    );
};

export default ContentSliderWithControl;