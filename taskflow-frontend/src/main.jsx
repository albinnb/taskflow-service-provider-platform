import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css'; // Your main tailwind styles
import 'react-toastify/dist/ReactToastify.css'; // <-- ADD THIS LINE HERE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
