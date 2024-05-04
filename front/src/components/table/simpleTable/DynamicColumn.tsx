import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
import ColumnHeader from './ColumnHeader'

import DinamicElement  from "src/components/dynamicElement/DynamicElement"


interface elementDynamic {
        name:string,
        componentInfo:{componentName:string,propsData:any}
}

type columnType = {
        form:elementDynamic[],
        onChange?:(arg:any)=>void
}




const DynamicColumn: React.FC<columnType> = (props) => {

    
    let { form, children,onChange} = { ...props }
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
        <div className={s.priceBlock} >

            <ColumnHeader>
                {children}
            </ColumnHeader>
            {form.map((val, id) => {
                return  <DinamicElement onChange={onChangeData.bind(null,val.name)} {...val.componentInfo}/>
            })}

        </div>

    )
}

export default DynamicColumn