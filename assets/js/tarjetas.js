document.addEventListener('DOMContentLoaded', () => {
  // 1. Datos en memoria y LocalStorage
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
  const inputMonto = document.getElementById('input-monto-gasto-tarjeta');
  const inputDet = document.getElementById('input-detalle-gasto');
  const inputCuo = document.getElementById('input-cuotas-gasto');
  const btnGuardarGasto = document.getElementById('btn-guardar-gasto-tarjeta');

  const tbodyGastos = document.querySelector('#tabla-gastos-tarjeta tbody');
  const labelTotalCiclo = document.getElementById('label-total-ciclo');
  const labelTotalProx = document.getElementById('label-total-prox-ciclo');
  

  // 3. Utilidades
  function formatearMoneda(valor) {
    const m = localStorage.getItem('moneda') || 'ARS';
    let symbol = '$', locale = 'es-AR';
    if (m === 'USD') { symbol = 'US$'; locale = 'en-US'; }
    if (m === 'EUR') { symbol = '€'; locale = 'de-DE'; }
    return symbol + Number(valor).toLocaleString(locale, { minimumFractionDigits: 2 });
  }
 
  function calcularPrimerVencimiento(fechaCompraISO, diaCierre) {
    const compra = new Date(fechaCompraISO);
    let mesVto = compra.getDate() <= diaCierre ? compra.getMonth() + 1 : compra.getMonth() + 2;
    let añoVto = compra.getFullYear();
    if (mesVto > 11) { mesVto -= 12; añoVto += 1; }
    return new Date(añoVto, mesVto, diaCierre);
  }

  function calcularCiclos(diaCierre, referencia = new Date()) {
    let cierreAct = new Date(referencia.getFullYear(), referencia.getMonth(), diaCierre);
    if (referencia.getDate() > diaCierre) cierreAct.setMonth(cierreAct.getMonth() + 1);
    const cierreAnt = new Date(cierreAct);
    cierreAnt.setMonth(cierreAct.getMonth() - 1);
    const inicio = new Date(cierreAnt); inicio.setDate(inicio.getDate() + 1);
    return { inicio, fin: cierreAct };
  }
 function calcularCicloParaVencimiento(vencimiento, diaCierre) {
  const { inicio, fin } = calcularCiclos(diaCierre);
  return (vencimiento >= inicio && vencimiento <= fin) ? 'Actual' : 'Próximo';
 }

  // 4. Renderizar Tarjetas y Combo
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    selectTarjG.innerHTML = '<option value="">-- Seleccionar Tarjeta --</option>';
    tarjetas.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.entidad} (${t.alias})`;
      selectTarjG.appendChild(opt);

      const li = document.createElement('li');
      li.dataset.id = t.id;
      li.innerHTML = `
        <span>${t.entidad} (${t.alias}) — Cierre: ${t.diaCierre}</span>
        <button class="btn-eliminar-tarjeta">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);
    });
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
  }

  // 5. Renderizar Gastos
function renderizarGastosTarjeta() {
  if (!tbodyGastos || !labelTotalCiclo || !labelTotalProx) return;

  tbodyGastos.innerHTML = '';
  let totalCicloActual = 0;
  let totalCicloProximo = 0;

  const hoy = new Date();

  // Función auxiliar: calcula el inicio y fin de un ciclo, dado un día de cierre
  function calcularCiclo(diaCierre, referencia) {
    let cierre = new Date(referencia.getFullYear(), referencia.getMonth(), diaCierre);
    if (referencia.getDate() > diaCierre) cierre.setMonth(cierre.getMonth() + 1);
    const inicio = new Date(cierre);
    inicio.setMonth(inicio.getMonth() - 1);
    inicio.setDate(diaCierre + 1);
    return { inicio, fin: cierre };
  }

  // Calcular inicio y fin del ciclo actual y próximo
  const ciclos = [0, 1].map(offset => calcularCiclo(25, new Date(hoy.getFullYear(), hoy.getMonth() + offset, hoy.getDate())));

  gastos.forEach(g => {
    const tarjeta = tarjetas.find(t => t.id === g.tarjetaId);
    if (!tarjeta) return;

    // Renderizar la fila como siempre
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

    // Calcular vencimientos por cuota
    for (let i = 0; i < g.cuotasPendientes; i++) {
      const vencimiento = new Date(g.primerVencimiento);
      vencimiento.setMonth(vencimiento.getMonth() + i);

      if (vencimiento >= ciclos[0].inicio && vencimiento <= ciclos[0].fin) {
        totalCicloActual += g.montoCuota;
      } else if (vencimiento >= ciclos[1].inicio && vencimiento <= ciclos[1].fin) {
        totalCicloProximo += g.montoCuota;
      }
      // El resto de las cuotas (cuota 3 en adelante) no se acumulan aún
    }
  });

  labelTotalCiclo.textContent = formatearMoneda(totalCicloActual);
  labelTotalProx.textContent = formatearMoneda(totalCicloProximo);
}

   function actualizarResumenGeneral() {
   const totalC = gastos
    .filter(g => g.cicloAsignado === 'Actual')
    .reduce((sum, g) => sum + g.montoCuota, 0);

   const totalP = gastos
    .filter(g => g.cicloAsignado === 'Próximo')
    .reduce((sum, g) => sum + g.montoCuota, 0);

   labelTotalCiclo.textContent = formatearMoneda(totalC);
   labelTotalProx.textContent  = formatearMoneda(totalP);
}

