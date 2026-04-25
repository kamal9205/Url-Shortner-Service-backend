// controllers/user.js

import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET missing");
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID missing");
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function generateToken(user) {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

function safeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function handleUserSignup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const token = generateToken(user);

    return res.status(201).json({
      user: safeUser(user),
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Email already in use",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (item) => item.message
      );

      return res.status(400).json({
        error: messages.join(", "),
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: safeUser(user),
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

async function handleGoogleLogin(req, res) {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        error: "Missing credential",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const {
      sub,
      email,
      name,
      email_verified,
    } = payload;

    if (!email_verified) {
      return res.status(401).json({
        error: "Google email not verified",
      });
    }

    let user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId: sub,
      });
    } else if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: safeUser(user),
      token,
    });
  } catch (error) {
    console.error("Google Login Error:", error);

    return res.status(401).json({
      error: "Invalid Google credential",
    });
  }
}

export {
  handleUserSignup,
  handleUserLogin,
  handleGoogleLogin,
};