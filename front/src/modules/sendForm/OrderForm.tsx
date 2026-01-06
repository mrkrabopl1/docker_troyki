import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import PasswordInput from 'src/components/input/PasswordInput'
import InputWithValidation from 'src/components/input/InputWithLabelWithValidation'
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import { changeUserPass } from 'src/providers/userProvider'

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}


const OrderForm: React.FC<sendFormModuleInterface> = (props) => {
    let { onChange } = { ...props }
    let validationObject = useRef<any>({})
    let formData = useRef<any>({
        mail: "",
        orderId: ""
    })
    let [refresh, setRefresh] = useState<boolean>(false)
    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
    }
    const updateValidObj = () => {
        let entries = Object.entries(formData.current)
        for (let i = 0; i < entries.length; i++) {
            if (!entries[i][1]) {
                validationObject.current[entries[i][0]] = true
            } else {
                if (validationObject.current[entries[i][0]]) {
                    delete validationObject.current[entries[i][0]]
                }
            }
        }
    }
    return (

        <div onClick={(e) => { e.stopPropagation() }} className={s.wrapper}>
            <InputWithValidation val={formData.current.name} valid={!validationObject.current.name} invalidText={"Введите имя."} onChange={(data) => { setFormData(data, "orderId") }} placeholder={"Номер заказа"} />
            <MailInputWithValidation value={""} valid={!validationObject.current.mail} invalidText={"Пустое поле ввода"} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
            <Button className={s.formButton} text='Получит данныые заказа' onClick={() => {
                if (Object.values(validationObject.current).length > 0) {
                    setRefresh(!refresh)
                } else {
                    onChange(formData.current)
                }
            }}></Button>
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(OrderForm, checkMemo)