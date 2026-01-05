import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAppDispatch } from 'src/store/hooks/redux';
import { getFirms } from 'src/providers/merchProvider';
import { collections, categories } from '../../store/reducers/menuSlice';
import ComplexDropMenu from './ComplexDropMenu';
import { isDeepEqual } from 'src/global';

interface ComplexDropMenuWithRequestProps {
  className?: string;
  isReady?: () => void;
}

const ComplexDropMenuWithRequestComponent: React.FC<ComplexDropMenuWithRequestProps> = () => {
  const dispatch = useAppDispatch();
  const [merchFieldData, setMerchFieldData] = useState<Record<string, string[]>>({});
    const [categories, setCategories] = useState<{
         type: number;
         name:string,
         image_path:string
    }[]>([]);

  const setFirmsData = useCallback((firms: Array<{ firm: string; collections: string[], categories: string[] }>) => {
    const fieldData: Record<string, string[]> = {};
    const collectionsData: string[] = [];

    firms.forEach((cols) => {
      fieldData[cols.firm] = cols.collections;
      collectionsData.push(...cols.collections);
    });

    setMerchFieldData(fieldData);
    dispatch(collections(collectionsData));
    // dispatch(categories(categories));
  }, [dispatch]);

  useEffect(() => {
    getFirms(setFirmsData);
  }, [setFirmsData]);

  return <ComplexDropMenu complexDropData={merchFieldData}  categories={categories}/>;
};

const arePropsEqual = (prevProps: ComplexDropMenuWithRequestProps, nextProps: ComplexDropMenuWithRequestProps) => {
  return isDeepEqual(prevProps, nextProps);
};

export default memo(ComplexDropMenuWithRequestComponent, arePropsEqual);