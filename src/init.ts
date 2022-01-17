import playIcon from './icons/play.svg';
import pauseIcon from './icons/pause.svg';

type VoidFunction = (...args: any) => void;

function throttle(callback: VoidFunction, limit: number) {
  let waiting = false;
  let finalTimeout: ReturnType<typeof setTimeout> | null;
  return function (...args: any) {
    if (!waiting) {
      if (finalTimeout) {
        clearTimeout(finalTimeout);
      }
      callback(...args);
      waiting = true;
      setTimeout(function () {
        waiting = false;
      }, limit);
    } else {
      if (finalTimeout) {
        clearTimeout(finalTimeout);
      }
      finalTimeout = setTimeout(() => callback(...args), limit / 2);
    }
  };
}

function prettyPrintSeconds(secondsWithRemainder: number) {
  if (secondsWithRemainder === undefined) {
    return 'N/A';
  }
  const totalSeconds = Math.floor(secondsWithRemainder);
  const secondsInHour = 60 * 60;
  const secondsInMinute = 60;
  const hours = Math.floor(totalSeconds / secondsInHour);
  const minutes = Math.floor((totalSeconds % secondsInHour) / secondsInMinute);
  const seconds = Math.floor(totalSeconds % secondsInMinute);

  const hoursString = hours === 0 ? null : hours < 10 ? '0' + hours : hours;
  const minutesString =
    minutes === 0 ? '00' : minutes < 10 ? '0' + minutes : minutes;
  const secondsString = seconds < 10 ? '0' + seconds : seconds;

  const prettyPrintedString = `${hoursString ? hoursString + ':' : ''}${
    minutesString + ':'
  }${secondsString}`;

  return prettyPrintedString;
}

function prefixWithZero(timeUnit: number) {
  return timeUnit < 10 ? '0' + timeUnit : String(timeUnit);
}

interface Time {
  seconds: string | null;
  minutes: string | null;
  hours: string | null;
  toString: () => string;
}

function addSecondsToTime(time: Time, diff: number) {
  let newSeconds = Number(time.seconds) + diff;

  if (newSeconds > 59) {
    time.seconds = prefixWithZero(newSeconds % 60);
    if (time.minutes === '59') {
      time.minutes = '00';
      time.hours = prefixWithZero(Number(time.hours) + 1);
    } else {
      time.minutes = prefixWithZero(Number(time.minutes) + 1);
    }
  } else {
    time.seconds = prefixWithZero(newSeconds);
  }

  return time.toString();
}

type PointerEventListener = (e: PointerEvent) => void;
type Listener = EventListener | PointerEventListener;

type TrackedListener = {
  element: Element;
  type: keyof HTMLElementEventMap;
  listener: Listener;
  options?: AddEventListenerOptions;
};

const listeners: TrackedListener[] = [];

