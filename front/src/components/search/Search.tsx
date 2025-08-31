import React, { ReactElement, useRef, useState, useCallback } from 'react'
import { searchNames } from "src/providers/searchProvider"
import Input from '../input/Input'
import loupe from "../../../public/loupe.svg";
import s from "./style.module.css"

type Props = {
    onDataRecieve: (...args: any) => void,
    searchCallback: (...args: any) => void,
    onChange?: (...args: any) => void,
    onFocus?: (...args: any) => void,
    onBlur?: (...args: any) => void,
    className?: string,
    val?: string
}

const Search: React.FC<Props> = ({
    val = "",
    className,
    onDataRecieve,
    searchCallback, 
    onChange,
    onBlur,
    onFocus
}) => {
    const trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    const text = useRef<string>(val)
    const classNameSearch = className || s.search
    
    const handleEnter = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            searchCallback(text.current)
        }
    }, [searchCallback])

    const createSearchRequest = useCallback((val: string) => {
        onChange?.(val)
        text.current = val
        
        if (trottlingTimerId.current) {
            clearTimeout(trottlingTimerId.current)
        }
        
        trottlingTimerId.current = setTimeout(() => {
            searchNames(val, 5, onDataRecieve)
        }, 1000)
    }, [onChange, onDataRecieve])

    const handleSearchClick = useCallback(() => {
        searchCallback(text.current)
    }, [searchCallback])

    return (
        <div onKeyUp={handleEnter} className={`${s.baseSearch} ${classNameSearch}`}>
            <Input 
                value={val} 
                onBlur={onBlur} 
                onFocus={onFocus} 
                className={s.input} 
                onChange={createSearchRequest}
            />
            <img 
                onClick={handleSearchClick} 
                className={s.img} 
                src={loupe} 
                alt="Search" 
            />
        </div>
    )
}

export default React.memo(Search)