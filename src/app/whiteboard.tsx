import { router } from "expo-router";
import { ArrowLeft, Circle, Eraser, PenLine, Plus, RotateCcw, Save, Trash2 } from "../components/icons";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Svg, { Circle as SvgCircle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { teamSubtitle, useTeam } from "../lib/team";
import { BoardLine, BoardMark, BoardPoint, BoardState, STARTING_BOARD, boardApi } from "../lib/whiteboard";

type Tool = "select" | "draw" | "player" | "ball";
const WIDTH = 340;
const HEIGHT = 440;

const LINE = "#111111";

// Basketball court: hardwood floor, painted keys, free-throw circles, three-point arcs, and a backboard and hoop at each end.
// The top end is drawn once and mirrored for the bottom end.
function CourtLines() {
  const planks = [1, 3, 5, 7, 9];
  const end = (
    <>
      <Rect fill="none" height={150} stroke={LINE} strokeWidth="2" width={120} x={WIDTH / 2 - 60} y={5} />
      <Path d="M25,5 V110 M315,5 V110" fill="none" stroke={LINE} strokeWidth="2" />
      <Path d="M25,110 A161,133 0 0 0 315,110" fill="none" stroke={LINE} strokeWidth="2" />
      <Path d="M120,155 A50,50 0 0 1 220,155" fill="none" stroke={LINE} strokeWidth="2" />
      <Path d="M120,155 A50,50 0 0 0 220,155" fill="none" stroke={LINE} strokeDasharray="8 6" strokeWidth="2" />
      <Line stroke={LINE} strokeWidth="3" x1={WIDTH / 2 - 20} x2={WIDTH / 2 + 20} y1="42" y2="42" />
      <Path d={`M${WIDTH / 2 - 27},52 A27,27 0 0 0 ${WIDTH / 2 + 27},52`} fill="none" stroke={LINE} strokeWidth="2" />
      <SvgCircle cx={WIDTH / 2} cy="52" fill="none" r="5" stroke={LINE} strokeWidth="2.5" />
    </>
  );
  return (
    <>
      <Rect fill="#c8864b" height={HEIGHT} rx="8" width={WIDTH} />
      {planks.map((index) => <Rect key={index} fill="#b97a40" height={HEIGHT} width={WIDTH / 10} x={(index * WIDTH) / 10} />)}
      <Rect fill="none" height={HEIGHT - 10} rx="6" stroke={LINE} strokeWidth="2.5" width={WIDTH - 10} x="5" y="5" />
      <Line stroke={LINE} strokeWidth="2" x1={5} x2={WIDTH - 5} y1={HEIGHT / 2} y2={HEIGHT / 2} />
      <SvgCircle cx={WIDTH / 2} cy={HEIGHT / 2} fill="none" r="43" stroke={LINE} strokeWidth="2" />
      <SvgCircle cx={WIDTH / 2} cy={HEIGHT / 2} fill={LINE} r="3" />
      {end}
      <G transform={`translate(0 ${HEIGHT}) scale(1 -1)`}>{end}</G>
    </>
  );
}
const makeId = () => `${Date.now()}-${Math.random()}`;

export default function WhiteboardScreen() {
  const { team } = useTeam();
  const [board, setBoard] = useState<BoardState>(STARTING_BOARD);
  const [tool, setTool] = useState<Tool>("select");
  const [boardSize, setBoardSize] = useState({ width: WIDTH, height: HEIGHT });
  const [saved, setSaved] = useState(true);
  const [drawing, setDrawing] = useState<BoardPoint[] | null>(null);
  const drawingRef = useRef<BoardPoint[] | null>(null);
  const draggingId = useRef<string | null>(null);

  useEffect(() => { void boardApi.load().then(setBoard); }, []);

  function normalize(x: number, y: number): BoardPoint {
    return { x: Math.max(11, Math.min(WIDTH - 11, (x / boardSize.width) * WIDTH)), y: Math.max(11, Math.min(HEIGHT - 11, (y / boardSize.height) * HEIGHT)) };
  }

  function onTouchStart(event: { nativeEvent: { locationX: number; locationY: number } }) {
    const point = normalize(event.nativeEvent.locationX, event.nativeEvent.locationY);
    if (tool === "draw") {
      drawingRef.current = [point];
      setDrawing([point]);
    } else if (tool === "select") {
      const nearest = board.marks
        .map((mark) => ({ mark, distance: Math.hypot(mark.point.x - point.x, mark.point.y - point.y) }))
        .filter(({ distance }) => distance < 25)
        .sort((a, b) => a.distance - b.distance)[0];
      draggingId.current = nearest?.mark.id ?? null;
    } else if (tool === "player" || tool === "ball") {
      const mark: BoardMark = { id: makeId(), kind: tool, point, label: tool === "player" ? String(board.marks.filter((item) => item.kind === "player").length + 1) : "" };
      setBoard((current) => ({ ...current, marks: [...current.marks, mark] }));
      setSaved(false);
      setTool("select");
    }
  }

  function onTouchMove(event: { nativeEvent: { locationX: number; locationY: number } }) {
    const point = normalize(event.nativeEvent.locationX, event.nativeEvent.locationY);
    if (tool === "select" && draggingId.current) {
      setBoard((current) => ({ ...current, marks: current.marks.map((mark) => mark.id === draggingId.current ? { ...mark, point } : mark) }));
      setSaved(false);
      return;
    }
    if (tool !== "draw" || !drawingRef.current) return;
    const next = [...drawingRef.current, point];
    drawingRef.current = next;
    setDrawing(next);
  }

  function onTouchEnd() {
    const points = drawingRef.current;
    drawingRef.current = null;
    setDrawing(null);
    if (points && points.length >= 2) {
      setBoard((current) => ({ ...current, lines: [...current.lines, { id: makeId(), points }] }));
      setSaved(false);
    }
    draggingId.current = null;
  }

  function undo() {
    setBoard((current) => current.lines.length
      ? { ...current, lines: current.lines.slice(0, -1) }
      : { ...current, marks: current.marks.slice(0, -1) });
    setSaved(false);
  }

  function clearBoard() {
    Alert.alert("Clear whiteboard?", "Remove all player markers, ball markers, and drawings?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => { setBoard({ marks: [], lines: [] }); setSaved(false); } },
    ]);
  }

  async function saveBoard() {
    await boardApi.save(board);
    setSaved(true);
  }

  const activePath = drawing?.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={COLORS.navy} size={19} /><Text style={styles.backText}>Dashboard</Text></Pressable>
        <Text style={styles.title}>Coach's Whiteboard</Text>
        <Text style={styles.subtitle}>{teamSubtitle(team, "Sketch a play, position your lineup, and save the diagram.")}</Text>

        <View style={styles.toolbar}>
          <ToolButton label="Select" active={tool === "select"} onPress={() => setTool("select")}><Circle color={tool === "select" ? "#fff" : COLORS.navy} size={17} /></ToolButton>
          <ToolButton label="Draw" active={tool === "draw"} onPress={() => setTool("draw")}><PenLine color={tool === "draw" ? "#fff" : COLORS.navy} size={17} /></ToolButton>
          <ToolButton label="Player" active={tool === "player"} onPress={() => setTool("player")}><Plus color={tool === "player" ? "#fff" : COLORS.navy} size={17} /></ToolButton>
          <ToolButton label="Ball" active={tool === "ball"} onPress={() => setTool("ball")}><Text style={styles.ballIcon}>●</Text></ToolButton>
        </View>
        <Text style={styles.tip}>{tool === "draw" ? "Draw a movement or pass line on the court." : tool === "player" ? "Tap the court to place a player." : tool === "ball" ? "Tap the court to place the ball." : "Choose Draw, Player, or Ball to edit the play."}</Text>

        <View style={styles.courtFrame}>
          <View
            onLayout={(event) => setBoardSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            onStartShouldSetResponder={(event) => {
              if (tool !== "select") return true;
              const point = normalize(event.nativeEvent.locationX, event.nativeEvent.locationY);
              return board.marks.some((mark) => Math.hypot(mark.point.x - point.x, mark.point.y - point.y) < 25);
            }}
            onMoveShouldSetResponder={() => tool === "draw" || (tool === "select" && draggingId.current !== null)}
            onResponderGrant={onTouchStart}
            onResponderMove={onTouchMove}
            onResponderRelease={onTouchEnd}
            onResponderTerminate={onTouchEnd}
            style={styles.courtTouch}
          >
            <Svg height="100%" preserveAspectRatio="none" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%">
              <CourtLines />
              {[...board.lines, ...(drawing && drawing.length > 1 ? [{ id: "active", points: drawing }] : [])].map((line: BoardLine) => <Path key={line.id} d={line.points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ")} fill="none" stroke={line.id === "active" ? COLORS.orange : COLORS.navy} strokeDasharray={line.id === "active" ? undefined : "6 4"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />)}
              {board.marks.map((mark) => mark.kind === "player" ? (
                <ReactPlayer key={mark.id} mark={mark} />
              ) : (
                  <G key={mark.id}>
                  <SvgCircle cx={mark.point.x} cy={mark.point.y} fill={COLORS.orange} r="12" stroke="#fff" strokeWidth="2" />
                  <Path d={`M${mark.point.x - 9},${mark.point.y}h18 M${mark.point.x},${mark.point.y - 9}v18`} stroke="#fff" strokeWidth="1.5" />
                  </G>
              ))}
            </Svg>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={undo} style={styles.utilityButton}><RotateCcw color={COLORS.navy} size={16} /><Text style={styles.utilityText}>Undo</Text></Pressable>
          <Pressable onPress={() => { setBoard((current) => ({ ...current, lines: [] })); setSaved(false); }} style={styles.utilityButton}><Eraser color={COLORS.navy} size={16} /><Text style={styles.utilityText}>Clear lines</Text></Pressable>
          <Pressable onPress={clearBoard} style={styles.utilityButton}><Trash2 color="#a5463e" size={16} /><Text style={styles.destructiveText}>Clear all</Text></Pressable>
        </View>
        <Pressable onPress={() => void saveBoard()} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Save color="#fff" size={18} /><Text style={styles.saveText}>{saved ? "Save Whiteboard" : "Save Play Diagram"}</Text>
        </Pressable>
        <Text style={styles.savedStatus}>{saved ? "Saved on this device" : "Unsaved changes"}</Text>
      </ScrollView>
    </Screen>
  );
}

function ReactPlayer({ mark }: { mark: BoardMark }) {
  return (
    <G>
      <SvgCircle cx={mark.point.x} cy={mark.point.y} fill={COLORS.navy} r="14" stroke="#fff" strokeWidth="2" />
      <SvgText x={mark.point.x} y={mark.point.y + 4} fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">{mark.label}</SvgText>
    </G>
  );
}

function ToolButton({ children, label, active, onPress }: { children: ReactNode; label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.toolButton, active && styles.toolButtonActive]}>{children}<Text style={[styles.toolLabel, active && styles.toolLabelActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 540, paddingBottom: 32, paddingHorizontal: 17, paddingTop: 12, width: "100%" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginBottom: 12 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  title: { color: COLORS.navyDark, fontSize: 27, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  toolbar: { flexDirection: "row", gap: 7, marginTop: 16 },
  toolButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 7, borderWidth: 1, flex: 1, flexDirection: "row", gap: 5, height: 41, justifyContent: "center" },
  toolButtonActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  toolLabel: { color: COLORS.navy, fontSize: 11, fontWeight: "700" },
  toolLabelActive: { color: "#fff" },
  ballIcon: { color: COLORS.orange, fontSize: 17 },
  tip: { color: COLORS.muted, fontSize: 11, marginTop: 8 },
  courtFrame: { alignSelf: "center", aspectRatio: WIDTH / HEIGHT, backgroundColor: "#c8864b", borderColor: "#9a6130", borderRadius: 9, borderWidth: 1, marginTop: 12, maxWidth: 380, overflow: "hidden", width: "100%" },
  courtTouch: { flex: 1 },
  actions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 13 },
  utilityButton: { alignItems: "center", flexDirection: "row", gap: 5, paddingVertical: 8 },
  utilityText: { color: COLORS.navy, fontSize: 11, fontWeight: "600" },
  destructiveText: { color: "#a5463e", fontSize: 11, fontWeight: "600" },
  saveButton: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 7, flexDirection: "row", gap: 9, height: 48, justifyContent: "center", marginTop: 12 },
  saveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  savedStatus: { color: COLORS.muted, fontSize: 10, marginTop: 7, textAlign: "center" },
  pressed: { opacity: 0.78 },
});
