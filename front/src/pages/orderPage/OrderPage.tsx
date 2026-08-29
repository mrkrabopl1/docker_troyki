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

interface PromoState {
    code: string;
    discount: number;
    id: number | null;
    isValid: boolean;
    message: string;
}

// Функция применения скидки к matching_products
const applyDiscountToMatchingProducts = (products: any[], promoData: any) => {
    if (!promoData?.matching_products?.length) {
        return products.map(item => ({
            ...item,
            has_discount: false,
            original_price: item.price,
            discount_percent: 0,
            discount_applied: 0
        }));
    }

    const matchingIds = new Set(promoData.matching_products);
    const matchingProducts = products.filter(item => matchingIds.has(item.id));
    const matchingTotal = matchingProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (matchingTotal === 0) {
        return products.map(item => ({
            ...item,
            has_discount: false,
            original_price: item.price,
            discount_percent: 0,
            discount_applied: 0
        }));
    }

    let totalDiscount = 0;
    if (promoData.discount_type === 'percent') {
        totalDiscount = (matchingTotal * promoData.discount_value) / 100;
        if (promoData.max_discount && promoData.max_discount > 0) {
            totalDiscount = Math.min(totalDiscount, promoData.max_discount);
        }
    } else {
        totalDiscount = Math.min(promoData.discount_value, matchingTotal);
        if (promoData.max_discount && promoData.max_discount > 0) {
            totalDiscount = Math.min(totalDiscount, promoData.max_discount);
        }
    }

    return products.map(item => {
        const isMatching = matchingIds.has(item.id);
        if (!isMatching) {
            return {
                ...item,
                has_discount: false,
                original_price: item.price,
                discount_percent: 0,
                discount_applied: 0
            };
        }

        const itemTotal = item.price * item.quantity;
        const itemDiscount = matchingTotal > 0 ? (itemTotal / matchingTotal) * totalDiscount : 0;
        const newPrice = Math.round((item.price - (itemDiscount / item.quantity)) * 100) / 100;

        return {
            ...item,
            original_price: item.price,
            price: Math.max(newPrice, 0.01),
            discount_applied: Math.round(itemDiscount * 100) / 100,
            has_discount: true,
            discount_percent: promoData.discount_value
        };
    });
};

const OrderPage: React.FC = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [products, setProducts] = useState([]);
    const [promoState, setPromoState] = useState<PromoState>({
        code: '',
        discount: 0,
        id: null,
        isValid: false,
        message: ''
    });
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
                if(!data)return
                dispatch(finishLoading());
                
                // Применяем скидку к товарам, если есть промокод
                let productsData = data.cartData || [];
                let promoDiscount = 0;
                let promoCodeId = null;
                let promoCodeName = '';
               
                if (data.promocode) {
                    const promoData = data.promocode;
                    promoCodeName = promoData.code || '';
                    promoCodeId = data.promoCodeId || null;
                    
                    // Применяем скидку к товарам
                    productsData = applyDiscountToMatchingProducts(productsData, promoData);
                    
                    // Считаем общую скидку
                    promoDiscount = Math.round(productsData
                        .filter(item => item.has_discount)
                        .reduce((sum, item) => sum + (item.discount_applied || 0), 0));
                    
                    setPromoState({
                        code: promoCodeName,
                        discount: promoDiscount,
                        id: promoCodeId,
                        isValid: true,
                        message: `Промокод применён! Скидка: ${promoDiscount} ₽`
                    });
                } else {
                    setPromoState({
                        code: '',
                        discount: 0,
                        id: null,
                        isValid: false,
                        message: ''
                    });
                }
                
                setProducts(productsData);
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
                
                // Применяем скидку к товарам, если есть промокод
                let productsData = data.items || [];
                
                if (data.promo_code_snapshot) {
                    const promoData = data.promo_code_snapshot;
                    productsData = applyDiscountToMatchingProducts(productsData, promoData);
                    
                    const totalDiscount = productsData
                        .filter(item => item.has_discount)
                        .reduce((sum, item) => sum + (item.discount_applied || 0), 0);
                    
                    setPromoState({
                        code: promoData.code || '',
                        discount: totalDiscount,
                        id: data.promo_code_id || null,
                        isValid: true,
                        message: `Промокод применён! Скидка: ${totalDiscount} ₽`
                    });
                } else {
                    setPromoState({
                        code: '',
                        discount: 0,
                        id: null,
                        isValid: false,
                        message: ''
                    });
                }
                
                setProducts(productsData);
            });
        }
    }, [router.isReady, router.query.hash, dispatch]);

    const handleOrderFormSubmit = useCallback((data: { mail: string; orderId: string }) => {
        const hash = hashRef.current;
        if (!hash) return;

        getOrderDataByMail(data.mail, data.orderId, (resp) => {
            cookie.current = getCookie(hash);
            
            // Применяем скидку к товарам, если есть промокод
            let productsData = resp.cartData || [];
            
            if (resp.promoCodeSnapshot) {
                const promoData = resp.promoCodeSnapshot;
                productsData = applyDiscountToMatchingProducts(productsData, promoData);
                
                const totalDiscount = productsData
                    .filter(item => item.has_discount)
                    .reduce((sum, item) => sum + (item.discount_applied || 0), 0);
                
                setPromoState({
                    code: promoData.code || '',
                    discount: totalDiscount,
                    id: resp.promoCodeId || null,
                    isValid: true,
                    message: `Промокод применён! Скидка: ${totalDiscount} ₽`
                });
            } else {
                setPromoState({
                    code: '',
                    discount: 0,
                    id: null,
                    isValid: false,
                    message: ''
                });
            }
            
            setProducts(productsData);
            setOrder({
                address: resp.address,
                orderData: resp.userInfo,
                orderId: resp.orderId,
                deliverytype: resp.deliverytype
            });
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
                <BuyMerchField 
                    edit={false}
                    data={products}
                    promoState={promoState}
                    onPromoCodeChange={() => {}} // Для просмотра заказа промокод менять нельзя
                    onPromoCodeApply={() => {}}
                    onPromoCodeRemove={() => {}}
                    isCheckingPromo={false}
                />
            </div>
        </div>
    );
};

export default OrderPage;