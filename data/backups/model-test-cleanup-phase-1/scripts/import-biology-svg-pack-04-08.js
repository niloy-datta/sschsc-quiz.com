/**
 * Attach user-provided biology SVG pack (model test 01 + 02).
 */
const fs = require("fs");
const path = require("path");

const ATTACHMENTS = [
  {
    file: "biology/ssc-biology-board-standard-model-test-01.json",
    index: 5,
    image: "/images/quiz/ssc-biology-board-standard-model-test-01-q06.svg",
  },
  {
    file: "biology/ssc-biology-board-standard-model-test-01.json",
    index: 21,
    image: "/images/quiz/ssc-biology-board-standard-model-test-01-q22.svg",
  },
  {
    file: "biology/ssc-biology-board-standard-model-test-02.json",
    index: 2,
    image: "/images/quiz/ssc-biology-board-standard-model-test-02-q03.svg",
  },
  {
    file: "biology/ssc-biology-board-standard-model-test-02.json",
    index: 8,
    image: "/images/quiz/ssc-biology-board-standard-model-test-02-q09.svg",
  },
  {
    file: "biology/ssc-biology-board-standard-model-test-02.json",
    index: 21,
    image: "/images/quiz/ssc-biology-board-standard-model-test-02-q22.svg",
  },
];

const ROOT = path.join(__dirname, "..", "public", "questions");

for (const { file, index, image } of ATTACHMENTS) {
  const fp = path.join(ROOT, file);
  const qs = JSON.parse(fs.readFileSync(fp, "utf8"));
  qs[index].image = image;
  fs.writeFileSync(fp, `${JSON.stringify(qs, null, 2)}\n`, "utf8");
  console.log("Attached", qs[index].id, "→", image);
}
