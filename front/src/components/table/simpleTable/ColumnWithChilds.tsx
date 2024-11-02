import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
type columnType = {
    header: string
    rows: ReactElement[]
    className?: string
    headerClassName?: string
}

const ColumnWithChilds: React.FC<columnType> = (props) => {
    let { header, rows, className, headerClassName } = { ...props }
    return (
        <div className={className ? className : s.priceBlock} >
            <div className={headerClassName && headerClassName}>
                {header}
            </div>
            {rows.map((row, ind) => {
                return <div key={ind}>
                    {row}
                </div>
            })}

        </div>

    )
}

export default ColumnWithChilds