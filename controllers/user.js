import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function handleUserSignup(req, res) {
  const body = req.body;

  if (!body?.name || !body?.email || !body?.password) {
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  }

  try {
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("Signup Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already in use" });
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

async function handleUserLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ user, token });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function handleGoogleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "Missing credential" });
console.log("Received credential:", credential);
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub, email, name } = payload;
    console.log("Google payload:", payload);

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
      });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }
    console.log("User:", user);

    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "7d" }
    );

    return res.status(200).json({ user, token });
  } catch (error) {
    console.error("Google verify error:", error);
    return res.status(401).json({ error: "Invalid Google credential" });
  }
}

export { handleUserSignup, handleUserLogin, handleGoogleLogin };