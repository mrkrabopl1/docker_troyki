import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation'
import PhoneInputWithValidation from 'src/components/input/PhoneInputWithValidation'
import Button from 'src/components/Button'
import PasswordInput from 'src/components/input/PasswordInput'
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation'
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import { registerUser, loginUser } from 'src/providers/userProvider'

interface loginFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
    onLogin: (data: any) => void
}
const LoginForm: React.FC<loginFormModuleInterface> = (props) => {
    let validationObject = useRef<any>({})
    let passCheck = useRef<any>("")
    let formData = useRef<{ 
        mail: string,
        pass:string

     }>({
        mail: "",
        pass: ""
    })
    let loginData = useRef<{ [key: string]: string }>({
        mail: "",
        pass: ""
    })


    let [validRegister, setValidRegister] = useState<string>("")
    let [validLogin, setValiLogin] = useState<string>("")
    let invalidPassText = useRef<string>("Пароли не совпадают")
    let invalidMailText = useRef<string>("Пустое поле ввода")
    let [refresh, setRefresh] = useState<boolean>(false)
    let { onChange, onLogin} = { ...props }
    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
    }
    const setLoginData = (data: string, name: string) => {
        loginData.current[name] = data
    }
    const validRuleForPass = (data: string) => {
        if (data.length < 6) {
            return "Длина пароля должна быть больше 6 символов"
        }
    }

    const validRuleForMail = (data: string) => {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(data)) {
            return "Некоректный email"
        }
    }
    const updateValidObj = () => {
        setValidRegister("")
        let entries = Object.entries(formData.current)
        for (let i = 0; i < entries.length; i++) {
            if (entries[i][0] === "pass") {
                if (entries[i][1] !== passCheck.current) {
                    validationObject.current[entries[i][0]] = true
                    invalidPassText.current = "Пароли не совпадают"
                } else if (entries[i][1].length < 6) {
                    validationObject.current[entries[i][0]] = true
                    invalidPassText.current = "Пароль должен быть болше 6 символов"
                }
                else {
                    delete validationObject.current[entries[i][0]]
                }
                continue
            }
            if (entries[i][0] === "mail") {
                var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                re.test(entries[i][1]);
                if ( re.test(entries[i][1])) {
                    delete validationObject.current[entries[i][0]];
                } else {
                    validationObject.current[entries[i][0]] = true
                    invalidMailText.current = "Некоректный email"
                }
                continue
            }
            if (entries[i][1] == "") {
                validationObject.current[entries[i][0]] = true
            } else {
                if (validationObject.current[entries[i][0]]) {
                    delete validationObject.current[entries[i][0]]
                }
            }
        }
    }

    let checkBox = useRef<HTMLInputElement>(null)

    let checked = useRef<boolean>(false)

    return (
        <div onClick={(e) => { e.stopPropagation() }} className={s.main}>
            <input ref={checkBox} type="checkbox" className={s.chk} aria-hidden="true"></input>
            <div className={s.signup}>
                <label className={s.loginLabel} onClick={() => {
                    checked.current = !checked.current
                    checkBox.current.checked = checked.current
                }} aria-hidden="true">Sign up</label>
                {validRegister?<div className={s.warning}>{validRegister}</div>:null}
                <MailInputWithValidation  valid={!validationObject.current.mail} invalidText={invalidMailText.current} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
                <PasswordInputWithValidation check={true} validRule={validRuleForPass} valid={!validationObject.current.pass} invalidText={invalidPassText.current} onChange={(data) => { setFormData(data, "pass") }} className={s.loginInput} placeholder="Password" />
                <PasswordInput check={true} onChange={(data) => { passCheck.current = data }} className={s.loginInput} placeholder="Repeat password" />
                <Button className={s.loginButton} onChange={() => {
                    updateValidObj()
                    if (Object.values(validationObject.current).length > 0) {
                        setRefresh(!refresh)
                    } else {
                        registerUser(formData.current, (info) => { 
                            switch ( info.registerIndex){
                                case 0:
                                    break
                                case 1 :
                                    setValidRegister("Mail уже существует.")    
                                    break
                            }
                        })
                    }
                }} text='Sign up' />
            </div>

            <div className={s.login}>
                <label className={s.loginLabel} onClick={() => {
                    checked.current = !checked.current
                    checkBox.current.checked = checked.current
                }} aria-hidden="true">Login</label>
                <InputWithLabelWithValidation valid={!validationObject.current.login} invalidText={"Введите login."} className={s.loginInput} onChange={(data) => { setLoginData(data, "login") }} placeholder={"Login"} />
                <PasswordInput check={true} onChange={(data) => { setLoginData(data, "pass")}} className={s.loginInput} placeholder="" />
                <Button className={s.loginButton} onChange={() => {onLogin(loginData.current) }} text='Log in' />
            </div>
        </div>
    )
}


export default LoginForm