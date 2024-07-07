import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithValidation from "src/components/input/PhoneInputWithValidation"
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import { verified } from 'src/store/reducers/menuSlice'
import Modal from 'src/components/modal/Modal'
import DeliveryInfo from '../deliveryInfo/DeliveryInfo'
import ChangePsswordForm from './ChangePsswordForm'

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}

const UserForm: React.FC<sendFormModuleInterface> = (props) => {

    let validationObject = useRef<any>({})

    let formData = useRef<any>({
        name: "",
        secondName: "",
        mail: "",
        address: "",
        phone: "",
    })
    let [refresh, setRefresh] = useState<boolean>(false)
    let [passForm, setPassForm] = useState<boolean>(false)

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
            <div style={{display:"flex"}}>
                <InputWithLabel className={className?.input} onChange={(data) => { setFormData(data, "name") }} placeholder={"Имя"} />
                <InputWithLabel className={className?.input} onChange={(data) => { setFormData(data, "secondname") }} placeholder={"Фамилия"} />
            </div>
            <MailInputWithValidation valid={!validationObject.current.mail} invalidText={"Введите адрес электронной почты."} className={className?.input} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
            <PhoneInputWithValidation invalidIncorrect={"Неверный формат"} invalidEmpty={"Введите телефон"} valid={!validationObject.current.phone} className={className?.input} onChange={(data) => { setFormData(data, "phone") }} placeholder={"Телефон"} />
            <Button className={s.buttonConf} text='Изменить пароль' onChange={() => {
                setPassForm(true)
            }} />
            <Button className={s.buttonConf} text='Сохранить изменения' onChange={() => {

            }} />
            {passForm?<Modal onChange={()=>{
                setPassForm(false)
            }} active={true}>
                <div className={s.modal}>
                    <ChangePsswordForm onChange={()=>{}}/>
                </div>
            </Modal>:null}
        </div>
    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(UserForm, checkMemo)