import React, { useRef, useState,memo, useEffect } from "react"

import { rootTransform, squareTransform, lineTransform, cubeTransform } from "src/functions/mathFunctions"

const defaultWrapStyle: any = {
    width: "50px",
    height: "30px",
    border: "solid 2px white",
    position: "relative"
}


let prev = performance.now();
let times = 0;


function animate(timing: (data: number) => number, draw: (data: number) => void, duration: number) {

    let start = performance.now();

    requestAnimationFrame(function animate(time) {
        // timeFraction изменяется от 0 до 1
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;

        // вычисление текущего состояния анимации
        let progress = timing(timeFraction);

        draw(progress); // отрисовать её

        if (timeFraction < 1) {
            requestAnimationFrame(animate);
        }

    });
}


const defaultBlockStyle: any = {
    position: "absolute",
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "white",
}

const defaultLoadStyle: any = {
    position: "absolute",
    width: "100%",
    margin: "auto",
    height: "20px",
    borderRadius: "10px",
    backgroundColor: "black",
    top: 0, left: 0, bottom: 0, right: 0,

}
type switchertType = {
    onChange?:(arg:any)=>void,
    data:boolean
}

const LineSwitcher: React.FC<switchertType> = (props) => {

    let {onChange,data} = {...props}

    const moveCheckbox = (k: number) => {
        if (checkBox.current && checkBoxWrap.current && loadLine.current) {
            let mainWidth = checkBoxWrap.current.clientWidth + 1
            let checkBoxWidth = checkBox.current.clientWidth + 1
            let diff = mainWidth - checkBoxWidth
            if (!position) {
                loadLine.current.style.background = `linear-gradient(to right, white ${checkBoxWidth * k}px, black ${checkBoxWidth * k}px)`;
                checkBox.current.style.left = diff * k + "px"
                checkBox.current.style.background = `linear-gradient(to left, black ${mainWidth * k}px, white ${mainWidth * k}px)`
                checkBox.current.style.border = " solid white 2px"

            } else {
                loadLine.current.style.background = `linear-gradient(to  left, black ${mainWidth * k}px,white ${mainWidth * k}px)`;
                checkBox.current.style.left = diff - diff * k + "px"
                checkBox.current.style.background = `linear-gradient(to right, white ${checkBoxWidth * k}px, black ${checkBoxWidth * k}px)`;
                checkBox.current.style.border = " solid black 2px"
            }
        }

    }

    let [position, setPosition] = useState<boolean>(false)

    useEffect(()=>{
        setPosition(data)
    },[])

    let checkBox = useRef<HTMLDivElement>(null)
    let loadLine = useRef<HTMLDivElement>(null)
    let checkBoxWrap = useRef<HTMLDivElement>(null)


    return (
        <div ref={checkBoxWrap} style={defaultWrapStyle}>
            <div ref={loadLine} style={defaultLoadStyle}></div>
            <div ref={checkBox} onClick={() => {
                setPosition(!position)
                if(onChange){
                    onChange(!position)
                }
                animate(rootTransform, moveCheckbox, 500)
            }} style={defaultBlockStyle}></div>
        </div>
    )
}

function checkData(oldProps:any,startProps:any){
    console.debug(oldProps)
    return (oldProps.data == startProps.data)
}

export default memo(LineSwitcher,checkData)