import React, { useMemo, useState, memo } from 'react';
import Combobox from 'src/components/combobox/Combobox';
import s from "./style.module.css";

type ColumnType = {
    title: string;
    subtitle?: string;
    table: string[];
};

type TableProps = {
    table: ColumnType[];
    comboTable?: ColumnType[];
    className?: string;
};

const TableWithComboboxColumn: React.FC<TableProps> = memo(({
    table,
    comboTable,
    className
}) => {
    const [selectedIndex, setSelectedIndex] = useState<string>("0");

    const comboBoxHeaders = useMemo(() =>
        comboTable ? comboTable.map(val => val.title) : [],
        [comboTable]
    );

    const renderHeaders = useMemo(() => (
        <>
            {table.map((val, id) => (
                <th key={`header-${val.title}-${id}`} className={s.tableHeader}>
                    <div className={s.headerContent}>
                        <span className={s.headerTitle}>{val.title}</span>
                        {val.subtitle && (
                            <span className={s.headerSubtitle}>{val.subtitle}</span>
                        )}
                    </div>
                </th>
            ))}
            {comboTable && (
                <th key="combo-header" className={s.comboHeader}>
                    <div className={s.comboHeaderContent}>
                        <Combobox
                            enumProp={true}
                            data={comboBoxHeaders}
                            onChangeIndex={setSelectedIndex}
                            className={s.combobox}
                        />
                    </div>
                </th>
            )}
        </>
    ), [table, comboBoxHeaders, comboTable]);

    const renderRows = useMemo(() => {
        if (table.length === 0 || table[0].table.length === 0) {
            return (
                <tr>
                    <td colSpan={table.length + (comboTable ? 1 : 0)} className={s.emptyCell}>
                        <div className={s.emptyState}>
                            Нет данных для отображения
                        </div>
                    </td>
                </tr>
            );
        }

        return table[0].table.map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`} className={s.tableRow}>
                {table.map((col, colIndex) => (
                    <td key={`cell-${rowIndex}-${colIndex}`} className={s.tableCell}>
                        <div className={s.cellContent}>
                            {col.table[rowIndex]}
                        </div>
                    </td>
                ))}
                {comboTable && (
                    <td key={`combo-cell-${rowIndex}`} className={s.comboCell}>
                        <div className={s.cellContent}>
                            {comboTable[selectedIndex]?.table[rowIndex]}
                        </div>
                    </td>
                )}
            </tr>
        ));
    }, [table, comboTable, selectedIndex]);

    return (
        <div className={s.tableContainer}>
            <table
                onClick={(e) => e.stopPropagation()}
                className={`${s.table} ${className || ''}`}
            >
                <thead>
                    <tr className={s.headerRow}>
                        {renderHeaders}
                    </tr>
                </thead>
                <tbody>
                    {renderRows}
                </tbody>
            </table>
        </div>
    );
});

export default TableWithComboboxColumn;