import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import s from "./style.module.css"



let styleWrapper:any = {
     position:"relative",
     height:"40px"  
}


type ZoneSliderSetterType= {
    min:number,
    max:number,
    onChangeLeft?:(...args:any)=>void|null,
    onChangeRight?:(...args:any)=>void|null,
    memo?:boolean
}

const  ZoneSlider: React.FC<ZoneSliderSetterType>= ({min,max, onChangeLeft, onChangeRight}) => {

    let wrappRef = useRef<HTMLDivElement>(null)
    let sliderRefRight = useRef<HTMLDivElement>(null)
    let sliderRefLeft = useRef<HTMLDivElement>(null)
    let activeLeft = useRef(false)
    let activeRight = useRef(false)

    useEffect(()=>{
        if( wrappRef.current){
            if(sliderRefLeft.current && min>=0 && min<=1){
                setSliderPositionLeft((wrappRef.current.clientWidth-2*sliderRefLeft.current.clientWidth)*min+sliderRefLeft.current.clientWidth)
            }
            if(sliderRefRight.current && max>=0 && max<=1){
                setSliderPositionRight(wrappRef.current.clientWidth*max - sliderRefRight.current.clientWidth)
            }
        }
        
    },[min,max])

    let [sliderPositionLeft,setSliderPositionLeft] = useState(0)
    let [sliderPositionRight,setSliderPositionRight] = useState(1)
    

    let sliderStyleLeft:any = {
        position:"absolute",
        left:0 - 10,
        top:0,
        bottom:0,
        margin:"auto"
    }

    let sliderStyleRight:any = {
        position:"absolute",
        right:0 -10,
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
                    let leftPos = Math.max(Math.min(pos-left+sliderRefLeft.current.clientWidth/2,sliderPositionRight),sliderRefLeft.current.clientWidth)
                    console.log(leftPos,"fdmsf")
                    setSliderPositionLeft(leftPos)
                    if(onChangeLeft)onChangeLeft((leftPos-sliderRefLeft.current.clientWidth)/(wrappRef.current.clientWidth-2*sliderRefLeft.current.clientWidth))
                }
                if(activeRight.current && sliderRefLeft.current){
                    let left = wrappRef.current.getBoundingClientRect().left
                    let rightPos = Math.min(Math.max(pos - left -sliderRefLeft.current.clientWidth/2,sliderPositionLeft),wrappRef.current.clientWidth-sliderRefLeft.current.clientWidth)
                    setSliderPositionRight(rightPos)
                    if(onChangeRight)onChangeRight((rightPos-sliderRefLeft.current.clientWidth)/(wrappRef.current.clientWidth-2*sliderRefLeft.current.clientWidth))
                }
                
            }
          
        }} style={styleWrapper} ref={wrappRef}>
            <div style={
                {position:"relative",
                left:sliderPositionLeft +"px",
                height:"inherit",backgroundColor:"red",
                width:(sliderPositionRight-sliderPositionLeft)+"px"}}>
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

export default memo(ZoneSlider,arePropsEqual)