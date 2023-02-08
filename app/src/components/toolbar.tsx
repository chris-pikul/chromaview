import Selector from './selector';
import BypassButton from './bypass';
import FullscreenButton from './fullscreen';

import type { MutableRefObject } from 'react';
import type Processor from '../processor';
import type { VisionMode } from '../vision-mode';

export interface ToobarProps {
  processorRef:MutableRefObject<Processor|null>;
  currentVisionMode:(VisionMode|null);
};

import './toolbar.scss';
export default function Toolbar({
  processorRef,
  currentVisionMode,
}:ToobarProps) {
  return <div className='toolbar'>
    <Selector current={currentVisionMode} />
    
    <div className='toolbar-buttons'>
      <BypassButton processorRef={processorRef} />
      <FullscreenButton />
    </div>
  </div>
}