import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { userSlice } from 'src/store/reducers/userSlice'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { searchSlice } from 'src/store/reducers/searchSlice'
import { NavLink } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import LineSwitcher from 'src/components/switcher/LineSwitcher'
import s from "./style.module.css"
import { verified } from 'src/store/reducers/menuSlice'
import RegistrationForm from  '../loginForm/RegistrationForm'
import LoginForm from '../loginForm/LoginForm'
import { registerUser, loginUser } from 'src/providers/userProvider'
import ForgetPass from '../loginForm/ForgetPass'
import SearchWithList from '../searchWithList/SearchWithList'
import Modal from 'src/components/modal/Modal'

// import global from "src/global.css"
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

enum State  {
    none=0,
    login=1,
    register=2,
    forget=3
}

const RegistrationPanel: React.FC<any> = (props) => {
    let dispatch = useAppDispatch()
    const menuWrap = useRef<HTMLDivElement>(null)
    const [state, setState] = useState<State>(State.none)

    const { setSearchData } = { ...searchSlice.actions }



    return (
        <div  className={s.regPan}>
            <div className={s.signButton} onClick={() => {setState(State.login)}} >
                Log in
            </div>/
            <div className={s.signButton} onClick={()=>{setState(State.register)}}>
                Sign in
            </div>
            {State.login === state ? <Modal onChange={()=>{setState(State.none)}} active={State.login === state}>
                < LoginForm 
                    onChange={(data) => {}}
                    onLogin={(data) => {
                        dispatch(verified(data))
                    }}
                    forgetPass={()=>{setState(State.forget)}}
                />
            </Modal>: null}
            {State.register === state ? <Modal onChange={()=>{setState(State.none)}} active={State.register === state}>
                < RegistrationForm onChange={(data) => {
                    
                }}
                    onRegister={(data) => {
                        dispatch(verified(data))
                    }}
                />
            </Modal>: null}
            {State.forget === state ? <Modal onChange={()=>{setState(State.none)}} active={State.forget === state}>
                < ForgetPass onChange={(data) => {
                    
                }}
                    
                />
            </Modal>: null}
        </div>

    )
}


export default RegistrationPanel