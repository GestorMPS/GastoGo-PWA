document.addEventListener('DOMContentLoaded', () => {
  // Referencias
  const inputEntidad = document.getElementById('input-entidad-tarjeta');
  const inputAlias  = document.getElementById('input-alias-tarjeta');
  const inputCierre = document.getElementById('input-dia-cierre');
  const btnGuardarTarjeta = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas = document.getElementById('ul-tarjetas');

  const selectTarjetaGasto = document.getElementById('select-tarjeta-gasto');
  const inputFechaCompra = document.getElementById('input-fecha-compra');
  const inputMontoGastoTarjeta = document.getElementById('input-monto-gasto-tarjeta');
  const inputDetalleGasto = document.getElementById('input-detalle-gasto');
  const inputCuotasGasto = document.getElementById('input-cuotas-gasto');
  const btnGuardarGastoTarjeta = document.getElementById('btn-guardar-gasto-tarjeta');
  const tbodyGastosTarjeta = document.querySelector('#tabla-gastos-tarjeta tbody');
  const labelTotalGeneral = document.getElementById('label-total-general');

  // Datos en memoria
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];
  let gastos = JSON.parse(localStorage.getItem('gastosTarjeta')) || [];

  // Helpers
  const formatearMoneda = v => '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  const calcularPrimerVencimiento = (fechaCompra, diaCorte) => {
    const compra = new Date(fechaCompra);
    // mes siguiente si día compra >= diaCorte
    const mes = compra.getDate() >= diaCorte ? compra.getMonth() + 1 : compra.getMonth();
    const anio = mes === compra.getMonth() + 1 ? compra.getFullYear() : compra.getFullYear();
    return new Date(anio, mes, diaCorte);
  };

  // Renderizados
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    selectTarjetaGasto.innerHTML = '<option value="">-- Seleccionar Tarjeta --</option>';
    tarjetas.forEach(t => {
      // lista
      const li = document.createElement('li');
      li.dataset.id = t.id;
      const acumulado = gastos
        .filter(g => g.tarjetaId === t.id) >= .../* ciclo range */)
        .reduce((sum,g)=> sum + g.montoCuota, 0);
      li.innerHTML = `
        <span>${t.entidad} (${t.alias}) — Cierre: ${t.diaCierre} — ${formatearMoneda(acumulado)}</span>
        <button class="btn-eliminar-tarjeta">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);
      // select
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.entidad} (${t.alias})`;
      selectTarjetaGasto.appendChild(opt);
    });
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    actualizarResumenGeneral();
  }

  function renderGastos() {
    tbodyGastosTarjeta.innerHTML = '';
    gastos.forEach(g => {
      // calcular montoCuota y primerVencimiento ya guardados
      const tr = document.createElement('tr');
      tr.dataset.id = g.id;
      tr.innerHTML = `
        <td>${g.fechaCompra}</td>
        <td>${g.detalle}</td>
        <td>${g.cuotas}</td>
        <td>${formatearMoneda(g.montoCuota)}</td>
        <td>${new Date(g.primerVencimiento).toLocaleDateString('es-AR')}</td>
        <td><button class="btn-eliminar-gasto-tarjeta">Eliminar</button></td>
      `;
      tbodyGastosTarjeta.appendChild(tr);
    });
    localStorage.setItem('gastosTarjeta', JSON.stringify(gastos));
    actualizarResumenGeneral();
  }

  function actualizarResumenGeneral() {
    const total = gastos
      .filter(g => {
        // incluir sólo cuotas cuyo vencimiento esté en el ciclo actual
        // aquí calculas el rango según cada tarjeta.diaCierre
        return true;
      })
      .reduce((sum,g) => sum + g.montoCuota, 0);
    labelTotalGeneral.textContent = `Total mensual: ${formatearMoneda(total)}`;
  }

  // Validaciones y listeners para guardar tarjeta
  function toggleBtnGuardarTarjeta() {
    btnGuardarTarjeta.disabled = !inputEntidad.value.trim() || !inputAlias.value.trim() || 
      !(parseInt(inputCierre.value) >=1 && parseInt(inputCierre.value)<=28);
  }
  inputEntidad.addEventListener('input', toggleBtnGuardarTarjeta);
  inputAlias.addEventListener('input', toggleBtnGuardarTarjeta);
  inputCierre.addEventListener('input', toggleBtnGuardarTarjeta);
  toggleBtnGuardarTarjeta();

  btnGuardarTarjeta.addEventListener('click', () => {
    tarjetas.push({
      id: Date.now(),
      entidad: inputEntidad.value.trim(),
      alias: inputAlias.value.trim(),
      diaCierre: parseInt(inputCierre.value,10)
    });
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    toggleBtnGuardarTarjeta();
    renderTarjetas();
  });

  // Listeners para gastos en tarjeta
  function toggleBtnGuardarGasto() {
    btnGuardarGastoTarjeta.disabled = !selectTarjetaGasto.value ||
      !inputFechaCompra.value || parseFloat(inputMontoGastoTarjeta.value)<=0;
  }
  [selectTarjetaGasto, inputFechaCompra, inputMontoGastoTarjeta, inputDetalleGasto, inputCuotasGasto]
    .forEach(el => el.addEventListener('input', toggleBtnGuardarGasto));
  toggleBtnGuardarGasto();

  btnGuardarGastoTarjeta.addEventListener('click', () => {
    const tarjetaId = parseInt(selectTarjetaGasto.value,10);
    const fechaCompra = inputFechaCompra.value;
    const detalle = inputDetalleGasto.value.trim();
    const montoTotal = parseFloat(inputMontoGastoTarjeta.value);
    const cuotas = parseInt(inputCuotasGasto.value,10);
    const primerVenc = calcularPrimerVencimiento(fechaCompra, tarjetas.find(t=>t.id===tarjetaId).diaCierre);
    const montoCuota = montoTotal / cuotas;
    gastos.push({
      id: Date.now(),
      tarjetaId,
      fechaCompra,
      detalle,
      cuotas,
      primerVencimiento: primerVenc.toISOString(),
      montoCuota
    });
    inputDetalleGasto.value = '';
    inputMontoGastoTarjeta.value = 0;
    inputCuotasGasto.value = 1;
    renderGastos();
  });

  // Eliminar tarjeta o gasto
  ulTarjetas.addEventListener('click', e => {
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const id = parseInt(e.target.closest('li').dataset.id,10);
      tarjetas = tarjetas.filter(t=>t.id!==id);
      gastos = gastos.filter(g=>g.tarjetaId!==id);
      renderTarjetas();
      renderGastos();
    }
  });
  tbodyGastosTarjeta.addEventListener('click', e=>{
    if(e.target.classList.contains('btn-eliminar-gasto-tarjeta')){
      const id = parseInt(e.target.closest('tr').dataset.id,10);
      gastos = gastos.filter(g=>g.id!==id);
      renderGastos();
    }
  });

  // Inicializar
  renderTarjetas();
  renderGastos();
});
