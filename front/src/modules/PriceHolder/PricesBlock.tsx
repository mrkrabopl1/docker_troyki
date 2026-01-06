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
    in_stock: boolean
}

const PricesBlock: React.FC<merchType> = (props) => {
    const { price, size, active, id, onChange, discount, in_stock } = props
    
    const finalPrice = discount ? price - discount : price;
    const hasDiscount = discount && discount > 0;

    return (
        <div 
            onClick={in_stock ? onChange : undefined} 
            className={`${s.priceBlock} ${active ? s.active : ''} ${!in_stock ? s.outOfStock : ''}`}
        >
            <div className={s.sizeHolder}>{size}</div>
            
            <div className={s.priceInfo}>
                {hasDiscount && (
                    <div className={s.originalPrice}>
                        {toPrice(price)}
                    </div>
                )}
                <div className={s.finalPrice}>
                    {toPrice(finalPrice)}
                </div>
            </div>

            {hasDiscount && (
                <div className={s.discountLabel}>
                    -{toPrice(discount)}
                </div>
            )}

            {!in_stock && (
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