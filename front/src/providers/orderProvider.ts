import axios from "axios";
const createPreorder = function (data: { id: number, info: { size: string } }, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios.post(`${API_URL}/createPreorder`, jsonData, { headers: { "content-type": "application/json" } }).then((res) => {
        callback(res.data)
    }
    )

}

const updatePreorder = function (data: { id: number, hashUrl: string, info: { size: string } }, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios.post(`${API_URL}/updatePreorder`, jsonData, { headers: { "content-type": "application/json" } }).then((res) => {
        callback(res.data)
    }
    )

}

interface clientDataType {
    personalData:{
        name:string,
        phone:string,
        mail:string,
        secondName?:string
    },
    address:{
        postIndex:number,
        address:string
    },
    delivery:{
        deliveryPrice?:number,
        type:number
    },
    preorderId:string
} 

const createOrder = function (data: clientDataType, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios.post(`${API_URL}/createOrder`, jsonData, { headers: { "content-type": "application/json" } }).then((res) => {
        callback(res.data)
    }
    )

}



export { createPreorder, updatePreorder, createOrder }