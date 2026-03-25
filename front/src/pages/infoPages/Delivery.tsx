import React, { useEffect, useRef, useState } from 'react';
import s from "./delivery.module.css";

// Компонент для анимированного появления текста
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

const Delivery: React.FC = () => {
  return (
    <div className={s.infoPage}>
      {/* Заголовок страницы */}
      <RevealText delay={0}>
        <h1 className={s.mainHeader}>Доставка и самовывоз</h1>
      </RevealText>

      {/* Разделитель */}
      <RevealText delay={20}>
        <div className={s.divider} />
      </RevealText>

      {/* Способы доставки */}
      <RevealText delay={40}>
        <h2 className={`${s.middleHeader} ${s.center}`}>
          Способы доставки и самовывоза
        </h2>
      </RevealText>

      {/* Обработка заказа */}
      <RevealText delay={60}>
        <h2 className={s.middleHeader}>Обработка заказа</h2>
      </RevealText>
      
      <RevealText delay={80}>
        <div className={s.textBlock}>
          <p>
            Обратите внимание, что после размещения ваш заказ поступает в обработку. 
            Обработка заказа занимает в среднем 3 часа и не может занимать более 24 часов 
            с момента размещения заказа. Дополнительное время может потребоваться в период 
            распродаж и нерабочих/праздничных дней. В процессе обработки заказа с вами 
            свяжется наш менеджер для уточнения деталей заказа.
          </p>
        </div>
      </RevealText>

      {/* Доставка по Москве */}
      <RevealText delay={100}>
        <h2 className={s.middleHeader}>Доставка по Москве и Московской области</h2>
      </RevealText>
      
      <RevealText delay={120}>
        <div className={s.textBlock}>
          <p>
            По Москве и Московской Области осуществляется адресная доставка курьерской службой. 
            Сроки и стоимость доставки рассчитываются автоматически на этапе оформления заказа.
          </p>
          
          <div className={s.highlight}>
            <strong>📞 Согласование доставки:</strong>
            <p>
              Предпочтительное время доставки можно согласовать с нашим менеджером, 
              позвонив нам по телефону 
              <a href="tel:+79957880058" className={s.phone}>+7(995)788-00-58</a>
            </p>
          </div>

          <div className={s.highlight}>
            <strong>🛍️ Примерка и оплата:</strong>
            <ul className={s.numberedList}>
              <li>Доступна примерка и оплата наличными при получении</li>
              <li>Можно заказать и примерить до 2 пар включительно</li>
              <li>Доставка каждой следующей пары +500 рублей</li>
              <li>Время примерки - не более 15 минут</li>
            </ul>
          </div>
        </div>
      </RevealText>

      {/* Доставка по России */}
      <RevealText delay={140}>
        <h2 className={s.middleHeader}>Доставка по России</h2>
      </RevealText>
      
      <RevealText delay={160}>
        <div className={s.textBlock}>
          <p>
            Доставка по России производится по 100% предоплате и осуществляется 
            курьерской службой СДЭК до указанного адреса. Сроки и стоимость доставки 
            рассчитываются индивидуально и автоматически на этапе оформления заказа.
          </p>
          <p style={{ marginTop: '15px' }}>
            ✨ Отправка заказов производится ежедневно, за исключением праздничных дней.
          </p>
        </div>
      </RevealText>

      {/* Самовывоз */}
      <RevealText delay={180}>
        <h2 className={s.middleHeader}>Самовывоз</h2>
      </RevealText>
      
      <RevealText delay={200}>
        <div className={s.textBlock}>
          <p>Самовывоз доступен в наших магазинах:</p>
          
          <div className={s.shopAddress}>
            <strong>1. ТЦ Галереи Времена Года</strong>
            <p className={s.iconLocation}>Москва, Кутузовский проспект 48, 3 этаж, бутик Sortage</p>
            <p className={s.iconClock}>Ежедневно 11:00-22:00</p>
          </div>

          <div className={s.shopAddress}>
            <strong>2. ТЦ Архангельское Аутлет</strong>
            <p className={s.iconLocation}>Московская область, деревня Воронки, 1 к. 4</p>
            <p className={s.iconLocation}>Бутик Sortage (крайнее положение по левой стороне от центрального входа)</p>
            <p className={s.iconClock}>Ежедневно 10:00-22:00</p>
          </div>

          <div className={s.highlight}>
            <p>📱 О готовности заказа сообщит по телефону наш менеджер.</p>
            <p>👗 В пункте самовывоза перед оплатой доступна примерка в присутствии сотрудника магазина.</p>
          </div>
        </div>
      </RevealText>
    </div>
  );
};

export default Delivery;