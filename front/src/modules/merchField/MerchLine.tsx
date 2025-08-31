import React, { useCallback,memo } from 'react'
import s from "./style.module.css"



interface MerchInterface { name: string, img: string, id: string, firm: string, price: string, onChange:(val)=>void }

const MerchLine: React.FC< MerchInterface > = ( { name, img, id, firm, price, onChange} ) => {
    const handleChange = useCallback(() => {
        onChange(id);
    }, [id, onChange]);
    return (
        <div onMouseDown={(e)=>{e.preventDefault()}} onClick={handleChange} className={s.merchLine}>
            <img className={s.img} style={{ flexShrink: 0, width:"120px" }} src={"/" + img} alt="" />
            <div style={{ flexShrink: 0,width:"100%" }}>
                <p>
                    {firm.toUpperCase()}
                </p>
                <p>
                    {name}
                </p>
                <p>
                    {price}
                </p>
            </div>
        </div>
    )
}


export default memo(MerchLine)