export function init(container: HTMLDivElement, myAudio: HTMLAudioElement) {
  const durationElement = container.querySelector('#duration') as HTMLElement;
  const playButton = container.querySelector('#playButton') as HTMLElement;
  const progressBar = container.querySelector('.progress.bar') as HTMLElement;
  const bufferBar = container.querySelector('.buffer.bar') as HTMLElement;
  const barHolder = container.querySelector('#barHolder') as HTMLElement;
  const circleHolder = container.querySelector('#circleHolder') as HTMLElement;
  const circle = container.querySelector(
    '#circleHolder .circle'
  ) as HTMLElement;
  const currentTime = container.querySelector('#currentTime') as HTMLElement;
  const cancelSeek = container.querySelector('#cancelSeek') as HTMLElement;
  const cancelSeekButton = container.querySelector(
    '#cancelSeek .button'
  ) as HTMLElement;
  const cancelSeekCurrentTime = container.querySelector(
    '#cancelSeek .currentTime'
  ) as HTMLElement;
  const cancelSeekDuration = container.querySelector(
    '#cancelSeek .duration'
  ) as HTMLElement;

  let playing = false;

  function addEventListener(
    element: Element,
    type: keyof HTMLElementEventMap,
    listener: Listener,
    options?: AddEventListenerOptions
  ) {
    listeners.push({ element, type, listener, options });

    element.addEventListener(type, listener as EventListener, options);
  }

  function removeAllEventListeners() {
    for (const { element, type, listener, options } of listeners) {
      element.removeEventListener(type, listener as EventListener, options);
    }
  }

  var time: Time = {
    seconds: '00',
    minutes: '00',
    hours: '00',
    toString() {
      return this.hours
        ? this.hours + ':' + this.minutes + ':' + this.seconds
        : this.minutes + ':' + this.seconds;
    },
  };

  function initializeTime(prettyPrintedDuration: string) {
    const timeStringArray = prettyPrintedDuration.split(':');
    if (timeStringArray.length === 2) {
      time.hours = null;
    }
  }

  function setTime(timeString: string) {
    const timeArray = timeString.split(':');
    if (timeArray.length === 3) {
      time.seconds = timeArray[2] || null;
      time.minutes = timeArray[1] || null;
      time.hours = timeArray[0] || null;
    } else if (timeArray.length === 2) {
      time.seconds = timeArray[1] || null;
      time.minutes = timeArray[0] || null;
      time.hours = null;
    }
  }

  function displayControls() {
    // playButton.style.display = "block";
  }

  // check that the media is ready before displaying the controls
  if (myAudio.readyState === 4) {
    displayControls();
  } else {
    // not ready yet - wait for canplay event
    addEventListener(myAudio, 'canplay', displayControls, { once: true });
  }

  if (myAudio.readyState > 0) {
    const prettyPrintedDuration = prettyPrintSeconds(myAudio.duration);
    if (durationElement) durationElement.innerHTML = prettyPrintedDuration;
    if (cancelSeekDuration)
      cancelSeekDuration.innerHTML = prettyPrintedDuration;
  } else {
    addEventListener(myAudio, 'loadedmetadata', onLoadedMetadata);
  }

  function onLoadedMetadata() {
    const prettyPrintedDuration = prettyPrintSeconds(myAudio.duration);
    durationElement.innerHTML = prettyPrintedDuration;

    cancelSeekDuration.innerHTML = prettyPrintedDuration;
    initializeTime(prettyPrintedDuration);
    initializeSingleSecondProgressPercentage();
  }

  const playOrPause: EventListener = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      myAudio.pause();
    } else {
      myAudio.play();
    }
  };

  function playAudio() {
    playing = true;
    playButton.style.backgroundImage = `url(${pauseIcon})`;
  }

  function pauseAudio() {
    playing = false;
    playButton.style.backgroundImage = `url(${playIcon})`;
  }

  addEventListener(playButton, 'click', playOrPause);
  addEventListener(myAudio, 'play', playAudio);
  addEventListener(myAudio, 'pause', pauseAudio);

  let seeking = false;
  let singleSecondProgressPercentage: number;
  let currentProgressPercentage = 0;
  let currentSecond = 0;

  function initializeSingleSecondProgressPercentage() {
    const totalDuration = Math.floor(myAudio.duration);
    let nonRoundedPercentage = (1 / totalDuration) * 100;
    singleSecondProgressPercentage =
      Math.round(nonRoundedPercentage * 100 * 100) / (100 * 100);
  }

  function endTrack() {
    currentProgressPercentage = 100;
    progressBar.style.left = `${currentProgressPercentage}%`;
    circleHolder.style.left = `${currentProgressPercentage}%`;
  }

  addEventListener(myAudio, 'ended', endTrack);

  function nonThrottledTimeUpdate() {
    const newSeconds = Math.floor(myAudio.currentTime);
    const diff = newSeconds - currentSecond;

    if (diff === 0) {
      return;
    } else if (diff < 0) {
      setTime(prettyPrintSeconds(newSeconds));
      currentProgressPercentage = newSeconds * singleSecondProgressPercentage;
    } else {
      addSecondsToTime(time, diff);
      currentSecond = newSeconds;
      currentProgressPercentage += diff * singleSecondProgressPercentage;
    }

    if (!seeking) {
      requestAnimationFrame(() => {
        currentTime.innerHTML = time.toString();
        progressBar.style.left = `${currentProgressPercentage}%`;
        circleHolder.style.left = `${currentProgressPercentage}%`;
      });
    } else {
      currentTime.innerHTML = time.toString();
    }
  }

  const timeUpdate = nonThrottledTimeUpdate;
  addEventListener(myAudio, 'timeupdate', timeUpdate);

  function bufferBarUpdate() {
    var duration = myAudio.duration;
    if (duration > 0) {
      if (myAudio.buffered.length > 0) {
        const bufferedPercentage =
          (myAudio.buffered.end(myAudio.buffered.length - 1) / duration) * 100;
        bufferBar.style.width = bufferedPercentage + '%';
      }
    }
  }

  addEventListener(myAudio, 'progress', bufferBarUpdate);

  let cancelSeekBoundingClientRect: DOMRect;
  let isTouchingCancelSeek = false;

  function setCancelSeekBoundingClientRect(clientRect: DOMRect) {
    cancelSeekBoundingClientRect = {
      ...clientRect,
      top: Math.floor(clientRect.top),
      bottom: Math.floor(clientRect.bottom),
    };
  }

  function touchInsideCancelSeek(e: MouseEvent) {
    if (
      e.clientY > cancelSeekBoundingClientRect.top &&
      e.clientY < cancelSeekBoundingClientRect.bottom
    ) {
      return true;
    }
    return false;
  }

  const nonThrottledUpdatePosition = (e: PointerEvent) => {
    let newPercentage =
      ((e.pageX - barHolder.offsetLeft) / barHolder.clientWidth) * 100;

    let newSeconds;

    if (e.pointerType === 'touch') {
      if (touchInsideCancelSeek(e) && !isTouchingCancelSeek) {
        isTouchingCancelSeek = true;
        cancelSeek.classList.add('cancel');
      } else if (!touchInsideCancelSeek(e) && isTouchingCancelSeek) {
        isTouchingCancelSeek = false;
        cancelSeek.classList.remove('cancel');
      }
    }

    if (newPercentage < 0) {
      newSeconds = 0;
    } else if (newPercentage > 100) {
      newSeconds = Math.floor(myAudio.duration);
    } else {
      newSeconds = Math.floor(newPercentage / singleSecondProgressPercentage);
    }

    const currentTimeString = prettyPrintSeconds(newSeconds);
    const roundedNewPercentage = newSeconds * singleSecondProgressPercentage;

    cancelSeekCurrentTime.innerHTML = currentTimeString;
    progressBar.style.left = `${roundedNewPercentage}%`;
    circleHolder.style.left = `${roundedNewPercentage}%`;
  };

  const updatePosition = throttle(nonThrottledUpdatePosition, 25);

  function cancelSeekIsPressed(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.target === cancelSeekButton) {
      return true;
    } else if (e.pointerType === 'touch') {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target === cancelSeekButton) return true;
    }
    return false;
  }

  const cleanup = (e: PointerEvent) => {
    seeking = false;
    window.removeEventListener('pointermove', updatePosition);
    window.removeEventListener('pointerup', cleanup);

    try {
      if (cancelSeekIsPressed(e)) throw new Error('Seek cancelled');
    } catch (e) {
      currentTime.innerHTML = time.toString();
      progressBar.style.left = `${currentProgressPercentage}%`;
      circleHolder.style.left = `${currentProgressPercentage}%`;
      return;
    } finally {
      circle.classList.remove('display');
      cancelSeek.classList.remove('display');
    }

    const rawNewPercentage = Number(circleHolder.style.left.slice(0, -1));

    const newSeconds = Math.floor(
      rawNewPercentage / singleSecondProgressPercentage
    );

    currentProgressPercentage = newSeconds * singleSecondProgressPercentage;
    currentSecond = newSeconds;
    const newTime = prettyPrintSeconds(newSeconds);
    setTime(newTime);

    // move the playhead to the correct position
    myAudio.currentTime = newSeconds;
    currentTime.innerHTML = time.toString();
    progressBar.style.left = `${currentProgressPercentage}%`;
    circleHolder.style.left = `${currentProgressPercentage}%`;
  };

  function handlePointerDown(e: PointerEvent | Event) {
    e.preventDefault();
    e.stopPropagation();

    seeking = true;
    circle.classList.add('display');
    cancelSeek.classList.add('display');
    setCancelSeekBoundingClientRect(cancelSeekButton.getBoundingClientRect());
    updatePosition(e);

    window.addEventListener('pointermove', updatePosition);
    window.addEventListener('pointerup', cleanup);
  }

  addEventListener(barHolder, 'pointerdown', handlePointerDown);

  return () => {
    removeAllEventListeners();
  };
}

