document.addEventListener('DOMContentLoaded', function () {
  // Referencias a elementos de “Tarjetas”
  const inputNombreTarjeta = document.getElementById('input-nombre-tarjeta');
  const inputNumeroTarjeta = document.getElementById('input-numero-tarjeta');
  const btnGuardarTarjeta = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas = document.getElementById('ul-tarjetas');

  // Array para almacenar tarjetas en memoria
  // Cada objeto: { id, nombre, numero }
  let tarjetas = [];
  let nextTarjetaId = 0;

  // 1. Formatear número de tarjeta (espaciado)
  function formatearNumero(numero) {
    // Eliminar todo lo que no sean dígitos
    const soloDigitos = numero.replace(/\D/g, '');
    // Insertar un espacio cada 4 dígitos
    return soloDigitos.replace(/(.{4})/g, '$1 ').trim();
  }

  // 2. Habilitar/deshabilitar botón “Guardar Tarjeta”
  function toggleBtnGuardarTarjeta() {
    const nombreVal = inputNombreTarjeta.value.trim();
    const numVal = inputNumeroTarjeta.value.trim().replace(/\s/g, '');
    // Queremos al menos 13 dígitos y máximo 19 (4 bloques de 4 hasta 16+3 espacios)
    const esNumeroValido = /^\d{13,19}$/.test(numVal);
    btnGuardarTarjeta.disabled = nombreVal === '' || !esNumeroValido;
  }
  inputNombreTarjeta.addEventListener('input', toggleBtnGuardarTarjeta);
  inputNumeroTarjeta.addEventListener('input', function () {
    // Formatear en tiempo real con espacios
    this.value = formatearNumero(this.value);
    toggleBtnGuardarTarjeta();
  });
  toggleBtnGuardarTarjeta();

  // 3. Función para renderizar la lista de tarjetas (y guardar en localStorage)
  function renderizarTarjetas() {
    ulTarjetas.innerHTML = '';
    tarjetas.forEach((t) => {
      const li = document.createElement('li');
      li.dataset.id = t.id;
      li.innerHTML = `
        <span>${t.nombre} — ${formatearNumero(t.numero)}</span>
        <button type="button" class="btn-eliminar-tarjeta">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);
    });
    // Guardar en localStorage
    localStorage.setItem('listaTarjetas', JSON.stringify(tarjetas));
  }

  // 4. Cargar tarjetas desde localStorage al iniciar
  const tarjetasGuardadas = localStorage.getItem('listaTarjetas');
  if (tarjetasGuardadas) {
    try {
      tarjetas = JSON.parse(tarjetasGuardadas);
      // Ajustar nextTarjetaId al valor máximo +1
      if (tarjetas.length > 0) {
        nextTarjetaId = Math.max(...tarjetas.map((t) => t.id)) + 1;
      }
    } catch (e) {
      tarjetas = [];
    }
    renderizarTarjetas();
  }

  // 5. Al hacer clic en “Guardar Tarjeta”
  btnGuardarTarjeta.addEventListener('click', function () {
    const nombreVal = inputNombreTarjeta.value.trim();
    const numVal = inputNumeroTarjeta.value.trim().replace(/\s/g, '');
    if (nombreVal === '' || !/^\d{13,19}$/.test(numVal)) {
      alert('Completa nombre y un número de tarjeta válido (13–19 dígitos).');
      return;
    }
    const tarjetaObj = {
      id: nextTarjetaId++,
      nombre: nombreVal,
      numero: numVal,
    };
    tarjetas.push(tarjetaObj);

    // Renderizar de nuevo
    renderizarTarjetas();

    // Limpiar formulario
    inputNombreTarjeta.value = '';
    inputNumeroTarjeta.value = '';
    toggleBtnGuardarTarjeta();
  });

  // 6. Manejar clic en “Eliminar” de una tarjeta
  ulTarjetas.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const li = e.target.closest('li');
      const idEliminar = parseInt(li.dataset.id);
      tarjetas = tarjetas.filter((t) => t.id !== idEliminar);
      renderizarTarjetas();
    }
  });
});
