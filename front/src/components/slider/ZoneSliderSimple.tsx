import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import s from "./style.module.css"



let styleWrapper:any = {
     position:"relative",
     height:"40px"  
}


type ZoneSliderSetterType= {
    min:number,
    max:number,
    onChange?:(...args:any)=>void|null,
    memo?:boolean
}

const  ZoneSliderSimple: React.FC<ZoneSliderSetterType>= ({min,max, onChange}) => {

    let wrappRef = useRef<HTMLDivElement>(null)
    let sliderRefRight = useRef<HTMLDivElement>(null)
    let sliderRefLeft = useRef<HTMLDivElement>(null)
    let activeLeft = useRef(false)
    let activeRight = useRef(false)
    let sliderLeftData = useRef<number>(0)
    sliderLeftData.current = min
    let sliderRightData = useRef<number>(0)
    sliderRightData.current = max

    useEffect(()=>{
        if( wrappRef.current){
            if(sliderRefLeft.current && min>=0 && min<=1){
                setSliderPositionLeft(Math.max((wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth)*min,0))
            }
            if(sliderRefRight.current && max>=0 && max<=1){
                console.debug(wrappRef.current.clientWidth*max-sliderRefRight.current.clientWidth)
                setSliderPositionRight((Math.max((wrappRef.current.clientWidth-sliderRefRight.current.clientWidth)*max,0)))

            }
        }
        
    },[min,max])

    let [sliderPositionLeft,setSliderPositionLeft] = useState(0)
    let [sliderPositionRight,setSliderPositionRight] = useState(1)
    

    let sliderStyleLeft:any = {
        position:"absolute",
        left:sliderPositionLeft,
        top:0,
        bottom:0,
        margin:"auto"
    }

    let sliderStyleRight:any = {
        position:"absolute",
        left:sliderPositionRight,
        top:0,
        bottom:0,
        margin:"auto"
    }
   
    return(
        <div
        onMouseLeave={()=>{
            activeLeft.current = false
            activeRight.current = false
        }}
        onMouseUp={()=>{
            activeLeft.current = false
            activeRight.current = false
        }}
        onMouseMove={(e)=>{
            e.preventDefault();
            console.log(e.clientX)
            let pos = Math.max(e.clientX,0)
            if(wrappRef.current){
                if(activeLeft.current && sliderRefLeft.current){
                    let left = wrappRef.current.getBoundingClientRect().left
                    let leftPos = Math.max(Math.min((pos - left - sliderRefLeft.current.clientWidth/2),wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth),0);
                    setSliderPositionLeft(leftPos)
                    sliderLeftData.current = (leftPos)/(wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth);
                    if(leftPos>=sliderPositionRight){
                        setSliderPositionRight(leftPos)
                        sliderRightData.current = sliderLeftData.current;
                    }
                    if(onChange)onChange(sliderLeftData.current, sliderRightData.current)
                }
                if(activeRight.current && sliderRefLeft.current){
                    let left = wrappRef.current.getBoundingClientRect().left
                    console.debug(left,  wrappRef.current.getBoundingClientRect().left)
                    let rightPos = Math.max(Math.min((pos - left - sliderRefLeft.current.clientWidth/2),wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth),0)
                    setSliderPositionRight(rightPos)
                    sliderRightData.current = (rightPos)/(wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth);
                    if(rightPos<=sliderPositionLeft){
                        setSliderPositionLeft(rightPos)
                        sliderLeftData.current = sliderRightData.current;

                    }
                    if(onChange)onChange(sliderLeftData.current, sliderRightData.current);
                }
                
            }
          
        }} style={styleWrapper} ref={wrappRef}>
            <div className={s.sliderLine} style={
                {position:"absolute",
                margin:"auto",top:0,bottom:0,
                width:"100%"}}>
                <div className={s.sliderControl} onMouseDown={(e)=>{
                    e.preventDefault();
                    activeLeft.current = true
                }} ref={sliderRefLeft} style={sliderStyleLeft}></div>
                <div className={s.sliderControl} onMouseDown={(e)=>{
                    e.preventDefault();
                    activeRight.current = true
                }} ref={sliderRefRight} style={sliderStyleRight}></div>
            </div>
        </div>
    )
}
function arePropsEqual(oldProps:any, newProps:any) {

    return (oldProps.memo==newProps.memo)
}

export default memo(ZoneSliderSimple,arePropsEqual)