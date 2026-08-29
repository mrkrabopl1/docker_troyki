import React, { memo, useEffect } from 'react'
import MerchFormBlock from "src/modules/merchField/MerchFormBlock";
import { toPrice } from 'src/global';
import s from "./style.module.css";

interface CartItem {
    name: string;
    image_path: string;
    id: string;
    firm: string;
    price: number;
    quantity: number;
    totalPrice: string;
    size: number;
}

interface PromoState {
    code: string;
    discount: number;
    id: number | null;
    isValid: boolean;
    message: string;
}

interface BuyMerchFieldProps {
    data: any[];
    promoState: PromoState;
    onPromoCodeChange: (code: string) => void;
    onPromoCodeApply: () => void;
    onPromoCodeRemove: () => void;
    isCheckingPromo?: boolean;
    edit?: boolean; // добавляем пропс
}

const BuyMerchFieldComponent: React.FC<BuyMerchFieldProps> = ({ 
    data, 
    promoState = { code: '', discount: 0, id: null, isValid: false, message: '' },
    onPromoCodeChange,
    onPromoCodeApply,
    onPromoCodeRemove,
    isCheckingPromo = false,
    edit = true // по умолчанию true
}) => {
    const [totalPrice, setTotalPrice] = React.useState(0);
    const [finalPrice, setFinalPrice] = React.useState(0);

    const { code, discount, isValid, message } = promoState;

    useEffect(() => {
        const total = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setTotalPrice(total);
        setFinalPrice(total - discount);
    }, [data, discount]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && onPromoCodeApply) {
            onPromoCodeApply();
        }
    };

    // Рендер блока промокода
    const renderPromoCode = () => {
        // Если edit = false
        if (!edit) {
            // Если есть примененный промокод - показываем информацию
            if (isValid && code) {
                return (
                    <div className={s.promoCodeSection}>
                        <div className={s.promoCodeInfo}>
                            <span className={s.promoCodeLabel}>Промокод применён:</span>
                            <span className={s.promoCodeValue}>{code}</span>
                            <span className={s.promoDiscountValue}>-{toPrice(discount)}</span>
                        </div>
                        {message && (
                            <div className={`${s.promoMessage} ${s.success}`}>
                                {message}
                            </div>
                        )}
                    </div>
                );
            }
            // Если промокода нет - ничего не показываем
            return null;
        }

        // edit = true - показываем полный интерфейс
        return (
            <div className={s.promoCodeSection}>
                <div className={s.promoCodeInput}>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => onPromoCodeChange?.(e.target.value.toUpperCase())}
                        onKeyPress={handleKeyPress}
                        placeholder="Введите промокод"
                        className={s.promoInput}
                        disabled={isValid}
                    />
                    {isValid ? (
                        <button
                            className={s.removePromoBtn}
                            onClick={onPromoCodeRemove}
                            type="button"
                        >
                            ✕
                        </button>
                    ) : (
                        <button
                            className={s.applyPromoBtn}
                            onClick={onPromoCodeApply}
                            disabled={isCheckingPromo || !code.trim()}
                            type="button"
                        >
                            {isCheckingPromo ? '⏳' : 'Применить'}
                        </button>
                    )}
                </div>
                {message && (
                    <div className={`${s.promoMessage} ${isValid ? s.success : s.error}`}>
                        {message}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ width: "100%" }}>
            {data.map((item) => (
                <MerchFormBlock 
                    key={`${item.id}-${item.size}`}
                    data={item} 
                    onChange={() => {}} 
                />
            ))}
            
            {renderPromoCode()}

            <div className={s.fullPrice}>
                <span>Всего</span>
                <span>{toPrice(totalPrice)}</span>
            </div>

            {discount > 0 && (
                <div className={s.discountRow}>
                    <span>Скидка</span>
                    <span>-{toPrice(discount)}</span>
                </div>
            )}

            <div className={s.finalPrice}>
                <span><strong>Итого</strong></span>
                <span><strong>{toPrice(finalPrice)}</strong></span>
            </div>
        </div>
    );
};

export default memo(BuyMerchFieldComponent);