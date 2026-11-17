import { TrainingEntry, TrainingLibrary } from "../components/training-library";

const drills: TrainingEntry[] = [
  {
    name: "Form Shooting",
    category: "Shooting · Fundamentals",
    summary: "Build repeatable mechanics close to the basket.",
    time: "8 MIN",
    setup: "Players pair up at a basket. One ball per pair, starting 3 to 5 feet from the rim.",
    steps: [
      "Shoot one-handed with the guide hand behind the back; hold the finish until the ball lands.",
      "Make five shots, then move one step back while keeping the same balance and release.",
      "Partners rebound and give one specific piece of feedback after each set.",
    ],
    coaching: "Feet balanced, elbow under the ball, relaxed wrist, and a high follow-through.",
  },
  {
    name: "Mikan Finishes",
    category: "Finishing · Footwork",
    summary: "Train soft finishes from both sides of the rim.",
    time: "6 MIN",
    setup: "Players line up under the basket with one ball each, alternating sides.",
    steps: [
      "Step with the outside foot and finish off the inside foot on the right side.",
      "Catch the ball after it drops through and step to finish from the left side.",
      "Continue alternating for 30 seconds, rest briefly, then repeat with the opposite hand.",
    ],
    coaching: "Protect the ball, use the glass, and land balanced before changing direction.",
  },
  {
    name: "Closeout to Contain",
    category: "Defense · Footwork",
    summary: "Practice controlled closeouts without giving up the drive.",
    time: "10 MIN",
    setup: "Pairs start at the lane line and wing; offense has a ball on the wing.",
    steps: [
      "Defender sprints the first two-thirds of the closeout, then chops into short steps.",
      "Finish with a high hand, chest square, and one arm's length of space.",
      "Offense attacks either direction for two dribbles; defender slides and contains.",
    ],
    coaching: "Arrive under control: no fly-bys, crossed feet, or reaching across the body.",
  },
  {
    name: "3-on-2 Continuous",
    category: "Transition · Decision making",
    summary: "Read the defense and turn every possession into a fast break.",
    time: "12 MIN",
    setup: "Three attackers start at half court against two defenders; a line waits under each basket.",
    steps: [
      "Attack with width and advance the ball before the defense gets set.",
      "The ball handler draws a defender, then passes to the open lane or finishes.",
      "After the shot or stop, two players become defenders going the other way with three new attackers.",
    ],
    coaching: "Sprint wide lanes, communicate early, and make the simple pass that creates a layup.",
  },
];

export default function DrillsScreen() {
  return <TrainingLibrary eyebrow="DRILL BOOK" title="Practice Drills" description="Ready-to-run skill work with setup, progression, timing, and a coaching cue for each drill." entries={drills} storageKey="hoopstats:drill-book" kind="drill" transfer />;
}
