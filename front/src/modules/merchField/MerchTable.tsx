import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import s from "./tableStyle.module.css";
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import MerchBuyBlock from './MerchBuyBlock';
import { deleteCartData } from 'src/providers/shopProvider';
import { cartCountAction } from 'src/store/reducers/menuSlice';
import Button from 'src/components/Button';
import { toPrice } from 'src/global';
import SVGIcon from 'src/components/svgIcon/SvgIcon';
import NumInputVertical from 'src/components/input/NumInputVertical';
type TableType = {
    tableData: any[];
    onChange?: (newTableData: {}) => void;
    onDelete?: (ind: number, preorder_id:number,quantity:number) => void;
    className?: string;
};

const MerchTable: React.FC<TableType> = memo(({ tableData, onChange, className,onDelete }) => {
    const dispatch = useAppDispatch();
    const { cartCount } = useAppSelector(state => state.menuReducer);
    const cartCountRef = useRef<number>(cartCount);

    // Update ref when cartCount changes
    useEffect(() => {
        cartCountRef.current = cartCount;
    }, [cartCount]);

    // Memoized headers
    const headers = useMemo(() => [
        <th key="merch" className={s.tableHeader}>
            <span>Продукт</span>
        </th>,
        <th key="quantity" className={s.tableHeader}>
            <span>Количество</span>
        </th>,
        <th key="price" className={s.tableHeader}>
            <span>Цена</span>
        </th>,
        <th key="actions" className={s.tableHeader}>
            <span>Действия</span>
        </th>
    ], []);

    // Update handler
    const handleUpdateList = useCallback((index: number, productId: number, quantity: number) => {
        deleteCartData(productId, () => {
            dispatch(cartCountAction(cartCountRef.current - quantity));
            const newTableData = [...tableData];
            newTableData.splice(index, 1);
        });
    }, [dispatch, tableData]);

    // Memoized table rows
    const tableRows = useMemo(() => {
        return tableData.map((el, ind) => (
            <tr key={`${el.id}-${ind}`} className={s.tableRow}>
                <td className={s.productCell}>
                    <MerchBuyBlock
                        onChange={() => { }}
                        data={{
                            id: el.id,
                            firm: el.firm,
                            price: el.size,
                            name: el.name,
                            imgs: el.img
                        }}
                    />
                </td>
                <td className={s.quantityCell}>
                    <NumInputVertical value={el.quantity} onChange={(newQuantity) => {
                        onChange({
                            id: el.id,
                            size: el.size,
                            dif: newQuantity - el.quantity,
                        })
                    }} />
                </td>
                <td className={s.priceCell}>
                    <span className={s.priceValue}>{toPrice(el.price * el.quantity)}</span>
                </td>
                <td className={s.actionsCell}>
                    <div onClick={() => onDelete(ind, el.preorder_id, el.quantity)}
                        className={s.deleteBtn}>
                        <SVGIcon spritePath="bin" />
                    </div>
                </td>
            </tr>
        ));
    }, [tableData, handleUpdateList]);

    return (
        <div className={s.tableContainer}>
            <table className={`${s.merchTable} ${className}`}>
                <thead>
                    <tr className={s.tableHeaderRow}>{headers}</tr>
                </thead>
                <tbody>
                    {tableRows}
                </tbody>
            </table>
        </div>
    );
});

export default MerchTable;