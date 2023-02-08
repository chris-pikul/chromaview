import { useState } from 'react';
import { VisionModes } from '../vision-mode';

import type { MouseEvent } from 'react';
import type { VisionMode } from '../vision-mode';

const noClickThrough = (evt?:MouseEvent) => {
  // Prevent click-through
  if(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }
};

interface SelectorMenuProps {
  currentName:string;
  onSelect:(mode:VisionMode) => void;
};

function SelectorMenu({
  currentName,
  onSelect,
}:SelectorMenuProps) {
  return <div className='selector-menu' onClick={noClickThrough}>
    { Object.values(VisionModes).map(mode => {
      return <button key={mode.name}
        type='button'
        className={`selector-entry ${currentName === mode.name ? 'active' : 'inactive'}`}
        autoFocus={currentName === mode.name}
        onClick={() => onSelect(mode)}>
        { mode.name }
      </button>
    }) }
  </div>
}

export interface SelectorProps {
  current:VisionMode|null;
  onSelect:(mode:VisionMode) => void;
};

import './selector.scss';
export default function Selector({
  current,
  onSelect,
}:SelectorProps) {
  const [ isOpen, setIsOpen ] = useState<boolean>(false);

  // When the selector bar is clicked
  const handleCurrentClick = (evt?:MouseEvent) => {
    // Prevent click-through
    noClickThrough(evt);

    setIsOpen(!isOpen);
  }

  // When an entry is selected
  const handleSelect = (mode:VisionMode) => {
    setIsOpen(false);
    onSelect(mode);
  };

  // Derive a valid display label
  const displayName = (current && current.name) ?? 'Normal (Unchanged)';

  return <div className='selector'>
    { isOpen && <SelectorMenu currentName={current?.name ?? 'none'} onSelect={handleSelect} /> }

    <button type='button' className='selector-current' onClick={handleCurrentClick}>
      { displayName }
    </button>
  </div>
}