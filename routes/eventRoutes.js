const express = require("express");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create Event
router.post("/create", authMiddleware, async (req, res) => {
  const { title, description, date } = req.body;
  try {
    const event = new Event({ title, description, date, organizer: req.user.userId });
    await event.save();
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Get All Events
router.get("/", async (req, res) => {
  const events = await Event.find().populate("organizer", "name");
  res.json(events);
});

module.exports = router;
