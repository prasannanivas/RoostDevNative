import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import ClientSelectDropdown from "./ClientSelectDropdown";
import { COLORS } from "../../styles/index";

const ClientSelector = ({
  selectedValue,
  onValueChange,
  items = [],
  placeholder = "Select a client",
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectorContainer}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <ClientSelectDropdown
          width={Dimensions.get("window").width * 0.9}
          label={displayText}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a client</Text>            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item.value && styles.selectedOptionText,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              initialNumToRender={10}
              maxToRenderPerBatch={15}
              windowSize={10}
              contentContainerStyle={styles.flatListContent}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorContainer: {
    width: "100%",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },  modalContent: {
    width: "90%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  flatListContent: {
    paddingRight: 5, // Space for the scrollbar
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Futura",
    marginBottom: 16,
    textAlign: "center",
    color: COLORS.black,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: COLORS.green + "20", // 20% opacity
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Futura",
    color: COLORS.black,
  },
  selectedOptionText: {
    fontWeight: "700",
    color: COLORS.green,
  },
  closeButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Futura",
    color: COLORS.white,
  },
});

export default ClientSelector;
