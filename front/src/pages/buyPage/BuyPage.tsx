import React, { useEffect, useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux';
import { getCartData } from 'src/providers/shopProvider';
import { getCookie } from 'src/global';
import { toPrice } from 'src/global';
import MerchTable from 'src/modules/merchField/MerchTable';
import Button from 'src/components/Button';
import s from "./style.module.css";

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

const BuyPage: React.FC = memo(() => {
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
                    const calculatedTotal = data.cartData.reduce(
                        (sum, item) => sum + (item.price * item.quantity), 0
                    );

                    setTotalPrice(calculatedTotal);
                    setTableData(data.cartData);
                })
    }, [cart, hasItems]);

    const handleCheckout = () => {
        navigate(`/form/${cart}`);
    };

    if (!hasItems) {
        return (
            <div className={s.emptyCart}>
                <div>Корзина пуста</div>
                <Button
                    className={`${s.btn} btnStyle`}
                    text='Продолжить покупки'
                    onClick={handleCheckout}
                />
            </div>
        );
    }

    return (
        <div className={s.main}>
            <h2>Корзина</h2>
            <MerchTable tableData={tableData} />

            <div className={s.summarySection}>
                <div className={s.fullPrice}>
                    Промежуточный итог: {toPrice(totalPrice)}
                </div>
                <p>
                    Все налоги и таможенные сборы включены.<br />
                    Стоимость доставки рассчитывается на этапе оформления заказа.
                </p>
                <Button
                    className={`${s.btn} btnStyle`}
                    text='Оформить заказ'
                    onClick={handleCheckout}
                />
            </div>
        </div>
    );
});

export default BuyPage;