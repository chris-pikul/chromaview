import Hero from './intro-hero';

export interface IntroProps {
  onDismiss: Function;
  transition: boolean;
}

import './intro.scss';
export default function Intro({
  onDismiss,
  transition,
}:IntroProps) {
  return <div id='intro' className={transition ? 'transition' : ''}>
    <div className='content-wrap'>
      <Hero onStart={() => onDismiss()} />

      <main id='intro-body'>
        <p>Ever wondered what the world looked like through someone else's eyes?
        Maybe you know someone with a color-blind condition, and you yourself having
        normal vision, have been curious how the world might look to them?</p>

        <p>This application can use your device's camera to apply a filter to the
        world around you, presenting you with an aproximation of color-blindness.</p>

        <footer id='footer'>
          <p><em>Disclaimer:</em> Color, and vision for that matter, is subjective. I
          cannot promise this is exactly how the world looks under color-blindness.
          Nor should you take any interpretations from this as medical diagnosis.</p>

          <p><em>Privacy Notice:</em> This application uses your device's camera.
          No data or images are sent to any servers outside of your browser.</p>

          <p>Background images provided by <a href='https://unsplash.com'><svg width="32" height="32" viewBox="0 0 32 32" version="1.1" aria-labelledby="unsplash-home" aria-hidden="false"><desc lang="en-US">Unsplash logo</desc><path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"></path></svg>Unsplash</a>,
          specifically thanks to: Alex Gorham, Federico Bottos, Jeremy Bishop, John Towner, and Jonathan Pie.</p>

          <p>The source code for this entire application is available as open source under <em>GNU General Public License Version 3</em> and can be found at
          this <a href='https://github.com/chris-pikul/chromaview'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 6c-3.313 0-6 2.686-6 6 0 2.651 1.719 4.9 4.104 5.693.3.056.396-.13.396-.289v-1.117c-1.669.363-2.017-.707-2.017-.707-.272-.693-.666-.878-.666-.878-.544-.373.041-.365.041-.365.603.042.92.619.92.619.535.917 1.403.652 1.746.499.054-.388.209-.652.381-.802-1.333-.152-2.733-.667-2.733-2.965 0-.655.234-1.19.618-1.61-.062-.153-.268-.764.058-1.59 0 0 .504-.161 1.65.615.479-.133.992-.199 1.502-.202.51.002 1.023.069 1.503.202 1.146-.776 1.648-.615 1.648-.615.327.826.121 1.437.06 1.588.385.42.617.955.617 1.61 0 2.305-1.404 2.812-2.74 2.96.216.186.412.551.412 1.111v1.646c0 .16.096.347.4.288 2.383-.793 4.1-3.041 4.1-5.691 0-3.314-2.687-6-6-6z"/></svg>GitHub Repository</a>.</p> 

          <span id='footer-copy'>© { (new Date()).getFullYear() } Chris Pikul. All Rights Reserved</span>
        </footer>
      </main>
    </div>
  </div>
}
