import React from 'react';

import './Cover.css';

function Cover(props) {
  return (
    <div
      className="cover-container"
      style={{
        animationDuration: `${(props.sample) * 2000}ms`,
        // animationDelay: `${(props.samples - props.sample) * -1000}ms`,
        animationName: props.backward ? 'backward' : 'forward'
      }}
    >
      <img
        src={`/covers/${props.track}/${props.sample}.jpg`}
        className="cover"
        style={{
          transform: `rotate(${(360 / props.samples) * props.sample}deg)`,
        }}
      />
    </div>
  );
}

export default Cover;
