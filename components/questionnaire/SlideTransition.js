import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';

const SlideTransition = ({ children, id, direction = 'next', duration = 300 }) => {
  const { width } = useWindowDimensions();
  const [currentId, setCurrentId] = useState(id);
  const [prevChildren, setPrevChildren] = useState(null);
  const [currentChildren, setCurrentChildren] = useState(children);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    if (id !== currentId) {
      // Start transition
      setPrevChildren(currentChildren);
      setCurrentChildren(children);
      setCurrentId(id);
      
      // Reset animation value
      slideAnim.setValue(0);
      isAnimating.current = true;

      Animated.timing(slideAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }).start(() => {
        setPrevChildren(null);
        isAnimating.current = false;
      });
    } else {
        // If id hasn't changed but children might have (e.g. props update), update currentChildren
        setCurrentChildren(children);
    }
  }, [id, children, duration, slideAnim, currentChildren, currentId]);

  const getTransforms = () => {
    const isNext = direction === 'next';
    
    const currentTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: isNext ? [width, 0] : [-width, 0],
    });

    const prevTranslateX = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: isNext ? [0, -width] : [0, width],
    });

    return { currentTranslateX, prevTranslateX };
  };

  const { currentTranslateX, prevTranslateX } = getTransforms();

  return (
    <View style={styles.container}>
      {prevChildren && (
        <Animated.View
          style={[
            styles.absoluteContainer,
            { transform: [{ translateX: prevTranslateX }] },
          ]}
        >
          {prevChildren}
        </Animated.View>
      )}
      <Animated.View
        style={[
          styles.container,
          prevChildren ? { transform: [{ translateX: currentTranslateX }] } : null,
        ]}
      >
        {currentChildren}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  absoluteContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});

export default SlideTransition;
