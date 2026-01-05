import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import s from "./style.module.css";
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import MerchBuyBlock from './MerchBuyBlock';
import { deleteCartData } from 'src/providers/shopProvider';
import { cartCountAction } from 'src/store/reducers/menuSlice';
import Button from 'src/components/Button';
import { toPrice } from 'src/global';

type TableType = {
    tableData: any[];
    className?: string;
};

const MerchTable: React.FC<TableType> = memo(({ tableData, className }) => {
    const dispatch = useAppDispatch();
    const { cartCount } = useAppSelector(state => state.menuReducer);
    const cartCountRef = useRef<number>(cartCount);
    
    // Update ref when cartCount changes
    useEffect(() => {
        cartCountRef.current = cartCount;
    }, [cartCount]);

    // Memoized headers
    const headers = useMemo(() => [
        <th key="merch" style={{ textAlign: "left" }}>
            <div><span>Продукт</span></div>
        </th>,
        <th key="quantity" style={{ textAlign: "center" }}>
            <div><span>Количество</span></div>
        </th>,
        <th key="price" style={{ textAlign: "right" }}>
            <div><span>Цена</span></div>
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
            <tr key={`${el.id}-${ind}`}>
                <td style={{ width: "60%" }}>
                    <MerchBuyBlock 
                        onChange={() => {}} 
                        data={{ 
                            id: el.id, 
                            firm: el.firm, 
                            price: el.size, 
                            name: el.name, 
                            imgs: el.img 
                        }} 
                    />
                </td>
                <td style={{ textAlign: "center" }}>{el.quantity}</td>
                <td style={{ textAlign: "right" }}>{toPrice(el.price * el.quantity)}</td>
                <td style={{ textAlign: "center" }}>
                    <Button 
                        onClick={() => handleUpdateList(ind, el.prid, el.quantity)} 
                        className={s.deleteBtn} 
                    />
                </td>
            </tr>
        ));
    }, [tableData, handleUpdateList]);

    return (
        <table 
            className={className} 
            style={{
                borderCollapse: 'collapse',
                borderSpacing: '0px',
                width: "100%",
                textAlign: "left"
            }}
        >
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>
                {tableRows}
            </tbody>
        </table>
    );
});

export default MerchTable;