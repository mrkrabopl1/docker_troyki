import React, { memo } from 'react'
import { useAppSelector } from 'src/store/hooks/redux'
import { ReactComponent as Cart } from "/public/cart.svg";
import s from "./style.module.css"

const BuyButton: React.FC<any> = ({ onClick }) => {
    const { cartCount } = useAppSelector(state => state.menuReducer)
    
    return (
        <div 
            onClick={onClick} 
            className={s.buyButton}
        >
            <Cart className={s.cartIcon} />
            <div 
                className={s.shopCounter} 
                style={cartCount ? { position: "absolute" } : { display: "none" }}
            >
                <span className={s.spanShop}>{cartCount}</span>
            </div>
        </div>
    )
}

export default memo(BuyButton)