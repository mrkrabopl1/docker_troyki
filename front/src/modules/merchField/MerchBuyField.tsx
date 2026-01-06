import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import s from "./tableStyle.module.css";
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import MerchBuyBlockWithControls from './MerchBuyBlockWithControls';

type TableType = {
    tableData: any[];
    onChange?: (data: { id: number; size: string; dif: number }) => void;
    onDelete?: (ind: number, preorder_id: number, quantity: number) => void;
    className?: string;
};

const MerchBuyField: React.FC<TableType> = memo(({ tableData, onChange, className, onDelete }) => {
    const { cartCount } = useAppSelector(state => state.menuReducer);
    const cartCountRef = useRef<number>(cartCount);

    // Update ref when cartCount changes
    useEffect(() => {
        cartCountRef.current = cartCount;
    }, [cartCount]);

    // Обработчик изменения количества
    const handleQuantityChange = useCallback((data: { id: number; size: string; dif: number }) => {
        onChange?.(data);
    }, [onChange]);

    // Обработчик удаления товара
    const handleDelete = useCallback((ind: number, preorder_id: number, quantity: number) => {
        onDelete?.(ind, preorder_id, quantity);
    }, [onDelete]);

    // Memoized table rows
    const tableRows = useMemo(() => {
        return tableData.map((el, ind) => (
            <div key={`${el.id}-${ind}-${el.size}`} className={s.tableRow}>
                <MerchBuyBlockWithControls
                    data={{
                        id: el.id,
                        firm: el.firm,
                        price: el.size,
                        name: el.name,
                        imgs: el.img
                    }}
                    quantity={el.quantity}
                    onChange={(newQuantity) => handleQuantityChange({
                        id: el.id,
                        size: el.size,
                        dif: newQuantity - el.quantity,
                    })}
                    onDelete={() => handleDelete(ind, el.preorder_id, el.quantity)}
                />
            </div>
        ));
    }, [tableData, handleQuantityChange, handleDelete]);

    return (
        <div className={`${s.tableContainer} ${className || ''}`}>
            {tableRows.length > 0 ? (
                tableRows
            ) : (
                <div className={s.emptyState}>
                    <p>Корзина пуста</p>
                </div>
            )}
        </div>
    );
});

export default MerchBuyField;