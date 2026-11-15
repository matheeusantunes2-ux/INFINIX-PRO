import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Demo from './Demo';
import Pdv from './Pdv';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{new URLSearchParams(window.location.search).get('demo') === '1' ? <Demo /> : new URLSearchParams(window.location.search).get('pdv') === '1' ? <Pdv /> : <App />}</React.StrictMode>,
);
