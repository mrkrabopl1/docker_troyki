import React, { ReactElement, useEffect, useRef, useState,memo } from 'react'
import SendForm from "src/modules/sendForm/SendForm"
import { getCartData } from 'src/providers/shopProvider'
import { useParams } from 'react-router-dom';
import s from "./style.module.css"
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import { createOrder, getOrderDataByHash } from 'src/providers/orderProvider';
import { checkCustomerData } from 'src/providers/userProvider';
import OrderInfo from 'src/components/orderInfo/orderInfo';
import MailInputWithValidation from 'src/components/input/MailInputWithValidation';
import { setSnickers } from 'src/store/reducers/formSlice';
import { useNavigate } from 'react-router-dom';
import DeliveryRadioGroup from './pageElements/DeliveryRadio';
import Button from 'src/components/Button';
import DeliveryTypeRadioGroup from './pageElements/DeliveryTypeRadio';
import DeliveryPage from './pageElements/DeliveryPage';
import PayBlock from './pageElements/PayBlock';
import LinkButton from 'src/components/LinkButton';
import { current } from '@reduxjs/toolkit';
import EmailPhoneInput from 'src/components/input/EmailPhoneInput';
import ContactForm from 'src/modules/sendForm/ContactForm';
import MapComponent from 'src/modules/map/Map';

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

const FormPage: React.FC = () => {
    const navigate = useNavigate();
    const { hash } = useParams<urlParamsType>();
    const [snickers, setSnickers] = useState<any>({ cartData: [], fullPrice: "" });
    const delivery = useRef(0);
    const contactInfo = useRef<Record<string, string>>({
        "Имя": "",
        "Фамилия": "",
        "mail": "",
        "Телефон": ""
    });
    const formId = useRef(0);
    const memoSendForm = useRef(true);
    const respData = useRef<any>({});
    const validSendForm = useRef(false);
    const fullPrice = useRef(0);
    const [inProgress, setInProgress] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const formData = useRef<any>({
        name: "",
        mail: "",
        secondName: "",
        address: null,
        phone: "",
        deliveryType: "own"
    });

    useEffect(() => {
        getCartData(hash, (data) => {
            fullPrice.current = data.fullPrice;
            setSnickers(data);
            checkCustomerData((customerData) => {
                if (customerData) {
                    memoSendForm.current = !memoSendForm.current;
                    formData.current = customerData;
                    setRefresh(prev => !prev);
                    setInProgress(true);
                }
            });
        });
    }, [hash]);

    const contactInfoChange = (data: any) => {
        contactInfo.current.Имя = data.name;
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
                type: "own"
            },
            preorderHash: hash
        };
    };

    const getForm = () => {
        switch (formId.current) {
            case 0:
                if (!delivery.current) {
                    return <SendForm
                        memo={memoSendForm.current}
                        valid={true}
                        formValue={formData.current}
                        onValid={(valid) => validSendForm.current = valid}
                        onChange={(data: any) => {
                            contactInfo.current.Имя = data.name;
                            contactInfo.current.Фамилия = data.secondName;
                            contactInfo.current.mail = data.mail;
                            contactInfo.current.Телефон = data.phone;
                            formData.current.name = data.name;
                            formData.current.secondName = data.secondName;
                            formData.current.address = { ...data.address };
                            formData.current.phone = data.phone;
                            formData.current.mail = data.mail;

                            respData.current = {
                                personalData: {
                                    name: data.name,
                                    phone: data.phone,
                                    mail: data.mail,
                                    secondName: data.secondName ? data.secondName : ""
                                },
                                address: { ...data.address },
                                save: data.save,
                                delivery: {
                                    deliveryPrice: 0,
                                    type: formData.current.deliveryType
                                },
                                preorderHash: hash
                            };
                        }}
                        className={{  combobox: s.combobox }}
                    />;
                } else {
                    return <div>
                        <ContactForm
                            memo={memoSendForm.current}
                            valid={true}
                            formValue={formData.current}
                            onValid={(valid) => validSendForm.current = valid}
                            onChange={contactInfoChange}
                        />
                        <MapComponent location={[37.6709, 55.7718]} />
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
                        address={formData.current.address}
                        contactInfo={contactInfo.current}
                        onChange={(data) => {
                            formData.current.deliveryType = data;
                        }}
                    />;
                } else {
                    return <PayBlock
                        deliveryInfo={{ "Доставка": formData.current.deliveryType }}
                        address={formData.current.address}
                        contactInfo={contactInfo.current}
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
                    address={formData.current.address}
                    contactInfo={contactInfo.current}
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
                    <h2>Способ доставки</h2>
                    <DeliveryRadioGroup onChange={(data) => {
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
                        className={"btnStyle " + s.mainButton}
                        text={BUY_ROUTE[delivery.current][formId.current]}
                        onClick={() => {
                            if (formId.current === BUY_ROUTE[delivery.current].length - 1) {
                                createOrder(respData.current, (data) => {
                                    navigate('/order/' + data.hash);
                                });
                            } else {
                                if (validSendForm.current) {
                                    formId.current = formId.current + 1;
                                } else {
                                    memoSendForm.current = !memoSendForm.current;
                                }
                            }
                            setRefresh(prev => !prev);
                        }}
                    />
                </div>
            </div>
            <div style={{ marginLeft: "20px", width: "50%", paddingRight: "90px" }}>
                <BuyMerchField data={snickers} />
            </div>
        </div>
    );
};

export default memo(FormPage);