import React, { memo, useEffect, useState, useCallback } from 'react';
import s from './style.module.scss';

interface CookieInfoProps {
  onAccept?: () => void;
  showAfter?: number; // время в мс до появления
  policyLink?: string;
}

const CookieInfo: React.FC<CookieInfoProps> = ({
  onAccept,
  showAfter = 2000,
  policyLink = '/cookie-policy'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли куки о принятии
    const hasCookieConsent = document.cookie
      .split('; ')
      .find(row => row.startsWith('cookie_consent='));

    if (!hasCookieConsent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, showAfter);

      return () => clearTimeout(timer);
    }
  }, [showAfter]);

  const handleAccept = useCallback(() => {
    setIsExiting(true);
    
    // Устанавливаем куки на 1 год
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 2);
    document.cookie = `cookie_consent=true; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      onAccept?.();
    }, 300); // время для анимации исчезновения
  }, [onAccept]);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
    }, 300);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${s.cookieInfo} ${isExiting ? s.exiting : ''}`}>
      <div className={s.overlay} onClick={handleClose} />
      <div className={s.modal}>
        <button 
          className={s.closeButton} 
          onClick={handleClose}
          aria-label="Закрыть"
        >
          <i className={s.closeIcon}></i>
        </button>
        
        <div className={s.content}>
          <h2 className={s.title}>🍪 Мы используем cookie</h2>
          
          <div className={s.text}>
            <p>
              <strong>Что такое cookie?</strong><br />
              Cookie (куки) — небольшие текстовые файлы на вашем компьютере, 
              где сохраняются данные посещаемых вами сайтов.
            </p>
            
            <p>
              <strong>Зачем мы используем cookie?</strong><br />
              Cookie помогают нам запомнить информацию о вас. Например, даже если вы 
              не авторизованы на сайте, мы сохраним данные о том, какие товары вы 
              добавили в корзину. Когда вы вновь вернетесь на сайт, товары всё еще 
              будут там.
            </p>
            
            <p>
              Используя cookie, мы можем создавать персональные подборки, направлять 
              актуальную рекламу и предлагать товары, которые вам наверняка понравятся.
            </p>
            
            <p>
              Cookie помогают нам понять, что вам нравится на сайте, а что стоит изменить 
              — с ними мы можем сделать сайт удобным для каждого покупателя.
            </p>
            
            <p>
              <strong>Какие cookie мы используем?</strong><br />
              • Статистика, которая необходима для анализа поведения наших покупателей 
              на сайте для улучшения сервиса. Сбор статистики происходит через наших 
              партнеров: Google Analytics, Yandex Metrika.<br />
              • Статистика, которая необходима для верификации запросов и блокировки 
              роботов. Сбор статистики происходит через Yandex SmartCaptcha.<br />
              • Реклама, которая направляется в зависимости от интересов покупателя. 
              Для этого на сайте установлены определенные коды рекламных сервисов 
              (AdLens, MyTarget и др.).
            </p>
            
            <p>
              <strong>Можно ли отключить cookie?</strong><br />
              Да, вы можете отключить их в настройках безопасности браузера, но в этом 
              случае мы не гарантируем безошибочную работу сайта. Настройки нужно 
              изменить во всех браузерах, которыми вы пользуетесь. Как это сделать, 
              можно посмотреть в инструкции браузера.
            </p>
          </div>
          
          <div className={s.footer}>
            <a 
              href={policyLink} 
              className={s.policyLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ознакомиться с политикой использования cookie
            </a>
            <button 
              className={s.acceptButton}
              onClick={handleAccept}
            >
              <span>Хорошо</span>
              <div className={s.buttonArrow}>
                <i className={s.arrowLeft}></i>
                <i className={s.arrowRight}></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CookieInfo);