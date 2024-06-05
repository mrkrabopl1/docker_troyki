import React, { useEffect, ReactElement, useState, useRef, memo, useCallback } from 'react'

import Input from "src/components/input/Input"
import InputWithLabel from "src/components/input/InputWithLabel"
import InputWithLabelWithValidation from "src/components/input/InputWithLabelWithValidation"
import PhoneInputWithLabel from "src/components/input/PhoneInput"
import Combobox from "src/components/combobox/Combobox"
import Checkbox from "src/components/checkbox/Checkbox"
import s from './style.module.css'
import Button from 'src/components/Button';
import { useAppSelector } from 'src/store/hooks/redux'
import { NavLink } from 'react-router-dom'

interface sendFormModuleInterface {
    top:string,
    left:string
}


const StickyDispetcherButton: React.FC<sendFormModuleInterface> = (props) => {
    let [show,setShow] = useState<boolean>(false)

    let {top,left} = {...props}

    const { footer } = useAppSelector(state => state.dispetcherReducer)
    return (

        <div onClick={()=>{setShow(!show)}} className={s.stickyDispetcherBlock} style={{background:"url('/chat.svg') no-repeat center white",backgroundSize:"80%",position:footer?"absolute":"fixed", bottom:"100px", left:left}}>
            {show?<div className={s.dispetchers}  >
                <NavLink to='https://t.me/TSUMcollectBot' className={s.dispetcherA}>
                    Whatsapp
                </NavLink>
                <NavLink to="" className={s.dispetcherA}>
                    Telegramm
                </NavLink>
            </div>:null}
        </div>

    )
}

function checkMemo(oldData: any, newData: any) {
    return (oldData.memo === newData.memo)
}
export default memo(StickyDispetcherButton, checkMemo)