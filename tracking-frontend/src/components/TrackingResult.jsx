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
    <div className="result-card">

      {/* Header */}
      <div className="result-header">
        <div>
          <div className="result-tracking-label">Codigo de seguimiento</div>
          <div className="result-tracking-code">{shipment.tracking_code}</div>
        </div>
        <span className="status-badge" style={{ background: color }}>
          {STATUS_LABELS[shipment.status] || shipment.status}
        </span>
      </div>

      {/* Details */}
      <div className="details-section">
        <div className="section-title">Informacion del envio</div>
        <div className="details-grid">
          <div className="detail-item">
            <label>Remitente</label>
            <p>{shipment.sender_name || '—'}</p>
          </div>
          <div className="detail-item">
            <label>Destinatario</label>
            <p>{shipment.receiver_name || '—'}</p>
          </div>
          <div className="detail-item full">
            <label>Direccion de entrega</label>
            <p>{shipment.receiver_address || '—'}</p>
          </div>
          <div className="detail-item">
            <label>Descripcion</label>
            <p>{shipment.description || '—'}</p>
          </div>
          <div className="detail-item">
            <label>Peso</label>
            <p>{shipment.weight_kg ? `${shipment.weight_kg} kg` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="timeline-section">
        <div className="section-title">Historial de estados</div>
        <div className="timeline">
          {history.map((h) => {
            const dotColor = STATUS_COLORS[h.status] || '#9ca3af';
            return (
              <div className="timeline-item" key={h.id}>
                <div
                  className="timeline-dot"
                  style={{ background: dotColor, color: dotColor }}
                />
                <div className="timeline-row">
                  <span className="timeline-status">
                    {STATUS_LABELS[h.status] || h.status}
                  </span>
                  <span className="timeline-date">{formatDate(h.updated_at)}</span>
                </div>
                {h.notes && <p className="timeline-notes">{h.notes}</p>}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
