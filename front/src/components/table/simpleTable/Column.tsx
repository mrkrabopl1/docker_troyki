import React, { ReactNode,ReactElement, useRef, useState,memo,useMemo } from 'react'
import s from "./style.module.css"
import ColumnHeader from './ColumnHeader'
type ColumnType = {
    table: string[]|never[],
    children: ReactNode
}

const Column: React.FC<ColumnType> = ({ table, children} ) => {

    const tableCreateHandler = useMemo(() => {
        return table.map((val, id) => {
                return <div key={id}>{val}</div>
            })
    }, [table])
    return (
        <div className={s.priceBlock} >

            <ColumnHeader>
                {children}
            </ColumnHeader>
            {tableCreateHandler}

        </div>

    )
}

export default memo(Column)