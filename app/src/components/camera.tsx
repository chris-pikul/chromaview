import { useState, useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const processorRef = useRef<Processor|null>(null);

  const [ curMode, setCurrentMode ] = useState<VisionMode|null>(null);

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

  // Watch when mode changes
  useEffect(() => {
    if(processorRef.current) {
      processorRef.current.changeLUT(curMode?.url);

      if(curMode && curMode.acuityDegrade)
        processorRef.current.acuity = Math.max(1, curMode.acuityDegrade);
      else
        processorRef.current.acuity = 1;
    }
  }, [ curMode ]);

  // Triggered when parent gets resized because of window resizing
  const handleResize = () => {
    const camEL = document.getElementById('camera');
    if(camEL) {
      const bounds = camEL.getBoundingClientRect();

      if(processorRef.current)
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

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
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

  return <div id='camera'>
    <canvas ref={canvasRef} width='320' height='240' />
    <div id='camera-overlay' onClick={cycleMode}>
      <div id='camera-tools-bottom'>
        <span id='camera-curmode'>{ curMode === null ? 'Normal (Unchanged)' : curMode.name }</span>
        <button className='icon'>F</button>
      </div>
    </div>
  </div>
}
