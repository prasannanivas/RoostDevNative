import React from "react";
import { Svg, Rect, Circle, Defs, Pattern, Use, Image } from "react-native-svg";

const NotificationBellIcon = ({
  width = 54,
  height = 50,
  bellColor = "#1D2327",
  badgeColor = "#F0913A",
  showBadge = true,
  badgeCount,
  style,
  onPress,
}) => {
  // Base64 encoded bell icon (from your SVG)
  const bellIconData =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAABVElEQVR4nO2VO0oDURSGR8F0ESGF4h608gGuwGCvixCXYCyC6A4EHzvRJjFaioUKxsrE3kQt4ycHzuDl5DqZZ7DIBxfCf5j/Y+7MnQTBhP8MsAV0gQ5QHae4wy+v4xAuAHWGkWy+KOkO0ONvZLZdhHTAaAaJ5cA00JJl8sURd2p5l0diOlpAUxw+cVUvfDb5Icmpm4625ps+8bkO901+n0J8Zzpqmp/5xE86XDH5Vwrxp+lY0/zBJ/7QYdnkqTAdZY37PnFfh7MFiOc07vnEjzpcdbKptGK51ulZj9rq8OWqOVklg7ji9Bxodhp1nNpOtpxBvOT0vEQdp/AD0nCyvQziXafnWtfwB8QHcJVBfBlLYtGz9002NoIkADPALdm5ka4k4hPy4yKuVF6wvGnGEcvfV940Ym/3hBDgzbOV3aBogGOP+Ggc4pLK5c5lye9S4eK8+AHmhsINZO+xIAAAAABJRU5ErkJggg==";

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 54 50"
      style={style}
      onPress={onPress}
    >
      <Defs>
        <Pattern
          id="bellPattern"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <Use href="#bellImage" transform="scale(0.0333333)" />
        </Pattern>
        <Image
          id="bellImage"
          width="30"
          height="30"
          preserveAspectRatio="none"
          href={bellIconData}
        />
      </Defs>

      {/* Bell Icon Background */}
      <Rect x="10" y="10" width="30" height="30" fill="url(#bellPattern)" />

      {/* Notification Badge */}
      {showBadge && <Circle cx="35" cy="15" r="5" fill={badgeColor} />}

      {/* Badge Count Text (if provided) */}
      {showBadge && badgeCount && (
        <text
          x="35"
          y="18"
          textAnchor="middle"
          fontSize="8"
          fill="#FFFFFF"
          fontWeight="bold"
          fontFamily="Futura"
        >
          {badgeCount > 99 ? "99+" : badgeCount}
        </text>
      )}
    </Svg>
  );
};

export default NotificationBellIcon;
