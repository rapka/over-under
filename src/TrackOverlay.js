import React, { useState, useCallback, useEffect } from 'react';
import _ from 'lodash'

import TITLES from './titles';

import './TrackOverlay.css';

function TrackOverlay(props) {
  return (
    <div className="currentTrack">
      <span className="text-white">{props.track + 1}. {TITLES[props.track]}</span>
    </div>
  );
}

export default TrackOverlay;
