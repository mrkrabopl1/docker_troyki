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

    console.log(positions)


    function createLinks(elementsCount: number) {
        console.log(currentPosition, "jkl;")
        let linkArr = []
        for (let i = 1; i <= elementsCount; i++) {
            let styles: any = {}
            if (i === currentPosition) {
                styles.backgroundColor = "red"
            }
            linkArr.push(<div key={i} style={styles} onClick={() => {
                let diff = currentPosition - i
                let direction = diff > 0 ? 1 : -1
                if (diff) {
                    callback(2, diff)
                }
            }} className={s.default}></div>)
        }
        return linkArr
    }

    return (
        <div>
            {createLinks(positions)}
        </div>
    )
}


export default LinkController