document.addEventListener('DOMContentLoaded', function () {
  // 1. Referencias a elementos de “Gastos” y pestañas
  const selectCategoria = document.getElementById('select-categoria');
  const selectSubcategoria = document.getElementById('select-subcategoria');
  const inputMontoGasto = document.getElementById('input-monto-gasto');
  const btnGuardarGasto = document.getElementById('btn-guardar-gasto');
  const displaySaldoRestante = document.getElementById('display-saldo-restante');
  const tablaGastosBody = document.querySelector('#tabla-gastos tbody');
  const btnFinalizarMes = document.getElementById('btn-finalizar-mes');
  const tabBotonGastos = document.querySelector('[data-tab="gastos"]');

  // Datos de subcategorías por categoría
  const subcategoriasPorCategoria = {
    Alimentos: ['Supermercado', 'Restaurante', 'Café'],
    Transporte: ['Taxi', 'Subte/Colectivo', 'Combustible'],
    Salud: ['Farmacia', 'Médico', 'Hospital'],
    Entretenimiento: ['Cine', 'Streaming', 'Salidas'],
  };

  // 2. Lista de gastos en memoria
  let gastos = [];               // Array de { id, fecha, categoria, subcategoria, monto }
  let nextGastoId = 0;

  // 3. Función helper para formatear moneda
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


  // 4. Variables para saldo
  let saldoInicial = 0; // Este valor se recargará desde localStorage al entrar a Gastos

  // 5. Función que recarga el saldo desde localStorage y le resta los gastos guardados en memoria
  function recargarSaldoDesdeLocalStorage() {
    const ingresosGuardados = localStorage.getItem('totalIngresosActual');
    const totalIngresos = parseFloat(ingresosGuardados) || 0;
    // Restamos a totalIngresos la sumatoria de los gastos ya en memoria:
    const totalGastosMemoria = gastos.reduce((acum, g) => acum + g.monto, 0);
    saldoInicial = totalIngresos - totalGastosMemoria;
    displaySaldoRestante.textContent = formatearMoneda(saldoInicial);
    // Si no hay ingreso o ingreso = 0, bloqueamos todo
    const bloquear = totalIngresos <= 0;
    selectCategoria.disabled = bloquear;
    inputMontoGasto.disabled = bloquear;
    // Aunque el botón solo se habilita cuando hay categoría y monto, si bloquear=true,
    // forzamos Gasto.disabled = true:
    gastos.disabled = bloquear || gastos.disabled;
    // Y “Finalizar Mes” también
    btnFinalizarMes.disabled = totalIngresos <= 0 || gastos.length === 0;
  }
  // Al cambiar la moneda, recargamos saldo y re-renderizamos cobertura de gastos
    document.addEventListener('currencyChanged', () => {
  // si estás en la pestaña Gastos, refrescamos el saldo
    recargarSaldoDesdeLocalStorage();
  // opcional: volver a renderizar la tabla si formateas montos allí
  });


  // 6. Listener para que, cada vez que se haga clic en la pestaña “Gastos”, recargue el saldo
  tabBotonGastos.addEventListener('click', function () {
    recargarSaldoDesdeLocalStorage();
  });

  // 7. Al cargar la página por primera vez, recargamos una vez (en caso de que inicien en Gastos)
  recargarSaldoDesdeLocalStorage();

  // 8. Habilitar/deshabilitar “Guardar Gasto” según categoría y monto válidos
  function toggleBtnGuardarGasto() {
    const categoriaVal = selectCategoria.value;
    const montoVal = parseFloat(inputMontoGasto.value);
    // Además, si no hay ingreso guardado, que quede siempre deshabilitado
    const ingresosGuardados = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
    gastos.disabled = !categoriaVal || isNaN(montoVal) || montoVal <= 0 || ingresosGuardados <= 0;
  }
  selectCategoria.addEventListener('change', toggleBtnGuardarGasto);
  inputMontoGasto.addEventListener('input', toggleBtnGuardarGasto);
  toggleBtnGuardarGasto();

  // 9. Al cambiar categoría, cargamos subcategorías
  selectCategoria.addEventListener('change', function () {
    const cat = this.value;
    if (!cat) {
      selectSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>';
      selectSubcategoria.disabled = true;
      return;
    }
    const opcionesSub = subcategoriasPorCategoria[cat] || [];
    let html = '<option value="">-- Seleccionar --</option>';
    opcionesSub.forEach((sub) => {
      html += `<option value="${sub}">${sub}</option>`;
    });
    selectSubcategoria.innerHTML = html;
    selectSubcategoria.disabled = opcionesSub.length === 0;
  });

 // 10. Al hacer clic en “Guardar Gasto”
btnGuardarGasto.addEventListener('click', () => {
  const tarjetaId        = +selectTarjG.value;
  const fechaCompra      = inputFecha.value;
  const detalle          = inputDet.value.trim();
  const montoTotal       = +inputMonto.value;
  const cuotasPendientes = +inputCuo.value;
  const montoCuota       = montoTotal / cuotasPendientes;
  const tarjeta          = tarjetas.find(t => t.id === tarjetaId);

  // Mensaje de confirmación
  const msg =
    `¿Registrar gasto de ${formatearMoneda(montoTotal)} en ${cuotasPendientes} cuotas ` +
    `(${formatearMoneda(montoCuota)} cada una) en tarjeta "${tarjeta.alias}"?`;
  if (!confirm(msg)) return;

  // Si confirma, calculamos primer vencimiento y ciclo
  const pv = calcularPrimerVencimiento(fechaCompra, tarjeta.diaCierre);
  const { inicio, fin } = calcularCiclos(tarjeta.diaCierre);
  const cicloAsign = (pv >= inicio && pv <= fin) ? 'Actual' : 'Próximo';

  // Agregamos el gasto al array
  gastos.push({
    id: Date.now(),
    tarjetaId,
    fechaCompra,
    detalle,
    cuotasPendientes,
    montoCuota,
    primerVencimiento: pv.toISOString(),
    cicloAsignado: cicloAsign
  // Volvemos a renderizar listados
  renderGastos();
  renderTarjetas();
  });





    // Insertar fila en la tabla
    const tr = document.createElement('tr');
    tr.dataset.id = gastoObj.id;
    tr.innerHTML = `
      <td>${gastoObj.fecha}</td>
      <td>${gastoObj.categoria}</td>
      <td>${gastoObj.subcategoria}</td>
      <td>${formatearMoneda(gastoObj.monto)}</td>
      <td>
        <button type="button" class="btn-eliminar-gasto">Eliminar</button>
      </td>
    `;
    tablaGastosBody.appendChild(tr);

    // Restar monto del saldo inicial y actualizar
    saldoInicial -= gastoObj.monto;
    displaySaldoRestante.textContent = formatearMoneda(saldoInicial);

    // Limpiar formulario
    selectCategoria.value = '';
    selectSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>';
    selectSubcategoria.disabled = true;
    inputMontoGasto.value = 0;
    toggleBtnGuardarGasto();

    // Habilitar “Finalizar Mes” si hay al menos un gasto y hay ingreso guardado
    const ingresosGuardados = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
    btnFinalizarMes.disabled = ingresosGuardados <= 0 || gastos.length === 0;
  });

  // 11. Eliminar un gasto al hacer clic en “Eliminar”
  tablaGastosBody.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-eliminar-gasto')) {
      const tr = e.target.closest('tr');
      const idEliminar = parseInt(tr.dataset.id);
      const idx = gastos.findIndex((g) => g.id === idEliminar);
      if (idx > -1) {
        // Devolver monto al saldo inicial
        saldoInicial += gastos[idx].monto;
        gastos.splice(idx, 1);
        tablaGastosBody.removeChild(tr);
        displaySaldoRestante.textContent = formatearMoneda(saldoInicial);
        // Deshabilitar “Finalizar Mes” si ya no hay gastos
        const ingresosGuardados = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
        btnFinalizarMes.disabled = ingresosGuardados <= 0 || gastos.length === 0;
      }
    }
  });

  // 12. Al hacer clic en “Finalizar Mes”
  btnFinalizarMes.addEventListener('click', function () {
    // a) Leer totalIngresos desde localStorage
    const ingresosGuardados = localStorage.getItem('totalIngresosActual');
    const totalIngresos = parseFloat(ingresosGuardados) || 0;

    // b) Calcular totalGastos sumando el array “gastos”
    const totalGastos = gastos.reduce((acum, g) => acum + g.monto, 0);

    // c) Calcular saldoFinal
    const saldoFinal = totalIngresos - totalGastos;

    // d) Determinar el nombre del mes actual
    const fechaHoy = new Date();
    const nombreMes = fechaHoy.toLocaleDateString('es-AR', { month: 'long' });
    const anio = fechaHoy.getFullYear();
    const mesFormateado = `${nombreMes} ’${anio.toString().slice(-2)}`;

    // e) Disparar el evento personalizado para “Meses”
    const nuevoMesObj = {
      mes: mesFormateado,
      totalIngresos,
      totalGastos,
      saldoFinal
    };
    document.dispatchEvent(new CustomEvent('nuevoMesFinalizado', {
      detail: nuevoMesObj
    }));

    // f) Limpiar datos: eliminar totalIngresosActual de localStorage
    localStorage.removeItem('totalIngresosActual');

    // g) Limpiar la tabla de Gastos y resetear variables
    gastos = [];
    tablaGastosBody.innerHTML = '';
    saldoInicial = 0;
    displaySaldoRestante.textContent = formatearMoneda(0);
    btnFinalizarMes.disabled = true;

    // h) Resetear UI de “Gastos”: Categoria, Subcategoria, Monto
    selectCategoria.value = '';
    selectSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>';
    selectSubcategoria.disabled = true;
    inputMontoGasto.value = 0;
    toggleBtnGuardarGasto();

    // i) Resetear UI de “Inicio”: desbloquear input principal y ponerlo a 0
    const ingresoPrincipalInput = document.getElementById('ingreso-principal-input');
    const btnGuardarPrincipal = document.getElementById('btn-guardar-principal');
    ingresoPrincipalInput.disabled = false;
    ingresoPrincipalInput.value = 0;
    btnGuardarPrincipal.disabled = true;
    const contenidoExtras = document.getElementById('contenido-ingresos-extras');
    contenidoExtras.hidden = true;
    document.getElementById('lista-ingresos-extras').innerHTML = '';
    document.getElementById('display-saldo-total').textContent = formatearMoneda(0);

    // j) (Opcional) Cambiar pestaña activa a “Meses” o a “Inicio”
    //    Si no quieres que cambie automáticamente, puedes comentar o quitar estas líneas:
    // document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    // document.querySelector('[data-tab="meses"]').classList.add('active');
    // document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    // document.getElementById('meses').classList.add('active');

    // Finalmente, mostrar alerta de éxito
    alert('Mes finalizado correctamente.');
  });
});
