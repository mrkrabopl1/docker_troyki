import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"


type DataFieldType = {
    header: string;
    data:{caption:string,description:string}[],
    className?:{
        header?:string,
        main?:string
    }
};

const DataField: React.FC<DataFieldType> = (props) => {
    let {header, data, className} = {...props}


    const createContent = useCallback(()=>{
        let arr = []
       data.forEach((el)=>{
        if(el.description){
            arr.push( <p>{el.caption}:{el.description}</p>)
        }
        })
        return arr
    },[data])

    return (
        <div className={className?.main|| s.main}>
            <div className={className?.header|| s.header}>{header}</div>
            {createContent()}
        </div>

    )
}


export default DataField