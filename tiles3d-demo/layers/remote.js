import {fetchMap} from '@deck.gl/carto';
import {DataFilterExtension, _TerrainExtension as TerrainExtension} from '@deck.gl/extensions';
import {FADE_IN_COLOR} from './transitions';

const tooltipOverride = (new URL(location.href)).searchParams.has('tooltip');

const cartoMapId = '60f339dd-450b-4c54-a402-41eb2d7a06af';
// const cartoMapId = '87ded938-6337-45b6-8de1-4c2813e3d9c6';
export async function fetchRemoteLayers() {
  const {layers} = await fetchMap({cartoMapId});
  if(location.host.includes('127.0.0.1')) {
    console.log(layers.map(l => `${l.constructor.layerName} ${l.props.cartoLabel}: ${l.props.id}`).join('\n'));
  }

  if(tooltipOverride) {
    // Clone the building layer so we can use it for the hover effect
    const tppLayer = layers.find(l => l.id === '0fh9zbk');
    if (tppLayer) {
      layers.push(tppLayer.clone({id: '0fh9zbk-hover'}));
    }
  }

  return layers.map(l => {
    const props = {
      extensions: [new TerrainExtension()],
      transitions: FADE_IN_COLOR
    }
    if (['ft3t0pi', '0fh9zbk', '0fh9zbk-hover'].includes(l.id)) {
      props.extensions.push(new DataFilterExtension({filterSize: 1}));
      if (l.id === 'ft3t0pi') {
        props.getFilterValue = f => f.properties.distance_to_nearest_tree;
      } else {
        props.getFilterValue = f => f.properties.tpp;
        props.uniqueIdProperty = 'id';
      }
      props.filterRange = [0, 10000];

      // Add autohighlight for tooltip. Rather than draping the polygons using the
      // TerrainExtension, draw them as extruded 3D objects so picking works
      if (l.id === '0fh9zbk-hover') {
        props.extensions = [new DataFilterExtension({filterSize: 1})]; 
        // NOTE: this layer is hidden using layerFilter in Map.jsx
        props.pickable = true;
        props.extruded = true;

        props.elevationScale = 1;
        props.uniqueIdProperty = 'id';

        // Uncomment to see geometry under 3D tiles
        props.parameters = {depthTest: false};

        // Adjust data to have 3D offset. This doesn't work perfectly with picking
        // for some reason.
        // const zOffset = 200;
        props.getElevation = 40; // Estimate for building height
        props.dataTransform = d => {
          const zOffset = d.polygons.numericProps.height.value;
          const {positions} = d.polygons;
          const {value, size} = positions;
          const n = value.length / size;
          const newValue = new Float32Array(3 * n);
          for (let i = 0; i < n; i++) {
            newValue[3 * i + 0] = value[size * i + 0];
            newValue[3 * i + 1] = value[size * i + 1];
            newValue[3 * i + 2] = zOffset[i] < 100 ? 250 : zOffset[i]; // Work around broken data
          }

          positions.value = newValue;
          positions.size = 3;
          return d;
       }
      }
    }
    return l.clone(props);
  });
}
