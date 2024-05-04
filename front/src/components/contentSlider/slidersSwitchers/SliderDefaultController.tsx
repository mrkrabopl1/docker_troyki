import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Button from '../../Button'
import styled from 'styled-components';
import s from "./linkController.module.scss"

const TomatoButton = styled(Button)`
  border-color: tomato;
  border-radius:5px;
  padding:10px;
  background-color:white;

`;
type ContentSliderType = {
  currentPosition: number,
  positions: number,
  callback: (duration: number, stepDiff: number) => void
}

const SliderDefaultController: React.FC<ContentSliderType> = (data) => {
  const { currentPosition, positions, callback } = { ...data }

  return (
    <div style={{ justifyContent: "center", display: "flex" }}><button className={s.paginate + " " + s.right1}><i></i><i></i></button>
      <span style={{ margin: " auto 0" }}>
        {currentPosition}/{positions}
      </span>
      <button className={s.paginate + " " + s.right}><i></i><i></i></button>
    </div>
  )
}


export default SliderDefaultController