import jwt from "jsonwebtoken";
import {config} from "../config/config.js";

export function generateToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}