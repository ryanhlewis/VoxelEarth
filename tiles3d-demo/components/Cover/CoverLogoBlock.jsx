import React from 'react';
import {Link, Typography, makeStyles} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    '& + $root': {
      marginLeft: theme.spacing(4)
    },
    [theme.breakpoints.up('md')]: {
      '& + $root': {
        marginLeft: theme.spacing(7)
      }
    }
  },
  text: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      marginBottom: theme.spacing(3)
    }
  },
  logos: {
    display: 'flex',
    alignItems: 'center',
    '& img': {
      maxHeight: theme.spacing(4),
      width: 'auto'
    },
    '& img + img': {
      marginLeft: theme.spacing(3)
    },
    [theme.breakpoints.up('md')]: {
      '& img': {
        maxHeight: theme.spacing(5)
      },
      '& img + img': {
        marginLeft: theme.spacing(7)
      }
    }
  },
  rootMobileHorizontal: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      alignItems: 'center',
      '& $text': {
        marginBottom: 0,
        marginRight: theme.spacing(2)
      },
      '&$root + $root': {
        marginLeft: theme.spacing(0),
        marginTop: theme.spacing(2)
      }
    }
  }
}));

const CoverLogoBlock = ({title, images, className, textClassName, mobileHorizontal}) => {
  const classes = useStyles();

  return (
    <div
      className={[
        classes.root,
        className ? className : '',
        mobileHorizontal ? classes.rootMobileHorizontal : ''
      ].join(' ')}
    >
      <Typography
        component="h5"
        variant="caption"
        className={[classes.text, textClassName ? textClassName : ''].join(' ')}
        color="inherit"
      >
        {title}
      </Typography>
      <div className={`logos ${classes.logos}`}>
        {images.map(({src, href, alt, className}, i) => (
          <Link key={`image-${i}`} href={href} target="_blank">
            <img {...(!!className && {className})} src={src} alt={alt} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CoverLogoBlock;
