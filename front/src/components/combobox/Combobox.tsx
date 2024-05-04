import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import {ReactComponent as Cart} from "../../../public/cart.svg";

type stringFunc = (data: string) => void


type ComboboxType = { 
    enumProp?: boolean,
    data: string[],
    placeholder?:string,
    onChangeIndex?: (data: number) => void,
    onChangeData?: (data: string) => void ,
    className?:string
}



const Combobox: React.FC<ComboboxType> = ({className, enumProp, data, placeholder, onChangeIndex, onChangeData }) => {
    let arrRef = useRef<any>([])
    let firstValue = placeholder?placeholder:data[0];
    let val = useRef<string>(firstValue)
    let [active, setActive] = useState(false);
    const createCombobox: (data: Array<string>) => ReactElement[] = (data: Array<string>) => {
        arrRef.current = []

        let valArr: ReactElement[] = []

        arrRef.current = arrRef.current.slice(0, data.length);
        if (active) {
            data.map((value, i) => {

                valArr.push(<div ref={el => arrRef.current[i] = el} onClick={() => {
                    val.current = value

                    if (enumProp) {
                        if (onChangeIndex) {
                            onChangeIndex(i)
                        }

                    } else {
                        if (onChangeData) {
                            onChangeData(value)
                        }
                    }

                    setActive(!active)
                }}>
                    {value}
                </div>)
            })
        }

        return valArr

    }

    return (
        <div className={className?className:s.combobox} style={{ position: "relative", width: "100%" }}>
            <div className={s.mainBlock} onClick={() => { setActive(!active) }}>
                {val.current}
                <span style={{ position: "absolute", right: "0", paddingRight: "5px" }}>{active ? "\u1433" : "\u142F"}</span>
            </div>
            <div className={s.list} style={{ position: "absolute", width: "100%" }}>
                {createCombobox(data)}
            </div>
        </div>
    )
}


export default Combobox