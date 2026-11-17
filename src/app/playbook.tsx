import { TrainingEntry, TrainingLibrary } from "../components/training-library";

const plays: TrainingEntry[] = [
  {
    name: "Horns High Pick-and-Roll",
    category: "Half-court · Man",
    summary: "A simple two-sided read from the horns alignment.",
    time: "12 MIN",
    setup: "5 players. Both bigs start at the elbows, wings in the corners, point guard up top.",
    steps: [
      "Point guard calls the side and passes to that wing; ball-side elbow screens down for the opposite wing.",
      "Point guard uses the ball-side elbow's high screen and attacks the middle.",
      "The screener rolls hard, weak-side big lifts, and the opposite wing stays spaced in the corner.",
    ],
    coaching: "Read the low defender: finish at the rim, hit the roller, or skip to the weak-side shooter.",
  },
  {
    name: "5-Out Pass and Cut",
    category: "Motion · Man",
    summary: "Keep five players spaced and create constant rim pressure.",
    time: "15 MIN",
    setup: "5 players spaced around the arc with at least 12 feet between spots.",
    steps: [
      "After every pass, the passer basket-cuts looking for a give-and-go.",
      "If the cutter is not open, fill the next open perimeter spot.",
      "The receiver can drive, shoot, or reverse the ball; teammates lift and drift to preserve spacing.",
    ],
    coaching: "Cut hard enough to make the defense help. Replace spots quickly and never watch your pass.",
  },
  {
    name: "Baseline Box: Stack",
    category: "Baseline out of bounds",
    summary: "A quick inbound look with a safe second option.",
    time: "8 MIN",
    setup: "Four players form a box around the lane; inbounder stands outside the baseline.",
    steps: [
      "On the signal, the low players screen across for the opposite block and corner.",
      "Near-side elbow slips to the front of the rim as the first scoring option.",
      "If the rim is covered, inbound to the corner and flow into the half-court offense.",
    ],
    coaching: "Make legal, stationary screens and show a clear hand target to the inbounder.",
  },
  {
    name: "2-on-1 Press Break",
    category: "Transition · Press break",
    summary: "Use width and an early middle flash to beat pressure safely.",
    time: "10 MIN",
    setup: "Five players inbounding against a 2-2-1 press; two guards split wide.",
    steps: [
      "The nearest guard cuts back to the ball while the other guard sprints up the sideline.",
      "The middle player flashes to the ball as a safety valve.",
      "Pass ahead only when the receiver is clearly open; otherwise reverse and advance together.",
    ],
    coaching: "Stay composed, meet every pass, and keep a middle outlet available behind the ball.",
  },
];

export default function PlaybookScreen() {
  return <TrainingLibrary eyebrow="TEAM PLAYBOOK" title="Our Playbook" description="Shared calls and clear reads for game day. Tap a play to review the setup and options." entries={plays} storageKey="hoopstats:playbook" kind="play" />;
}
