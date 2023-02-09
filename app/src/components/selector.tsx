import { useEffect, useState } from 'react';
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

const modeToLabel = (mode?:VisionMode|null) => {
  if(mode)
    return `${mode.name} — ${mode.classification}`;

  return 'Normal Vision (Unchanged)';
}

interface SelectorMenuProps {
  currentID:string;
  fadeOut?:boolean;
  onSelect:(mode:VisionMode) => void;
};

function SelectorMenu({
  currentID,
  fadeOut,
  onSelect,
}:SelectorMenuProps) {
  return <div className={`selector-menu ${fadeOut ? 'trans-out' : ''}`} onClick={noClickThrough}>
    { Object.values(VisionModes).map(mode => {
      return <button key={mode.id}
        type='button'
        className={`selector-entry ${currentID === mode.id ? 'active' : 'inactive'}`}
        autoFocus={currentID === mode.id}
        onClick={() => onSelect(mode)}>
        
        <header>
          <h2>{ mode.name }</h2>
          <h3>{ mode.classification }</h3>
        </header>

        <p>{ mode.summary }</p>

        { (!mode.animal) && <footer>
          <label>Estimated people with this condition:</label>
          <span className='entry-stat'>Males: {mode.rates[0] }%</span>
          <span className='entry-stat'>Females: {mode.rates[1]}%</span>  
        </footer>}
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
  const [ fadeOut, setFadeOut ] = useState<boolean>(false);

  // When the selector bar is clicked
  const handleCurrentClick = (evt?:MouseEvent) => {
    // Prevent click-through
    noClickThrough(evt);

    if(isOpen)
      setFadeOut(true)
    else
      setIsOpen(true);
  }

  // When an entry is selected
  const handleSelect = (mode:VisionMode) => {
    onSelect(mode);

    if(isOpen)
      setFadeOut(true);
  };

  // Manage transition out
  useEffect(() => {
    if(fadeOut) {
      const handle = setTimeout(() => {
        setIsOpen(false);
        setFadeOut(false);
      }, 300);

      return () => clearTimeout(handle);
    }
  }, [ fadeOut ]);

  return <div className='selector'>
    { (isOpen || fadeOut) && <SelectorMenu currentID={current?.id ?? ''} onSelect={handleSelect} fadeOut={fadeOut} /> }

    <button type='button' className='selector-current' onClick={handleCurrentClick}>
      { current ? (<>
        <span className='current-name'>{ current.name }</span>
        <span className='current-class'>&nbsp;—&nbsp;{ current.classification }</span>
      </>) : (
        'Normal Vision (Unchanged)'
      ) }
    </button>
  </div>
}