const fs = require("fs");

const replacement = `function AiPage() {
  return (
    <section className="page">
      <div className="pageHead">
        <h1>AI Tutor</h1>
        <p>This feature is temporarily disabled while we improve reliability.</p>
      </div>

      <div className="card aiTutorPanel comingSoonPanel">
        <div className="aiTutorTop">
          <div className="aiAvatar"><Bot size={30} /></div>
          <div>
            <span className="badge">Coming Soon</span>
            <h2>Study Blueprint AI Tutor is being upgraded</h2>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const candidates = [
  "src/WorkingDemoApp.jsx",
  "src/DemoApp.jsx"
];

let changed = false;

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;

  const before = fs.readFileSync(file, "utf8");

  if (!before.includes("function AiPage")) {
    console.log(`Skipped ${file}: AiPage function not found.`);
    continue;
  }

  const after = before.replace(
    /function\s+AiPage\s*\(\)\s*\{[\s\S]*?\nfunction\s+ContactPage/,
    `${replacement}\n\nfunction ContactPage`
  );

  if (after === before) {
    console.log(`Could not safely update ${file}. Use MANUAL_REPLACE.txt.`);
    continue;
  }

  fs.writeFileSync(file, after, "utf8");
  changed = true;
  console.log(`Updated ${file}`);
}

if (!changed) {
  console.error("No file updated. Open MANUAL_REPLACE.txt and replace AiPage manually.");
  process.exit(1);
}

console.log("Done. Run: npm run dev");
