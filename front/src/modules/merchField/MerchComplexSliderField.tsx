// src/modules/merchField/MerchComplexSliderField.tsx
import React, { useMemo, memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAppSelector } from 'src/store/hooks/redux';
import MerchSliderField from './MerchSliderField';
import InstagramScroller from 'src/modules/instagramScroller/InstagramScroller';

interface MerchComplexSliderFieldProps {
  showInstagram?: boolean;
}

const MerchComplexSliderField: React.FC<MerchComplexSliderFieldProps> = memo(({
  showInstagram = true,
}) => {
  const router = useRouter();
  
  // 🔥 Просто берем данные из Redux
  const { pageInfo } = useAppSelector(state => state.widget);
  const instagramPhotos = useAppSelector(state => state.instagram.photos);

  const handleSliderClick = useCallback((collectionSlug: string) => {
    router.push(`/collections/${collectionSlug}`);
  }, [router]);

  // Создание слайдеров из pageInfo
  const sliders = useMemo(() => {
    if (!pageInfo || typeof pageInfo !== 'object') return null;
    
    return Object.entries(pageInfo).map(([key, value]: [string, any]) => (
      <MerchSliderField
        key={key}
        name={value.name}
        merchInfo={value.products}
        onClick={() => handleSliderClick(value.collection_slug)}
      />
    ));
  }, [pageInfo, handleSliderClick]);

  // Если нет данных - ничего не показываем
  if (!pageInfo || Object.keys(pageInfo).length === 0) {
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      {sliders}
      {showInstagram && instagramPhotos.length > 0 && <InstagramScroller />}
    </div>
  );
});

MerchComplexSliderField.displayName = 'MerchComplexSliderField';

export default MerchComplexSliderField;