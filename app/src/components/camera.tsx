import { useEffect, useRef } from 'react';
import Processor from '../processor';

export interface CameraProps {
  transitionedIn:boolean;
};

import './camera.scss';
export default function CameraComponent({
  transitionedIn,
}:CameraProps) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const processorRef = useRef<Processor|null>(null);

  const handleResize = () => {
    const bounds = document.body.getBoundingClientRect();

    if(processorRef.current)
      processorRef.current.handleResize(bounds);
  };

  // On component mounted
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();

    if(canvasRef.current) {
      console.info('React received canvas element as mounted');

      if(!processorRef.current)
        processorRef.current = new Processor();

      processorRef.current.setCanvas(canvasRef.current);
    }

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
  </div>
}
