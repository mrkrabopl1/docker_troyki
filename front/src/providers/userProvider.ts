import axios from "axios";
import { getCookie } from "src/global";

type userDataType = {
    pass: string,
    mail: string
}

const registerUser = function (data: userDataType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/registerUser`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,

        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        console.debug(getCookie("token"))
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const getUserData = function (callback: (val: any) => void) {

    const data = new FormData();
    axios({
        method: 'get',
        url: `${API_URL}/getUserData`,
        withCredentials: true,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })

}
const verifyEmail = function (verHash: string, callback: (val: any) => void) {
    let json = JSON.stringify({ token: verHash })
    axios({
        method: 'post',
        url: `${API_URL}/verify`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const verifyChangePass = function (verHash: string, callback: (val: any) => void) {
    let json = JSON.stringify({ token: verHash })
    axios({
        withCredentials: true,
        method: 'post',
        url: `${API_URL}/verifyChangePass`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const changForgetPass = function (pass: string, callback: (val: any) => void) {
    let json = JSON.stringify({ pass })
    axios({
        withCredentials: true,
        method: 'post',
        url: `${API_URL}/changeForgetPass`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

type loginDataType = {
    mail: string,
    pass: string
}
const loginUser = function (data: loginDataType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/login`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,

        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        console.debug(getCookie("token"))
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const changeUserData = function (data: loginDataType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/login`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,

        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        console.debug(getCookie("token"))
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}
type changePassType = {
    newPass: string,
    oldPass: string
}
const changeUserPass = function (data: changePassType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/changePass`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,

        data: json
    }
    ).then((res: any) => {
        console.log(res.data)
        console.debug(getCookie("token"))
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const jwtAutorise = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/jwtAutorise`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res)
    }, (error) => {
        console.warn(error)
    })
}


const updatePass = function (mail: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/forgetPass` + "?" + "mail=" + mail,
        headers: {}
    }
    ).then((res: any) => {
        callback(res)
    }, (error) => {
        console.warn(error)
    })
}

const unlogin = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/unlogin`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res)
    }, (error) => {
        console.warn(error)
    })
}

const setUniqueCustomer = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/setUniqueCustomer`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

const checkCustomerData = function (callback: (val: any) => void) {
    axios({
        withCredentials: true,
        method: 'get',
        url: `${API_URL}/checkCustomerData`,
        headers: {}
    }
    ).then((res: any) => {
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })
}

// ============ НОВЫЕ МЕТОДЫ ДЛЯ НОВОСТНОЙ РАССЫЛКИ ============

type SubscribeNewsletterData = {
    email: string;
    username?: string;
}

type NewsletterResponse = {
    message: string;
    email?: string;
    error?: string;
}

type BroadcastData = {
    subject: string;
    content: string;
}

type NewsletterStats = {
    verified_count: number;
    pending_count: number;
    unsubscribed_count: number;
    total_count: number;
}

/**
 * Подписка на новостную рассылку
 * @param data - объект с email и опциональным именем пользователя
 * @param callback - функция обратного вызова
 */
const subscribeToNewsletter = function (data: SubscribeNewsletterData, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/subscribe`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
        data: json
    }
    ).then((res: any) => {
        console.log('Newsletter subscription:', res.data)
        callback(res.data)
    }, (error) => {
        console.warn('Newsletter subscription error:', error)
        if (error.response) {
            callback(error.response.data)
        } else {
            callback({ error: "Network error" })
        }
    })
}

/**
 * Подтверждение подписки на новостную рассылку
 * @param token - токен подтверждения из email
 * @param callback - функция обратного вызова
 */
const verifyNewsletterSubscription = function (token: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/newsletter/verify/${token}`,
        headers: {},
        withCredentials: true
    }
    ).then((res: any) => {
        console.log('Newsletter verification:', res.data)
        callback(res.data)
    }, (error) => {
        console.warn('Newsletter verification error:', error)
        if (error.response) {
            callback(error.response.data)
        } else {
            callback({ error: "Network error" })
        }
    })
}

/**
 * Отписка от новостной рассылки
 * @param email - email для отписки
 * @param callback - функция обратного вызова
 */
const unsubscribeFromNewsletter = function (email: string, callback: (val: any) => void) {
    let json = JSON.stringify({ email })
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/unsubscribe`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
        data: json
    }
    ).then((res: any) => {
        console.log('Unsubscribe from newsletter:', res.data)
        callback(res.data)
    }, (error) => {
        console.warn('Unsubscribe error:', error)
        if (error.response) {
            callback(error.response.data)
        } else {
            callback({ error: "Network error" })
        }
    })
}

/**
 * Получение статистики рассылки (только для админов)
 * @param callback - функция обратного вызова
 */
const getNewsletterStats = function (callback: (val: NewsletterStats | any) => void) {
    axios({
        method: 'get',
        url: `${API_URL}/newsletter/stats`,
        headers: {},
        withCredentials: true
    }
    ).then((res: any) => {
        console.log('Newsletter stats:', res.data)
        callback(res.data)
    }, (error) => {
        console.warn('Get stats error:', error)
        if (error.response) {
            callback(error.response.data)
        } else {
            callback({ error: "Network error" })
        }
    })
}

/**
 * Отправка массовой рассылки (только для админов)
 * @param data - объект с темой и содержанием письма
 * @param callback - функция обратного вызова
 */
const sendNewsletterBroadcast = function (data: BroadcastData, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/newsletter/broadcast`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true,
        data: json
    }
    ).then((res: any) => {
        console.log('Broadcast sent:', res.data)
        callback(res.data)
    }, (error) => {
        console.warn('Broadcast error:', error)
        if (error.response) {
            callback(error.response.data)
        } else {
            callback({ error: "Network error" })
        }
    })
}

export {
    registerUser,
    getUserData,
    verifyEmail,
    loginUser,
    changeUserData,
    changeUserPass,
    jwtAutorise,
    updatePass,
    verifyChangePass,
    changForgetPass,
    unlogin,
    checkCustomerData,
    setUniqueCustomer,
    // Экспортируем новые методы
    subscribeToNewsletter,
    verifyNewsletterSubscription,
    unsubscribeFromNewsletter,
    getNewsletterStats,
    sendNewsletterBroadcast
}