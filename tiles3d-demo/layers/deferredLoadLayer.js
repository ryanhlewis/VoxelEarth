import {CompositeLayer} from '@deck.gl/core';

// Utility to create a layer that only is initialized
// (and thus data loaded) once visible
export default function DeferredLoadLayer(createLayer, onClone) {
  let subLayer = null;
  return class DeferredLoadLayer extends CompositeLayer {
    static layerName = 'DeferredLoadLayer';

    clone(props) {
      if (onClone) {
        props = onClone({props, layer: subLayer});
      }
      if (subLayer) {
        subLayer = subLayer.clone(props);
      }
      return super.clone(props);
    }

    renderLayers() {
      const {visible} = this.props;

      // Only create sublayer lazily if visible
      if (!visible) {
        return [];
      }
      if (!subLayer) {
        subLayer = createLayer().clone({
          id: `deferred-${this.id}`
        });
      }
      return [subLayer];
    }
  };
}
