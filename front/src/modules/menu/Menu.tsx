import React, { useState, useRef, useCallback, useMemo,memo,CSSProperties } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from 'src/store/hooks/redux';
import { searchSlice } from 'src/store/reducers/searchSlice';
import { setGlobalScroller } from 'src/global';
import BuyButton from "./BuyButton";
import Burger from 'src/components/burger/Burger';
import SearchWithList from '../searchWithList/SearchWithList';
import Modal from 'src/components/modal/Modal';
import { ReactComponent as Loupe } from "/public/loupe.svg";
import s from "./style.module.css";
import ss from "../../pages/search/style.module.css";
import logo from "/public/troyki_logo.svg";

interface MenuProps {
    onChange: (data: boolean) => void;
}

const Menu: React.FC<MenuProps> = memo(({ onChange }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLog } = useAppSelector(state => state.userReducer);
    const { show, sticky } = useAppSelector(state => state.menuReducer);
    const { isVerified } = useAppSelector(state => state.menuReducer);
    const menuWrap = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [loginActive, setLoginActive] = useState(false);
    const { setSearchData } = searchSlice.actions;

    const turnActive = useCallback((active: boolean) => {
        setGlobalScroller(active);
        setActive(active);
    }, []);

    const searchCallback = useCallback((text: string) => {
        turnActive(false);
        navigate(`/settingsMenu?name=${text}`);
    }, [navigate, turnActive]);

    const selectListHandler = useCallback((id: number) => {
        setActive(false);
        navigate('/product/' + id);
    }, [navigate]);

    const handleLogoClick = useCallback(() => {
        navigate("/");
    }, [navigate]);

    const handleLoupeClick = useCallback(() => {
        setActive(true);
    }, []);

    const handleBurgerChange = useCallback((data: boolean) => {
        onChange(data);
    }, [onChange]);

    // Styles
   
    const styleData = useMemo(() => ({
        main: `${ss.main} ${s.search}`,
        dropList: s.drop_list,
        search: s.searchInput
    }), []);

    return (
        <div ref={menuWrap} className={s.menuStyle}>
            <div className={"dependSize vrtCntr"}>
                <Burger activeProps={false} onChange={handleBurgerChange} />
            </div>

            <div onClick={handleLogoClick} className={s.logoWrapStyle}>
                <div className={s.imageWrapStyle}>
                    <img className={s.imgStyle} src={logo} alt="troyki" />
                </div>
                <div className={s.textLogo}>TROYKI</div>
            </div>

            <div className={s.rightMenuStyle}>
                <Loupe onClick={handleLoupeClick} className={global.link} height={"36px"} width={"36px"} />
                <BuyButton />
            </div>

            <Modal onChange={setActive} active={active}>
                <div onClick={(e) => e.stopPropagation()} className={s.modalWrap}>
                    <SearchWithList
                        onChange={(val) => dispatch(setSearchData(val))}
                        className={styleData}
                        searchCallback={searchCallback}
                        selectList={selectListHandler}
                    />
                </div>
            </Modal>
        </div>
    );
});

export default memo(Menu);