import { useState } from 'react';
import TrackingForm from './components/TrackingForm';
import TrackingResult from './components/TrackingResult';
import './App.css';

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <span className="header-icon">📦</span>
        <div className="header-brand">
          <span className="header-title">Red de Deliveries</span>
          <span className="header-subtitle">Sistema de Envios</span>
        </div>
      </header>

      <div className="hero">
        <h1 className="hero-title">Seguimiento de Envios</h1>
        <p className="hero-subtitle">Ingresa tu codigo de seguimiento para rastrear tu paquete</p>
      </div>

      <main className="main">
        <TrackingForm
          onResult={(data) => { setResult(data); setError(null); }}
          onError={(msg) => { setError(msg); setResult(null); }}
        />
        {error && <div className="error-msg">{error}</div>}
        {result && <TrackingResult data={result} />}
      </main>

      <footer className="footer">
        © 2026 Red de Deliveries — Todos los derechos reservados
      </footer>
    </div>
  );
}

export default App;
