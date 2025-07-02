document.addEventListener('DOMContentLoaded', () => {
  // 1. Cargar tarjetas desde localStorage al inicio
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];

  // 2. Referencias al DOM
  const inputEntidad    = document.getElementById('input-entidad-tarjeta');
  const inputAlias      = document.getElementById('input-alias-tarjeta');
  const inputCierre     = document.getElementById('input-dia-cierre');
  const btnGuardarTarj  = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas      = document.getElementById('ul-tarjetas');

  // 3. Validar inputs para habilitar botón
  function toggleBtnGuardarTarj() {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);
    btnGuardarTarj.disabled = !entidad || !alias || isNaN(cierre) || cierre < 1 || cierre > 28;
  }

  inputEntidad.addEventListener('input', toggleBtnGuardarTarj);
  inputAlias.addEventListener('input', toggleBtnGuardarTarj);
  inputCierre.addEventListener('input', toggleBtnGuardarTarj);

  // 4. Renderizar tarjetas en la lista
  function renderTarjetas() {
    ulTarjetas.innerHTML = '';
    tarjetas.forEach((t) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${t.alias}</strong> - ${t.entidad} (cierra día ${t.diaCierre})
        <button class="btn-eliminar-tarjeta" data-id="${t.id}">Eliminar</button>
      `;
      ulTarjetas.appendChild(li);
    });
  }

  // 5. Guardar tarjeta con confirmación
  btnGuardarTarj.addEventListener('click', () => {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);

    const msg = `¿Deseás guardar la tarjeta "${alias}" de ${entidad} con cierre el día ${cierre}?`;
    if (!confirm(msg)) {
      toggleBtnGuardarTarj();
      return;
    }

    const nuevaTarjeta = {
      id: Date.now(),
      entidad,
      alias,
      diaCierre: cierre
    };

    tarjetas.push(nuevaTarjeta);
    localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
    renderTarjetas(); // <- ESTA LÍNEA ES FUNDAMENTAL

    // Limpiar formulario
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    toggleBtnGuardarTarj();

    alert('Tarjeta guardada correctamente.');
  });

  // 6. Eliminar tarjeta con confirmación
  ulTarjetas.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar-tarjeta')) {
      const id = parseInt(e.target.dataset.id);
      const tarjeta = tarjetas.find(t => t.id === id);
      if (!confirm(`¿Eliminar la tarjeta "${tarjeta.alias}"?`)) return;

      tarjetas = tarjetas.filter(t => t.id !== id);
      localStorage.setItem('tarjetas', JSON.stringify(tarjetas));
      renderTarjetas();
    }
  });

  // 7. Render inicial al cargar
  renderTarjetas();
});
