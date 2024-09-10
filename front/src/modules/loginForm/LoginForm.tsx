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
    forgetPass: (data: any) => void
}
const LoginForm: React.FC<loginFormModuleInterface> = (props) => {
    let validationObject = useRef<any>({})
    let passCheck = useRef<any>("")
    let formData = useRef<{
        mail: string,
        pass: string

    }>({
        mail: "",
        pass: ""
    })

    type loginDataType = {
        mail: string,
        pass: string
    }
    let loginData = useRef<loginDataType>({
        mail: "",
        pass: ""
    })


    let [validRegister, setValidRegister] = useState<string>("")
    let [forgotPass, setForgotPass] = useState<boolean>(false)
    let invalidPassText = useRef<string>("Пароли не совпадают")
    let invalidMailText = useRef<string>("Пустое поле ввода")
    let [invalidRequest,setInvalidRequest] = useState<boolean>(false)
    let [refresh, setRefresh] = useState<boolean>(false)
    let { onChange, onLogin, forgetPass } = { ...props }
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


    return (
        <div onClick={(e) => { e.stopPropagation() }} className={s.main}>

            <div className={s.caption}>Login</div>
            {invalidRequest?<div>Неверный mail или пароль</div>:null}
            <MailInputWithValidation valid={!validationObject.current.mail} invalidText={invalidMailText.current} onChange={(data) => { setLoginData(data, "mail") }} placeholder={"Электронный адрес"} />
            <PasswordInputWithValidation check={true} validRule={validRuleForPass} valid={!validationObject.current.pass} invalidText={invalidPassText.current} onChange={(data) => { setLoginData(data, "pass") }} className={s.loginInput} placeholder="Password" />
            <Button className={s.loginButton} onChange={() => {
                setInvalidRequest(false)
                loginUser(loginData.current, (loged) => {
                    if (loged) {
                        onLogin(true)
                    } else {
                        setInvalidRequest(true)
                        onLogin(false)
                    }
                })
            }} text='Log in' />
            <span className={s.forgetPass} onClick={forgetPass}>
                Забыли пароль
            </span>

        </div>

    )
}


export default LoginForm