  document.addEventListener('DOMContentLoaded', function () {
      // -------- TAB SWITCHING --------
      const tabButtons = document.querySelectorAll('.tab-button');
      const tabContents = document.querySelectorAll('.tab-content');

      tabButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          // 1) Remover clase active de todos los botones
          tabButtons.forEach((b) => b.classList.remove('active'));
          // 2) Agregar clase active al botón clicado
          this.classList.add('active');
          // 3) Ocultar todas las secciones
          tabContents.forEach((sec) => sec.classList.remove('active'));
          // 4) Mostrar la sección cuyo id coincide con data-tab del botón
          const target = this.getAttribute('data-tab');
          document.getElementById(target).classList.add('active');
        });
      });
      // Inicial: ya está “Inicio” activo porque en el HTML aparece con class="tab-content active"

      // -------- LÓGICA DE “INICIO” (Ingresos + Ingresos Extras) --------

      // Referencias a elementos de “Inicio”
      const ingresoPrincipalInput = document.getElementById('ingreso-principal-input');
      const btnGuardarPrincipal = document.getElementById('btn-guardar-principal');
      const contenidoExtras = document.getElementById('contenido-ingresos-extras');
      const btnMostrarExtra = document.getElementById('btn-mostrar-formulario-extra');
      const formularioExtra = document.getElementById('formulario-ingreso-extra');
      const descExtraInput = document.getElementById('desc-ingreso-extra');
      const montoExtraInput = document.getElementById('monto-ingreso-extra');
      const btnGuardarExtra = document.getElementById('btn-guardar-extra');
      const listaExtras = document.getElementById('lista-ingresos-extras');
      const displaySaldoTotal = document.getElementById('display-saldo-total');

      // Variables internas para Ingresos
      let ingresoPrincipal = 0;
      let ingresosExtras = []; // Array de { id, descripcion, monto }
      let nextExtraId = 0;

      // Formatear número como moneda $X.XXX,XX
     // ——— Formatear moneda según moneda seleccionada ———
