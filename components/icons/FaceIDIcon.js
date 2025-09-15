import React from "react";
import Svg, { Rect, Path } from "react-native-svg";

// A clean, professional Face ID style glyph (inspired by iOS outline)
// Props: size (number), color (stroke color)
export default function FaceIDIcon({
  size = 36,
  color = "#FDFDFD",
  strokeWidth = 2,
}) {
  const s = size;
  const corner = 6; // corner radius style
  return (
    <Svg width={s} height={s} viewBox="0 0 48 48" fill="none">
      {/* Corner Frame */}
      <Path
        d="M12 5H9a4 4 0 0 0-4 4v3M36 5h3a4 4 0 0 1 4 4v3M44 36v3a4 4 0 0 1-4 4h-3M5 36v3a4 4 0 0 0 4 4h3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <Path
        d="M18 20v2M30 20v2"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Mouth curve */}
      <Path
        d="M18 28c2 2 4 3 6 3s4-1 6-3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Face tracking outline */}
      <Path
        d="M24 14c-5 0-9 4-9 9 0 5 4 9 9 9 5 0 9-4 9-9 0-1.3-.27-2.53-.76-3.64"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
    </Svg>
  );
}
