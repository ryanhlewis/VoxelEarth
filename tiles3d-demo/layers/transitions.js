import {Easing} from '@tweenjs/tween.js';

export const FADE_IN_COLOR = {
  getFillColor: {
    duration: 1000,
    easing: Easing.Cubic.In,
    enter: value => [value[0], value[1], value[2], 0]
  }
}
