/* Parámetros centralizados del algoritmo genético.
   Object.freeze evita que la interfaz u otros módulos los cambien por accidente. */
window.AG_CONFIG = Object.freeze({
  // Valores exigidos para la población y los operadores de evolución.
  populationSize: 1000,
  eliteCount: 2,
  crossoverRate: 0.90,
  mutationRate: 0.02,
  tournamentSize: 2,
  maxGenerations: 200,
  targetFitness: 0.01,
  // Tamaño de la instancia del problema y configuración de la flota.
  customerCount: 10,
  truckCount: 3,
  truckCapacity: 12,
  maxWorkMinutes: 360,
  averageSpeed: 35,          // unidades de distancia por hora
  serviceMinutesPerCustomer: 6,
  // Peso del tiempo en el costo y castigos para las restricciones incumplidas.
  timeCostPerHour: 10,
  capacityPenaltyPerUnit: 1000,
  timePenaltyPerMinute: 100,
  randomSeed: null           // null = nueva simulación aleatoria
});