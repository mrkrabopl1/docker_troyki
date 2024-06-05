import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { NavLink, useParams } from 'react-router-dom';
import { getMerchInfo, getSizeTable } from "src/providers/merchProvider"
import PriceHolder from 'src/modules/PriceHolder/PriceHolder';
import TableWithComboboxColumn from 'src/components/table/simpleTable/TableWithComboboxColumn';
import Button from 'src/components/Button';
import Scroller from 'src/components/scroller/Scroller';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import { cartCountAction } from '../../store/reducers/menuSlice'
import { setSnickers } from '../../store/reducers/formSlice'
import ImagePresantation from 'src/components/imagesPresantation/ImagesPresentation';
import Modal from 'src/components/modal/Modal';
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import { createPreorder, updatePreorder } from 'src/providers/orderProvider';
import s from "./style.module.css"
import { setCookie, getCookie } from 'src/global';


import { sizes, getMerchPrice1 } from 'src/constFiles/size';

console.debug(sizes, getMerchPrice1)

const text = "Если вы нашли данную модель где-либо в наличии по более низкой цене — пришлите нам ссылку на данную модель в другом магазине. Мы будем рады предложить вам скидку, компенсирующую разницу в стоимости, и лучшую цену относительно конкурентов." +
    +"Обратите внимание, что акция распространяется только на российские платформы."


type urlParamsType = {
    snickers: string;
};

type columnType = {
    table: number[],
    title: string,
    subtitle?: string
}

