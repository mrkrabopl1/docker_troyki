import React, { ReactElement, useEffect, useRef, useState } from 'react'
import PricesBlock from './PricesBlock'
import s from "./style.module.css"
import {useAppSelector} from 'src/store/hooks/redux'
import merchType from 'src/types/merchType'


type MerchType = merchType[]
type PriceHolderType = {
    elems: MerchType|null,
    onChange:(args:any)=>void,
    activeInd?:number
}

const PriceHolder: React.FC<PriceHolderType> = (props) => {
    
    let { elems,onChange,activeInd } = { ...props }

    let [activeState,setActiveState] = useState<number>(activeInd?activeInd:0)
    let priceState = useAppSelector(state => state.priceReducer)

    const activeChange= (ind:number)=>{
        onChange(ind)
        setActiveState(ind)
    }

    function setPriceBlocks() {
        if(elems){
            let arr = elems.map((val, ind) => {
                return <PricesBlock 
                    onChange={()=>activeChange(ind)}
                    active={activeState === ind}
                    size={val.size}
                    price={val.price - val.discount}
                    discount={val.discount}
                    id={ind}
                    />
            })
    
            return arr
        }
        return []
    }


    return (
        <div className={s.priceHolder}>
            {setPriceBlocks()}
        </div>
    )

}



export default PriceHolder