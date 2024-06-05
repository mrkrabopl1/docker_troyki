import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import ComplexPhoneMailInput from 'src/components/input/ComplexPhoneMailInput'
import Button from 'src/components/Button'

interface loginFormModuleInterface {
    className?: {
        input?: string,
        checkbox?: string,
        combobox?: string
    }
    onChange: (data: any) => void
}
const PhoneVerificationForm: React.FC<loginFormModuleInterface> = (props) => {
    
    let inputData = useRef<string>("")
    let [phoneState,setPhoneState] = useState<boolean>(true)
    const validateData = ()=>{
        
    }

    return (
        <div onClick={(e) => { e.stopPropagation() }} className={s.main}>
            <ComplexPhoneMailInput onChange={()=>{}}/>
            <Button className={s.loginButton} onChange={() => {
    
            }} text='Send code' />
        </div>
    )
}


export default PhoneVerificationForm