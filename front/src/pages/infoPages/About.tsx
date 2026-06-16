import React, { useEffect, useRef, useState } from 'react';
import s from "./about.module.css";
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

// Компонент для анимированного появления
const RevealText: React.FC<{ children: React.ReactNode; delay?: number }> = ({
    children,
    delay = 0
}) => {

    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        if (elementRef.current) {
                            observer.unobserve(elementRef.current);
                        }
                    }
                });
            },
            {
                threshold: 0.2,
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={elementRef}
            className={`${s.fxReveal} ${isVisible ? s.fxRevealVisible : ''}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const About: React.FC = () => {
    const dispatch = useAppDispatch();
    useEffect(() => {
        // Небольшая задержка для гарантии что resetLoading уже отработал
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
                    <RevealText delay={20}>
                        <p className={s.lead}>
                            Мы ворвались в культуру еще в десятых, когда каждый уважающий себя сникерхэд
                            гонялся за ретро AJ1 и стоял в очередях за лимитированными Yeezy 350.
                            А те, кто ценил свое время, шли к нам за эксклюзивными моделями.
                        </p>
                    </RevealText>

                    <RevealText delay={40}>
                        <div className={s.imageGrid}>
                            <div className={s.imageCard}>
                                <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600" alt="Nike Air Jordan" />
                                <span className={s.imageCaption}>Nike Air Jordan 1 Retro</span>
                            </div>
                            <div className={s.imageCard}>
                                <img src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600" alt="Adidas Yeezy" />
                                <span className={s.imageCaption}>Adidas Yeezy 350 V2</span>
                            </div>
                        </div>
                    </RevealText>

                    <RevealText delay={60}>
                        <p>
                            Сейчас пришло время обновлений: теперь мы интернет-магазин "Тройки.Бенч".
                            Но за новым названием скрывается проверенная годами работа. У нас вы можете
                            просто и быстро приобрести редкие позиции любимых брендов.
                        </p>
                    </RevealText>

                    <RevealText delay={80}>
                        <div className={s.imageGrid}>
                            <div className={s.imageCard}>
                                <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600" alt="New Balance" />
                                <span className={s.imageCaption}>New Balance 990v5</span>
                            </div>
                            <div className={s.imageCard}>
                                <img src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600" alt="Nike Dunk" />
                                <span className={s.imageCaption}>Nike Dunk Low</span>
                            </div>
                        </div>
                    </RevealText>

                    <RevealText delay={100}>
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
                    </RevealText>

                    <RevealText delay={120}>
                        <div className={s.highlight}>
                            <p>
                                Все товары в наличии — доставка за сутки<br />
                                Индивидуальные заказы — 5-7 дней<br />
                                Обмен и возврат — 14 дней
                            </p>
                        </div>
                    </RevealText>
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