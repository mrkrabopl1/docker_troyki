import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import Combobox from '../combobox/Combobox'
import Column from '../table/simpleTable/Column'

type ColumnType = {
    table: string[]
    title: string
    subtitle?: string
}

type TableType = {
    [key: string]: ColumnType
}

const SyncComboboxColumn: React.FC<{ table: TableType }> = ({ table }) => {
    // Memoize headers and indexes to prevent unnecessary recalculations
    const [headers, indexes] = useMemo(() => {
        const tableValues = Object.values(table)
        return [
            tableValues.map(val => val.title),
            Object.keys(table)
        ]
    }, [table])

    const [chosenHeader, setChosenHeader] = useState<string>(indexes[0])
    
    // Get current table data directly from props instead of separate state
    const currentTableData = table[chosenHeader]?.table || []

    return (
        <div style={{ width: "100%" }}>
            <Column table={currentTableData}>
                <Combobox 
                    enumProp 
                    data={headers} 
                    onChangeIndex={setChosenHeader} 
                />
            </Column>
        </div>
    )
}

export default React.memo(SyncComboboxColumn)