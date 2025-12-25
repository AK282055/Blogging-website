const mongoose = require("mongoose");

const vlogSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Vlog", vlogSchema);
