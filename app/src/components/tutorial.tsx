import { useState, useEffect } from 'react';

import type { MouseEvent } from 'react';

export interface TutorialProps {
  onHide:() => void;
};

import './tutorial.scss';
export default function Tutorial({
  onHide,
}:TutorialProps) {
  const [ fadeOut, setFadeOut ] = useState<boolean>(false);

  useEffect(() => {
    if(fadeOut) {
      const handle = setTimeout(onHide, 1000);

      return () => clearTimeout(handle);
    }
  }, [ fadeOut ]);

  const handleClick = (evt?:MouseEvent) => {
    if(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    setFadeOut(true);
  };

  return <div id='tutorial' className={fadeOut ? 'fade-out' : ''} onClick={handleClick}>
    <h1>Welcome to Chromaview</h1>
    <p>After accepting permision for this app to use your camera, you will be
      presented with a view of the world, as your camera sees it.</p>
    <p>You can click or tap on the camera view at any time to cycle the vision
      mode simulation to the next filter.</p>
    <p>At the bottom, you will see the name of the current filter. You can click
      or tap on that bar to open a selection menu. The menu will
      provide you with all the options available and a short summary about each
      of them. Click or tap any one to select that filter.</p>
    <p>Next to the title bar is a <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path d="M24 44q-4.3 0-7.9-1.5-3.6-1.5-6.3-4.2-2.7-2.7-4.3-6.4Q4 28.3 4 24q0-4.2 1.5-7.8Q7 12.4 9.8 9.7q2.6-2.7 6.3-4.3Q19.7 4 24 4q4.2 0 7.8 1.6 3.7 1.5 6.4 4.2t4.3 6.3Q44 19.8 44 24v.8l-.1.8-1.4-.8L41 24q0-7.3-4.9-12.1T24 7q-3.3 0-6.2 1Q15 9.3 13 11l13.7 13.7q-.7.2-1.3.6l-1.2.7L10.9 13Q9.1 15 8 17.9 7 20.8 7 24q0 6.3 3.7 10.8 3.8 4.6 9.6 5.8l1.8 1.8q1 1 1.9 1.6Zm10-3q3.2 0 6-1.6 2.9-1.6 4.7-4.4-1.8-2.8-4.7-4.4-2.8-1.6-6-1.6t-6 1.6Q25 32.2 23.3 35q1.8 2.8 4.7 4.4 2.8 1.6 6 1.6Zm0 3q-4.8 0-8.6-2.5T20 35q1.6-4 5.4-6.5Q29.2 26 34 26t8.6 2.5q3.8 2.6 5.4 6.5-1.6 4-5.4 6.5Q38.8 44 34 44Zm0-6q-1.3 0-2.1-.9T31 35q0-1.3.9-2.1T34 32q1.3 0 2.1.9T37 35q0 1.3-.9 2.1T34 38Z"/>
      </svg> button, when used it toggle the entire effect giving you a A/B
      sort of testing.</p>
    <p>To make the simulation more immersive you can use the <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path d="M10 38v-9.7h3V35h6.7v3Zm0-18.4V10h9.7v3H13v6.7ZM28.4 38v-3H35v-6.7h3V38ZM35 19.6V13h-6.7v-3H38v9.7Z"/>
      </svg> Full Screen button to fill your devices screen.</p>
    <h2>Click or tap this dialog to dismiss it!</h2>
  </div>
}