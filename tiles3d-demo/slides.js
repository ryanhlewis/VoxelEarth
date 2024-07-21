import {TEMPERATURE_COLOR_SCALE, DISTANCE_COLOR_SCALE, PRIORITY_COLOR_SCALE} from './layers/colorScales';

export default [
  /* 0 */ {
    layers: ['google-3d'],
    view: {latitude: 50.081033020810736, longitude: 14.451093643141064, bearing: 0, pitch: 40, zoom: 17, height: 400},
    orbit: true
  },
  /* 1 */ {
    layers: ['google-3d'],
    view: {latitude: 50.10650491896325, longitude: 14.417186789690248, bearing: 80, pitch: 70, zoom: 17.5, height: 200},
    orbit: true
  },
  /* 2 */ {
    layers: ['google-3d', 'temperature'],
    view: {latitude: 50.097923939967586, longitude: 14.449545135073347, bearing: -43.50888344569848, pitch: 47.70381729182906, zoom: 14.066421513772516, height: 221.10726674564285},
    legend: {title: 'Temperature', ...TEMPERATURE_COLOR_SCALE},
    slider: true
  },
  /* 3 */ {
    layers: ['google-3d', 'iyd8wi'],
    view: {latitude: 50.106134139314676, longitude: 14.418551788315758, bearing: -1.5982979378544293, pitch: 46.98403655241639, zoom: 16.157034959911423, height: 221.02488150953326}
  },
  /* 4 */ {
    layers: ['google-3d', 'ft3t0pi'], // Top priority Buildings
    view: {latitude: 50.098638970057976, longitude: 14.430949347805848, bearing: -58.668795330078694, pitch: 58.268384344242605, zoom: 17.751310628564266, height: 210},
    legend: {title: 'Distance from trees', ...DISTANCE_COLOR_SCALE},
    slider: true,
    orbit: true
  },
  /* 5 */ {
    layers: ['google-3d', '0fh9zbk', '0fh9zbk-hover'], // Tree Planting Priority
    view: {latitude: 50.098337089228885, longitude: 14.423039897397192, bearing: 41.67155588940855, pitch: 57.83916048618412, zoom: 17, height: 242.7711712},
    legend: {title: 'Priority', ...PRIORITY_COLOR_SCALE},
    slider: true
  }
];
