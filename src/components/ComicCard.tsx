import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Badge } from "./ui";
import { COMIC_TYPE_LABELS, type ComicType } from "../lib/constants";
import type { Comic } from "../types";
import type { ComicAuthorSummary } from "../hooks/useAuthors";

const COVER_WIDTH = 80;
const AVATAR_SIZE = 22;
const AVATAR_OVERLAP = 6;

type Props = {
  comic: Comic;
  authors?: ComicAuthorSummary[];
};

function AuthorAvatars({ authors }: { authors: ComicAuthorSummary[] }) {
  const maxShow = 3;
  const shown = authors.slice(0, maxShow);
  const totalWidth =
    shown.length * AVATAR_SIZE - (shown.length - 1) * AVATAR_OVERLAP;

  return (
    <View style={[styles.avatars, { width: totalWidth }]}>
      {shown.map((author, i) => (
        <View
          key={author.name}
          style={[
            styles.avatarWrapper,
            {
              left: i * (AVATAR_SIZE - AVATAR_OVERLAP),
              zIndex: shown.length - i,
            },
          ]}
        >
          {author.photo ? (
            <Image source={{ uri: author.photo }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {author.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

export function ComicCard({ comic, authors }: Props) {
  const router = useRouter();
  const authorNames = authors?.length
    ? authors.map((a) => a.name).join(", ")
    : null;

  return (
    <Pressable
      onPress={() => router.push(`/comic/${comic.id}`)}
      style={styles.container}
    >
      {comic.cover_image_local ? (
        <Image
          source={{ uri: comic.cover_image_local }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverPlaceholderText}>
            {comic.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title}>{comic.title}</Text>
        {authors?.length ? (
          <View style={styles.authorsRow}>
            <AuthorAvatars authors={authors} />
            <Text style={styles.authorNames} numberOfLines={1}>
              {authorNames}
            </Text>
          </View>
        ) : null}
        <Badge
          text={COMIC_TYPE_LABELS[comic.comic_type as ComicType]}
          variant="info"
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cover: {
    width: COVER_WIDTH,
    aspectRatio: 2 / 3,
    backgroundColor: "#e2e8f0",
  },
  coverPlaceholder: {
    width: COVER_WIDTH,
    aspectRatio: 2 / 3,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholderText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#94a3b8",
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
  },
  authorsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatars: {
    height: AVATAR_SIZE,
    position: "relative",
  },
  avatarWrapper: {
    position: "absolute",
    top: 0,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
  },
  authorNames: {
    flex: 1,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});