function formatearMoneda(valor) {
  const m = localStorage.getItem('moneda') || 'ARS';
  let symbol, locale;
  switch (m) {
    case 'USD':
      symbol = 'US$'; locale = 'en-US'; break;
    case 'EUR':
      symbol = '€'; locale = 'de-DE'; break;
    default:
      symbol = '$'; locale = 'es-AR';
  }
  return symbol + Number(valor)
    .toLocaleString(locale, { minimumFractionDigits: 2 });
}
// —————————————————————————————————————————————


      // 1) Si ya hay totalIngresosActual en localStorage, cargamos estado inicial
      const ingresosGuardados = localStorage.getItem('totalIngresosActual');
      if (ingresosGuardados && parseFloat(ingresosGuardados) > 0) {
        ingresoPrincipal = parseFloat(ingresosGuardados);
        ingresoPrincipalInput.value = ingresoPrincipal;
        ingresoPrincipalInput.disabled = true;
        btnGuardarPrincipal.disabled = true;
        contenidoExtras.hidden = false;
        // Mostrar el saldo total recargado
        displaySaldoTotal.textContent = formatearMoneda(ingresoPrincipal);
      }

      // 2) Habilitar/Deshabilitar botón “Guardar Ingreso Principal”
      function toggleBtnGuardarPrincipal() {
        const v = parseFloat(ingresoPrincipalInput.value);
        btnGuardarPrincipal.disabled = isNaN(v) || v <= 0;
      }
      ingresoPrincipalInput.addEventListener('input', toggleBtnGuardarPrincipal);
      toggleBtnGuardarPrincipal();

      // 3) Al hacer clic en “Guardar Ingreso Principal”
      btnGuardarPrincipal.addEventListener('click', function () {
        ingresoPrincipal = parseFloat(ingresoPrincipalInput.value) || 0;
        if (ingresoPrincipal <= 0) {
          alert('Ingresa un monto válido para el ingreso principal.');
          return;
        }
        // Bloquear input y botón principal
        ingresoPrincipalInput.disabled = true;
        btnGuardarPrincipal.disabled = true;

        // Guardar en localStorage el ingreso principal (sin extras todavía)
        localStorage.setItem('totalIngresosActual', ingresoPrincipal);

        // Mostrar sección de ingresos extras
        contenidoExtras.hidden = false;

        // Actualizar el saldo total
        actualizarSaldoTotal();
      });

      // 4) Mostrar u ocultar formulario para Ingreso Extra
      let formularioMostrado = false;
      btnMostrarExtra.addEventListener('click', function () {
        formularioMostrado = !formularioMostrado;
        formularioExtra.hidden = !formularioMostrado;
        if (formularioMostrado) {
          descExtraInput.focus();
        } else {
          descExtraInput.value = '';
          montoExtraInput.value = 0;
        }
      });

      // 5) Habilitar/Deshabilitar botón “Guardar Extra”
      function toggleBtnGuardarExtra() {
        const desc = descExtraInput.value.trim();
        const m = parseFloat(montoExtraInput.value);
        btnGuardarExtra.disabled = desc === '' || isNaN(m) || m <= 0;
      }
      descExtraInput.addEventListener('input', toggleBtnGuardarExtra);
      montoExtraInput.addEventListener('input', toggleBtnGuardarExtra);
      toggleBtnGuardarExtra();

      // 6) Al hacer clic en “Guardar Extra”
      btnGuardarExtra.addEventListener('click', function () {
        const desc = descExtraInput.value.trim();
        const monto = parseFloat(montoExtraInput.value) || 0;
        if (desc === '' || monto <= 0) {
          alert('Completa descripción y monto válido para el ingreso extra.');
          return;
        }

        // Crear objeto extra y agregarlo al array
        const extra = { id: nextExtraId++, descripcion: desc, monto };
        ingresosExtras.push(extra);

        // Crear <li> en la lista de extras
        const li = document.createElement('li');
        li.className = 'item-extra';
        li.dataset.id = extra.id;
        li.innerHTML = `
          <span>${extra.descripcion}: ${formatearMoneda(extra.monto)}</span>
          <button type="button" class="btn-eliminar-extra">Eliminar</button>
        `;
        listaExtras.appendChild(li);

        // Limpiar formulario
        descExtraInput.value = '';
        montoExtraInput.value = 0;
        toggleBtnGuardarExtra();

        // Actualizar el saldo total (principal + extras)
        actualizarSaldoTotal();
      });

      // 7) Manejar clic en “Eliminar” de un ingreso extra
      listaExtras.addEventListener('click', function (e) {
        if (e.target.classList.contains('btn-eliminar-extra')) {
          const li = e.target.closest('li.item-extra');
          const id = parseInt(li.dataset.id);
          ingresosExtras = ingresosExtras.filter((extra) => extra.id !== id);
          listaExtras.removeChild(li);
          actualizarSaldoTotal();
        }
      });

      // 8) Función para calcular y mostrar el saldo total y guardarlo en localStorage
      function actualizarSaldoTotal() {
        const sumaExtras = ingresosExtras.reduce((acum, ex) => acum + ex.monto, 0);
        const saldo = ingresoPrincipal + sumaExtras;
        displaySaldoTotal.textContent = formatearMoneda(saldo);

        // Guardar el total (principal + extras) en localStorage
        localStorage.setItem('totalIngresosActual', saldo);
      }
      // Cuando cambie la moneda, recalcular y mostrar de nuevo el saldo
      document.addEventListener('currencyChanged', actualizarSaldoTotal);

      // 9) Mostrar el saldo inicial en pantalla (por si recargamos con ingresos guardados)
      const saldoRecargado = parseFloat(localStorage.getItem('totalIngresosActual')) || 0;
      if (saldoRecargado > 0) {
        displaySaldoTotal.textContent = formatearMoneda(saldoRecargado);
      }
    });
