import React, { ReactElement, useRef, useState } from 'react'
import s from "./style.module.css"

import { useNavigate } from 'react-router-dom';

import global from "src/global.css"


interface merchInterface {price:number,size:number, name: string, imgs: string[],id:string }




const MerchShopLine: React.FC<{ width:string, data: merchInterface }> = (props) => {
    const navigate = useNavigate();
    let firstImg = useRef(0)
    let secondImg = useRef(1)
    let { data,width } = { ...props }
    let [compOpacity, setOpacity] = useState(1)

    let showAnimation = useRef(false)

    let timeInterval = useRef<any>(null)

    const secondImgStyle: any = {
        top: 0,
        left: 0,
        position: "absolute",
        zIndex: 0

    }

    function backwordAnimate(duration: number) {
        console.log(showAnimation.current, "go")

        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            let timePass = (time - start) / 1000


            let progress = timePass / duration
            setOpacity(1 - progress)

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                let nextSecond = secondImg.current + 1
                console.log(nextSecond, data.imgs.length - 1)
                if (nextSecond > data.imgs.length - 1) {
                    nextSecond = 0
                    firstImg.current = data.imgs.length - 1
                    setOpacity(1)
                    secondImg.current = 0
                } else {
                    console.log(nextSecond - 1, "r")
                    firstImg.current = nextSecond - 1
                    setOpacity(1)
                    secondImg.current = nextSecond
                }
                if (showAnimation.current) {
                    setTimeout(() => {
                        backwordAnimate(2)
                    }, 1000)

                }
            }
        });
    }

    return (
        <div
            style={{display:"flex",width:width}}
            onClick={() => navigate('/product/' + data.id)}
            onMouseEnter={() => {
                if(data.imgs.length > 1){
                    showAnimation.current = true
                    backwordAnimate(2)
                }
            }}
            onMouseLeave={() => {
                showAnimation.current = false
            }}
            className={s.merchWrap}
        >
            <img className={s.img} style={{ opacity: compOpacity, zIndex: 2, position: "relative" }} src={data.imgs[firstImg.current]} alt="airJordan" />
            {data.imgs.length > 1 ? <img className={s.img} style={secondImgStyle} src={data.imgs[secondImg.current]} alt="airJordan" /> : null}
            <div className={s.imgName}>{data.name}</div>
            <div>{data.price}</div>
            <div>{data.size}</div>
        </div>
    )
}


export default MerchShopLine