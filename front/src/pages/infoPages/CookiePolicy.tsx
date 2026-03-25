import React from 'react';
import s from './style.module.scss';

const CookiePolicy: React.FC = () => {
  return (
    <div className={s.cookiePolicy}>
      <div className={s.container}>
        <h1 className={s.title}>Политика использования cookie</h1>
        
        <div className={s.content}>
          <section className={s.section}>
            <h2>Что такое cookie?</h2>
            <p>
              Cookie (куки) — небольшие текстовые файлы на вашем компьютере, 
              где сохраняются данные посещаемых вами сайтов.
            </p>
          </section>

          <section className={s.section}>
            <h2>Зачем мы используем cookie?</h2>
            <p>
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
          </section>

          <section className={s.section}>
            <h2>Какие cookie мы используем?</h2>
            <ul>
              <li>
                <strong>Статистика</strong> — необходима для анализа поведения наших 
                покупателей на сайте для улучшения сервиса. Сбор статистики происходит 
                через наших партнеров: Google Analytics, Yandex Metrika.
              </li>
              <li>
                <strong>Безопасность</strong> — необходима для верификации запросов и 
                блокировки роботов. Сбор статистики происходит через Yandex SmartCaptcha.
              </li>
              <li>
                <strong>Реклама</strong> — направляется в зависимости от интересов 
                покупателя. Для этого на сайте установлены определенные коды рекламных 
                сервисов (AdLens, MyTarget и др.).
              </li>
            </ul>
          </section>

          <section className={s.section}>
            <h2>Можно ли отключить cookie?</h2>
            <p>
              Да, вы можете отключить их в настройках безопасности браузера, но в этом 
              случае мы не гарантируем безошибочную работу сайта. Настройки нужно 
              изменить во всех браузерах, которыми вы пользуетесь.
            </p>
            <p>Как это сделать в популярных браузерах:</p>
            <ul>
              <li>
                <a 
                  href="https://support.google.com/chrome/answer/95647" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a 
                  href="https://support.mozilla.org/ru/kb/ustanovka-pravila-dlya-failov-cookie" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a 
                  href="https://support.apple.com/ru-ru/guide/safari/sfri11471/mac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Safari
                </a>
              </li>
              <li>
                <a 
                  href="https://support.microsoft.com/ru-ru/microsoft-edge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;