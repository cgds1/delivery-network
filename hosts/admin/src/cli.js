const api = require('../../common/src/api-client');
const { header, pause, menu, table, statusColor, formatDate } = require('../../common/src/ui');
const chalk = require('chalk');
const readlineSync = require('readline-sync');

async function login() {
  header('ADMIN DASHBOARD - Red de Deliveries');
  console.log('Ingrese sus credenciales:\n');
  const uid = readlineSync.question('Usuario: ');
  const password = readlineSync.question('Contrasena: ', { hideEchoBack: true });
  const user = await api.login(uid, password);
  console.log(`\nBienvenido, ${user.cn || uid}`);
  await new Promise(r => setTimeout(r, 1000));
  return user;
}

async function verEstadisticas() {
  header('ADMIN - Estadisticas Generales');
  try {
    const stats = await api.getStats();
    console.log(chalk.bold('\n=== ENVIOS ==='));
    console.log(`  Total envios:      ${chalk.cyan(stats.total_shipments)}`);
    console.log(`  Recibidos:         ${chalk.blue(stats.by_status?.recibido || 0)}`);
    console.log(`  En despacho:       ${chalk.yellow(stats.by_status?.en_despacho || 0)}`);
    console.log(`  En camino:         ${chalk.magenta(stats.by_status?.en_camino || 0)}`);
    console.log(`  Entregados:        ${chalk.green(stats.by_status?.entregado || 0)}`);
    console.log(`  Devueltos:         ${chalk.red(stats.by_status?.devuelto || 0)}`);
    console.log(chalk.bold('\n=== RECLAMOS ==='));
    console.log(`  Quejas abiertas:   ${chalk.red(stats.open_complaints || 0)}`);
    console.log(`  Quejas totales:    ${chalk.cyan(stats.total_complaints || 0)}`);
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function verTodosLosEnvios() {
  header('ADMIN - Todos los Envios');
  try {
    const shipments = await api.getAllShipments();
    if (shipments.length === 0) {
      console.log('No hay envios registrados.');
    } else {
      // Paginate: show 20 at a time
      const PAGE_SIZE = 20;
      let page = 0;
      let viewing = true;
      while (viewing) {
        const slice = shipments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        console.log(chalk.gray(`\nMostrando ${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, shipments.length)} de ${shipments.length}\n`));
        table(
          ['Codigo', 'Remitente', 'Destinatario', 'Estado', 'Fecha'],
          slice.map(s => [
            s.tracking_code,
            s.sender_name,
            s.receiver_name,
            statusColor(s.status),
            formatDate(s.created_at),
          ])
        );
        const hasNext = (page + 1) * PAGE_SIZE < shipments.length;
        const hasPrev = page > 0;
        console.log('');
        if (hasNext) console.log('  n. Siguiente pagina');
        if (hasPrev) console.log('  p. Pagina anterior');
        console.log('  q. Volver al menu');
        const input = readlineSync.question('\nOpcion: ').toLowerCase();
        if (input === 'n' && hasNext) page++;
        else if (input === 'p' && hasPrev) page--;
        else if (input === 'q') viewing = false;
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
    pause();
  }
}

async function verPorEstado() {
  header('ADMIN - Envios por Estado');
  console.log('Estados disponibles: recibido, en_despacho, en_camino, entregado, devuelto\n');
  const status = readlineSync.question('Estado a filtrar: ').toLowerCase();
  try {
    const shipments = await api.getAllShipments();
    const filtered = shipments.filter(s => s.status === status);
    if (filtered.length === 0) {
      console.log(`No hay envios con estado "${status}".`);
    } else {
      table(
        ['Codigo', 'Remitente', 'Destinatario', 'Peso', 'Fecha'],
        filtered.map(s => [
          s.tracking_code,
          s.sender_name,
          s.receiver_name,
          `${s.weight_kg} kg`,
          formatDate(s.created_at),
        ])
      );
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function verQuejas() {
  header('ADMIN - Todas las Quejas/Reclamos');
  try {
    const complaints = await api.getComplaints();
    if (complaints.length === 0) {
      console.log('No hay quejas registradas.');
    } else {
      table(
        ['ID', 'Tracking', 'Cliente', 'Estado', 'Descripcion', 'Fecha'],
        complaints.map(c => [
          c.id,
          c.tracking_code,
          c.customer_name,
          c.status === 'abierta' ? chalk.red('ABIERTA') : chalk.green('CERRADA'),
          c.description.substring(0, 35) + (c.description.length > 35 ? '...' : ''),
          formatDate(c.created_at),
        ])
      );
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  pause();
}

async function verActividadEmpleados() {
  header('ADMIN - Actividad de Empleados');
  try {
    const activity = await api.getEmployeeActivity();
    if (!activity || activity.length === 0) {
      console.log('No hay actividad registrada.');
    } else {
      table(
        ['Usuario', 'Accion', 'Detalle', 'Fecha'],
        activity.map(a => [
          a.uid || a.user_id,
          a.action,
          (a.detail || '').substring(0, 40),
          formatDate(a.timestamp || a.created_at),
        ])
      );
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
    header('ADMIN DASHBOARD - Red de Deliveries');
    const choice = menu([
      'Estadisticas generales',
      'Ver todos los envios',
      'Ver envios por estado',
      'Ver quejas/reclamos',
      'Ver actividad de empleados',
    ]);
    switch (choice) {
      case 1: await verEstadisticas(); break;
      case 2: await verTodosLosEnvios(); break;
      case 3: await verPorEstado(); break;
      case 4: await verQuejas(); break;
      case 5: await verActividadEmpleados(); break;
      case 0: running = false; break;
      default: console.log('Opcion invalida.');
    }
  }
  console.log('Hasta luego!');
  process.exit(0);
}

main().catch(e => { console.error('Error fatal:', e.message); process.exit(1); });

