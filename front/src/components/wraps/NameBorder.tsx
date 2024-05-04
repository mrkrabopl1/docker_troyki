import React, { ReactElement, RefObject, useRef, useState } from 'react'


const NameBorder = React.forwardRef((props:{content:ReactElement,name:string},ref:React.Ref<HTMLDivElement>) => {
    let {content,name} = {...props}
    return (
        <div  ref={ref}>
            <fieldset style={{ padding:"20px", margin:"10px"}}>
                <legend>{name}</legend>
                {content}
            </fieldset>
        </div>
      
      
    )
})
export default NameBorder