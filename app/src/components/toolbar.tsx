import Selector from './selector';
import BypassButton from './bypass';
import FullscreenButton from './fullscreen';

import type { MutableRefObject } from 'react';
import type Processor from '../processor';
import type { VisionMode } from '../vision-mode';

export interface ToobarProps {
  processorRef:MutableRefObject<Processor|null>;
  currentVisionMode:(VisionMode|null);
  onSelectMode:(mode:VisionMode) => void;
};

import './toolbar.scss';
export default function Toolbar({
  processorRef,
  currentVisionMode,
  onSelectMode,
}:ToobarProps) {
  return <div className='toolbar'>
    <Selector current={currentVisionMode} onSelect={onSelectMode} />
    
    <BypassButton processorRef={processorRef} />
    <FullscreenButton />
  </div>
}