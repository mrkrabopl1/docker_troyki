import React, { ReactElement, useRef, useState } from 'react'

type propsRowType = {
    callback:(...args:any)=>void|null,
    data:number,
    className?:string
}


const NumInput: React.FC<propsRowType> = (props) => {
    let {data,callback,className} = {...props}
    return (
        <input className={className?className:""} value={data} type='number' onChange={(e)=>{if(callback){callback(Number(e.target.value))}}}/>
    )
}

export default NumInput