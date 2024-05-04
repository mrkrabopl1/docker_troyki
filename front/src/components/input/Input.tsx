import React, { ReactElement, useEffect, useRef, useState } from 'react'

type propsRowType = {
    onChange: (...args: any) => void | null
    onFocus?: (...args: any) => void
    onBlur?: (...args: any) => void
    className?: string,
    placeholder?: string,
    val?: string
}



const Input: React.FC<propsRowType> = (props) => {
    const inputRef = useRef(null)

    let { onChange, onFocus, onBlur, className, placeholder, val } = { ...props }
    const [valState,setVal] = useState<string>(val ? val : "")
    return (
        <input
            value={valState}
            placeholder={placeholder ? placeholder : ""}
            style={{ boxSizing: 'border-box', width: "100%" }}
            className={className} ref={inputRef}
            type='text'
            onChange={(e) => {
                if (onChange) {
                    onChange(e.target.value)
                    setVal( e.target.value)
                }
            }}
            onFocus={(e) => { if (onFocus) { onFocus(e.target.value) } }}
            onBlur={(e) => { if (onBlur) { onBlur(e.target.value) } }}
        />
    )
}

export default Input