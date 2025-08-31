import React, { useMemo, useState, memo } from 'react';
import Combobox from 'src/components/combobox/Combobox';

type ColumnType = {
    title: string;
    subtitle?: string;
    table: string[];
};

type TableProps = {
    table: ColumnType[];
    comboTable: ColumnType[];
    className?: string;
};

const tableStyle: React.CSSProperties = {
    borderCollapse: 'collapse',
    borderSpacing: '0px',
    width: "100%"
};

const TableWithComboboxColumn: React.FC<TableProps> = ({ 
    table, 
    comboTable, 
    className 
}) => {
    const [selectedIndex, setSelectedIndex] = useState<string>("0");
    const columnWidth = `${100 / (table.length + 1)}%`;

    const comboBoxHeaders = useMemo(() => 
        comboTable.map(val => val.title), 
        [comboTable]
    );

    const renderHeaders = useMemo(() => (
        <>
            {table.map((val, id) => (
                <th key={`header-${val.title}-${id}`} style={{ width: columnWidth }}>
                    <div>
                        <span>{val.title}</span>
                    </div>
                </th>
            ))}
            <th key="combo-header" style={{ width: columnWidth }}>
                <div>
                    <Combobox 
                        enumProp={true} 
                        data={comboBoxHeaders} 
                        onChangeIndex={setSelectedIndex} 
                    />
                </div>
            </th>
        </>
    ), [table, comboBoxHeaders, columnWidth]);

    const renderRows = useMemo(() => {
        if (table.length === 0 || table[0].table.length === 0) return null;

        return table[0].table.map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
                {table.map((col, colIndex) => (
                    <td key={`cell-${rowIndex}-${colIndex}`}>
                        {col.table[rowIndex]}
                    </td>
                ))}
                <td key={`combo-cell-${rowIndex}`}>
                    {comboTable[selectedIndex]?.table[rowIndex]}
                </td>
            </tr>
        ));
    }, [table, comboTable, selectedIndex]);

    return (
        <table 
            onClick={(e) => e.stopPropagation()} 
            className={className} 
            style={tableStyle}
        >
            <thead>
                <tr>
                    {renderHeaders}
                </tr>
            </thead>
            <tbody>
                {renderRows}
            </tbody>
        </table>
    );
};

export default TableWithComboboxColumn;