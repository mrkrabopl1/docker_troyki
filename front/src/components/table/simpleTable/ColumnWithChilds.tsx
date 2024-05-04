import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
type columnType = {
    header:string
    rows:ReactElement[]
}

const ColumnWithChilds: React.FC<columnType> = (props) => {
    let { header, rows} = { ...props }
    return (
        <div className={s.priceBlock} >
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