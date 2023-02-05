import { useState, useEffect, useRef } from 'react';
import Processor from '../processor';
import { VisionModes } from '../vision-mode';

import type { VisionMode } from '../vision-mode';

/**
 * Detect if the window is in fullscreen mode
 * 
 * @returns True if currently in fullscreen
 */
const detectIfFullscreen = ():boolean => (
  ('fullscreenElement' in document && document['fullscreenElement'] !== null) || 
  ('mozFullScreenElement' in document && document['mozFullScreenElement'] !== null) ||
  ('webkitFullscreenElement' in document && document['webkitFullscreenElement'] !== null)
);

export interface CameraProps {
  transitionedIn:boolean;
};

import './camera.scss';
export default function CameraComponent({
  transitionedIn,
}:CameraProps) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const processorRef = useRef<Processor|null>(null);
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  // FEAT: Fullscreen
  const [ isFullscreen, setFullscreen ] = useState(false);

  // Triggered when window goes in/out of fullscreen
  const handleFullscreen = () => setFullscreen(detectIfFullscreen());

  // Button press to toggle fullscreen mode
  const toggleFullscreen = (evt?:Event) => {
    // Prevent clickthrough
    if(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    // Exit fullscreen
    if(detectIfFullscreen())
      document.exitFullscreen();
    else
      document.documentElement.requestFullscreen();
  };

  const [ curMode, setCurrentMode ] = useState<VisionMode|null>(null);
  const [ loading, setLoading ] = useState<boolean>(false);
  const [ failed, setFailed ] = useState<boolean>(false);

  const cycleMode = () => {
    const availKeys = Object.keys(VisionModes);
    const curInd = availKeys.findIndex(key => VisionModes[key].name === curMode?.name);
    if(curInd !== -1) {
      const nextInd = (curInd + 1) % availKeys.length;
      setCurrentMode(VisionModes[availKeys[nextInd]]);
    } else {
      setCurrentMode(VisionModes[availKeys[0]]);
    }
  };

  const handleLUTLoading = () => setLoading(true);

  const handleLUTSuccess = () => {
    setLoading(false);
    setFailed(false);
  }

  const handleLUTFailed = () => {
    setLoading(false);
    setFailed(true);
  }

  // Watch when mode changes
  useEffect(() => {
    if(processorRef.current) {
      processorRef.current.onLUTLoading = handleLUTLoading;
      processorRef.current.onLUTSuccess = handleLUTSuccess;
      processorRef.current.onLUTFailed = handleLUTFailed;
      processorRef.current.changeLUT(curMode?.url);

      if(curMode && curMode.acuityDegrade)
        processorRef.current.acuity = Math.max(1, curMode.acuityDegrade);
      else
        processorRef.current.acuity = 1;
    }
  }, [ curMode ]);

  // Triggered when parent gets resized because of window resizing
  const handleResize = () => {
    if(wrapperRef.current && processorRef.current) {
      const bounds = wrapperRef.current.getBoundingClientRect();
      processorRef.current.handleResize(bounds);
    }
  };

  // On component mounted
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('fullscreenchange', handleFullscreen);

    if(canvasRef.current) {
      console.info('React received canvas element as mounted');

      if(!processorRef.current)
        processorRef.current = new Processor();

      processorRef.current.setCanvas(canvasRef.current);
    }

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [ canvasRef ]);

  // On transition finished
  useEffect(() => {
    if(transitionedIn) {
      if(processorRef.current)
        processorRef.current.load();

      console.info('React detected end of fade-in transition');
    }
  }, [ transitionedIn ]);

  return <div id='camera' ref={wrapperRef}>
    <canvas ref={canvasRef} width='320' height='240' />
    <div id='camera-overlay' onClick={cycleMode}>
      <div id='camera-tools-bottom'>
        <span id='camera-curmode'>{ curMode === null ? 'Normal (Unchanged)' : curMode.name }</span>

        <button className='icon' title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={evt => toggleFullscreen(evt as unknown as Event)}>
          { isFullscreen === true ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path d="M16.6 38v-6.7H10v-3h9.7V38Zm11.7 0v-9.7H38v3h-6.7V38ZM10 19.6v-3h6.7V10h3v9.7Zm18.4 0V10h3v6.7H38v3Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path d="M10 38v-9.7h3V35h6.7v3Zm0-18.4V10h9.7v3H13v6.7ZM28.4 38v-3H35v-6.7h3V38ZM35 19.6V13h-6.7v-3H38v9.7Z"/>
            </svg>
          ) }
          
        </button>
      </div>

      { loading && <div id='camera-loading' /> }

      { failed && <div id='camera-error'>
        <h3>Oops! An Error Occured</h3>
        <p>Looks like something went wrong trying to load the filter. Check your internet connection and try again.</p>
      </div> }
    </div>
  </div>
}
