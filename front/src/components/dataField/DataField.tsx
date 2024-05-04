import React, { ReactElement, useEffect, useRef, useState } from 'react'


type DataFieldType = {
    header: string;
    data:{caption:string,description:string}[]
};

const DataField: React.FC<DataFieldType> = (props) => {
    let {header, data} = {...props}
    return (
        <div style={{ display: "flex" }}>
            <div>{header}</div>
            {data.map((el)=>{
                <div>
                    <span>
                        {el.caption}
                    </span>
                    <span>
                        {el.description}
                    </span>
                </div>
            })}
        </div>

    )
}


export default DataField