import React from 'react';
import {makeStyles} from '@material-ui/core';
import CoverBase from './CoverBase';
import cartoLogo from '../../assets/images/carto-components-logo-negative-logo.svg';
import deckGlLogo from '../../assets/images/deckgl-logo.png';
import googleMapsPlatformLogo from '../../assets/images/google-maps-platform.png';
import CoverLogoBlock from './CoverLogoBlock';

const useStyles = makeStyles((theme) => ({
  root: {
    bottom: theme.spacing(5),
    '@media (min-height: 760px)': {
      bottom: theme.spacing(9)
    }
  },
  content: {
    display: 'flex'
  },
  text: {
    opacity: 0.6
  },
  climateEngineLogo: {
    maxWidth: theme.spacing(17)
  },
  googleMapsBlock: {
    [theme.breakpoints.down('sm')]: {
      '& .logos': {
        flexDirection: 'column',
        alignItems: 'flex-start',
        '& img': {
          maxHeight: theme.spacing(3)
        }
      }
    },
    [theme.breakpoints.up('md')]: {
      '& .logos a + a': {
        marginLeft: theme.spacing(3)
      }
    }
  }
}));

const CoverFooter = () => {
  const classes = useStyles();

  return (
    <CoverBase className={classes.root}>
      <div className={classes.content}>
        <CoverLogoBlock
          title="A story map by"
          textClassName={classes.text}
          images={[
            {
              src: cartoLogo,
              href: 'https://carto.com/',
              alt: 'CARTO'
            }
          ]}
        />
        <CoverLogoBlock
          title="In collaboration with"
          textClassName={classes.text}
          className={classes.googleMapsBlock}
          images={[
            {
              src: googleMapsPlatformLogo,
              alt: 'Google Maps Platform'
            },
            {
              src: deckGlLogo,
              alt: 'Deck.gl'
            }
          ]}
        />
      </div>
    </CoverBase>
  );
};

export default CoverFooter;
