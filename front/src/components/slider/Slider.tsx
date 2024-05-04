import React, { ReactElement, useEffect, useRef, useState } from 'react'


type sliderType = {
    callback?:(...args:any)=>void|null
    data:number
}


let styleWrapper:any = {
     position:"relative",
     height:"40px",
     margin:"10px"
}




const  Slider: React.FC<sliderType> = ({callback,data}) => {
    
    let wrappRef = useRef<HTMLDivElement>(null)
    let sliderRef = useRef(null)
    let active = useRef(false)
    useEffect(()=>{
        if( wrappRef.current){
            if(sliderRef.current && data>=0 && data<=1){
                setSliderPosition(wrappRef.current.clientWidth*data)
            }
        }
      
        
    },[])
    let [sliderPosition,setSliderPosition] = useState(0)
    

    let sliderStyle:any = {
        position:"absolute",
        left:(sliderPosition - 5) +"px",
        width:"10px",
        height:"10px",
        backgroundColor:"green",
        top:0,
        bottom:0,
        margin:"auto"
    }
   
    return(
        <div
        onMouseLeave={()=>{
            active.current = false
        }}

        onMouseUp={(e)=>{
            active.current = false
        }}
        onMouseMove={(e)=>{
            if(wrappRef.current && active.current){
                let pos = Math.min(Math.max(e.clientX-wrappRef.current.offsetLeft,0),wrappRef.current.clientWidth)
                setSliderPosition(pos)
                if(callback)callback(pos/wrappRef.current.clientWidth)
            }
          
        }} style={styleWrapper} ref={wrappRef}>
            <div style={{height:"inherit",backgroundColor:"red",width:sliderPosition+"px"}}></div>
            <div onMouseDown={()=>{
                active.current = true
            }} ref={sliderRef} style={sliderStyle}></div>
        </div>
    )
}


export default Slider