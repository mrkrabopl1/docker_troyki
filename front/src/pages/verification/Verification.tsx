import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch } from 'src/store/hooks/redux';
import { useNavigate } from 'src/store/hooks/redux';
import { verifyEmail, getMe } from 'src/providers/userProvider';
import { setUser } from 'src/store/reducers/userSlice';

const Verification: React.FC = () => {
    const navigate = useNavigate();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [info, setInfo] = useState('Проверяем...');

    // 👇 имя параметра = имя файла [token].tsx
    const token = router.query.token as string | undefined;

    useEffect(() => {
        if (!token) return;

        verifyEmail(token, async (data: any) => {
            if (data === true) {
                // Обновляем юзера в Redux (подтянем is_verified если есть)
                const user = await getMe();
                if (user) dispatch(setUser(user));

                // Редирект на главную
                navigate('/');
            } else {
                setInfo('Ссылка недействительна или истекла. Запросите новое письмо.');
            }
        });
    }, [token, dispatch, navigate]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 16,
            color: '#333',
        }}>
            {info}
        </div>
    );
};

export default Verification;