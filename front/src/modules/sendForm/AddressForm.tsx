import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import  "src/global.css"
import { extend } from 'src/global'

interface addressFormModuleInterface {
    memo?:boolean
    valid:boolean,
    onChange: (data: any) => void,
    className:{
        input?:string
    },
    formValue?:{
        town:string,
        region:string,
        index:string,
        street:string,
        house?:string,
        flat?:string,
    }
}


const AddressForm: React.FC<addressFormModuleInterface> = (props) => {
    let {onChange,valid, className,formValue} = {...props}
    let validationObject = useRef<any>({})
    let validFlag = useRef<boolean>(false)
    let validationForm = useRef<any>({
        town: "",
        region:"",
        index:"",
        street:""
    })

    let unmandatoryData = useRef<any>({
        house:"",
        flat:""
    })

    if(formValue){
        extend(validationForm.current, formValue)
        extend(unmandatoryData.current, formValue)
    }

    const setUnmandatoryDataData = (data: string, name: string) => {
        unmandatoryData.current[name] = data
        if( Object.keys(validationObject.current).length === 0){
            let copyObj:Object = Object.assign({},validationForm.current)
            Object.assign(copyObj,validationForm.current)
            onChange(Object.assign(copyObj,unmandatoryData.current))
            validFlag.current = true
        }
    }

    const firstUpdate = useRef(true);
    let [refresh, setRefresh] = useState<boolean>(false)
    const setFormData = (data: string, name: string) => {
        validationForm.current[name] = data
        updateValidObj();
        if( Object.keys(validationObject.current).length === 0){
            let copyObj:Object = Object.assign({},validationForm.current)
            Object.assign(copyObj,validationForm.current)
            onChange(Object.assign(copyObj,unmandatoryData.current))
            validFlag.current = true
        }else{
            if(validFlag.current){
                onChange(null)
                validFlag.current = false
            }
        }
    }
    useEffect(()=>{
        if (!firstUpdate.current) {
            updateValidObj()
            setRefresh(prev=>!prev)
        }
        firstUpdate.current = false
    },[valid])
    const updateValidObj = () => {
        let entries = Object.entries(validationForm.current)
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][1] == "") {
                validationObject.current[entries[i][0]] = true
            } else {
                if (validationObject.current[entries[i][0]]) {
                    delete validationObject.current[entries[i][0]]
                }
            }
        }
    }
    return (

        <div>
            <div className="flex">
                <InputWithLabelWithValidation
                    val={validationForm.current.town}
                    valid={!validationObject.current.town}
                    invalidText={"Введите город."}
                    className={className?.input}
                    onChange={(data) => { setFormData(data, "town") }}
                    placeholder={"Город"} />
                <InputWithLabelWithValidation
                    val={validationForm.current.region}
                    valid={!validationObject.current.region}
                    invalidText={"Введите регион"}
                    className={className?.input}
                    onChange={(data) => { setFormData(data, "region") }}
                    placeholder={"Регион"} />
                <InputWithLabelWithValidation
                    val={validationForm.current.index}
                    valid={!validationObject.current.index}
                    invalidText={"Введите почтовый индекс."}
                    className={className?.input}
                    onChange={(data) => { setFormData(data, "index") }}
                    placeholder={"Почтовый индекс"} />
            </div>
            <div className='flex'>
                <InputWithLabelWithValidation
                    val={validationForm.current.street}
                    valid={!validationObject.current.street}
                    invalidText={"Введите улицу."}
                    className={className?.input}
                    onChange={(data) => { setFormData(data, "street") }}
                    placeholder={"Улица"} />
                <InputWithLabel
                    val={unmandatoryData.current.house}
                    className={className?.input}
                    onChange={(data) => { setUnmandatoryDataData(data, "house") }}
                    placeholder={"Дом"} />
                <InputWithLabel
                    val={unmandatoryData.current.flat}
                    className={className?.input}
                    onChange={(data) => { setUnmandatoryDataData(data, "flat") }}
                    placeholder={"Квартира"} />
            </div>
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.valid === newData.valid && oldData.memo === newData.memo)
}
export default memo(AddressForm, checkMemo)