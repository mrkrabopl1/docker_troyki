import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithValidation from "src/components/input/PhoneInputWithValidation"
import s from './style.module.css'
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import { extend } from 'src/global'
import EmailPhoneInput from 'src/components/input/EmailPhoneInput'


interface ContactFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void,
    onValid?: (data: any) => void,
    valid: boolean,
    formValue?: {
        name: string,
        mail: string,
        phone: string
    },
    memo: boolean
}

const ContactForm: React.FC<ContactFormModuleInterface> = (props) => {
    let validRef = useRef<any>(false)
    const firstUpdate = useRef(true);
    let formData = useRef<any>({
        name: "",
        mail: "",
        phone: ""
    })

    let unvalidFormData = useRef<any>({
        secondName: ""
    })


    let [refresh, setRefresh] = useState<boolean>(false)
    let contactRef = useRef<boolean>(false)

    let { className, onChange, valid, formValue, memo, onValid } = { ...props }


    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
        validate()
        if (validRef.current) {
            const finalObj = { ...formData.current }
            onChange(finalObj)
        }
    }

    const validate = () => {
        if (validRef.current !== (contactRef.current && !!formData.current.name)) {
            validRef.current = contactRef.current && !!formData.current.name
            onValid(contactRef.current && !!formData.current.name)
        }
    }

    useEffect(() => {
        if (!firstUpdate.current) {
            validate()
            setRefresh(prev => !prev)
        }
        firstUpdate.current = false
    }, [memo])

    return (

        <div className={s.wrapper}>
            <div>Контактная информация</div>
            <InputWithLabelWithValidation
                val={formData.current.name}
                valid={firstUpdate.current?true:!!formData.current.name}
                invalidText={"Введите ваше имя для связи с вами."}
                className={className?.input}
                onChange={(data) => { setFormData(data, "name") }}
                placeholder={"Имя"} />
            <EmailPhoneInput
                valid={firstUpdate.current?true:contactRef.current}
                invalidText='Введите корректный email или телефон'
                className={s.formInput}
                onValid={(valid) => {
                    contactRef.current = valid;
                    validate()
                }}
                placeholder='Введите email или телефон'
                onChange={(data) => {
                    if (data.type === "phone") {
                        setFormData(data.value, "phone")
                    } else {
                        setFormData(data.value, "mail")
                    }

                }} />
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(ContactForm, checkMemo)