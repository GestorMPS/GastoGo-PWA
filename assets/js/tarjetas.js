document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar tarjetas desde localStorage al inicio
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];

  // 2. Referencias al DOM
  const inputEntidad    = document.getElementById('input-entidad-tarjeta');
  const inputAlias      = document.getElementById('input-alias-tarjeta');
  const inputCierre     = document.getElementById('input-dia-cierre');
  const btnGuardarTarj  = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas      = document.getElementById('ul-tarjetas');
  const selectTarjG = document.getElementById('select-tarjeta-gasto');
  const inputFecha  = document.getElementById('input-fecha-compra');
  const inputDet    = document.getElementById('input-detalle-gasto');
  const inputMonto  = document.getElementById('input-monto-gasto-tarjeta');
  const inputCuo    = document.getElementById('input-cuotas-gasto');
  const btnGuardarGasto = document.getElementById('btn-guardar-gasto-tarjeta');
  const tbodyGastos = document.querySelector('#tabla-gastos-tarjeta tbody');
  const labelTotalCiclo = document.getElementById('label-total-ciclo');
  const labelTotalProx = document.getElementById('label-total-prox-ciclo');

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


  // 3. Validar inputs para habilitar botón
  function toggleBtnGuardarTarj() {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);
    btnGuardarTarj.disabled = !entidad || !alias || isNaN(cierre) || cierre < 1 || cierre > 28;
  }
  function toggleBtnGuardarGastoTarjeta() {
    const tarjetaId = selectTarjG.value;
    const fecha = inputFecha.value;
    const detalle = inputDet.value.trim();
    const monto = parseFloat(inputMonto.value);
    const cuotas = parseInt(inputCuo.value);

    const habilitar =
    tarjetaId && fecha && detalle && monto > 0 && cuotas > 0;

  btnGuardarGasto.disabled = !habilitar;
}

  // 4. Renderizar tarjetas en la lista
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    tarjetas.forEach((t) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${t.alias}</strong> - ${t.entidad} (cierra día ${t.diaCierre})
        <button class="btn-eliminar-tarjeta" data-id="${t.id}">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);
      renderComboTarjetas(); // <-- para que el combo se actualice también

    });
  }

// Renderizar opciones del combo select-tarjeta-gasto
  function renderComboTarjetas() {
    const select = document.getElementById('select-tarjeta-gasto');
    if (!select) return; // En caso de que aún no esté disponible en el DOM
    
    function toggleBtnGuardarGastoTarjeta() {
    const tarjetaId = selectTarjG.value;
    const fecha = inputFecha.value.trim();
    const detalle = inputDet.value.trim();
    const monto = parseFloat(inputMonto.value);
    const cuotas = parseInt(inputCuo.value);

    btnGuardarGasto.disabled = (
     !tarjetaId || !fecha || !detalle || isNaN(monto) || monto <= 0 || isNaN(cuotas) || cuotas <= 0
  );
}

  function renderizarGastosTarjeta() {
  if (!tbodyGastos || !labelTotalCiclo || !labelTotalProx) return;

  tbodyGastos.innerHTML = '';
  const total = { Actual: 0, Próximo: 0 };

  gastos.forEach(g => {
    const tarjeta = tarjetas.find(t => t.id === g.tarjetaId);
    if (!tarjeta) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${g.fechaCompra}</td>
      <td>${g.detalle}</td>
      <td>${tarjeta.alias}</td>
      <td>${g.cuotasPendientes}</td>
      <td>${formatearMoneda(g.montoCuota)}</td>
      <td>${g.cicloAsignado}</td>
    `;
    tbodyGastos.appendChild(tr);

    total[g.cicloAsignado] += g.montoCuota;
  });

  labelTotalCiclo.textContent = formatearMoneda(total.Actual);
  labelTotalProx.textContent = formatearMoneda(total.Próximo);
}

  inputEntidad.addEventListener('input', toggleBtnGuardarTarj);
  inputAlias.addEventListener('input', toggleBtnGuardarTarj);
  inputCierre.addEventListener('input', toggleBtnGuardarTarj);
  selectTarjG.addEventListener('change', toggleBtnGuardarGastoTarjeta);
  inputFecha.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputDet.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputMonto.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputCuo.addEventListener('input', toggleBtnGuardarGastoTarjeta);

  
  select.innerHTML = '<option value="">-- Seleccionar tarjeta --</option>';
  tarjetas.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.alias} (${t.entidad})`;
    select.appendChild(opt);
  });
}

  
  // 5. Guardar tarjeta con confirmación
  btnGuardarTarj.addEventListener('click', () => {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);

    const msg = `¿Deseás guardar la tarjeta "${alias}" de ${entidad} con cierre el día ${cierre}?`;
    if (!confirm(msg)) {
      toggleBtnGuardarTarj();
      return;
    }

    const nuevaTarjeta = {
      id: Date.now(),
      entidad,
      alias,
      diaCierre: cierre
    };

    tarjetas.push(nuevaTarjeta);
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    renderTarjetas(); // <- ESTA LÍNEA ES FUNDAMENTAL

    // Limpiar formulario
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    toggleBtnGuardarTarj();

    alert('Tarjeta guardada correctamente.');
  });

btnGuardarGasto.addEventListener('click', () => {
  const tarjetaId = +selectTarjG.value;
  const fechaCompra = inputFecha.value;
  const detalle = inputDet.value.trim();
  const montoTotal = +inputMonto.value;
  const cuotasPendientes = +inputCuo.value;

  // Validaciones finales de seguridad
  if (!tarjetaId || !fechaCompra || !detalle || montoTotal <= 0 || cuotasPendientes <= 0) return;

  const tarjeta = tarjetas.find(t => t.id === tarjetaId);
  const montoCuota = montoTotal / cuotasPendientes;

  const confirmar = confirm(
    `¿Registrar gasto de ${formatearMoneda(montoTotal)} en ${cuotasPendientes} cuotas ` +
    `(${formatearMoneda(montoCuota)} cada una) en tarjeta "${tarjeta.alias}"?`
  );
  if (!confirmar) return;

  const pv = calcularPrimerVencimiento(fechaCompra, tarjeta.diaCierre);
  const { inicio, fin } = calcularCiclos(tarjeta.diaCierre);
  const ciclo = (pv >= inicio && pv <= fin) ? 'Actual' : 'Próximo';

  const gasto = {
    id: Date.now(),
    tarjetaId,
    fechaCompra,
    detalle,
    cuotasPendientes,
    montoCuota,
    primerVencimiento: pv.toISOString(),
    cicloAsignado: ciclo
  };

  gastos.push(gasto);
  localStorage.setItem('gastos', JSON.stringify(gastos));
  renderizarGastosTarjeta();

  // Limpiar formulario
  selectTarjG.value = '';
  inputFecha.value = '';
  inputDet.value = '';
  inputMonto.value = '';
  inputCuo.value = '';
  btnGuardarGasto.disabled = true;
  toggleBtnGuardarGastoTarjeta();
});

  
  // 6. Eliminar tarjeta con confirmación
  ulTarjetas.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const id = parseInt(e.target.dataset.id);
      const tarjeta = tarjetas.find(t => t.id === id);
      if (!confirm(`¿Eliminar la tarjeta "${tarjeta.alias}"?`)) return;

      tarjetas = tarjetas.filter(t => t.id !== id);
      localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
      renderTarjetas();
    }
  });

  // 7. Render inicial al cargar
  renderTarjetas();

});
