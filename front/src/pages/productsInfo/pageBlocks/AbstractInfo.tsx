import React from 'react';
import s from "./style.module.css";
import DoubleInfoDrop from 'src/components/doubleInfoDrop/DoubleInfoDrop';
import Link from 'next/link';

const PRICE_MATCH_TEXT = "Если вы нашли эту модель в другом магазине дешевле — пришлите ссылку. Сделаем скидку до цены конкурента.";
const DELIVERY_TEXT = "Бесплатная доставка от 5000 ₽. Срок доставки 1-3 рабочих дня. Возможна экспресс-доставка.";

const AbstractInfo: React.FC = () => {
    return (
        <div className={s.abstractInfo}>
            <DoubleInfoDrop
                className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                info="ГАРАНТИЯ ЛУЧШЕЙ ЦЕНЫ"
            >
                <div className={s.dropContent}>
                    <p className={s.dropText}>
                        {PRICE_MATCH_TEXT}
                    </p>
                    <p className={s.dropNote}>
                        * Акция действует на российские интернет-магазины
                    </p>
                </div>
            </DoubleInfoDrop>

            <DoubleInfoDrop
                className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                info="ДОСТАВКА"
            >
                <div className={s.dropContent}>
                    <div className={s.dropSection}>
                        <h4 className={s.dropTitle}>Москва</h4>
                        <ul className={s.dropList}>
                            <li>Курьером (13:00-20:00) — 350 ₽ в пределах МКАД</li>
                            <li>День в день — при заказе до 16:00</li>
                        </ul>
                    </div>

                    <div className={s.dropSection}>
                        <h4 className={s.dropTitle}>По России</h4>
                        <ul className={s.dropList}>
                            <li>Почта России — от 4 до 14 дней</li>
                            <li>СДЭК и Боксберри — 3–7 рабочих дней</li>
                        </ul>
                    </div>

                    <div className={s.dropSection}>
                        <h4 className={s.dropTitle}>Международная</h4>
                        <ul className={s.dropList}>
                            <li>Почта России, только по 100% предоплате</li>
                        </ul>
                    </div>

                    <div className={s.dropFooter}>
                        <Link href="/delivery" className={s.dropLink}>Подробные условия доставки →</Link>
                    </div>
                </div>
            </DoubleInfoDrop>

            <DoubleInfoDrop
                className={{ main: s.doubleInfoDropFirst, second: s.doubleInfoDropSecond }}
                info="ОПЛАТА"
            >
                <div className={s.dropContent}>
                    <ul className={s.dropList}>
                        <li>Наличными курьеру или в магазине</li>
                        <li>Банковской картой онлайн (Visa, Mastercard, МИР)</li>
                        <li className={s.dropListItemAccent}>Товары со скидкой — только полная предоплата</li>
                    </ul>
                    
                    <div className={s.dropFooter}>
                        <Link href="/payment" className={s.dropLink}>Все способы оплаты →</Link>
                    </div>
                </div>
            </DoubleInfoDrop>
        </div>
    );
};

export default React.memo(AbstractInfo);