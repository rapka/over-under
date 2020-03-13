import React from 'react';
import _ from 'lodash'

import Track from './Track';
import './App.css';

const SAMPLE_COUNTS = [8, 9, 7];
const DURATIONS = [84, 145, 96, 124, 80, 46, 83, 128, 150, 152, 119, 137, 147, 135, 129, 123, 192];
// const DURATIONS = [10, 10, 96, 124, 80, 46, 83, 128, 150, 152, 119, 137, 147, 135, 129, 123, 192];

function App() {
  let tracks = [];

  _.each(SAMPLE_COUNTS, (count, i) => {
   tracks.push((
    <Track
      key={i}
      track={i + 1}
      sampleCount={count}
      duration={DURATIONS[i]}
      offset={_.sum(DURATIONS.slice(0, i))}
    />
  ))
  });

  return (
    <div className="App">
      {tracks}
    </div>
  );
}

export default App;
