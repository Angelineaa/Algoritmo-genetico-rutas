# RouteLab: optimización de rutas con algoritmo genético

Simulador en JavaScript que utiliza un algoritmo genético para buscar
rutas de reparto de bajo costo para una flota de camiones. Se ejecuta directamente
en el navegador y muestra las poblaciones inicial y final, las rutas asignadas,
el fitness, las restricciones, el análisis de convergencia y las gráficas.

## Objetivo del problema

Una empresa debe repartir paquetes entre clientes ubicados en distintas
coordenadas. Cada cliente tiene una demanda y un tiempo de servicio. La simulación
busca minimizar la distancia y el tiempo total de entrega, manteniendo cada camión
dentro de sus límites de capacidad y jornada diaria.

Los clientes y sus ubicaciones se generan aleatoriamente al iniciar cada
simulación; por lo tanto, los resultados pueden cambiar entre ejecuciones.


## Parámetros del modelo

Los valores se encuentran centralizados en `js/config.js`.

| Parámetro | Valor |
|---|---:|
| Tamaño de población | 1.000 individuos |
| Elitismo | 2 individuos |
| Selección | Torneo determinístico de tamaño 2 |
| Cruce | Un punto, con probabilidad del 90% |
| Mutación | Inserción de un gen, con probabilidad del 2% |
| Criterio de parada | Fitness menor que 0,01 |
| Límite de seguridad | 200 generaciones |
| Clientes | 10 |
| Camiones | 3 |
| Capacidad por camión | 12 unidades |
| Jornada máxima | 360 minutos por camión |
| Velocidad promedio | 35 unidades de distancia por hora |
| Servicio por cliente | 6 minutos |

El límite de 200 generaciones evita que una ejecución continúe indefinidamente
si no alcanza el umbral de fitness. La interfaz indica si se detuvo por alcanzar
la meta o por llegar al límite.

## Representación y funcionamiento del algoritmo

### Cromosoma

Cada individuo contiene una permutación de los identificadores de los clientes.
Por ejemplo, `[3, 1, 4, 2, ...]` representa el orden en que se consideran las
visitas. Cada cliente aparece exactamente una vez. Al evaluar el cromosoma, el
programa asigna secuencialmente cada cliente al camión factible con menor costo
incremental.

### Función de fitness

El problema se plantea como una **minimización**. La función utilizada es:

```text
fitness = distancia total
        + (tiempo total en horas × costo por hora)
        + penalización por restricciones incumplidas
```

La penalización suma:

```text
exceso de capacidad × 1.000
+ exceso de jornada en minutos × 100
```

La demanda de todos los clientes se mantiene fija, pero su reparto entre
camiones depende del orden del cromosoma. El tiempo incluye el recorrido y el
servicio de los clientes.

### Ciclo evolutivo

1. Se generan clientes y una población inicial de rutas aleatorias.
2. Se evalúa y ordena la población de menor a mayor fitness.
3. Se guardan estadísticas de la generación y se verifica el criterio de parada.
4. Los dos mejores individuos pasan a la nueva generación sin alteraciones.
5. Se seleccionan padres mediante torneos de dos individuos distintos.
6. Se aplica cruce de un punto con reparación para mantener cromosomas válidos.
7. Cada hijo puede recibir una mutación por inserción de un cliente.
8. Se evalúan y ordenan los hijos; el ciclo continúa hasta alcanzar la meta o el
   máximo de generaciones.

## Resultados de la interfaz

- **Métricas:** mejor fitness, distancia total, tiempo y generaciones ejecutadas.
- **Mejor ruta:** secuencia de clientes asignada a cada camión, demanda, tiempo y
  estado de restricciones.
- **Convergencia:** evolución del mejor fitness y comparación con el promedio de
  la población.
- **Análisis:** mejora respecto de la población inicial y cumplimiento de las
  restricciones.
- **Poblaciones:** tablas paginadas para inspeccionar individuos iniciales y
  finales, ordenados por fitness.

## Estructura del proyecto

```text
.
├── index.html                 # Estructura de la página y carga de scripts.
├── styles.css                 # Paleta, tipografía, disposición y estilos responsive.
└── js/
    ├── config.js              # Parámetros del algoritmo y del problema.
    ├── problem.js             # Clientes, asignación a camiones y función fitness.
    ├── genetic-operators.js   # Selección, cruce y mutación.
    ├── genetic-algorithm.js   # Población, generaciones, elitismo y parada.
    ├── ui.js                  # Métricas, tablas, análisis y gráficas.
    └── main.js                # Eventos de la página y ejecución del algoritmo.
```

Los scripts se cargan en `index.html` en el orden de sus dependencias: primero
configuración y modelo, luego operadores y algoritmo, y finalmente interfaz y
punto de entrada.

## Notas y limitaciones

- Chart.js y las fuentes tipográficas son recursos externos; si no hay conexión,
  el algoritmo sigue ejecutándose, pero las gráficas o fuentes pueden no cargar.

