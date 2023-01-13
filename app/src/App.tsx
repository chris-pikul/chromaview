import { useState, useEffect } from 'react';

import Intro from './components/intro';

export default function App() {
  const [ showIntro, setShowIntro ] = useState(true);
  const hideIntro = () => setShowIntro(false);

  const [ transition, setTransition ] = useState(false);
  const startTransition = () => setTransition(true);

  useEffect(() => {
    if(transition) {
      const handle = setTimeout(() => {
        hideIntro();
      }, 1000);

      return () => clearTimeout(handle);
    }
  }, [ transition ]);

  return <>
    { showIntro && <Intro onDismiss={startTransition} transition={transition} /> }
  </>
}
