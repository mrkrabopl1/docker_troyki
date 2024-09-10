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
    preorderId: string
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
    })
}



export { createPreorder, updatePreorder, createOrder }