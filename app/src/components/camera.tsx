import { useState, useEffect, useRef } from 'react';

import Tutorial from './tutorial';
import Toolbar from './toolbar';
import LUTState from './lut-state';

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

// FEAT: Starting tutorial
  const [ showTutorial, setShowTutorial ] = useState<boolean>(true);

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

  // Used by the toolbar to select from a drop-down menu
  const handleSelectMode = (mode:VisionMode) => setCurrentVisionMode(mode);

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
      
      { showTutorial && <Tutorial onHide={() => setShowTutorial(false)}/> }

      <Toolbar processorRef={processorRef}
        currentVisionMode={currentVisionMode}
        onSelectMode={handleSelectMode} />

      <LUTState processorRef={processorRef} />
    </div>
  </div>
}
