const { createWorker } = require("tesseract.js");
(async () => {
  const worker = await createWorker();
  console.log("keys", Object.keys(worker));
  console.log("load", typeof worker.load);
  console.log("loadLanguage", typeof worker.loadLanguage);
  console.log("initialize", typeof worker.initialize);
  console.log("recognize", typeof worker.recognize);
  await worker.terminate();
})();
