import { useState } from 'react';
import { getTracking } from '../api/tracking';

const CODE_PATTERN = /^RDD-\d{4}-\d{5}$/i;

export default function TrackingForm({ onResult, onError }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!CODE_PATTERN.test(code)) {
      onError('Formato invalido. Usa: RDD-AAAA-NNNNN (ej: RDD-2026-00001)');
      return;
    }

    setLoading(true);
    try {
      const data = await getTracking(code);
      onResult(data);
    } catch (err) {
      onError(err.response?.status === 404
        ? 'Codigo de tracking no encontrado.'
        : 'Error al consultar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="text"
        placeholder="RDD-2026-00001"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
      />
      <button type="submit" disabled={loading || !code} style={{ padding: '0.5rem 1rem' }}>
        {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </form>
  );
}
