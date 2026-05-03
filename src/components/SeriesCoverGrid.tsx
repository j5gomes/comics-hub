import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

type Props = {
  covers: string[];
  size: number;
};

export function SeriesCoverGrid({ covers, size }: Props) {
  const cellSize = size / 2;
  const cells = Array.from({ length: 4 }, (_, i) => covers[i] ?? null);

  return (
    <View style={[styles.grid, { width: size, height: size }]}>
      {cells.map((uri, i) => (
        <View key={i} style={[styles.cell, { width: cellSize, height: cellSize }]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
  },
  cell: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
  },
});
