
import React, { memo, useEffect} from 'react'
import MerchFormBlock from "src/modules/merchField/MerchFormBlock";
import { toPrice } from 'src/global';
import s from "./style.module.css";

interface CartItem {
    name: string;
    img: string;
    id: string;
    firm: string;
    price: number;
    quantity: number;
    totalPrice: string;
    size: number;
}



interface BuyMerchFieldProps {
    data: CartItem[];
}

const BuyMerchFieldComponent: React.FC<BuyMerchFieldProps> = ({ data }) => {
    const [totalPrice, setTotalPrice] = React.useState(0);
    useEffect(() => {
        setTotalPrice(data.reduce((sum, item) => sum + item.price*item.quantity, 0));
    }, [data]);
    return (
        <div style={{ width: "100%" }}>
            {data.map((item) => (
                <MerchFormBlock 
                    key={`${item.id}-${item.size}`} // Более уникальный ключ
                    data={item} 
                    onChange={() => {}} 
                />
            ))}
            
            <div className={s.fullPrice}>
                <span>Всего</span>
                <span>{toPrice(totalPrice)}</span>
            </div>
        </div>
    );
};

export default memo(BuyMerchFieldComponent);