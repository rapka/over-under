import React from 'react';
import _ from 'lodash'

import Track from './Track';
import './App.css';

const SAMPLE_COUNTS = [8, 9, 7];

function App() {
  let tracks = [];

  _.each(SAMPLE_COUNTS, (count, i) => {
   tracks.push(<Track track={i + 1} sampleCount={count} />)
  });

  return (
    <div className="App">
      {tracks}
    </div>
  );
}

export default App;
