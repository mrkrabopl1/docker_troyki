import React, { memo } from 'react'
import { useAppSelector } from 'src/store/hooks/redux'
import { ReactComponent as User } from "/public/user.svg";
import s from "./style.module.css"

const UserButton: React.FC<any> = ({ onClick }) => {
    const { cartCount } = useAppSelector(state => state.menu)
    
    return (
        <div 
            onClick={onClick} 
            className={s.buyButton}
        >
            <User className={s.cartIcon} />
            {/* <div 
                className={s.shopCounter} 
                style={cartCount ? { position: "absolute" } : { display: "none" }}
            >
                <span className={s.spanShop}>{cartCount}</span>
            </div> */}
        </div>
    )
}

export default memo(UserButton)