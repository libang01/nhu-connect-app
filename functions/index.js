const functions = require("firebase-functions");

// HTTP Trigger
exports.helloWorld = functions.https.onRequest((req, res) => {
  console.log("V1 Function executed");
  res.send("Hello from Firebase v1!");
});

// You can add more v1-style functions:
exports.scheduledFunction = functions.pubsub.schedule('every 5 minutes').onRun((context) => {
  console.log("This runs every 5 minutes");
  return null;
});