export function initDefault(
  container: HTMLDivElement,
  myAudio: HTMLAudioElement
) {
  const playButton = container.querySelector('#playButton') as HTMLElement;
  let playing = false;

  const listeners: TrackedListener[] = [];

  function addEventListener(
    element: Element,
    type: keyof HTMLElementEventMap,
    listener: Listener,
    options?: AddEventListenerOptions
  ) {
    listeners.push({ element, type, listener, options });

    element.addEventListener(type, listener as EventListener, options);
  }

  function removeAllEventListeners() {
    for (const { element, type, listener, options } of listeners) {
      element.removeEventListener(type, listener as EventListener, options);
    }
  }

  const playOrPause: EventListener = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (playing) {
      playButton.style.backgroundImage = `url(${playIcon})`;
      myAudio.pause();
    } else {
      playButton.style.backgroundImage = `url(${pauseIcon})`;
      myAudio.play();
    }
  };

  function playAudio() {
    playing = true;
    playButton.style.backgroundImage = `url(${pauseIcon})`;
  }

  function pauseAudio() {
    playing = false;
    playButton.style.backgroundImage = `url(${playIcon})`;
  }

  addEventListener(playButton, 'click', playOrPause);
  addEventListener(myAudio, 'play', playAudio);
  addEventListener(myAudio, 'pause', pauseAudio);

  return () => {
    removeAllEventListeners();
  };
}
