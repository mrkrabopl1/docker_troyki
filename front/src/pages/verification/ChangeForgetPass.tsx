import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'
import ChangeForgetPasswordForm from 'src/modules/loginForm/ResetPasswordForm';
import Link from 'next/link';
import { changForgetPass } from 'src/providers/userProvider'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
import { useAppDispatch } from 'src/store/hooks/redux';
import { verified } from 'src/store/reducers/menuSlice'

const Errors = [
    " Ссылка на смену пароля истекла. Запросите ее снова.",
    "Что то пошло не так попробуйте еще раз"
]

const Confirm = [
    "Ваш пароль успешно изменен. В дальнейшем используйте свой новый пароль для входа на сайт."
]

const ChangeForgetPass: React.FC<any> = () => {
    let [changeError, setChangeError] = useState<string>("")
    let [confirm, setConfirm] = useState("")

    return (
        <div>
            {confirm ? <div>
                <div>{confirm}</div>
                <Link href="/">На главную</Link>
            </div> : <div>
                {changeError ? <div>Ссылка на смену пароля истекла. Запросите ее снова.</div> : null}
                <ChangeForgetPasswordForm onSubmit={(data) => {
                    changForgetPass(data.password, (data) => {
                        switch (data) {
                            case 0:
                                setConfirm(Confirm[0])
                                break
                            case 1:
                            case 2:
                                setChangeError(Errors[data])
                        }
                    })
                }} />
            </div>}
        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {
    return (oldProps.memo == newProps.memo)
}

export default memo(ChangeForgetPass, arePropsEqual)