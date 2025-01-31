// routes/index.js
const express = require("express");
const router = express.Router();
const Hotel = require("../models/hotel");
const Golf = require("../models/golf");
const User = require("../models/user");
const adminController = require("../controllers/adminController");
const hotelController = require("../controllers/hotelController");
const Vouchers = require("../models/voucher");
const Package = require("../models/package"); // 경로를 프로젝트 구조에 맞게 조정
const amenitiesIconList = require("../constant/amenitesIconList")
const amenitiesRoomIconList = require("../constant/amenitiesRoomIconList")
const highlightsIconList = require("../constant/highlightsIconList")
// router.get('/', async (req, res) => {
//     try {

//         res.render('rendering/html/index', );

//     } catch (error) {
//         console.error('Error fetching data:', error);
//         console.error('Error stack:', error.stack);
//         res.status(500).send(`Error fetching data: ${error.message}`);
//     }
// });
router.get("/about", async (req, res) => {
  try {
    res.render("rendering/html/about");
  } catch (error) {
    console.error("Error fetching data:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});
router.get("/customer", async (req, res) => {
  try {
    res.render("crendering/html/index");
  } catch (error) {
    console.error("Error fetching data:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find({ $where: "this.rooms.length > 0" })
      .select("id title image_id price slug")
      .populate("rooms");

    const golfCourses = await Golf.find({}).select(
      "_id id title slug image_id ratingInfo facilityTags price"
    );

    const gKrabi = await Golf.find({ location: "Kanchanaburi" }).select(
      "_id id title slug image_id ratingInfo facilityTags price"
    );

    const gbangkok = await Golf.find({ location: "Bangkok" }).select(
      "_id id title slug image_id ratingInfo facilityTags price"
    );

    const gchiangmai = await Golf.find({ location: "Chiang Mai" }).select(
      "_id id title slug image_id ratingInfo facilityTags price"
    );

    const gpattaya = await Golf.find({ location: "Pattaya" }).select(
      "_id id title slug image_id ratingInfo facilityTags price"
    );

    const ppattaya = await Package.find({ location: "Pattaya" }).select(
      "_id title image_id ratingInfo price"
    );

    const pbangkok = await Package.find({ location: "Bangkok" }).select(
      "_id title image_id ratingInfo price"
    );

    const pphuket = await Package.find({ location: "Phuket" }).select(
      "_id title image_id ratingInfo price"
    );

    const pkhaoyai = await Package.find({ location: "Khao Yai" }).select(
      "_id title image_id ratingInfo price"
    );

    const bestsellers = await Hotel.find({
      $where: "this.rooms.length > 0",
      isPromotion: true,
      promotionType: "BestSellers",
    })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const firesales = await Hotel.find({ $where: "this.rooms.length > 0" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const pattaya = await Hotel.find({ location_category: "Pattaya" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const Krabi = await Hotel.find({ location_category: "Krabi" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const bangkok = await Hotel.find({ location_category: "Bangkok" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const phuket = await Hotel.find({ location_category: "Phuket" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const chiangmai = await Hotel.find({ location_category: "Chiang mai" })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");

    const earlybird = await Hotel.find({
      $where: "this.rooms.length > 0",
      isPromotion: true,
      promotionType: "EarlyBird",
    })
      .select("id title image_id star_rate facilityTags price slug content")
      .populate("rooms");
    res.render("index", {
      user: req.user,
      hotels,
      golfCourses,
      bestsellers,
      firesales,
      pattaya,
      earlybird,
      Krabi,
      bangkok,
      phuket,
      chiangmai,
      gpattaya,
      gKrabi,
      gbangkok,
      gchiangmai,
      pbangkok,
      ppattaya,
      pphuket,
      pkhaoyai,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    console.error("Error stack:", error.stack);
    res.status(500).send(`Error fetching data: ${error.message}`);
  }
});

router.get("/testing", async (req, res) => {
  const UpdateAllHotels = await Hotel.updateMany({
    isPromotion: true,
    promotionType: "BestSellers",
    promotionStartDate: null,
    promotionEndDate: null,
    voucherAmount: 20000,
  });
  const UpdateAllGolfs = await Golf.updateMany({
    isPromotion: false,
    promotionType: "",
    promotionStartDate: null,
    promotionEndDate: null,
    voucherAmount: 20000,
  });
  res.send("complete");
});

// New route for hotel search
router.get("/search", hotelController.searchHotels);

// ฟังก์ชันที่จะคำนวณวันที่สิ้นสุด 3 เดือนจากปัจจุบัน
const getExpiredDate = () => {
  const today = new Date();
  today.setMonth(today.getMonth() + 3); // เพิ่ม 3 เดือน
  return today.toISOString().split("T")[0]; // คืนค่าในรูปแบบ YYYY-MM-DD
};

const getMonthDay = (date) => {
  const d = new Date(date);
  return (d.getMonth() + 1) * 100 + d.getDate(); // คืนค่าเป็นตัวเลขแบบ MMDD
};

router.get("/hotel-details/:slug", async (req, res) => {
  console.log("/hotel-details/:slug");
  try {
    const slug = req.params.slug;
    const period = req.query.period || new Date(); // รับค่า period จาก query string

    const periodMonthDay = getMonthDay(period); // แปลง period ให้เป็นตัวเลข MMDD

    // ดึงข้อมูลโรงแรมจาก database
    const hotel = await Hotel.findOne({ slug }).populate("rooms");
    if (!hotel) {
      return res.status(404).send("Hotel not found");
    }

    // กรองข้อมูลใน price_periods โดยใช้แค่เดือนและวัน
    const filteredPricePeriods = hotel?.price_periods?.filter((period) => {
      const periodStartMonthDay = getMonthDay(period.start_date); // แปลง start_date เป็น MMDD
      const periodEndMonthDay = getMonthDay(period.end_date); // แปลง end_date เป็น MMDD

      // ตรวจสอบว่า periodMonthDay อยู่ในช่วงของ start_date และ end_date (ในรูปแบบ MMDD)
      return (
        periodStartMonthDay <= periodMonthDay &&
        periodEndMonthDay >= periodMonthDay
      );
    });

    let pricePeriodDetails = {}; // สำหรับเก็บข้อมูลของช่วงเวลาที่ตรง

    let selectedPeriod;
    if (filteredPricePeriods.length > 0) {
      selectedPeriod = filteredPricePeriods[0]; // เลือกช่วงเวลาที่ตรงกับวันที่
      pricePeriodDetails = selectedPeriod.room_prices; // ข้อมูลราคาห้องที่ตรงกับช่วงเวลา
    } else {
      selectedPeriod = {}; // กำหนดเป็น object เปล่า
      selectedPeriod.start_date = new Date(); // วันที่ปัจจุบัน
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // เพิ่มอีก 3 เดือน
      selectedPeriod.end_date = endDate;
    }

    const filteredRooms = hotel.rooms.map((room) => {
      let price = room.price; // ค่าเริ่มต้นเป็นราคาปกติ
      const roomId = room._id;
      // ตรวจสอบว่า Map มีราคาที่ตรงกับ roomId หรือไม่
      if (pricePeriodDetails[roomId]) {
        price = pricePeriodDetails[roomId]; // ใช้ราคาห้องที่ตรงกับ id
      }

      // เพิ่ม icon ให้ amenity แต่ละตัว
      const amenitiesRoomIcon = room?.amenities?.map(list => amenitiesRoomIconList[list])
      

      return {
        ...room, // แปลง room ให้เป็น object หากมันเป็น instance ของ mongoose
        price, // ใช้ราคาที่ได้จาก pricePeriodDetails หรือ default
        amenitiesRoomIcon, 
      };
    });
    // หาไอคอน
    const amenitiesIcon = hotel?.amenities?.map( list => amenitiesIconList[list])
    const highlightIcon = hotel?.highlights?.map( list => highlightsIconList[list])

    // ส่งข้อมูลกลับไปที่ view
    res.render("hotelDetails", {
      user: req.user,
      hotel: { ...hotel.toObject(), rooms: filteredRooms ,amenitiesIcon,highlightIcon },
      period_start: new Date(selectedPeriod.start_date).toLocaleDateString(),
      period_end: new Date(selectedPeriod.end_date).toLocaleDateString(),
    });
  } catch (error) {
    console.error("Error fetching hotel details:", error);
    res.status(500).send("Error fetching hotel details");
  }
});

router.get("/v3/test/changeboard", async (req, res) => {
  let ModifyAllUserIds = await Vouchers.updateMany({
    userId: "perfectholders2877@gmail.com",
  });
  res.send("Change Complete");
});

// Admin routes
router.get("/admin/dashboard", adminController.getDashboard);
router.get("/admin/users", adminController.getUsers);
router.get("/admin/vouchers", adminController.getVouchers);
router.get("/admin/invoices", adminController.getInvoices);

// New route for hotel registration API
router.post("/api/hotels", hotelController.registerHotel);

// Best Sellers route
router.get("/best-sellers", (req, res) => {
  res.redirect("/promotions");
});

// New route for promotions
router.get("/promotions", hotelController.getPromotions);
// 로그인 확인 미들웨어 함수
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  alert("로그인이 필요합니다.");
  res.redirect("/");
}
module.exports = router;
