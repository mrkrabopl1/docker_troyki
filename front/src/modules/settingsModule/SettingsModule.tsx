import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'
import DynamicElement from "src/components/dynamicElement/DynamicElement"
import s from './style.module.css'
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop'
type propsRowType = {
    propsData: any,
    componentName: string,
}

interface settingModuleInterface {
    filters: [{
        name: string,
        component: ReactElement
    }],
    memo?: boolean,
    onChange?: (arg: any) => void
    classNames?: {
        secondPage?: string
        mainForm?: string
    }
}

type dataType = { price: number[], sizes: number[] }
const SettingsModule: React.FC<settingModuleInterface> = (props) => {
    let { filters, onChange, classNames } = { ...props }



    const onChangeMain = (name:string,data: any) => {
       
        let obj = {
            name: name,
            data: data
        }
        onChange && onChange(obj)
    }

    return (

        <div className={s.wrapper}>

                {filters.map((el)=>{
                     return <DoubleInfoDrop info = {el.name}>{el.component}</DoubleInfoDrop>
                    // return <DoubleInfoDrop info = {el.name}><DynamicElement onChange={onChangeMain.bind(null, el.name)} {...el.componentInfo} /></DoubleInfoDrop>
                })}
        </div>

    )
}


function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(SettingsModule, checkMemo)