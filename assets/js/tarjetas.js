document.addEventListener('DOMContentLoaded', () => {
  // ✅ 1. Cargar tarjetas desde localStorage al inicio
  let tarjetas = JSON.parse(localStorage.getItem('tarjetas')) || [];
  let gastos   = JSON.parse(localStorage.getItem('gastos'))   || [];

  // ✅ 2. Referencias al DOM
  const inputEntidad    = document.getElementById('input-entidad-tarjeta');
  const inputAlias      = document.getElementById('input-alias-tarjeta');
  const inputCierre     = document.getElementById('input-dia-cierre');
  const btnGuardarTarj  = document.getElementById('btn-guardar-tarjeta');
  const ulTarjetas      = document.getElementById('ul-tarjetas');

  // ✅ 3. Validar inputs para habilitar botón
  function toggleBtnGuardarTarj() {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);
    btnGuardarTarj.disabled = !entidad || !alias || isNaN(cierre) || cierre < 1 || cierre > 28;
  }

  inputEntidad.addEventListener('input', toggleBtnGuardarTarj);
  inputAlias.addEventListener('input', toggleBtnGuardarTarj);
  inputCierre.addEventListener('input', toggleBtnGuardarTarj);

  // ✅ 4. Guardar tarjeta con confirmación
  btnGuardarTarj.addEventListener('click', () => {
    const entidad = inputEntidad.value.trim();
    const alias   = inputAlias.value.trim();
    const cierre  = parseInt(inputCierre.value);

    // Confirmación
    const msg = `¿Deseás guardar la tarjeta "${alias}" de ${entidad} con cierre el día ${cierre}?`;
    if (!confirm(msg)) {
      toggleBtnGuardarTarj(); // Vuelve a desactivar si se cancela
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

    // Limpiar formulario
    inputEntidad.value = '';
    inputAlias.value = '';
    inputCierre.value = '';
    toggleBtnGuardarTarj();

    alert('Tarjeta guardada correctamente.');
  });

  // (Opcional) Si tenés función para renderizar tarjetas, podrías llamarla acá
});
