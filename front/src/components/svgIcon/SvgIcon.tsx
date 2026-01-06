import React, { memo } from 'react';
import s from './s.module.css';

interface SVGIconProps {
  size?: number;
  className?: string;
  color?: string;
  spritePath?: string;
}

const SVGIcon: React.FC<SVGIconProps> = memo(({
  size = 24,
  className = '',
  color = 'currentColor',
  spritePath = '/icons/sprite.svg'
}) => {
  const iconStyle = {
    width: "100%",
    height: "100%",
    maskImage: `url(/${spritePath}.svg)`,
    WebkitMaskImage: `url(/${spritePath}.svg)`,
    backgroundColor: color,
    display: 'inline-block'
  };

  return (
    <div 
      style={iconStyle}
      className={`${s.icon} ${className}`}
    />
  );
});

export default SVGIcon;