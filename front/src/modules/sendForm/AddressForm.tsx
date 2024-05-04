import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}


const AddressForm: React.FC<sendFormModuleInterface> = (props) => {
    let validationObject = useRef<any>({})

    let formData = useRef<any>({
        name: "",
        secondName: "",
        mail: "",
        address: "",
        town: "",


    })
    let [refresh, setRefresh] = useState<boolean>(false)


    let { className } = { ...props }


    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
    }

    const updateValidObj = () => {
        let entries = Object.entries(formData.current)
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

        <div className={s.wrapper}>
                <InputWithLabelWithValidation valid={!validationObject.current.town} invalidText={"Введите населенный пункт."} className={className?.input} onChange={(data) => { setFormData(data, "town") }} placeholder={"Город"} />
                
                

        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(AddressForm, checkMemo)