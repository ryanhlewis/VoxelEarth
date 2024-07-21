import GL from '@luma.gl/constants';

// Match blending settings from Kepler
// https://github.com/keplergl/kepler.gl/blob/master/src/constants/default-settings.js
export default {
  ADDITIVE: {
    blendFunc: [GL.SRC_ALPHA, GL.DST_ALPHA],
    blendEquation: GL.FUNC_ADD
  },
  NORMAL: {
    blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
    blendEquation: [GL.FUNC_ADD, GL.FUNC_ADD]
  },
  SUBTRACTIVE: {
    blendFunc: [GL.ONE, GL.ONE_MINUS_DST_COLOR, GL.SRC_ALPHA, GL.DST_ALPHA],
    blendEquation: [GL.FUNC_SUBTRACT, GL.FUNC_ADD]
  }
};
