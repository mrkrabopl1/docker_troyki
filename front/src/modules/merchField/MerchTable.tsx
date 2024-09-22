import React, { ReactElement, useEffect, useRef, useState } from 'react'
import s from "./style.module.css"
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux'
import DynamicElement from 'src/components/dynamicElement/DynamicElement'
import MerchBuyBlock from './MerchBuyBlock'
import { getCartData, deleteCartData } from 'src/providers/shopProvider'
import { shopAction, cartCountAction } from 'src/store/reducers/menuSlice'
import Button from 'src/components/Button'
import { toPrice } from 'src/global';
type dinamicElementType = {
    componentName: string,
    propsData: any
}



type sortingType = (tableArr: string[][], id: number) => void

type sortedType = {
    index: number,
    direction: boolean
}

type tableType = {
    tableData: any,
    className?: string
}

const headers = ["Продукт", "Количество", "Цена"]

const MerchTable: React.FC<tableType> = (props) => {
    let { tableData, className } = { ...props }
    let [tableState, setTableState] = useState<any>(tableData)
    const dispatch = useAppDispatch();
    const init = useRef<boolean>(false)
    let [recalc, setRecalc] = useState<boolean>(true);
    function createHeaders() {
        let headerArr = [
            <th style={{ textAlign: "left" }}>
                <div>
                    <span>{"Продукт"}</span>
                </div>
            </th>,
            <th style={{ textAlign: "center" }}>
                <div>
                    <span>{"Количество"}</span>
                </div>
            </th>,
            <th style={{ textAlign: "right" }}>
                <div>
                    <span>{"Цена"}</span>
                </div>
            </th>
        ]

        return headerArr
    }

    useEffect(() => {
        init.current = true
        if (init.current) {
            setTableState(tableData)
        }
    }, [tableData])

    function createTables() {
        let tableArr = []
        if (tableData.length) {
            tableData.forEach((el: any, ind: number) => {
                tableArr.push(<tr>
                    {createTableRow(el, ind)}
                </tr>)
            })
        }
        return tableArr
    }
    const { cartCount } = useAppSelector(state => state.menuReducer)
    let cartCountRef = useRef<number>(0)



    cartCountRef.current = cartCount
    const updateList = (index: number, productId: number, quantity: number) => {
        deleteCartData(productId, () => {
            dispatch(cartCountAction(cartCountRef.current - quantity))
            delete tableState[index]
            setTableState(tableState)
            setRecalc(!recalc)
        })
    }

    function createTableRow(el: any, ind: number) {
        let rowArr = []
        rowArr.push(<td style={{ width: "60%" }}>{<MerchBuyBlock onChange={() => { { } }} data={{ id: el.id, firm: el.firm, price: el.size, name: el.name, imgs: el.img }} />}</td>)
        rowArr.push(<td style={{textAlign: "center"}}>{el.quantity}</td>)
        rowArr.push(<td style={{textAlign: "right"}}>{toPrice(el.price * el.quantity)}</td>)
        rowArr.push(<td style={{textAlign: "center"}}><Button onChange={updateList.bind(null, ind, el.prid, el.quantity)} className={s.deleteBtn} /></td>)

        return rowArr
    }
    return (
        <table className={className} style={{
            borderCollapse: 'collapse',
            borderSpacing: '0px',
            width: "100%",
            textAlign: "left"
        }}>
            <thead>
                <tr>
                    {createHeaders()}
                </tr>
            </thead>
            <tbody>
                {createTables()}
            </tbody>
        </table>

    )
}

export default MerchTable