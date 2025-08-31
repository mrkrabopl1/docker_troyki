import React, { ReactElement, useEffect, useRef, useState,useMemo,memo } from 'react'
import s from "./style.module.css"
import Column from './Column'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'


type tableType = {
    table: {
        [key: string]: string[]
    },
    name:string
}


const Table: React.FC<tableType> = ({table,name}) => {
    const createColumns = useMemo(() => {
    return  Object.entries(table).map((val, id) => {
                    return <Column key={id} table={val[1]} >
                        <span>{val[0]}</span>
                    </Column  >
                })
            }, [table])


    return (
        <table className={s.tableWrap}>
               {createColumns}
        </table>
    
    )
}

export default memo(Table)