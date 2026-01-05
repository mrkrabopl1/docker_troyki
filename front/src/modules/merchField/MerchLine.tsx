import React, { useCallback, memo } from 'react'
import s from "./style.module.css"
import { toPrice } from 'src/global';



interface MerchInterface { name: string, img: string, id: string, firm: string, price: string, onChange: (val) => void }

const MerchLine: React.FC<MerchInterface> = ({ name, img, id, firm, price, onChange }) => {
    const handleChange = useCallback(() => {
        onChange(id);
    }, [id, onChange]);
    return (
        <div onMouseDown={(e) => { e.preventDefault() }} onClick={handleChange} className={s.merchLine}>
            <img className={s.img} style={{ flexShrink: 0, width: "160px" }} src={"/" + img} alt="" />
            <div className= {s.textHolder} >
                <p className={s.firmName} style={{textAlign: "left", fontWeight: "bold", marginBottom: "5px", marginTop: "5px"}}>
                    {firm.toUpperCase()}
                </p>
                <div style={{display: "flex", flex:1, justifyContent: "space-between", alignItems: "center"}}>
                    <p className={s.productNameHolder}>
                        {name}
                    </p>
                    <p className={s.price}>
                        От {toPrice(price)}
                    </p>
                </div>
            </div>
        </div>
    )
}


export default memo(MerchLine)