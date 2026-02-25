const readlineSync = require(''readline-sync'');
const Table = require(''cli-table3'');
const chalk = require(''chalk'');

function header(title) {
  console.clear();
  console.log(chalk.bold.cyan(`\n${''=''.repeat(50)}`));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan(`${''=''.repeat(50)}\n`));
}

function pause() {
  readlineSync.question(''\nPresiona ENTER para continuar...'');
}

function menu(options) {
  options.forEach((opt, i) => console.log(`  ${chalk.yellow(i + 1)}. ${opt}`));
  console.log(`  ${chalk.yellow(''0'')}. Salir\n`);
  return readlineSync.questionInt(''Selecciona una opcion: '');
}

function table(head, rows) {
  const t = new Table({ head: head.map((h) => chalk.bold(h)) });
  rows.forEach((r) => t.push(r));
  console.log(t.toString());
}

function statusColor(status) {
  const colors = {
    recibido: chalk.blue,
    en_despacho: chalk.yellow,
    en_camino: chalk.magenta,
    entregado: chalk.green,
    devuelto: chalk.red,
  };
  return (colors[status] || chalk.white)(status.toUpperCase());
}

function formatDate(dateStr) {
  if (!dateStr) return ''-'';
  return new Date(dateStr).toLocaleString(''es-AR'');
}

module.exports = { header, pause, menu, table, statusColor, formatDate };

