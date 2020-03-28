import React from 'react';
import styled, { keyframes } from "styled-components";

import './Cover.css';

const maxOpacity = (sample, count) => {
  const newMin = 0.2;
  const newMax = 1;
  const ratio = (count - sample) / count;
  const adjusted = (ratio * (newMax - newMin)) + newMin;
  return adjusted * 100;
};

function Cover(props) {
  const animation = keyframes`
    {
        0% {
            transform: rotate(${props.backward ? 0 : 360}deg) translate3d(0, 0, 0);
            filter: blur(10px) opacity(0%);
        }
        50% {
            filter: blur(5px) opacity(${maxOpacity(props.sample, props.samples)}%);
        }
        100% {
            transform: rotate(${props.backward ? 360 : 0}deg) translate3d(0, 0, 0);
            filter: blur(10px) opacity(0%);
        }
    }
  `;

  const Container = styled.div`
        animation: ${animation} ${(props.sample + 1) * 2000}ms linear infinite;
        position: absolute;
      `;

  return (

    <Container>
      <img
        src={`/covers/${props.track}/${props.sample}.jpg`}
        className="cover"
        style={{
          transform: `rotate(${(360 / props.samples) * props.sample}deg)`,
        }}
      />
    </Container>
  );
}

export default Cover;
