import { asyncHandler } from "../utils/asyncHandler.js";
import { validateCheckout } from "../service/checkout.service.js";

export const checkoutPreviewController = asyncHandler(
  async (req, res) => {
    const { couponCode = null } = req.body || {};

    const checkout = await validateCheckout({
      studentId: req.user.id,
      couponCode,
    });

    return res.status(200).json({
      success: true,
      message: "Checkout validated successfully",
      checkout,
    });
  },
);