import Hero from './intro-hero';

export interface IntroProps {
  onDismiss: Function;
}

import './intro.scss';
export default function Intro({
  onDismiss,
}:IntroProps) {
  return <header id='intro' onClick={() => onDismiss()}>
    <Hero />

    <p>Ever wondered what the world looked like through someone else's eyes?
    Maybe you know someone with a color-blind condition, and you yourself having
    normal vision, have been curious how the world might look to them?</p>

    <p>This application can use your device's camera to apply a filter to the
    world around you, presenting you with an aproximation of color-blindness.</p>

    <p><em>Disclaimer:</em> Color, and vision for that matter, is subjective. I
    cannot promise this is exactly how the world looks under color-blindness.
    Nor should you take any interpretations from this as medical diagnosis.</p>
  </header>
}
