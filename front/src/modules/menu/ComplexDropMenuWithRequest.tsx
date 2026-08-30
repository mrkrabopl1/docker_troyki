import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector, useNavigate } from 'src/store/hooks/redux';
import { isDeepEqual } from 'src/global';
import Menu from './Menu';
import ComplexDropWithNodes from 'src/components/complexDrop/ComplexDropWithNodes';
import s from "./style.module.css";

interface ComplexDropMenuWithRequestProps {
  className?: string;
  isReady?: () => void;
}

const ComplexDropMenuWithRequestComponent: React.FC<ComplexDropMenuWithRequestProps> = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const router = useRouter();
  const { show, sticky, typesVal, categories } = useAppSelector(state => state.menu);
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuChange = useCallback((data: boolean) => {
    setShowMenu(data);
  }, []);

  const handleCategoriesSelect = useCallback((data: { main?: string; sub?: string }) => {
    if (!data.sub) {
      navigate(`/search?category=${data.main}`);
    } else {
      let type_key = Object.values(typesVal).filter(cat => cat.category_key === data.main && data.sub === cat.name).map(cat => cat.type_key)[0];
      navigate(`/search?type=${type_key}&category=${data.main}`);
    }
  }, [navigate, typesVal]);

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
    Object.entries(categories).forEach(([key, value]: [string, any]) => {
      convertedData[key] = {
        main: (<div
          onClick={() => {
            navigate(`/search?category=${key}`);
          }}
          className={s.categoryLine} key={key}>
          <img src={"/" + value.image_path} alt={key} />
          <span className={s.categoryText}>{value.category_name}</span>
        </div>),
        subs: Object.values(typesVal).filter((cat: any) => cat.category_key === key).map((cat: any) => cat.name)
      }
    });
    return convertedData;
  }, [categories, typesVal, navigate]);

  const menuWrapClass = useMemo(() => {
    const baseClass = s.menuWrapWithList;
    return show ? `${baseClass} ${s.is_visible}` : `${baseClass} ${s.is_hidden}`;
  }, [show]);

  return (
    <div style={menuStyle} className={menuWrapClass}>
      <Menu firms={[]} onChange={handleMenuChange} />
      <div className={s.categoriesContainer}>
        <ComplexDropWithNodes
          onChange={handleCategoriesSelect}
          data={categoriesLines}
        />
      </div>
    </div>
  );
};

const arePropsEqual = (prevProps: ComplexDropMenuWithRequestProps, nextProps: ComplexDropMenuWithRequestProps) => {
  return isDeepEqual(prevProps, nextProps);
};

export default memo(ComplexDropMenuWithRequestComponent, arePropsEqual);