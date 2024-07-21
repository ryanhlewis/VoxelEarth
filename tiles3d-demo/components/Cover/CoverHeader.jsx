import React from 'react';
import {Typography, makeStyles, Box} from '@material-ui/core';
import CoverBase from './CoverBase';
import cartoSymbol from '../../assets/images/carto-components-logo-negative-symbol.svg';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'none',
    pointerEvents: 'none',
    padding: theme.spacing(2, 3),
    width: '100%',
    transform: 'none',
    left: 0,
    top: 0,
    maxWidth: '100%',
    backgroundImage:
      'linear-gradient(to top, rgba(15, 17, 20, 0.02), rgba(15, 17, 20, 0.64) 63%, rgba(15, 17, 20, 0.92))',
    [theme.breakpoints.up('md')]: {
      display: 'block'
    }
  },
  content: {
    display: 'flex'
  },
  logo: {
    width: theme.spacing(5),
    height: theme.spacing(5)
  },
  text: {
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)'
  }
}));

const CoverHeader = () => {
  const classes = useStyles();

  return (
    <CoverBase slidesToShow={[1, 2, 3, 4, 5, 6, 7, 8]} className={classes.root}>
      <div className={classes.content}>
        <img className={classes.logo} src={cartoSymbol} alt="CARTO" />
        <Box pl={1.5}>
          <Typography variant="overline" className={classes.text} color="inherit">
            STORY MAP
          </Typography>
          <Typography variant="subtitle1" className={classes.text} color="inherit">
            The Importance of Vegetation for Cities. Prague, Czech Republic.
          </Typography>
        </Box>
      </div>
    </CoverBase>
  );
};

export default CoverHeader;
