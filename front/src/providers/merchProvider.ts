import axios from "axios";



const getMerchInfo = function (id: string, callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/productsInfo` + "?" + "id=" + id,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
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
    },  (error: any) => {
        console.warn(error)
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
    },  (error: any) => {
        console.warn(error)
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
    },  (error: any) => {
        console.warn(error)
    })
}

type collectionType = {
    name: string,
    page: number,
    size: number
}
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})


export const getCollectionBySlug = async (slug: string) => {
    const response = await api.get(`/collections/${slug}`)
    return response.data
}
export const getCollectionProducts = function(
    slug: string,
    params: {
        page: number,
        size: number,
        sortType: number,
        search?: string,
        filters?: any
    },
    callback: (val: any) => void
) {
    axios({
        method: 'post',
        url: `${API_URL}/collections/${slug}/products`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({
            page: params.page,
            size: params.size,
            sortType: params.sortType,
            search: params.search || '',
            filters: params.filters || {}
        })
    }).then((res: any) => {
        console.debug(res.data)
        callback(res.data)
    }).catch((error) => {
        console.warn(error)
        callback(null)
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
    },  (error: any) => {
        console.warn(error)
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
    },  (error: any) => {
        console.warn(error)
    })
}

const getCategoriesAndTypes = function (callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/categoriesWithTypes`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}

const getSizeTable = function (category: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/sizeTable?category=` + category,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    },  (error: any) => {
        console.warn(error)
    })
}


const getMainPage = async function (): Promise<any> {
  try {
    const res = await axios({
      method: 'get',
      url: `${API_URL}/getMainPage`,
      headers: {}
    });
    return res.data;
  } catch (error) {
    console.warn(error);
    throw error; // Пробрасываем ошибку для обработки в fetchData
  }
};
export { getMerchInfo, getSizeTable, getMainInfo, getCollections, getFirms, getHistoryInfo, getDiscontInfo,getCategoriesAndTypes, getMainPage }