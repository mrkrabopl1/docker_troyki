import React, { ReactElement, useEffect, useRef, useState } from 'react';
import Button from '../../Button';
import s from "./linkController.module.scss";

type ContentSliderType = {
  currentPosition: number;
  positions: number;
  callback: (newPosition: number, stepDiff: number) => void;
};

const LinkController: React.FC<ContentSliderType> = ({
  currentPosition,
  positions,
  callback,
}) => {
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Минимальная дистанция свайпа в пикселях
  const minSwipeDistance = 50;

  function createLinks(elementsCount: number) {
    const linkArr: ReactElement[] = [];

    for (let i = 1; i <= elementsCount; i++) {
      const isActive = i === currentPosition;

      linkArr.push(
        <div
          key={i}
          className={`${s.link} ${isActive ? s.active : ''}`}
          onClick={() => {
            const diff = currentPosition - i;
            if (diff !== 0) {
              callback(i, diff);
            }
          }}
          // Для лучшей отзывчивости на мобильных
          onTouchEnd={(e) => {
            // Предотвращаем конфликт с общим свайпом контейнера
            e.stopPropagation();
          }}
        />
      );
    }
    return linkArr;
  }

  // Обработка свайпов на всём контейнере
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentPosition < positions) {
      // Свайп влево → следующая страница
      callback(currentPosition + 1, -1);
    } else if (isRightSwipe && currentPosition > 1) {
      // Свайп вправо → предыдущая страница
      callback(currentPosition - 1, 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={s.controller}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Дополнительно для лучшей работы на мобильных
      style={{ touchAction: 'pan-y' }} // разрешаем вертикальный скролл страницы
    >
      {createLinks(positions)}
    </div>
  );
};

export default LinkController;