document.addEventListener('DOMContentLoaded', () => {
  // Referencias
  const tablaMesesBody = document.querySelector('#tabla-meses tbody');
  const mensajeSinMeses  = document.getElementById('mensaje-sin-meses');

  // 1) Array de meses finalizados
  let mesesFinalizados = JSON.parse(localStorage.getItem('mesesFinalizados') || '[]');

  // 2) Función para renderizar el historial de meses
  function renderMeses() {
    tablaMesesBody.innerHTML = '';
    if (mesesFinalizados.length === 0) {
      mensajeSinMeses.hidden = false;
    } else {
      mensajeSinMeses.hidden = true;
      mesesFinalizados.forEach(m => {
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

  // 3) Escuchar meses finalizados desde “Gastos”
  document.addEventListener('nuevoMesFinalizado', function (e) {
    mesesFinalizados.push(e.detail); // { mes, totalIngresos, totalGastos, saldoFinal }
    localStorage.setItem('mesesFinalizados', JSON.stringify(mesesFinalizados));
    renderMeses();
  });

  // 4) Formatear moneda (igual a otros scripts)
  function formatearMoneda(valor) {
    const m = localStorage.getItem('moneda') || 'ARS';
    let symbol, locale;
    switch (m) {
      case 'USD': symbol = 'US$'; locale = 'en-US'; break;
      case 'EUR': symbol = '€';   locale = 'de-DE'; break;
      default:    symbol = '$';   locale = 'es-AR';
    }
    return symbol + Number(valor).toLocaleString(locale, { minimumFractionDigits: 2 });
  }

  // 5) Primera ejecución
  renderMeses();

  // 6) Al cambiar moneda, volver a renderizar
  document.addEventListener('currencyChanged', () => {
    renderMeses();
  });
});
