import React, { ReactElement, useEffect, useRef, useState } from 'react'
import { getCdekDeliveryData } from 'src/providers/cdek'
const DeliveryInfo: React.FC<any> = (props) => {
    useEffect(()=>{
        getCdekDeliveryData("test",()=>{})
    })
    return(
        <div style={{display:"flex"}}>
           
        </div>
    )
}


export default DeliveryInfo