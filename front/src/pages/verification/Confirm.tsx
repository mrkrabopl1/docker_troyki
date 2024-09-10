import React, { useEffect, memo } from 'react'
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { verifyChangePass } from 'src/providers/userProvider'
type urlParamsType = {
    verHash: string;
};
const Confirm: React.FC<any> = () => {
    let { verHash } = useParams<urlParamsType>();
    const navigate = useNavigate();
    useEffect(() => {
        verifyChangePass(verHash, (data) => {
            if (data) {
                navigate("/changePass");
            }
            else {
                //navigate("/");
            }
        })


    }, [])
    return (
        <div>
        </div>
    )
}


function arePropsEqual(oldProps: any, newProps: any) {

    return (oldProps.memo == newProps.memo)
}

export default memo(Confirm, arePropsEqual)