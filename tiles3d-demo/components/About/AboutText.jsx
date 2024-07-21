import React from 'react';
import {makeStyles, Typography} from '@material-ui/core';
import CoverLogoBlock from '../Cover/CoverLogoBlock';

const useStyles = makeStyles((theme) => ({
  title: {
    color: theme.palette.primary.dark,
    marginBottom: theme.spacing(1.5)
  },
  logos: {
    color: theme.palette.text.secondary,
    margin: theme.spacing(4.5, 0, 6),
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      flexDirection: 'row'
    }
  },
  text: {
    '& p': {
      margin: 0
    }
  }
}));

const AboutText = ({title, children, imageBlocks}) => {
  const classes = useStyles();

  return (
    <>
      <Typography component="h2" variant="subtitle1" className={classes.title}>
        {title}
      </Typography>
      <Typography className={classes.text} component="div" variant="body2" color="textPrimary">
        {children}
      </Typography>
      {imageBlocks?.length && (
        <div className={classes.logos}>
          {imageBlocks.map((ib, i) => (
            <CoverLogoBlock key={`logoblock-${i}`} {...ib} />
          ))}
        </div>
      )}
    </>
  );
};

export default AboutText;