type tableType = {
    table: [
        {
            title: string,
            subtitle?: string,
            table: string[] | never[]
        }
    ],
    sizes: {
        [key: string]: number[]
    },
    comboTable: [
        {
            title: string,
            subtitle?: string,
            table: string[] | never[]
        }
    ]
}
const SnickersInfo: React.FC = () => {
    const { shop } = { ...useAppSelector(state => state.menuReducer) }
    const navigate = useNavigate();
    let dispatch = useAppDispatch()
    let { snickers } = useParams<urlParamsType>();
    let [recalc, setRecalc] = useState<boolean>(true)
    let [merchInfo, setMerchInfo] = useState<any>({ imgs: [], name: "", info: {} })
    let currentPrice = useRef<string>("")
    let currentDiscount = useRef<string>("")
    let currentProiceDiscount = useRef<string>("")
    let pricesArr = useRef<any>([])


    const { cartCount } = useAppSelector(state => state.menuReducer)
    let currentSize = useRef<string>("")
    let [local, setLocal] = useState<string>("ru")
    console.debug(merchInfo)
    let [active, setActive] = useState(false)

    const setMerchInfoHandler = (val: any) => {
        const info = JSON.parse(val.info)
        let discountParse = null;
        if (val.discount) {
            discountParse = JSON.parse(val.discount)
        }
        currentSize.current = Object.keys(info)[0]
        let dPr = 0;
        if(discountParse){
            let data = discountParse[currentSize.current]
            if(data){
                dPr = data
            }
        }
        currentPrice.current = Number(Object.values(info)[0]) - dPr + "р"
        let infoData = Object.entries(info)
        infoData.forEach(priceEl => {
            let price = priceEl[1]
            let discount = 0
            if (discountParse) {
                if (discountParse[priceEl[0]]) {
                    discount = discountParse[priceEl[0]]
                }
            }
            let size
            if (local === "ru") {
                size = sizes.sizes["ru"][sizes.sizes["us"].indexOf(Number(priceEl[0]))]
            }
            let prHolderElem = {
                discount: discount,
                price: price,
                size: size
            }
            pricesArr.current.push(prHolderElem)
        })
        setMerchInfo(val)
    }
    let [tableInfo, setTableInfo] = useState<tableType>({ sizes: {}, table: [{ table: [], title: "" }], comboTable: [{ table: [], title: "" }] })
    // if (size) {
    //     currentSize.current = size;
    // }
    // useEffect(() => {
    //     if (size) {
    //         currentSize.current = size;
    //     }
    // }, [merchInfo])
    useEffect(() => {
        if (snickers) {
            getMerchInfo(snickers, (val) => { setMerchInfoHandler(val) })
        }

    }, [snickers])
    useEffect(() => {
        getSizeTable((val) => { setTableInfo(val) })
    }, [])

    const priceChangeHandler = (indx: number) => {
        const priceBlock = pricesArr.current[indx]
        currentPrice.current = priceBlock.price - priceBlock.discount + "Р"
        currentDiscount.current = priceBlock.discount
        if (local === "ru") {
            currentSize.current = String(tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(priceBlock.size))])
        }
        currentProiceDiscount.current = priceBlock.price
        setRecalc(!recalc)
    }
    return (
        <div>
            <div className={s.mainWrap}>

                <div style={{ height: "100%", width: "70%" }}>
                    <ImagePresantation images={merchInfo.imgs} />
                </div>
                <div style={{ height: "100%", width: "30%" }}>
                    <Button text={"размеры"} onChange={() => {

                        setActive(true)
                    }} />
                    <h1 className={s.merchName} >{merchInfo.name}</h1>
                    <div>{currentDiscount.current ? <span>{currentProiceDiscount.current}</span> : null}<span>{currentPrice.current}</span></div>
                    <PriceHolder onChange={priceChangeHandler} elems={pricesArr.current} />
                    <Button text='Купить' className={s.buyMerch} onChange={() => {
                        let data: any = {
                            id: Number(snickers),
                            info: {
                                size: String(currentSize.current)
                            }
                        }

                        createPreorder(data, (hash) => {
                            let data: any = {
                                id: Number(snickers),
                                info: {
                                    size: String(currentSize.current)
                                }
                            }
                            setCookie('cart', hash.hashUrl, { 'max-age': 604800 })
                            dispatch(cartCountAction(1))
                            navigate("/form/" + hash.hashUrl)
                        })

                        // dispatch(setSnickers([{
                        //     count: 1,
                        //     img: merchInfo.imgs[0],
                        //     firm: merchInfo.firm,
                        //     name: merchInfo.name,
                        //     size: currentSize.current,
                        //     id: merchInfo.id
                        // }]))
                    }} />
                    <Button text='Добавить в корзину' className={s.buyMerch} onChange={() => {
                        let size = Number(currentSize.current)
                        // if (local === "ru") {
                        //     size = tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(currentSize.current))]
                        // }

                        let cart = getCookie("cart")
                        let data: any = {
                            id: Number(snickers),
                            info: {
                                size: currentSize.current
                            },
                            gashUrl: cart
                        }

                        if (cart) {
                            let data: any = {
                                id: Number(snickers),
                                info: {
                                    size: String(size)
                                },
                                hashUrl: cart
                            }
                            updatePreorder(data, () => {
                                dispatch(cartCountAction(cartCount + 1))
                            })
                        } else {
                            createPreorder(data, (hash) => {
                                let data: any = {
                                    id: Number(snickers),
                                    info: {
                                        size: String(size)
                                    }
                                }
                                setCookie('cart', hash.hashUrl, { 'max-age': 604800 })
                                dispatch(cartCountAction(cartCount + 1))
                            })
                        }



                        //     let size = Number(currentSize.current)
                        //     if(local === "ru"){
                        //         size = tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(currentSize.current))]
                        //     }
                        //   let data:any = {
                        //     id:Number(snickers),
                        //     size:size,
                        //     title:"ru"
                        // }

                        //         dispatch(shopAction([data, ...shop ]))

                    }} />
                    <DoubleInfoDrop className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }} info={"ГАРАНТИЯ ЛУЧШЕЙ ЦЕНЫ"}>
                        <div>
                            {text}
                        </div>
                    </DoubleInfoDrop>
                </div>
                <Modal onChange={setActive} active={active}>
                    <Scroller className={s.scrollStyle}>
                        <TableWithComboboxColumn className={s.modalTable} {...tableInfo} />
                    </Scroller>
                </Modal>
            </div>
        </div>

    )
}


export default SnickersInfo