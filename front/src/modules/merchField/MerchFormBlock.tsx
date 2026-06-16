import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import MerchBlock from "./MerchBlock"
import s from "./style.module.css"
import { useRouter } from 'next/router';
import { toPrice } from 'src/global';

interface merchInterface { 
    name: string, 
    image_path: string, 
    id: string, 
    firm: string, 
    price: number, 
    quantity: number, 
    size: number 
}

const MerchFormBlock: React.FC<{ data: merchInterface, onChange: () => void }> = (props) => {
    const { data, onChange } = props;
    const router = useRouter();

    const handleClick = () => {
        router.push('/product/' + data.id);
    };

    return (
        <div className={s.merchFormContainer}>
            <div 
                onClick={handleClick} 
                className={`${s.merchLine} ${s.merchFormLine}`}
            >
                <div className={s.imageWrapper}>
                    <img 
                        className={s.buyImg} 
                        src={data.image_path} 
                        alt={data.name}
                        loading="lazy"
                    />
                    {data.quantity > 0 && (
                        <div className={s.merchCount}>
                            <span>{data.quantity}</span>
                        </div>
                    )}
                </div>
                
                <div className={s.contentWrapper}>
                    <div className={s.productDetails}>
                        <h3 className={s.productName}>{data.name}</h3>
                        {data.size ? (
                            <p className={s.productSize}>US: {data.size}</p>
                        ) : null}
                    </div>
                    
                    <div className={s.priceWrapper}>
                        <span className={s.productPrice}>
                            {toPrice(data.price)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default memo(MerchFormBlock);