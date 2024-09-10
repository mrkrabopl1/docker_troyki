import axios from "axios";

const backUrl = process.env.BACKEND_URL

const arrImgImport = function (files: File[], callback: (val: any) => void) {
    const data = new FormData();
    console.log(files.length,"ds")
    files.forEach((pic) => {
        console.log(pic)
            data.append('pictures', pic,  window.btoa(pic.webkitRelativePath));
          });
    console.log(data)

    axios({
        method: 'post',
        url: `http://127.0.0.1:5000/images`,
        headers: {"content-type":"multipart/form-data"},
        data: data
    }).then((res: any) => {
        console.log(res)
        callback(res.data)
    }
    )
}




const getImgs = function (name: string, callback: (val: any) => void) {
    axios({
        method: 'get',
        url: 'http://127.0.0.1:8100/snickersByLine'+"?"+"name="+name,
        headers: {}
    }
    ).then((res:any)=>{
        console.log(res,"klklj")
        callback(res.data)
    })
}






export { arrImgImport, getImgs }