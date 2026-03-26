// Footer.tsx
import React, { useMemo, memo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import ColumnWithChilds from 'src/components/table/simpleTable/ColumnWithChilds';
import NewsletterModule from '../newsLetter/NewsLetterModule';

import { ReactComponent as Telegram } from '/public/telegram.svg';
import { ReactComponent as Instagram } from '/public/instagram.svg';
import { ReactComponent as Vk } from '/public/vk.svg';
import { ReactComponent as Youtube } from '/public/youtube.svg';
import { ReactComponent as LocationPin } from '/public/locationPin.svg';
import { ReactComponent as Phone } from '/public/phone.svg';
import { ReactComponent as Clock } from '/public/clock.svg';

import s from './style.module.css';

const Footer: React.FC = () => {
  const renderNavLink = useCallback(
    (to: string, text: string) => (
      <NavLink
        key={to}
        className={({ isActive }) => (isActive ? s.linkActive : s.link)}
        to={to}
      >
        {text}
      </NavLink>
    ),
    []
  );

  const helpLinks = useMemo(
    () => [
      renderNavLink('/way_to_pay', 'Способы оплаты'),
      renderNavLink('/delivery', 'Доставка'),
      renderNavLink('/faq', 'FAQ'),
    ],
    [renderNavLink]
  );

  const policyLinks = useMemo(
    () => [
      renderNavLink('/refund-policy', 'Возврат'),
      renderNavLink('/privacy-policy', 'Конфиденциальность'),
      renderNavLink('/terms', 'Условия'),
    ],
    [renderNavLink]
  );

  const aboutLinks = useMemo(
    () => [
      renderNavLink('/about', 'О нас'),
      renderNavLink('/blog', 'Блог'),
      renderNavLink('/contacts', 'Контакты'),
    ],
    [renderNavLink]
  );

  const contactItems = useMemo(
    () => [
      { Icon: LocationPin, text: 'Москва, ул. Тверская 15' },
      { Icon: Phone, text: '+7 (999) 123-45-67' },
      { Icon: Clock, text: '10:00 — 22:00' },
    ],
    []
  );

  const socials = useMemo(
    () => [
      { Icon: Telegram, name: 'Telegram', url: 'https://t.me/yourchannel' },
      { Icon: Instagram, name: 'Instagram', url: 'https://instagram.com/yourprofile' },
      { Icon: Vk, name: 'VK', url: 'https://vk.com/yourgroup' },
      { Icon: Youtube, name: 'YouTube', url: 'https://youtube.com/yourchannel' },
    ],
    []
  );

  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.grid}>
          <ColumnWithChilds
            header="Помощь"
            headerClassName={s.columnHeader}
            className={s.column}
            rows={helpLinks}
          />

          <ColumnWithChilds
            header="Информация"
            headerClassName={s.columnHeader}
            className={s.column}
            rows={policyLinks}
          />

          <ColumnWithChilds
            header="О нас"
            headerClassName={s.columnHeader}
            className={s.column}
            rows={aboutLinks}
          />

          <div className={s.rightColumn}>
            <div className={s.contacts}>
              {contactItems.map(({ Icon, text }, i) => (
                <div key={i} className={s.contactItem}>
                  <Icon className={s.contactIcon} />
                  <span className={s.contactText}>{text}</span>
                </div>
              ))}
            </div>

            <div className={s.socials}>
              {socials.map(({ Icon, name, url }, i) => (
                <a
                  key={i}
                  href={url}
                  className={s.socialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                >
                  <Icon className={s.socialIcon} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={s.newsletterWrapper}>
          <NewsletterModule />
        </div>

        <div className={s.copyright}>
          © {new Date().getFullYear()} Troyki. Все права защищены.
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);