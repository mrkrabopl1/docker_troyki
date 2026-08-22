import React, { memo } from 'react'
import s from "./style.module.css"
import { toPrice } from 'src/global'

type merchType = {
    onChange: () => void,
    active: boolean,
    size: string,
    price: number,
    discount?: number,
    id: number,
    quantity: number
}

const PricesBlock: React.FC<merchType> = (props) => {
    const { price, size, active, id, onChange, discount, quantity } = props
    
    const finalPrice = discount ? price - price*discount/100 : price;
    const hasDiscount = discount && discount > 0;

    return (
        <div 
            onClick={price > 0 ? onChange : undefined} 
            className={`${s.priceBlock} ${active ? s.active : ''} ${!price ? s.outOfStock : ''}`}
        >
            <div className={s.sizeHolder}>{size}</div>
            
            <div className={s.priceInfo}>
                {hasDiscount && (
                    <div className={s.originalPrice}>
                        {toPrice(price)}
                    </div>
                )}
                {quantity > 0 && (
                    <div className={s.quantity}>
                       {quantity}
                    </div>
                )}
                <div className={s.finalPrice}>
                    {toPrice(finalPrice)}
                </div>
            </div>

            {hasDiscount && (
                <div className={s.discountLabel}>
                    -{toPrice(price *discount/100)}
                </div>
            )}

            {!price && (
                <div className={s.stockLabel}>
                    Нет в наличии
                </div>
            )}

            {/* {active && (
                <div className={s.activeIndicator}></div>
            )} */}
        </div>
    )
}

export default memo(PricesBlock)