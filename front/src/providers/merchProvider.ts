import axios from "axios";



const getMerchInfo = function (id: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/snickersInfo` + "?" + "id=" + id,
        headers: {}
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

const getCollections = function (collection: collectionType, callback: (val: any) => void) {
    let json = JSON.stringify(collection)
    console.debug(API_URL)
    axios({
        method: 'post',
        url: `${API_URL}/collection`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: json
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
export { getMerchInfo, getSizeTable, getMainInfo, getCollections,getFirms }