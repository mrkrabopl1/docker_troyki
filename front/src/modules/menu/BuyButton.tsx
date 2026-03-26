import React, { memo } from 'react'
import { useAppSelector } from 'src/store/hooks/redux'
import { ReactComponent as Cart } from "/public/cart.svg";
import s from "./style.module.css"

const BuyButton: React.FC<any> = ({ onClick }) => {
    const { cartCount } = useAppSelector(state => state.menuReducer)
    
    return (
        <div 
            onClick={onClick} 
            style={{ 
                height: "36px", 
                width: "36px", 
                position: "relative", 
                cursor: "pointer" 
            }}
        >
            <Cart style={{width:"100%",height:"100%"}} />
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