import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector, useAppDispatch, useNavigate } from 'src/store/hooks/redux';
import { searchSlice } from 'src/store/reducers/searchSlice';
import { setGlobalScroller } from 'src/global';
import BuyButton from "./BuyButton";
import Burger from 'src/components/burger/Burger';
import SearchWithList from 'src/modules/searchWithList/SearchWithList';
import Modal from 'src/components/modal/Modal';
import StyledSearch from 'src/components/search/StyledSearch';
import { ReactComponent as Loupe } from "/public/loupe.svg";
import s from "./style.module.css";
import ss from "src/pages/search/style.module.css";
import logo from "/public/troyki_logo.svg";
import ComplexDropVertical from 'src/components/complexDrop/ComplexDropVertical';
import AlphabetNavigation from 'src/components/alphabetNavigation/AlphabetNavigation';
import BuyPage from 'src/pages/buyPage/BuyPage';
import Scroller from 'src/components/scroller/Scroller';

interface MenuProps {
    onChange: (data: boolean) => void;
    firms: string[];
}

const Menu: React.FC<MenuProps> = memo(({ onChange, firms }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { isLog } = useAppSelector(state => state.user);
    const { show, sticky, typesVal, categories } = useAppSelector(state => state.menu);
    const { isVerified } = useAppSelector(state => state.menu);
    const menuWrap = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [activeAlphabet, setActiveAlphabet] = useState(false);
    const [activeCart, setActiveCart] = useState(false);
    const { setSearchData } = searchSlice.actions;
    const [showBurgerMenu, setShowBurgerMenu] = useState(false);
    const activeBurger = useRef(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const searchCallback = useCallback((text: string) => {
        setIsSearchExpanded(false);
        navigate(`/search?key_word=${text}`);
    }, [navigate]);

    const selectListHandler = useCallback((id: number) => {
        setActive(false);
        setIsSearchExpanded(false);
        navigate('/product/' + id);
    }, [navigate]);

    const handleLogoClick = useCallback(() => {
        navigate("/");
    }, [navigate]);

    const handleSearchDataReceive = useCallback((data: any) => {
        console.log('Search data received:', data);
    }, []);

    const handleSearchChange = useCallback((val: string) => {
        dispatch(setSearchData(val));
    }, [dispatch]);

    const burgerLines = useMemo(() => {
        let convertedData = {};
        Object.entries(categories).forEach(([key, value]) => {
            convertedData[value.category_name] = {
                main: key,
                subs: Object.values(typesVal).filter(cat => cat.category_key === key).map(cat => cat.name)
            }
        });
        return convertedData;
    }, [categories, typesVal]);

    const handleComplexDrop = useCallback((data: { main?: string; sub?: string }) => {
        activeBurger.current = false;
        setShowBurgerMenu(false);
        if (!data.sub) {
            navigate(`/search?category=${data.main}`);
        } else {
            let type_key = Object.values(typesVal).filter(cat => cat.category_key === data.main && data.sub === cat.name).map(cat => cat.type_key)[0];
            navigate(`/search?type=${type_key}&category=${data.main}`);
        }
    }, [navigate, typesVal]);

    const handleBurgerChange = useCallback((data: boolean) => {
        onChange(data);
    }, [onChange, typesVal]);

    return (
        <div ref={menuWrap} className={s.menuStyle}>
            <div className={"dependSize vrtCntr"}>
                <Burger activeProps={activeBurger.current} onChange={(val) => {
                    activeBurger.current = val;
                    setShowBurgerMenu(val);
                }} />
            </div>

            <div onClick={handleLogoClick} className={s.logoWrapStyle}>
                <div className={s.imageWrapStyle}>
                    <img className={s.imgStyle} src={logo} alt="troyki" />
                </div>
                <div className={s.textLogo}>TROYKI_BENCH</div>
            </div>

            {/* Навигационные ссылки - скрываются при открытом поиске */}
            <div className={s.navContainer}>
                <div className={`${s.linkHolder} ${isSearchExpanded ? s.linkHolderHidden : ''}`}>
                    <div className={s.link} onClick={() => {
                        setActiveAlphabet(true);
                    }}>
                        Фирмы
                    </div>
                    <div onClick={() => {
                        navigate('/search?discount=true');
                    }} className={s.link}>
                        Скидки
                    </div>
                    <div onClick={() => {
                        navigate('/news');
                    }} className={s.link}>
                        Новости
                    </div>
                    <div onClick={() => {
                        navigate('/about');
                    }} className={s.link}>
                        О нас
                    </div>
                    <div onClick={() => {
                        navigate('/reviews');
                    }} className={s.link}>
                        Отзывы
                    </div>
                </div>

                <StyledSearch
                    onDataRecieve={handleSearchDataReceive}
                    searchCallback={searchCallback}
                    onChange={handleSearchChange}
                    placeholder="Поиск..."
                    className={s.searchInMenu}
                    onFocus={() => { setIsSearchExpanded(true) }}
                    onBlur={() => { setIsSearchExpanded(false) }}
                />
            </div>
            {showBurgerMenu && (
                <div className={s.complexDropVertical}>
                    <ComplexDropVertical
                        onChange={handleComplexDrop}
                        data={burgerLines}
                    />
                    <div className={s.divider}>
                        <span className={s.dividerIcon}>✦</span>
                    </div>
                    <div className={s.link} onClick={() => {
                        activeBurger.current = false;
                        setShowBurgerMenu(false);
                        setActiveAlphabet(true);
                    }}>
                        Фирмы
                    </div>
                    <div onClick={() => {
                        activeBurger.current = false;
                        navigate('/search?discount=true');
                    }} className={s.link}>
                        Скидки
                    </div>
                    <div onClick={() => {
                        activeBurger.current = false;
                        navigate('/about');
                    }} className={s.link}>
                        О нас
                    </div>
                    <div onClick={() => {
                        activeBurger.current = false;
                        navigate('/reviews');
                    }} className={s.link}>
                        Отзывы
                    </div>
                </div>
            )}
            <div className={s.rightMenuStyle}>

                <BuyButton onClick={() => {
                    setActiveCart(true);
                }} />
            </div>

            <Modal onChange={setActiveAlphabet} active={activeAlphabet}>
                <div style={{ height: "100%" }} onClick={(e) => e.stopPropagation()} className={s.modalWrap1}>
                    <AlphabetNavigation
                        onChange={(name) => {
                            navigate(`/search?brand=${name}`);
                            setActiveAlphabet(false);
                        }}
                    />
                </div>
            </Modal>

            <Modal onChange={setActiveCart} active={activeCart}>
                <div onClick={(e) => e.stopPropagation()} className={s.cartModalWrap}>
                    <Scroller onlyVertical={true}>
                        <BuyPage onActivate={() => {
                            setActiveCart(false);
                        }} />
                    </Scroller>
                </div>
            </Modal>
        </div>
    );
});

export default memo(Menu);