// Listener para eliminar un gasto al hacer clic en el botón
tbodyGastos.addEventListener('click', e => {
  if (e.target.classList.contains('btn-eliminar-gasto-tarjeta')) {
    const fila = e.target.closest('tr');
    const id = +fila.dataset.id;
    const gasto = gastos.find(g => g.id === id);

    if (!confirm(`¿Eliminar gasto "${gasto.detalle}" de ${formatearMoneda(gasto.montoCuota)}?`)) return;

    gastos = gastos.filter(g => g.id !== id);
    localStorage.setItem('gastos', JSON.stringify(gastos));
    renderizarGastosTarjeta();
    //actualizarResumenGeneral();
  }
});

  // 6. Habilitar/Deshabilitar botones
  function toggleBtnGuardarTarj() {
    btnGuardarTarj.disabled = !inputEntidad.value.trim() || !inputAlias.value.trim() || !(+inputCierre.value >= 1 && +inputCierre.value <= 28);
  }

  function toggleBtnGuardarGastoTarjeta() {
    btnGuardarGasto.disabled = !selectTarjG.value || !inputFecha.value || !inputDet.value.trim() || +inputMonto.value <= 0 || +inputCuo.value < 1;
  }

  // 7. Listeners para inputs
  [inputEntidad, inputAlias, inputCierre].forEach(el => el.addEventListener('input', toggleBtnGuardarTarj));
  [selectTarjG, inputFecha, inputDet, inputMonto, inputCuo].forEach(el => el.addEventListener('input', toggleBtnGuardarGastoTarjeta));

  // 8. Guardar Tarjeta
  btnGuardarTarj.addEventListener('click', () => {
    const entidad = inputEntidad.value.trim();
    const alias = inputAlias.value.trim();
    const diaCierre = +inputCierre.value;
    const confirmar = confirm(`¿Confirmás agregar la tarjeta "${entidad} (${alias})" con cierre día ${diaCierre}?`);
    if (!confirmar) return;

    tarjetas.push({ id: Date.now(), entidad, alias, diaCierre });
    renderTarjetas();
    //actualizarResumenGeneral();
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    btnGuardarTarj.disabled = true;
  });

  // 9. Eliminar tarjeta
  ulTarjetas.addEventListener('click', e => {
    if (!e.target.classList.contains('btn-eliminar-tarjeta')) return;
    const li = e.target.closest('li');
    const id = +li.dataset.id;
    const tarjeta = tarjetas.find(t => t.id === id);
    if (!confirm(`¿Eliminar tarjeta ${tarjeta.entidad} (${tarjeta.alias})? Esto borrará sus gastos.`)) return;

    tarjetas = tarjetas.filter(t => t.id !== id);
    gastos = gastos.filter(g => g.tarjetaId !== id);
    renderTarjetas();
    renderizarGastosTarjeta();
    //actualizarResumenGeneral();
  });

  // 10. Guardar Gasto
  btnGuardarGasto.addEventListener('click', () => {
    const tarjetaId = +selectTarjG.value;
    const fechaCompra = inputFecha.value;
    const detalle = inputDet.value.trim();
    const montoTotal = +inputMonto.value;
    const cuotasPendientes = +inputCuo.value;

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

    console.log('Gasto registrado:', gasto);
    
    gastos.push(gasto);
    localStorage.setItem('gastos', JSON.stringify(gastos));
    renderizarGastosTarjeta();
    //actualizarResumenGeneral();

    selectTarjG.value = '';
    inputFecha.value = '';
    inputDet.value = '';
    inputMonto.value = '';
    inputCuo.value = '';
    btnGuardarGasto.disabled = true;
  });
  
  // 12. Botón "Pagar tarjeta"
const btnPagarTarjeta = document.getElementById('btn-pagar-tarjeta');
btnPagarTarjeta.addEventListener('click', () => {
  if (!confirm('¿Confirmás que ya pagaste tu tarjeta? Esto ajustará las cuotas pendientes.')) return;

  const hoy = new Date();

  gastos = gastos.map(g => {
    // Si ya no tiene más cuotas, lo dejamos igual
    if (g.cuotasPendientes <= 1) return null;

    const nuevaCuotas = g.cuotasPendientes - 1;
    const nuevoPrimerVto = new Date(g.primerVencimiento);
    nuevoPrimerVto.setMonth(nuevoPrimerVto.getMonth() + 1);

    const tarjeta = tarjetas.find(t => t.id === g.tarjetaId);
    const nuevoCiclo = calcularCicloParaVencimiento(nuevoPrimerVto, tarjeta.diaCierre);

    return {
      ...g,
      cuotasPendientes: nuevaCuotas,
      primerVencimiento: nuevoPrimerVto.toISOString(),
      cicloAsignado: nuevoCiclo
    };
  }).filter(g => g !== null); // Quitamos los gastos ya pagados totalmente

  localStorage.setItem('gastos', JSON.stringify(gastos));
  renderizarGastosTarjeta();
  actualizarResumenGeneral();
});


 // 11. Inicializar app
  renderTarjetas();
  renderizarGastosTarjeta();
  //actualizarResumenGeneral();
});
