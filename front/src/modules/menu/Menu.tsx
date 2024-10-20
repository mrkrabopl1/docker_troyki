import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { userSlice } from 'src/store/reducers/userSlice'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { searchSlice } from 'src/store/reducers/searchSlice'
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import LineSwitcher from 'src/components/switcher/LineSwitcher'
import s from "./style.module.css"
import ss from "../../pages/style.module.css"
import loupe from "/public/vagabond.png";
import BuyButton from "./BuyButton";
import { verified } from 'src/store/reducers/menuSlice'
import { ReactComponent as Loupe } from "/public/loupe.svg";
import { ReactComponent as SignIn } from "/public/sign.svg";
import { ReactComponent as User } from "/public/user.svg";
import Burger from 'src/components/burger/Burger'
import RegistrationPanel
 from './RegistrationPanel'

 import {setGlobalScroller} from "src/global"

import SearchWithList from '../searchWithList/SearchWithList'
import Modal from 'src/components/modal/Modal'


type propsRowType = {
    data: any,
    callback: (...args: any) => void | null
}


let imgWrapStyle: any = {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    // backgroundColor:"red",

    display: "flex"

}


let imgStyle: any = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: " block",
    margin: "0 auto"

}

let logoWrapStyle: any = {
    left: "5%",
    display: "flex",
    cursor: "pointer"
}

let textLogo: any = {
    margin: "auto",
    fontSize: "38px"
}

interface dataType {
    onChange: (data:any)=>void
}
const Menu: React.FC<dataType> = (props) => {
    const {onChange} = {...props}
    let dispatch = useAppDispatch()
    const { isLog } = useAppSelector(state => state.userReducer)
    const { show, sticky } = useAppSelector(state => state.menuReducer)
    const { isVerified } = useAppSelector(state => state.menuReducer)
    const menuWrap = useRef<HTMLDivElement>(null)
    const [active, setActive] = useState<boolean>(false)
    const [loginActive, setLoginActive] = useState<boolean>(false)
    const { setSearchData } = { ...searchSlice.actions }
    let className = s.menuWrap

    const navigate = useNavigate();
    // let pos = sticky ? "sticky" : "relative"
    let time = "transform 0.3s ease-out"
    // useEffect(()=>{
    //     menuStyle= {
    //         display: "flex",
    //         justifyContent: "right",
    //         height: "100px",
    //         position: "relative",
    //         transition:"none"
    //     }
    // },[])

    const turnActive = (active)=>{
            setGlobalScroller(active)
            setActive(active)
    }

    let menuStyle: any = {
        display: "flex",
        justifyContent: "space-between",
        height: "100px",
        position: "relative",
        transition: "none"
    }
    // if (show) {
    //     className = className + " " + s.is_visible
    // } else {
    //     className = className + " " + s.is_hidden
    // }

    const searchCallback = (text: string) => {
        turnActive(false)
        navigate('/settingsMenu', { state: text });
    }
    let styleData = {
        main: ss.main+ " " + s.search,
        dropList: ss.drop_list,
        search:s.searchInput
    }
    const selectListHandler = (id: number) => {
        setActive(false)
        navigate('/product/' + id)
    }
    return (
        <div ref={menuWrap} style={menuStyle}>
            <div className={"dependSize vrtCntr"}>
                <Burger activeProps = {false} onChange={(data)=>{
                    onChange(data)
                }}/>
            </div>

            <div onClick={() => { navigate("/") }} style={logoWrapStyle}>
                <div style={imgWrapStyle}>
                    <img style={imgStyle} src={loupe} alt="samura_snikers" />
                </div>
                <div style={textLogo}>TROYKI</div>
            </div>

            <div style={{paddingTop:"10px", margin: "auto 20px", display: "flex", position: "relative" }}>
                {isVerified ? <User className={global.link} onClick={() => navigate("/user")} /> :  <RegistrationPanel/>}
                <Loupe onClick={() => setActive(true)} className={global.link} height={"24px"} width={"24px"} />
                <BuyButton />

            </div>

            <Modal onChange={setActive} active={active}>
                <div onClick={(e) => { e.stopPropagation() }} className={s.modalWrap}>
                    <SearchWithList
                        onChange={(val) => { dispatch(setSearchData(val)) }}
                        className={styleData}
                        searchCallback={searchCallback}
                        selectList={selectListHandler}
                    />
                </div>
            </Modal>


        </div>

    )
}


export default Menu