import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { show } from 'src/store/reducers/menuSlice'



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
}


const PasswordInputWithValidation: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)
    let [typeOfInput, setTypeOfInput] = useState<string>("password")
    let { onChange, onFocus, onBlur, className, placeholder, val, valid,invalidText,validRule } = { ...props }
    const [valState, setVal] = useState<string>(val ? val : "")
    const typeImage = useRef<string>("url('/visOff.svg')")
    const showPass = useRef<boolean>(false)
    const invalidTextRef = useRef<string>("")
    let [validState, setValid] = useState<boolean>(true)
    useEffect(()=>{
        invalidTextRef.current = invalidText
        setValid(valid)
    },[valid])

    const showPassHandle=()=>{
        if(showPass.current){
            showPass.current = !showPass.current
            typeImage.current = "url('/visOff.svg')"
            setTypeOfInput("password")
        }else{
            showPass.current = !showPass.current
            typeImage.current = "url('/visOn.svg')"
            setTypeOfInput("text")
        }
    }
    return (
        <div className={className}>
        <div  style={{ width:"100%",display:"flex"}}>
            <input 
                value={valState}
                placeholder={placeholder ? placeholder : ""}
                style={{height:"24px", width: "100%", backgroundColor:"",border: "none",
                outline:" none"  }}
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
           <div onClick={showPassHandle} style={{backgroundImage:typeImage.current, width:"24px", height:"24px", margin:"auto" , backgroundSize:"contain"} }></div> 
        </div>
           {!validState ? <label style={{ color: "red" }}>{invalidTextRef.current}</label> : null}

        </div>
    )
}

export default PasswordInputWithValidation