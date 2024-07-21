import React from 'react';
import {Button, Typography, makeStyles, Box, useMediaQuery} from '@material-ui/core';
import {ReactComponent as NextIcon} from '../../assets/icons/icon-navigation-arrow-forward.svg';
import CoverBase from './CoverBase';
import {useAppState} from '../../state';

const useStyles = makeStyles((theme) => ({
  root: {
    top: theme.spacing(13.5),
    [theme.breakpoints.up('md')]: {
      top: theme.spacing(8),
      '@media (min-height: 760px)': {
        top: theme.spacing(15)
      }
    }
  },
  title: {
    margin: theme.spacing(1, 0, 2),
    [theme.breakpoints.up('md')]: {
      margin: theme.spacing(1.5, 0, 4)
    }
  },
  pretitle: {
    fontWeight: 500,
    '& strong': {
      fontWeight: 600
    }
  },
  text: {
    opacity: 0.6
  }
}));

const CoverHero = () => {
  const {next} = useAppState();
  const classes = useStyles();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return (
    <CoverBase className={classes.root}>
      <Typography
        className={classes.pretitle}
        color="inherit"
        variant={isDesktop ? 'h5' : 'subtitle1'}
      >
        Photorealistic 3D Tiles + deck.gl + CARTO
      </Typography>
      <Box className={classes.title}>
        <Typography color="inherit" variant={isDesktop ? 'h3' : 'h4'}>
          The Importance of Vegetation for Cities. 
        </Typography>
      </Box>
      <Box mb={4}>
        <Typography color="inherit" variant={isDesktop ? 'body1' : 'body2'}>
          This CARTO story map is brought to you in collaboration with Google Maps Platform and deck.gl.
        </Typography>
      </Box>
      <Button
        size={isDesktop ? 'large' : 'medium'}
        variant="contained"
        color="primary"
        onClick={next}
        endIcon={<NextIcon />}
      >
        Start
      </Button>
    </CoverBase>
  );
};

export default CoverHero;
