const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "İzleKazan API çalışıyor" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("İzleKazan çalışıyor. PORT:", PORT);
});
