import React from "react";
import Svg, { G, Path, ClipPath, Defs, Text } from "react-native-svg";

const ClientSelectDropdown = ({
  width = 302,
  height = 42,
  label = "Select a client",
}) => {
  // Truncate label if too long
  const displayLabel =
    label.length > 20 ? label.substring(0, 17) + "..." : label;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 302 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <G clipPath="url(#clip0_373_8160)">
        <Path
          d="M0 8C0 3.58172 3.58172 0 8 0H294C298.418 0 302 3.58172 302 8V34C302 38.4183 298.418 42 294 42H8.00001C3.58173 42 0 38.4183 0 34V8Z"
          fill="#FDFDFD"
        />
        {/* Custom text instead of the SVG path text */}
        <Text
          x="25"
          y="26"
          fontSize="16"
          fontWeight="500"
          fill="#707070"
          fontFamily="Futura"
        >
          {displayLabel}
        </Text>
        <Path
          d="M278.5 25L272.005 18.25L284.995 18.25L278.5 25Z"
          fill="#1D2327"
        />
      </G>
      <Path
        d="M8 0.5H294C298.142 0.5 301.5 3.85786 301.5 8V34C301.5 38.1421 298.142 41.5 294 41.5H8C3.85787 41.5 0.5 38.1421 0.5 34V8C0.5 3.85786 3.85786 0.5 8 0.5Z"
        stroke="#1D2327"
      />
      <Defs>
        <ClipPath id="clip0_373_8160">
          <Path
            d="M0 8C0 3.58172 3.58172 0 8 0H294C298.418 0 302 3.58172 302 8V34C302 38.4183 298.418 42 294 42H8.00001C3.58173 42 0 38.4183 0 34V8Z"
            fill="white"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default ClientSelectDropdown;
