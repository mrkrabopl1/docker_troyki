import React, { useMemo, memo } from 'react';
import s from "./style.module.css";
import DynamicElement from 'src/components/dynamicElement/DynamicElement';

type DynamicElementType = {
    componentName: string;
    propsData: any;
};

type TableProps = {
    table: (DynamicElementType | string | number)[][];
    headers: string[];
    className?: string;
    key?: string;
};

const tableStyle: React.CSSProperties = {
    borderCollapse: 'collapse',
    borderSpacing: '0px',
    width: "100%"
};

const DynamicTableComponent: React.FC<TableProps> = ({ 
    table, 
    headers, 
    className 
}) => {
    const renderHeaders = useMemo(() => (
        headers.map((val, id) => (
            <th key={`header-${id}`}>
                <div>
                    <span>{val}</span>
                </div>
            </th>
        ))
    ), [headers]);

    const renderRows = useMemo(() => (
        table.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
                {row.map((cell, cellIndex) => {
                    if (typeof cell === "string" || typeof cell === "number") {
                        return <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>;
                    }
                    return (
                        <td key={`cell-${rowIndex}-${cellIndex}`}>
                            <DynamicElement {...cell} />
                        </td>
                    );
                })}
            </tr>
        ))
    ), [table]);

    return (
        <table className={className} style={tableStyle}>
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

export default memo(DynamicTableComponent);