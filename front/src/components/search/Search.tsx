import React, { ReactElement, useRef, useState } from 'react'
import {searchNames} from "src/providers/searchProvider"
import Input from '../input/Input'
import loupe from "../../../public/loupe.svg";
import s from "./style.module.css"

type propsRowType = {
    onDataRecieve: (...args: any) => void | null,
    searchCallback:(...args: any) => void | null,
    onChange?:(...args: any) => void ,
    onFocus?:(...args: any) => void ,
    onBlur?:(...args: any) => void ,
    className?: string,
    val?:string
}
const defaultStyle: any = {
    border: "2px solid blue",
    position: "relative",
    backgroundColor: "white"
}


const Search: React.FC<propsRowType> = (props) => {
    let trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    let { val,className, onDataRecieve,searchCallback, onChange,onBlur,onFocus } = { ...props }
    let text = useRef<string>(val?val:"")
    const handleEnter =(e:React.KeyboardEvent<HTMLDivElement>) =>{
        if (e.key === 'Enter') {
            searchCallback(text.current);
        }
    }
    const createSearchRequest = (val: string) => {
        onChange && onChange(val);
        text.current = val;
        if (trottlingTimerId.current) {
            clearTimeout(trottlingTimerId.current);
        }
        trottlingTimerId.current = setTimeout(() => {
            searchNames(val,5,onDataRecieve)
        }, 1000)
    }

    return (
        <div onKeyUp={handleEnter} className={className ? className : s.search}>
            <Input val={val} onBlur={onBlur} onFocus={onFocus} className={s.input} onChange={createSearchRequest}>
            </Input>
            <img onClick={()=>searchCallback(text.current)} className={s.img} src={loupe} alt="" />
        </div>
    )
}

export default Search