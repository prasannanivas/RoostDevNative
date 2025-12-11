import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

const COLORS = {
  green: "#377473",
  black: "#1D2327",
  white: "#FDFDFD",
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const HANDLE_SIZE = 18;
const MIN_RECT_SIZE = 40;

const CropModal = ({ visible, imageUri, originalWidth, originalHeight, onCancel, onCrop }) => {
  const screenW = Dimensions.get("window").width;
  const screenH = Dimensions.get("window").height;

  const imgW = originalWidth || 1200;
  const imgH = originalHeight || 900;

  // Calculate display dimensions to fit within safe area with padding
  const PADDING = 20;
  const HEADER_HEIGHT = 60;
  const FOOTER_HEIGHT = 100; 
  const availableW = screenW - (PADDING * 2);
  const availableH = screenH - HEADER_HEIGHT - FOOTER_HEIGHT - (PADDING * 2);

  let finalW = availableW;
  let finalH = (finalW * imgH) / imgW;

  if (finalH > availableH) {
    finalH = availableH;
    finalW = (finalH * imgW) / imgH;
  }

  const displayW = Math.max(1, Math.round(finalW));
  const displayH = Math.max(1, Math.round(finalH));

  // Crop rect in display coordinates - start full-frame
  const [rect, setRect] = useState(() => ({
    x: 0,
    y: 0,
    w: displayW,
    h: displayH,
  }));

  useEffect(() => {
    if (!visible) return;
    setRect({ x: 0, y: 0, w: displayW, h: displayH });
  }, [visible, displayW, displayH]);

  // Keep track of latest state/props in a ref to avoid stale closures in PanResponders
  const stateRef = useRef({ rect, displayW, displayH });
  stateRef.current = { rect, displayW, displayH };

  const containerRef = useRef(null);

  // Track active gesture to avoid conflicts between parent drag and handles
  const activeGesture = useRef(null); // 'pan' | 'tl' | 'tr' | 'bl' | 'br' | null

  // Pan to move whole rect
  const panStartRef = useRef(null);
  const panRectResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => activeGesture.current == null,
      onMoveShouldSetPanResponder: () => activeGesture.current == null,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        activeGesture.current = 'pan';
        panStartRef.current = { ...stateRef.current.rect };
      },
      onPanResponderMove: (_, g) => {
        const start = panStartRef.current || stateRef.current.rect;
        const { displayW, displayH } = stateRef.current;
        const nx = clamp(start.x + g.dx, 0, displayW - start.w);
        const ny = clamp(start.y + g.dy, 0, displayH - start.h);
        setRect((r) => ({ ...r, x: nx, y: ny }));
      },
      onPanResponderRelease: () => {
        activeGesture.current = null;
      },
      onPanResponderTerminate: () => {
        activeGesture.current = null;
      },
    })
  ).current;

  // Corner drag helpers
  const makeCornerResponder = (corner) => {
    const startRef = { current: null };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => activeGesture.current == null,
      onMoveShouldSetPanResponder: () => activeGesture.current == null,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        activeGesture.current = corner;
        startRef.current = { ...stateRef.current.rect };
      },
      onPanResponderMove: (_, g) => {
        const start = startRef.current || stateRef.current.rect;
        const { displayW, displayH } = stateRef.current;
        let x = start.x;
        let y = start.y;
        let w = start.w;
        let h = start.h;

        if (corner.includes("left")) {
          // Move left edge: adjust x and w, keep right edge fixed at start.x + start.w
          const newLeft = clamp(start.x + g.dx, 0, start.x + start.w - MIN_RECT_SIZE);
          w = (start.x + start.w) - newLeft;
          x = newLeft;
        } else if (corner.includes("right")) {
          // Move right edge: adjust w, keep left edge (x) fixed at start.x
          const newRight = clamp(start.x + start.w + g.dx, start.x + MIN_RECT_SIZE, displayW);
          w = newRight - start.x;
          x = start.x;
        } else {
          // No horizontal change
          x = start.x;
          w = start.w;
        }

        if (corner.includes("top")) {
          // Move top edge: adjust y and h, keep bottom edge fixed at start.y + start.h
          const newTop = clamp(start.y + g.dy, 0, start.y + start.h - MIN_RECT_SIZE);
          h = (start.y + start.h) - newTop;
          y = newTop;
        } else if (corner.includes("bottom")) {
          // Move bottom edge: adjust h, keep top edge (y) fixed at start.y
          const newBottom = clamp(start.y + start.h + g.dy, start.y + MIN_RECT_SIZE, displayH);
          h = newBottom - start.y;
          y = start.y;
        } else {
          // No vertical change
          y = start.y;
          h = start.h;
        }

        // Final safety clamps
        w = clamp(w, MIN_RECT_SIZE, displayW - x);
        h = clamp(h, MIN_RECT_SIZE, displayH - y);
        setRect({ x, y, w, h });
      },
      onPanResponderRelease: () => {
        if (activeGesture.current === corner) activeGesture.current = null;
      },
      onPanResponderTerminate: () => {
        if (activeGesture.current === corner) activeGesture.current = null;
      },
    });
  };

  const topLeft = useRef(makeCornerResponder("left top")).current;
  const topRight = useRef(makeCornerResponder("right top")).current;
  const bottomLeft = useRef(makeCornerResponder("left bottom")).current;
  const bottomRight = useRef(makeCornerResponder("right bottom")).current;
  
  // Edge responders
  const topEdge = useRef(makeCornerResponder("top")).current;
  const bottomEdge = useRef(makeCornerResponder("bottom")).current;
  const leftEdge = useRef(makeCornerResponder("left")).current;
  const rightEdge = useRef(makeCornerResponder("right")).current;

  const handleCrop = async () => {
    const scaleX = imgW / displayW;
    const scaleY = imgH / displayH;
    const crop = {
      originX: Math.max(0, Math.floor(rect.x * scaleX)),
      originY: Math.max(0, Math.floor(rect.y * scaleY)),
      width: Math.max(1, Math.floor(rect.w * scaleX)),
      height: Math.max(1, Math.floor(rect.h * scaleY)),
    };
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      onCrop?.(result.uri, result);
    } catch (e) {
      onCancel?.();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Adjust Crop</Text>
        </View>

        <View style={styles.workspace}>
          <View ref={containerRef} style={[styles.canvas, { width: displayW, height: displayH }]}> 
            {/* Image */}
            <Image source={{ uri: imageUri }} style={{ width: displayW, height: displayH }} />

          {/* Dimmed mask outside crop */}
          <View style={[styles.mask, { top: 0, left: 0, right: 0, height: rect.y }]} />
          <View style={[styles.mask, { top: rect.y + rect.h, left: 0, right: 0, bottom: 0 }]} />
          <View style={[styles.mask, { top: rect.y, left: 0, width: rect.x, height: rect.h }]} />
          <View style={[styles.mask, { top: rect.y, left: rect.x + rect.w, right: 0, height: rect.h }]} />

          {/* Crop rectangle with move handler */}
          <View
            style={[styles.cropRect, { left: rect.x, top: rect.y, width: rect.w, height: rect.h }]}
            {...panRectResponder.panHandlers}
          >
            {/* Grid Lines */}
            <View style={styles.gridContainer} pointerEvents="none">
              <View style={styles.gridRow} />
              <View style={styles.gridRow} />
            </View>
            <View style={[styles.gridContainer, { flexDirection: 'row' }]} pointerEvents="none">
              <View style={styles.gridCol} />
              <View style={styles.gridCol} />
            </View>

            {/* Edge Touch Zones (Invisible but large) */}
            <View style={[styles.edgeTouch, styles.edgeTop]} {...topEdge.panHandlers} />
            <View style={[styles.edgeTouch, styles.edgeBottom]} {...bottomEdge.panHandlers} />
            <View style={[styles.edgeTouch, styles.edgeLeft]} {...leftEdge.panHandlers} />
            <View style={[styles.edgeTouch, styles.edgeRight]} {...rightEdge.panHandlers} />

            {/* Corner Handles (Visual L-brackets + Large Touch Zones) */}
            <View style={[styles.cornerTouch, styles.tl]} {...topLeft.panHandlers}>
              <View style={[styles.cornerL, styles.cornerL_TL]} />
            </View>
            <View style={[styles.cornerTouch, styles.tr]} {...topRight.panHandlers}>
              <View style={[styles.cornerL, styles.cornerL_TR]} />
            </View>
            <View style={[styles.cornerTouch, styles.bl]} {...bottomLeft.panHandlers}>
              <View style={[styles.cornerL, styles.cornerL_BL]} />
            </View>
            <View style={[styles.cornerTouch, styles.br]} {...bottomRight.panHandlers}>
              <View style={[styles.cornerL, styles.cornerL_BR]} />
            </View>
          </View>
        </View>
        </View>
        {/* Bottom action bar */}
        <View style={styles.footerBar}>
          <TouchableOpacity style={[styles.footerBtn, styles.cancel]} onPress={onCancel}>
            <Text style={styles.footerBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerBtn, styles.confirm]} onPress={handleCrop}>
            <Text style={styles.footerBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  headerBar: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  workspace: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 80,
  },
  canvas: { backgroundColor: "#000" },
  mask: { position: "absolute", backgroundColor: "rgba(0,0,0,0.6)" },
  cropRect: {
    position: "absolute",
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-evenly",
  },
  gridRow: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  gridCol: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  
  // Edge Touch Zones
  edgeTouch: { position: "absolute" },
  edgeTop: { top: -20, left: 0, right: 0, height: 40 },
  edgeBottom: { bottom: -20, left: 0, right: 0, height: 40 },
  edgeLeft: { left: -20, top: 0, bottom: 0, width: 40 },
  edgeRight: { right: -20, top: 0, bottom: 0, width: 40 },

  // Corner Touch Zones
  cornerTouch: {
    position: "absolute",
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  tl: { left: -30, top: -30 },
  tr: { right: -30, top: -30 },
  bl: { left: -30, bottom: -30 },
  br: { right: -30, bottom: -30 },

  // Visual L-brackets
  cornerL: {
    width: 20,
    height: 20,
    borderColor: COLORS.white,
  },
  cornerL_TL: { borderTopWidth: 3, borderLeftWidth: 3 },
  cornerL_TR: { borderTopWidth: 3, borderRightWidth: 3 },
  cornerL_BL: { borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerL_BR: { borderBottomWidth: 3, borderRightWidth: 3 },

  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerBtn: { flex: 1, paddingVertical: 12, borderRadius: 33, alignItems: "center" },
  footerBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});

export default CropModal;
