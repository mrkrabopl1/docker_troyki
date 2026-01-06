import React, { useState, useRef, useCallback, useMemo, memo, CSSProperties } from 'react';
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
import global from 'src/global.css';
import ComplexDropVertical from 'src/components/complexDrop/ComplexDropVertical';
import AlphabetNavigation from 'src/components/alphabetNavigation/AlphabetNavigation';
import MerchBuyField from '../merchField/MerchBuyField';
import BuyPage from 'src/pages/buyPage/BuyPage';
import SVGIcon from 'src/components/svgIcon/SvgIcon';
import { set } from 'ol/transform';
import Scroller from 'src/components/scroller/Scroller';
interface MenuProps {
    onChange: (data: boolean) => void;
    firms: string[];
}

const Menu: React.FC<MenuProps> = memo(({ onChange, firms }) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { isLog } = useAppSelector(state => state.userReducer);
    const { show, sticky, typesVal, categories } = useAppSelector(state => state.menuReducer);
    const { isVerified } = useAppSelector(state => state.menuReducer);
    const menuWrap = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(false);
    const [activeAlphabet, setActiveAlphabet] = useState(false);
    const [activeCart, setActiveCart] = useState(false);
    const [loginActive, setLoginActive] = useState(false);
    const { setSearchData } = searchSlice.actions;
    const [showBurgerMenu, setShowBurgerMenu] = useState(false);

    const turnActive = useCallback((active: boolean) => {
        setGlobalScroller(active);
        setActive(active);
    }, []);

    const searchCallback = useCallback((text: string) => {
        turnActive(false);
        navigate(`/search?name=${text}`);
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
    const burgerLines = useMemo(() => {
        let convertedData = {};
        Object.entries(categories).forEach(([key, value]) => {
            convertedData[value.category_name] = {
                main: value.category_name,
                subs: Object.values(typesVal).filter(cat => cat.category_key === key).map(cat => cat.name)
            }

        });

        return convertedData;
    }, [categories, typesVal]);
    const handleComplexDrop = useCallback((data: { main?: string; sub?: string }) => {
        const collection = data.main || data.sub;
        if (collection) {
            navigate(`/collections/${collection}`);
        }
    }, [navigate]);
    const handleBurgerChange = useCallback((data: boolean) => {
        onChange(data);
    }, [onChange]);

    // Styles

    const styleData = useMemo(() => ({
        main: `${ss.main} ${s.search}`,
        dropList: s.drop_list
    }), []);

    return (
        <div ref={menuWrap} className={s.menuStyle}>
            <div className={"dependSize vrtCntr"}>
                <Burger activeProps={false} onChange={setShowBurgerMenu} />
            </div>

            <div onClick={handleLogoClick} className={s.logoWrapStyle}>
                <div className={s.imageWrapStyle}>
                    <img className={s.imgStyle} src={logo} alt="troyki" />
                </div>
                <div className={s.textLogo}>TROYKI</div>
            </div>
            <div className={`${s.linkHolder}`}>
                <div className={s.link} onClick={() => {
                    setActiveAlphabet(true)
                }}>
                    Фирмы
                </div>
                <div onClick={() => {
                    navigate('/search?discount=true');
                }} className={s.link}>
                    Скидки
                </div>
                <div className={s.link}>
                    О нас
                </div>
                <div className={s.link}>
                    Отзывы
                </div>
            </div>
            {showBurgerMenu && (
                <div className={s.complexDropVertical}>
                    <ComplexDropVertical
                        onChange={handleComplexDrop}
                        data={burgerLines}
                    />
                    <div className={s.link} onClick={() => {
                        setShowBurgerMenu(false)
                        setActiveAlphabet(true)
                    }}>
                        Фирмы
                    </div>
                    <div onClick={() => {
                        navigate('/search?discount=true');
                    }} className={s.link}>
                        Скидки
                    </div>
                    <div className={s.link}>
                        О нас
                    </div>
                    <div className={s.link}>
                        Отзывы
                    </div>
                </div>
            )}


            <div className={s.rightMenuStyle}>
                <Loupe onClick={handleLoupeClick} className={global.link} height={"36px"} width={"36px"} />
                <BuyButton onClick = {()=>{
                    setActiveCart(true)
                }}/>
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
            <Modal onChange={setActiveAlphabet} active={activeAlphabet}>
                <div style={{ height: "100%" }} onClick={(e) => e.stopPropagation()} className={s.modalWrap1}>
                    <AlphabetNavigation
                        names={firms}
                        onChange={(name) => {
                            setActiveAlphabet(false);
                            navigate(`/collections/${name}`);
                        }}
                    />
                </div>
            </Modal>
            <Modal onChange={setActiveCart} active={activeCart}>
                <div  onClick={(e) => e.stopPropagation()} className={s.cartModalWrap}>
                    <Scroller onlyVertical={true}><BuyPage /></Scroller>
                </div>
            </Modal>
        </div>
    );
});

export default memo(Menu);