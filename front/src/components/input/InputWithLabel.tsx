import React, { ReactElement, useEffect, useRef, useState } from 'react'

import s from "./style.module.css"

type propsRowType = {
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    className?: string,
    placeholder?: string,
    val?: string
}



const InputWithLabel: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)

    let { onChange, onFocus, onBlur, className, placeholder, val } = { ...props }
    const [valState, setVal] = useState<string>(val ? val : "")
    return (
        <div style={{width:"100%",position:"relative", padding:"15px 0", marginTop:"5px"}}>


            <input
                value={valState}
                style={{ boxSizing: 'border-box', width: "100%" }}
                className={s.inputWithLabel} ref={inputRef}
                placeholder=''
                type='text'
                onChange={(e) => {
                    if (onChange) {
                        onChange(e.target.value)
                        setVal(e.target.value)
                    }
                }}
                onFocus={(e) => { if (onFocus) { onFocus(e.target.value) } }}
                onBlur={(e) => { if (onBlur) { onBlur(e.target.value) } }}
                required
            />
            <label onClick={
                ()=>inputRef.current && inputRef.current.focus()
                }  className={s.label}>{placeholder}</label>
        </div>
    )
}

export default InputWithLabel