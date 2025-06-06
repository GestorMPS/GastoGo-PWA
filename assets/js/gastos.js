document.addEventListener('DOMContentLoaded', function () {
  // Referencias a elementos de “Gastos”
  const selectCategoria = document.getElementById('select-categoria');
  const selectSubcategoria = document.getElementById('select-subcategoria');
  const inputMontoGasto = document.getElementById('input-monto-gasto');
  const btnGuardarGasto = document.getElementById('btn-guardar-gasto');
  const displaySaldoRestante = document.getElementById('display-saldo-restante');
  const tablaGastosBody = document.querySelector('#tabla-gastos tbody');
  const btnFinalizarMes = document.getElementById('btn-finalizar-mes');

  // Datos de subcategorías por categoría
  const subcategoriasPorCategoria = {
    Alimentos: ['Supermercado', 'Restaurante', 'Café'],
    Transporte: ['Taxi', 'Subte/Colectivo', 'Combustible'],
    Salud: ['Farmacia', 'Médico', 'Hospital'],
    Entretenimiento: ['Cine', 'Streaming', 'Salidas'],
    // Agrega otras categorías si las necesitas
  };

  let gastos = [];             // Array de objetos { id, fecha, categoria, subcategoria, monto }
  let nextGastoId = 0;
  // Intentar leer el total de ingresos actuales desde localStorage
  let saldoInicial = 0;
  const ingresosGuardados = localStorage.getItem('totalIngresosActual');
  if (ingresosGuardados) {
  // Parseamos el string guardado (puede ser algo como "50000" o "52000")
  saldoInicial = parseFloat(ingresosGuardados) || 0;
  }

  // 1) Cargar subcategorías al cambiar la categoría
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

  // 2) Función helper para formatear moneda
  function formatearMoneda(valor) {
    return '$' + valor.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  }

  // 3) Mostrar saldo restante en pantalla
  function actualizarSaldoPantalla() {
    displaySaldoRestante.textContent = formatearMoneda(saldoInicial);
  }
  // Inicialmente, saldoInicial = 0. Más adelante, lo ajustaremos desde “Inicio”
  actualizarSaldoPantalla();

  // 4) Habilitar/deshabilitar “Guardar Gasto”
  function toggleBtnGuardarGasto() {
    const categoriaVal = selectCategoria.value;
    const montoVal = parseFloat(inputMontoGasto.value);
    btnGuardarGasto.disabled = !categoriaVal || isNaN(montoVal) || montoVal <= 0;
  }
  selectCategoria.addEventListener('change', toggleBtnGuardarGasto);
  inputMontoGasto.addEventListener('input', toggleBtnGuardarGasto);
  toggleBtnGuardarGasto();

  // 5) Al hacer clic en “Guardar Gasto”
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

    // Agregar fila a la tabla
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

    // Restar monto del saldo inicial
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

  // 6) Eliminar un gasto al hacer clic en “Eliminar”
  tablaGastosBody.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-eliminar-gasto')) {
      const tr = e.target.closest('tr');
      const idEliminar = parseInt(tr.dataset.id);
      const idx = gastos.findIndex((g) => g.id === idEliminar);
      if (idx > -1) {
        // Reponer monto al saldo inicial
        saldoInicial += gastos[idx].monto;
        gastos.splice(idx, 1);
        tablaGastosBody.removeChild(tr);
        actualizarSaldoPantalla();
        // Si ya no hay gastos, deshabilitar “Finalizar Mes”
        btnFinalizarMes.disabled = gastos.length === 0;
      }
    }
  });

  // 7) Al hacer clic en “Finalizar Mes”
  btnFinalizarMes.addEventListener('click', function () {
    if (saldoInicial < 0) {
      alert('No puedes finalizar el mes con saldo negativo.');
      return;
    }
    // Aquí irá la lógica para:
    //   a) Calcular totales
    //   b) Guardar en historial de meses
    //   c) Resetear datos de ingresos, gastos, saldos y volver a la pestaña “Inicio”
    alert('Función “Finalizar Mes” pendiente de implementar.');
  });
});
