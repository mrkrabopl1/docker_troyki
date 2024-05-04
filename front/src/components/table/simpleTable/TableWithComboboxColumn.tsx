import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import Column from './Column'
import SyncComboboxColumn from '../../comboboxColumn/SyncCombobxColumn'
import Combobox from 'src/components/combobox/Combobox'

type columnType = {
    table: string[],
    title: string,
    subtitle?: string
}


type tableType = {
    table: [
        {
            title: string,
            subtitle?: string,
            table: string[] | never[]
        }
    ],

    comboTable: [
        {
            title: string,
            subtitle?: string,
            table: string[] | never[]
        }
    ],
    className?:string
}


const TableWithComboboxColumn: React.FC<tableType> = (props) => {
    let { table, comboTable,className } = { ...props }
    let length = useRef<string>("0")
    length.current = 100 / (Object.entries(table).length + 1) + "%"


    let [chosenIndex,choseIndex] = useState<number>(0) 

    function createHeaders() {
        let headerArr = table.map((val, id) => {
            return <th>
                <div>
                    <span>{val.title}</span>
                </div>
            </th>
        })

        let headers = comboTable.map((val) => {
            return val.title
        })



        headerArr.push(<th>
            <div>
                <Combobox enumProp={true} data={headers} onChangeIndex={choseIndex}></Combobox>
            </div>
        </th>)

        return headerArr

    }

    function createTables() {
        let tableArr = []
        for (let i = 0; i < table[0].table.length; i++) {

            tableArr.push(<tr>
                {createTableRow(i)}
            </tr>)
        }
        return tableArr
    }

    function createTableRow(index:number){
        let rowArr = []
        for (let i = 0; i < table.length; i++) {
           rowArr.push(<td>{table[i].table[index]}</td>)
        }
        rowArr.push(<td>{comboTable[chosenIndex].table[index]}</td>)

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

export default TableWithComboboxColumn