import React, { useState } from 'react';
import _ from 'lodash'

import Cover from './Cover';
import './Track.css';

class Track extends React.Component {
  constructor(props) {
    super(props);
    this.state = { visible: false };
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({ visible: true });
      console.log(`track ${this.props.track} starting`);
    }, (this.props.offset - 2) * 1000);
    setTimeout(() => {
      this.setState({ visible: false })
    }, ( this.props.offset + this.props.duration + 3 ) * 1000);
  }


  render() {
    let covers = [];

    _.times(this.props.sampleCount, n => {
      covers.push(
        <Cover
          key={n}
          track={this.props.track}
          sample={n + 1}
          samples={this.props.sampleCount}
          backward={n % 2 === 0}
        />
      )
    });

    return this.state.visible ? (
      <div
        className="track"
        style={{
          // animationDelay: `${this.props.offset}s`,
          animationDelay: `0s`,
          animationDuration: `${this.props.duration + 2}s`,
          //display: visible ? 'block' : 'none',
        }}
      >
        {covers}
      </div>
    ) : null;
  }

}

export default Track;
