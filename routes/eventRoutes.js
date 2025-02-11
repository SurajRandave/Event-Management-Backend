const express = require("express");
const Event = require("../models/Event");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// ✅ Create Event (Already Correct)
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { title, description, date } = req.body;
    if (!title || !description || !date) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const event = new Event({ title, description, date, organizer: req.user.userId });
    await event.save();

    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Get Only User's Events
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("GET /events request received by user:", req.user.userId); // Debugging log

    const events = await Event.find({ organizer: req.user.userId }).populate("organizer", "name");

    if (!events.length) {
      return res.status(404).json({ msg: "No events found" });
    }

    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ✅ Delete Only User's Own Events
router.delete("/delete/:id", authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: "Event not found" });
    }

    // ✅ Ensure the logged-in user owns the event
    if (event.organizer.toString() !== req.user.userId) {
      return res.status(403).json({ msg: "Not authorized to delete this event" });
    }

    await event.deleteOne();
    res.json({ msg: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
