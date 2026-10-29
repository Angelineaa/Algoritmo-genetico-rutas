/* Modelo del problema: crea clientes, asigna sus visitas a los camiones y
   calcula el costo/fitness de cada cromosoma. */
window.RouteProblem = (() => {
  const cfg = window.AG_CONFIG;
  let customers = [];
  // Punto de salida y regreso común a todos los camiones.
  const depot = { id: 0, x: 15, y: 15, demand: 0, service: 0 };

  // Devuelve un valor aleatorio dentro del intervalo indicado.
  function randomBetween(min, max) { return min + Math.random() * (max - min); }

  // Crea clientes con coordenadas aleatorias y demanda/servicio definidos.
  function createCustomers() {
    customers = [];
    for (let i = 1; i <= cfg.customerCount; i++) {
      customers.push({
        id: i,
        x: Number(randomBetween(2, 28).toFixed(2)),
        y: Number(randomBetween(2, 28).toFixed(2)),
        demand: [3, 2, 4, 1, 3, 2, 4, 3, 2, 3][(i - 1) % 10],
        service: cfg.serviceMinutesPerCustomer
      });
    }
    return customers;
  }

  // Devuelve copias para que otros módulos no modifiquen los datos originales.
  function getCustomers() { return customers.map(c => ({ ...c })); }

  // Obtiene el depósito o un cliente a partir de su identificador.
  function pointForId(id) { return id === 0 ? depot : customers.find(c => c.id === id); }

  // Calcula la distancia euclidiana entre dos ubicaciones del plano.
  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /* Decodifica el cromosoma: recorre sus clientes en orden y asigna cada uno
     a un camión que pueda atenderlo, favoreciendo las asignaciones factibles. */
  function evaluate(chromosome) {
    // Cada camión conserva su secuencia y acumulados de carga, distancia y tiempo.
    const trucks = Array.from({ length: cfg.truckCount }, () => ({
      route: [], demand: 0, distance: 0, travelMinutes: 0, serviceTime: 0, totalMinutes: 0
    }));

    // Asigna cada cliente del cromosoma al camión con menor costo incremental.
    chromosome.forEach(id => {
      const customer = pointForId(id);
      const candidates = trucks.map((truck, index) => {
        const previous = truck.route.length
          ? pointForId(truck.route[truck.route.length - 1])
          : depot;
        const nextDistance = truck.distance
          - (truck.route.length ? distance(previous, depot) : 0)
          + distance(previous, customer)
          + distance(customer, depot);
        const nextDemand = truck.demand + customer.demand;
        const nextServiceTime = truck.serviceTime + customer.service;
        const nextTotalMinutes = (nextDistance / cfg.averageSpeed) * 60 + nextServiceTime;
        return {
          index,
          nextDistance,
          nextDemand,
          nextServiceTime,
          nextTotalMinutes,
          capacityExcess: Math.max(0, nextDemand - cfg.truckCapacity),
          timeExcess: Math.max(0, nextTotalMinutes - cfg.maxWorkMinutes)
        };
      });

      // Si existe un camión que cumple límites, solo se consideran esos camiones.
      const feasibleCandidates = candidates.filter(candidate =>
        candidate.capacityExcess === 0 && candidate.timeExcess === 0
      );
      const choices = feasibleCandidates.length ? feasibleCandidates : candidates;
      const chosen = choices.reduce((best, candidate) => {
        if (!best) return candidate;
        const candidatePenalty =
          candidate.capacityExcess * cfg.capacityPenaltyPerUnit +
          candidate.timeExcess * cfg.timePenaltyPerMinute;
        const bestPenalty =
          best.capacityExcess * cfg.capacityPenaltyPerUnit +
          best.timeExcess * cfg.timePenaltyPerMinute;
        const candidateCost = candidatePenalty + candidate.nextDistance +
          candidate.nextTotalMinutes / 60 * cfg.timeCostPerHour;
        const bestCost = bestPenalty + best.nextDistance +
          best.nextTotalMinutes / 60 * cfg.timeCostPerHour;
        return candidateCost < bestCost ? candidate : best;
      }, null);
      // Actualiza la ruta y los acumulados del camión seleccionado.
      const truck = trucks[chosen.index];
      truck.route.push(id);
      truck.demand = chosen.nextDemand;
      truck.distance = chosen.nextDistance;
      truck.serviceTime = chosen.nextServiceTime;
      truck.totalMinutes = chosen.nextTotalMinutes;
    });

    // Suma métricas de todos los camiones para evaluar la solución completa.
    const totalDistance = trucks.reduce((sum, truck) => sum + truck.distance, 0);
    const totalDemand = trucks.reduce((sum, truck) => sum + truck.demand, 0);
    const totalMinutes = trucks.reduce((sum, truck) => sum + truck.totalMinutes, 0);
    const capacityExcess = trucks.reduce(
      (sum, truck) => sum + Math.max(0, truck.demand - cfg.truckCapacity), 0
    );
    const timeExcess = trucks.reduce(
      (sum, truck) => sum + Math.max(0, truck.totalMinutes - cfg.maxWorkMinutes), 0
    );
    const penalty =
      capacityExcess * cfg.capacityPenaltyPerUnit +
      timeExcess * cfg.timePenaltyPerMinute;
    const travelMinutes = trucks.reduce((sum, truck) => sum + truck.distance / cfg.averageSpeed * 60, 0);
    const serviceTime = trucks.reduce((sum, truck) => sum + truck.serviceTime, 0);
    // Menor fitness es mejor: distancia, costo del tiempo y penalizaciones.
    const fitness = totalDistance + totalMinutes / 60 * cfg.timeCostPerHour + penalty;

    return {
      fitness, distance: totalDistance, demand: totalDemand,
      travelMinutes, serviceTime, totalMinutes,
      capacityExcess, timeExcess, penalty,
      trucks,
      feasible: capacityExcess === 0 && timeExcess === 0
    };
  }

  // Empaqueta el cromosoma y las métricas en un objeto de individuo.
  function describeIndividual(chromosome) {
    return { route: [...chromosome], chromosome: [...chromosome], ...evaluate(chromosome) };
  }

  // API pública que utilizan el algoritmo genético y la interfaz.
  return { createCustomers, getCustomers, depot: () => ({ ...depot }), distance, evaluate, describeIndividual };
})();