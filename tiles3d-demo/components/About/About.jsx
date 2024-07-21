import React, {forwardRef, useImperativeHandle, useState, useEffect} from 'react';
import {
  Button,
  makeStyles,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  IconButton,
  Typography,
  Link,
  Paper,
  Divider,
  Hidden
} from '@material-ui/core';
import {ReactComponent as IconNavigationClose} from '../../assets/icons/icon-navigation-close.svg';
import {ReactComponent as IconGithub} from '../../assets/icons/icon-github.svg';
import cartoLogo from '../../assets/images/carto-components-logo.svg';
import googleMapsLogo from '../../assets/images/google-maps-platform-logo.png';
import codeImage from '../../assets/images/code.svg';
import AboutText from './AboutText';
import bigqueryImage from '../../assets/images/bigquery.svg';

const ABOUT_HASH = 'about';

const useStyles = makeStyles((theme) => ({
  paper: {
    margin: 0,
    maxHeight: '100%',
    height: '100%',
    borderRadius: 0,
    [theme.breakpoints.up('md')]: {
      maxHeight: `calc(100% - ${theme.spacing(18)}px)`,
      height: 'auto',
      margin: theme.spacing(4),
      borderRadius: theme.shape.borderRadius
    }
  },
  title: {
    padding: theme.spacing(3),
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    right: theme.spacing(2),
    top: '50%',
    transform: 'translateY(-50%)',
    '& svg path': {
      fill: theme.palette.text.secondary
    }
  },
  content: {
    padding: theme.spacing(2, 3, 0, 3)
  },
  logosText: {
    marginBottom: theme.spacing(2),
    fontWeight: 400
  },
  card: {
    padding: theme.spacing(3, 3, 4.5),
    backgroundColor: theme.palette.grey[50],
    display: 'flex',
    alignItems: 'center'
  },
  cardText: {
    flex: 1,
    [theme.breakpoints.up('md')]: {
      paddingRight: theme.spacing(3)
    }
  },
  cardTextTitle: {
    textTransform: 'uppercase',
    color: theme.palette.primary.dark,
    marginBottom: theme.spacing(1)
  },
  cardTextButtons: {
    marginTop: theme.spacing(3),
    '& > a + a': {
      marginTop: theme.spacing(1.5)
    },
    [theme.breakpoints.up('md')]: {
      display: 'flex',
      '& > a + a': {
        marginLeft: theme.spacing(1),
        marginTop: 0
      }
    }
  },
  climateEngineLogo: {
    maxWidth: theme.spacing(17)
  },
  divider: {
    margin: theme.spacing(4.5, 0, 2)
  }
}));

