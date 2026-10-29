/* Operadores genéticos. Cada cromosoma es una permutación de clientes:
   todos aparecen una sola vez, en el orden en que deben visitarse. */
window.GeneticOperators = (() => {
  const cfg = window.AG_CONFIG;

  // Entero aleatorio desde cero hasta maxExclusive - 1.
  function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
  }

  /* Escoge dos individuos distintos y devuelve como padre la ruta con menor
     fitness (el problema se formula como una minimización). */
  function tournamentSelection(population) {
    // Torneo determinístico de tamaño 2: gana el individuo con menor fitness.
    const firstIndex = randomInt(population.length);
    let secondIndex = randomInt(population.length - 1);
    if (secondIndex >= firstIndex) secondIndex += 1;
    const first = population[firstIndex];
    const second = population[secondIndex];
    return (first.fitness <= second.fitness ? first : second).chromosome.slice();
  }

  /* Realiza cruce de un punto. Para conservar una permutación válida, mantiene
     el prefijo del primer padre y completa con genes únicos del segundo. */
  function onePointCrossover(parent1, parent2) {
    // Sin cruce se copian los padres directamente.
    if (Math.random() >= cfg.crossoverRate) {
      return [parent1.slice(), parent2.slice()];
    }
    if (parent1.length < 2) return [parent1.slice(), parent2.slice()];

    // El corte siempre deja al menos un gen a cada lado.
    const cut = 1 + randomInt(parent1.length - 1);
    // Cruce de un punto con reparación de permutación:
    // conserva el prefijo de un padre y completa con los genes únicos del otro.
    function makeChild(prefixParent, fillParent) {
      const prefix = prefixParent.slice(0, cut);
      const used = new Set(prefix);
      const suffix = fillParent.filter(gene => !used.has(gene));
      return prefix.concat(suffix);
    }
    return [makeChild(parent1, parent2), makeChild(parent2, parent1)];
  }

  /* Mutación puntual por inserción: toma un cliente y lo coloca en otra
     posición, sin perder ni duplicar genes de la ruta. */
  function pointMutation(route) {
    const mutated = route.slice();
    if (Math.random() < cfg.mutationRate && mutated.length > 1) {
      // Reubica un único cliente sin duplicarlo ni perderlo de la permutación.
      const from = randomInt(mutated.length);
      const [gene] = mutated.splice(from, 1);
      const to = randomInt(mutated.length + 1);
      mutated.splice(to, 0, gene);
    }
    return mutated;
  }

  // Operadores que utiliza el ciclo evolutivo.
  return { tournamentSelection, onePointCrossover, pointMutation };
})();