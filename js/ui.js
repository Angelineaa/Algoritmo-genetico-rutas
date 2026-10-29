/* Presentación de la simulación: métricas, rutas, análisis, tablas y gráficas. */
window.RouteUI = (() => {
  // Referencias a las gráficas para destruirlas antes de volver a dibujarlas.
  let fitnessChart = null;
  let averageChart = null;
  // Conserva el último resultado y las páginas seleccionadas de cada tabla.
  let resultCache = null;
  const pageState = { initial: 0, final: 0 };

  // Atajos locales para localizar elementos y dar formato a números.
  const byId = id => document.getElementById(id);
  const fmt = (n, digits = 2) => Number(n).toLocaleString("es-CO", {
    minimumFractionDigits: digits, maximumFractionDigits: digits
  });
  // Resume las rutas de los camiones en una sola cadena para las tablas.
  const routeText = trucks => trucks
    .filter(truck => truck.route.length)
    .map((truck, index) => `Camión ${index + 1}: D → ${truck.route.join(" → ")} → D`)
    .join(" | ");

  // Dibuja visualmente la secuencia de paradas de cada camión utilizado.
  function renderRoute(trucks) {
    const container = byId("ruta-visual");
    container.innerHTML = "";
    trucks.forEach((truck, index) => {
      if (!truck.route.length) return;
      const label = document.createElement("strong");
      label.textContent = `Camión ${index + 1} (${fmt(truck.demand, 0)}/${cfgCapacity()} u., ${fmt(truck.totalMinutes, 1)} min): `;
      container.appendChild(label);
      const route = ["DEP", ...truck.route.map(id => `C${id}`), "DEP"];
      route.forEach((nodeText, nodeIndex) => {
        const node = document.createElement("span");
        node.className = `route-node${nodeText === "DEP" ? " depot" : ""}`;
        node.textContent = nodeText;
        container.appendChild(node);
        if (nodeIndex < route.length - 1) {
          const arrow = document.createElement("span");
          arrow.className = "route-arrow";
          arrow.textContent = "→";
          container.appendChild(arrow);
        }
      });
    });
  }

  // Lee la capacidad configurada para mostrarla junto a cada ruta.
  function cfgCapacity() {
    return resultCache.config.truckCapacity;
  }

  // Actualiza las tarjetas resumen y la ruta que obtuvo mejor fitness.
  function renderMetrics(result) {
    const best = result.best;
    byId("mejor-fitness").textContent = fmt(best.fitness);
    byId("mejor-distancia").textContent = fmt(best.distance);
    byId("mejor-tiempo").textContent = `${fmt(best.totalMinutes, 1)} min`;
    byId("generaciones-ejecutadas").textContent = result.generationsExecuted;
    byId("mejor-demanda").textContent =
      `${fmt(best.demand, 0)} / ${fmt(result.config.truckCount * result.config.truckCapacity, 0)} u.`;
    byId("capacidad-camion").textContent =
      `${best.trucks.filter(truck => truck.route.length).length} / ${result.config.truckCount}`;
    byId("estado-restricciones").textContent = best.feasible ? "Cumplidas" : "Penalizadas";
    byId("estado-restricciones").style.color = best.feasible ? "#16866b" : "#b45345";
    byId("estado-parada").textContent = best.fitness < result.config.targetFitness ? "Meta alcanzada" : "Límite de generaciones";
    byId("mejor-fitness").title = "Función de aptitud minimizada; incluye penalizaciones por incumplimientos.";
    renderRoute(best.trucks);
  }

  // Renderiza una página de individuos y crea controles de paginación.
  function renderPopulation(population, type) {
    const pageSize = Number(byId("tamano-pagina").value);
    const page = pageState[type];
    const start = page * pageSize;
    const end = Math.min(start + pageSize, population.length);
    const tbody = byId(type === "initial" ? "poblacion-inicial" : "poblacion-final");
    tbody.innerHTML = "";
    // Crea una fila con ruta, distancia, tiempo y fitness de cada individuo visible.
    population.slice(start, end).forEach((ind, offset) => {
      const tr = document.createElement("tr");
      if (type === "final" && start + offset === 0) tr.className = "best-row";
      const cells = [
        String(start + offset + 1),
        routeText(ind.trucks),
        fmt(ind.distance),
        fmt(ind.totalMinutes, 1),
        fmt(ind.fitness)
      ];
      cells.forEach((value, idx) => {
        const td = document.createElement("td");
        td.textContent = value;
        if (idx === 1) { td.className = "route-cell"; td.title = value; }
        if (idx === 4) td.className = "fitness-cell";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    // Los botones cambian la página sin modificar los resultados calculados.
    const pagination = byId(type === "initial" ? "paginacion-inicial" : "paginacion-final");
    const totalPages = Math.max(1, Math.ceil(population.length / pageSize));
    pagination.innerHTML = "";
    const info = document.createElement("span");
    info.textContent = `Mostrando ${start + 1}–${end} de ${population.length}`;
    const controls = document.createElement("div");
    const prev = document.createElement("button");
    prev.textContent = "← Anterior";
    prev.disabled = page <= 0;
    prev.addEventListener("click", () => { pageState[type]--; renderPopulation(population, type); });
    const next = document.createElement("button");
    next.textContent = "Siguiente →";
    next.disabled = page >= totalPages - 1;
    next.addEventListener("click", () => { pageState[type]++; renderPopulation(population, type); });
    controls.append(prev, next);
    pagination.append(info, controls);
  }

  // Explica la calidad, mejora, convergencia y factibilidad de la mejor solución.
  function renderAnalysis(result) {
    const best = result.best;
    const initialBest = result.initialPopulation[0];
    const improvement = initialBest.fitness > 0
      ? ((initialBest.fitness - best.fitness) / initialBest.fitness) * 100 : 0;
    const last = result.history[result.history.length - 1];
    const first = result.history[0];
    const converged = result.history.length > 2 &&
      Math.abs(result.history[result.history.length - 1].bestFitness - result.history[Math.max(0, result.history.length - 6)].bestFitness) < 0.000001;

    const items = [
      ["Calidad de la solución", `La mejor ruta obtuvo un fitness de ${fmt(best.fitness)} y una distancia de ${fmt(best.distance)} unidades. La aptitud se minimiza; por tanto, los valores menores representan rutas de menor costo.`],
      ["Mejora observada", `Frente al mejor individuo inicial (${fmt(initialBest.fitness)}), el costo cambió ${fmt(Math.abs(improvement), 2)}% ${improvement >= 0 ? "a la baja" : "al alza"}. El elitismo conserva el mejor individuo de cada generación.`],
      ["Convergencia", `El historial contiene ${result.history.length} registros de generación. ${converged ? "El mejor fitness mostró muy poca variación en las últimas generaciones registradas." : "La gráfica permite observar si el mejor fitness continúa mejorando o si comienza a estabilizarse."}`],
      ["Costo y restricciones", `El fitness minimiza distancia (${fmt(best.distance)} unidades) y tiempo total (${fmt(best.totalMinutes, 1)} minutos, ponderado a ${fmt(result.config.timeCostPerHour, 0)} unidades por hora). Cada camión admite ${result.config.truckCapacity} unidades y ${result.config.maxWorkMinutes} minutos diarios. ${best.feasible ? "La solución cumple ambas restricciones." : `La solución acumula exceso de capacidad de ${fmt(best.capacityExcess, 0)} unidades y exceso de tiempo de ${fmt(best.timeExcess, 1)} minutos, penalizados en el fitness.`}`]
    ];
    const container = byId("analisis-texto");
    container.innerHTML = "";
    items.forEach(([title, body]) => {
      const item = document.createElement("div");
      item.className = "analysis-item";
      const strong = document.createElement("strong"); strong.textContent = title;
      const p = document.createElement("p"); p.textContent = body;
      item.append(strong, p); container.appendChild(item);
    });

    // Resume si se alcanzó el umbral o se detuvo por el límite de generaciones.
    const reached = best.fitness < result.config.targetFitness;
    byId("analisis-errores").textContent =
      `${result.stopReason} ` +
      (reached
        ? "El criterio de fitness se alcanzó."
        : `No se alcanzó fitness < ${result.config.targetFitness}; el programa terminó por el límite de seguridad de ${result.config.maxGenerations} generaciones. `) +
      `El criterio solicitado se verifica literalmente como fitness < ${result.config.targetFitness}; el máximo de generaciones evita que una meta demasiado estricta deje la simulación ejecutándose indefinidamente.`;
  }

  // Dibuja la evolución del mejor fitness y la comparación con el promedio.
  function renderCharts(result) {
    // Convierte los datos del historial a etiquetas y series para Chart.js.
    const labels = result.history.map(h => `Gen. ${h.generation + 1}`);
    const bestData = result.history.map(h => h.bestFitness);
    const avgData = result.history.map(h => h.averageFitness);
    // Opciones compartidas de aspecto, interacción, ejes y tipografía.
    const common = {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: { legend: { labels: { color: "#4A2E27", usePointStyle: true, boxWidth: 7, font: { family: "Ubuntu", size: 10 } } } },
      scales: {
        x: { ticks: { maxTicksLimit: 10, color: "#806b61", font: { family: "Ubuntu", size: 9 } }, grid: { display: false } },
        y: { beginAtZero: false, ticks: { color: "#806b61", font: { family: "Ubuntu", size: 9 } }, grid: { color: "#e7dcc1" } }
      }
    };
    // Elimina instancias anteriores para evitar superponer gráficas en re-ejecuciones.
    if (fitnessChart) fitnessChart.destroy();
    if (averageChart) averageChart.destroy();
    // Gráfica principal: mejor aptitud obtenida en cada generación.
    fitnessChart = new Chart(byId("graficaFitness"), {
      type: "line",
      data: { labels, datasets: [{
        label: "Mejor fitness", data: bestData, borderColor: "#4D0E12",
        backgroundColor: "rgba(77,14,18,.10)", fill: true, tension: .25,
        pointRadius: 0, borderWidth: 2
      }]},
      options: { ...common, plugins: { ...common.plugins, legend: { display: false } } }
    });
    // Segunda gráfica: permite comparar mejor individuo y promedio de la población.
    averageChart = new Chart(byId("graficaPromedio"), {
      type: "line",
      data: { labels, datasets: [
        { label: "Mejor fitness", data: bestData, borderColor: "#4D0E12", tension: .25, pointRadius: 0, borderWidth: 2 },
        { label: "Fitness promedio", data: avgData, borderColor: "#6F89A4", tension: .25, pointRadius: 0, borderWidth: 2 }
      ]},
      options: common
    });
  }

  // Presenta una ejecución completa y reinicia ambas tablas a su primera página.
  function render(result) {
    resultCache = result;
    pageState.initial = 0;
    pageState.final = 0;
    byId("resultados").classList.remove("oculto");
    byId("resumen-inicial").textContent = `${result.initialPopulation.length.toLocaleString("es-CO")} individuos · antes de evolucionar`;
    byId("resumen-final").textContent = `${result.finalPopulation.length.toLocaleString("es-CO")} individuos · ordenados por fitness`;
    renderMetrics(result);
    renderAnalysis(result);
    renderCharts(result);
    renderPopulation(result.initialPopulation, "initial");
    renderPopulation(result.finalPopulation, "final");
  }

  // Actualiza solo las tablas cuando cambia la cantidad de filas por página.
  function refreshTables() {
    if (!resultCache) return;
    pageState.initial = 0;
    pageState.final = 0;
    renderPopulation(resultCache.initialPopulation, "initial");
    renderPopulation(resultCache.finalPopulation, "final");
  }

  // Funciones públicas que utiliza el punto de entrada de la página.
  return { render, refreshTables };
})();