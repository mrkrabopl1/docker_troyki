import React, { useMemo, memo,useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import ColumnWithChilds from 'src/components/table/simpleTable/ColumnWithChilds';
import s from "./style.module.css";

const Footer: React.FC = () => {
    const renderNavLink = useCallback((to: string, text: string) => (
        <NavLink 
            className={({ isActive, isPending }) => 
                isPending ? s.link_active : isActive ? s.link_active : s.link
            } 
            to={to}
        >
            {text}
        </NavLink>
    ), []);

    const aboutUsArr = useMemo(() => [
        renderNavLink("/way_to_pay", "Способы оплаты"),
        renderNavLink("/delivery", "Доставка и самовывоз"),
        renderNavLink("/faq", "Частые вопросы")
    ], [renderNavLink]);

    const policyArr = useMemo(() => [
        renderNavLink("/refund-policy", "Обмен и возврат"),
        renderNavLink("/privacy-policy", "Политика конфиденциальности"),
        renderNavLink("/faq", "Условия предоставления услуг")
    ], [renderNavLink]);

    const clientHelpArr = useMemo(() => [
        <div key="contacts">
            <div>mail</div>
            <div>phone</div>
        </div>,
        <div key="work-hours">
            Звонки принимаются ежедневно с 10:00 до 22:00 по МСК.
        </div>
    ], []);

    const footerStyle = useMemo(() => ({
        display: "flex",
        width: "100%", 
        justifyContent: "space-between"
    }), []);

    return (
        <div className={`${s.footer} fontSize`} style={footerStyle}>
            <ColumnWithChilds 
                headerClassName="fontSizeH" 
                className={s.footerColumn}  
                header="Помощь" 
                rows={aboutUsArr} 
            />
            <ColumnWithChilds 
                headerClassName="fontSizeH" 
                className={s.footerColumn} 
                header="Политики и условия" 
                rows={policyArr} 
            />
            <ColumnWithChilds 
                headerClassName="fontSizeH" 
                className={s.footerColumn} 
                header="Служба клиентской поддержки" 
                rows={clientHelpArr} 
            />
        </div>
    );
};

export default memo(Footer);