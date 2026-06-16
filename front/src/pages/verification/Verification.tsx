import React, { useEffect, useState, memo } from 'react'
import { useRouter } from 'next/router';
import { verifyEmail } from 'src/providers/userProvider'
import { useAppDispatch } from 'src/store/hooks/redux';
import { verified } from 'src/store/reducers/menuSlice'

const Verification: React.FC<any> = () => { 
    const router = useRouter();
    const verHash = router.query.verHash as string;
    let dispatch = useAppDispatch()
    let [info, setInfo] = useState("")

    useEffect(() => {
        if (!verHash) return;
        verifyEmail(verHash, (data) => {
            if (data) {
                dispatch(verified(true))
                router.push("/");
            } else {
                setInfo("Ваш код верификации истек повторите попытку еще раз.")
            }
        })
    }, [verHash])

    return (
        <div>
            {info}
        </div>
    )
}

function arePropsEqual(oldProps: any, newProps: any) {
    return (oldProps.memo == newProps.memo)
}

export default memo(Verification, arePropsEqual)