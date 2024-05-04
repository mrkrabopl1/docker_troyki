import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Button from '../../Button'
import s from "./linkController.module.scss"


type ContentSliderType = {
    currentPosition: number,
    positions: number,
    seenPage?: number,
    callback: (page:number) => void
}


const PageController: React.FC<ContentSliderType> = (data) => {
    const { seenPage, currentPosition, positions, callback } = { ...data }
    let seenElement = seenPage ? seenPage : 3;
    let [active,setActive]  = useState<number>(currentPosition)
    useEffect(()=>{
        setActive(currentPosition)
    },[currentPosition])
    const createPage = (currentPosition: number, positions: number) => {
        let arr = [];
        let count = 1;
        while (count <= positions) {
            if (count > seenElement && count < currentPosition - 1) {
                console.debug(count, "test")
                count = currentPosition - 1
                arr.push(null)
                arr.push(count)
                count = count + 1
            } else if (count > currentPosition + 1 && count < positions - seenElement + 1) {
                count = positions - seenElement + 1
                arr.push(null)
                arr.push(count)
                count = count + 1
            } else {
                arr.push(count)
                count = count + 1
            }
        }


        let divArr: any[] = [];

        arr.forEach(val => {
            if (val === null) {
                divArr.push(<span style={{  margin:" 0 5px",textAlign:"center",width:"30px", marginTop:"auto"}} >...</span>)
            } else {
                divArr.push(<div style={{position:"relative"}} className={s.buttonStyle} onClick={()=>{
                    setActive(val)
                    callback(val)
                }}><span className={s.spanStyle} style={active===val?{color:"red"}:{}}>{val}</span></div>)
            }
        })

        return divArr
    }

    const leftFunc = ()=>{
        if(active>1){
            callback(active-1)
        }
    }

    
    const rightFunc = ()=>{
        if(active<positions){
            callback(active+1)
        }
    }

    return (
        <div  style={{ justifyContent: "center", display: "flex" }}>

            <div style={{ width:"30px",position:"relative"}}>
                <button onClick={()=>leftFunc()} className={s.paginate + " " + s.right1}><i></i><i></i></button>
             </div>

            <div style={{cursor:"pointer",margin:"auto 0", justifyContent: "center", display: "flex" }} >
                    {createPage(active, positions)}
             </div>

             <div style={{ width:"30px",position:"relative"}}>
                <button  onClick={()=>rightFunc()} className={s.paginate + " " + s.right}><i></i><i></i></button>
             </div>
        
        </div>
    )
}


export default PageController