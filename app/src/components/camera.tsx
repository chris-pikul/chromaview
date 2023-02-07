import { useState, useEffect, useRef } from 'react';

import LUTState from './lut-state';
import FullscreenButton from './fullscreen';

import Processor from '../processor';
import { VisionModes } from '../vision-mode';

import type { VisionMode } from '../vision-mode';

export interface CameraProps {
  transitionedIn:boolean;
};

import './camera.scss';
export default function CameraComponent({
  transitionedIn,
}:CameraProps) {
  // Wrapping container element
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  // Canvas display element
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  // Processor class (singleton if possible)
  const processorRef = useRef<Processor|null>(null);

// FEAT: Color-blind mode switching
  const [ currentVisionMode, setCurrentVisionMode ] = useState<VisionMode|null>(null);

  const cycleVisionMode = () => {
    const availKeys = Object.keys(VisionModes);
    const curInd = availKeys.findIndex(key => VisionModes[key].name === currentVisionMode?.name);
    if(curInd !== -1) {
      const nextInd = (curInd + 1) % availKeys.length;
      setCurrentVisionMode(VisionModes[availKeys[nextInd]]);
    } else {
      setCurrentVisionMode(VisionModes[availKeys[0]]);
    }
  };

  // Watch when vision mode changes
  useEffect(() => {
    if(processorRef.current) {
      processorRef.current.changeLUT(currentVisionMode?.url);

      if(currentVisionMode && currentVisionMode.acuityDegrade)
        processorRef.current.acuity = Math.max(1, currentVisionMode.acuityDegrade);
      else
        processorRef.current.acuity = 1;
    }
  }, [ currentVisionMode ]);

// FEAT: A/B Toggle
  const [ isBypassed, setBypassed ] = useState<boolean>(false);

  const toggleBypassed = (evt:Event) => {
    // Prevent clickthrough
    if(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    if(processorRef.current) {
      processorRef.current.bypass = !isBypassed;
      setBypassed(processorRef.current.bypass);
    }
  }

// FEAT: Dom events
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

    if(canvasRef.current) {
      console.info('React received canvas element as mounted');

      if(!processorRef.current)
        processorRef.current = new Processor();

      processorRef.current.setCanvas(canvasRef.current);
    }

    // Initial resize event so processor get's it after component mount
    handleResize();

    // Cleanup after-effect
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ wrapperRef, canvasRef ]);

  // On transition finished
  useEffect(() => {
    if(transitionedIn && processorRef.current)
        processorRef.current.load();
  }, [ transitionedIn ]);

// FEAT: Component rendering
  return <div id='camera' ref={wrapperRef}>
    <canvas ref={canvasRef} width='320' height='240' />
    <div id='camera-overlay' onClick={cycleVisionMode}>
      <div id='camera-tools-bottom'>
        <span id='camera-curmode'>{ currentVisionMode === null ? 'Normal (Unchanged)' : currentVisionMode.name }</span>

        <button className='icon' title={isBypassed ? 'Resume Color-Blind Simulation' : 'View as normal vision' } onClick={evt => toggleBypassed(evt as unknown as Event)}>
          { isBypassed === true ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path d="M24 31.5q3.5 0 6-2.5 2.5-2.4 2.5-6 0-3.5-2.5-6-2.4-2.5-6-2.5-3.5 0-6 2.5-2.5 2.4-2.5 6 0 3.5 2.5 6 2.4 2.5 6 2.5Zm0-2.9q-2.4 0-4-1.6t-1.6-4q0-2.4 1.6-4t4-1.6q2.4 0 4 1.6t1.6 4q0 2.4-1.6 4t-4 1.6Zm0 9.4q-7.3 0-13.2-4.2Q4.9 29.8 2 23q2.9-6.7 8.8-10.8Q16.7 8 24 8q7.3 0 13.2 4.2Q43.1 16.3 46 23q-2.9 6.7-8.8 10.8Q31.3 38 24 38Zm0-15Zm0 12q6 0 11.1-3.3T43 23q-2.7-5.5-7.8-8.7Q30.1 11 24 11t-11.1 3.3Q7.8 17.6 5 23q2.7 5.5 7.8 8.7Q17.9 35 24 35Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path d="M24 44q-4.3 0-7.9-1.5-3.6-1.5-6.3-4.2-2.7-2.7-4.3-6.4Q4 28.3 4 24q0-4.2 1.5-7.8Q7 12.4 9.8 9.7q2.6-2.7 6.3-4.3Q19.7 4 24 4q4.2 0 7.8 1.6 3.7 1.5 6.4 4.2t4.3 6.3Q44 19.8 44 24v.8l-.1.8-1.4-.8L41 24q0-7.3-4.9-12.1T24 7q-3.3 0-6.2 1Q15 9.3 13 11l13.7 13.7q-.7.2-1.3.6l-1.2.7L10.9 13Q9.1 15 8 17.9 7 20.8 7 24q0 6.3 3.7 10.8 3.8 4.6 9.6 5.8l1.8 1.8q1 1 1.9 1.6Zm10-3q3.2 0 6-1.6 2.9-1.6 4.7-4.4-1.8-2.8-4.7-4.4-2.8-1.6-6-1.6t-6 1.6Q25 32.2 23.3 35q1.8 2.8 4.7 4.4 2.8 1.6 6 1.6Zm0 3q-4.8 0-8.6-2.5T20 35q1.6-4 5.4-6.5Q29.2 26 34 26t8.6 2.5q3.8 2.6 5.4 6.5-1.6 4-5.4 6.5Q38.8 44 34 44Zm0-6q-1.3 0-2.1-.9T31 35q0-1.3.9-2.1T34 32q1.3 0 2.1.9T37 35q0 1.3-.9 2.1T34 38Z"/>
            </svg>
          ) }
        </button>

        <FullscreenButton />
      </div>

      <LUTState processorRef={processorRef} />
    </div>
  </div>
}
