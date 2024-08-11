import {useMediaQuery} from '@material-ui/core';
import React, {useState, createContext, useCallback, useContext, useEffect} from 'react';
import {LinearInterpolator} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import FlyToInterpolator from './layers/fly-to-interpolator.js';
import {Easing} from '@tweenjs/tween.js';

import slides from './slides';
import {createGoogle3DLayer} from './layers/google-3d';
import {TemperatureLayer} from './layers/temperature';
import {fetchRemoteLayers} from './layers/remote';

const hash = window.location.hash;
let currentSlide = hash !== '' ? parseInt(hash.slice(1)) : 0;
if (isNaN(currentSlide) || !slides[currentSlide]) {
  currentSlide = 0;
}

const {view} = slides[0];
const initAppState = {
  credits: '',
  currentSlide,
  viewState: {...view, position: [0, 0, view.height], zoom: view.zoom - 1}
};

const LIMITED_EXTENT = [14.42, 50.09, 14.44, 50.12];
const FULL_EXTENT = [14.3, 50, 14.55, 50.15];
const transitionInterpolator = new LinearInterpolator(['bearing', 'longitude', 'latitude']);
export const AppStateContext = createContext(initAppState);

export const AppStateStore = ({children}) => {
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [credits, setCredits] = useState(initAppState.credits);
  const [currentSlide, setCurrentSlide] = useState(initAppState.currentSlide);
  const [filterValue, setFilterValue] = useState(null);
  const [hoveredFeatureId, setHoveredFeatureId] = useState(null);
  const [viewState, setViewState] = useState(initAppState.viewState);
  const [loadRemoteLayers, setLoadRemoteLayers] = useState(false);

  const Google3DLayer = createGoogle3DLayer(setCredits);
  const localLayers = [Google3DLayer, TemperatureLayer];
  const [allLayers, setAllLayers] = useState(localLayers);
  const [layers, setLayers] = useState(localLayers);

  const orbit = useCallback(previousTransition => {
    setViewState((viewState) => ({
      ...viewState,
      bearing: viewState.bearing + 120,
      transitionDuration: previousTransition ? 20000 : 25000, // TODO should match gradients with easing
      transitionEasing: previousTransition ? x => x : Easing.Quadratic.In,
      transitionInterpolator,
      onTransitionEnd: orbit
    }));
  }, []);

  const updateViewState = function (viewState, shouldOrbit) {
    if(currentSlide) setLoadRemoteLayers(true);
    orbit();
    // setViewState({
    //   transitionDuration: 5000,
    //   ...viewState,
    //   transitionEasing: Easing.Quadratic.InOut,
    //   transitionInterpolator: new FlyToInterpolator({curve: 1.1}),
    //   onTransitionEnd: () => {
    //     setLoadRemoteLayers(true);
    //     if (shouldOrbit) {
    //       orbit();
    //     }
    //   }
    // });
  };

  useEffect(() => {
    // Defer load of remote layers until initial zoom in completes
    if (!loadRemoteLayers) return;
    const layers = fetchRemoteLayers().then(remoteLayers => { ;
      setAllLayers(localLayers.concat(remoteLayers));
    })
  }, [loadRemoteLayers]);

  useEffect(
    () => {
      const {layers: visibleLayers, view, orbit: shouldOrbit} = slides[currentSlide];
      setLayers(allLayers.map(l => {
        const visible = visibleLayers.indexOf(l.id) !== -1;
        const props = {visible};

        // Limit to single zoom level to avoid flashing (due to fade in transition)
        // and to limit data use on mobile
        props.minZoom = 0;
        props.maxZoom = 20;
        // props.extent = isDesktop ? FULL_EXTENT : LIMITED_EXTENT;

        return visible ? l.clone(props) : null;
      }));
      if (view && view.longitude !== undefined) {
        updateViewState({latitude: 0, longitude: 0, zoom: 0, bearing: 0, pitch: 0, position: [0, 0, view.height || 200], ...view}, shouldOrbit);

      }
    },
    [currentSlide]
  );
  useEffect(
    () => {
      setLayers(layers => layers.map(l => {
        const props = {};
        if (filterValue !== null && l && l.id !== 'google-3d') {
          props.filterRange = [filterValue - 0.00001, 10000];
        }
        props.highlightedFeatureId = hoveredFeatureId;

        return l && l.clone(props);
      }));
    },
    [filterValue, hoveredFeatureId]
  );

  const flyToLocation = useCallback((latitude, longitude) => {
    setViewState({
      latitude,
      longitude,
      zoom: 17,
      pitch: 50,
      bearing: 0,
      transitionDuration: 2000,
      transitionInterpolator: new FlyToInterpolator(),
    });
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        next: () => {
          setCurrentSlide(currentSlide => Math.min(currentSlide + 1, slides.length - 1));
        },
        prev: () => {
          setCurrentSlide(currentSlide => Math.max(currentSlide - 1, 0));
        },
        reset: () => {
          setCurrentSlide(0);
        },
        credits,
        setFilterValue,
        setHoveredFeatureId,
        currentSlide,
        layers,
        viewState,
        flyToLocation,
        slidesNumber: slides.length
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export const AppStateContextConsumer = AppStateContext.Consumer;

export function useAppState() {
  return useContext(AppStateContext);
}
