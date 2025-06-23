document.addEventListener('DOMContentLoaded', function () {
  // Referencias a elementos de “Meses”
  const contenedorTabla = document.getElementById('contenedor-meses-tabla');
  const tablaMesesBody = document.querySelector('#tabla-meses tbody');
  const mensajeSinMeses = document.getElementById('mensaje-sin-meses');

  // Array que almacenará los meses finalizados
  // Cada objeto tendrá: { mes: 'Junio 2025', totalIngresos: 50000, totalGastos: 32000, saldoFinal: 18000 }
  let mesesFinalizados = [];

  // Función para formatear moneda (igual que en gastos)
  function formatearMoneda(valor) {
  // Leemos la moneda actual
  const m = localStorage.getItem('moneda') || 'ARS';
  let symbol, locale;
  switch (m) {
    case 'USD':
      symbol = 'US$';
      locale = 'en-US';
      break;
    case 'EUR':
      symbol = '€';
      locale = 'de-DE';
      break;
    default:
      symbol = '$';
      locale = 'es-AR';
  }
  return symbol + valor.toLocaleString(locale, { minimumFractionDigits: 2 });
}


  // 1) Función para renderizar el historial de meses
  function renderizarMeses() {
    // Si no hay meses, mostramos el mensaje y ocultamos la tabla
    if (mesesFinalizados.length === 0) {
      mensajeSinMeses.hidden = false;
      contenedorTabla.hidden = true;
      return;
    }


    // Si hay meses, ocultamos el mensaje y mostramos la tabla
    mensajeSinMeses.hidden = true;
    contenedorTabla.hidden = false;
    // Limpiamos el cuerpo de la tabla
    tablaMesesBody.innerHTML = '';
    // Agregamos una fila por cada mes
    mesesFinalizados.forEach((m) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${m.mes}</td>
        <td>${formatearMoneda(m.totalIngresos)}</td>
        <td>${formatearMoneda(m.totalGastos)}</td>
        <td>${formatearMoneda(m.saldoFinal)}</td>
      `;
      tablaMesesBody.appendChild(tr);
    });

  }

  // 2) Intentar cargar meses previos de localStorage (si existen)
  const datosGuardados = localStorage.getItem('mesesFinalizados');
  if (datosGuardados) {
    try {
      mesesFinalizados = JSON.parse(datosGuardados);
    } catch (e) {
      mesesFinalizados = [];
    }
  }

  // Renderizar inicialmente
  renderizarMeses();
   
  // 3) “Escuchar” un evento custom que envíe un nuevo mes desde “Gastos”
  //    Este evento debe dispararse cuando el usuario haga clic en “Finalizar Mes” 
  //    y enviará un objeto con la información del mes actual.
  document.addEventListener('nuevoMesFinalizado', function (e) {
    const mesNuevo = e.detail; // { mes, totalIngresos, totalGastos, saldoFinal }
    mesesFinalizados.push(mesNuevo);
    // Guardar en localStorage
    localStorage.setItem('mesesFinalizados', JSON.stringify(mesesFinalizados));
    // Re-renderizar
    renderizarMeses();
  });
});
    