const About = ({}, forwardedRef) => {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  useEffect(() => {
    const hashChangeListener = () => {
      setOpen(window.location.hash === `#${ABOUT_HASH}`);
    };
    window.addEventListener('hashchange', hashChangeListener);
    hashChangeListener();
    return () => {
      window.removeEventListener('hashchange', hashChangeListener);
    };
  }, [setOpen]);

  useImperativeHandle(forwardedRef, () => ({
    show: () => {
      setOpen(true);
    }
  }));

  return (
    <Dialog
      open={open}
      scroll="paper"
      aria-labelledby="about-title"
      aria-describedby="about-description"
      onClose={() => {
        window.location.hash = '';
      }}
      classes={{
        paper: classes.paper
      }}
    >
      <DialogTitle id="about-title" disableTypography classes={{root: classes.title}}>
        <Typography color="textPrimary" variant="h6">
          About this story map
        </Typography>
        <IconButton
          classes={{root: classes.closeBtn}}
          aria-label="Close"
          color="inherit"
          onClick={() => {
            window.location.hash = '';
          }}
        >
          <IconNavigationClose />
        </IconButton>
      </DialogTitle>
      <DialogContent classes={{root: classes.content}}>
        <DialogContentText component="div" id="about-description" tabIndex={-1}>
          <AboutText
            title="This CARTO story map is brought to you in collaboration with Google Maps Platform and deck.gl"
            imageBlocks={[
              {
                title: 'With data stored in',
                textClassName: classes.logosText,
                mobileHorizontal: true,
                images: [
                  {
                    src: bigqueryImage,
                    alt: 'Google Big Query'
                  }
                ]
              },
              {
                title: 'Connected by',
                textClassName: classes.logosText,
                mobileHorizontal: true,
                images: [
                  {
                    src: cartoLogo,
                    alt: 'CARTO'
                  }
                ]
              },
              {
                title: 'Photorealistic 3D Tiles provided by ',
                textClassName: classes.logosText,
                mobileHorizontal: true,
                images: [
                  {
                    src: googleMapsLogo,
                    alt: 'Google Maps'
                  }
                ]
              }
            ]}
          >
            <p>
              With the new{' '}
              <Link
                underline="always"
                href="https://developers.google.com/maps/documentation/tile/3d-tiles-overview"
                target="_blank"
              >
                Map Tiles API
              </Link>{' '}
              release, Google Maps Platform provides Photorealistic 3D Tiles in over 2500 cities across 49 countries. CARTO and deck.gl have been working on integrating Photorealistic 3D Tiles into {' '} 
              <Link underline="always" href="https://deck.gl/" target="_blank">
                deck.gl
              </Link> to bring more realism and context to your visualizations. 
  
            </p>
            
            <p><br/>
              The data behind it is stored on{' '}
              <Link underline="always" href="https://cloud.google.com/bigquery/" target="_blank">
                BigQuery
              </Link>{' '}
              and visualized using{' '}
              <Link underline="always" href="https://carto.com" target="_blank">
                CARTO
              </Link>{' '}
              and{' '}
              <Link underline="always" href="https://deck.gl/" target="_blank">
                deck.gl
              </Link>{' '}
              libraries.
            </p>
          </AboutText>

          <Paper classes={{root: classes.card}} elevation={0}>
            <div className={classes.cardText}>
              <Typography variant="overline" component="h4" className={classes.cardTextTitle}>
                How has this been made
              </Typography>
              <Typography variant="body2" color="textSecondary" component="p">
                CARTO offers a simple way to add Tables or direct SQL from BigQuery. We've imported some datasets in BigQuery (land temperature, buildings, scores, etc...) and they are visualized on top of Google 3D maps to bring more realism and context to your visualizations.
              </Typography>
              <div className={classes.cardTextButtons}>
                {/* <Button
                  href="https://cloud.google.com/blog/products/maps-platform/richer-data-visualization-google-maps-platform-using-deckgl"
                  component="a"
                  target="_blank"
                  variant="contained"
                  size="small"
                  color="primary"
                >
                  Read the technical blog
                </Button> */}
                <Button
                  href="https://github.com/CartoDB/tiles3d-demo"
                  component="a"
                  target="_blank"
                  size="small"
                  color="primary"
                  startIcon={<IconGithub />}
                >
                  Check it on GitHub
                </Button>
              </div>
            </div>
            <Hidden smDown>
              <img src={codeImage} />
            </Hidden>
          </Paper>

          <Divider className={classes.divider} />

          {<AboutText title="Data sources">
            <p>
            All the data, except for Photorealistic 3D Tiles, used for this visualization is available as public data in BigQuery (
              <strong>cartobq.public_account</strong>). The original sources for the data are:
            </p>
            <ul>
              <li>
                <Link href="https://land.copernicus.eu/pan-european/high-resolution-layers/forests/tree-cover-density" target="_blank">
                  Tree Cover Density from Copernicus
                </Link>{' '}
              </li>
              <li>
                <Link
                  href="https://developers.google.com/earth-engine/datasets/catalog/LANDSAT_LC09_C02_T1_TOA"
                  target="_blank"
                >
                  Landsat Surface Temperature
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.eea.europa.eu/data-and-maps/data/interpolated-air-quality-data-2"
                  target="_blank"
                >
                  NO2 concentration from the European Environment Agency
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.worldpop.org/"
                  target="_blank"
                >
                  Population by age class from WorldPop
                </Link>
              </li>
              <li>
                <Link href="https://wiki.openstreetmap.org/wiki/BigQuery_dataset" target="_blank">
                Points of interests and Building footprints from OpenStreetMap
                </Link>
              </li>
              <li>
                <Link
                  href="https://carto.com/spatial-data-catalog/browser/dataset/cdb_spatial_fea_91e200cf/"
                  target="_blank"
                >
                  Urbanity level from CARTO
                </Link>
              </li>
            </ul>
          </AboutText> }

          <Divider className={classes.divider} />
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default forwardRef(About);
