const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    console.log("🔹 Register request received:", req.body);

    const { name, email, password } = req.body;

    // ✅ Check if all fields are provided
    if (!name || !email || !password) {
      console.warn("⚠️ Missing required fields");
      return res.status(400).json({ success: false, message: "Please provide name, email, and password" });
    }

    // ✅ Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.warn(`⚠️ User already exists for email: ${email}`);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // ✅ Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    // ✅ Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("✅ User registered successfully:", email);
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email }, // Exclude password
    });
  } catch (err) {
    console.error("❌ Error in registration:", err.message);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    console.log("🔹 Login request received:", req.body);

    const { email, password } = req.body;

    // ✅ Check if email and password are provided
    if (!email || !password) {
      console.warn("⚠️ Missing email or password");
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // ✅ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`⚠️ User not found for email: ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`⚠️ Incorrect password for email: ${email}`);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ✅ Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    console.log("✅ Login successful, token generated for:", email);
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }, // Return user details excluding password
    });
  } catch (err) {
    console.error("❌ Error in login:", err.message);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
