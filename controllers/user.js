import User from "../models/user.js";

async function handleUserSignup(req, res) {
  const body = req.body;

  if (!body?.name || !body?.email || !body?.password) {
    return res
      .status(400)
      .json({ error: "Name, email and password are required" });
  }

  const user = await User.create({
    name: body.name,
    email: body.email,
    password: body.password,
  });

  return res.status(201).json({ user });
}

export { handleUserSignup };