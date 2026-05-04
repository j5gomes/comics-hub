import { Platform, ActionSheetIOS, Alert } from "react-native";

type Source = "gallery" | "camera" | "remove";

export function showPhotoSourcePicker(
  hasExisting: boolean,
  callback: (source: Source) => void
) {
  if (Platform.OS === "ios") {
    const options = ["Choose from Library", "Take Photo"];
    if (hasExisting) options.push("Remove");
    options.push("Cancel");

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: hasExisting ? options.length - 2 : undefined,
      },
      (index) => {
        if (index === 0) callback("gallery");
        else if (index === 1) callback("camera");
        else if (hasExisting && index === 2) callback("remove");
      }
    );
  } else {
    Alert.alert("Photo", "Choose a source", [
      { text: "Choose from Library", onPress: () => callback("gallery") },
      { text: "Take Photo", onPress: () => callback("camera") },
      ...(hasExisting
        ? [{ text: "Remove", style: "destructive" as const, onPress: () => callback("remove") }]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  }
}
