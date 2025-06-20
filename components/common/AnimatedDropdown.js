import React, { useState, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

/**
 * AnimatedDropdown - A reusable component that animates its children opening from the top
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the content should be visible
 * @param {Object} props.style - Additional styles to apply to the container
 * @param {Object} props.contentStyle - Additional styles to apply to the content container
 * @param {ReactNode} props.children - The content to display when visible
 * @param {string|number} props.contentKey - A key to detect content changes and trigger re-animations
 * @param {number} props.maxHeight - Maximum height for the dropdown (defaults to 200)
 * @param {number} props.duration - Duration for closing animation in ms (defaults to 250)
 * @param {number} props.tension - Spring tension for opening animation (defaults to 50)
 * @param {number} props.friction - Spring friction for opening animation (defaults to 7)
 * @param {number} props.slideOffset - How far the content should slide from (defaults to -20)
 * @param {boolean} props.useNativeDriver - Whether to use the native driver (defaults to false)
 */
const AnimatedDropdown = ({
  visible = false,
  style,
  contentStyle,
  children,
  contentKey,
  maxHeight = 250,
  duration = 250,
  tension = 50,
  friction = 7,
  slideOffset = -20,
  useNativeDriver = false,
}) => {
  // Track if component is mounted for proper unmounting
  const [mounted, setMounted] = useState(visible);

  // Store previous content key to detect changes
  const prevContentKeyRef = useRef(contentKey);

  // Create animation value initialized to current visibility state
  const animationValue = useRef(new Animated.Value(visible ? 1 : 0)).current;

  // Animation function to reuse for both visibility and content changes
  const animateIn = () => {
    // Reset animation to 0 before starting if we're re-animating
    if (visible && prevContentKeyRef.current !== contentKey) {
      animationValue.setValue(0);
    }

    // Mount first, then animate
    setMounted(true);
    Animated.spring(animationValue, {
      toValue: 1,
      tension,
      friction,
      useNativeDriver,
    }).start();

    // Update ref for future comparison
    prevContentKeyRef.current = contentKey;
  };

  // Handle visibility and content changes
  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      // Animate out first, then unmount
      Animated.timing(animationValue, {
        toValue: 0,
        duration,
        useNativeDriver,
      }).start(({ finished }) => {
        // Only unmount if animation completed
        if (finished) {
          setMounted(false);
        }
      });
    }
  }, [
    visible,
    contentKey,
    animationValue,
    duration,
    tension,
    friction,
    useNativeDriver,
  ]);
  // If hiding, wait for animation to complete before removing from DOM  // Don't render anything when not mounted
  if (!mounted && !visible) {
    return null;
  }
  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, "auto"],
          }),
          maxHeight: animationValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, maxHeight],
          }),
          opacity: animationValue,
        },
        style,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [
              {
                translateY: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [slideOffset, 0],
                }),
              },
            ],
          },
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
    width: "100%",
    // Setting height to 0 when not visible
    minHeight: 0,
  },
  contentContainer: {
    width: "100%",
  },
});

export default AnimatedDropdown;
