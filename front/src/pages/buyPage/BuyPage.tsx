import React, { useEffect, useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { getCartData, deleteCartData } from 'src/providers/shopProvider';
import { getCookie } from 'src/global';
import { cartCountAction } from 'src/store/reducers/menuSlice';
import { toPrice } from 'src/global';
import { createPreorder, updatePreorder } from 'src/providers/orderProvider';
import MerchTable from 'src/modules/merchField/MerchTable';
import Button from 'src/components/Button';
import s from "./style.module.css";
import MerchBuyField from 'src/modules/merchField/MerchBuyField';

interface CartItem {
    id: number;
    img: string;
    name: string;
    price: number;
    quantity: number;
    sizes: {
        [key: string]: number;
    };
}

interface UpdateData {
    id: number;
    size: string;
    dif: number;
}
interface BuyMerchFieldProps {
    onActivate?: () => void;
}

const BuyPage: React.FC<BuyMerchFieldProps>  = memo((props) => {
    const { onActivate } = { ...props };
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { cartCount, shop } = useAppSelector(state => state.menuReducer);
    const [tableData, setTableData] = useState<CartItem[]>([]);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const cart = getCookie("cart");

    const hasItems = cartCount > 0;

    useEffect(() => {
        if (!hasItems) return;

        getCartData(cart, (data) => {
            const calculatedTotal = data.reduce(
                (sum, item) => sum + (item.price * item.quantity), 0
            );

            setTotalPrice(calculatedTotal);
            setTableData(data);
        })
    }, [cart, hasItems]);

    const handleCheckout = () => {
        onActivate?.();
        navigate("/form/" + cart)
    };

    const deleteProductHandler = useCallback((ind, productId, quantity) => {
        deleteCartData(productId, () => {
            dispatch(cartCountAction(cartCount - quantity));
            const newTableData = [...tableData];
            newTableData.splice(ind, 1);
            setTableData(newTableData);
        });
    }, [cartCount, dispatch, tableData]);
    // Используем useCallback чтобы функция не пересоздавалась и имела актуальные зависимости
    const updateCount = useCallback((data: UpdateData) => {
        const cart = getCookie("cart");
        updatePreorder({
            id: data.id,
            size: data.size,
            hashUrl: cart
        }, () => {
            // Получаем актуальное значение cartCount из store
            const currentCartCount = cartCount;
            dispatch(cartCountAction(currentCartCount + data.dif));

            // Также обновляем локальное состояние таблицы
            setTableData(prevData => {
                const newData = prevData.map(item =>
                    item.id === data.id
                        ? { ...item, quantity: Math.max(0, item.quantity + data.dif) }
                        : item
                ).filter(item => item.quantity > 0);

                // Пересчитываем общую сумму
                const newTotal = newData.reduce(
                    (sum, item) => sum + (item.price * item.quantity), 0
                );
                setTotalPrice(newTotal);

                return newData;
            });
        });
    }, [cartCount, dispatch]); // Добавляем зависимости

    if (!hasItems) {
        return (
            <div className={s.emptyCart}>
                <div>Корзина пуста</div>
                <Button
                    className={`${s.btn} btnStyle`}
                    text='Продолжить покупки'
                    onClick={() => navigate('/')} // Исправлено: ведем на главную, а не на форму
                />
            </div>
        );
    }

    return (
        <div className={s.main}>
            <div className={s.headerSection}>
                <h2 className={s.pageTitle}>Корзина</h2>
                <div className={s.itemsCount}>{cartCount} товар{cartCount !== 1 ? 'а' : ''}</div>
            </div>

            <div className={s.tableContainer}>
                <MerchBuyField onDelete={deleteProductHandler} onChange={updateCount} tableData={tableData} />
            </div>

            <div className={s.summarySection}>
                <div className={s.summaryCard}>
                    <div className={s.priceBreakdown}>
                        <div className={s.priceRow}>
                            <span>Промежуточный итог:</span>
                            <span className={s.priceValue}>{toPrice(totalPrice)}</span>
                        </div>
                        <div className={s.priceRow}>
                            <span>Доставка:</span>
                            <span className={s.deliveryNote}>рассчитывается при оформлении</span>
                        </div>
                        <div className={s.divider}></div>
                        <div className={s.totalRow}>
                            <span>Общая стоимость:</span>
                            <span className={s.totalPrice}>{toPrice(totalPrice)}</span>
                        </div>
                    </div>

                    <div className={s.taxNote}>
                        💫 Все налоги и таможенные сборы включены в стоимость
                    </div>

                    <Button
                        className={s.checkoutBtn}
                        text='Перейти к оформлению'
                        onClick={handleCheckout}
                    />

                    <div className={s.continueShopping} onClick={() => {
                        onActivate?.();
                        navigate('/');
                    }}>
                        ← Продолжить покупки
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BuyPage;