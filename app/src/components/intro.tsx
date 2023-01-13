import Hero from './intro-hero';

import type { ComponentProps } from 'react';

export interface IntroProps {
  onDismiss: Function;
}

export default function Intro({
  onDismiss,
}:IntroProps) {
  return <header id='intro' onClick={() => onDismiss()}>
    <Hero />
  </header>
}
