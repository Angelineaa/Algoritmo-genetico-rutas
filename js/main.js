/* Punto de entrada del navegador: conecta controles, algoritmo y visualización. */
document.addEventListener("DOMContentLoaded", () => {
  // Guarda referencias a los controles que se usan durante la interacción.
  const button = document.getElementById("btn-iniciar");
  const status = document.getElementById("estado-ejecucion");
  const pageSize = document.getElementById("tamano-pagina");

  // Al pulsar el botón, bloquea ejecuciones dobles e inicia una simulación.
  button.addEventListener("click", () => {
    button.disabled = true;
    button.innerHTML = "<span>◌</span> Ejecutando...";
    status.textContent = "Generando clientes, evaluando 1.000 individuos y evolucionando la población...";
    // Retrasa el cálculo brevemente para que el navegador muestre el estado.
    window.setTimeout(() => {
      try {
        // Ejecuta el algoritmo, presenta resultados y comunica el motivo de parada.
        const result = window.GeneticAlgorithm.run();
        window.RouteUI.render(result);
        status.textContent = `Simulación terminada. ${result.stopReason}`;
        status.classList.toggle("success-status", result.best.fitness < result.config.targetFitness);
      } catch (error) {
        // Informa errores reales sin dejar el botón permanentemente bloqueado.
        console.error(error);
        status.textContent = `Ocurrió un error al ejecutar el algoritmo: ${error.message}`;
      } finally {
        // Restaura el botón tanto cuando la ejecución termina bien como si falla.
        button.disabled = false;
        button.innerHTML = "<span>↻</span> Ejecutar de nuevo";
      }
    }, 30);
  });

  // Cambiar el tamaño de página vuelve a dibujar ambas tablas.
  pageSize.addEventListener("change", () => window.RouteUI.refreshTables());
});