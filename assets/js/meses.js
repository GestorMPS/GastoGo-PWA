document.addEventListener('DOMContentLoaded', () => {
  // Referencias al DOM
  const tablaMesesBody = document.querySelector('#tabla-meses tbody');
  const mensajeSinMeses  = document.getElementById('mensaje-sin-meses');

  // 1) Cargamos el array de meses finalizados
  let mesesFinalizados = JSON.parse(
    localStorage.getItem('mesesFinalizados') || '[]'
  );

  // 2) Función que dibuja los meses en la tabla
  function renderizarMeses() {
    tablaMesesBody.innerHTML = '';
    if (mesesFinalizados.length === 0) {
      mensajeSinMeses.hidden = false;
    } else {
      mensajeSinMeses.hidden = true;
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
  }

  // 3) Listener para cuando se finaliza un mes en Gastos
  document.addEventListener('nuevoMesFinalizado', (e) => {
    mesesFinalizados.push(e.detail); // e.detail = { mes, totalIngresos, totalGastos, saldoFinal }
    localStorage.setItem('mesesFinalizados', JSON.stringify(mesesFinalizados));
    renderizarMeses();
  });

  // 4) Formatear moneda dinámico
  function formatearMoneda(valor) {
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
    return symbol + Number(valor).toLocaleString(locale, { minimumFractionDigits: 2 });
  }

  // 5) Inicialmente dibujamos
  renderizarMeses();

  // 6) Cuando cambie la moneda, re-renderizamos
  document.addEventListener('currencyChanged', () => {
    renderizarMeses();
  });
});
