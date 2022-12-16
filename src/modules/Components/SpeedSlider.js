import 'rc-slider/assets/index.css';
import 'rc-tooltip/assets/bootstrap.css';
import React from 'react';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import './style.scss';

const Handle = Slider.Handle;
const handle = (props) => {
  const { value, dragging, index, ...restProps } = props;
  return (
    <Tooltip
      prefixCls="rc-slider-tooltip"
      overlay={value}
      // visible={dragging}
      visible={true}
      placement="top"
      key={index}
    >
      <Handle value={value} {...restProps} />
    </Tooltip>
  );
};

const SpeedSlider = ({ handleSpeedChange, defaultSpeed, label }) => {
  return (
    <div className="slider-container">
      <p className="slider-label">{label}</p>
      <Slider
        min={0.5}
        max={2.0}
        step={0.1}
        defaultValue={defaultSpeed}
        handle={handle}
        onChange={handleSpeedChange}
      />
    </div>
  );
};

export default SpeedSlider;
