import React from 'react';
import s from './s.module.css';

const SVGIcon = ({
  spritePath = '/icons/sprite.svg', // путь по умолчанию
}) => {
  return (
    <svg width="100%" height="100%" className={s.icon} >
      <use  width="100%" height="100%" href={`/${spritePath}.svg`} />
    </svg>
  );
};

export default SVGIcon;