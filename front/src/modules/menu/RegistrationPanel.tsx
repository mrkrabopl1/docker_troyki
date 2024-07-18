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
import RegistrationForm from  '../loginForm/RegistrationForm'
import LoginForm from '../loginForm/LoginForm'
import { registerUser, loginUser } from 'src/providers/userProvider'

import SearchWithList from '../searchWithList/SearchWithList'
import Modal from 'src/components/modal/Modal'

import global from "src/global.css"
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


let textLogo: any = {
    margin: "auto",
    fontSize: "38px"
}

const RegistrationPanel: React.FC<any> = (props) => {
    let dispatch = useAppDispatch()
    const menuWrap = useRef<HTMLDivElement>(null)
    const [loginActive, setLoginActive] = useState<boolean>(false)
    const [signActive, setSignActive] = useState<boolean>(false)
    const { setSearchData } = { ...searchSlice.actions }



    return (
        <div  className={s.regPan}>
            <div onClick={() => {setLoginActive(true) }} >
                Log in
            </div>/
            <div onClick={()=>{setSignActive(true)}}>
                Sign in
            </div>
            {loginActive ? <Modal onChange={setLoginActive} active={loginActive}>
                < LoginForm onChange={(data) => {
                    
                }}
                    onLogin={(data) => {
                        dispatch(verified(data))
                    }}
                />
            </Modal>: null}
            {signActive ? <Modal onChange={setSignActive} active={signActive}>
                < RegistrationForm onChange={(data) => {
                    
                }}
                    onRegister={(data) => {
                        dispatch(verified(data))
                    }}
                />
            </Modal>: null}
        </div>

    )
}


export default RegistrationPanel