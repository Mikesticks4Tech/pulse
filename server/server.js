require("dotenv").config();

const express = require("express");
const cors = require("cors");
const githubRoutes = require("./routes/githubRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/github", githubRoutes);

app.get("/", (req, res) => {
  res.send("Pulse API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Pulse server running on port ${PORT}`));
