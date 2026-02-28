import { useState } from 'react';
import TrackingForm from './components/TrackingForm';
import TrackingResult from './components/TrackingResult';

function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Red de Deliveries</h1>
      <h2>Seguimiento de Envios</h2>
      <TrackingForm
        onResult={(data) => { setResult(data); setError(null); }}
        onError={(msg) => { setError(msg); setResult(null); }}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <TrackingResult data={result} />}
    </div>
  );
}

export default App;
