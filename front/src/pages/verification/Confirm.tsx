import React, { useEffect, memo } from 'react'
import { useRouter } from 'next/router';
import { verifyChangePass } from 'src/providers/userProvider'
type urlParamsType = {
    verHash: string;
};
const Confirm: React.FC<any> = () => {
     const router = useRouter();
    let  verHash = router.query.verHash as string;
    useEffect(() => {
        verifyChangePass(verHash, (data) => {
            if (data) {
                router.push("/changePass");
            }
            else {
                //router.push("/");
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