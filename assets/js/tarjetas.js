document.addEventListener('DOMContentLoaded', () => {
  // Referencias a DOM
  const inputEntidad   = document.getElementById('input-entidad-tarjeta');
  const inputAlias     = document.getElementById('input-alias-tarjeta');
  const inputCierre    = document.getElementById('input-dia-cierre');
  const btnGuardarTarj = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas     = document.getElementById('ul-tarjetas');

  const selectTarjG = document.getElementById('select-tarjeta-gasto');
  const inputFecha  = document.getElementById('input-fecha-compra');
  const inputMonto  = document.getElementById('input-monto-gasto-tarjeta');
  const inputDet    = document.getElementById('input-detalle-gasto');
  const inputCuo    = document.getElementById('input-cuotas-gasto');
  const btnGuardarG = document.getElementById('btn-guardar-gasto-tarjeta');

  const tbodyGastos = document.querySelector('#tabla-gastos-tarjeta tbody');
  const labelTotalC = document.getElementById('label-total-ciclo');
  const labelTotalP = document.getElementById('label-total-prox-ciclo');

  // Datos en memoria (y localStorage)
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];
  let gastos    = JSON.parse(localStorage.getItem('gastos'))    || [];

  // Helpers
  const formatearMoneda = v =>
    '$' + v.toLocaleString('es-AR', { minimumFractionDigits: 2 });

  // 1) Calcular ciclos de cada tarjeta
  function calcularCiclos(diaCierre) {
    const hoy = new Date();
    // Cierre actual
    let cierreAct = new Date(hoy.getFullYear(), hoy.getMonth(), diaCierre);
    if (hoy.getDate() > diaCierre) cierreAct.setMonth(cierreAct.getMonth() + 1);
    // Cierre anterior
    let cierreAnt = new Date(cierreAct);
    cierreAnt.setMonth(cierreAnt.getMonth() - 1);
    // Rango
    const inicio = new Date(cierreAnt); inicio.setDate(inicio.getDate() + 1);
    const fin    = new Date(cierreAct);
    return { inicio, fin };
  }

  // 2) Renderizar listado de tarjetas
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    selectTarjG.innerHTML = '<option value="">-- Seleccionar Tarjeta --</option>';

   const resCiclo = gastos
  .filter(g => g.tarjetaId === t.id && g.cicloAsignado === 'Actual')
  .reduce((sum, g) => sum + g.montoCuota, 0);

   const resProx = gastos
  .filter(g => g.tarjetaId === t.id && g.cicloAsignado === 'Próximo')
  .reduce((sum, g) => sum + g.montoCuota, 0);


      // Acumular cuotas dentro de cada rango
      let resCiclo = 0, resProx = 0;
      gastos.filter(g => g.tarjetaId === t.id).forEach(g => {
        const pv = new Date(g.primerVencimiento);
        if (pv >= inicio && pv <= fin) resCiclo += g.montoCuota;
        else                             resProx  += g.montoCuota;
      });

      // LI
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

      // Select
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.entidad} (${t.alias})`;
      selectTarjG.appendChild(opt);
    });

    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    actualizarResumenGeneral();
  }

  // 3) Renderizar tabla de gastos
  function renderGastos() {
    tbodyGastos.innerHTML = '';
    gastos.forEach(g => {
      const tr = document.createElement('tr');
      tr.dataset.id = g.id;
      tr.innerHTML = `
        <td>${g.fechaCompra}</td>
        <td>${g.detalle}</td>
        <td>${g.cuotas}</td>
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

  // 4) Actualizar resúmenes globales
  function actualizarResumenGeneral() {
    const totalC = gastos
  .filter(g => g.cicloAsignado === 'Actual')
  .reduce((sum, g) => sum + g.montoCuota, 0);

   const totalP = gastos
  .filter(g => g.cicloAsignado === 'Próximo')
  .reduce((sum, g) => sum + g.montoCuota, 0);

   labelTotalC.textContent = `Total Ciclo Actual: ${formatearMoneda(totalC)}`;
   labelTotalP.textContent = `Total Próximo Ciclo: ${formatearMoneda(totalP)}`;

  }

  // 5) Validaciones y listeners para agregar tarjeta
  function toggleBtnTarj() {
    btnGuardarTarj.disabled = !inputEntidad.value.trim()
      || !inputAlias.value.trim()
      || !(+inputCierre.value >=1 && +inputCierre.value <=28);
  }
  [inputEntidad, inputAlias, inputCierre].forEach(el => el.addEventListener('input', toggleBtnTarj));
  toggleBtnTarj();

  btnGuardarTarj.addEventListener('click', () => {
    tarjetas.push({
      id: Date.now(),
      entidad: inputEntidad.value.trim(),
      alias: inputAlias.value.trim(),
      diaCierre: +inputCierre.value
    });
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    renderTarjetas();
  });

  // 6) Validaciones y listener para registrar gasto
  function toggleBtnGast() {
    btnGuardarG.disabled = !selectTarjG.value
      || !inputFecha.value
      || +inputMonto.value <= 0
      || +inputCuo.value < 1;
  }
  [selectTarjG, inputFecha, inputMonto, inputCuo, inputDet].forEach(el => el.addEventListener('input', toggleBtnGast));
  toggleBtnGast();

  btnGuardarG.addEventListener('click', () => {
    const tarjetaId = +selectTarjG.value;
    const fechaCompra = inputFecha.value;
    const detalle     = inputDet.value.trim();
    const montoTotal  = +inputMonto.value;
    const cuotas      = +inputCuo.value;

    // Calcular primer vencimiento y ciclo asignado
    const tarjeta = tarjetas.find(t => t.id === tarjetaId);
    const { inicio, fin } = calcularCiclos(tarjeta.diaCierre);
    const pv = calcularPrimerVencimiento(fechaCompra, tarjeta.diaCierre);
    const cicloAsign = (pv >= inicio && pv <= fin) ? 'Actual' : 'Próximo';

    gastos.push({
      id: Date.now(),
      tarjetaId,
      fechaCompra,
      detalle,
      cuotas,
      montoCuota: montoTotal / cuotas,
      primerVencimiento: pv.toISOString(),
      cicloAsignado: cicloAsign
    });

    // Limpiar form
    selectTarjG.value = '';
    inputFecha.value = '';
    inputMonto.value = 0;
    inputDet.value = '';
    inputCuo.value = 1;
    renderGastos();
  });

  // 7) Botones dinámicos (pagada y eliminar)
  ulTarjetas.addEventListener('click', e => {
    const li = e.target.closest('li');
    const id = +li.dataset.id;
    if (e.target.classList.contains('btn-tarjeta-pagada')) {
  // Calculamos cuánto hay en Actual y Próximo
  const resumenActual = gastos
    .filter(g => g.tarjetaId === id && g.cicloAsignado === 'Actual')
    .reduce((sum, g) => sum + g.montoCuota, 0);
  const resumenProx = gastos
    .filter(g => g.tarjetaId === id && g.cicloAsignado === 'Próximo')
    .reduce((sum, g) => sum + g.montoCuota, 0);

  // Rotamos: marcamos todas las cuotas Próximo como Actual
  gastos = gastos.map(g => {
    if (g.tarjetaId === id && g.cicloAsignado === 'Próximo') {
      return { ...g, cicloAsignado: 'Actual' };
    }
    return g;
  });

  // Re-renderizamos listados y totales
  renderTarjetas();
  renderGastos();
    }

    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      tarjetas = tarjetas.filter(t => t.id !== id);
      gastos    = gastos.filter(g => g.tarjetaId !== id);
      renderTarjetas();
      renderGastos();
    }
  });
  tbodyGastos.addEventListener('click', e => {
    if (e.target.classList.contains('btn-eliminar-gasto-tarjeta')) {
      const id = +e.target.closest('tr').dataset.id;
      gastos = gastos.filter(g => g.id !== id);
      renderGastos();
    }
  });

  // Inicializar
  renderTarjetas();
  renderGastos();
});
