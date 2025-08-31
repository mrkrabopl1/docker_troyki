import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { userSlice } from 'src/store/reducers/userSlice'
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import { searchSlice } from 'src/store/reducers/searchSlice'
import s from "./style.module.css"
import { verified } from 'src/store/reducers/menuSlice'
import RegistrationForm from  '../loginForm/RegistrationForm'
import LoginForm from '../loginForm/LoginForm'
import ForgetPass from '../loginForm/ForgetPass'
import Modal from 'src/components/modal/Modal'


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