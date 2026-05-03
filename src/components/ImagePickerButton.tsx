import { View, Pressable, Text, StyleSheet, Alert } from "react-native";
import { Image } from "expo-image";

type Props = {
  imageUri: string | null;
  onPickFromGallery: () => void;
  onPickFromCamera: () => void;
  onClear: () => void;
  label?: string;
  size?: number;
  shape?: "portrait" | "square";
};

export function ImagePickerButton({
  imageUri,
  onPickFromGallery,
  onPickFromCamera,
  onClear,
  label = "Cover Image",
  size = 120,
  shape = "portrait",
}: Props) {
  const isSquare = shape === "square";
  const width = size;
  const height = isSquare ? size : size * 1.5;
  const borderRadius = isSquare ? size / 2 : 10;

  const showOptions = () => {
    Alert.alert(
      isSquare ? "Add Photo" : "Add Cover Image",
      "Choose a source",
      [
        { text: "Camera", onPress: onPickFromCamera },
        { text: "Photo Library", onPress: onPickFromGallery },
        ...(imageUri
          ? [{ text: "Remove", style: "destructive" as const, onPress: onClear }]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={showOptions}
        style={[
          styles.picker,
          { width, height, borderRadius },
          isSquare && styles.pickerCentered,
        ]}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, { borderRadius }]}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>+</Text>
            {!isSquare && (
              <Text style={styles.placeholderText}>Add cover</Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  picker: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
  },
  pickerCentered: {
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  placeholderIcon: {
    fontSize: 28,
    color: "#94a3b8",
    fontWeight: "300",
  },
  placeholderText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
});
