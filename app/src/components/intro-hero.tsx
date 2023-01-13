import NoBr from './nobr'

export interface IntroHeroProps {
  onStart: Function;
};

import './intro-hero.scss';
export default function IntroHero({
  onStart,
}:IntroHeroProps) {
  return <section id='intro-hero'>
    <h1>Chromaview</h1>

    <h2>See the world through the eyes of the <NoBr>color-blind</NoBr></h2>
    
    <button type='button' onClick={() => onStart()}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
        <path d="M24 31.5q3.5 0 6-2.5 2.5-2.4 2.5-6 0-3.5-2.5-6-2.4-2.5-6-2.5-3.5 0-6 2.5-2.5 2.4-2.5 6 0 3.5 2.5 6 2.4 2.5 6 2.5Zm0-2.9q-2.4 0-4-1.6t-1.6-4q0-2.4 1.6-4t4-1.6q2.4 0 4 1.6t1.6 4q0 2.4-1.6 4t-4 1.6Zm0 9.4q-7.3 0-13.2-4.2Q4.9 29.8 2 23q2.9-6.7 8.8-10.8Q16.7 8 24 8q7.3 0 13.2 4.2Q43.1 16.3 46 23q-2.9 6.7-8.8 10.8Q31.3 38 24 38Zm0-15Zm0 12q6 0 11.1-3.3T43 23q-2.7-5.5-7.8-8.7Q30.1 11 24 11t-11.1 3.3Q7.8 17.6 5 23q2.7 5.5 7.8 8.7Q17.9 35 24 35Z"/>
      </svg>
      <NoBr>Start Seeing</NoBr>
    </button>
  </section>
}
