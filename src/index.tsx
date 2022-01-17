import React, { useEffect, useRef } from 'react';
import { PlayerControls } from './PlayerControls';

import { init, initDefault } from './init';

const isPointerSupported = () => {
  let isPointerSupported;

  try {
    new PointerEvent('');
    isPointerSupported = true;
  } catch {
    isPointerSupported = false;
  }

  return isPointerSupported;
};

export type PlayerProps = {
  currentlyPlaying: string | JSX.Element;
  additionalButtons: JSX.Element | JSX.Element[];
  theme?: 'purple' | 'white';
  children: React.ReactNode;
} & React.AudioHTMLAttributes<HTMLAudioElement>;

export function Audio({
  currentlyPlaying,
  additionalButtons,
  children: sources,
  theme,
  ...audioProps
}: PlayerProps) {
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!audioElementRef.current || !playerContainerRef.current) {
      return;
    }

    let cleanup;

    if (!isPointerSupported()) {
      cleanup = initDefault(
        playerContainerRef.current,
        audioElementRef.current
      );
    } else {
      cleanup = init(playerContainerRef.current, audioElementRef.current);
    }

    return cleanup;
  }, []);

  if (!isPointerSupported()) {
    return (
      <>
        <audio ref={audioElementRef}>{sources}</audio>
        <PlayerControls additionalButtons={additionalButtons} />
      </>
    );
  }

  return (
    <div
      className={`playerContainer ${theme ? theme : ''}`}
      ref={playerContainerRef}
    >
      <div style={{ display: 'none' }}>
        {
          <audio {...audioProps} ref={audioElementRef}>
            {sources}
          </audio>
        }
      </div>

      <div id="player">
        <div className="playerInfo">
          {currentlyPlaying && (
            <div
              style={{
                lineHeight: '12px',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '12px' }}>Currently playing: </span>
              <br />

              <div
                style={{
                  fontWeight: 600,
                  fontSize: '12px',
                  height: '20px',
                  overflowX: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                {currentlyPlaying}
              </div>
            </div>
          )}
          <div
            style={{
              whiteSpace: 'nowrap',
              color: theme === 'purple' ? '#c1c1c1' : '',
            }}
          >
            <span id="currentTime">00:00</span>
            <span>/</span>
            <span id="duration">00:00</span>
          </div>
        </div>
        <div className="barContainer noFlash">
          <div id="barHolder" className="noTouchAction">
            <div className="bars">
              <div className="progress bar"></div>
              <div className="buffer bar"></div>
              <div className="norm bar"></div>
            </div>
            <div id="circleHolder">
              <div className="circle" />

              <div id="cancelSeek" className="noFlash">
                <span className="currentTime">00:00</span>
                <div className="button" />
                <span className="duration">00:00</span>
                <div className="dropOverlay"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PlayerControls additionalButtons={additionalButtons} />
    </div>
  );
}
