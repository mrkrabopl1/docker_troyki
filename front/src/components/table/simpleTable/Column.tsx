import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"
import ColumnHeader from './ColumnHeader'
type columnType = {
    table: string[]|never[]
}

const Column: React.FC<columnType> = (props) => {
    let { table, children} = { ...props }
    return (
        <div className={s.priceBlock} >

            <ColumnHeader>
                {children}
            </ColumnHeader>
            {table.map((val, id) => {
                return <div key={id}>{val}</div>
            })}

        </div>

    )
}

export default Column