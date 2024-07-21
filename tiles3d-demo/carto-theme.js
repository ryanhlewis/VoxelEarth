import {
  unstable_createMuiStrictModeTheme as createMuiTheme,
  responsiveFontSizes
} from '@material-ui/core/styles';
import createSpacing from '@material-ui/core/styles/createSpacing';

const colors = {
  common: {
    black: '#2c3032',
    white: '#fff'
  },
  neutral: {
    50: '#f8f9f9',
    100: '#e1e3e4',
    200: '#cbcdcf',
    300: '#b4b8ba',
    400: '#9da2a6',
    500: '#868d91',
    600: '#6f777c',
    700: '#595f63',
    800: '#43474a',
    900: '#2c3032',
    A100: '#ddddde',
    A200: '#b9babb',
    A400: '#7c7e7f',
    A700: '#545759'
  },
  qualitative: {
    bold: {
      0: '#7F3C8D',
      1: '#11A579',
      2: '#3969AC',
      3: '#F2B701',
      4: '#E73F74',
      5: '#80BA5A',
      6: '#E68310',
      7: '#008695',
      8: '#CF1C90',
      9: '#f97b72',
      10: '#4b4b8f',
      11: '#A5AA99'
    }
  },
  shades: {
    dark: {
      100: '#2c3032', // Neutral900
      90: 'rgba(44, 48, 50, 0.9)',
      60: 'rgba(44, 48, 50, 0.6)',
      40: 'rgba(44, 48, 50, 0.4)',
      25: 'rgba(44, 48, 50, 0.25)',
      12: 'rgba(44, 48, 50, 0.12)',
      5: 'rgba(44, 48, 50, 0.05)'
    },
    light: {
      100: '#fff', // White
      60: 'rgba(255, 255, 255, 0.6)',
      40: 'rgba(255, 255, 255, 0.4)',
      20: 'rgba(255, 255, 255, 0.2)',
      12: 'rgba(255, 255, 255, 0.12)',
      5: 'rgba(255, 255, 255, 0.05)'
    }
  }
};

