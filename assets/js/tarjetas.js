document.addEventListener('DOMContentLoaded', () => {
  // Referencias al DOM
  const inputEntidad     = document.getElementById('input-entidad-tarjeta');
  const inputAlias       = document.getElementById('input-alias-tarjeta');
  const inputCierre      = document.getElementById('input-dia-cierre');
  const btnGuardarTarj   = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas       = document.getElementById('ul-tarjetas');

  const selectTarjG      = document.getElementById('select-tarjeta-gasto');
  const inputFecha       = document.getElementById('input-fecha-compra');
  const inputMonto       = document.getElementById('input-monto-gasto-tarjeta');
  const inputDet         = document.getElementById('input-detalle-gasto');
  const inputCuo         = document.getElementById('input-cuotas-gasto');
  const btnGuardarGasto  = document.getElementById('btn-guardar-gasto-tarjeta');
  const tbodyGastos      = document.querySelector('#tabla-gastos-tarjeta tbody');

  const labelTotalCiclo  = document.getElementById('label-total-ciclo');
  const labelTotalProx   = document.getElementById('label-total-prox-ciclo');

  function toggleBtnGuardarTarj() {
  const alias = inputAlias.value.trim();
  const cierre = parseInt(inputCierre.value);
  btnGuardarTarj.disabled = !alias || !numero || isNaN(cierre) || cierre < 1 || cierre > 31;
}
  
  inputAlias.addEventListener('input', toggleBtnGuardarTarj);
  inputNumero.addEventListener('input', toggleBtnGuardarTarj);
  inputCierre.addEventListener('input', toggleBtnGuardarTarj);

  toggleBtnGuardarTarj();
  
  // Datos
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];
  let gastos    = JSON.parse(localStorage.getItem('gastos'))    || [];

  // Helper moneda
  function formatearMoneda(v) {
    const m = localStorage.getItem('moneda') || 'ARS';
    let symbol, locale;
    switch (m) {
      case 'USD': symbol = 'US$'; locale = 'en-US'; break;
      case 'EUR': symbol = '€';   locale = 'de-DE'; break;
      default:    symbol = '$';   locale = 'es-AR';
    }
    return symbol + Number(v).toLocaleString(locale, { minimumFractionDigits: 2 });
  }

  // Cálculo de ciclos
  function calcularCiclos(diaCierre) {
    const hoy = new Date();
    let cierreAct = new Date(hoy.getFullYear(), hoy.getMonth(), diaCierre);
    if (hoy.getDate() > diaCierre) cierreAct.setMonth(cierreAct.getMonth() + 1);
    let cierreAnt = new Date(cierreAct);
    cierreAnt.setMonth(cierreAnt.getMonth() - 1);
    const inicio = new Date(cierreAnt); inicio.setDate(inicio.getDate() + 1);
    const fin    = new Date(cierreAct);
    return { inicio, fin };
  }

  // Calcula primer vencimiento
  function calcularPrimerVencimiento(fechaCompraISO, diaCierre) {
    const compra = new Date(fechaCompraISO);
    let mesVto = (compra.getDate() <= diaCierre) ? compra.getMonth() + 1 : compra.getMonth() + 2;
    let añoVto = compra.getFullYear();
    if (mesVto > 11) { mesVto -= 12; añoVto += 1; }
    return new Date(añoVto, mesVto, diaCierre);
  }

  // Renderizar tarjetas y populates select
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    selectTarjG.innerHTML = '<option value=\"\">-- Seleccionar Tarjeta --</option>';

    tarjetas.forEach(t => {
      const { inicio, fin } = calcularCiclos(t.diaCierre);
      const resCiclo = gastos
        .filter(g => g.tarjetaId === t.id && g.cicloAsignado === 'Actual')
        .reduce((s, g) => s + g.montoCuota, 0);
      const resProx = gastos
        .filter(g => g.tarjetaId === t.id && g.cicloAsignado === 'Próximo')
        .reduce((s, g) => s + g.montoCuota, 0);

      const li = document.createElement('li');
      li.dataset.id = t.id;
      li.innerHTML = `
        <span>${t.entidad} (${t.alias}) — Cierre: ${t.diaCierre}</span>
        <span>Ciclo: ${formatearMoneda(resCiclo)}</span>
        <span>Próx: ${formatearMoneda(resProx)}</span>
        <button class="btn-tarjeta-pagada">Pagada</button>
        <button class="btn-eliminar-tarjeta">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);

      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.entidad} (${t.alias})`;
      selectTarjG.appendChild(opt);
    });
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    actualizarResumenGeneral();
  }

  // Renderizar gastos de tarjeta
  function renderGastos() {
    tbodyGastos.innerHTML = '';
    gastos.forEach(g => {
      const tr = document.createElement('tr');
      tr.dataset.id = g.id;
      tr.innerHTML = `
        <td>${g.fechaCompra}</td>
        <td>${g.detalle}</td>
        <td>${g.cuotasPendientes}</td>
        <td>${formatearMoneda(g.montoCuota)}</td>
        <td>${new Date(g.primerVencimiento).toLocaleDateString('es-AR')}</td>
        <td>${g.cicloAsignado}</td>
        <td><button class="btn-eliminar-gasto-tarjeta">Eliminar</button></td>
      `;
      tbodyGastos.appendChild(tr);
    });
    localStorage.setItem('gastos', JSON.stringify(gastos));
    actualizarResumenGeneral();
  }

  // Actualizar totales generales
  function actualizarResumenGeneral() {
    const totalC = gastos
      .filter(g => g.cicloAsignado === 'Actual')
      .reduce((s, g) => s + g.montoCuota, 0);
    const totalP = gastos
      .filter(g => g.cicloAsignado === 'Próximo')
      .reduce((s, g) => s + g.montoCuota, 0);
    labelTotalCiclo.textContent = `Total Ciclo Actual: ${formatearMoneda(totalC)}`;
    labelTotalProx.textContent   = `Total Próximo Ciclo: ${formatearMoneda(totalP)}`;
  }

  // Confirmar + Guardar nueva tarjeta
  btnGuardarTarj.addEventListener('click', () => {
    const ent   = inputEntidad.value.trim();
    const alias = inputAlias.value.trim();
    const dia   = +inputCierre.value;
    if (!confirm(`¿Crear tarjeta "${alias} (${ent})" con cierre día ${dia}?`)) return;
    tarjetas.push({ id: Date.now(), entidad: ent, alias, diaCierre: dia });
    inputEntidad.value = '';
    inputAlias.value   = '';
    inputCierre.value  = '';
    renderTarjetas();
  });

  // Escuchar acciones en la lista de tarjetas
  ulTarjetas.addEventListener('click', e => {
    const li = e.target.closest('li');
    const id = +li.dataset.id;
    if (e.target.classList.contains('btn-tarjeta-pagada')) {
      // Confirmar pago y decrementar cuotas
      if (!confirm('¿Marcar tarjeta como pagada y decrementar cuotas pendientes?')) return;
      gastos = gastos.map(g => {
        if (g.tarjetaId === id) {
          if (g.cuotasPendientes > 1) return { ...g, cuotasPendientes: g.cuotasPendientes - 1 };
          else return null;
        }
        return g;
      }).filter(Boolean);
      renderGastos();
      renderTarjetas();
    }
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const t = tarjetas.find(x => x.id === id);
      if (!confirm(`¿Eliminar tarjeta "${t.entidad} (${t.alias})"? Se borrarán sus gastos.`)) return;
      tarjetas = tarjetas.filter(t => t.id !== id);
      gastos    = gastos.filter(g => g.tarjetaId !== id);
      renderTarjetas();
      renderGastos();
    }
  });

  // Confirmar + Guardar Gasto en Tarjeta
  btnGuardarGasto.addEventListener('click', () => {
    const tarjetaId        = +selectTarjG.value;
    const fechaCompra      = inputFecha.value;
    const detalle          = inputDet.value.trim();
    const cuotasPendientes = +inputCuo.value;
    const montoTotal       = +inputMonto.value;
    const montoCuota       = montoTotal / cuotasPendientes;
    const tarjeta          = tarjetas.find(t => t.id === tarjetaId);

    if (!confirm(
      `¿Registrar gasto de ${formatearMoneda(montoTotal)} en ` +
      `${cuotasPendientes} cuotas (${formatearMoneda(montoCuota)} c/u) ` +
      `en tarjeta "${tarjeta.alias}"?`
    )) return;

    const pv = calcularPrimerVencimiento(fechaCompra, tarjeta.diaCierre);
    const { inicio, fin } = calcularCiclos(tarjeta.diaCierre);
    const cicloAsign = (pv >= inicio && pv <= fin) ? 'Actual' : 'Próximo';

    gastos.push({
      id: Date.now(),
      tarjetaId,
      fechaCompra,
      detalle,
      cuotasPendientes,
      montoCuota,
      primerVencimiento: pv.toISOString(),
      cicloAsignado: cicloAsign
    });
    renderGastos();
    renderTarjetas();
  });

  // Confirmar + Eliminar Gasto de Tarjeta
  tbodyGastos.addEventListener('click', e => {
    if (!e.target.classList.contains('btn-eliminar-gasto-tarjeta')) return;
    const tr = e.target.closest('tr');
    const id = +tr.dataset.id;
    const g  = gastos.find(x => x.id === id);
    if (!confirm(`¿Eliminar gasto "${g.detalle}" de ${formatearMoneda(g.montoCuota)} x ${g.cuotasPendientes} cuotas?`)) return;
    gastos = gastos.filter(x => x.id !== id);
    renderGastos();
    renderTarjetas();
  });

  // Inicializamos
  renderTarjetas();
  renderGastos();

  // Refrescar al cambiar moneda
  document.addEventListener('currencyChanged', () => {
    renderTarjetas();
    renderGastos();
  });
});
