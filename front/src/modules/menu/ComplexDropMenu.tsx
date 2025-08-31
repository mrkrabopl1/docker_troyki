import React, { useState, useEffect, useMemo, useCallback, memo,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/store/hooks/redux';
import { isDeepEqual } from 'src/global';
import Menu from './Menu';
import ComplexDrop from 'src/components/complexDrop/ComplexDrop';
import ComplexDropVertical from 'src/components/complexDrop/ComplexDropVertical';
import s from "./style.module.css";
import toy from "/public/toy.svg";
import sneakers from "/public/sneakers.svg";
import clothes from "/public/clothes.svg";
import {getProductsByCategories} from "src/providers/searchProvider"
interface ComplexDropMenuProps {
    className?: string;
    complexDropData: {
        [key: string]: string[];
    };
}

const ComplexDropMenuComponent: React.FC<ComplexDropMenuProps> = ({
    className,
    complexDropData,
}) => {
    const navigate = useNavigate();
    const { show, sticky } = useAppSelector(state => state.menuReducer);
    const [showMenu, setShowMenu] = useState(false);

    const categories = useRef<{  [key: string]: {
        category: string;
        type?: string;
        img: string;
    } }>({
        "Обувь": { category: "snickers", img: sneakers },
        "Одежда": { category: "clothes", img: clothes },
        "Игрушки": { category: "solomerch", type: "toys" ,img: toy},
    });
  

    // Обработчик изменения меню
    const handleMenuChange = useCallback((data: boolean) => {
        setShowMenu(data);
    }, []);

    // Обработчик выбора в ComplexDrop
    const handleComplexDrop = useCallback((data: { main?: string; sub?: string }) => {
        const collection = data.main || data.sub;
        if (collection) {
            navigate(`/collections/${collection}`);
        }
    }, [navigate]);

    // Стили меню
    const menuStyle = useMemo(() => {
        const style: React.CSSProperties = {
            position: sticky ? "sticky" : "relative"
        };

        if (window.scrollY !== 0) {
            style.transition = "transform 0.3s ease-out";
        }

        return style;
    }, [sticky]);

const categoriesLines = useMemo(() => {
    return Object.entries(categories.current).map((cat) => (
        <div
        onClick={()=>{
           navigate(`/settingsMenu?category=${cat[1].category}&type=${cat[1].type||""}`);
        }}
         className={s.categoryLine} key={cat[0]}> 
            <img src={cat[1].img} alt={cat[0]} />  
            <span className={s.categoryText}>{cat[0]}</span>
        </div>
    ));
}, [categories]);
    // Классы для обертки меню
    const menuWrapClass = useMemo(() => {
        const baseClass = s.menuWrapWithList;
        return show ? `${baseClass} ${s.is_visible}` : `${baseClass} ${s.is_hidden}`;
    }, [show]);

    return (
        <div style={menuStyle} className={menuWrapClass}>
            <Menu onChange={handleMenuChange} />

            <div className={s.categoriesContainer}>
                {categoriesLines}
            </div>

            {showMenu && (
                <div className={s.complexVertical}>
                    <ComplexDropVertical
                        onChange={handleComplexDrop}
                        data={complexDropData}
                    />
                </div>
            )}

            <div className={s.horizontalList}>
                
                <ComplexDrop
                    onChange={handleComplexDrop}
                    data={complexDropData}
                />
            </div>
        </div>
    );
};

const arePropsEqual = (oldProps: ComplexDropMenuProps, newProps: ComplexDropMenuProps) => {
    return isDeepEqual(oldProps.complexDropData, newProps.complexDropData);
};

export default memo(ComplexDropMenuComponent, arePropsEqual);