import React, { ReactElement, useMemo, useEffect, useRef, useState, memo } from 'react'
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


    const createContent = useMemo(()=>{
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
            {createContent}
        </div>

    )
}


export default memo(DataField)