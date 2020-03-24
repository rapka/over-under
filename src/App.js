import React, { useState, useCallback, useEffect } from 'react';
import _ from 'lodash'

import Track from './Track';
import Viz from './Viz';
import './App.css';

const SAMPLE_COUNTS = [8, 9, 7];
const DURATIONS = [84, 145, 96, 124, 80, 46, 83, 128, 150, 152, 119, 137, 147, 135, 129, 123, 192];
// const DURATIONS = [10, 10, 96, 124, 80, 46, 83, 128, 150, 152, 119, 137, 147, 135, 129, 123, 192];

function App() {
  const [playing, setPlaying] = useState(false);

  const escFunction = useCallback((event) => {
    if(event.keyCode === 32) {
      setPlaying(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);

    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, [escFunction]);

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

  if (!playing) {
    return <div className="App" />;
  }

  return (
    <div className="App">
      <Viz />
      <div className="bg-container">
        <img className="bg" src="/bg169repeat.png" />
        <img className="bg2" src="/bg169repeat.png" />
        <img className="bg3" src="/bg169repeat.png" />
      </div>
      <div className="track-container">
        {tracks}
      </div>
      <img className="moon" src="/moon2back2.png" />
    </div>
  );
}

export default App;
