import React, { lazy, Suspense, useCallback, memo,useMemo } from 'react';
import DropWrapper from "../../components/dropWrapper/DropWrapper";
import s from "./style.module.css";
import { useAppDispatch } from 'src/store/hooks/redux';
import { secondDropSlice } from "src/store/reducers/secondDropSlice";
import { isDeepEqual } from 'src/global';

type PropsRowType = {
    propsData: any;
    componentName: string;
    onChange?: (arg: any) => void;
};

const DynamicElement: React.FC<PropsRowType> = ({
    componentName,
    propsData,
    onChange
}) => {
    const dispatch = useAppDispatch();
    const { show } = secondDropSlice.actions;

    // Мемоизированный импорт компонента
    const DynamicComponent = useMemo(
        () => lazy(() => import(`src/${componentName}`)),
        [componentName]
    );

    const handleChange = useCallback((data: any) => {
        onChange?.(data);
    }, [onChange]);

    return (
        <Suspense fallback={<div className={s.loadingPlaceholder} />}>
            <DynamicComponent
                onChange={handleChange}
                {...propsData}
            />
        </Suspense>
    );
};

// Функция для сравнения пропсов
const propsAreEqual = (prevProps: PropsRowType, nextProps: PropsRowType) => {
    return isDeepEqual(prevProps.propsData, nextProps.propsData) &&
        prevProps.componentName === nextProps.componentName &&
        prevProps.onChange === nextProps.onChange;
};

export default memo(DynamicElement, propsAreEqual);