const variables = {
  palette: {
    type: 'light',
    common: {...colors.common},
    primary: {
      light: '#358be7',
      main: '#036fe2',
      dark: '#024d9e',
      contrastText: colors.common.white,
      relatedLight: 'rgba(3, 111, 226, 0.08)'
    },
    secondary: {
      light: '#6be2ad',
      main: '#47db99',
      dark: '#31996b',
      contrastText: colors.common.black,
      relatedLight: 'rgba(71, 219, 153, 0.08)'
    },
    error: {
      light: '#cd593b',
      main: '#c1300b',
      dark: '#872107',
      contrastText: colors.common.white,
      relatedDark: '#4d1304',
      relatedLight: '#f9ebe7'
    },
    warning: {
      light: '#f4b134',
      main: '#f29e02',
      dark: '#a96e01',
      contrastText: colors.common.black,
      relatedDark: '#603f00',
      relatedLight: '#fef6e6'
    },
    info: {
      light: '#34689f',
      main: '#024388',
      dark: '#012e5f',
      contrastText: colors.common.white,
      relatedDark: '#001a36',
      relatedLight: '#e6edf4'
    },
    success: {
      light: '#8cb24a',
      main: '#709f1d',
      dark: '#4e6f14',
      contrastText: colors.common.white,
      relatedDark: '#2c3f0b',
      relatedLight: '#f1f6e9'
    },
    text: {
      primary: colors.shades.dark[100],
      secondary: colors.shades.dark[60],
      hint: colors.shades.dark[40],
      disabled: colors.shades.dark[25]
    },
    background: {
      default: colors.neutral[50],
      paper: colors.common.white
    },
    other: {
      tooltip: colors.shades.dark[90],
      snackbar: colors.shades.dark[100],
      backdrop: colors.shades.dark[60],
      divider: colors.shades.dark[12]
    },
    grey: {
      ...colors.neutral
    },
    action: {
      active: colors.shades.dark[40],
      hover: colors.shades.dark[5],
      hoverOpacity: 0.08,
      selected: colors.shades.dark[12],
      selectedOpacity: 0.08,
      disabled: colors.shades.dark[25],
      disabledBackground: colors.shades.dark[12],
      disabledOpacity: 0.38,
      focus: colors.shades.dark[12],
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    },
    qualitative: {
      ...colors.qualitative
    }
  },

  typography: {
    htmlFontSize: 16,
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 16,
    lineHeight: 1.5,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
    fontSmoothing: 'antialiased',
    h1: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '6rem',
      lineHeight: 1.084,
      letterSpacing: '-0.016em',
      fontSmoothing: 'antialiased'
    },
    h2: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '4rem',
      lineHeight: 1.125,
      letterSpacing: '-0.008em',
      fontSmoothing: 'antialiased'
    },
    h3: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '3rem',
      lineHeight: 1.167,
      letterSpacing: '0em',
      fontSmoothing: 'antialiased'
    },
    h4: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '2.125rem',
      lineHeight: 1.177,
      letterSpacing: '0.007em',
      fontSmoothing: 'antialiased'
    },
    h5: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.334,
      letterSpacing: '0em',
      fontSmoothing: 'antialiased'
    },
    h6: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.2,
      letterSpacing: '0.007em',
      fontSmoothing: 'antialiased'
    },
    subtitle1: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.009em',
      fontSmoothing: 'antialiased'
    },
    subtitle2: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.715,
      letterSpacing: '0.007em',
      fontSmoothing: 'antialiased'
    },
    body1: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.028em',
      fontSmoothing: 'antialiased'
    },
    body2: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.429,
      letterSpacing: '0.018em',
      fontSmoothing: 'antialiased'
    },
    button: {
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.715,
      letterSpacing: '0.018em',
      textTransform: 'inherit',
      fontSmoothing: 'antialiased'
    },
    caption: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 600,
      fontSize: '0.75rem',
      lineHeight: 1.334,
      letterSpacing: '0.017em',
      fontSmoothing: 'antialiased'
    },
    overline: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
      fontSize: '0.625rem',
      lineHeight: 1.6,
      letterSpacing: '0.150em',
      textTransform: 'uppercase',
      fontSmoothing: 'antialiased'
    },
    charts: {
      fontFamily: '"Open Sans", sans-serif',
      fontWeight: 400,
      fontSize: 10,
      lineHeight: 1.6,
      letterSpacing: '0.150em',
      fontSmoothing: 'antialiased'
    }
  },
  spacing: 8
};

const spacing = createSpacing(variables.spacing);
const round = (value) => Math.round(value * 1e5) / 1e5;
const pxToRem = (size) => `${round(size / variables.typography.htmlFontSize)}rem`;

variables.typography.pxToRem = pxToRem;
variables.typography.round = round;

