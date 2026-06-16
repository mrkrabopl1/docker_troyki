import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getOrderCartData } from 'src/providers/shopProvider';
import { getOrderDataByHash, getOrderDataByMail } from 'src/providers/orderProvider';
import OrderInfo from 'src/components/orderInfo/orderInfo';
import OrderForm from 'src/modules/sendForm/OrderForm';
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField';
import MapComponent from 'src/modules/map/Map';
import { getCookie } from 'src/global';
import s from "./style.module.css";
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

interface OrderData {
    name: string;
    secondName: string;
    mail: string;
    phone: string;
    price: string;
    orderId: number;
    index: string;
}

interface Address {
    town: string;
    region: string;
    home: string;
    flat: string;
    street: string;
    coordinates: [number, number];
}

interface OrderState {
    orderData: OrderData;
    address: Address;
    orderId: number;
}

const OrderPage: React.FC = () => {
    const router = useRouter();
    const hash = (router.query.hash as string) || '';
    const dispatch = useAppDispatch();
    const [products, setProducts] = useState([]);
    const [order, setOrder] = useState<OrderState>({
        orderData: {
            name: "",
            secondName: "",
            mail: "",
            phone: "",
            price: "",
            orderId: 0,
            index: "",
        },
        address: {
            town: "",
            region: "",
            home: "",
            flat: "",
            street: "",
            coordinates: [0, 0]
        },
        orderId: 0
    });

    const cookie = useRef(getCookie(hash));
    const fullPrice = useRef(0);

    useEffect(() => {
        if (!hash) return;
        
        if (cookie.current) {
            getOrderDataByHash(hash, (data) => {
                dispatch(finishLoading());
                setProducts(data.cartData);
                setOrder({
                    address: data.address,
                    orderData: data.userInfo,
                    orderId: data.orderId
                });
            });
        } else {
            getOrderCartData(hash, (data) => {
                dispatch(finishLoading());
                fullPrice.current = data.fullPrice;
                setProducts(data);
            });
        }
    }, [hash]);

    const handleOrderFormSubmit = (data: { mail: string; orderId: string }) => {
        getOrderDataByMail(data.mail, data.orderId, (resp) => {
            cookie.current = getCookie(hash);
            setOrder(prev => ({
                ...prev,
                orderData: resp.userInfo,
                orderId: resp.orderId
            }));
        });
    };

    return (
        <div className={s.orderContainer}>
            <div className={s.orderInfoSection}>
                {cookie.current ? (
                    <>
                        <MapComponent location={order.address.coordinates} />
                        <OrderInfo
                            address={order.address}
                            orderData={order.orderData}
                            orderId={order.orderId}
                        />
                    </>
                ) : (
                    <OrderForm onChange={handleOrderFormSubmit} />
                )}
            </div>

            <div className={s.merchSection}>
                <BuyMerchField data={products} />
            </div>
        </div>
    );
};

export default OrderPage;