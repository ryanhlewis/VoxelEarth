import React from 'react';
import {makeStyles, useMediaQuery, useTheme} from '@material-ui/core';
import {DeckGL} from '@deck.gl/react';

import {useAppState} from '../../state';
import {SIDEBAR_WIDTH} from '../Sidebar/Sidebar';
import CoverLogo from '../Cover/CoverLogo';
import CoverAttribution from '../Cover/CoverAttribution';
import GeolocationSearchBar from '../Main/GeolocationSearchBar';

const SCORES = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

const LABELS = [
  'This moderately urban area has fewer children and elderly, and is far from dense vegetation. It has average-sized buildings and lower-than-average Land Surface Temperature and Nitrogen Dioxide levels. It has a high Tree Planting Priority Score, suggesting a need for more trees.',
  'This highly urbanized area with mostly middle-aged or older residents and few children is far from dense vegetation and surrounded by small buildings. Moderate temperature and nitrogen dioxide levels are noted. It has a moderately high tree-planting priority, hinting at potential benefits.',
  'In this high urbanity area, there\'s a large elderly population and fewer children. It\'s closer to dense vegetation than average and has fewer, smaller buildings, suggesting compact living. With lower Land Surface Temperature and Nitrogen Dioxide levels, and a high Tree Planting Priority Score, it could benefit from more trees.',
  'This urban area with many young and elderly inhabitants has a high density of buildings, moderate distance to greenery, and slightly elevated Land Surface Temperature and Nitrogen Dioxide levels, suggesting a need for healthier planning. It has a high Tree Planting Priority Score.',
  'This is a densely populated urban area, with notable youth and senior citizens. It lacks green spaces, has high buildings count, and increased Land Surface Temperature and Nitrogen Dioxide levels. Yet, it has a high Tree Planting Priority due to its exposure score.'
];

const useStyles = makeStyles((theme) => ({
  mapWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#061714'
  },
  root: {
    position: 'relative',
    height: '100%',
    flexGrow: 1,
    transition: theme.transitions.create(['margin', 'background-image'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  rootShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginBottom: theme.spacing(15),
    height: 'auto',
    [theme.breakpoints.up('md')]: {
      marginBottom: 0,
      height: '100%',
      marginRight: `${SIDEBAR_WIDTH.xs}`,
      [theme.breakpoints.up('lg')]: {
        marginRight: `${SIDEBAR_WIDTH.lg}`
      }
    }
  },
  rootBlocked: {
    pointerEvents: 'none'
  },
  mapBlock: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    // backgroundImage:
    //   'linear-gradient(to bottom, rgba(15, 17, 20, 0.84), rgba(15, 17, 20, 0.8) 65%, rgba(15, 17, 20, 0.2))',
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  mapBlockHidden: {
    opacity: 0,
    pointerEvents: 'none'
  }
}));

const useDevicePixelsOverride = parseFloat((new URL(location.href)).searchParams.get('useDevicePixels'));
let currentViewState;

const LONGITUDE_RANGE = [14.3, 14.55];
const LATITUDE_RANGE = [50, 50.15];

const Map = () => {
  const classes = useStyles();
  const {currentSlide, layers, viewState, setHoveredFeatureId} = useAppState();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const theme = useTheme();

  // Retina rendering very expensive on mobile, so limit resolution
  const useDevicePixels = isNaN(useDevicePixelsOverride) ? (isDesktop ? true : 0.75) : useDevicePixelsOverride;

  return (
    <>
      <div
        className={[classes.root, currentSlide > 0 ? classes.rootShift : classes.rootBlocked].join(
          ' '
        )}
        id="map"
      >
        <div className={classes.mapWrapper} id="mapWrapper">
          <DeckGL 
            initialViewState={viewState}
            controller={{touchRotate: true, minZoom: 0, maxZoom: 20, inertia: 250}}
            layers={layers}
            onViewStateChange={({viewState}) => {
              // viewState.longitude = Math.min(LONGITUDE_RANGE[1], Math.max(LONGITUDE_RANGE[0], viewState.longitude));
              // viewState.latitude = Math.min(LATITUDE_RANGE[1], Math.max(LATITUDE_RANGE[0], viewState.latitude));
              currentViewState = viewState;
              return viewState;
            }}
            useDevicePixels={useDevicePixels}
            getTooltip={({object}) => {
              setHoveredFeatureId(object && object.properties.id);
              if (!object) return;
              const {tpp} = object.properties;
              const i = Math.floor(tpp * 5);
              return {
                html: `<h3>Tree Planting Priority: ${SCORES[i]}</h3><div>${LABELS[i]}</div>`,
                style: {borderRadius: '10px', backgroundColor: theme.palette.common.black, fontSize: '0.8em', width: '400px'}
              }
            }}
            layerFilter={({layer, renderPass}) => {
              if (layer.id === '0fh9zbk-hover' && renderPass === 'screen') {
                return false;
              }
              return true;
            }}
          >
          </DeckGL>
          <GeolocationSearchBar />

        </div>
        
      </div>
      <CoverLogo />

      <div
        className={[classes.mapBlock, currentSlide > 0 ? classes.mapBlockHidden : ''].join(' ')}
      />
      <CoverAttribution />

    </>
  );
};

export default Map;

// Helper to extract view states for slides.js
window.print = () => {
  const {latitude, longitude, bearing, pitch, zoom, position} = currentViewState;
  const height = position[2];
  console.log(JSON.stringify({latitude, longitude, bearing, pitch, zoom, height}).replaceAll('"', '').replaceAll(',', ', ').replaceAll(':', ': '));
};
