import React from 'react';
import { makeStyles } from '@material-ui/core';
import { useAppState } from '../../state';

export const SIDEBAR_RAW_WIDTH = {
  xs: 400,
  xsNr: 400,
  lg: 460,
  lgNr: 460
};

const useStyles = makeStyles((theme) => ({
  root: {
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    paddingRight: theme.spacing(1.5),
    paddingBottom: theme.spacing(0.25),
    position: 'absolute',
    display: 'flex',
    alignItems: 'flex-end',
    [theme.breakpoints.down('xs')]: {
      textAlign: 'right',
      maxWidth: theme.spacing(26.75),
      paddingRight: theme.spacing(1)
    },
    '&:not(.startPage)': {
      [theme.breakpoints.down('sm')]: {
        right: theme.spacing(1),
        bottom: theme.spacing(19.5),
      },
      [theme.breakpoints.up('md')]: {
        right: SIDEBAR_RAW_WIDTH.xs + theme.spacing(1)
      },
      [theme.breakpoints.up('lg')]: {
        right: SIDEBAR_RAW_WIDTH.lg + theme.spacing(1)
      },
    },
    '& span': {
      color: theme.palette.common.white,
      fontSize: theme.spacing(1.25)
    }
  }
}));

const CoverAttribution = () => {
  const classes = useStyles();
  const {currentSlide, credits} = useAppState();

  return (
    <div className={[classes.root, !currentSlide ? 'startPage' : ''].join(' ')}>
      <span>{credits}</span>
    </div>
  );
};

export default CoverAttribution;
