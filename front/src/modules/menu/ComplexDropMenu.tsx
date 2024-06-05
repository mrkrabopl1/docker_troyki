import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import Menu from './Menu'
import s from "./style.module.css"
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import ComplexDrop from 'src/components/complexDrop/ComplexDrop'
import { useNavigate } from 'react-router-dom';
import { isDeepEqual } from 'src/global';


interface MerchMenuInterface {
    className?: string,
    complexDropData: {
        [key: string]: string[];
    }

}

const ComplexDropMenu: React.FC<MerchMenuInterface> = (props) => {
    const navigate = useNavigate()
    const { show, sticky } = useAppSelector(state => state.menuReducer)
    let className1 = s.menuWrapWithList
    if (show) {
        className1 = className1 + " " + s.is_visible
    } else {
        className1= className1 + " " + s.is_hidden
    }
    let pos = sticky ? "sticky" : "relative"
    let time = "transform 0.3s ease-out"
    useEffect(()=>{
        menuStyle = {
            position: pos
        }
    },[])
    
    let menuStyle: any = {
        position: pos
    }
    if(window.scrollY !== 0 ){
        menuStyle.transition= time
    }

    const complexDropHandler = (data) => {
        let collection = data.main
        if (!collection) {
            collection = data.sub
        }
        navigate('/collections/' + collection);
    }

    let { className, complexDropData } = { ...props }
    return (
        <div style={menuStyle} className={className1}>

            <Menu />
            <ComplexDrop onChange={complexDropHandler} data={complexDropData} />

        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {

    return isDeepEqual(oldProps.complexDropData, newProps.complexDropData)
}


export default memo(ComplexDropMenu, arePropsEqual)