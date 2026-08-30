import React, { useEffect } from 'react';
import s from "./about.module.css";
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

const About: React.FC = () => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(finishLoading());
        }, 0);

        return () => clearTimeout(timer);
    }, [dispatch]);

    return (
        <div>
            {/* Параллакс блок */}
            <div className={s.parallax}>
                <h1 className={s.mainTitle}>Тройки.Бенч</h1>
                <p className={s.subTitle}>мультибрендовый магазин обуви, одежды и аксессуаров</p>
            </div>

            {/* Контент */}
            <div className={s.content}>
                <div className={s.contentInner}>
                    <div className={s.textBlock}>
                        <p className={s.lead}>
                            Мы ворвались в культуру еще в десятых, когда каждый уважающий себя сникерхэд
                            гонялся за ретро AJ1 и стоял в очередях за лимитированными Yeezy 350.
                            А те, кто ценил свое время, шли к нам за эксклюзивными моделями.
                        </p>
                    </div>

                    <div className={s.imageGrid}>
                        <div className={s.imageCard}>
                            <img src="/images/about/img1.webp" alt="Nike Air Jordan" />
                            <span className={s.imageCaption}>Nike Air Jordan 1 Retro</span>
                        </div>
                        <div className={s.imageCard}>
                            <img src="/images/about/img2.webp" alt="Adidas Yeezy" />
                            <span className={s.imageCaption}>Adidas Yeezy 350 V2</span>
                        </div>
                    </div>

                    <div className={s.textBlock}>
                        <p>
                            Сейчас пришло время обновлений: теперь мы интернет-магазин "Тройки.Бенч".
                            Но за новым названием скрывается проверенная годами работа. У нас вы можете
                            просто и быстро приобрести редкие позиции любимых брендов.
                        </p>
                    </div>

                    <div className={s.imageGrid}>
                        <div className={s.imageCard}>
                            <img src="/images/about/img3.webp" alt="New Balance" />
                            <span className={s.imageCaption}>New Balance 990v5</span>
                        </div>
                        <div className={s.imageCard}>
                            <img src="/images/about/img4.webp" alt="Nike Dunk" />
                            <span className={s.imageCaption}>Nike Dunk Low</span>
                        </div>
                    </div>

                    <div className={s.statsGrid}>
                        <div className={s.statItem}>
                            <strong>24</strong>
                            <span>часа доставка по Москве</span>
                        </div>
                        <div className={s.statItem}>
                            <strong>5-7</strong>
                            <span>дней индивид. заказы</span>
                        </div>
                        <div className={s.statItem}>
                            <strong>14</strong>
                            <span>дней на возврат</span>
                        </div>
                    </div>

                    <div className={s.highlight}>
                        <p>
                            Все товары в наличии — доставка за сутки<br />
                            Индивидуальные заказы — 5-7 дней<br />
                            Обмен и возврат — 14 дней
                        </p>
                    </div>
                </div>
            </div>

            {/* Второй параллакс блок */}
            <div className={s.parallaxFooter}>
                <h2 className={s.footerTitle}>TROYKI BENCH</h2>
                <p className={s.footerText}>Больше чем просто обувь</p>
            </div>
        </div>
    );
};

export default About;