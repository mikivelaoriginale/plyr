Welcome!

Styling the default browser audio player (via CSS pseudo classes or similar) would be a very
nice feature. Howewer, its not a possiblity.

But if that is true, it would be nice if we would be able to somehow programatically (via javascript) enhance/decorate this default audio player so that it allows us to style it via CSS.

And thats _exactly_ what this library aims to do. Add possibility to style the default player without touching any of its existing API's or HTML.

Previously:

```jsx
//Hello World from imaginary "player.jsx/tsx"
const Player = () => {
  return (
    <audio controls autoplay>
      <source src="foo.opus" type="audio/ogg; codecs=opus" />
      <source src="foo.ogg" type="audio/ogg; codecs=vorbis" />
      <source src="foo.mp3" type="audio/mpeg" />
    </audio>
  );
};
```

Becomes...<br>

```jsx
//Hello World from imaginary "player.jsx/tsx"
//we need to plug in some imports
import Audio from "@mikivela/plyr";
import "index.css" from "@mikivela/plyr/dist";

const Player = () => {
  return (
    <Audio controls autoplay {...customProps}>
      <source src="foo.opus" type="audio/ogg; codecs=opus" />
      <source src="foo.ogg" type="audio/ogg; codecs=vorbis" />
      <source src="foo.mp3" type="audio/mpeg" />
    </Audio>
  );
};
```

A styled audio player to which you can change styles via CSS, or choose one of already existing themes. Or customize an existing theme.

## Custom props that Audio can receive

| Prop             | Default value | Type                          | Description                                     |
| ---------------- | ------------- | ----------------------------- | ----------------------------------------------- |
| theme            | null          | `"purple" \| "white" \| null` | Pick an existing theme                          |
| currentlyPlaying | ""            | string                        | Provide a title of played item, eg. "Title.mp3" |

## OK, BUT HOW DO I STYLE IT NOW?

Well, you can use some of the existing themes: `purple | white | null`,
**or** you can write **your** CSS and import it so that it styles the player.

You can find the default CSS in `@mikivela/dist/index.css`, copy it and customize it to your will. Then, you import such customized CSS at the top of the file where you use this player:

```jsx
import '@mikivela/plyr';
import '/path/to/myCustomizedCss.css';
```

and viola! You're done. Player will use your css.

Let's explore the _gotchas_ and _caveats_.

## GOTCHAS & CAVEATS

### Requirements

This library relies on Pointer Events browser API. The pain point where this is introduced is the progressbar which (in this case) is made using div's instead of `<input type="range">`. This choice makes it easier to style the progress bar and to enhance it with custom capabilities, but now the crossbrowser compatibility suffers - so its really a trade off between styleability and cross-browser support.

This library, currently, is opininated for styleability and customizability, and that's why the progressbar was made using ordinary divs.

It should nominally work in any browser that supports PointerEvents - however, in case it was opened in a browser that doesn't support PointerEvents, the player itself **will default to the default player**. Check used to determine if PointerEvents are supported:

```ts
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
```

### HOW IT WORKS (_for the curious and avid source readers_)

Basic idea was taken from official MDN pages, and is nothing new (although some parts of implementation could be). The idea is as follows. <br/>

A default browser element is rendered - but **hidden**, and HTML&CSS for the desired custom element is also rendered - but visible. Then, with javascript, these two are glued together as to seem as if the custom element is the real element.

Here's a pseudo code for how this library does it in React:

<br/>

```tsx
import {useRef} from "react";

const Audio = ({
  //firstly some custom props
  //that help us customize the player
  ...someCustomPropsThatThisLibraryUses
  //next, the <source> tag elements
  //extracted from the passed in HTML(JSX)
  children: sources,
  //lastly, props for <audio> element.
  ...audioProps
}: PlayerProps)) => {

  //a ref is created so we can connect to it later
  const audioPlayerRef = useRef(null);

  useEffect(()=> {
      //here is where the connection/glue happens
      const cleanup = initPlayer(audioPlayerRef.current);
      //cleanup function is returned that cleans up any listeners
      return cleanup;
  })

  return ({
    <>
      //display: "none" so the player is hidden
      <audio
        ref={audioPlayerRef}
        style={{display: "none"}}
        {...audioProps}
      >
        {sources}
      </audio>

      {/*Here lies the custom JSX("HTML") that we'll connect
        to the defeault element player in useEffect*/}

      <div className="playerContainer">
       <div className="progressBar"><div/>
       ...
      </div>
    </>

  })
}

```

What `initPlayer()` achieves is that when user interacts with the custom element, this interaction is fed to the default audio element. And also vice versa, if an event fires in audio element, custom player listens to it. This creates the sense that user is interacting with the player itself.

`initPlayer()` uses vanilla JS. It could have been written in pure React, without dropping to vanilla JS DOM, but that would limit portability to other frameworks, and potentially performance and readiblity would suffer.
