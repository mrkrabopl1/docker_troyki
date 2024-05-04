import React, { ReactElement, useEffect, useRef, useState } from 'react'

import Combobox from '../combobox/Combobox'
import Column from '../table/simpleTable/Column'


type columnType = {
    table:string[],
    title:string,
    subtitle?:string
}

type tableType = {
    table: {
        [key: string]: columnType
    }
}



const SyncComboboxColumn: React.FC<tableType> = ({table}) => {
    // let headers = Object.keys(table);
    let headers = Object.values(table).map(val=>val.title);
    let indexs = Object.keys(table)

    let [chosenHeader,setChosenHeader] = useState<string|number>(indexs[0]);
    let [tableInnfo,setTableInfo] = useState<string[]|[]>([]);

    useEffect(()=>{
        setTableInfo(table[chosenHeader].table)
    },[chosenHeader])
   
    
    return (
        <div style={{ width: "100%" }}>
            <Column table={tableInnfo}>
                <Combobox enumProp={true} data={headers} onChangeIndex={setChosenHeader}></Combobox>
            </Column>
         
        </div>
    )
}


export default SyncComboboxColumn