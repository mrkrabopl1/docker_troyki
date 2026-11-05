// components/footer/FooterDark.tsx
import React, { useMemo, memo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import ColumnWithChilds from 'src/components/table/simpleTable/ColumnWithChilds';
import NewsletterModule from '../newsLetter/NewsLetterModule';
import { useAppSelector } from 'src/store/hooks/redux';

import { ReactComponent as Telegram } from '/public/telegram.svg';
import { ReactComponent as Instagram } from '/public/instagram.svg';
import { ReactComponent as Vk } from '/public/vk.svg';
import { ReactComponent as Youtube } from '/public/youtube.svg';
import { ReactComponent as LocationPin } from '/public/locationPin.svg';
import { ReactComponent as Phone } from '/public/phone.svg';
import { ReactComponent as Clock } from '/public/clock.svg';

import s from './FooterDark.module.css';

const NavLinkWrapper: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => {
    const router = useRouter();
    const isActive = router.pathname === href;

    return (
        <Link href={href} className={isActive ? s.linkActive : s.link}>
            {children}
        </Link>
    );
};

const FooterDark: React.FC = () => {
    const { branding } = useAppSelector(state => state.menu);

    const renderNavLink = useCallback(
        (to: string, text: string) => (
            <NavLinkWrapper key={to} href={to}>
                {text}
            </NavLinkWrapper>
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
            // { Icon: LocationPin, text: 'Москва, ул. ...' },
            // { Icon: Phone, text: '+7 (999) 123-45-67' },
            // { Icon: Clock, text: 'Пн-Вс: 10:00–22:00' },
        ],
        []
    );

    const socials = useMemo(
        () => [
            // { Icon: Telegram, name: 'Telegram', url: 'https://t.me/...' },
            // { Icon: Instagram, name: 'Instagram', url: 'https://instagram.com/...' },
            // { Icon: Vk, name: 'VK', url: 'https://vk.com/...' },
            // { Icon: Youtube, name: 'YouTube', url: 'https://youtube.com/...' },
        ],
        []
    );

    return (
        <footer className={s.footer}>
            <div className={s.container}>
                {/* ===== ВЕРХНИЙ БЛОК: 2 КОЛОНКИ ===== */}
                <div className={s.topBlock}>
                    {/* ЛЕВАЯ ЧАСТЬ: заголовок + описание + лого внизу */}
                    <div className={s.leftColumn}>
                        <h2 className={s.newsletterTitle}>Будьте в центре событий</h2>
                        <p className={s.newsletterDescription}>
                            Подпишитесь на нашу рассылку — первыми узнавайте о новых коллекциях,
                            эксклюзивных предложениях и вдохновляющих историях.
                        </p>

                        {/* Лого внизу левой колонки */}
                        <div className={s.logoBlock}>
                            <img
                                src={`${branding.logo_url}?v=${branding.logo_version}`}
                                alt={branding.logo_alt || 'TROYKI_BENCH'}
                                className={s.logo}
                            />
                        </div>
                    </div>

                    {/* ПРАВАЯ ЧАСТЬ: newsletter + колонки */}
                    <div className={s.rightColumn}>
                        {/* Newsletter form */}
                        <div className={s.newsletterForm}>
                            <NewsletterModule />
                        </div>

                        {/* Колонки ссылок + контакты + соцсети */}
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

                            <div className={s.rightColumnInner}>
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
                    </div>
                </div>

                {/* ===== COPYRIGHT ===== */}
                <div className={s.copyright}>
                    © {new Date().getFullYear()} Troyki. Все права защищены.
                </div>
            </div>
        </footer>
    );
};

export default memo(FooterDark);