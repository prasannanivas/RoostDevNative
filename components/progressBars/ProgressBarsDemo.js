import React from "react";
import { View, StyleSheet, Text } from "react-native";

import {
  EmptyProgressBar,
  PartialProgressBar,
  MidProgressBar,
  CompleteProgressBar,
  SuccessProgressBar,
  CustomProgressBar,
} from "./index";

/**
 * Demo component showing all progress bar variations
 */
const ProgressBarsDemo = () => {
  const COLORS = {
    green: "#377473",
    orange: "#F0913A",
    background: "#F6F6F6",
    black: "#1D2327",
    blue: "#2271B1",
    white: "#FDFDFD",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progress Bar Variations</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pre-defined Progress Bars</Text>
        <EmptyProgressBar />
        <PartialProgressBar />
        <MidProgressBar />
        <CompleteProgressBar />
        <SuccessProgressBar />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Progress Bars</Text>
        <CustomProgressBar progress={10} text="JUST STARTED" />
        <CustomProgressBar progress={33} text="IN PROGRESS" />
        <CustomProgressBar progress={66} text="ALMOST THERE" />
        <CustomProgressBar
          progress={100}
          text="COMPLETED"
          color={COLORS.blue}
        />
        <CustomProgressBar
          progress={50}
          text="CUSTOM COLOR"
          color="rgba(255, 0, 0, 0.2)"
          textColor="red"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F6F6F6",
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Futura",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Futura",
    marginBottom: 12,
  },
});

export default ProgressBarsDemo;
