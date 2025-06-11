import React from "react";
import { Svg, Rect, Path } from "react-native-svg";

const HelpButtonIcon = ({
  width = 50,
  height = 50,
  strokeColor = "#FDFDFD",
  textColor = "#FFFFFF",
  backgroundColor = "transparent",
  style,
  onPress,
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 50 50"
      style={style}
      onPress={onPress}
    >
      {/* Background rectangle with border */}
      <Rect
        x="1"
        y="1"
        width="47"
        height="48"
        rx="23.5"
        stroke={strokeColor}
        strokeWidth="2"
        fill={backgroundColor}
      />

      {/* HELP text */}
      <Path
        d="M12.1203 23.944H15.5163V20.452H17.8683V29.5H15.5163V25.768H12.1203V29.5H9.76831V20.452H12.1203V23.944ZM24.9124 22.444H22.1164V23.956H24.7564V25.948H22.1164V27.508H24.9124V29.5H19.7644V20.452H24.9124V22.444ZM28.9602 20.452V27.508H31.7802V29.5H26.6082V20.452H28.9602ZM35.3469 24.604H36.1269C36.9909 24.604 37.4229 24.228 37.4229 23.476C37.4229 22.724 36.9909 22.348 36.1269 22.348H35.3469V24.604ZM35.3469 29.5H32.9949V20.452H36.7389C37.7549 20.452 38.5309 20.716 39.0669 21.244C39.6109 21.772 39.8829 22.516 39.8829 23.476C39.8829 24.436 39.6109 25.18 39.0669 25.708C38.5309 26.236 37.7549 26.5 36.7389 26.5H35.3469V29.5Z"
        fill={textColor}
      />
    </Svg>
  );
};

export default HelpButtonIcon;
