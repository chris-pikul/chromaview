import { useState, useCallback, useEffect } from 'react';

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

export default function FullscreenButton() {
  const [ isFullscreen, setIsFullscreen ] = useState<boolean>(detectIfFullscreen);

  const handleFullscreenChange = useCallback((evt:Event) => setIsFullscreen(detectIfFullscreen()), []);

  const toggleFullscreen = (evt:Event) => {
    // Prevent click-through on button press
    if(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    }

    // Toggle if we already are, or request if we aren't
    if(detectIfFullscreen())
      document.exitFullscreen();
    else
      document.documentElement.requestFullscreen();
  };

  // Watch for component mount/unmount so we can bind to the window event
  useEffect(() => {
    window.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => window.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return <button className='icon toolbar-button' title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={evt => toggleFullscreen(evt as unknown as Event)}>
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
}