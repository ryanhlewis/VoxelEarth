import {viteStaticCopy} from 'vite-plugin-static-copy';
import svgr from 'vite-plugin-svgr';
import zlib from 'zlib';

// Rewrite URLs in instantiation & tilejson response to use our endpoint
const writeBody = (buffer, res) => {
  let remoteBody = buffer.toString();
  const isMapInstantiation = remoteBody.includes('nrows');
  const endpoint = isMapInstantiation ? 'carto-api' : 'carto-data-api';
  remoteBody = remoteBody.replace('https://gcp-us-east1.api.carto.com/', `http://127.0.0.1:8080/${endpoint}/`); // Point at non-selfHandleResponse endpoint
  res.write(remoteBody);
  res.end();
}

export default {
  plugins: [
    svgr(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/images/google-3d-tiles-og-image.png',
          dest: 'assets/images'
        }
      ]
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 8080,
    proxy: {
      '/carto-api': {
        target: 'https://gcp-us-east1.api.carto.com',
        selfHandleResponse : true,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/carto-api/, ''),
        configure: proxy => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['cache-control'] = 'public,max-age=100000,must-revalidate';

            // Modify response for tilejson to update URLs
            let body = [];

            proxyRes.on('data', function (chunk) {
              body.push(chunk);
            });
            proxyRes.on('end', function () {
              body = Buffer.concat(body);

              if (proxyRes.headers['content-encoding']) {
                zlib.unzip(body, (err, buffer) => {
                  if (!err) {
                    writeBody(buffer, res);
                  } else {
                    console.error(err);
                  }
                });
              } else {
                writeBody(body, res);
              }
            });
          });
        }
      },
      '/carto-data-api': {
        target: 'https://gcp-us-east1.api.carto.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/carto-data-api/, ''),
        configure: proxy => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['cache-control'] = 'public,max-age=100000,must-revalidate';
          });
        }
      },
      '/v1': {
        target: 'https://tile.googleapis.com',
        changeOrigin: true,
        rewrite: path => path,
        // configure: proxy => {
        //   proxy.on('proxyRes', proxyRes => {
        //     // Cache 3D tiles locally for better perf (during development)
        //     proxyRes.headers['cache-control'] = 'public,max-age=100000,must-revalidate';
        //   });
        // }
      }
    }

  }
}
