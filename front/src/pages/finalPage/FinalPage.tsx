import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { getOrderDataByHash } from 'src/providers/orderProvider';
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import DataField from 'src/components/dataField/DataField';

interface MerchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }

interface PromoState {
    code: string;
    discount: number;
    id: number | null;
    isValid: boolean;
    message: string;
}

const FinalPage: React.FC = () => {
    const router = useRouter();
    const hash = router.query.hash as string;
    const [snickers, setSnickers] = useState<any>([]);
    const [promoState, setPromoState] = useState<PromoState>({
        code: '',
        discount: 0,
        id: null,
        isValid: false,
        message: ''
    });

    useEffect(() => {
        if (hash) {
            getOrderDataByHash(hash, (data) => {
                setSnickers(data.cartData || []);
                
                // Если есть промокод
                if (data.promoCodeSnapshot) {
                    const promoData = data.promoCodeSnapshot;
                    const totalDiscount = (data.cartData || [])
                        .filter(item => item.has_discount)
                        .reduce((sum, item) => sum + (item.discount_applied || 0), 0);
                    
                    setPromoState({
                        code: promoData.code || '',
                        discount: totalDiscount,
                        id: data.promoCodeId || null,
                        isValid: true,
                        message: `Промокод применён! Скидка: ${totalDiscount} ₽`
                    });
                }
            });
        }
    }, [hash]);

    return (
        <div style={{ display: "flex" }}>
            <DataField data={[]} header={"данные заказа"}/>
            <BuyMerchField 
                data={snickers}
                promoState={promoState}
                onPromoCodeChange={() => {}}
                onPromoCodeApply={() => {}}
                onPromoCodeRemove={() => {}}
                edit={false}
            />
        </div>
    );
}

export default FinalPage;