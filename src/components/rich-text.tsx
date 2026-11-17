import { Image, Linking, StyleSheet, Text, View } from "react-native";
import { parseInline, parseMarkup } from "../lib/markup";
import { COLORS } from "./hoopstats-ui";

// Draws library note markup (see src/lib/markup.ts).
export function RichText({ source }: { source: string }) {
  const blocks = parseMarkup(source);
  if (!blocks.length) return <Text style={styles.empty}>Nothing here yet.</Text>;

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h1":
            return <Text key={index} style={styles.h1}>{renderInline(block.text, styles.body)}</Text>;
          case "h2":
            return <Text key={index} style={styles.h2}>{renderInline(block.text, styles.body)}</Text>;
          case "bullet":
            return (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{renderInline(block.text, styles.body)}</Text>
              </View>
            );
          case "table":
            return (
              <View key={index} style={styles.table}>
                {block.rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={[styles.tableRow, rowIndex === 0 && styles.tableHeader]}>
                    {row.map((cell, cellIndex) => (
                      <Text key={cellIndex} style={[styles.tableCell, rowIndex === 0 && styles.tableHeaderText]}>{cell}</Text>
                    ))}
                  </View>
                ))}
              </View>
            );
          case "image":
            return <Image key={index} accessibilityLabel={block.alt} resizeMode="contain" source={{ uri: block.src }} style={styles.image} />;
          case "p":
            return <Text key={index} style={styles.body}>{renderInline(block.text, styles.body)}</Text>;
        }
      })}
    </View>
  );
}

function renderInline(text: string, style: object) {
  return parseInline(text).map((part, index) =>
    part.href ? (
      <Text key={index} onPress={() => void Linking.openURL(part.href!)} style={styles.link}>{part.text}</Text>
    ) : (
      <Text key={index} style={style}>{part.text}</Text>
    ),
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9 },
  empty: { color: COLORS.muted, fontSize: 14 },
  h1: { color: COLORS.navyDark, fontSize: 22, fontWeight: "800", marginTop: 6 },
  h2: { color: COLORS.navy, fontSize: 17, fontWeight: "800", marginTop: 4 },
  body: { color: "#455c79", fontSize: 15, lineHeight: 22 },
  bulletRow: { flexDirection: "row", gap: 8, paddingLeft: 4 },
  bulletDot: { color: COLORS.orange, fontSize: 16, lineHeight: 22 },
  bulletText: { color: "#455c79", flex: 1, fontSize: 15, lineHeight: 22 },
  link: { color: COLORS.orange, fontSize: 15, textDecorationLine: "underline" },
  table: { borderColor: COLORS.border, borderRadius: 6, borderWidth: 1, overflow: "hidden" },
  tableRow: { borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: "row" },
  tableHeader: { backgroundColor: "#edf2f8" },
  tableCell: { color: "#455c79", flex: 1, fontSize: 13, paddingHorizontal: 8, paddingVertical: 7 },
  tableHeaderText: { color: COLORS.navy, fontWeight: "800" },
  image: { backgroundColor: "#f4f7fb", borderRadius: 8, height: 220, width: "100%" },
});
