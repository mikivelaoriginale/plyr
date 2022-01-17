import React from 'react';
import replay5 from './icons/replay5.svg';
import replay10 from './icons/replay10.svg';
import replay30 from './icons/replay30.svg';
import forward5 from './icons/forward5.svg';
import forward10 from './icons/forward10.svg';
import forward30 from './icons/forward30.svg';

const replay = (time: number) => () => {
  const audioPlayer = document.getElementById('my-audio') as HTMLAudioElement;
  if (audioPlayer) audioPlayer.currentTime = audioPlayer.currentTime + time;
};

interface Props {
  additionalButtons: JSX.Element | JSX.Element[];
}

export const PlayerControls = ({ additionalButtons }: Props) => {
  return (
    <div id="audioControls" className="audioControls">
      <div className="audioButton" onClick={replay(-30)}>
        <img src={replay30} alt="loading" />
      </div>
      <div className="audioButton" onClick={replay(-10)}>
        <img src={replay10} alt="loading" />
      </div>
      <div className="audioButton" onClick={replay(-5)}>
        <img src={replay5} alt="loading" />
      </div>
      <button id="playButton" className="audioButton noFlash"></button>
      <div className="audioButton" onClick={replay(5)}>
        <img src={forward5} alt="loading" />
      </div>
      <div className="audioButton" onClick={replay(10)}>
        <img src={forward10} alt="loading" />
      </div>
      <div className="audioButton" onClick={replay(30)}>
        <img src={forward30} alt="loading" />
      </div>
      {additionalButtons}
    </div>
  );
};
