import {TransitionInterpolator} from '@deck.gl/core';
import {lerp} from '@math.gl/core';

import {flyToViewport, getFlyToDuration} from '@math.gl/web-mercator';

const LINEARLY_INTERPOLATED_PROPS = ['bearing', 'pitch', 'position'];
const DEFAULT_OPTS = {
  speed: 1.2,
  curve: 1.414
};

// Enhanced FlyToInterpolator from deck.gl that also handles `position`
export default class FlyToInterpolator extends TransitionInterpolator {
  constructor(opts) {
    super({
      compare: ['longitude', 'latitude', 'zoom', 'bearing', 'pitch', 'position'],
      extract: ['width', 'height', 'longitude', 'latitude', 'zoom', 'bearing', 'pitch', 'position'],
      required: ['width', 'height', 'latitude', 'longitude', 'zoom', 'position']
    });
    this.opts = {...DEFAULT_OPTS, ...opts};
  }

  interpolateProps(startProps, endProps, t) {
    const viewport = flyToViewport(startProps, endProps, t, this.opts);

    // Linearly interpolate 'bearing' and 'pitch'.
    // If pitch/bearing are not supplied, they are interpreted as zeros in viewport calculation
    // (fallback defined in WebMercatorViewport)
    // Because there is no guarantee that the current controller's ViewState normalizes
    // these props, safe guard is needed to avoid generating NaNs
    for (const key of LINEARLY_INTERPOLATED_PROPS) {
      viewport[key] = lerp(startProps[key] || 0, endProps[key] || 0, t);
    }

    return viewport;
  }

  // computes the transition duration
  getDuration(startProps, endProps) {
    let {transitionDuration} = endProps;
    if (transitionDuration === 'auto') {
      // auto calculate duration based on start and end props
      transitionDuration = getFlyToDuration(startProps, endProps, this.opts);
    }
    return transitionDuration;
  }
}
