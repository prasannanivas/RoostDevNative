import React from "react";
import { Svg, Rect, Path } from "react-native-svg";

const ClientAddFloatingButton = ({
  width = 59,
  height = 58,
  fillColor = "#F0913A",
  strokeColor = "#FDFDFD",
  iconColor = "#FDFDFD",
  style,
  onPress,
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 59 58"
      style={style}
      onPress={onPress}
    >
      <Rect
        x="1"
        y="1"
        width="54"
        height="54"
        rx="27"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="2"
      />
      <Path
        d="M31.8181 36.909C31.8181 34.0974 28.3992 31.8181 24.1818 31.8181C19.9643 31.8181 16.5454 34.0974 16.5454 36.909M36.909 33.0908V29.2727M36.909 29.2727V25.4545M36.909 29.2727H33.0909M36.909 29.2727H40.7272M24.1818 27.9999C21.3701 27.9999 19.0909 25.7207 19.0909 22.909C19.0909 20.0974 21.3701 17.8181 24.1818 17.8181C26.9934 17.8181 29.2727 20.0974 29.2727 22.909C29.2727 25.7207 26.9934 27.9999 24.1818 27.9999Z"
        stroke={iconColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ClientAddFloatingButton;
