const api = require(''../../common/src/api-client'');
const { header, pause, menu, table, statusColor, formatDate } = require(''../../common/src/ui'');
const readlineSync = require(''readline-sync'');

async function login() {
  header(''ATENCION AL CLIENTE - Red de Deliveries'');
  console.log(''Ingrese sus credenciales:\n'');
  const uid = readlineSync.question(''Usuario: '');
  const password = readlineSync.question(''Contrasena: '', { hideEchoBack: true });
  const user = await api.login(uid, password);
  console.log(`\nBienvenido, ${user.name || uid}`);
  await new Promise(r => setTimeout(r, 1000));
  return user;
}

async function buscarPorCodigo() {
  header(''ATENCION AL CLIENTE - Buscar por Codigo'');
  const trackingCode = readlineSync.question(''Codigo de tracking: '');
  try {
    const shipments = await api.getShipments();
    const shipment = shipments.find(s => s.tracking_code === trackingCode);
    if (!shipment) throw new Error(''Envio no encontrado'');
    const detail = await api.getShipment(shipment.id);
    console.log(`\n--- Detalles ---`);
    console.log(`Codigo:       ${detail.tracking_code}`);
    console.log(`Remitente:    ${detail.sender_name}`);
    console.log(`Destinatario: ${detail.receiver_name}`);
    console.log(`Descripcion:  ${detail.description}`);
    console.log(`Estado:       ${statusColor(detail.status)}`);
    console.log(`\nHistorial:`);
    if (detail.history && detail.history.length > 0) {
      table(
        [''Estado'', ''Fecha'', ''Notas''],
        detail.history.map(h => [statusColor(h.status), formatDate(h.changed_at), h.notes || ''-''])
      );
    } else {
      console.log(''  Sin historial registrado.'');
    }
  } catch (e) {
    console.error(''Error:'', e.message);
  }
  pause();
}

async function buscarPorNombre() {
  header(''ATENCION AL CLIENTE - Buscar por Nombre'');
  const nombre = readlineSync.question(''Nombre del cliente: '');
  try {
    const results = await api.searchCustomer(nombre);
    if (!results || results.length === 0) {
      console.log(''No se encontraron envios para ese cliente.'');
    } else {
      table(
        [''Codigo'', ''Remitente'', ''Destinatario'', ''Estado'', ''Fecha''],
        results.map(s => [
          s.tracking_code,
          s.sender_name,
          s.receiver_name,
          statusColor(s.status),
          formatDate(s.created_at),
        ])
      );
    }
  } catch (e) {
    console.error(''Error:'', e.message);
  }
  pause();
}

async function registrarQueja() {
  header(''ATENCION AL CLIENTE - Registrar Queja/Reclamo'');
  const tracking_code = readlineSync.question(''Codigo de tracking: '');
  const customer_name = readlineSync.question(''Nombre del cliente: '');
  const description = readlineSync.question(''Descripcion del reclamo: '');
  try {
    await api.createComplaint({ tracking_code, customer_name, description });
    console.log(''\nQueja registrada exitosamente.'');
  } catch (e) {
    console.error(''Error:'', e.message);
  }
  pause();
}

async function verQuejasAbiertas() {
  header(''ATENCION AL CLIENTE - Quejas Abiertas'');
  try {
    const complaints = await api.getComplaints();
    const open = complaints.filter(c => c.status === ''abierta'');
    if (open.length === 0) {
      console.log(''No hay quejas abiertas.'');
    } else {
      table(
        [''ID'', ''Tracking'', ''Cliente'', ''Descripcion'', ''Fecha''],
        open.map(c => [
          c.id,
          c.tracking_code,
          c.customer_name,
          c.description.substring(0, 40) + (c.description.length > 40 ? ''...'' : ''''),
          formatDate(c.created_at),
        ])
      );
    }
  } catch (e) {
    console.error(''Error:'', e.message);
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
    header(''ATENCION AL CLIENTE - Red de Deliveries'');
    const choice = menu([
      ''Buscar por codigo de tracking'',
      ''Buscar por nombre de cliente'',
      ''Registrar queja/reclamo'',
      ''Ver quejas abiertas'',
    ]);
    switch (choice) {
      case 1: await buscarPorCodigo(); break;
      case 2: await buscarPorNombre(); break;
      case 3: await registrarQueja(); break;
      case 4: await verQuejasAbiertas(); break;
      case 0: running = false; break;
      default: console.log(''Opcion invalida.'');
    }
  }
  console.log(''Hasta luego!'');
  process.exit(0);
}

main().catch(e => { console.error(''Error fatal:'', e.message); process.exit(1); });

