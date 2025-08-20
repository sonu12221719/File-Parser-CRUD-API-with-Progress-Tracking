import { UserModel } from "../models/User.js";
import { hashPassword } from "../utils/hash.js";
import { generateToken } from "../middlewares/auth.js";

const ALLOW_REGISTRATION =
  (process.env.ALLOW_REGISTRATION || "true").toLowerCase() === "true";

export async function register(req, res) {
  if (!ALLOW_REGISTRATION)
    return res.status(403).json({ error: "Registration disabled" });
  const { email, password } = req.body || {};

  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const exists = await UserModel.findOne({ email });
  if (exists)
    return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    email,
    passwordHash,
  });
  const token = generateToken({
    sub: user.id,
    email: user.email,
  });
  return res
    .status(201)
    .json({ token, user: { id: user.id, email: user.email } });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  const user = await UserModel.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = generateToken({
    sub: user.id,
    email: user.email
  });
  return res.json({
    token,
    user: { id: user.id, email: user.email },
  });
}
