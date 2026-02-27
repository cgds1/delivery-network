const api = require('../../common/src/api-client');
const { header, pause, menu, table, statusColor, formatDate } = require('../../common/src/ui');
const readlineSync = require('readline-sync');

async function login() {
  header('DESPACHO - Red de Deliveries');
  console.log('Ingrese sus credenciales:\n');
  const uid = readlineSync.question('Usuario: ');
  const password = readlineSync.question('Contrasena: ', { hideEchoBack: true });
  const user = await api.login(uid, password);
  console.log(`\nBienvenido, ${user.name || uid}`);
  await new Promise(r => setTimeout(r, 1000));
  return user;
}

async function verEnviosPendientes() {
  header('DESPACHO - Envios Pendientes');
  try {
    const shipments = await api.getShipments();
    const pending = shipments.filter(s =>
      s.status === 'recibido' || s.status === 'en_despacho'
    );
    if (pending.length === 0) {
      console.log('No hay envios pendientes.');
    } else {
      table(
        ['Codigo', 'Remitente', 'Destinatario', 'Estado', 'Fecha'],
        pending.map(s => [
          s.tracking_code,
          s.sender_name,
          s.receiver_name,
          statusColor(s.status),
          formatDate(s.created_at),
        ])
      );
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function actualizarEstado() {
  header('DESPACHO - Actualizar Estado');
  const trackingCode = readlineSync.question('Codigo de tracking: ');
  console.log('\nEstados disponibles:');
  const statuses = ['en_despacho', 'en_camino', 'entregado', 'devuelto'];
  statuses.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  const idx = readlineSync.questionInt('\nSelecciona nuevo estado (numero): ') - 1;
  if (idx < 0 || idx >= statuses.length) {
    console.log('Opcion invalida.');
    pause();
    return;
  }
  const newStatus = statuses[idx];
  const notes = readlineSync.question('Notas (opcional): ');
  try {
    // Get shipment by tracking code first
    const shipments = await api.getShipments();
    const shipment = shipments.find(s => s.tracking_code === trackingCode);
    if (!shipment) throw new Error('Envio no encontrado');
    await api.updateStatus(shipment.id, newStatus, notes || null);
    console.log(`\nEstado actualizado a ${statusColor(newStatus)}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function verHistorial() {
  header('DESPACHO - Historial de Envio');
  const trackingCode = readlineSync.question('Codigo de tracking: ');
  try {
    const shipments = await api.getShipments();
    const shipment = shipments.find(s => s.tracking_code === trackingCode);
    if (!shipment) throw new Error('Envio no encontrado');
    const detail = await api.getShipment(shipment.id);
    console.log(`\nEnvio: ${detail.shipment.tracking_code}`);
    console.log(`Remitente: ${detail.shipment.sender_name}`);
    console.log(`Destinatario: ${detail.shipment.receiver_name}`);
    console.log(`Descripcion: ${detail.shipment.description}`);
    console.log(`\nHistorial:`);
    if (detail.history && detail.history.length > 0) {
      table(
        ['Estado', 'Fecha', 'Notas'],
        detail.history.map(h => [
          statusColor(h.status),
          formatDate(h.updated_at),
          h.notes || '-',
        ])
      );
    } else {
      console.log('  Sin historial.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function main() {
  let user = null;
  while (!user) {
    try {
      user = await login();
    } catch (e) {
      console.error(`\nError de autenticacion: ${e.message}`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  let running = true;
  while (running) {
    header('DESPACHO - Red de Deliveries');
    const choice = menu([
      'Ver envios pendientes',
      'Actualizar estado de envio',
      'Ver historial de un envio',
    ]);
    switch (choice) {
      case 1: await verEnviosPendientes(); break;
      case 2: await actualizarEstado(); break;
      case 3: await verHistorial(); break;
      case 0: running = false; break;
      default: console.log('Opcion invalida.');
    }
  }
  console.log('Hasta luego!');
  process.exit(0);
}

main().catch(e => { console.error('Error fatal:', e.message); process.exit(1); });

