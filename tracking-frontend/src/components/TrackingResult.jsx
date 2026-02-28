const STATUS_LABELS = {
  recibido: 'Recibido',
  en_despacho: 'En Despacho',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  devuelto: 'Devuelto',
};

const STATUS_COLORS = {
  recibido: '#3b82f6',
  en_despacho: '#f59e0b',
  en_camino: '#8b5cf6',
  entregado: '#22c55e',
  devuelto: '#ef4444',
};

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TrackingResult({ data }) {
  const { shipment, history } = data;
  const color = STATUS_COLORS[shipment.status] || '#6b7280';

  return (
    <div>
      {/* Status Badge */}
      <div style={{ background: color, color: 'white', padding: '0.5rem 1rem',
                    borderRadius: 8, display: 'inline-block', marginBottom: '1rem' }}>
        {STATUS_LABELS[shipment.status] || shipment.status}
      </div>

      {/* Shipment Details */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <tbody>
          {[
            ['Codigo', shipment.tracking_code],
            ['Remitente', shipment.sender_name],
            ['Destinatario', shipment.receiver_name],
            ['Direccion', shipment.receiver_address],
            ['Descripcion', shipment.description],
            ['Peso', shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', color: '#374151' }}>{label}</td>
              <td style={{ padding: '4px 8px' }}>{value || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* History Timeline */}
      <h3>Historial de Estados</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {history.map((h) => (
          <li key={h.id} style={{ borderLeft: `3px solid ${STATUS_COLORS[h.status] || '#9ca3af'}`,
                                  paddingLeft: '1rem', marginBottom: '0.75rem' }}>
            <strong>{STATUS_LABELS[h.status] || h.status}</strong>
            <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
              {formatDate(h.updated_at)}
            </span>
            {h.notes && <p style={{ margin: '0.25rem 0 0', color: '#374151' }}>{h.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
