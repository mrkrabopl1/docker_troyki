import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'
import DynamicElement from "src/components/dynamicElement/DynamicElement"
import s from './style.module.css'
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop'
import CheckBoxColumn from 'src/components/checkBoxForm/CheckBoxForm'
import ZoneSliderValueSetter from 'src/modules/sliderValueSetter/ZoneSliderValueSetter'
type propsRowType = {
    propsData: any,
    componentName: string,
}

interface settingModuleInterface {
    priceProps: {
        max: number,
        min: number,
        dataLeft?: number,
        dataRight?: number,
        onChange?: (arg: any) => void
    },
    checboxsProps: {
        name: string,
        props: any
    }[],
    memo?: boolean,
    onChange?: (arg: any) => void
    classNames?: {
        secondPage?: string
        mainForm?: string
    }
}

type dataType = { price: number[], sizes: number[] }
const SnickersSettings: React.FC<settingModuleInterface> = (props) => {
    let { priceProps, onChange, classNames, checboxsProps } = { ...props }



    const onChangeMain = (name: string, data: any) => {

        let obj = {
            name: name,
            data: data
        }
        onChange && onChange(obj)
    }

    console.debug(priceProps)

    return (
        <div className={s.wrapper}>
            {React.createElement(DoubleInfoDrop, {info:"price"},  <ZoneSliderValueSetter onChange={(data) => { onChange({ name: "price", data: data }) }} {...priceProps} />)}
            {/* <DoubleInfoDrop info={"price"}>
                <ZoneSliderValueSetter onChange={(data) => { onChange({ name: "price", data: data }) }} {...priceProps} />
            </DoubleInfoDrop> */}
            {checboxsProps.map((el) => {
                return <DoubleInfoDrop info={el.name}>
                    <CheckBoxColumn onChange={(data) => { onChange({ name: el.name, data: data }) }} data={el.props} />
                </DoubleInfoDrop>
            })}
        </div>

    )
}


function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(SnickersSettings, checkMemo)