import React, {useEffect, useState, forwardRef} from 'react';
import {
  makeStyles,
  Card,
  CardMedia,
  CardContent,
  Typography,
  useMediaQuery
} from '@material-ui/core';
import {useAppState} from '../../state';
import {alpha} from '@material-ui/core/styles/colorManipulator';

const isFirefox = navigator?.userAgent?.toLowerCase()?.indexOf('firefox') > -1;

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: isFirefox ? 'auto' : 'overlay',
    borderBottom: '1px solid transparent',
    transition: theme.transitions.create(['border-color', 'transform'], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.short
    })
  },
  rootOnScroll: {
    borderBottomColor: theme.palette.divider
  },
  rootAfter: {
    transform: 'translateX(100%)'
  },
  rootBefore: {
    transform: 'translateX(-100%)'
  },
  rootShown: {
    transform: 'translateX(0)'
  },
  media: {
    position: 'sticky',
    top: 0,
    left: 0,
    paddingTop: '57.4%',
    width: '100%',
    '&:after': {
      content: '""',
      width: '100%',
      height: theme.spacing(9),
      top: 0,
      left: 0,
      backgroundImage:
        'linear-gradient(to top, rgba(15, 17, 20, 0.02), rgba(15, 17, 20, 0.64) 63%, rgba(15, 17, 20, 0.92))',
      position: 'absolute'
    }
  },
  content: {
    padding: theme.spacing(2.5, 3),
    flex: 1,
    zIndex: 1,
    backgroundColor: theme.palette.grey[50],
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(4, 6)
    }
  },
  pretitle: {
    padding: theme.spacing(1, 0, 0.5),
    borderTop: `2px solid ${theme.palette.primary.main}`,
    fontWeight: 600,
    display: 'inline-block'
  },
  title: {
    color: theme.palette.primary.dark,
    marginBottom: theme.spacing(1.5),
    [theme.breakpoints.up('md')]: {
      marginBottom: theme.spacing(2)
    }
  },
  subtitle: {
    color: theme.palette.primary.dark,
    marginBottom: theme.spacing(3),
    [theme.breakpoints.up('md')]: {
      marginBottom: theme.spacing(4.5)
    }
  },
  text: {
    '& p': {
      margin: 0
    }
  },
  imageAttribution: {
    position: 'absolute',
    bottom: theme.spacing(1.5),
    left: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    padding: theme.spacing(0.5, 1),
    backgroundColor: alpha(theme.palette.common.black, 0.6),
    '&, & p, & a': {
      color: theme.palette.common.white,
      margin: 0,
      textTransform: 'none',
      letterSpacing: 0
    },
    '& a': {
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline'
      }
    }
  },
  rootShrinked: {
    overflowY: 'hidden',
    borderBottomColor: 'transparent',
    '& $media': {
      display: 'none'
    }
  }
}));

const SidebarSlide = (
  {title, subtitle, text, image, imageAttribution, slide, children, shrinked},
  cardRef
) => {
  const classes = useStyles();
  const [isOnScroll, setIsOnScroll] = useState(false);
  const {currentSlide, slidesNumber} = useAppState();
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('md'));

  useEffect(() => {
    if (cardRef?.current) {
      const item = cardRef.current;

      const scrollListener = () => {
        const hasScroll = item.scrollHeight > item.clientHeight;
        setIsOnScroll(hasScroll ? item.clientHeight + item.scrollTop < item.scrollHeight : false);
      };
      item.addEventListener('scroll', scrollListener);
      scrollListener();
      return () => {
        item?.removeEventListener('scroll', scrollListener);
      };
    }
  }, [cardRef, setIsOnScroll]);

  return (
    <Card
      ref={cardRef}
      square={true}
      elevation={0}
      className={[
        classes.root,
        isOnScroll ? classes.rootOnScroll : '',
        slide > currentSlide ? classes.rootAfter : classes.rootBefore,
        (slide === 1 && currentSlide === 0) || slide === currentSlide ? classes.rootShown : '',
        shrinked ? classes.rootShrinked : ''
      ].join(' ')}
    >
      <CardMedia className={classes.media} image={image} title={title}>
        {!!imageAttribution && (
          <Typography className={classes.imageAttribution} component="div" variant="overline">
            <p dangerouslySetInnerHTML={{__html: imageAttribution}} />
          </Typography>
        )}
      </CardMedia>
      <CardContent data-content="true" classes={{root: classes.content}}>
        <Typography
          className={classes.pretitle}
          variant="overline"
          color="primary"
          component="span"
        >
          {`Map ${slide} of ${slidesNumber - 1}`}
        </Typography>
        <Typography
          className={classes.title}
          variant={isDesktop ? 'h5' : 'subtitle1'}
          color="primary"
          component="h2"
          noWrap={!isDesktop}
        >
          {title}
        </Typography>
        <Typography
          className={classes.subtitle}
          variant={isDesktop ? 'body1' : 'body2'}
          color="primary"
          component="h3"
        >
          {subtitle}
        </Typography>
        {!!text && (
          <Typography variant="body2" color="textPrimary" component="p" dangerouslySetInnerHTML={{ __html: text }}>
          </Typography>
        )}
        {!!children && (
          <Typography className={classes.text} variant="body2" color="textPrimary" component="div">
            {children}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default forwardRef(SidebarSlide);
