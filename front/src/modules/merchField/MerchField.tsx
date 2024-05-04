import React, { ReactElement, useEffect, useRef, useState } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"

import global from "src/global.css"


interface merchInterface { name: string, imgs: string[], id: string , price:string}

const MerchField: React.FC<{ size: number, data: merchInterface[] }> = (props) => {
    let { data, size } = { ...props }
    data = [...data]
    const createWidth = () => {
        return 100 / size + "%"
    }
    const createBlocks = () => {
        let arr: any = []
        while (data.length) {
            let count = 0
            let arrSm: any = []
            while (count < size) {
                count += 1
                if (data.length !== 0) {
                    arrSm.push(<MerchBlock width={createWidth()} data={data[0]} />)
                }
                data.shift()
            }

            arr.push(<div className={s.merchField}>
                {arrSm}
            </div>)
        }

        return arr
    }
    return (
        <div>
            {createBlocks()}
            
        </div>

    )
}


export default MerchField