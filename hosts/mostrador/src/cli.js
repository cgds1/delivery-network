const api = require(''../../common/src/api-client'');
const { header, pause, menu, table, statusColor, formatDate } = require(''../../common/src/ui'');
const readlineSync = require(''readline-sync'');

async function login() {
  header(''MOSTRADOR - Red de Deliveries'');
  console.log(''Ingrese sus credenciales:\n'');
  const uid = readlineSync.question(''Usuario: '');
  const password = readlineSync.question(''Contrasena: '', { hideEchoBack: true });
  const user = await api.login(uid, password);
  console.log(`\nBienvenido, ${user.name || uid}`);
  await new Promise(r => setTimeout(r, 1000));
  return user;
}

async function registrarEnvio() {
  header(''MOSTRADOR - Registrar Nuevo Envio'');
  console.log(''Complete los datos del envio:\n'');
  const sender_name = readlineSync.question(''Nombre remitente: '');
  const sender_address = readlineSync.question(''Direccion remitente: '');
  const receiver_name = readlineSync.question(''Nombre destinatario: '');
  const receiver_address = readlineSync.question(''Direccion destinatario: '');
  const receiver_phone = readlineSync.question(''Telefono destinatario: '');
  const description = readlineSync.question(''Descripcion del paquete: '');
  const weight = readlineSync.questionFloat(''Peso (kg): '');

  try {
    const result = await api.createShipment({
      sender_name, sender_address,
      receiver_name, receiver_address, receiver_phone,
      description, weight,
    });
    console.log(`\nEnvio registrado exitosamente!`);
    console.log(`Codigo de tracking: ${result.tracking_code || result.shipment?.tracking_code}`);
  } catch (e) {
    console.error(''Error:'', e.message);
  }
  pause();
}

async function verEnviosDelDia() {
  header(''MOSTRADOR - Envios del Dia'');
  try {
    const shipments = await api.getShipments();
    const today = new Date().toDateString();
    const todayShipments = shipments.filter(s =>
      new Date(s.created_at).toDateString() === today
    );
    if (todayShipments.length === 0) {
      console.log(''No hay envios registrados hoy.'');
    } else {
      table(
        [''Codigo'', ''Remitente'', ''Destinatario'', ''Peso'', ''Estado''],
        todayShipments.map(s => [
          s.tracking_code,
          s.sender_name,
          s.receiver_name,
          `${s.weight} kg`,
          statusColor(s.status),
        ])
      );
    }
  } catch (e) {
    console.error(''Error:'', e.message);
  }
  pause();
}

async function buscarPorCodigo() {
  header(''MOSTRADOR - Buscar Envio'');
  const trackingCode = readlineSync.question(''Codigo de tracking: '');
  try {
    const shipments = await api.getShipments();
    const shipment = shipments.find(s => s.tracking_code === trackingCode);
    if (!shipment) throw new Error(''Envio no encontrado'');
    const detail = await api.getShipment(shipment.id);
    console.log(`\n--- Detalles del Envio ---`);
    console.log(`Codigo:       ${detail.tracking_code}`);
    console.log(`Remitente:    ${detail.sender_name}`);
    console.log(`Destinatario: ${detail.receiver_name}`);
    console.log(`Direccion:    ${detail.receiver_address}`);
    console.log(`Descripcion:  ${detail.description}`);
    console.log(`Peso:         ${detail.weight} kg`);
    console.log(`Estado:       ${statusColor(detail.status)}`);
    console.log(`Fecha:        ${formatDate(detail.created_at)}`);
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
    header(''MOSTRADOR - Red de Deliveries'');
    const choice = menu([
      ''Registrar nuevo envio'',
      ''Ver envios del dia'',
      ''Buscar envio por codigo'',
    ]);
    switch (choice) {
      case 1: await registrarEnvio(); break;
      case 2: await verEnviosDelDia(); break;
      case 3: await buscarPorCodigo(); break;
      case 0: running = false; break;
      default: console.log(''Opcion invalida.'');
    }
  }
  console.log(''Hasta luego!'');
  process.exit(0);
}

main().catch(e => { console.error(''Error fatal:'', e.message); process.exit(1); });

