import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import DynamicColumn from './DynamicColumn'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import DynamicElement from 'src/components/dynamicElement/DynamicElement'

type dinamicElementType = {
    componentName:string,
    propsData:any
}



type sortingType = (tableArr: string[][], id: number) => void

type sortedType = {
    index: number,
    direction: boolean
}

type tableType = {
    table: ( dinamicElementType | string)[][],
    headers:string[]

    className?:string
}

const DynamicTable: React.FC<tableType> = (props) => {
    let { table,  className, headers } = { ...props }

    
    function createHeaders() {
        let headerArr = headers.map((val, id) => {
            return <th>
                <div>
                    <span>{val}</span>
                </div>
            </th>
        })

        return headerArr

    }

    function createTables() {
        let tableArr = []
        if(table.length){
            for (let i = 0; i < table.length; i++) {
                tableArr.push(<tr>
                    {createTableRow(table[i])}
                </tr>)
            }
        }
        return tableArr
    }
    
    function createTableRow(elems: (dinamicElementType | string)[]){
        let rowArr = []
        for (let i = 0; i < elems.length; i++) {
            let val = elems[i]
            if(typeof val === "string" ||  typeof val === "number"){
                rowArr.push(<td>{val}</td>)
            }else{
                rowArr.push(<td>{<DynamicElement {...val}/>}</td>)
            }
        }
        return rowArr
    }
    return (
        <table className = {className}  style={{
            borderCollapse: 'collapse',
            borderSpacing: '0px',
            width:"100%"
        }}>
            <thead>
                <tr>
                    {createHeaders()}
                </tr>
            </thead>
            <tbody>
                {createTables()}
            </tbody>
        </table>
    
    )
}

export default DynamicTable