import React from 'react';
import ReactDOM from 'react-dom';
import MuMain from './components/MuMain';
import { BrowserRouter } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import './css/muoverride.css';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <MuMain />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('muroot')
);
