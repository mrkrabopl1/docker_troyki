import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import { getOrderDataByHash } from 'src/providers/orderProvider';
import BuyMerchField from 'src/modules/buyMerchField/BuyMerchField'
import DataField from 'src/components/dataField/DataField';

interface merchInterface { name: string, img: string, id: string, firm: string, price: string, count: number }

const FinalPage: React.FC = () => {
    const router = useRouter();
    const hash = router.query.hash as string;
    const [snickers, setSnickers] = useState<any>([]);

    useEffect(() => {
        if (hash) {
            getOrderDataByHash(hash, setSnickers);
        }
    }, [hash]);

    return (
        <div style={{ display: "flex" }}>
            <DataField data={[]} header={"данные заказа"}/>
            <BuyMerchField data={snickers} />
        </div>
    );
}

export default FinalPage;