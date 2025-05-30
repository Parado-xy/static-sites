const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const uploadRoutes = require("./routes/upload");

const app = express();
const PORT = process.env.PORT || 5690;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "src")));

// Routes
app.use("/api/v1/file", uploadRoutes);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
