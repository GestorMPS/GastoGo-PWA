document.addEventListener('DOMContentLoaded', function () {
  // 1. Referencias a elementos de “Gastos” y de la pestaña
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

  // 2. Variable para el saldo, que recargaremos según localStorage al abrir Gastos
  let saldoInicial = 0;

  // Obtener saldo desde localStorage (si existe)
  function recargarSaldoDesdeLocalStorage() {
    const ingresosGuardados = localStorage.getItem('totalIngresosActual');
    saldoInicial = parseFloat(ingresosGuardados) || 0;
    actualizarSaldoPantalla();
    // Como recargamos, aseguramos que “Finalizar Mes” se deshabilite si no hay gastos
    btnFinalizarMes.disabled = gastos.length === 0;
  }

  // 3. Listener para recargar saldo cada vez que se abra la pestaña “Gastos”
  tabBotonGastos.addEventListener('click', function () {
    // Antes de mostrar la sección, actualizamos saldo desde lo guardado
    recargarSaldoDesdeLocalStorage();
  });

  let gastos = [];    // Array de { id, fecha, categoria, subcategoria, monto }
  let nextGastoId = 0;

  // 4. Función helper para formatear moneda
  function formatearMoneda(valor) {
    return '$' + valor.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  // 5. Mostrar Saldo Restante en pantalla
  function actualizarSaldoPantalla() {
    displaySaldoRestante.textContent = formatearMoneda(saldoInicial);
  }

  // Llamada inicial en caso de que el usuario abra directamente la pestaña Gastos tras recargar
  recargarSaldoDesdeLocalStorage();

  // 6. Habilitar/deshabilitar “Guardar Gasto”
  function toggleBtnGuardarGasto() {
    const categoriaVal = selectCategoria.value;
    const montoVal = parseFloat(inputMontoGasto.value);
    btnGuardarGasto.disabled = !categoriaVal || isNaN(montoVal) || montoVal <= 0;
  }
  selectCategoria.addEventListener('change', toggleBtnGuardarGasto);
  inputMontoGasto.addEventListener('input', toggleBtnGuardarGasto);
  toggleBtnGuardarGasto();

  // 7. Al cambiar categoría, cargamos subcategorías
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

  // 8. Al hacer clic en “Guardar Gasto”
  btnGuardarGasto.addEventListener('click', function () {
    const categoriaVal = selectCategoria.value;
    const subcategoriaVal = selectSubcategoria.value || '—';
    const montoVal = parseFloat(inputMontoGasto.value) || 0;
    if (!categoriaVal || montoVal <= 0) {
      alert('Selecciona categoría y un monto válido.');
      return;
    }
    // Crear objeto gasto
    const fecha = new Date().toLocaleDateString('es-AR');
    const gastoObj = {
      id: nextGastoId++,
      fecha,
      categoria: categoriaVal,
      subcategoria: subcategoriaVal,
      monto: montoVal,
    };
    gastos.push(gastoObj);

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
    actualizarSaldoPantalla();

    // Limpiar formulario
    selectCategoria.value = '';
    selectSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>';
    selectSubcategoria.disabled = true;
    inputMontoGasto.value = 0;
    toggleBtnGuardarGasto();

    // Habilitar botón “Finalizar Mes” si hay al menos un gasto
    btnFinalizarMes.disabled = gastos.length === 0;
  });

  // 9. Eliminar un gasto al hacer clic en “Eliminar”
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
        actualizarSaldoPantalla();
        // Deshabilitar “Finalizar Mes” si ya no hay gastos
        btnFinalizarMes.disabled = gastos.length === 0;
      }
    }
  });

  // 10. Al hacer clic en “Finalizar Mes”
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
    actualizarSaldoPantalla();
    btnFinalizarMes.disabled = true;

    // h) Resetear UI de “Gastos”: Categoria, Subcategoria, Monto
    selectCategoria.value = '';
    selectSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>';
    selectSubcategoria.disabled = true;
    inputMontoGasto.value = 0;
    toggleBtnGuardarGasto();

    // i) (Opcional) Cambiar pestaña activa a “Meses” o a “Inicio” según prefieras
    //    (Tal y como hablamos, no es crítico, así que lo omitimos aquí. Si quieres que cambie, descomenta abajo)

    // document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    // document.querySelector('[data-tab="meses"]').classList.add('active');
    // document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    // document.getElementById('meses').classList.add('active');

    // j) Resetear UI de “Inicio”: desbloquear input principal y ponerlo a 0
    const ingresoPrincipalInput = document.getElementById('ingreso-principal-input');
    const btnGuardarPrincipal = document.getElementById('btn-guardar-principal');
    ingresoPrincipalInput.disabled = false;
    ingresoPrincipalInput.value = 0;
    btnGuardarPrincipal.disabled = true;
    //    Ocultar sección de Ingresos Extras y limpiar lista
    const contenidoExtras = document.getElementById('contenido-ingresos-extras');
    contenidoExtras.hidden = true;
    document.getElementById('lista-ingresos-extras').innerHTML = '';
    //    Actualizar el saldo total en “Inicio” a $0
    document.getElementById('display-saldo-total').textContent = formatearMoneda(0);

    // Finalmente, mostrar alerta de éxito
    alert('Mes finalizado correctamente.');
  });
});
