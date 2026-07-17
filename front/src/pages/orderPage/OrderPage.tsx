import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    deliverytype: string;
}

const OrderPage: React.FC = () => {
    const router = useRouter();
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
        orderId: 0,
        deliverytype: ""
    });

    const cookie = useRef<string | null>(null);
    const fullPrice = useRef(0);
    const hashRef = useRef<string>('');

    useEffect(() => {
        if (!router.isReady) return;
        const hash = router.query.hash as string;
        if (!hash) return;

        hashRef.current = hash;
        cookie.current = getCookie(hash);

        if (cookie.current) {
            getOrderDataByHash(hash, (data) => {
                dispatch(finishLoading());
                setProducts(data.cartData || []);
                setOrder({
                    address: data.address,
                    orderData: data.userInfo,
                    orderId: data.orderId,
                    deliverytype: data.deliverytype
                });
            });
        } else {
            getOrderCartData(hash, (data) => {
                dispatch(finishLoading());
                fullPrice.current = data.fullPrice;
                setProducts(data);
            });
        }
    }, [router.isReady, router.query.hash, dispatch]);

    const handleOrderFormSubmit = useCallback((data: { mail: string; orderId: string }) => {
        const hash = hashRef.current;
        if (!hash) return;

        getOrderDataByMail(data.mail, data.orderId, (resp) => {
            cookie.current = getCookie(hash);
            setOrder({
                address: resp.address,
                orderData: resp.userInfo,
                orderId: resp.orderId,
                deliverytype: resp.deliverytype
            });
            
            if (resp.cartData) {
                setProducts(resp.cartData);
            }
        });
    }, []);

    return (
        <div className={s.orderContainer}>
            <div className={s.orderInfoSection}>
                {cookie.current ? (
                    <>
                        {order.deliverytype === "own" ? (
                            <MapComponent 
                                location={[37.67575303913705, 55.77123033359646]}
                                path={[
                                    [37.67872961851563, 55.77235933513177],
                                    [37.678807584960055, 55.77199699513815],
                                    [37.67807365625907, 55.771894140358],
                                    [37.67739957099823, 55.771977085319776],
                                    [37.67668956233416, 55.77173756626368],
                                    [37.67651327214742, 55.77175072741187],
                                    [37.675834007076304, 55.77139685269603],
                                    [37.67578345483358, 55.771320747312586],
                                    [37.67569282878247, 55.7712895064023]
                                ]}
                            />
                        ) : (
                            <MapComponent location={order.address.coordinates} />
                        )}
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