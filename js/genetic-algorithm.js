/* Control principal del algoritmo genético: inicialización, evolución,
   conservación del historial y armado de los resultados. */
window.GeneticAlgorithm = (() => {
  const cfg = window.AG_CONFIG;
  const operators = window.GeneticOperators;
  const problem = window.RouteProblem;

  // Mezcla una copia del arreglo usando Fisher-Yates para crear rutas aleatorias.
  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Evalúa una ruta y la convierte en un individuo con sus métricas.
  function evaluateRoute(route) {
    return { route: route.slice(), chromosome: route.slice(), ...problem.evaluate(route) };
  }

  // Ordena de menor a mayor fitness porque se busca minimizar el costo.
  function sortPopulation(population) {
    population.sort((a, b) => a.fitness - b.fitness);
    return population;
  }

  // Genera populationSize permutaciones aleatorias de todos los clientes.
  function createInitialPopulation() {
    const baseRoute = problem.getCustomers().map(c => c.id);
    const population = [];
    for (let i = 0; i < cfg.populationSize; i++) {
      population.push(evaluateRoute(shuffle(baseRoute)));
    }
    return sortPopulation(population);
  }

  // Ejecuta una simulación completa y devuelve individuos, historial y mejor ruta.
  function run() {
    problem.createCustomers();
    let population = createInitialPopulation();
    // Conserva una copia de la población antes de aplicar operadores genéticos.
    const initialPopulation = population.map(ind => ({ ...ind, route: ind.route.slice() }));
    const history = [];
    let generationsExecuted = 0;
    let stopReason = "Se alcanzó el máximo de generaciones.";

    // Cada vuelta registra estadísticas, revisa parada y produce otra generación.
    for (let generation = 0; generation < cfg.maxGenerations; generation++) {
      const best = population[0];
      const averageFitness = population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;
      // Guarda indicadores para las gráficas y el análisis posterior.
      history.push({
        generation,
        bestFitness: best.fitness,
        averageFitness,
        feasibleCount: population.filter(ind => ind.feasible).length,
        bestDistance: best.distance
      });
      generationsExecuted = generation;

      // La meta se comprueba antes de crear la generación siguiente.
      if (best.fitness < cfg.targetFitness) {
        stopReason = `Se alcanzó el criterio de parada: fitness < ${cfg.targetFitness}.`;
        break;
      }
      if (generation === cfg.maxGenerations - 1) break;

      // Construye la nueva generación preservando directamente a los élites.
      const nextPopulation = [];
      // Elitismo: los dos mejores pasan intactos a la siguiente generación.
      for (let i = 0; i < cfg.eliteCount; i++) {
        nextPopulation.push({
          ...population[i],
          route: population[i].route.slice(),
          chromosome: population[i].chromosome.slice(),
          trucks: population[i].trucks.map(truck => ({ ...truck, route: truck.route.slice() }))
        });
      }

      // Selecciona padres, cruza sus cromosomas, muta hijos y calcula su fitness.
      while (nextPopulation.length < cfg.populationSize) {
        const parent1 = operators.tournamentSelection(population);
        const parent2 = operators.tournamentSelection(population);
        const [child1, child2] = operators.onePointCrossover(parent1, parent2);
        nextPopulation.push(evaluateRoute(operators.pointMutation(child1)));
        if (nextPopulation.length < cfg.populationSize) {
          nextPopulation.push(evaluateRoute(operators.pointMutation(child2)));
        }
      }
      population = sortPopulation(nextPopulation);
    }

    // Garantiza que el historial refleje la población final aunque el ciclo haya acabado
    // por límite de generaciones, sin duplicar el último punto si ya está registrado.
    // Copia profunda de las rutas para separar los resultados de la población activa.
    const copyIndividual = ind => ({
      ...ind,
      route: ind.route.slice(),
      chromosome: ind.chromosome.slice(),
      trucks: ind.trucks.map(truck => ({ ...truck, route: truck.route.slice() }))
    });
    const finalPopulation = population.map(copyIndividual);
    const best = finalPopulation[0];
    // Devuelve todos los datos que la interfaz necesita para presentar resultados.
    return {
      customers: problem.getCustomers(),
      initialPopulation: initialPopulation.map(copyIndividual),
      finalPopulation,
      history,
      generationsExecuted: history.length,
      stopReason,
      best,
      config: { ...cfg }
    };
  }

  return { run };
})();