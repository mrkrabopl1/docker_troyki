import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Slider from 'src/components/slider/Slider'
import NumInput from 'src/components/NumInput'


type SliderSetterType = {
    max:number,
    min:number,
    data?:number
}

const  SimpleSliderValueSetter: React.FC<SliderSetterType> = ({data,max,min}) => {


    let [sliderPosition,setSliderPosition] = useState(0)
    
    let val 
    if(data && data>min && data<=max){
        val = data
    }else{
        val = min
    }

    let [numData,changeNumData] = useState<number>(val)

    let sliderStyle:any = {
        position:"absolute",
        left:sliderPosition+"px",
        width:"10px",
        height:"10px",
        backgroundColor:"green",
        top:0,
        bottom:0,
        margin:"auto"
    }


    const convertSliderData = (data:number)=>{
        changeNumData(data*max)
    }
   
    return(
        <div>
            <Slider data={data?data/max:0} callback={convertSliderData}/>
            <NumInput data={numData} callback={changeNumData}/>
        </div>
    )
}


export default SimpleSliderValueSetter