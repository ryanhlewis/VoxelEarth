import {rgb} from 'd3-color';

export async function loadScript(url) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  const head = document.querySelector('head');
  head.appendChild(script);
  return new Promise((resolve) => {
    script.onload = resolve;
  });
}

export function colorToRGBArray(color) {
  if (!color) {
    return [255, 255, 255];
  }
  if (Array.isArray(color)) {
    return color.slice(0, 3);
  }
  const c = rgb(color);
  return [c.r, c.g, c.b];
}
