export const TEMPERATURE_COLOR_SCALE = {
  labels: [26, 28, 30, 32, 34, 36].map(n => `${n} °C`),
  values: [20, 28, 30, 32, 34, 36],
  colors: ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921']
}

export const DISTANCE_COLOR_SCALE = {
  labels: [10, 50, 100, 250, 500].map(n => `${n}m`),
  values: [0, 50, 100, 250, 500],
  colors: ['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177']
}

export const PRIORITY_COLOR_SCALE = {
  labels: ['low', '-', 'med.', '-', 'high'],
  values: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
  colors: ['#ffffb2', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']
}
