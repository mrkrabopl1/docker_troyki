import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'
import DropWrapper from 'src/components/dropWrapper/DropWrapper'
import DynamicForm from 'src/components/dynamicForm/DynamicForm'
import { useAppDispatch } from 'src/store/hooks/redux'
import { secondDropSlice } from 'src/store/reducers/secondDropSlice'
import DynamicElement from "src/components/dynamicElement/DynamicElement"
import Button from "src/components/Button"
import s from './style.module.css'
type propsRowType = {
    propsData: any,
    componentName: string,
}

interface settingModuleInterface {
    filters: [{
        name: string,
        componentInfo: { componentName: string, propsData: any }
    }],
    memo?: boolean,
    onChange?: (arg: any) => void
    classNames?: {
        secondPage?: string
        mainForm?: string
    }
}
const SettingsModuleOld: React.FC<settingModuleInterface> = (props) => {
    let { filters, onChange, classNames } = { ...props }
    let currentName = useRef<string>("")
    let currentIndex = useRef<number>(0)


    let dispatch = useAppDispatch()


    let [secondElemName, setSecondElemName] = useState<propsRowType>({
        propsData: {},
        componentName: "none",
    })
    const { show } = { ...secondDropSlice.actions }
    const onChangeData = (index: number, data: any) => {
        currentIndex.current = index
        dispatch(show(true))
        currentName.current = data.name
        setSecondElemName(data.secondComponentInfo)
    }

    const onChangeMain = (data: any) => {
        currentName.current
        let obj = {
            name: currentName.current,
            data: data
        }
        onChange && onChange(obj)
    }


    const onChangeForm = (data: any) => {
        onChange && onChange(data)
    }
    for (let i = 0; i < filters.length; i++) {
        if (!filters[i].componentInfo) {
            filters[i].componentInfo = { componentName: "components/Button", propsData: { className: s.buttonStyle, text: "", "onChange": () => onChangeData(i, filters[i]) } }
        }
    }

    const onClose = () => {
        dispatch(show(false))

    }
    // [{name:"das",componentInfo:{componentName:"components/Button",propsData:{className:s.buttonStyle,text:"","onClick":onChange.bind(this,0)}}},{name:"das",componentInfo:{componentName:"components/Button",propsData:{className:s.buttonStyle,text:"","onClick":onChange.bind(this,1)}}}]
    return (

        <div className={s.wrapper}>
            {<DropWrapper id={"settingsDrop"}>
                {<DynamicForm onChange={useCallback(onChangeForm, [])} form={filters} />}
                {<div className={classNames?.secondPage}>
                    <DynamicElement onChange={onChangeMain} {...secondElemName} />
                    <Button text={"принять"} onChange={onClose}></Button>
                </div>}
            </DropWrapper>}
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(SettingsModuleOld, checkMemo)