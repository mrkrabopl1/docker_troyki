import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'
import { getCartData, deleteCartData } from 'src/providers/shopProvider'
import { shopAction, cartCountAction } from 'src/store/reducers/menuSlice'
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import MerchBuyBlock from 'src/modules/merchField/MerchBuyBlock'
import DynamicTable from 'src/components/table/simpleTable/DynamicTable'
import Button from 'src/components/Button'
import { setSnickers } from '../../store/reducers/formSlice'
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom'
import { getCookie } from 'src/global'
import MerchTable from 'src/modules/merchField/MerchTable'
import { toPrice } from 'src/global'
type respCartType = {
    id: number,
    img: string,
    name: string,
    sizes: {
        [key: string]: number
    }
}
type dinamicElementType = {
    componentName: string,
    propsData: any
}

const BuyPage: React.FC<any> = () => {
    const navigate = useNavigate();
    let [recalc, setRecalc] = useState<boolean>(true);
    let table = useRef<{ [key: string]: (dinamicElementType | string)[] }>({});
    const dispatch = useAppDispatch();
    let [tableData, setTableData] = useState<Array<any>>([])
    let { shop } = { ...useAppSelector(state => state.menuReducer) }
    let cart = getCookie("cart")
    let refCopyShop = useRef<any>([...shop])
    let requestSizes = useRef<any>({})
    let fullPrice = useRef<number>(0)
    const { cartCount } = useAppSelector(state => state.menuReducer)
    let [active, setActive] = useState<boolean>(!!cartCount)

    // let arrData:propsRowType[]=[
    //     {componentName:"modules/merchBuyBlock", propsData:{data:dataRef.current.sizes.map(val=>{
    //        return {enable:true,activeData:false,name:val}
    //         }
    //     )}},
    //     {componentName:"modules/sliderValueSetter/ZoneSliderValueSetter",propsData:{min:dataRef.current.price[0],max:dataRef.current.price[1]}}

    // ]
    let cartCountRef = useRef<number>(0)
    cartCountRef.current = cartCount
    let activeRef = useRef<boolean>(active)
    activeRef.current = !!cartCount
   // setActive(!!cartCountRef.current)
    useEffect(() => {
        setActive(activeRef.current)
        if (!cartCountRef.current) return
        getCartData(cart, (data) => {
            fullPrice.current = 0;
            data.cartData.forEach(val=>{
                fullPrice.current +=val.price*val.quantity
            })
            setTableData(data.cartData)
        })
        
    }, [cartCountRef.current])

    const formBuyHandle = () => {
        navigate("/form/" + cart)
    }

    return (
        <div>
            {!active ? <div className={s.emptyCart}>
                <div>Корзинга пуста</div>
                <Button className={s.btn + " btnStyle"} text='Продолжить покупки' onChange={formBuyHandle} />
            </div> :
                <div className={s.main} >
                    <h2>
                        Корзина
                    </h2>
                    <MerchTable tableData={tableData} />
                    <div>
                        <div>
                            Промежуточный итог {toPrice(fullPrice.current) }
                        </div>
                        <Button className={s.btn + " btnStyle"} text='Оформить заказ' onChange={formBuyHandle} />
                    </div>
                </div>
            }
        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {

    return false
}

export default memo(BuyPage, arePropsEqual)