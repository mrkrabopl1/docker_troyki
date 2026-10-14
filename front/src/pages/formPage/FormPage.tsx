import React, { useEffect, useRef, useState, memo, useCallback } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import s from "./style.module.css"
import { cartCountAction } from 'src/store/reducers/menuSlice'
import { useAppDispatch, useNavigate } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder } from 'src/providers/orderProvider';
import { checkCustomerData, getMe, type Address } from 'src/providers/userProvider';
import { useRouter } from 'next/router';
import DeliveryRadioGroup from './pageElements/DeliveryRadio';
import Button from 'src/components/Button';
import DeliveryPage from './pageElements/DeliveryPage';
import PayBlock from './pageElements/PayBlock';
import LinkButton from 'src/components/LinkButton';
import ContactForm from 'src/modules/sendForm/ContactForm';
import MapComponent from 'src/modules/map/Map';
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { validatePromoCode } from 'src/providers/adminPromoCodesProvider';
import AddressSelector from './pageElements/AddressSelector';   // 👈

interface PromoState {
    code: string;
    discount: number;
    id: number | null;
    isValid: boolean;
    message: string;
}

const BUY_ROUTE = [
    ["Перейти к доставке", "Перейти к оплате", "Завершить заказ"],
    ["Перейти к оплате", "Завершить заказ"]
];

const BACK_ROUTE = [
    ["Вернуться к экрану с информацией", "Вернуться к доставке"],
    ["Вернуться к экрану с информацией"]
];

function formatAddress(address: any): string {
    if (!address) return '';
    const parts: string[] = [];
    if (address.town) parts.push(`г.${address.town}`);
    if (address.settlement) parts.push(`${address.settlement}`);
    if (address.street && address.house) parts.push(`ул. ${address.street}`);
    if (address.house) parts.push(`д. ${address.house}`);
    if (address.flat) parts.push(`кв. ${address.flat}`);
    return parts.join(', ');
}

