import axios from "axios";
const createPreorder = function (data: { id: number, info: { size: string } }, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios({
        withCredentials: true,
        url: `${API_URL}/createPreorder`,
        headers: { "content-type": "application/json" },
        data: jsonData,
        method: 'post',
    }).then((res)=>callback(res.data), (error) => {
        console.warn(error)
    })
}

const updatePreorder = function (data: { id: number, hashUrl: string, info: { size: string } }, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios({
        withCredentials: true,
        url: `${API_URL}/updatePreorder`,
        headers: { "content-type": "application/json" },
        data: jsonData,
        method: 'post',
    }).then((res)=>callback(res.data), (error) => {
        console.warn(error)
    })
}

interface clientDataType {
    personalData: {
        name: string,
        phone: string,
        mail: string,
        secondName?: string
    },
    address: {
        address: {
            town: string,
            index: string,
            region: string,
            street: string,
            house?: string,
            flat?: string
        }
    },
    delivery: {
        deliveryPrice?: number,
        type: number
    },
    save: boolean,
    preorderHash: string
}

const createOrder = function (data: clientDataType, callback: (val: any) => void) {
    let jsonData = JSON.stringify(data)
    axios({
        withCredentials: true,
        url: `${API_URL}/createOrder`,
        headers: { "content-type": "application/json" },
        data: jsonData,
        method: 'post',
    }).then((res) => {
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const getOrderDataByHash = function (hash: string, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        url: `${API_URL}/getOrderDataByHash?hash=` + hash,
        headers: { "content-type": "application/json" },
        method: 'get',
    }).then((res) => {
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const getOrderDataByMail = function (mail: string, orderId: string, callback: (val: any) => void) {
    let jsonData = JSON.stringify({ mail, orderId: Number(orderId) })
    axios({
        withCredentials: true,
        url: `${API_URL}/getOrderDataByMail`,
        headers: { "content-type": "application/json" },
        data: jsonData,
        method: 'post',
    }).then((res) => {
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}


export { createPreorder, updatePreorder, createOrder, getOrderDataByHash, getOrderDataByMail }