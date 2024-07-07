import React, { ReactElement, useEffect, useRef, useState } from 'react'

import s from "./style.module.css"

type propsRowType = {
    valid: boolean,
    invalidText: string,
    validRule?: (valid: string) => string
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    className?: string,
    invalidClassName?: string,
    placeholder?: string,
    val?: string
}



const MailInputWithValidation: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)
    let { onChange, onFocus, onBlur, className, placeholder, val, valid, invalidText, invalidClassName, validRule } = { ...props }
    const invalidTextRef = useRef<string>("")
    useEffect(()=>{
        invalidTextRef.current = invalidText
        setValid(valid)
    },[valid])
    let [validState, setValid] = useState<boolean>(true)
    const [valState, setVal] = useState<string>(val ? val : "")
    return (
        <div className={s.inputContainer}>
            <input
                value={valState}
                style={{ boxSizing: 'border-box', width: "100%" }}
                className={validState ? s.inputWithLabel : s.inputWithLabel + " " + s.invalid}
                ref={inputRef}
                placeholder=''
                type='email'
                onChange={(e) => {
                    setValid(true)
                    if (onChange) {
                        onChange(e.target.value)
                        setVal(e.target.value)
                    }
                }}
                onFocus={(e) => { if (onFocus) { onFocus(e.target.value) } }}
                onBlur={(e) => { 
                    if(validRule)  {
                        let invalidMessage = validRule(valState)
                        if(invalidMessage){
                            invalidTextRef.current = invalidMessage
                            setValid(false)
                        }
                      }
                    if (onBlur) { 
                    onBlur(e.target.value)
                 } }}
                required
            />
            <label onClick={
                () => inputRef.current && inputRef.current.focus()
            } className={s.label}>{placeholder}</label>
            {!validState ? <label style={{ color: "red" }}>{invalidTextRef.current}</label> : null}
        </div>
    )
}

export default MailInputWithValidation