import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import { userSlice } from 'src/store/reducers/userSlice'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { NavLink } from 'react-router-dom'
import LineSwitcher from 'src/components/switcher/LineSwitcher'
import s from "./style.module.css"
import loupe from "../../../public/vagabond.png";
import { ReactComponent as Cart } from "/public/cart.svg";
import SVGIcon from 'src/components/svgIcon/SvgIcon'
const BuyButton: React.FC<any> = ({ onClick }) => {

    const { cartCount } = useAppSelector(state => state.menuReducer)
    return (
        <div   onClick={onClick} style={{ height: "36px", width: "36px", position: "relative", cursor: "pointer" }}>
            <SVGIcon spritePath='cart' />
            <div className={s.shopCounter} style={cartCount ? { position: "absolute" } : { display: "none" }}>
                <span className={s.spanShop}>{cartCount}</span>
            </div>
        </div>
    )
}


export default memo(BuyButton)