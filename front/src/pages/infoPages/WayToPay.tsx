import React, { useEffect, useRef, useState } from 'react';
import s from "./waytopay.module.css";
import { finishLoading } from 'src/store/reducers/loadingSlice';
import { useAppDispatch } from 'src/store/hooks/redux';

// Компонент для анимированного появления текста
const RevealText: React.FC<{ children: React.ReactNode; delay?: number }> = ({
  children,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  dispatch(finishLoading());
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
        rootMargin: '0px 0px -50px 0px'
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

const WayToPay: React.FC = () => {
  return (
    <div className={s.infoPage}>
      {/* Заголовок страницы */}
      <RevealText delay={0}>
        <h1 className={s.mainHeader}>Способы оплаты</h1>
      </RevealText>

      {/* Разделитель */}
      <RevealText delay={20}>
        <div className={s.divider} />
      </RevealText>

      {/* Москва и Московская область */}
      <RevealText delay={40}>
        <h2 className={s.middleHeader}>Оплата для Москвы и Московской области</h2>
      </RevealText>

      <RevealText delay={60}>
        <div className={s.textBlock}>
          <p>Для жителей столичного региона доступны следующие способы оплаты:</p>

          <div className={s.paymentMethod}>
            <div className={s.paymentIcon}>💳</div>
            <div className={s.paymentContent}>
              <h3>Тинькофф Касса</h3>
              <p>Выставление счёта на указанный адрес электронной почты.</p>
              <p className={s.paymentNote}>Доступные способы: банковские карты Visa, Mastercard, МИР, Union Pay; Tinkoff Pay, Yandex Pay, СБП</p>
            </div>
          </div>

          <div className={s.paymentMethod}>
            <div className={s.paymentIcon}>💵</div>
            <div className={s.paymentContent}>
              <h3>Наличные курьеру</h3>
              <p>Для товаров из категории «В наличии» доступна оплата курьеру наличными или банковскими картами в мобильном терминале при получении</p>
            </div>
          </div>

          <div className={s.paymentMethod}>
            <div className={s.paymentIcon}>🏦</div>
            <div className={s.paymentContent}>
              <h3>Перевод по реквизитам</h3>
              <p>Оплата переводом по реквизитам компании</p>
            </div>
          </div>

          <div className={s.highlight}>
            <p className={s.iconInfo}>📍 Все способы оплаты доступны для заказов в пределах Москвы и Московской области</p>
          </div>
        </div>
      </RevealText>

      {/* Разделитель между регионами */}
      <RevealText delay={80}>
        <div className={s.sectionDivider} />
      </RevealText>

      {/* Россия */}
      <RevealText delay={100}>
        <h2 className={s.middleHeader}>Оплата для России</h2>
      </RevealText>

      <RevealText delay={120}>
        <div className={s.textBlock}>
          <p>Для жителей других регионов России доступны следующие способы оплаты:</p>

          <div className={s.paymentMethod}>
            <div className={s.paymentIcon}>💳</div>
            <div className={s.paymentContent}>
              <h3>Тинькофф Касса</h3>
              <p>Выставление счёта на указанный адрес электронной почты.</p>
              <p className={s.paymentNote}>Доступные способы: банковские карты Visa, Mastercard, МИР, Union Pay; Tinkoff Pay, Yandex Pay, СБП</p>
            </div>
          </div>

          <div className={s.paymentMethod}>
            <div className={s.paymentIcon}>🏦</div>
            <div className={s.paymentContent}>
              <h3>Перевод по реквизитам</h3>
              <p>Оплата переводом по реквизитам компании</p>
            </div>
          </div>

          <div className={s.paymentGrid}>
            <div className={s.paymentCard}>
              <span className={s.cardIcon}>💳</span>
              <h4>Банковские карты</h4>
              <p>Visa, Mastercard, МИР, Union Pay</p>
            </div>
            <div className={s.paymentCard}>
              <span className={s.cardIcon}>📱</span>
              <h4>Мобильные платежи</h4>
              <p>Tinkoff Pay, Yandex Pay</p>
            </div>
            <div className={s.paymentCard}>
              <span className={s.cardIcon}>⚡</span>
              <h4>СБП</h4>
              <p>Система быстрых платежей</p>
            </div>
          </div>

          <div className={s.note}>
            <p className={s.iconNote}>ℹ️ Для регионов оплата производится только по 100% предоплате. Доставка осуществляется после поступления средств на наш счет.</p>
          </div>
        </div>
      </RevealText>

      {/* Дополнительная информация */}
      <RevealText delay={140}>
        <div className={s.infoBox}>
          <h3 className={s.infoTitle}>Важная информация</h3>
          <ul className={s.checkList}>
            <li>Все платежи защищены и проходят через сертифицированные платежные шлюзы</li>
            <li>После оплаты вы получите чек на указанную электронную почту</li>
            <li>При оплате банковской картой комиссия не взимается</li>
            <li>Для юридических лиц доступна оплата по счету с предоставлением закрывающих документов</li>
          </ul>
        </div>
      </RevealText>
    </div>
  );
};

export default WayToPay;