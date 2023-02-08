import { VisionModes } from '../vision-mode';

import type { VisionMode } from '../vision-mode';

export interface SelectorProps {
  current:VisionMode|null;
};

import './selector.scss';
export default function Selector({
  current,
}:SelectorProps) {

  const displayName = (current && current.name) ?? 'Normal (Unchanged)';

  return <div className='selector'>
    <button type='button' className='selector-current'>
      { displayName }
    </button>
  </div>
}