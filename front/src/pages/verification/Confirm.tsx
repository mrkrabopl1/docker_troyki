import React, { useEffect, memo } from 'react'
import { useRouter } from 'next/router';
import { useNavigate } from 'src/store/hooks/redux'
import { verifyChangePass } from 'src/providers/userProvider'
type urlParamsType = {
    verHash: string;
};
const Confirm: React.FC<any> = () => {
    const router = useRouter();
    const navigate = useNavigate()
    let verHash = router.query.verHash as string;
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