const FormPage: React.FC = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { hash } = router.query;
    const [products, setProducts] = useState<any[]>([]);
    const [originalProducts, setOriginalProducts] = useState<any[]>([]);
    const delivery = useRef(0);
    const contactInfo = useRef<Record<string, string>>({
        "Имя": "",
        "Фамилия": "",
        "mail": "",
        "Телефон": ""
    });
    const addressInfo = useRef<Record<string, string>>({
        "Дом": "",
        "Квартриа": "",
        "Улица": "",
        "Почтовый индекс": "",
        "Город": "",
        "Регион": "",
        "Село": "",
        "Поселок": ""
    });
    const formId = useRef(0);
    const memoSendForm = useRef(true);
    const respData = useRef<any>({});
    const validSendForm = useRef(false);
    const fullPrice = useRef(0);
    const [inProgress, setInProgress] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const checkValid = useRef(false);
    const formData = useRef<any>({
        name: "",
        mail: "",
        secondName: "",
        address: null,
        phone: "",
        deliveryType: "curier",
        deliveryComment: ""
    });
    const matchingProductsRef = useRef<number[]>([]);

    // 👇 AUTH + ВЫБОР АДРЕСА
    const [isLogged, setIsLogged] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

    const [promoState, setPromoState] = useState<PromoState>({
        code: '',
        discount: 0,
        id: null,
        isValid: false,
        message: ''
    });

    const [totalPrice, setTotalPrice] = useState(0);

    const applyDiscountToMatchingProducts = (products: any[], promoData: any) => {
        if (!promoData?.matching_products?.length) {
            return products.map(item => ({
                ...item,
                has_discount: false,
                price: item.price,
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
                price: item.price,
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
                    price: item.price,
                    discount_percent: 0,
                    discount_applied: 0
                };
            }

            const itemTotal = item.price * item.quantity;
            const itemDiscount = matchingTotal > 0 ? (itemTotal / matchingTotal) * totalDiscount : 0;
            const newPrice = Math.round(((item.price - (itemDiscount / item.quantity)) * 100) / 100);

            return {
                ...item,
                discount_price: Math.max(newPrice, 0.01),
                price: item.price,
                discount_applied: Math.round(itemDiscount * 100) / 100,
                has_discount: true,
                discount_percent: promoData.discount_value
            };
        });
    };

    // Загрузка корзины + auth
    useEffect(() => {
        getCartData(hash, (data) => {
            dispatch(finishLoading());
            fullPrice.current = data.fullPrice;
            const total = data.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
            setTotalPrice(total);
            setProducts(data);
            setOriginalProducts(data);

            // 👇 Для гостя (незарегистрированного) — подтягиваем данные
            checkCustomerData((customerData) => {
                if (customerData) {
                    memoSendForm.current = !memoSendForm.current;
                    customerData.address.value = formatAddress(customerData.address)
                    Object.assign(formData.current, customerData);
                    setRefresh(prev => !prev);
                    setInProgress(true);
                }
            });
        });

        // 👇 Проверяем, залогинен ли юзер
        (async () => {
            const user = await getMe();
            setIsLogged(!!user);
            if (user) {
                // Для залогиненного сразу заполняем контакты из профиля
                contactInfo.current["Имя"] = user.name || '';
                contactInfo.current["Фамилия"] = user.secondName || '';
                contactInfo.current["mail"] = user.mail || '';
                contactInfo.current["Телефон"] = user.phone || '';
                formData.current.name = user.name || '';
                formData.current.secondName = user.secondName || '';
                formData.current.mail = user.mail || '';
                formData.current.phone = user.phone || '';
            }
        })();
    }, [hash]);

    // Пересчёт totalPrice при изменении продуктов
    useEffect(() => {
        if (products.length > 0) {
            const total = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
            setTotalPrice(total);
            fullPrice.current = total;
        }
    }, [products]);

    // 👇 Выбор адреса из списка
    const handleAddressSelect = useCallback((addr: Address) => {
        setSelectedAddressId(addr.id);

        formData.current.address = addr;

        // Обновляем addressInfo для отображения в PayBlock/DeliveryPage
        addressInfo.current["Город"] = addr.town || '';
        addressInfo.current["Улица"] = addr.street || '';
        addressInfo.current["Дом"] = addr.house || '';
        addressInfo.current["Квартриа"] = addr.flat || '';
        addressInfo.current["Почтовый индекс"] = addr.index || '';
        addressInfo.current["Регион"] = addr.region || '';
        addressInfo.current["Село"] = '';
        addressInfo.current["Поселок"] = addr.settlement || '';

        // Обновляем respData
        respData.current = {
            ...respData.current,
            personalData: {
                name: formData.current.name,
                phone: formData.current.phone,
                mail: formData.current.mail,
                secondName: formData.current.secondName || '',
            },
            address: {
                town: addr.town,
                street: addr.street,
                house: addr.house,
                flat: addr.flat,
                index: addr.index,
                region: addr.region,
                settlement: addr.settlement,
                coordinates: addr.coordinates,
            },
            address_id: addr.id,   // 👈 id для бэка
            save: formData.current.save,
            delivery: {
                deliveryPrice: 0,
                deliveryComment: formData.current.deliveryComment,
                type: delivery.current === 0 ? 'curier' : 'own',
            },
            preorderHash: hash,
        };

        validSendForm.current = true;   // раз адрес выбран — можно идти дальше
        setRefresh(prev => !prev);
    }, [hash]);

    const handlePromoCodeChange = useCallback((code: string) => {
        if (promoState.isValid) {
            setPromoState({
                code: code,
                discount: 0,
                id: null,
                isValid: false,
                message: ''
            });
            setProducts(originalProducts);
            const total = originalProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
            setTotalPrice(total);
            fullPrice.current = total;
            matchingProductsRef.current = [];
        } else {
            setPromoState(prev => ({ ...prev, code }));
        }
    }, [promoState.isValid, originalProducts]);

    const handlePromoCodeApply = useCallback(async () => {
        const trimmedCode = promoState.code.trim();
        if (!trimmedCode) {
            setPromoState(prev => ({ ...prev, message: 'Введите промокод', isValid: false }));
            return;
        }

        setPromoState(prev => ({ ...prev, message: 'Проверка...', isValid: false }));

        try {
            const response = await validatePromoCode({ code: trimmedCode, hash });

            if (!response.is_active) {
                setPromoState(prev => ({ ...prev, message: 'Промокод неактивен', isValid: false, discount: 0, id: null }));
                matchingProductsRef.current = [];
                return;
            }

            if (response.min_order && totalPrice < response.min_order) {
                setPromoState(prev => ({ ...prev, message: `Минимальная сумма заказа: ${(response.min_order / 100).toFixed(2)} ₽`, isValid: false }));
                matchingProductsRef.current = [];
                return;
            }

            if (response.max_order && totalPrice > response.max_order) {
                setPromoState(prev => ({ ...prev, message: `Максимальная сумма заказа: ${(response.max_order / 100).toFixed(2)} ₽`, isValid: false }));
                matchingProductsRef.current = [];
                return;
            }
            let totalDiscount
            if (response.applies_to === "global") {
                if (response.discount_type === "fixed") {
                    totalDiscount = response.discount_value
                } else {
                    totalDiscount = Math.round((response.discount_value * totalPrice / 100))
                }
            } else {
                matchingProductsRef.current = response.matching_products || [];

                const updatedProducts = applyDiscountToMatchingProducts(originalProducts, response);
                setProducts(updatedProducts);

                const newTotal = updatedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
                setTotalPrice(newTotal);
                fullPrice.current = newTotal;

                totalDiscount = Math.round(updatedProducts
                    .filter(item => item.has_discount)
                    .reduce((sum, item) => sum + (item.discount_applied || 0), 0));
            }

            setPromoState({
                code: trimmedCode,
                discount: totalDiscount,
                id: response.id || null,
                isValid: true,
                message: `Промокод применён! Скидка: ${totalDiscount.toFixed(2)} ₽`
            });

        } catch (error) {
            console.error('Error checking promo code:', error);
            setPromoState(prev => ({ ...prev, message: 'Промокод не найден или истёк', isValid: false, discount: 0, id: null }));
            matchingProductsRef.current = [];
        }
    }, [promoState.code, totalPrice, originalProducts, hash]);

    const handlePromoCodeRemove = useCallback(() => {
        setPromoState({
            code: '',
            discount: 0,
            id: null,
            isValid: false,
            message: ''
        });
        setProducts(originalProducts);
        const total = originalProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
        fullPrice.current = total;
        matchingProductsRef.current = [];
    }, [originalProducts]);

    const contactInfoChange = useCallback((data: any) => {
        contactInfo.current.Имя = data.name;
        contactInfo.current.Фамилия = data.secondName;
        contactInfo.current.mail = data.mail;
        contactInfo.current.Телефон = data.phone;

        formData.current.name = data.name;
        formData.current.secondName = data.secondName;
        formData.current.mail = data.mail;
        formData.current.phone = data.phone;

        respData.current = {
            ...respData.current,
            personalData: {
                name: data.name,
                phone: data.phone,
                mail: data.mail,
                secondName: data.secondName || '',
            },
            delivery: respData.current.delivery || {
                deliveryPrice: 0,
                deliveryComment: formData.current.deliveryComment,
                type: delivery.current === 0 ? 'curier' : 'own',
            },
            preorderHash: hash,
        };
    }, [hash]);

    const getForm = () => {
        switch (formId.current) {
            case 0:
                if (!delivery.current) {
                    // 👇 ЗАЛОГИНЕН — селектор адресов + контакты
                    if (isLogged) {
                        return (
                            <div>
                                <ContactForm
                                    checkValid={checkValid.current}
                                    memo={memoSendForm.current}
                                    valid={true}
                                    formValue={formData.current}
                                    onValid={(valid) => validSendForm.current = valid}
                                    onChange={contactInfoChange}
                                />

                                <h3 style={{ marginTop: 24, marginBottom: 12 }}>
                                    Адрес доставки
                                </h3>

                                <AddressSelector
                                    selectedId={selectedAddressId}
                                    onSelect={handleAddressSelect}
                                />
                            </div>
                        );
                    }

                    // 👇 ГОСТЬ — старая форма
                    return <SendForm
                        checkValid={checkValid.current}
                        memo={memoSendForm.current}
                        valid={true}
                        formValue={{ ...formData.current }}
                        onValid={(valid) => validSendForm.current = valid}
                        onChange={(data: any) => {
                            contactInfo.current.Имя = data.name;
                            contactInfo.current.Фамилия = data.secondName;
                            contactInfo.current.mail = data.mail;
                            contactInfo.current.Телефон = data.phone;
                            addressInfo.current.Город = data?.address?.town
                            addressInfo.current.Улица = data?.address?.street
                            addressInfo.current["Почтовый индекс"] = data?.address?.index
                            addressInfo.current["Дом"] = data?.address?.house
                            formData.current.name = data.name;
                            formData.current.secondName = data.secondName;
                            formData.current.address = { ...data.address };
                            formData.current.save = data.save;
                            formData.current.phone = data.phone;
                            formData.current.mail = data.mail;
                            formData.current.sendInfo = data.sendInfo
                            formData.current.deliveryComment = data.deliveryComment
                            respData.current = {
                                personalData: {
                                    name: data.name,
                                    phone: data.phone,
                                    mail: data.mail,
                                    secondName: data.secondName ? data.secondName : ""
                                },
                                address: { ...data.address },
                                save: data.save,
                                sendMail: data.save,
                                delivery: {
                                    deliveryPrice: 0,
                                    deliveryComment: formData.current.deliveryComment,
                                    type: delivery.current === 0 ? "curier" : "own"
                                },
                                preorderHash: hash
                            };
                        }}
                        className={{ combobox: s.combobox }}
                    />;
                } else {
                    // 👇 САМОВЫВОЗ — только контакты
                    return <div>
                        <ContactForm
                            checkValid={checkValid.current}
                            memo={memoSendForm.current}
                            valid={true}
                            formValue={formData.current}
                            onValid={(valid) => validSendForm.current = valid}
                            onChange={contactInfoChange}
                        />
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
                    </div>;
                }
            case 1:
                if (!delivery.current) {
                    return <DeliveryPage
                        coords={formData.current.address?.coordinates}
                        onChangeInfo={() => {
                            if (formId.current === 0) return;
                            formId.current = formId.current - 1;
                            setRefresh(prev => !prev);
                        }}
                        address={addressInfo.current}
                        contactInfo={contactInfo.current}
                        onChange={(data) => {
                            formData.current.deliveryType = data;
                        }}
                    />;
                } else {
                    return <PayBlock
                        deliveryInfo={{ "Доставка": formData.current.deliveryType }}
                        address={addressInfo.current}
                        contactInfo={contactInfo.current}
                        onBack={() => {
                            if (formId.current === 0) return;
                            formId.current = formId.current - 1;
                            setRefresh(prev => !prev);
                        }}
                        onChange={(val) => {
                            formData.current.save = val;
                            respData.current = {
                                ...respData.current,
                                personalData: {
                                    name: formData.current.name,
                                    phone: formData.current.phone,
                                    mail: formData.current.mail,
                                    secondName: formData.current.secondName || ""
                                },
                                save: formData.current.save,
                                delivery: {
                                    deliveryPrice: 0,
                                    deliveryComment: formData.current.deliveryComment,
                                    type: formData.current.deliveryType
                                },
                                preorderHash: hash
                            };
                        }}
                    />;
                }
            case 2:
                return <PayBlock
                    deliveryInfo={{ "Доставка": formData.current.deliveryType }}
                    address={addressInfo.current}
                    contactInfo={contactInfo.current}
                    onBack={() => {
                        if (formId.current === 0) return;
                        formId.current = formId.current - 1;
                        setRefresh(prev => !prev);
                    }}
                    onChange={() => {
                        respData.current = {
                            ...respData.current,
                            personalData: {
                                name: formData.current.name,
                                phone: formData.current.phone,
                                mail: formData.current.mail,
                                secondName: formData.current.secondName || ""
                            },
                            save: formData.current.save,
                            delivery: {
                                deliveryPrice: 0,
                                deliveryComment: formData.current.deliveryComment,
                                type: formData.current.deliveryType
                            },
                            preorderHash: hash
                        };
                    }}
                />;
            default:
                return null;
        }
    };

    const getFullForm = () => {
        switch (formId.current) {
            case 0:
                return <div>
                    <h2>Способ получения товара</h2>
                    <DeliveryRadioGroup defaultValue={delivery.current} onChange={(data) => {
                        delivery.current = data;
                        setRefresh(prev => !prev);
                    }} />
                    {getForm()}
                </div>;
            case 1:
            case 2:
                return <div>{getForm()}</div>;
            default:
                return null;
        }
    };

    return (
        <div className={s.mainHolder + ' dependFlex'}>
            <div className={s.fieldHolder}>
                {getFullForm()}
                <div>
                    <div className={s.buttonHolder}>
                        {formId.current ? (
                            <LinkButton
                                icon={"arrowLeft"}
                                className={s.backBtn}
                                text={BACK_ROUTE[delivery.current][formId.current - 1]}
                                onChange={() => {
                                    if (formId.current === 0) return;
                                    formId.current = formId.current - 1;
                                    setRefresh(prev => !prev);
                                }}
                            />
                        ) : null}

                        <Button
                            className={"btnStyle dark " + s.mainButton}
                            text={BUY_ROUTE[delivery.current][formId.current]}
                            onClick={() => {
                                if (formId.current === BUY_ROUTE[delivery.current].length - 1) {
                                    const orderData = {
                                        ...respData.current,
                                        promoCode: promoState.isValid ? promoState.code : null,
                                        promoDiscount: promoState.isValid ? promoState.discount : 0,
                                        promoCodeId: promoState.isValid ? promoState.id : null,
                                        matchingProducts: matchingProductsRef.current,
                                    };
                                    createOrder(orderData, (data) => {
                                        dispatch(cartCountAction(0))
                                        navigate('/order/' + data.hash);
                                    });
                                } else {
                                    if (validSendForm.current) {
                                        formId.current = formId.current + 1;
                                    } else {
                                        memoSendForm.current = !memoSendForm.current;
                                    }
                                }
                                checkValid.current = true;
                                setRefresh(prev => !prev);
                            }}
                        />
                    </div>
                    <p className={s.privacyText}>
                        Нажимая кнопку, вы соглашаетесь с{' '}
                        <a href="/privacy-policy" target="_blank" className={s.privacyLink}>
                            политикой обработки персональных данных
                        </a>
                    </p>
                </div>
            </div>
            <div className={s.buyMerchFieldHolder}>
                <BuyMerchField
                    data={products}
                    promoState={promoState}
                    onPromoCodeChange={handlePromoCodeChange}
                    onPromoCodeApply={handlePromoCodeApply}
                    onPromoCodeRemove={handlePromoCodeRemove}
                />
            </div>
        </div>
    );
};

export default memo(FormPage);