import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithValidation from "src/components/input/PhoneInputWithValidation"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import { verified } from 'src/store/reducers/menuSlice'
import DeliveryInfo from '../deliveryInfo/DeliveryInfo'
import AddressForm from './AddressForm'
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import { extend } from 'src/global'


interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void,
    onValid?:(data: any) => void,
    valid: boolean,
    formValue?: {
        name: string,
        secondname?: string,
        mail:string,
        address: {
            town: string,
            region: string,
            index: string,
            street: string,
            house?: string,
            flat?: string,
        },
        phone: string
    },
    memo:boolean
}

const SendForm: React.FC<sendFormModuleInterface> = (props) => {


    let addressFormMemo = useRef<boolean>(true)
    let validationObject = useRef<any>({})
    const firstUpdate = useRef(true);
    let formData = useRef<any>({
        name: "",
        mail: "",
        address: null,
        phone: ""
    })

    let unvalidFormData = useRef<any>({
        secondName: ""
    })

    let saveData = useRef<boolean>(false)
    let [refresh, setRefresh] = useState<boolean>(false)

    let invalidMailText = useRef<string>("Пустое поле ввода")
    let { className, onChange, valid, formValue,memo,onValid } = { ...props }

    useEffect(()=>{
        addressFormMemo.current = !addressFormMemo.current
        extend(formData.current, formValue)
        extend(unvalidFormData.current, formValue)
        setRefresh(prev=>!prev)
    },[])

    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
        updateValidObj();  
        const finalObj = { ...formData.current }
        finalObj["save"] = saveData.current
        onChange(finalObj)
    }
    useEffect(() => {
        if (!firstUpdate.current) {
            updateValidObj()
            setRefresh(prev=>!prev)
        }
        firstUpdate.current = false
    }, [])
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
        let valid = !(Object.values(validationObject.current).length > 0)
        onValid(valid)
    }

    return (

        <div className={s.wrapper}>
            <div>Контактная информация</div>
            <MailInputWithValidation val={formData.current.mail} valid={!validationObject.current.mail} invalidText={invalidMailText.current} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
            <div className='flex pdn'>
                <div style={{ marginTop: "auto", marginBottom: "auto", paddingRight: "5px" }}>
                    <Checkbox activeData={false} enable={true} onChange={() => { }} />
                </div>
                <div>Отправляйте мне новости и предложения</div>
            </div>
            <div className='flex'>
                <InputWithLabelWithValidation val={formData.current.name} valid={!validationObject.current.name} invalidText={"Введите имя."} className={className?.input} onChange={(data) => { setFormData(data, "name") }} placeholder={"Имя"} />
                <InputWithLabel val={unvalidFormData.current.secondName} className={className?.input} onChange={(data) => { setFormData(data, "secondName") }} placeholder={"Фамилия"} />
            </div>
            <AddressForm memo={addressFormMemo.current} formValue={formData.current.address} className={{}} valid={!validationObject.current.address} onChange={(data) => { setFormData(data, "address") }} />
            <PhoneInputWithValidation val={formData.current.phone} invalidIncorrect={"Неверный формат"} invalidEmpty={"Введите телефон"} valid={!validationObject.current.phone} className={className?.input} onChange={(data) => { setFormData(data, "phone") }} placeholder={"Телефон"} />
            {verified ? <div className='flex pdn'>
                <div style={{ marginTop: "auto", marginBottom: "auto", paddingRight: "5px" }}>
                    <Checkbox activeData={false} enable={true} onChange={(data) => {
                        saveData.current = data
                    }} />
                </div>
                <span>Сохранить эту информацию на будущее</span>
            </div> : null}
            {/* <div style={{ display: "flex" }}>
                <Checkbox activeData={false} enable={true} onChange={() => { }} />
                <span>Отправляйте мне SMS-сообщения о новостях и предложениях</span>
            </div> */}
            {/* <DeliveryInfo/> */}

        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(SendForm, checkMemo)