import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Demo from './Demo';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{new URLSearchParams(window.location.search).get('demo') === '1' ? <Demo /> : <App />}</React.StrictMode>,
);
