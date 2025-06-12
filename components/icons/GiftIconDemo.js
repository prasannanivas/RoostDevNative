import React from "react";
import { View, StyleSheet, Text } from "react-native";
import GiftIcon from "./GiftIcon";

/**
 * Demo component to showcase the GiftIcon with different props
 */
const GiftIconDemo = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gift Icon Examples</Text>

      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Text style={styles.label}>Default</Text>
          <GiftIcon />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.label}>Custom Colors</Text>
          <GiftIcon
            backgroundColor="#F0913A"
            strokeColor="#377473"
            pathColor="#FFFFFF"
          />
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.label}>Custom Size</Text>
          <GiftIcon width={60} height={60} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F6F6F6",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 10,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
});

export default GiftIconDemo;
