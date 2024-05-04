import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { show } from 'src/store/reducers/menuSlice'



type propsRowType = {
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    className?: string,
    placeholder?: string,
    val?: string
}

const PasswordInput: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)
    let [typeOfInput, setTypeOfInput] = useState<string>("password")
    let { onChange, onFocus, onBlur, className, placeholder, val } = { ...props }
    const [valState, setVal] = useState<string>(val ? val : "")
    const typeImage = useRef<string>("url('/visOff.svg')")
    const showPass = useRef<boolean>(false)

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
        <div className={className} style={{display:"flex"}}>
            <input 
             
                value={valState}
                placeholder={placeholder ? placeholder : ""}
                style={{height:"24px", width: "100%", backgroundColor:"",border: "none",
                outline:" none"  }}
                ref={inputRef}
                type={typeOfInput}
                onChange={(e) => {
                    if (onChange) {
                        onChange(e.target.value)
                        setVal(e.target.value)
                    }
                }}
                onFocus={(e) => { if (onFocus) { onFocus(e.target.value) } }}
                onBlur={(e) => { if (onBlur) { onBlur(e.target.value) } }} 
            />
           <div onClick={showPassHandle} style={{backgroundImage:typeImage.current, width:"24px", height:"24px", margin:"auto" , backgroundSize:"contain"} }></div> 


        </div>
    )
}

export default PasswordInput