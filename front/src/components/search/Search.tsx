import React, { useRef, useCallback,useState } from 'react'
import { searchNames } from "src/providers/searchProvider"
import Input from '../input/Input'
import { ReactComponent as LoupeIcon } from "../../../public/loupe.svg"
import s from "./style.module.css"

type Props = {
    onDataRecieve: (...args: any) => void,
    searchCallback: (...args: any) => void,
    onChange?: (...args: any) => void,
    onFocus?: (...args: any) => void,
    onBlur?: (...args: any) => void,
    className?: string,
    val?: string,
    placeholder?: string
}

const Search: React.FC<Props> = ({
    val = "",
    className,
    onDataRecieve,
    searchCallback, 
    onChange,
    onBlur,
    onFocus,
    placeholder = "Search..."
}) => {
    const trottlingTimerId = useRef<ReturnType<typeof setTimeout> | null>(null)
    const text = useRef<string>(val)
    const [isFocused, setIsFocused] = useState(false)
    
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

    const handleFocus = useCallback(() => {
        setIsFocused(true)
        onFocus && onFocus()
    }, [onFocus])

    const handleBlur = useCallback(() => {
        setIsFocused(false)
        onBlur && onBlur()
    }, [onBlur])

    return (
        <div 
            onKeyUp={handleEnter} 
            className={`${s.baseSearch} ${classNameSearch} ${isFocused ? s.focused : ''}`}
        >
            <Input 
                value={val} 
                onBlur={handleBlur} 
                onFocus={handleFocus} 
                className={s.input} 
                onChange={createSearchRequest}
                placeholder={placeholder}
            />
            <button 
                onClick={handleSearchClick} 
                className={s.searchButton}
                type="button"
                aria-label="Search"
            >
                <LoupeIcon className={s.searchIcon} />
            </button>
        </div>
    )
}

export default React.memo(Search)