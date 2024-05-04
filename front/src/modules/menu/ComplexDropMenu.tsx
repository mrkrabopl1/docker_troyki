import React, { ReactElement, useEffect, useRef, useState, memo } from 'react'
import Menu from './Menu'
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

    const complexDropHandler = (data) => {
        let collection = data.main
        if (!collection) {
            collection = data.sub
        }
        navigate('/collections/' + collection);
    }

    let { className, complexDropData } = { ...props }
    return (
        <div className={className}>

            <Menu />
            <ComplexDrop onChange={complexDropHandler} data={complexDropData} />

        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {

    return isDeepEqual(oldProps.complexDropData, newProps.complexDropData)
}


export default memo(ComplexDropMenu, arePropsEqual)