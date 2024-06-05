import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
type columnType = {
    header:string
    rows:ReactElement[]
    className?:string
}

const ColumnWithChilds: React.FC<columnType> = (props) => {
    let { header, rows, className} = { ...props }
    return (
        <div className={className?className:s.priceBlock} >
            <div>
                {header}
            </div>
            {rows.map((row) => {
                return row
            })}

        </div>

    )
}

export default ColumnWithChilds