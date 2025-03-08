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

const verifyChangePass= function (verHash: string, callback: (val: any) => void) {
    let json = JSON.stringify({token:verHash})
    axios({
        withCredentials:true,
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

const changForgetPass= function (pass: string, callback: (val: any) => void) {
    let json = JSON.stringify({pass})
    axios({
        withCredentials:true,
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
type changePassType = {
    newPass: string,
    oldPass: string
}
const changeUserPass= function (data: changePassType, callback: (val: any) => void) {
    let json = JSON.stringify(data)
    axios({
        method: 'post',
        url: `${API_URL}/changePass`,
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

 const jwtAutorise =function(callback: (val: any) => void){
    axios({
        withCredentials:true,
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


 const updatePass =function(mail:string,callback: (val: any) => void){
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

 const unlogin =function(callback: (val: any) => void){
    axios({
        withCredentials:true,
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

 const setUniqueCustomer = function(callback: (val: any) => void){
    axios({
        withCredentials:true,
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

 const checkCustomerData =function(callback: (val: any) => void){
    axios({
        withCredentials:true,
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

export { registerUser, getUserData, verifyEmail, loginUser, changeUserData, changeUserPass, jwtAutorise, updatePass,verifyChangePass,changForgetPass, unlogin,checkCustomerData, setUniqueCustomer }