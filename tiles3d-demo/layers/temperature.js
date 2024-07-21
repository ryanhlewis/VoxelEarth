import {CartoLayer, colorBins, MAP_TYPES} from '@deck.gl/carto';
import {DataFilterExtension, _TerrainExtension as TerrainExtension} from '@deck.gl/extensions';
import {colorToRGBArray} from '../utils';
import {TEMPERATURE_COLOR_SCALE} from './colorScales';
import {FADE_IN_COLOR} from './transitions';
const {colors, values} = TEMPERATURE_COLOR_SCALE;

export const TemperatureLayer = new CartoLayer({
  id: 'temperature',
  connection: '3dtiles-demo',
  type: MAP_TYPES.RASTER,
  data: 'cartobq.public_account.temperature_raster_int8_new',
  formatTiles: 'binary',
  tileSize: 256,
  getFillColor: colorBins({
    attr: 'band_1',
    domain: values,
    colors: colors.map(colorToRGBArray)
  }),

  opacity: 0.5,
  transitions: FADE_IN_COLOR,
  extensions: [new DataFilterExtension({filterSize: 1}), new TerrainExtension()],
  getFilterValue: f => f.properties.band_1,
  filterRange: [0, 100]
});
