import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { show } from 'src/store/reducers/menuSlice'
import s from "./style.module.css"


type propsRowType = {
    valid: boolean,
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    validRule?: (valid: string) => string
    className?: string,
    placeholder?: string,
    val?: string,
    invalidText: string,
    check:boolean
}


const PasswordInputWithValidation: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)
    let [typeOfInput, setTypeOfInput] = useState<string>("password")
    let { onChange, onFocus, onBlur, className, placeholder, val, valid,invalidText,validRule, check } = { ...props }
    const [valState, setVal] = useState<string>(val ? val : "")
    const typeImage = useRef<string>("url('/visOff.svg')")
    const showPass = useRef<boolean>(false)
    const invalidTextRef = useRef<string>("")
    let [validState, setValid] = useState<boolean>(true)
    useEffect(()=>{
        invalidTextRef.current = invalidText
        setValid(valid)
    },[valid])

    const showPassHandle=(show:boolean)=>{
        showPass.current = show
        if(!showPass.current){
            typeImage.current = "url('/visOff.svg')"
            setTypeOfInput("password")
        }else{
            typeImage.current = "url('/visOn.svg')"
            setTypeOfInput("text")
        }
    }
    return (
        <div className={s.inputContainer}>
        <div  style={{ width:"100%",display:"flex", backgroundColor:"white"}}  className={validState ? s.inputPass : s.inputPass + " " + s.invalid}>
            <input 
                value={valState}
                placeholder={placeholder ? placeholder : ""}
                style={{height:"24px", width: "100%", backgroundColor:"",
                outline:" none", border:"none"  }}
                ref={inputRef}
                type={typeOfInput}
                onChange={(e) => {
                    setValid(true)
                    onChange(e.target.value)
                    setVal(e.target.value)
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
                     if (onBlur) { onBlur(e.target.value) } }
                    } 
            />
           {check?<div onMouseOut={()=>showPassHandle(false)} onMouseUp={()=>showPassHandle(false)} onMouseDown={()=>showPassHandle(true)} style={{backgroundImage:typeImage.current, width:"24px", height:"24px", margin:"auto" , backgroundSize:"contain"} }></div>:null} 
        </div>
           {!validState ? <label style={{ color: "red" }}>{invalidTextRef.current}</label> : null}

        </div>
    )
}

export default PasswordInputWithValidation