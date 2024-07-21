import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Slider,
  Box,
  withStyles,
  Collapse,
  Fade,
  useMediaQuery,
  useTheme,
  Button,
} from "@material-ui/core";
import CoverBase from "./CoverBase";
import slides from "../../slides";
import { useAppState } from "../../state";
import { colorToRGBArray } from "../../utils";

const CustomSlider = withStyles({
  root: {
    color: "#fff",
  },
  thumb: {
    backgroundColor: "#fff",
    color: "#fff",
  },
})(Slider);

const useStyles = makeStyles((theme) => ({
  root: {
    bottom: theme.spacing(6),
    left: theme.spacing(2.5),
    transform: "none",
    width: "150px",
    display: "block",
    [theme.breakpoints.down("sm")]: {
      bottom: theme.spacing(24),
    },
  },
  paper: {
    textAlign: "center",
    padding: 0,
    color: theme.palette.common.white,
    backgroundColor: theme.palette.common.black,
  },
  list: {
    padding: theme.spacing(0, 1.5, 1.5),
  },
  listItem: {
    padding: theme.spacing(0.5, 0),
    textAlign: "center",
  },
  listItemIcon: {
    width: theme.spacing(2),
    height: theme.spacing(2),
    borderRadius: theme.spacing(1),
    margin: theme.spacing(0, 1, 0, 0),
    minWidth: theme.spacing(2),
    position: "relative",
  },
  dot: {
    width: theme.spacing(1),
    height: theme.spacing(1),
    borderRadius: theme.spacing(0.5),
    position: "absolute",
    top: theme.spacing(0.5),
    left: theme.spacing(0.5),
    transition: theme.transitions.create(["background-color", "transform"], {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.short,
    }),
  },
  ListItemText: {
    opacity: 0.6,
  },
  listButton: {
    padding: theme.spacing(1.5),
    ...theme.typography.caption,
  },
  wrapper: {
    display: "flex",
    height: "100%",
  },
  slider: {
    paddingTop: theme.spacing(7),
    paddingBottom: theme.spacing(4),
    marginLeft: theme.spacing(1),
  },
}));

const getColor = (color, alpha = 1) => {
  const colorArray = colorToRGBArray(color);
  return `rgba(${colorArray[0]},${colorArray[1]},${colorArray[2]},${alpha})`;
};

const CoverLegend = () => {
  const classes = useStyles();
  const { currentSlide, setFilterValue } = useAppState();
  const slidesToShow = slides.map((s, i) => s.legend && i).filter((i) => i);
  const [slider, setSlider] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // For fade animation, retain legend in state
  const [legend, setLegend] = useState(null);
  useEffect(() => {
    const { legend, slider } = slides[currentSlide];
    if (legend) setLegend(legend);
    if (slider) {
      setSlider(slider);
      setSliderValue(legend.labels.length - 1);
    }
  }, [currentSlide]);

  const handleSliderChange = (event, newValue) => {
    setSliderValue(newValue);
    let n = legend.values.length - newValue - 1;
    let f = n;
    n = Math.floor(n);
    f = f - n;

    const v = legend.values[n];
    const v2 = legend.values[n + 1] || v;
    const out = v * (1 - f) + v2 * f;
    setFilterValue(out);
  };

  // Show / hide the legend list
  // By default: hidden in mobile and visible in desktop
  const theme = useTheme();
  const [showList, setShowList] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isLandscape = useMediaQuery("(max-height: 360px)");

  useEffect(() => {
    if (isMobile || isLandscape) {
      setShowList(false);
    } else {
      setShowList(true);
    }
  }, [isMobile, isLandscape]);

  const handleShowListChange = () => {
    setShowList((prev) => !prev);
  };

  if (!legend) return null;

  return (
    <CoverBase slidesToShow={slidesToShow} className={classes.root}>
      <Box className={classes.wrapper}>
        <Paper
          classes={{
            root: classes.paper,
          }}
          elevation={1}
        >
          <Button
            color="inherit"
            variant="text"
            size="small"
            onClick={handleShowListChange}
            className={classes.listButton}
          >
            {legend.title}
          </Button>
          <Collapse in={showList}>
            <List classes={{ root: classes.list }} dense={true}>
              {legend.labels.map((src, i) => {
                const visible = i >= legend.labels.length - sliderValue - 1;
                const alpha = visible ? 1 : 0.3;
                return (
                  <ListItem
                    classes={{ root: classes.listItem }}
                    key={`source-${i}`}
                  >
                    <ListItemIcon
                      style={{
                        backgroundColor: getColor(
                          legend.colors[i],
                          0.4 * alpha
                        ),
                      }}
                      classes={{ root: classes.listItemIcon }}
                    >
                      <div
                        style={{
                          backgroundColor: getColor(legend.colors[i], 1),
                          transform: `scale(${visible ? 1 : 0})`,
                        }}
                        className={classes.dot}
                      ></div>
                    </ListItemIcon>
                    <ListItemText
                      classes={{ root: classes.ListItemText }}
                      primaryTypographyProps={{
                        color: "inherit",
                        variant: "caption",
                      }}
                      primary={src}
                    ></ListItemText>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        </Paper>
        {slider && showList && (
          <Fade in={showList}>
            <Box className={classes.slider}>
              <CustomSlider
                orientation="vertical"
                value={sliderValue}
                onChange={handleSliderChange}
                aria-labelledby="legend-slider"
                min={0}
                max={legend.labels.length - 1}
                step={0.01}
              />
            </Box>
          </Fade>
        )}
      </Box>
    </CoverBase>
  );
};

export default CoverLegend;
