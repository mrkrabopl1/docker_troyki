import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from 'src/store/hooks/redux';
import { isDeepEqual } from 'src/global';
import Menu from './Menu';
import ComplexDrop from 'src/components/complexDrop/ComplexDrop';
import s from "./style.module.css";
import ComplexDropWithNodes from 'src/components/complexDrop/ComplexDropWithNodes';

interface ComplexDropMenuProps {
    className?: string;
    complexDropData: {
        [key: string]: string[];
    };
    categories: {
        type: number;
        name: string,
        image_path: string
    }[]
}

const ComplexDropMenuComponent: React.FC<ComplexDropMenuProps> = ({
    className,
    complexDropData,
}) => {
    const router = useRouter();
    const { show, sticky, typesVal, categories, firms } = useAppSelector(state => state.menuReducer);
    const [showMenu, setShowMenu] = useState(false);



    // Обработчик изменения меню
    const handleMenuChange = useCallback((data: boolean) => {
        setShowMenu(data);
    }, []);

    // Обработчик выбора в ComplexDrop

    const handleCategoriesSelect = useCallback((data: { main?: string; sub?: string }) => {
        if (!data.sub) {
            router.push(`/search?category=${data.main}&type=""`);
        } else {
            let type_key = Object.values(typesVal).filter(cat => cat.category_key === data.main && data.sub === cat.name).map(cat => cat.type_key)[0]
            router.push(`/search?type=${type_key}&category=${data.main}`);
        }

    }, [router, typesVal]);



    // Стили меню
    const menuStyle = useMemo(() => {
        const style: React.CSSProperties = {
            position: sticky ? "sticky" : "relative"
        };

        if (typeof window !== 'undefined' && window.scrollY !== 0) {
            style.transition = "transform 0.3s ease-out";
        }

        return style;
    }, [sticky]);

    const categoriesLines = useMemo(() => {
        let convertedData = {};
        Object.entries(categories).forEach(([key, value]) => {
            convertedData[key] = {
                main: (<div
                    onClick={() => {
                        router.push(`/search?category=${key}&type=""`);
                    }}
                    className={s.categoryLine} key={key}>
                    <img src={"/" + value.image_path} alt={key} />
                    <span className={s.categoryText}>{value.category_name}</span>
                </div>),
                subs: Object.values(typesVal).filter(cat => cat.category_key === key).map(cat => cat.name)
            }

        });
        return convertedData;
    }, [categories, typesVal]);



    // Классы для обертки меню
    const menuWrapClass = useMemo(() => {
        const baseClass = s.menuWrapWithList;
        return show ? `${baseClass} ${s.is_visible}` : `${baseClass} ${s.is_hidden}`;
    }, [show]);



    return (
        <div style={menuStyle} className={menuWrapClass}>
            <Menu firms={Object.keys(complexDropData)} onChange={handleMenuChange} />

            <div className={s.categoriesContainer}>

                <ComplexDropWithNodes
                    onChange={handleCategoriesSelect}
                    data={categoriesLines}
                />
            </div>


            {/* <div className={s.horizontalList}>

                <ComplexDrop
                    onChange={handleComplexDrop}
                    data={complexDropData}
                />
            </div> */}
        </div>
    );
};

const arePropsEqual = (oldProps: ComplexDropMenuProps, newProps: ComplexDropMenuProps) => {
    return isDeepEqual(oldProps.complexDropData, newProps.complexDropData);
};

export default memo(ComplexDropMenuComponent, arePropsEqual);