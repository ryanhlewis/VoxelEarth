import React from 'react';
import {makeStyles} from '@material-ui/core';
import googleLogo from '../../assets/icons/google_on_non_white_hdpi.png';
import { useAppState } from '../../state';

const useStyles = makeStyles((theme) => ({
  root: {
    bottom: theme.spacing(1),
    left: theme.spacing(1),
    paddingLeft: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.25),
    position: 'absolute',
    display: 'flex',
    alignItems: 'flex-end',
    '&:not(.startPage)': { 
      [theme.breakpoints.down('sm')]: {
        left: theme.spacing(1),
        bottom: theme.spacing(19.5)
      },
    },
    '& a, & img': {
      height: theme.spacing(3),
      width: 'auto',
      display: 'inline-block'
    }
  }
}));

const CoverLogo = () => {
  const classes = useStyles();
  const { currentSlide } = useAppState();

  return (
    <div className={[classes.root, currentSlide === 0 ? 'startPage' : ''].join(' ')}>
      <a href="https://google.com" target="_blank" alt="Google">
        <img alt="Google" src={googleLogo} />
      </a>
    </div>
  );
};

export default CoverLogo;
