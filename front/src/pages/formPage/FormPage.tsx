import React, { ReactElement, useEffect, useRef, useState, memo, useCallback } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import s from "./style.module.css"
import { cartCountAction } from 'src/store/reducers/menuSlice'
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder, getOrderDataByHash } from 'src/providers/orderProvider';
import { checkCustomerData } from 'src/providers/userProvider';
import OrderInfo from 'src/components/orderInfo/orderInfo';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import { useRouter } from 'next/router';
import DeliveryRadioGroup from './pageElements/DeliveryRadio';
import Button from 'src/components/Button';
import DeliveryTypeRadioGroup from './pageElements/DeliveryTypeRadio';
import DeliveryPage from './pageElements/DeliveryPage';
import PayBlock from './pageElements/PayBlock';
import LinkButton from 'src/components/LinkButton';
import ContactForm from 'src/modules/sendForm/ContactForm';
import MapComponent from 'src/modules/map/Map';
import { finishLoading } from 'src/store/reducers/loadingSlice';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }
type urlParamsType = {
    hash: string;
};

const BUY_ROUTE = [
    ["Перейти к доставке", "Перейти к оплате", "Завершить заказ"],
    ["Перейти к оплате", "Завершить заказ"]
];

const BACK_ROUTE = [
    ["Вернуться к экрану с информацией", "Вернуться к доставке"],
    ["Вернуться к экрану с информацией"]
];
function formatAddress(address) {
    const parts = [];

    // Город

    if (address.town) {
        parts.push(`г.${address.town}`);
    }
    if (address.settlement) {
        parts.push(`${address.settlement}`);
    }
    // Улица и дом
    if (address.street && address.house) {
        parts.push(`ул. ${address.street}`);
    }
    if (address.house) {
        parts.push(`д. ${address.house}`);
    }


    // Квартира
    if (address.flat) {
        parts.push(`кв. ${address.flat}`);
    }



    return parts.join(', ');
}
const FormPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { hash } = router.query;
    const [products, setProducts] = useState<any[]>([]);
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
        deliveryType: delivery.current === 0 ? "curier" : "own",
        deliveryComment: ""
    });

    useEffect(() => {
        getCartData(hash, (data) => {
            dispatch(finishLoading());
            fullPrice.current = data.fullPrice;
            setProducts(data);
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
    }, [hash]);

    const contactInfoChange = useCallback((data: any) => {
        contactInfo.current.Имя = data.name;
        formData.current.name = data.name;
        if (data.mail) {
            contactInfo.current.mail = data.mail;
            formData.current.mail = data.mail;
        } else {
            contactInfo.current.Телефон = data.phone;
            formData.current.phone = data.phone;
        }

        respData.current = {
            personalData: {
                name: data.name,
                phone: data.phone,
                mail: data.mail,
            },
            address: {
                town: "",
                street: "",
                index: ""
            },
            save: data.save,
            delivery: {
                deliveryPrice: 0,
                deliveryComment: "",
                type: "own"
            },
            preorderHash: hash
        };
    }, [hash]);

    const getForm = () => {
        switch (formId.current) {
            case 0:
                if (!delivery.current) {
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
                            location={[37.67575303913705,
                                55.77123033359646]}
                            path={[
                                [
                                    37.67872961851563,
                                    55.77235933513177
                                ],
                                [
                                    37.678807584960055,
                                    55.77199699513815
                                ],
                                [
                                    37.67807365625907,
                                    55.771894140358
                                ],
                                [
                                    37.67739957099823,
                                    55.771977085319776
                                ],
                                [
                                    37.67668956233416,
                                    55.77173756626368
                                ],
                                [
                                    37.67651327214742,
                                    55.77175072741187
                                ],
                                [
                                    37.675834007076304,
                                    55.77139685269603
                                ],
                                [
                                    37.67578345483358,
                                    55.771320747312586
                                ],
                                [
                                    37.67569282878247,
                                    55.7712895064023
                                ]
                            ]}
                        />
                    </div>;
                }
            case 1:
                if (!delivery.current) {
                    return <DeliveryPage
                        coords={formData.current.address.coordinates}
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
                                personalData: {
                                    name: formData.current.name,
                                    phone: formData.current.phone,
                                    mail: formData.current.mail,
                                    secondName: formData.current.secondName ? formData.current.secondName : ""
                                },
                                address: {},
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
                            personalData: {
                                name: formData.current.name,
                                phone: formData.current.phone,
                                mail: formData.current.mail,
                                secondName: formData.current.secondName ? formData.current.secondName : ""
                            },
                            address: {},
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
                                    createOrder(respData.current, (data) => {
                                        dispatch(cartCountAction(0))
                                        router.push('/order/' + data.hash);
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
            <div className={s.buyMerchFieldHolder} >
                <BuyMerchField data={products} />
            </div>
        </div>
    );
};

export default memo(FormPage);