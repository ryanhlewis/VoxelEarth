import React from 'react';
import {IconButton, makeStyles, useMediaQuery} from '@material-ui/core';
import {useAppState} from '../../state';
import {ReactComponent as IconNavigationCloseWhite} from '../../assets/icons/icon-navigation-close.svg';

const useStyles = makeStyles((theme) => ({
  btn: {
    '& svg': {
      width: theme.spacing(3),
      height: theme.spacing(3),
      '& path': {
        transformOrigin: '0 0',
        transform: 'scale(1.2)'
      }
    },
    [theme.breakpoints.up('md')]: {
      '& svg': {
        width: 'auto',
        height: 'auto',
        '& path': {
          transform: 'none'
        }
      }
    }
  },
  btnWhite: {
    '& svg path': {
      fill: theme.palette.common.white
    }
  }
}));

const SidebarClose = ({className, primary}) => {
  const classes = useStyles();
  const {reset} = useAppState();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return (
    <IconButton
      classes={{root: [classes.btn, className || ''].join(' '), colorInherit: classes.btnWhite}}
      aria-label="Previous"
      color={primary ? 'primary' : 'inherit'}
      onClick={reset}
      size={isDesktop ? 'small' : 'medium'}
    >
      <IconNavigationCloseWhite />
    </IconButton>
  );
};

export default SidebarClose;
