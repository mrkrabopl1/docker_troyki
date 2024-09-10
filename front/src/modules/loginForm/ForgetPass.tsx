import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import Button from 'src/components/Button'
import MailInputWithValidation from 'src/components/input/MailInputWithValidation'
import { updatePass } from 'src/providers/userProvider'

interface loginFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void

}

const Masseges = [
    "Письмо отправлено на указанный mail"
]

const ErrMasseges = [
    "Что то пошло не так попробуйте еще раз",
    "Указанной почты не существует"
]

const ForgetPass: React.FC<loginFormModuleInterface> = (props) => {
    let validationObject = useRef<any>({})
    let [mail, setMail] = useState<string>("")
    let [err, setErr] = useState<string>("")
    let [confirm, setConfirm] = useState<string>("")


    const validRuleForMail = (data: string) => {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(data)) {
            return "Некоректный email"
        }
    }

    return (
        <div onClick={(e) => { e.stopPropagation() }} className={s.main}>
            {confirm ? <div>{confirm}</div> : <div>
                <div>Введите свой логин и нажмите "Изменить пароль." Ссылка для изменения пароля будет выслана Вам по почте. </div>
                {err ? <div>{err}</div> : null}
                <MailInputWithValidation valid={!validationObject.current.mail} invalidText={"Некректный mail"} onChange={(data) => { setMail(data) }} placeholder={"Электронный адрес"} />
                <Button className={s.loginButton} onChange={() => {
                    updatePass(mail, (data) => {
                        switch (data.data) {
                            case 0:
                                setConfirm(Masseges[0])
                            break
                            case 1:
                            case 2:
                                setErr(ErrMasseges[data.data])    
                        }
                    })
                }} text='Change pass' />
            </div>}

        </div>

    )
}


export default ForgetPass