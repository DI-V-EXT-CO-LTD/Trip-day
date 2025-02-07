//adminRoutes.js
const express = require("express");
const router = express.Router();
const adminsController = require("../controllers/adminsController");
const { uploadHotelImage,uploadRoomImage ,uploadGolfImage, uploadPackageImage} = require("../utils/multer");
// // Middleware to check if the user is an authenticated admin
// const isAuthenticatedAdmin = (req, res, next) => {
//     if (req.isAuthenticated() && req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) {
//         return next();
//     }
//     res.redirect('/'); // Redirect to login page if not authenticated or not an admin
// };

// router.use(isAuthenticatedAdmin);

// get page
router.get("/", adminsController.getIndex);
router.get("/dashboard", adminsController.getDashboard);
router.get("/hotels", adminsController.getHotels);
router.get("/hotels/addHotel", adminsController.getUpdateHotel);
router.get("/hotels/editHotel/:id", adminsController.getUpdateHotel);
router.get("/hotels/:id/rooms", adminsController.getRooms);
router.get("/hotels/:hotelID/addRoom", adminsController.getUpdateRoom);
router.get("/hotels/:hotelID/editRoom/:roomID", adminsController.getUpdateRoom);
router.get("/golfs", adminsController.getGolfs);
router.get("/golfs/addGolf", adminsController.getUpdateGolf);
router.get("/golfs/editGolf/:id", adminsController.getUpdateGolf);
router.get("/packages", adminsController.getPackages);
router.get("/packages/addPackage", adminsController.getUpdatePackage);
router.get("/packages/editPackage/:id", adminsController.getUpdatePackage);
router.get("/invoices", adminsController.getInvoices);
router.get("/purchases", adminsController.getPurchases);
router.get("/vouchers", adminsController.getVouchers);


// Add
router.post(
  "/hotels/addHotel",
  uploadHotelImage.fields([
    { name: "image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ image_id
    { name: "banner_image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ banner_image_id
    { name: "gallery", maxCount: 10 },  // รับไฟล์สูงสุด 10 ไฟล์สำหรับ gallery
  ]), 
  adminsController.postAddHotel
);

router.post(
  "/rooms/addRoom",
  uploadRoomImage.fields([
    { name: "image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ image_id
  ]), 
  adminsController.postAddRoom
);

router.post(
  "/golfs/addGolf",
  uploadGolfImage.fields([
    { name: "image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ image_id
    { name: "banner_image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ banner_image_id
    { name: "gallery", maxCount: 10 },  // รับไฟล์สูงสุด 10 ไฟล์สำหรับ gallery
  ]), 
  adminsController.postAddGolf
);

router.post(
  "/packages/addPackage",
  uploadPackageImage.fields([
    { name: "image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ image_id
    { name: "banner_image_id", maxCount: 1 },  // รับไฟล์ 1 ไฟล์สำหรับ banner_image_id
    { name: "gallery", maxCount: 10 },  // รับไฟล์สูงสุด 10 ไฟล์สำหรับ gallery
  ]), 
  adminsController.postAddPackage
);


// Update
router.put(
  "/hotels/editHotel/:id",
  uploadHotelImage.fields([
    { name: "image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "banner_image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "gallery", maxCount: 10 }, // รับไฟล์สูงสุด 10 ไฟล์สำหรับ other_image
  ]),
  adminsController.putEditHotel
);

router.put(
  "/rooms/editRoom/:id",
  uploadRoomImage.fields([
    { name: "image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
  ]),
  adminsController.putEditRoom
);

router.put(
  "/golfs/editGolf/:id",
  uploadGolfImage.fields([
    { name: "image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "banner_image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "gallery", maxCount: 10 }, // รับไฟล์สูงสุด 10 ไฟล์สำหรับ other_image
  ]),
  adminsController.putEditGolf
);

router.put(
  "/packages/editPackage/:id",
  uploadPackageImage.fields([
    { name: "image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "banner_image_id", maxCount: 1 }, // รับไฟล์ 1 ไฟล์สำหรับ main_image
    { name: "gallery", maxCount: 10 }, // รับไฟล์สูงสุด 10 ไฟล์สำหรับ other_image
  ]),
  adminsController.putEditPackage
);

router.put(
  "/invoices/invoiceStatus",
  adminsController.putInvoiceStatus
);
router.put(
  "/purchases/purchaseStatus",
  adminsController.putPurchaseStatus
);
module.exports = router;
