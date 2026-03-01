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
    <div className="form-card">
      <label className="form-label">Codigo de seguimiento</label>
      <form onSubmit={handleSubmit} className="form-row">
        <input
          type="text"
          className="form-input"
          placeholder="RDD-2026-00001"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <button type="submit" className="form-btn" disabled={loading || !code}>
          {loading ? 'Buscando...' : 'Rastrear'}
        </button>
      </form>
    </div>
  );
}
