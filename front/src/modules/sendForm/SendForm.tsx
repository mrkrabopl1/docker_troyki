import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import DeliveryInfo from '../deliveryInfo/DeliveryInfo'

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}

const SendForm: React.FC<sendFormModuleInterface> = (props) => {

    let validationObject = useRef<any>({})

    let formData = useRef<any>({
        name: "",
        secondName: "",
        mail: "",
        address: "",
        phone: "",
    })
    let [refresh, setRefresh] = useState<boolean>(false)


    let { className, onChange } = { ...props }


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
            <div>Контактная информация</div>
            <InputWithLabelWithValidation valid={!validationObject.current.mail} invalidText={"Введите адрес электронной почты."} className={className?.input} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
            <Checkbox activeData={false} enable={true} onChange={() => { }} />
            <div>
                <InputWithLabelWithValidation valid={!validationObject.current.name} invalidText={"Введите имя."} className={className?.input} onChange={(data) => { setFormData(data, "name") }} placeholder={"Имя"} />
                <InputWithLabelWithValidation valid={!validationObject.current.secondName} invalidText={"Введите фамилию."} className={className?.input} onChange={(data) => { setFormData(data, "secondName") }} placeholder={"Фамилия"} />
            </div>
            <InputWithLabelWithValidation valid={!validationObject.current.address} invalidText={"Введите адресс."} className={className?.input} onChange={(data) => { setFormData(data, "address") }} placeholder={"Адрес"} />
            <PhoneInputWithLabel invalidIncorrect={"Неверный формат"} invalidEmpty={"Введите телефон"} valid={!validationObject.current.phone} className={className?.input} onChange={(data) => { setFormData(data, "phone") }} placeholder={"Телефон"} />
            <div style={{ display: "flex" }}>
                <Checkbox activeData={false} enable={true} onChange={() => { }} />
                <span>Сохранить эту информацию на будущее</span>
            </div>
            <div style={{ display: "flex" }}>
                <Checkbox activeData={false} enable={true} onChange={() => { }} />
                <span>Отправляйте мне SMS-сообщения о новостях и предложениях</span>
            </div>
            {/* <DeliveryInfo/> */}
            <Button text='Оформить заказ' onChange={() => {
                updateValidObj()
                if (Object.values(validationObject.current).length > 0) {
                    setRefresh(!refresh)
                }else{
                    onChange(formData.current)
                }

            }} />

        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(SendForm, checkMemo)