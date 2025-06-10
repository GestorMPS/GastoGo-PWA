document.addEventListener('DOMContentLoaded', () => {
  // Referencias
  const selectMoneda      = document.getElementById('select-moneda');
  const toggleOscuro      = document.getElementById('toggle-modo-oscuro');
  const labelModo         = document.getElementById('label-modo');
  const btnExportar       = document.getElementById('btn-exportar');
  const btnImportar       = document.getElementById('btn-importar');
  const inputImportFile   = document.getElementById('input-import-file');

  // 1) Cargar preferencia de moneda
  const monedaGuardada = localStorage.getItem('moneda') || 'ARS';
  selectMoneda.value = monedaGuardada;
 selectMoneda.addEventListener('change', () => {
  localStorage.setItem('moneda', selectMoneda.value);
  alert(`Moneda cambiada a ${selectMoneda.value}. La página se recargará.`);
  location.reload();  // <-- fuerza recarga para actualizar todos los saldos/formateos
});


  // 2) Modo claro/oscuro
  const modoGuardado = localStorage.getItem('modoOscuro') === 'true';
  toggleOscuro.checked = modoGuardado;
  document.body.classList.toggle('dark-mode', modoGuardado);
  labelModo.textContent = modoGuardado ? 'Oscuro' : 'Claro';

  toggleOscuro.addEventListener('change', () => {
    const oscuro = toggleOscuro.checked;
    document.body.classList.toggle('dark-mode', oscuro);
    labelModo.textContent = oscuro ? 'Oscuro' : 'Claro';
    localStorage.setItem('modoOscuro', oscuro);
  });

  // 3) Exportar datos
  btnExportar.addEventListener('click', () => {
    const data = {
      ingresos: localStorage.getItem('totalIngresosActual'),
      tarjetas: JSON.parse(localStorage.getItem('tarjetas') || '[]'),
      gastos: JSON.parse(localStorage.getItem('gastos') || '[]'),
      meses: JSON.parse(localStorage.getItem('mesesFinalizados') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'gastoGo-data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 4) Importar datos
  btnImportar.addEventListener('click', () => inputImportFile.click());
  inputImportFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        localStorage.setItem('totalIngresosActual', obj.ingresos || '0');
        localStorage.setItem('tarjetas', JSON.stringify(obj.tarjetas || []));
        localStorage.setItem('gastos', JSON.stringify(obj.gastos || []));
        localStorage.setItem('mesesFinalizados', JSON.stringify(obj.meses || []));
        alert('Datos importados correctamente. Recarga la página.');
      } catch {
        alert('Archivo inválido.');
      }
    };
    reader.readAsText(file);
  });
});
