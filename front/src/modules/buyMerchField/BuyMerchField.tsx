
import React, { memo} from 'react'
import MerchFormBlock from "src/modules/merchField/MerchFormBlock";
import { toPrice } from 'src/global';
import s from "./style.module.css";

interface CartItem {
    name: string;
    img: string;
    id: string;
    firm: string;
    price: string;
    quantity: number;
    totalPrice: string;
    size: number;
}

interface MerchData {
    cartData: CartItem[];
    fullPrice: number;
}

interface BuyMerchFieldProps {
    data: MerchData;
}

const BuyMerchFieldComponent: React.FC<BuyMerchFieldProps> = ({ data }) => {
    return (
        <div style={{ width: "100%" }}>
            {data.cartData.map((item) => (
                <MerchFormBlock 
                    key={`${item.id}-${item.size}`} // Более уникальный ключ
                    data={item} 
                    onChange={() => {}} 
                />
            ))}
            
            <div className={s.fullPrice}>
                <span>Всего</span>
                <span>{toPrice(data.fullPrice)}</span>
            </div>
        </div>
    );
};

export default memo(BuyMerchFieldComponent);