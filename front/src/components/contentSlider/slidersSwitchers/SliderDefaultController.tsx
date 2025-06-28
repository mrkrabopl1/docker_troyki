import React, { ReactElement, useEffect, useRef, useState } from 'react'
import Button from '../../Button'
import styled from 'styled-components';
import s from "./linkControllerNewPreset.module.scss"

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
  showInfo?: boolean
}

const SliderDefaultController: React.FC<ContentSliderType> = (data) => {
  const { currentPosition, positions, onChange, showInfo } = { ...data }
  let [active, setActive] = useState<number>(currentPosition)
  const leftFunc = () => {
    if (active > 1) {
      onChange(active - 1)
    }
  }
  useEffect(() => {
    setActive(currentPosition)
  }, [currentPosition])


  const rightFunc = () => {
    if (active < positions) {
      onChange(active + 1)
    }
  }
  return (
    <div style={{ justifyContent: "center", display: "flex" }}>
      <button onClick={() => leftFunc()} className={s.paginate + " " + s.right1}><i className={s.def}></i><i className={s.def}></i></button>
      {
        showInfo ? <span style={{ margin: " auto 0" }}>
          {currentPosition}/{positions}
        </span> : null
      }
      <button onClick={() => rightFunc()} className={s.paginate + " " + s.right}><i className={s.def}></i><i className={s.def}></i></button>
    </div>
  )
}


export default SliderDefaultController