import React, { ReactElement, useRef, useState, memo } from 'react'
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom';
import { toPrice } from 'src/global';



interface MerchInterface { name: string, imgs: string[],image_path?:string, id: string, price: string, discount?: number }




const MerchBlock: React.FC<{ className?: string, width?: string, data: MerchInterface }> = (props) => {
    const navigate = useNavigate();
    let { data, className, width } = { ...props }
    let [compOpacity, setOpacity] = useState(0)

    let [compScale, setScale] = useState(0.9)


    let showAnimation = useRef(false)

    const secondImgStyle: any = {
        top: 0,
        left: 0,
        position: "absolute",
        zIndex: 2,
        transitionProperty: "opacity, scale",
        transitionDuration: "0.3s",
        transitionTimingFunction: "ease-out",
        opacity: compOpacity
    }


    const firstImgStyle: any = {
        transitionDuration: "0.3s",
        scale: compScale + "",
        transitionTimingFunction: "ease-out",
        // opacity: Number(!compOpacity),
        zIndex: 1,
        position: "relative"
    }

    // function backwordAnimate(duration: number) {
    //     console.log(showAnimation.current, "go")

    //     let start = performance.now();

    //     requestAnimationFrame(function animate(time) {
    //         let timePass = (time - start) / 1000


    //         let progress = timePass / duration
    //         setOpacity(1 - progress)

    //         if (progress < 1) {
    //             requestAnimationFrame(animate);
    //         } else {
    //             let nextSecond = secondImg.current + 1
    //             console.log(nextSecond, data.imgs.length - 1)
    //             if (nextSecond > data.imgs.length - 1) {
    //                 nextSecond = 0
    //                 firstImg.current = data.imgs.length - 1
    //                 setOpacity(1)
    //                 secondImg.current = 0
    //             } else {
    //                 firstImg.current = nextSecond - 1
    //                 setOpacity(1)
    //                 secondImg.current = nextSecond
    //             }
    //             if (showAnimation.current) {
    //                 setTimeout(() => {
    //                     backwordAnimate(2)
    //                 }, 1000)

    //             }
    //         }
    //     });
    // }

    // function backwordAnimate() {
    //     setOpacity(1)
    // }


    return (
        <div
            style={width && { width: width }}
            onClick={(e) => {
                e.stopPropagation();
                navigate('/product/' + data.id)
            }}
            onMouseEnter={() => {
                // if (data.imgs.length > 1) {
                //     showAnimation.current = true
                //     backwordAnimate()
                // }
                setScale(1)
            }}
            onMouseLeave={() => {
                setScale(0.9)
            }}
            className={s.merchWrap + " " + className}
        >
            <div className={s.colorLayout}>
                <div className={s.imageBlock}>
                    <img loading={"lazy"} className={s.img} style={firstImgStyle} src={"/" + (data.imgs?data.imgs[0]:data.image_path+0)} alt="airJordan" />
                    {data.discount ? <div className={s.discountMarker}>
                        "Sale"
                    </div> : null}
                </div>
                <div className={s.nameHolder}>
                    {data.name}
                </div>
                {/* {data.imgs.length > 1 ? <img loading={"lazy"} className={s.img} style={secondImgStyle} src={"/" + data.imgs[1]} alt="airJordan" /> : null} */}
                <div className={s.textContainer}>
                    <div style={{ textAlign: "center", marginTop: "auto" }}>
                        {data.price ? <div>
                            {data.discount ?
                                <span className={s.discount}>{toPrice(data.discount)}</span>
                                : null
                            }
                            <span className={s.imgName}>{"От " + toPrice(data.price)}</span>
                        </div>
                            : <span className={s.imgName}>{"Нет в наличии"}</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}


export default memo(MerchBlock)