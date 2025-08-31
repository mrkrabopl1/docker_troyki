import React, { ReactElement, useEffect, useRef, useState,useCallback } from 'react'
import Button from '../../Button'
import styled from 'styled-components';
import s from "./linkControllerNewPreset.module.scss"
import ArrowButton from 'src/components/button/arrowButton';

const TomatoButton = styled(Button)`
  border-color: tomato;
  border-radius:5px;
  padding:10px;
  background-color:white;
`;

type ContentSliderType = {
  currentPosition: number,
  positions: number,
  onChange: (stepDiff: number) => void,
  showInfo?: boolean,
  onHold?: boolean,
  preset?: keyof typeof presetEnum,
  stepSize?: number
}

const presetEnum = {
  small: 16,
  medium: 32,
  big: 200
}

const SliderDefaultController: React.FC<ContentSliderType> = (data) => {
  const { currentPosition, positions, onChange, showInfo, onHold = false, preset = 'small', stepSize = 1 } = data;
  const [active, setActive] = useState<number>(currentPosition);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);
  const activeRef = useRef<number>(currentPosition);
  const positionsRef = useRef<number>(positions);

  // Обновляем ref'ы при изменении пропсов
  useEffect(() => {
    activeRef.current = currentPosition;
    positionsRef.current = positions;
    setActive(currentPosition);
  }, [currentPosition, positions]);

  // Функция для очистки интервала
  const clearHoldInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isHoldingRef.current = false;
  }, []);

  // Функция для левой кнопки (использует ref'ы)
  const leftFunc = useCallback(() => {
    if (activeRef.current > 1) {
      const newPosition = Math.max(activeRef.current - stepSize, 0);
      activeRef.current = newPosition;
      setActive(newPosition);
      onChange(newPosition);
    } else {
      clearHoldInterval();
    }
  }, [onChange, clearHoldInterval]);

  // Функция для правой кнопки (использует ref'ы)
  const rightFunc = useCallback(() => {
    if (activeRef.current < positionsRef.current) {
      const newPosition = Math.min(activeRef.current + stepSize, positionsRef.current);
      activeRef.current = newPosition;
      setActive(newPosition);
      onChange(newPosition);
    } else {
      clearHoldInterval();
    }
  }, [onChange, clearHoldInterval,stepSize]);

  // Функция для начала зажатия (влево)
  const startHoldLeft = useCallback(() => {
    if (!onHold) return;
    
    isHoldingRef.current = true;
    leftFunc(); // Первое нажатие сразу
    
    intervalRef.current = setInterval(() => {
      if (isHoldingRef.current) {
        leftFunc();
      }
    }, 200); // Интервал 200ms для повторных нажатий
  }, [onHold, leftFunc]);

  // Функция для начала зажатия (вправо)
  const startHoldRight = useCallback(() => {
    if (!onHold) return;
    
    isHoldingRef.current = true;
    rightFunc(); // Первое нажатие сразу
    
    intervalRef.current = setInterval(() => {
      if (isHoldingRef.current) {
        rightFunc();
      }
    }, 200); // Интервал 200ms для повторных нажатий
  }, [onHold, rightFunc]);

  // Очищаем интервал при размонтировании компонента
  useEffect(() => {
    return () => clearHoldInterval();
  }, [clearHoldInterval]);

  const buttonSize = presetEnum[preset];

  return (
    <div style={{ justifyContent: "center", display: "flex" }}>
      
        <ArrowButton className = {s.leftArrowHolder} onHold ={true} direction={"left"} onClick={leftFunc}/>
      

      {showInfo && (
        <span style={{ margin: "auto 0" }}>
          {active}/{positions}
        </span>
      )}
      
      <ArrowButton className= {s.rightArrowHolder}  onHold ={true} direction={"right"} onClick={rightFunc}/>
 
    </div>
  );
};

export default SliderDefaultController;