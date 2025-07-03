document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar tarjetas y gastos desde localStorage al inicio
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];
  let gastos = JSON.parse(localStorage.getItem('gastos')) || [];

  // 2. Referencias al DOM
  const inputEntidad = document.getElementById('input-entidad-tarjeta');
  const inputAlias = document.getElementById('input-alias-tarjeta');
  const inputCierre = document.getElementById('input-dia-cierre');
  const btnGuardarTarj = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas = document.getElementById('ul-tarjetas');
  const selectTarjG = document.getElementById('select-tarjeta-gasto');
  const inputFecha = document.getElementById('input-fecha-compra');
  const inputDet = document.getElementById('input-detalle-gasto');
  const inputMonto = document.getElementById('input-monto-gasto-tarjeta');
  const inputCuo = document.getElementById('input-cuotas-gasto');
  const btnGuardarGasto = document.getElementById('btn-guardar-gasto-tarjeta');
  const tbodyGastos = document.querySelector('#tabla-gastos-tarjeta tbody');
  const labelTotalCiclo = document.getElementById('label-total-ciclo');
  const labelTotalProx = document.getElementById('label-total-prox-ciclo');

  // 3. Helpers
  function formatearMoneda(valor) {
    return '$' + Number(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  function toggleBtnGuardarTarj() {
    const entidad = inputEntidad.value.trim();
    const alias = inputAlias.value.trim();
    const cierre = parseInt(inputCierre.value);
    btnGuardarTarj.disabled = !entidad || !alias || isNaN(cierre) || cierre < 1 || cierre > 28;
  }

  function toggleBtnGuardarGastoTarjeta() {
    const tarjetaId = selectTarjG.value;
    const fecha = inputFecha.value;
    const detalle = inputDet.value.trim();
    const monto = parseFloat(inputMonto.value);
    const cuotas = parseInt(inputCuo.value);
    btnGuardarGasto.disabled = !tarjetaId || !fecha || !detalle || monto <= 0 || cuotas <= 0;
  }

  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    tarjetas.forEach(t => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${t.entidad}</strong> – ${t.alias} (Cierra día ${t.diaCierre})
        <button data-id="${t.id}" class="btn-eliminar-tarjeta">🗑️</button>
      `;
      ulTarjetas.appendChild(li);
    });
   }

  function renderComboTarjetas() {
    selectTarjG.innerHTML = '<option value="">-- Seleccionar --</option>';
    tarjetas.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.alias;
      selectTarjG.appendChild(opt);
    });
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

  // 4. Listeners
  inputEntidad.addEventListener('input', toggleBtnGuardarTarj);
  inputAlias.addEventListener('input', toggleBtnGuardarTarj);
  inputCierre.addEventListener('input', toggleBtnGuardarTarj);
  selectTarjG.addEventListener('change', toggleBtnGuardarGastoTarjeta);
  inputFecha.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputDet.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputMonto.addEventListener('input', toggleBtnGuardarGastoTarjeta);
  inputCuo.addEventListener('input', toggleBtnGuardarGastoTarjeta);

  btnGuardarTarj.addEventListener('click', () => {
    const entidad = inputEntidad.value.trim();
    const alias = inputAlias.value.trim();
    const cierre = parseInt(inputCierre.value);
    if (!confirm(`¿Guardar tarjeta "${alias}" con cierre el día ${cierre}?`)) return;
    const nueva = {
      id: Date.now(),
      entidad,
      alias,
      diaCierre: cierre
    };
    tarjetas.push(nueva);
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    renderTarjetas();
    renderComboTarjetas();
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    toggleBtnGuardarTarj();
  });
  
  ulTarjetas.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const id = Number(e.target.dataset.id);
      const tarjeta = tarjetas.find(t => t.id === id);
      const confirmar = confirm(`¿Eliminar la tarjeta "${tarjeta.alias}"?`);
      if (!confirmar) return;
      tarjetas = tarjetas.filter(t => t.id !== id);
      localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
      renderTarjetas();
      renderComboTarjetas();
     }
   });

  btnGuardarGasto.addEventListener('click', () => {
    const tarjetaId = +selectTarjG.value;
    const fechaCompra = inputFecha.value;
    const detalle = inputDet.value.trim();
    const montoTotal = +inputMonto.value;
    const cuotasPendientes = +inputCuo.value;
    if (!tarjetaId || !fechaCompra || !detalle || montoTotal <= 0 || cuotasPendientes <= 0) return;
    const tarjeta = tarjetas.find(t => t.id === tarjetaId);
    const montoCuota = montoTotal / cuotasPendientes;
    if (!confirm(`¿Registrar gasto de ${formatearMoneda(montoTotal)} en ${cuotasPendientes} cuotas (${formatearMoneda(montoCuota)} cada una) en tarjeta "${tarjeta.alias}"?`)) return;
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
    selectTarjG.value = '';
    inputFecha.value = '';
    inputDet.value = '';
    inputMonto.value = '';
    inputCuo.value = '';
    btnGuardarGasto.disabled = true;
  });

  // 5. Inicialización
  renderTarjetas();
  renderComboTarjetas();
  renderizarGastosTarjeta();
});
