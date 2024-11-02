import axios from "axios";



const getMerchInfo = function (id: string, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/snickersInfo` + "?" + "id=" + id,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    })
}

const getHistoryInfo = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/historyInfo`,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    })
}

const getDiscontInfo = function (max: number, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'post',
        url: `${API_URL}/disconts`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: { max }
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    })
}

const getFirms = function (callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/firms`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    })
}

type collectionType = {
    name: string,
    page: number,
    size: number
}

const getCollection = function (reqData: { name: string, page: number, size: number }, callback: (val: any) => void) {
    axios({
        method: 'post',
        url: `${API_URL}/collection`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: reqData
    }
    ).then((res: any) => {
        callback(res.data)
    })
}

const getCollections = function (reqData: { names: string[], page: number, size: number }, callback: (val: any) => void) {
    axios({
        method: 'post',
        url: `${API_URL}/collections`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: reqData
    }
    ).then((res: any) => {
        callback(res.data)
    })
}

const getMainInfo = function (callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/mainPage`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    })
}

const getSizeTable = function (callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/sizeTable`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    })
}
export { getMerchInfo, getSizeTable, getMainInfo, getCollections, getFirms, getHistoryInfo, getDiscontInfo, getCollection }