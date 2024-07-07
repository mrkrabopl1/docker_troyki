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
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation'
import { changeUserPass } from 'src/providers/userProvider'

interface sendFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}


const ChangePasswordForm: React.FC<sendFormModuleInterface> = (props) => {
    let validation = useRef<boolean>(true)
    let validationOld = useRef<boolean>(true)
    let invalidOldPassText = useRef<string>("Пароли не совпадают")
    let [refresh, setRefresh] = useState<boolean>(false)


    let { className } = { ...props }
    let loginData = useRef<{ [key: string]: string }>({
        mail: "",
        pass: ""
    })

    let passCheck = useRef<any>("")
    let oldPass = useRef<any>("")
    let newPass = useRef<any>("")
    let invalidPassText = useRef<string>("Пароли не совпадают")
    const setNewPass = (pass: string) => {
        newPass.current = pass
    }
    const setLoginData = (data: string, name: string) => {
        loginData.current[name] = data
    }
    const validRuleForPass = (data: string) => {
        if (data.length < 6) {
            return "Длина пароля должна быть больше 6 символов"
        }
    }




    const updateValidObj = () => {

        if (newPass.current !== passCheck.current) {
            validation.current = false
            invalidPassText.current = "Пароли не совпадают"
        } else if (newPass.current.length < 6) {
            validation.current = false
            invalidPassText.current = "Пароль должен быть болше 6 символов"
        }else if(newPass.current === oldPass.current) {
            validation.current = false
            invalidPassText.current = "Новый и старый пароли должжны различаться"
        }
        else {
            validation.current = true
        }
    }

    return (

        <div onClick={(e) => { e.stopPropagation() }} className={s.wrapper}>
            <PasswordInputWithValidation check={false} valid={validationOld.current} invalidText={invalidOldPassText.current} onChange={(data) => { oldPass.current = data }} className={s.loginInput} placeholder="Old password" />
            <PasswordInputWithValidation check={true} validRule={validRuleForPass} valid={validation.current} invalidText={invalidPassText.current} onChange={(data) => { setNewPass(data) }} className={s.loginInput} placeholder="Password" />
            <PasswordInput check={true} onChange={(data) => { passCheck.current = data }} className={s.loginInput} placeholder="Repeat password" />
            <Button text='Сменить пароль' onChange={()=>{
                updateValidObj()
                if(validation.current){
                    changeUserPass({
                        oldPass:oldPass.current,
                        newPass:newPass.current
                    },(data)=>{
                        if(data.err){
                            validationOld.current = false
                            setRefresh(!refresh)
                        }else{
                            validationOld.current = true
                        }
                    })
                }else{
                    setRefresh(!refresh)
                }
            }}></Button>    
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(ChangePasswordForm, checkMemo)