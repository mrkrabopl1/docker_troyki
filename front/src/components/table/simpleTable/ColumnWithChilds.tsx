import React, { ReactElement, useRef, useState ,useMemo} from 'react'
import s from "./style.module.css"
type columnType = {
    header: string
    rows: ReactElement[]
    className?: string
    headerClassName?: string
}

const ColumnWithChilds: React.FC<columnType> = ({ header, rows, className, headerClassName } ) => {
    const tableCreateHandler = useMemo(() => {
        return rows.map((row, ind) => {
                return <div key={ind}>
                    {row}
                </div>
            })
    }, [rows])
    return (
        <div className={className ? className : s.priceBlock} >
            <div className={headerClassName && headerClassName}>
                {header}
            </div>
            {tableCreateHandler}

        </div>

    )
}

export default ColumnWithChilds