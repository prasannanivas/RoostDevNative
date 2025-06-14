import React from "react";
import { TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";

/**
 * CloseButton component that displays an "X" in a circle
 *
 * @param {Object} props
 * @param {Function} props.onPress - Function to call when the button is pressed
 * @param {Number} props.size - The size of the button (width and height)
 * @param {String} props.fill - The color of the SVG
 * @param {Object} props.style - Additional style to apply to the button container
 * @param {Object} props.buttonStyle - Additional style to apply to the TouchableOpacity
 */
const CloseButton = ({
  onPress,
  size = 25,
  fill = "#A9A9A9",
  style = {},
  buttonStyle = {},
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      style={[buttonStyle]}
    >
      <View style={style}>
        <Svg width={size} height={size} viewBox="0 0 25 25" fill="none">
          <Path
            d="M12.5 0C5.59687 0 0 5.59625 0 12.5C0 19.4037 5.59625 25 12.5 25C19.4037 25 25 19.4037 25 12.5C25 5.59625 19.4037 0 12.5 0ZM12.5 23.4625C6.46875 23.4625 1.5625 18.5312 1.5625 12.5C1.5625 6.46875 6.46875 1.5625 12.5 1.5625C18.5312 1.5625 23.4375 6.46875 23.4375 12.5C23.4375 18.5312 18.5312 23.4625 12.5 23.4625ZM16.9194 8.08125C16.6147 7.77656 16.12 7.77656 15.8147 8.08125L12.5006 11.3953L9.18656 8.08125C8.88187 7.77656 8.38656 7.77656 8.08125 8.08125C7.77594 8.38594 7.77656 8.88125 8.08125 9.18594L11.3953 12.5L8.08125 15.8141C7.77656 16.1187 7.77656 16.6141 8.08125 16.9188C8.38594 17.2234 8.88125 17.2234 9.18656 16.9188L12.5006 13.6047L15.8147 16.9188C16.1194 17.2234 16.6141 17.2234 16.9194 16.9188C17.2247 16.6141 17.2241 16.1187 16.9194 15.8141L13.6053 12.5L16.9194 9.18594C17.225 8.88062 17.225 8.38594 16.9194 8.08125Z"
            fill={fill}
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

export default CloseButton;
