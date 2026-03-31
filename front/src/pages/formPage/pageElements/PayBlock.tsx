import React from 'react';
import s from "./payBlock.module.css";
import ContactInfo from './ContactInfo';

type urlParamsType = {
    address: any;
    contactInfo: any;
    onChange: (data: any) => void;
    onBack: (data: any) => void;
    deliveryInfo: any;
};

const PayBlock: React.FC<urlParamsType> = (props) => {
    let { address, contactInfo, onChange, onBack, deliveryInfo } = { ...props };
    
    // Данные для перевода (в реальном приложении можно вынести в конфиг)
    const paymentDetails = {
        cardNumber: "**** **** **** 1234",
        bankName: "Тинькофф Банк",
        cardHolder: "ИВАНОВ ИВАН ИВАНОВИЧ",
        recipientName: "ИП Иванов И.И."
    };

    return (
        <div className={s.payBlock}>
            <ContactInfo 
                address={address} 
                contactInfo={contactInfo} 
                deliveryInfo={deliveryInfo} 
                onChange={onBack} 
            />
            
            <div className={s.paymentSection}>
                <h3 className={s.payHeader}>Способ оплаты</h3>
                <p className={s.descr}>Все транзакции защищены</p>
                
                <div className={s.paymentMethodCard}>
                    <div className={s.paymentMethodHeader}>
                        <div className={s.paymentIcon}>💳</div>
                        <div className={s.paymentMethodTitle}>
                            <strong>Оплата по реквизитам карты</strong>
                            <span className={s.paymentBadge}>Ручной перевод</span>
                        </div>
                    </div>
                    
                    <div className={s.paymentInfo}>
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Номер карты:</span>
                            <span className={s.infoValue}>{paymentDetails.cardNumber}</span>
                            <button 
                                className={s.copyButton}
                                onClick={() => navigator.clipboard.writeText(paymentDetails.cardNumber.replace(/\*/g, '0'))}
                            >
                                📋 Копировать
                            </button>
                        </div>
                        
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Банк:</span>
                            <span className={s.infoValue}>{paymentDetails.bankName}</span>
                        </div>
                        
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Держатель карты:</span>
                            <span className={s.infoValue}>{paymentDetails.cardHolder}</span>
                        </div>
                        
                        <div className={s.infoRow}>
                            <span className={s.infoLabel}>Получатель:</span>
                            <span className={s.infoValue}>{paymentDetails.recipientName}</span>
                        </div>
                    </div>
                    
                    <div className={s.paymentNotice}>
                        <span className={s.noticeIcon}>ℹ️</span>
                        <span className={s.noticeText}>
                            После оплаты, пожалуйста, отправьте чек на нашу почту или в мессенджер для подтверждения заказа
                        </span>
                    </div>
                </div>
            </div>

            <div className={s.billingSection}>
                <h3 className={s.payHeader}>Адрес выставления счета</h3>
                <p className={s.billingDescription}>
                    Выберите адрес, соответствующий вашей карте или способу оплаты. 
                    Это поможет избежать задержек при обработке заказа.
                </p>
                
                {/* Здесь можно добавить выпадающий список адресов, если они есть */}
                {address && address.length > 0 && (
                    <div className={s.addressSelector}>
                        <select className={s.addressSelect}>
                            <option>Выберите адрес для счета</option>
                            {address.map((addr: any, idx: number) => (
                                <option key={idx}>{addr}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayBlock;