import React, { ReactElement, useEffect, useRef, useState, useCallback } from 'react'

import s from "./style.module.css"

type propsRowType = {
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    className?: string,
    placeholder?: string,
    val?: string,
    valid: boolean,
    invalidEmpty: string,
    invalidIncorrect: string
}



const PhoneInputWithValidation: React.FC<propsRowType> = (props) => {
    const inputRef = useRef<HTMLInputElement>(null)
    let { valid, onBlur, onChange, onFocus, className, val, invalidEmpty, invalidIncorrect } = { ...props }

    let [phoneVal, setPhoneVal] = useState<string>(val ? val : "+7")
    const cursorPositionRef = useRef<number>(2)
    const startValidationOnBlur = useRef<boolean>(false)

    const [validState, setValid] = useState<boolean>(valid)
    useEffect(() => {
        setPhoneVal(val)
        setTimeout(()=>inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current),0)
    }, [val])
    useEffect(() => {
        setPhoneVal(phoneVal)
        setTimeout(()=>inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current),0)
    }, [phoneVal])
    useEffect(() => {
        setValid(valid)
    }, [valid])


    const formatVal = function (val: string) {
        val.replace(/[-,\s]/g, "")
        if (Number.isNaN(val) || val.length !== 11 || val) {
            return null
        }


    }

    const stringToVal = function (val) {
        val.replace(/[-,\s]/g, "")
    }

    const removeChar = (timeStrVal: string) => {
        let defaultPart = timeStrVal.slice(0, 2)
        let codePart = timeStrVal.slice(2, 5)
        let mainPart = timeStrVal.slice(5, 8)
        let firstDoublePart = timeStrVal.slice(8, 10)
        let seconfDoublePart = timeStrVal.slice(10, 12)
        let finalStr = defaultPart + " " + codePart
        if (mainPart) {
            finalStr = finalStr + " " + mainPart
        }
        if (firstDoublePart) {
            finalStr = finalStr + "-" + firstDoublePart
        }
        if (seconfDoublePart) {
            finalStr = finalStr + "-" + seconfDoublePart
        }
        return finalStr
    }


    const numberValidation = useCallback((val: React.KeyboardEvent<HTMLInputElement>) => {
        if (val.key === "Delete") {
            let cursorPosition = inputRef.current.selectionStart
            if (cursorPosition < 3) {
                setTimeout(()=>inputRef.current.setSelectionRange(0, 0),0)
            } else {
                let prefix = ""
                let suffix = ""

                if (cursorPosition === 6 || cursorPosition === 10 || cursorPosition === 13) {
                    prefix = phoneVal.slice(0, cursorPosition + 1);
                    suffix = phoneVal.slice(cursorPosition + 2, phoneVal.length);
                } else {
                    prefix = phoneVal.slice(0, cursorPosition);
                    suffix = phoneVal.slice(cursorPosition + 1, phoneVal.length);
                }
                const timeStrVal = (prefix + suffix).replace(/[-,\s]/g, "")
                let finalStr = removeChar(timeStrVal)
                cursorPositionRef.current = cursorPosition
                if (finalStr.length === 3) {
                    finalStr = ""
                }
                setPhoneVal(finalStr);
                if (finalStr.length === 16) {
                    setValid(true)
                    onChange(finalStr)
                }else{
                    onChange("")
                }
            }
        }
        if (val.key === "Backspace") {
            let cursorPosition = inputRef.current.selectionStart
            if (cursorPosition === 7 || cursorPosition === 11 || cursorPosition === 14) {
                //inputRef.current.focus();
                setTimeout(()=>inputRef.current.setSelectionRange(cursorPosition - 1, cursorPosition - 1),0)
            } else if (cursorPosition == 4 && phoneVal.length == 4) {
                setPhoneVal("");
            } else if (cursorPosition < 4) {
                setTimeout(()=>inputRef.current.setSelectionRange(0, 0),0)
            }
            else {
                const prefix = phoneVal.slice(0, cursorPosition - 1);
                const suffix = phoneVal.slice(cursorPosition, phoneVal.length);
                const timeStrVal = (prefix + suffix).replace(/[-,\s]/g, "")
                const finalStr = removeChar(timeStrVal)
                cursorPositionRef.current = cursorPosition - 1
                setPhoneVal(finalStr);
                if (finalStr.length === 16) {
                    setValid(true)
                    onChange(finalStr)
                }else{
                    onChange("")
                }
            }

        }
        if (val.key === "ArrowLeft") {
            let cursorPosition = inputRef.current.selectionStart
            if (cursorPosition != 0) {
                setTimeout(()=>inputRef.current.setSelectionRange(cursorPosition - 1, cursorPosition - 1),0)
            }
        }
        if (val.key === "ArrowRight") {
            let cursorPosition = inputRef.current.selectionStart
            setTimeout(()=>inputRef.current.setSelectionRange(cursorPosition + 1, cursorPosition + 1),0)
        }
        let num = Number(val.key)
        if (isFinite(num)) {
            let cursorPosition = inputRef.current.selectionStart
            console.log(cursorPosition)
            if (cursorPosition === phoneVal.length) {
                if (phoneVal.length === 16) return
                let newVal = ""
                if (phoneVal.length < 4) {
                    newVal = "+7" + " " + num
                }
                else if (phoneVal.length === 6) {
                    newVal = phoneVal + " " + num
                } else if (phoneVal.length === 10 || phoneVal.length === 13) {
                    newVal = phoneVal + "-" + num
                } else {
                    newVal = phoneVal + num
                }
                cursorPositionRef.current = newVal.length
                setPhoneVal(newVal)
                if (newVal.length === 16) {
                    setValid(true)
                    onChange(newVal)
                }else{
                    onChange("")
                }
            } else {
                let prefix = ""
                let suffix = ""

                if (cursorPosition < 3) {
                    prefix = phoneVal.slice(0, 3);
                    suffix = phoneVal.slice(4, phoneVal.length);
                    cursorPositionRef.current = 5
                }
                else if (cursorPosition === 6 || cursorPosition === 10 || cursorPosition === 13) {
                    prefix = phoneVal.slice(0, cursorPosition + 1);
                    suffix = phoneVal.slice(cursorPosition + 2, phoneVal.length);
                    cursorPositionRef.current = cursorPosition + 1
                }
                else if (cursorPosition === 5 || cursorPosition === 9 || cursorPosition === 12) {
                    prefix = phoneVal.slice(0, cursorPosition);
                    suffix = phoneVal.slice(cursorPosition + 1, phoneVal.length);
                    cursorPositionRef.current = cursorPosition + 2
                }
                else {
                    prefix = phoneVal.slice(0, cursorPosition);
                    suffix = phoneVal.slice(cursorPosition + 1, phoneVal.length);
                    cursorPositionRef.current = cursorPosition + 1
                }
                const timeStrVal = (prefix + num + suffix).replace(/[-,\s]/g, "")
                let finalStr = removeChar(timeStrVal)
                setTimeout(()=>inputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current),0)
                setPhoneVal(finalStr);
                if (finalStr.length === 16) {
                    setValid(true)
                    onChange(finalStr)
                }else{
                    onChange("")
                }
            }
        }
    },[phoneVal])
    const [valState, setVal] = useState<string>(val ? val : "")
    return (
        <div className={s.inputContainer}>
            <span>Phone</span>
            <input
                onKeyDown={(e) => {
                    startValidationOnBlur.current = true
                    e.preventDefault()
                    numberValidation(e)
                }}
                value={phoneVal}
                style={{ boxSizing: 'border-box', width: "100%" }}
                className={validState ? s.inputWithLabel : s.inputWithLabel + " " + s.invalid}
                ref={inputRef}
                placeholder="+7 999 999-99-99"
                type='tel'
                onFocus={(e) => { if (onFocus) { onFocus(e.target.value) } }}
                onBlur={(e) => {
                    if (startValidationOnBlur.current) {
                        if (phoneVal.length < 16 && phoneVal.length !== 0) {
                            setValid(false)
                        }
                        if (onBlur) {
                            onBlur(e.target.value)
                        }
                    }
                }}
            />
            {!validState ? <label style={{ color: "red" }}>{phoneVal.length === 0 ? invalidEmpty : invalidIncorrect}</label> : null}
            {/* <label onClick={
                ()=>inputRef.current && inputRef.current.focus()
                }  className={s.label}>{placeholder}</label> */}
        </div>
    )
}

export default PhoneInputWithValidation