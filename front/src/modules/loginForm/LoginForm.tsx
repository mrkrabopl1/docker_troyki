import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import InputWithLabelWithValidation from 'src/components/input/InputWithLabelWithValidation'
import PhoneInputWithLabel from 'src/components/input/PhoneInput'
import Button from 'src/components/Button'
import PasswordInput from 'src/components/input/PasswordInput'
import PasswordInputWithValidation from 'src/components/input/PasswordInputWithValidation'


interface loginFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}
const LoginForm: React.FC<loginFormModuleInterface> = (props) => {
    let validationObject = useRef<any>({})
    let passCheck = useRef<any>("")
    let formData = useRef<any>({
        name: "",
        login: "",
        mail: "",
        address: "",
        phone: "",
        pass:""
    })
    let [refresh, setRefresh] = useState<boolean>(false)
    let {onChange} = {...props}
    const setFormData = (data: string, name: string) => {
        formData.current[name] = data
    }

    const validRuleForPass = (data: string) => {
        if (data.length < 6) {
            return "Длина пароля должна быть больше 6 символов"
        }
    }
    const updateValidObj = () => {
        let entries = Object.entries(formData.current)
        for (let i = 0; i < entries.length; i++) {
            if(entries[i][0] === "pass"){
                if(entries[i][1] !==passCheck.current ){
                    validationObject.current[entries[i][0]] = true
                }else{
                    delete validationObject.current[entries[i][0]]
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
                <form>
                    <label className={s.loginLabel} onClick={() => {
                        checked.current = !checked.current
                        checkBox.current.checked = checked.current
                    }} aria-hidden="true">Sign up</label>
                    <InputWithLabelWithValidation valid={!validationObject.current.login} invalidText={"Введите login."} className={s.loginInput} onChange={(data) => { setFormData(data, "name") }} placeholder={"Login"} />
                    <InputWithLabelWithValidation valid={!validationObject.current.name} invalidText={"Введите имя."} className={s.loginInput} onChange={(data) => { setFormData(data, "name") }} placeholder={"Имя"} />
                    <InputWithLabelWithValidation valid={!validationObject.current.address} invalidText={"Введите адресс."} onChange={(data) => { setFormData(data, "address") }} placeholder={"Адрес"} />
                    <PhoneInputWithLabel invalidIncorrect={"Неверный формат"} invalidEmpty={"Введите телефон"} valid={!validationObject.current.phone} onChange={(data) => { setFormData(data, "phone") }} placeholder={"Телефон"} />
                    <InputWithLabelWithValidation valid={!validationObject.current.mail} invalidText={"Введите адрес электронной почты."} onChange={(data) => { setFormData(data, "mail") }} placeholder={"Электронный адрес"} />
                    <PasswordInputWithValidation validRule={validRuleForPass} valid={!validationObject.current.pass} invalidText={"Пароли не совпадают."} onChange={(data) => { setFormData(data, "pass") }} className={s.loginInput} placeholder="Password" />
                    <PasswordInput onChange={(data) => { passCheck.current = data }} className={s.loginInput} placeholder="Repeat password" />
                    <Button className={s.loginButton} onChange={() => {
                        updateValidObj()
                        if (Object.values(validationObject.current).length > 0) {
                            setRefresh(!refresh)
                        } else {
                            onChange(formData.current)
                        }
                    }} text='Sign up' />
                </form>
            </div>

            <div className={s.login}>
                <form>
                    <label className={s.loginLabel} onClick={() => {
                        checked.current = !checked.current
                        checkBox.current.checked = checked.current
                    }} aria-hidden="true">Login</label>
                    <input className={s.loginInput} type="email" name="email" placeholder="Email" />
                    <input className={s.loginInput} type="password" name="pswd" placeholder="Password" />
                    <Button className={s.loginButton} onChange={() => { }} text='Log in' />
                </form>
            </div>
        </div>
    )
}


export default LoginForm