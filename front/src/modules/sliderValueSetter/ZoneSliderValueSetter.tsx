import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Slider from 'src/components/slider/Slider'
import NumInput from 'src/components/NumInput'
import ZoneSliderSimple from 'src/components/slider/ZoneSliderSimple'
import s from './style.module.css'

type ZoneSliderSetterType = {
    max: number,
    min: number,
    dataLeft?: number,
    dataRight?: number,
    onChange?:(arg:any)=>void
}


let styleWrapper: any = {
    position: "relative",
    height: "40px",
    left: "100px"
}




const ZoneSliderValueSetter: React.FC<ZoneSliderSetterType> = ({onChange, max, min, dataRight, dataLeft }) => {
    let memoSlider = useRef<boolean>(true)

    let wrappRef = useRef<HTMLDivElement>(null)
    let sliderRef = useRef(null)
    let [sliderPosition, setSliderPosition] = useState(0)
    let trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    let [refresh, setRefresh] = useState<boolean>(true)
    useEffect(()=>{
       memoSlider.current = !memoSlider.current;
       numDataLeft.current = dataLeft?dataLeft:min
       numDataRight.current = dataRight?dataRight:max
       setRefresh(!refresh)
    },[min,max,dataRight, dataLeft])
    let active = useRef(refresh)
    let numDataLeft = useRef<number>(dataLeft?dataLeft:min)
    let numDataRight = useRef<number>(dataRight?dataRight:max)

    active.current = refresh

    useEffect(() => {
        if (dataRight && dataRight <= max && dataRight >= min) {
            if (dataLeft) {
                if (dataRight > dataLeft) {
                    numDataRight.current = dataRight;
                }
            } else {
                numDataRight.current = dataRight;
            }
        }
        if (dataLeft && dataLeft <= max && dataLeft >= min) {
            if (dataRight) {
                if (dataRight > dataLeft) {
                    numDataLeft.current = dataLeft;
                }
            } else {
                numDataLeft.current = dataLeft;
            }
        }
        setRefresh(!refresh);
    },[])

    

    let sliderStyle: any = {
        position: "absolute",
        left: sliderPosition + "px",
        width: "10px",
        height: "10px",
        backgroundColor: "green",
        top: 0,
        bottom: 0,
        margin: "auto"
    }

    const convertSliderPos = (sliderPosLeft:number,sliderPosRight:number) => {
        numDataLeft.current =(min + (max-min)*sliderPosLeft)
        numDataRight.current= (min + (max-min)*sliderPosRight)
        refresh = !refresh
        setRefresh(refresh)
        if (trottlingTimerId.current) {
            clearTimeout(trottlingTimerId.current);
        }
        trottlingTimerId.current = setTimeout(() => {
            onChange && onChange([ numDataLeft.current, numDataRight.current])
        }, 500)
    }
   

    const changeLeftData=(data:number)=>{
            if(data>numDataRight.current||data<min){
                
            }else{
                memoSlider.current = !memoSlider.current;
                numDataLeft.current = data;
                setRefresh(!refresh)
                if(onChange){
                    onChange([data,numDataRight.current])
                }
            }
    }

    const changeRightData=(data:number)=>{
        if(data<numDataLeft.current||data>max){
            
        }else{
            memoSlider.current = !memoSlider.current;
            numDataRight.current = data;
            setRefresh(!refresh)
            if(onChange){
                onChange([numDataLeft.current,data])
            }
        }
}

    return (
        <div>
            <ZoneSliderSimple memo={memoSlider.current} onChange={(min,max)=>{convertSliderPos(min,max)}}  min={(numDataLeft.current-min) /(max-min)} max={(numDataRight.current-min) /(max-min)} />
            <div style={{ display: "flex",width:"100%" }}>
                <NumInput className={s.numInput} data={numDataLeft.current} callback={changeLeftData} />
                <span>-</span>
                <NumInput className={s.numInput} data={numDataRight.current} callback={changeRightData} />
            </div>
        </div>
    )
}


export default ZoneSliderValueSetter