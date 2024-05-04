import React, { useEffect, ReactElement, useState, useRef, memo } from 'react'
import { getCartData, deleteCartData } from 'src/providers/shopProvider'
import { shopAction ,cartCountAction} from 'src/store/reducers/menuSlice'
import { useAppDispatch, useAppSelector } from 'src/store/hooks/redux'
import MerchBuyBlock from 'src/modules/merchField/MerchBuyBlock'
import DynamicTable from 'src/components/table/simpleTable/DynamicTable'
import Button from 'src/components/Button'
import { setSnickers } from '../../store/reducers/formSlice'
import s from "./style.module.css"
import { useNavigate } from 'react-router-dom'
import { getCookie } from 'src/global'


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
    let { shop } = { ...useAppSelector(state => state.menuReducer) }
    let cart = getCookie("cart")
    let refCopyShop = useRef<any>([...shop])
    let requestSizes = useRef<any>({})
   
    // let arrData:propsRowType[]=[
    //     {componentName:"modules/merchBuyBlock", propsData:{data:dataRef.current.sizes.map(val=>{
    //        return {enable:true,activeData:false,name:val}
    //         }
    //     )}},
    //     {componentName:"modules/sliderValueSetter/ZoneSliderValueSetter",propsData:{min:dataRef.current.price[0],max:dataRef.current.price[1]}}

    // ]
    const {cartCount} = useAppSelector(state =>state.menuReducer)
    let cartCountRef = useRef<number>(0)
    cartCountRef.current = cartCount
    const updateList = (index: number,productId:number,  quantity: number) => {
        deleteCartData(productId,()=>{
            dispatch(cartCountAction(cartCountRef.current-quantity))
            delete table.current[index]
            setRecalc(recalc => !recalc)
        })
    }

    const setMerchBuyBlock = (data: any) => {
        let snickers = []
        data.forEach((el: any, ind: number) => {
            let totalPrice = 0
            let row = [];
            totalPrice += el.price * el.quantity
            let soloSnickers = { id: el.id, firm: el.firm, price: el.size, name: el.name, img: el.img, count: el.quantity }
            row.push({ componentName: "modules/merchField/MerchBuyBlock", propsData: { data: { id: el.id, firm: el.firm, price: el.size, name: el.name, imgs: el.img } } })
            row.push( el.quantity)
            row.push(String(totalPrice))
            row.push({ componentName: "components/Button", propsData: { className: s.deleteBtn, onChange: updateList.bind(null, ind, el.prid, el.quantity) } })
            table.current[String(ind)] = row
            snickers.push(soloSnickers)
        })
        dispatch(setSnickers(snickers))
        setRecalc(recalc => !recalc)
    }
    useEffect(() => {
        getCartData(cart, setMerchBuyBlock)
    }, [])

    const formBuyHandle = () => {
        navigate("/form/"+cart)
    }

    return (
        <div  >
            <DynamicTable headers={["Товар", "Koличество", "Цена", ""]} table={Object.values(table.current)} />
            <Button text='Оформить заказ' onChange={formBuyHandle} />
        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {

    return false
}

export default memo( BuyPage, arePropsEqual)