const express = require("express");
const {
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  onboardRestaurant,
  approveRestaurant,
  getOnboardingDetails,
  getNearbyRestaurants
} = require("../controller/restaurantController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/onboard", protect, onboardRestaurant);
router.put("/approve/:userId", protect, approveRestaurant);
router.get("/onboarding-details/:userId", protect, getOnboardingDetails);

router.get("/nearby", getNearbyRestaurants);

router.post("/", protect, createRestaurant);
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);
router.put("/:id", protect, updateRestaurant);
router.delete("/:id", protect, deleteRestaurant);

module.exports = router;
