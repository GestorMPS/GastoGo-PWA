document.addEventListener('DOMContentLoaded', function () {
  // 1. Referencias a elementos de “Gastos” y pestañas
  const selectCategoria      = document.getElementById('select-categoria');
  const selectSubcategoria   = document.getElementById('select-subcategoria');
  const inputMontoGasto      = document.getElementById('input-monto-gasto');
  const btnGuardarGasto      = document.getElementById('btn-guardar-gasto');
  const displaySaldoRestante = document.getElementById('display-saldo-restante');
  const tablaGastosBody      = document.querySelector('#tabla-gastos tbody');
  const btnFinalizarMes      = document.getElementById('btn-finalizar-mes');
  const tabBotonGastos       = document.querySelector('[data-tab="gastos"]');

  const subcategoriasPorCategoria = {
    Alimentos: ['Supermercado', 'Restaurante', 'Café'],
    Transporte: ['Taxi', 'Subte/Colectivo', 'Combustible'],
    Salud: ['Farmacia', 'Médico', 'Hospital'],
    Entretenimiento: ['Cine', 'Streaming', 'Salidas']
  };

  let gastos = [];
  let nextGastoId = 0;

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

  function recargarSaldoDesdeLocalStorage() {
    const totalIngresos = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
    const totalGastosMemoria = gastos.reduce((acum, g) => acum + g.monto, 0);
    const saldo = totalIngresos - totalGastosMemoria;
    displaySaldoRestante.textContent = formatearMoneda(saldo);

    const bloquear = totalIngresos <= 0;
    selectCategoria.disabled    = bloquear;
    selectSubcategoria.disabled = bloquear;
    inputMontoGasto.disabled    = bloquear;
    btnGuardarGasto.disabled    = bloquear;
    btnFinalizarMes.disabled    = bloquear || gastos.length === 0;
  }

  function renderGastos() {
    tablaGastosBody.innerHTML = '';
    gastos.forEach(g => {
      const tr = document.createElement('tr');
      tr.dataset.id = g.id;
      tr.innerHTML = `
        <td>${g.categoria}</td>
        <td>${g.subcat}</td>
        <td>${formatearMoneda(g.monto)}</td>
        <td><button class="btn-eliminar-gasto">Eliminar</button></td>
      `;
      tablaGastosBody.appendChild(tr);
    });
  }

  document.addEventListener('currencyChanged', () => {
    recargarSaldoDesdeLocalStorage();
    renderGastos();
  });

  tabBotonGastos.addEventListener('click', recargarSaldoDesdeLocalStorage);

  recargarSaldoDesdeLocalStorage();
  renderGastos();

  function toggleBtnGuardarGasto() {
    const categoriaVal = selectCategoria.value;
    const subcatVal    = selectSubcategoria.value;
    const montoVal     = parseFloat(inputMontoGasto.value);
    const ingresosGuard = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
    btnGuardarGasto.disabled = !categoriaVal || !subcatVal || isNaN(montoVal) || montoVal <= 0 || ingresosGuard <= 0;
  }

  selectCategoria.addEventListener('change', function () {
    const cat = this.value;
    const opciones = subcategoriasPorCategoria[cat] || [];
    selectSubcategoria.innerHTML =
      '<option value="">-- Seleccionar --</option>' +
      opciones.map(s => `<option value="${s}">${s}</option>`).join('');
    selectSubcategoria.disabled = opciones.length === 0;
    toggleBtnGuardarGasto();
  });

  selectSubcategoria.addEventListener('change', toggleBtnGuardarGasto);
  inputMontoGasto.addEventListener('input', toggleBtnGuardarGasto);

  btnGuardarGasto.addEventListener('click', () => {
    const categoria = selectCategoria.value;
    const subcat    = selectSubcategoria.value;
    const monto     = parseFloat(inputMontoGasto.value);

    if (isNaN(monto) || monto <= 0) {
       alert("El monto debe ser mayor que 0.");
       return;
    }

    if (!confirm(`¿Registrar gasto de ${formatearMoneda(monto)} en ${categoria} → ${subcat}?`)) {
      return;
    }

    const gasto = { id: nextGastoId++, categoria, subcat, monto };
    gastos.push(gasto);
    renderGastos();
    recargarSaldoDesdeLocalStorage();
  });

  tablaGastosBody.addEventListener('click', function (e) {
    if (!e.target.classList.contains('btn-eliminar-gasto')) return;
    const tr = e.target.closest('tr');
    const idEliminar = parseInt(tr.dataset.id, 10);
    const g = gastos.find(x => x.id === idEliminar);

    if (!confirm(`¿Eliminar gasto de ${formatearMoneda(g.monto)} (${g.categoria} → ${g.subcat})?`)) {
      return;
    }

    gastos = gastos.filter(x => x.id !== idEliminar);
    renderGastos();
    recargarSaldoDesdeLocalStorage();
  });

  btnFinalizarMes.addEventListener('click', function () {
    const totalIngresos = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
    const totalGastos   = gastos.reduce((sum, g) => sum + g.monto, 0);
    const saldoFinal    = totalIngresos - totalGastos;
    const msg =
      `¿Finalizar mes?\nIngresos: ${formatearMoneda(totalIngresos)}\n` +
      `Gastos: ${formatearMoneda(totalGastos)}\nSaldo final: ${formatearMoneda(saldoFinal)}`;
    if (!confirm(msg)) {
      return;
    }

    const fechaHoy = new Date();
    const nombreMes = fechaHoy.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const detalleMes = { mes: nombreMes, totalIngresos, totalGastos, saldoFinal };
    document.dispatchEvent(new CustomEvent('nuevoMesFinalizado', { detail: detalleMes }));

    localStorage.removeItem('totalIngresosActual');
    gastos = [];
    renderGastos();
    recargarSaldoDesdeLocalStorage();
    alert('Mes finalizado correctamente.');
  });
});
