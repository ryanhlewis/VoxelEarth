import React from "react";
import { makeStyles } from "@material-ui/core";
import Map from "../Map/Map";
import Sidebar from "../Sidebar/Sidebar";
import CoverHero from "../Cover/CoverHero";
import CoverFooter from "../Cover/CoverFooter";
import CoverHeader from "../Cover/CoverHeader";
import CoverLegend from "../Cover/CoverLegend";
import Header from "../Header/Header";
import { useAppState } from "../../state";
import GeolocationSearchBar from "./GeolocationSearchBar";

const useStyles = makeStyles((theme) => ({
  "@global": {
    body: {
      overflowX: "hidden",
    },
  },
  root: {
    display: "flex",
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  rootCover: {
    minHeight: theme.spacing(58),

    [theme.breakpoints.up("md")]: {
      minHeight: theme.spacing(66),
    },
  },
}));

const Main = () => {
  const classes = useStyles();
  const { currentSlide } = useAppState();

  return (
    <div
      className={[
        classes.root,
        currentSlide === 0 ? classes.rootCover : "",
      ].join(" ")}
    >
      <Map />
      
       {/* <CoverHeader /> */}
      <CoverHero />
      {/* <CoverFooter /> */}
      {/* <CoverLegend /> */}
      <Sidebar /> 
      
      <Header hidden={currentSlide > 0} hideDelay={500} showDelay={0} />
    </div>
  );
};

export default Main;
