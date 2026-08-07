import Razorpay from "razorpay";
import { config } from "../config/config.js";
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_SECRET_ID,
});

export default razorpay;
