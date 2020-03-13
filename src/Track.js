import React from 'react';
import _ from 'lodash'

import Cover from './Cover';
import './Track.css';

function Track(props) {
  let covers = [];

  _.times(props.sampleCount, n => {
    covers.push(
      <Cover
        track={props.track}
        sample={n + 1}
        samples={props.sampleCount}
        backward={props.track % 2 === 0}
      />
    )
  });

  return (
    <div
      className="track"
      style={{
        transform: `translateY(${(props.track - 1) * 100}px)`,
        animationDelay: `${props.offset}s`,
        animationDuration: `${props.duration}s`
      }}
    >
      {covers}
    </div>
  );
}

export default Track;