export const cartoThemeOptions = {
  themeName: 'CARTO',
  breakpoints: {
    keys: ['xs', 'sm', 'md', 'lg', 'xl'],
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    },
    unit: 'px',
    tep: 5
    // For more information about use this helper functions: https://material-ui.com/customization/spacing/#custom-spacing
    // up: f d(),
    // down: f down(),
    // between: f p(),
    // only: f only(),
    // width: f width(),
  },
  direction: 'ltr',
  mixins: {
    // gutters: f gutters(),
    toolbar: {
      minHeight: 56,
      '@media (min-width:0px) and (orientation: landscape)': {
        minHeight: 48
      },
      '@media (min-width:600px)': {
        minHeight: 56
      }
    }
  },
  palette: {
    type: 'light',
    common: {...variables.palette.common},
    primary: {...variables.palette.primary},
    secondary: {...variables.palette.secondary},
    error: {...variables.palette.error},
    warning: {...variables.palette.warning},
    info: {...variables.palette.info},
    success: {...variables.palette.success},
    contrastThreshold: 3,
    tonalOffset: 0.2,
    text: {...variables.palette.text},
    divider: 'rgba(0, 0, 0, 0.12)',
    other: {...variables.palette.other},
    background: {...variables.palette.background},
    charts: {
      axisLine: variables.palette.action.hover,
      maxLabel: variables.palette.text.secondary,
      disabled: variables.palette.text.disabled,
      axisPointer: colors.shades.dark[40]
    },
    // props: Object => Research,
    /* Custom Colors palette */
    grey: {...variables.palette.grey},
    action: {...variables.palette.action},
    qualitative: {...variables.palette.qualitative}
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.16),0px 1px 1px 0px rgba(0,0,0,0.08),0px 1px 3px 0px rgba(0,0,0,0.04)',
    '0px 3px 1px -2px rgba(0,0,0,0.16),0px 2px 2px 0px rgba(0,0,0,0.08),0px 1px 5px 0px rgba(0,0,0,0.04)',
    '0px 3px 3px -2px rgba(0,0,0,0.16),0px 3px 4px 0px rgba(0,0,0,0.08),0px 1px 8px 0px rgba(0,0,0,0.04)',
    '0px 2px 4px -1px rgba(0,0,0,0.16),0px 4px 5px 0px rgba(0,0,0,0.08),0px 1px 10px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.16),0px 5px 8px 0px rgba(0,0,0,0.08),0px 1px 14px 0px rgba(0,0,0,0.04)',
    '0px 3px 5px -1px rgba(0,0,0,0.16),0px 6px 10px 0px rgba(0,0,0,0.08),0px 1px 18px 0px rgba(0,0,0,0.04)',
    '0px 4px 5px -2px rgba(0,0,0,0.16),0px 7px 10px 1px rgba(0,0,0,0.08),0px 2px 16px 1px rgba(0,0,0,0.04)',
    '0px 5px 5px -3px rgba(0,0,0,0.16),0px 8px 10px 1px rgba(0,0,0,0.08),0px 3px 14px 2px rgba(0,0,0,0.04)',
    '0px 5px 6px -3px rgba(0,0,0,0.16),0px 9px 12px 1px rgba(0,0,0,0.08),0px 3px 16px 2px rgba(0,0,0,0.04)',
    '0px 6px 6px -3px rgba(0,0,0,0.16),0px 10px 14px 1px rgba(0,0,0,0.08),0px 4px 18px 3px rgba(0,0,0,0.04)',
    '0px 6px 7px -4px rgba(0,0,0,0.16),0px 11px 15px 1px rgba(0,0,0,0.08),0px 4px 20px 3px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.16),0px 12px 17px 2px rgba(0,0,0,0.08),0px 5px 22px 4px rgba(0,0,0,0.04)',
    '0px 7px 8px -4px rgba(0,0,0,0.16),0px 13px 19px 2px rgba(0,0,0,0.08),0px 5px 24px 4px rgba(0,0,0,0.04)',
    '0px 7px 9px -4px rgba(0,0,0,0.16),0px 14px 21px 2px rgba(0,0,0,0.08),0px 5px 26px 4px rgba(0,0,0,0.04)',
    '0px 8px 9px -5px rgba(0,0,0,0.16),0px 15px 22px 2px rgba(0,0,0,0.08),0px 6px 28px 5px rgba(0,0,0,0.04)',
    '0px 8px 10px -5px rgba(0,0,0,0.16),0px 16px 24px 2px rgba(0,0,0,0.08),0px 6px 30px 5px rgba(0,0,0,0.04)',
    '0px 8px 11px -5px rgba(0,0,0,0.16),0px 17px 26px 2px rgba(0,0,0,0.08),0px 6px 32px 5px rgba(0,0,0,0.04)',
    '0px 9px 11px -5px rgba(0,0,0,0.16),0px 18px 28px 2px rgba(0,0,0,0.08),0px 7px 34px 6px rgba(0,0,0,0.04)',
    '0px 9px 12px -6px rgba(0,0,0,0.16),0px 19px 29px 2px rgba(0,0,0,0.08),0px 7px 36px 6px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.16),0px 20px 31px 3px rgba(0,0,0,0.08),0px 8px 38px 7px rgba(0,0,0,0.04)',
    '0px 10px 13px -6px rgba(0,0,0,0.16),0px 21px 33px 3px rgba(0,0,0,0.08),0px 8px 40px 7px rgba(0,0,0,0.04)',
    '0px 10px 14px -6px rgba(0,0,0,0.16),0px 22px 35px 3px rgba(0,0,0,0.08),0px 8px 42px 7px rgba(0,0,0,0.04)',
    '0px 11px 14px -7px rgba(0,0,0,0.16),0px 23px 36px 3px rgba(0,0,0,0.08),0px 9px 44px 8px rgba(0,0,0,0.04)',
    '0px 11px 15px -7px rgba(0,0,0,0.16),0px 24px 38px 3px rgba(0,0,0,0.08),0px 9px 46px 8px rgba(0,0,0,0.04)'
  ],
  typography: {
    ...variables.typography
  },
  spacing: variables.spacing, // For custom spacing: https://material-ui.com/customization/spacing/#custom-spacing
  shape: {
    borderRadius: 4
  },
  transitions: {
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    }
    // create: f create(), => Research
    // getAutoHeightDuration: f getAutoHeightDuration(), => Research
  },
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        // Custom scrollbars
        '*::-webkit-scrollbar': {
          position: 'fixed',
          width: '5px'
        },
        '*::-webkit-scrollbar-track': {
          '-webkit-box-shadow': 'none',
          background: 'transparent'
        },
        '*::-webkit-scrollbar-thumb': {
          borderRadius: '3px',
          background: variables.palette.action.focus,
          outline: 'none'
        },

        // iOS Search clear button
        'input[type="search"]::-webkit-search-cancel-button': {
          '-webkit-appearance': 'none',
          height: spacing(2),
          width: spacing(2),
          display: 'block',
          backgroundImage: `url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAn0lEQVR42u3UMQrDMBBEUZ9WfQqDmm22EaTyjRMHAlM5K+Y7lb0wnUZPIKHlnutOa+25Z4D++MRBX98MD1V/trSppLKHqj9TTBWKcoUqffbUcbBBEhTjBOV4ja4l4OIAZThEOV6jHO8ARXD+gPPvKMABinGOrnu6gTNUawrcQKNCAQ7QeTxORzle3+sDfjJpPCqhJh7GixZq4rHcc9l5A9qZ+WeBhgEuAAAAAElFTkSuQmCC)`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: spacing(2)
        },

        // Mapbox controls
        '.mapboxgl-ctrl.mapboxgl-ctrl-attrib': {
          padding: spacing(0, 1),
          borderRadius: spacing(0.5, 0, 0, 0),

          '& .mapboxgl-ctrl-attrib-inner': {
            ...variables.typography.overline,
            textTransform: 'none',
            letterSpacing: '0.75px',

            '& a': {
              color: variables.palette.primary.main
            }
          },

          '&.mapboxgl-compact': {
            backgroundColor: 'transparent',
            right: spacing(0.5),
            bottom: spacing(2.5),

            // Mobile
            '@media (max-width: 600px)': {
              bottom: spacing(0.5)
            },

            '& .mapboxgl-ctrl-attrib-button': {
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20height='24'%20viewBox='0%200%2024%2024'%20width='24'%3E%3Cg%3E%3Crect%20fill='none'%20height='24'%20width='24'%20x='0'/%3E%3C/g%3E%3Cg%3E%3Cg%3E%3Cg%3E%3Cpath%20d='M11.88,9.14c1.28,0.06,1.61,1.15,1.63,1.66h1.79c-0.08-1.98-1.49-3.19-3.45-3.19C9.64,7.61,8,9,8,12.14%20c0,1.94,0.93,4.24,3.84,4.24c2.22,0,3.41-1.65,3.44-2.95h-1.79c-0.03,0.59-0.45,1.38-1.63,1.44C10.55,14.83,10,13.81,10,12.14%20C10,9.25,11.28,9.16,11.88,9.14z%20M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z%20M12,20c-4.41,0-8-3.59-8-8%20s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z'%20fill='${variables.palette.text.secondary}'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: 'rgba(255,255,255,.8)',
              top: 'auto',
              bottom: 0,
              right: 0,

              '&:not(:disabled):hover': {
                backgroundColor: 'rgba(255,255,255,.8)'
              }
            },

            '& .mapboxgl-ctrl-attrib-inner': {
              backgroundColor: 'rgba(255,255,255,.8)',
              padding: spacing(0.5, 1),
              borderRadius: spacing(1.5),
              marginRight: spacing(2.5),
              color: variables.palette.text.secondary
            },

            '&.mapboxgl-compact-show': {
              '& .mapboxgl-ctrl-attrib-button': {
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20height='24'%20viewBox='0%200%2024%2024'%20width='24'%3E%3Cpath%20d='M0%200h24v24H0z'%20fill='none'/%3E%3Cpath%20d='M19%206.41L17.59%205%2012%2010.59%206.41%205%205%206.41%2010.59%2012%205%2017.59%206.41%2019%2012%2013.41%2017.59%2019%2019%2017.59%2013.41%2012z'%20fill='white'/%3E%3C/svg%3E")`,
                backgroundColor: variables.palette.common.black,

                '&:not(:disabled):hover': {
                  backgroundColor: variables.palette.common.black
                }
              }
            }
          }
        }
      }
    },

    // Button
    MuiButton: {
      contained: {
        boxShadow: 'none'
      },
      outlined: {
        border: `2px solid ${variables.palette.text.primary}`,
        padding: '4px 14px',
        '&:hover': {
          borderWidth: '2px'
        },
        '&$disabled': {
          borderWidth: '2px'
        }
      },
      outlinedPrimary: {
        border: `2px solid ${variables.palette.primary.main}`,
        '&:hover': {
          borderWidth: '2px'
        }
      },
      outlinedSecondary: {
        border: `2px solid ${variables.palette.secondary.main}`,
        '&:hover': {
          borderWidth: '2px'
        },
        '&$disabled': {
          borderWidth: '2px'
        }
      },
      containedSizeSmall: {
        padding: '2px 12px',
        fontSize: pxToRem(12)
      },
      outlinedSizeSmall: {
        padding: '2px 12px',
        fontSize: pxToRem(12)
      },
      textSizeSmall: {
        padding: '2px 12px',
        fontSize: pxToRem(12)
      },
      containedSizeLarge: {
        padding: '16px 24px',
        fontSize: pxToRem(16)
      },
      containedSecondary: {
        '&:hover': {
          backgroundColor: variables.palette.secondary.light
        }
      },
      outlinedSizeLarge: {
        padding: '16px 24px',
        fontSize: pxToRem(16)
      },
      textSizeLarge: {
        padding: '16px 24px',
        fontSize: pxToRem(16)
      },
      startIcon: {
        marginRight: 6,
        marginLeft: -4,
        '&$iconSizeSmall': {
          marginLeft: -4
        },
        '&$iconSizeLarge': {
          marginRight: 8
        }
      },
      endIcon: {
        marginRight: -4,
        marginLeft: 6,
        '&$iconSizeSmall': {
          marginRight: -4
        },
        '&$iconSizeLarge': {
          marginLeft: 8
        }
      },
      iconSizeSmall: {
        '& > *:first-child': {
          fontSize: 20
        }
      },
      iconSizeMedium: {
        '& > *:first-child': {
          fontSize: 24
        }
      },
      iconSizeLarge: {
        '& > *:first-child': {
          fontSize: 24
        }
      }
    },
    MuiIconButton: {
      root: {
        padding: spacing(0.75),
        borderRadius: spacing(0.5),
        color: variables.palette.text.primary
      },
      colorPrimary: {
        '&:hover': {
          backgroundColor: colors.shades.dark[25]
        }
      },
      sizeSmall: {
        padding: spacing(0.25)
      }
    },

    MuiInputBase: {
      root: {
        '&$disabled .MuiInputAdornment-root': {
          color: variables.palette.action.disabled
        },
        '&$disabled .MuiTypography-root': {
          color: variables.palette.action.disabled
        }
      }
    },
    MuiOutlinedInput: {
      root: {
        '&$disabled': {
          backgroundColor: variables.palette.action.hover
        }
      },

      input: {
        ...variables.typography.body1,
        height: `${variables.typography.body1.lineHeight}em`,
        padding: spacing(3, 2, 1)
      },

      inputMarginDense: {
        ...variables.typography.body2,
        height: `${variables.typography.body2.lineHeight}em`,
        padding: spacing(1, 1.5),
        paddingTop: spacing(1),
        paddingBottom: spacing(1)
      },

      adornedStart: {
        '&$marginDense': {
          paddingLeft: spacing(1.5)
        }
      },
      adornedEnd: {
        '&$marginDense': {
          paddingRight: spacing(1.5)
        }
      },

      notchedOutline: {
        border: `2px solid ${variables.palette.text.disabled}`
      },

      multiline: {
        padding: spacing(2.75, 2, 1.25)
      }
    },
    MuiInputLabel: {
      root: {
        ...variables.typography.body1
      },

      formControl: {
        transform: 'translate(16px, 20px) scale(1)',

        '&$shrink': {
          ...variables.typography.caption,
          transform: 'translate(16px, 8px) scale(1)'
        },

        '&$marginDense': {
          ...variables.typography.caption,
          transform: 'translate(0, -20px) scale(1)',

          '&$shrink': {
            ...variables.typography.caption,
            transform: 'translate(0, -20px) scale(1)'
          }
        }
      },

      outlined: {
        '&$shrink': {
          ...variables.typography.caption,
          transform: 'translate(16px, 8px) scale(1)'
        },

        '&$marginDense': {
          ...variables.typography.caption,
          transform: 'translate(0, -20px) scale(1)',

          '&$shrink': {
            transform: 'translate(0, -20px) scale(1)'
          }
        }
      }
    },
    MuiInputAdornment: {
      root: {
        ...variables.typography.body1,
        alignItems: 'baseline',
        marginBottom: spacing(1.5),
        color: variables.palette.text.secondary,

        '&:disabled': {
          color: variables.palette.action.disabled
        },

        '& .MuiSvgIcon-root': {
          fontSize: `${variables.typography.body1.lineHeight}em`
        }
      },

      positionStart: {
        marginLeft: spacing(0.25)
      },

      positionEnd: {
        marginRight: spacing(0.25)
      },

      marginDense: {
        marginBottom: spacing(0),
        alignItems: 'center',
        ...variables.typography.body2,

        '& .MuiTypography-root': {
          ...variables.typography.body2
        },

        '& .MuiSvgIcon-root': {
          fontSize: `${variables.typography.body2.lineHeight}em`
        }
      }
    },
    MuiFormHelperText: {
      root: {
        ...variables.typography.caption,
        '&$contained': {
          marginTop: spacing(1)
        }
      },

      marginDense: {
        '&$contained': {
          marginLeft: spacing(0)
        }
      }
    },

    // Select
    MuiFormControl: {
      root: {
        width: '100%'
      }
    },
    MuiSelect: {
      selectMenu: {},

      root: {
        '&:hover': {
          backgroundColor: 'transparent'
        }
      },

      select: {
        '&:focus': {
          backgroundColor: 'transparent'
        }
      }
    },

    // Menu
    MuiMenuItem: {
      root: {
        ...variables.typography.body2
      }
    },

    // Autocomplete
    MuiAutocomplete: {
      inputRoot: {
        '&[class*="MuiOutlinedInput-root"]': {
          padding: spacing(3, 1.25, 0.5),

          '& .MuiAutocomplete-input': {
            padding: spacing(0, 1.25, 0.5)
          }
        },
        '&.MuiInputBase-marginDense.MuiOutlinedInput-root $input.MuiOutlinedInput-inputMarginDense':
          {
            paddingTop: spacing(0.25),
            paddingBottom: spacing(0.25)
          }
      }
    },

    // Checkbox
    MuiCheckbox: {
      root: {
        ...variables.typography.body2,
        padding: spacing(0.75),
        borderRadius: '50%',

        '& + .MuiFormControlLabel-label': {
          ...variables.typography.body2,
          marginLeft: spacing(0.25),
          color: variables.palette.text.primary
        },

        '& .MuiSvgIcon-root': {
          fontSize: spacing(3)
        }
      }
    },

    // RadioButton
    MuiRadio: {
      root: {
        ...variables.typography.body2,
        padding: spacing(0.75),
        borderRadius: '50%',

        '& + .MuiFormControlLabel-label': {
          ...variables.typography.body2,
          marginLeft: spacing(0.25),
          color: variables.palette.text.primary
        },

        '& .MuiSvgIcon-root': {
          fontSize: spacing(3)
        }
      }
    },

    // Tabs
    MuiTabs: {
      indicator: {
        height: 4,
        '&.colorPrimary': {
          backgroundColor: variables.palette.text.primary
        }
      },

      vertical: {
        '& $indicator': {
          width: 4
        },

        '& .MuiTab-root': {
          padding: spacing(0, 2),

          '& .MuiTab-wrapper': {
            alignItems: 'flex-start'
          }
        }
      }
    },

    // Tab
    MuiTab: {
      root: {
        padding: spacing(0, 1),
        marginRight: spacing(3),
        minWidth: '56px!important',
        '&[class*="MuiTab-labelIcon"] .MuiTab-wrapper': {
          flexFlow: 'row',
          alignItems: 'center'
        },
        '&[class*="MuiTab-labelIcon"] .MuiTab-wrapper > .MuiSvgIcon-root': {
          marginRight: spacing(1),
          marginBottom: 0
        }
      },
      textColorPrimary: {
        color: variables.palette.primary.main,
        opacity: 1,
        '&$selected': {
          color: variables.palette.text.primary
        },
        '&$disabled': {
          color: variables.palette.action.disabled
        }
      }
    },

    MuiDivider: {
      root: {
        backgroundColor: variables.palette.other.divider
      },
      light: {
        backgroundColor: colors.shades.light[12]
      }
    },

    // Switch
    MuiSwitch: {
      root: {
        height: spacing(4.5),
        width: spacing(6),
        padding: spacing(1),
        overflow: 'visible',

        '& + .MuiFormControlLabel-label': {
          ...variables.typography.body2,
          marginLeft: spacing(0.25),
          color: variables.palette.text.primary
        }
      },

      switchBase: {
        padding: spacing(1.5),
        borderRadius: '50%',
        transform: 'translate(1px, 1px)',
        color: variables.palette.text.secondary,

        '&$checked': {
          transform: 'translate(13px, 1px)',
          color: variables.palette.common.white,

          '& + $track': {
            opacity: 1
          }
        }
      },

      thumb: {
        width: spacing(1.25),
        height: spacing(1.25),
        boxShadow: 'none'
      },

      track: {
        height: 'auto',
        border: `2px solid ${variables.palette.text.secondary}`,
        borderRadius: spacing(2),
        opacity: 1,
        backgroundColor: variables.palette.common.white
      },

      colorPrimary: {
        '&$checked': {
          color: variables.palette.common.white,

          '& + $track': {
            backgroundColor: variables.palette.primary.main,
            borderColor: 'transparent'
          },

          '&$disabled': {
            color: variables.palette.grey[100],

            '& + $track': {
              backgroundColor: variables.palette.text.disabled
            }
          }
        },

        '&$disabled': {
          color: variables.palette.text.disabled,

          '& + $track': {
            opacity: 1,
            backgroundColor: variables.palette.common.white,
            borderColor: variables.palette.text.disabled
          }
        }
      },

      colorSecondary: {
        '&$checked': {
          color: variables.palette.common.white,

          '& + $track': {
            backgroundColor: variables.palette.secondary.main,
            borderColor: 'transparent'
          },

          '&$disabled': {
            color: variables.palette.grey[100],

            '& + $track': {
              backgroundColor: variables.palette.text.disabled
            }
          }
        },

        '&$disabled': {
          color: variables.palette.text.disabled,

          '& + $track': {
            opacity: 1,
            backgroundColor: variables.palette.common.white,
            borderColor: variables.palette.text.disabled
          }
        }
      },

      sizeSmall: {
        height: spacing(4.5),
        width: spacing(6),
        padding: spacing(1),

        '& $switchBase': {
          padding: spacing(1.5),
          transform: 'translate(0, 1px)',

          '&$checked': {
            transform: 'translate(15px, 1px)'
          }
        },
        '& $thumb': {
          width: spacing(1.25),
          height: spacing(1.25)
        }
      }
    },

    // Breadcrumbs
    MuiBreadcrumbs: {
      li: {
        '& .MuiTypography-root': {
          ...variables.typography.body2,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        },
        '& .MuiSvgIcon-root': {
          fontSize: `${variables.typography.body2.lineHeight}em`,
          marginRight: spacing(1)
        }
      },

      separator: {
        marginLeft: spacing(0.5),
        marginRight: spacing(0.5)
      }
    },

    // Lists
    MuiList: {
      root: {
        // Indent sublevels, ugly but needed to avoid issues with hover
        '& .MuiList-root': {
          '& .MuiListItem-root': {
            paddingLeft: spacing(4)
          },

          '& .MuiList-root': {
            '& .MuiListItem-root': {
              paddingLeft: spacing(6)
            },

            '& .MuiList-root': {
              '& .MuiListItem-root': {
                paddingLeft: spacing(8)
              },

              '& .MuiList-root': {
                '& .MuiListItem-root': {
                  paddingLeft: spacing(10)
                }
              }
            }
          }
        }
      }
    },

    MuiListItemIcon: {
      root: {
        minWidth: spacing(5.75),
        marginLeft: spacing(0.75),

        '& .MuiSvgIcon-root': {
          fontSize: spacing(3)
        }
      }
    },

    MuiListItemAvatar: {
      root: {
        '& .MuiAvatar-root': {
          height: spacing(4.5),
          width: spacing(4.5)
        },
        '& .MuiSvgIcon-root': {
          fontSize: spacing(2.5)
        }
      }
    },

    // Tooltip
    MuiTooltip: {
      tooltip: {
        ...variables.typography.caption,
        backgroundColor: variables.palette.other.tooltip
      },

      arrow: {
        color: variables.palette.other.tooltip
      }
    },

    // Dialog
    MuiDialogTitle: {
      root: {
        padding: spacing(3, 3, 2)
      }
    },

    MuiDialogContent: {
      root: {
        '& .MuiFormGroup-root': {
          padding: spacing(1, 0)
        }
      }
    }
  },
  props: {
    MuiButtonBase: {
      disableRipple: true
    },
    MuiButton: {
      disableElevation: true
    },
    MuiTextField: {
      variant: 'outlined'
    },
    MuiSelect: {
      variant: 'outlined',
      MenuProps: {
        getContentAnchorEl: null,
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left'
        }
      }
    },
    MuiOutlinedInput: {
      notched: false
    },
    MuiCheckbox: {
      size: 'small',
      color: 'primary'
    },
    MuiRadio: {
      size: 'small',
      color: 'primary'
    },
    MuiSwitch: {
      color: 'primary'
    },
    MuiInputAdornment: {
      disableTypography: true
    },
    MuiListItemText: {
      primaryTypographyProps: {
        variant: 'body2',
        style: {fontWeight: variables.typography.fontWeightBold},
        noWrap: true
      },
      secondaryTypographyProps: {variant: 'caption'}
    },
    MuiSkeleton: {
      animation: 'wave'
    },
    MuiTabs: {
      indicatorColor: 'primary',
      textColor: 'primary',
      TabIndicatorProps: {
        classes: {
          colorPrimary: 'colorPrimary'
        }
      }
    },
    MuiTypography: {
      color: 'textPrimary'
    },
    MuiDialogContentText: {
      variant: 'body2'
    }
  }
};

export function createTheme(options = {}) {
  const themeOptions = {
    ...cartoThemeOptions,
    ...options
  };

  let theme = createMuiTheme(themeOptions);

  theme = responsiveFontSizes(theme, {
    breakpoints: themeOptions.breakpoints.keys,
    disableAlign: false,
    factor: 2,
    variants: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'subtitle1',
      'subtitle2',
      'body1',
      'body2',
      'button',
      'caption',
      'overline'
    ]
  });

  return theme;
}
