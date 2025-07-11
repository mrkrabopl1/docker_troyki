import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
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
import { toPrice } from 'src/global';
import ContentSlider from 'src/components/contentSlider/ContentSliderWithControl'
import ImagePresantationBlock from "src/components/imagesPresantation/ImagePresentationBlock"
import MerchComplexSliderField from 'src/modules/merchField/MerchComplexSliderField';
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
const ProductsInfo: React.FC = () => {
    const { shop } = { ...useAppSelector(state => state.menuReducer) }
    const { widthProps } = { ...useAppSelector(state => state.resizeReducer) }
    const navigate = useNavigate();
    let dispatch = useAppDispatch()
    let { snickers } = useParams<urlParamsType>();
    let [recalc, setRecalc] = useState<boolean>(true)
    let [merchInfo, setMerchInfo] = useState<any>({ imgs: [], name: "", info: {} })
    let currentPrice = useRef<number>(0)
    let merchType = useRef<string>("snickers")
    let currentDiscount = useRef<number>(0)
    let currentProiceDiscount = useRef<number>(0)
    let pricesArr = useRef<any>([])


    const { cartCount } = useAppSelector(state => state.menuReducer)
    let currentSize = useRef<string>("")
    let [local, setLocal] = useState<string>("ru")
    console.debug(merchInfo)
    let [active, setActive] = useState(false)

    const setMerchInfoHandler = (val: any) => {
        merchType.current = val.producttype
        switch(val.producttype){
            case "solomerch":
                createSoloMerch(val)
                break
            case "snickers":
                createSnickers(val)
                break    

        }
       
    }

    const createSoloMerch=(val)=>{
        pricesArr.current= [];
        let discountParse = null;
        if (val.discount) {
            discountParse = val.discount
        }
        
        let dPr = 0;
        if (discountParse) {
            let data = discountParse[currentSize.current]
            if (data) {
                dPr = data
            }
        }
        currentPrice.current = val.minprice - dPr
        setMerchInfo(val)
    }

    const createSnickers=(val)=>{
        pricesArr.current= [];
        const info = val.info
        let discountParse = null;
        if (val.discount) {
            discountParse = val.discount
        }
        currentSize.current = Object.keys(info)[0]
        let dPr = 0;
        if (discountParse) {
            let data = discountParse[currentSize.current]
            if (data) {
                dPr = data
            }
        }
        currentPrice.current = Number(Object.values(info)[0]) - dPr
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
        currentPrice.current = priceBlock.price - priceBlock.discount
        currentDiscount.current = priceBlock.discount
        if (local === "ru") {
            currentSize.current = String(tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(priceBlock.size))])
        }
        currentProiceDiscount.current = priceBlock.price
        setRecalc(!recalc)
    }
    let arr: any = []
    const createSliderContetn = () => {
        for (let i = 0; i < merchInfo.imgs.length; i++) {
            arr.push(<div style={{width:"100%", flexShrink:0}}>
                <ImagePresantationBlock image={merchInfo.imgs[i]} />
                </div>)

        }
        return arr
    }

    const getPresentModule = useCallback(()=>{
        if(merchInfo.imgs.length>1){
            return <ImagePresantation images={merchInfo.imgs} />
        }else{
            return <ImagePresantationBlock image={merchInfo.imgs[0]} />
        }
    },[merchInfo])
    return (
        <div>
            <div className={widthProps ? "" : s.mainWrap}>

                <div className={widthProps ?null:s.leftPart} style={widthProps ? { width: "100%" } : { }}>
                   {widthProps?<ContentSlider content={createSliderContetn()} />:getPresentModule()}
                </div>
                <div className={s.controllPanel}>
                    {(merchType.current === "snickers")?<Button text={"размеры"} onChange={() => {
                        setActive(true)
                    }} />:null}
                    <h1 className={s.merchName} >{merchInfo.name}</h1>
                    <div>
                        {currentDiscount.current ? <span className={s.discountPrice}>{toPrice(currentProiceDiscount.current)}</span> : null}
                        <span>{toPrice(currentPrice.current)}</span>
                        {currentDiscount.current ? <span className={s.discountPerce}>-{Math.round((currentDiscount.current/currentProiceDiscount.current)*100)}%</span> : null}
                    </div>
                    {
                        (merchType.current === "solomerch")?<div>{currentPrice.current}</div>: <PriceHolder onChange={priceChangeHandler} elems={pricesArr.current} />
                    }
                 
                    <Button text='Купить' className={"btnStyle " + s.buyMerch } onChange={() => {
                        let data: any = {
                            id: Number(snickers),
                            size: String(currentSize.current),
                            sourceTable:merchType.current
                        }

                        createPreorder(data, (hash) => {
                            navigate("/form/" + hash)
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
                    <Button text='Добавить в корзину' className={"btnStyle " + s.buyMerch} onChange={() => {
                        let size = Number(currentSize.current)
                        // if (local === "ru") {
                        //     size = tableInfo.sizes["us"][tableInfo.sizes["ru"].indexOf(Number(currentSize.current))]
                        // }

                        let cart = getCookie("cart")
                        let data: any = {
                            id: Number(snickers),
                            size: currentSize.current,
                            sourceTable:merchType.current
                        }

                        if (cart) {
                            let data: any = {
                                id: Number(snickers),
                                size: String(size),
                                hashUrl: cart,
                                sourceTable:merchType.current
                            }
                            updatePreorder(data, () => {
                                dispatch(cartCountAction(cartCount + 1))
                            })
                        } else {
                            createPreorder(data, (hash) => {
                                //setCookie('cart', hash.hashUrl, { 'max-age': 604800 })
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
                {<Modal onChange={setActive} active={active}>
                    <div className={s.scrollContainer}>
                        <Scroller className={s.scrollStyle}>
                            <TableWithComboboxColumn className={s.modalTable} {...tableInfo} />
                        </Scroller>
                    </div>
                </Modal>}
            </div>
            <MerchComplexSliderField/>
        </div>

    )
}


export default ProductsInfo