import { useState } from 'react';

import Intro from './components/intro';

export default function App() {
  const [ showIntro, setShowIntro ] = useState(true);
  const hideIntro = () => setShowIntro(false);

  return <>
    { showIntro && <Intro onDismiss={hideIntro} /> }
  </>
}
