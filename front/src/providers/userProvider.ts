import axios from "axios";
import { getCookie } from "src/global";

type userDataType = {
    name: string,
    password: string,
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
        withCredentials:true,
     
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

const getUserData = function ( callback: (val: any) => void) {

    const data = new FormData();
    axios({
        method: 'get',
        url: `${API_URL}/getUserData`,
        withCredentials:true,
        headers: {}
    }
    ).then((res: any) => {
        console.log(res.data)
        callback(res.data)
    }, (error) => {
        console.warn(error)
    })

}
const verifyEmail= function (verHash: string, callback: (val: any) => void) {
    let json = JSON.stringify({token:verHash})
    axios({
        method: 'post',
        url: `${API_URL}/verifyEmail`,
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
    name: string,
    password: string
}

const loginUser= function (data: loginDataType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/login`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials:true,
     
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

const changeUserData= function (data: loginDataType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/login`,
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials:true,
     
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

export { registerUser, getUserData, verifyEmail, loginUser, changeUserData }