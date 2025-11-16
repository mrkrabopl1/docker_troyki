import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Button from '../../Button'
import s from "./linkController.module.scss"

type ContentSliderType = {
    currentPosition: number,
    positions: number,
    callback: (duration: number, stepDiff: number) => void
}

const LinkController: React.FC<ContentSliderType> = (data) => {
    const { currentPosition, positions, callback } = { ...data }

    function createLinks(elementsCount: number) {
        let linkArr = []
        for (let i = 1; i <= elementsCount; i++) {
            const isActive = i === currentPosition;
            
            linkArr.push(
                <div 
                    key={i} 
                    //data-tooltip={`Страница ${i}`}
                    className={`${s.link} ${isActive ? s.active : ''}`}
                    onMouseEnter={() => {
                        let diff = currentPosition - i
                        if (diff) {
                            callback(i, diff)
                        }
                    }}
                />
            )
        }
        return linkArr
    }

    return (
        <div className={s.controller}>
            {createLinks(positions)}
        </div>
    )
}

export default LinkController