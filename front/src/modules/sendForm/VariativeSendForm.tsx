import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import RadioGroup from 'src/components/radio/RadioGroup'

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void,
    name:string
}

const VariativeSendForm: React.FC<sendFormModuleInterface> = (props) => {

    let validationObject = useRef<any>({})

    let formData = useRef<any>({
        name: "",
        secondName: "",
        mail: "",
        address: "",
        town: "",


    })
    let [refresh, setRefresh] = useState<boolean>(false)


    let { className, name } = { ...props }

    let [showAddressForm, setShowAddressForm] = useState(false)









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
            <div>Контактные данные</div>
            <InputWithLabelWithValidation valid={!validationObject.current.mail} invalidText={"Введите адрес электронной почты."} className={className?.input} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
            <PhoneInputWithLabel invalidIncorrect={"Неверный формат"} invalidEmpty={"Введите телефон"} valid={!validationObject.current.phone} className={className?.input} onChange={(data) => { setFormData(data, "town") }} placeholder={"Телефон"} />
            <div>
                <InputWithLabelWithValidation valid={!validationObject.current.name} invalidText={"Введите имя."} className={className?.input} onChange={(data) => { setFormData(data, "name") }} placeholder={"Имя"} />
                <InputWithLabelWithValidation valid={!validationObject.current.secondName} invalidText={"Введите фамилию."} className={className?.input} onChange={(data) => { setFormData(data, "secondName") }} placeholder={"Фамилия"} />
            </div>
            <RadioGroup onChange={(index)=>{
                setShowAddressForm(!!index)
            }} name={name} lampArray={[
             "Самовывоз", "Доставка"
            ]} />

            <div>
                <div>
                    Доставка происходит по Москве и Московской области. В ином случае товар будет выслан по почте.
                </div>
                <InputWithLabelWithValidation valid={!validationObject.current.address} invalidText={"Введите адресс."} className={className?.input} onChange={() => { }} placeholder={"Адрес"} />
            <div style={{ display: "flex" }}>
                <InputWithLabelWithValidation valid={!validationObject.current.town} invalidText={"Введите город."} className={className?.input} onChange={(data) => { setFormData(data, "town") }} placeholder={"Город"} />
                {/* <Combobox className={className?.combobox} data={["test"]} placeholder={"Регион"} />
                <InputWithLabel className={className?.input} onChange={() => { }} placeholder={"Почтовый индекс"} /> */}
            </div>
            </div>
            <div style={{ display: "flex" }}>
                <Checkbox activeData={false} enable={true} onChange={() => { }} />
                <span>Сохранить эту информацию на будущее</span>
            </div>
            <div style={{ display: "flex" }}>
                <Checkbox activeData={false} enable={true} onChange={() => { }} />
                <span>Отправляйте мне SMS-сообщения о новостях и предложениях</span>
            </div>
            <Button text='Оформить заказ' onChange={() => {
                updateValidObj()
                if (Object.values(validationObject.current).length > 0) {
                    setRefresh(!refresh)
                }

            }} />

        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(VariativeSendForm, checkMemo)