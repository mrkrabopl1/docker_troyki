import React, { ReactElement, useRef,useEffect, useState } from 'react'
import DropWrapper from "../dropWrapper/DropWrapper"
import s from "./style.module.css"
import {useAppDispatch } from 'src/store/hooks/redux'
import secondDropSlice from "src/store/reducers/secondDropSlice"
import { useAppSelector } from 'src/store/hooks/redux'
import DinamicElement  from "src/components/dynamicElement/DynamicElement"


interface elementDynamic {
        name:string,
        componentInfo:{componentName:string,propsData:any}
}

type dynamicFormType = {
        form:elementDynamic[],
        onChange?:(arg:any)=>void
}



const DynamicForm: React.FC<dynamicFormType> = (props) => {
    let {form,onChange} = {...props}
    let dispatch = useAppDispatch()
    const onChangeData=(name:string,data:any)=>{
        let obj = {
            name:name,
            data:data
        }
        if(onChange){
            onChange(obj)
        }
    }

    return (
        <div  >
            {form.map((val)=>{
                return(<div>
                    <p>
                        {val.name}
                    </p>
                    {<DinamicElement onChange={onChangeData.bind(null,val.name)} {...val.componentInfo}/>}
                </div>)
            })}
        </div>
    )
}

export default DynamicForm