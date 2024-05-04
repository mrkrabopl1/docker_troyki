import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Button from '../Button'
import SliderDefaultController from './slidersSwitchers/SliderDefaultController'
import LinkController from './slidersSwitchers/LinkController'
import PageController from './slidersSwitchers/PageController'


type ContentSliderType = {
    content: ReactElement[]
}

const ContentSlider: React.FC<ContentSliderType> = (data) => {
    let { content } = { ...data }

    let mainContainer = useRef<HTMLDivElement | null>(null)
    let slider = useRef<HTMLDivElement | null>(null)
    let componentWidthProportion = useRef<number>(1)
    let unseenWidth = useRef<number>(0)
    let step = useRef<number>(0)
    let reqFrame = useRef<number>(0)
    let animating = useRef<boolean>(false)
    let [stepCount,setStepCount] = useState<number>(0)
    let currentStep = useRef<number>(1)
    let [sliderPosition,setSliderPosition] = useState<number>(0)
    let diffFromPreviousAnimation = useRef<number>(0)
    

    useEffect(()=>{
        window.addEventListener("resize", calculateStep);
        calculateStep();
        return () => {
          window.removeEventListener("resize", calculateStep);
        };
    },[])

    function calculateStep(){
        if(slider.current && mainContainer.current){
            let wrapperWidth =  mainContainer.current.clientWidth
            let sliderWidth =  slider.current.scrollWidth
            unseenWidth.current = sliderWidth - wrapperWidth
            let elemWidth = sliderWidth/content.length
            let fullContentInSlider = Math.floor(wrapperWidth/elemWidth)
            let unseenElements= content.length - fullContentInSlider
            step.current = (sliderWidth-wrapperWidth)/unseenElements
            setSliderPosition(-(currentStep.current-1)*step.current)
            setStepCount(unseenElements+1)
        }
        return 0
    }


    function sliderAnimate(duration: number, stepDiff:number) {
        let start = performance.now();

        reqFrame.current = requestAnimationFrame(function animate(time) {
            let timePass = (time - start) / 1000
        
            let progress = timePass / duration
            setSliderPosition((step.current*stepDiff + diffFromPreviousAnimation.current)*progress + sliderPosition)
            if (progress < 1) {
                reqFrame.current = requestAnimationFrame(animate);
            } 
            else{
                animating.current = false 
                return
            }
        });
    }

    function moveSlider(page:number){
        diffFromPreviousAnimation.current = 0;

        let stepDiff = currentStep.current - page
        if(!animating.current){
            if((stepDiff>0 && currentStep.current>1) || (stepDiff<0 && currentStep.current<stepCount)){
                animating.current = true
                currentStep.current = currentStep.current - stepDiff
                sliderAnimate(2, stepDiff)
            }
        }else{
            let expectedPosition = (currentStep.current-1)*step.current
            if(slider.current){
                diffFromPreviousAnimation.current = -expectedPosition -sliderPosition
            }
            currentStep.current = currentStep.current - stepDiff
            cancelAnimationFrame(reqFrame.current)
            sliderAnimate(2, stepDiff)
        }
    }


    return (
        <div ref={mainContainer} style={{overflow:"hidden", width: "100%" }}>
            <div ref={slider} style={{left:sliderPosition+"px",display:"flex", position:"relative" }}>
               {content}
            </div>
            <PageController currentPosition={currentStep.current} positions={stepCount} callback={moveSlider}/>
        </div>
    )
}


export default ContentSlider