import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import { useAppDispatch } from 'src/store/hooks/redux'
import { complexDropSlice } from 'src/store/reducers/complexDropSlice'
import Scroller from '../scroller/Scroller'
import global from "src/global.css"
import { ReactComponent as ArrowLeft } from "/public/arrowLeft.svg";
interface dataInterface {
    [key: string]: string[];
}
type changeType = { main?: string, sub?: string }
interface propsType {
    data: dataInterface,
    onChange: (data: changeType) => void
}

let animateDropStyle: any = {
    display: "block",
    position: "absolute",
    width: "100%",
    top: "100%",
    zIndex: 200
}


const ComplexDropVertical: React.FC<propsType> = (props) => {
    let mainRef = useRef(null)

    const inputRef = useRef<HTMLDivElement[]>([]);
    let dispatch = useAppDispatch()
    let { data, onChange } = { ...props }

    let leftPos = useRef<number>(0)

    let [showDrop, setShowDrop] = useState<boolean>(false)

    let timeoutRef = useRef<any>(null)
    let chosen = useRef<string>("")
    const { setName, clear } = { ...complexDropSlice.actions }
    // useEffect(()=>{
    //     if(chosen){

    //     }

    // },[chosen])
    const createCont = () => {
        let arr: any = []

        Object.keys(data).forEach((val, indx) => {
            arr.push(
                <div
                    onClick={() => {
                        leftPos.current = inputRef.current[indx].offsetLeft
                        chosen.current = val
                        setShowDrop(true)
                        //onChange({main:val})
                    }}
                    ref={el => inputRef.current[indx] = el}
                    className={s.mainElem}
                    // onMouseLeave={() => {
                    //     chosen.current = val
                    //     timeoutRef.current = setTimeout(() => { setShowDrop(false) }, 100)
                    // }}
                    onMouseEnter={() => {
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                        }
                        // leftPos.current = inputRef.current[indx].offsetLeft
                        // chosen.current = val
                        // setShowDrop(true)
                    }}>
                    {val}
                </div>
            )
        })
        return arr
    }

    const createDropContent = () => {
        if (chosen.current) {
            let arr: any = []
            let dropData = data[chosen.current]
            if (dropData.length > 0) {
                dropData.forEach((val) => {
                    arr.push(<div onClick={() => { onChange({ sub: val }) }} >{val}</div>)
                })
                // setShowDrop(true)
            } else {
                // setShowDrop(false)
            }
            return arr
        }

    }

    const creaeteStyle = () => {
        let showStyle = showDrop ? s.show : s.hide
        return s.dropFieldVertical + " " + showStyle
    }

    return (
        <div onWheel={(e)=>{
            e.preventDefault()
        }} ref={mainRef} className={s.complexDropVertical} >
            <Scroller className={s.scrollStyle}>
                <div >
                    {createCont()}
                </div>
            </Scroller>


            <div
                onMouseEnter={() => { clearTimeout(timeoutRef.current) }}
                onMouseLeave={() => { setShowDrop(false) }}
                className={creaeteStyle()} >
                <Scroller className={s.scrollStyle}>
                    <div onClick={()=>{
                        setShowDrop(false)
                    }} className={"flex " + s.backPointer}> <ArrowLeft fill="gray"/>{chosen.current}</div>
                    <div >
                        {createDropContent()}
                    </div>
                </Scroller>
            </div>

        </div>
    )
}


export default ComplexDropVertical

function setNameComplexDrop(arg0: string): any {
    throw new Error('Function not implemented.')
}
