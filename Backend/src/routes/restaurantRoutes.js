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
  getNearbyRestaurants,
  getMyRestaurant,
  updateMyRestaurant,
  getMyStaff,
  addStaff,
  updateStaff,
  removeStaff
} = require("../controller/restaurantController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Restaurant owner routes (must be before /:id to avoid conflict)
router.get("/my-restaurant", protect, getMyRestaurant);
router.put("/my-restaurant", protect, updateMyRestaurant);

// Staff management routes
router.get("/my-restaurant/staff", protect, getMyStaff);
router.post("/my-restaurant/staff", protect, addStaff);
router.put("/my-restaurant/staff/:staffId", protect, updateStaff);
router.delete("/my-restaurant/staff/:staffId", protect, removeStaff);

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
