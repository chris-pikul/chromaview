import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'

import './index.scss'

const rootEl = document.getElementById('root') as HTMLElement;

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

document.body.addEventListener('mousemove', evt => {
  const { clientWidth, clientHeight } = document.documentElement;
  const widthPerc = (evt.clientX / clientWidth).toPrecision(4);
  const heightPerc = (evt.clientY / clientHeight).toPrecision(4);
  document.documentElement.style.setProperty('--mouse-x', widthPerc);
  document.documentElement.style.setProperty('--mouse-y', heightPerc);
});
