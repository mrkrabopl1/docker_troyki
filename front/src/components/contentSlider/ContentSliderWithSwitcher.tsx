import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import SliderDefaultController from './slidersSwitchers/SliderDefaultController';
import ContentSlider from './ContentSlider';


type ContentSliderProps = {
    content: ReactElement[];
    className?: {
      slider?:string,
      holder?:string
    };
};

const ContentSliderWithSwitcher: React.FC<ContentSliderProps> = ({ content, className }) => {
    // Refs for DOM elements
    const [currentStep, setCurrentStep] = useState(1);
    const [totalSteps, setTotalSteps] = useState(1);
    const [sliderPosition, setSliderPosition] = useState(0);
  
    const handleStepChange = (newStep: number) => {
      setCurrentStep(newStep);
    };
  
    return (
      <div className={className?className.holder:""}>
        <ContentSlider
          content={content}
          className={className?className.slider:""}
          currentStep={currentStep}
          onChange={setTotalSteps}
        />
        <SliderDefaultController
          currentPosition={currentStep}
          positions={totalSteps}
          onChange={handleStepChange}
        />
      </div>
    );
};

export default ContentSliderWithSwitcher;