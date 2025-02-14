const User = require("../models/user");
const Hotel = require("../models/hotel");
const Golf = require("../models/golf");
const Package = require("../models/package");
const Invoice = require("../models/inv");
const Voucher = require("../models/voucher");
const Booking = require("../models/Booking");
const Wallet = require("../models/wallet");
const Reservation = require("../models/reservation");
const Purchase = require("../models/purchase");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const typeOfBeds = require("../constant/bedType");


// For layout
exports.getIndex = async (req, res) => {
  try {
    const users = await User.find();
    const wallet = await Wallet.find();
    const vouchers = await Voucher.find();
    const reservations = await Reservation.find();
    const purchases = await Purchase.find();
    const invoices = await Invoice.find({ userId: { $ne: "" } });
    const hotels = await Hotel.find();
    const bookings = await Booking.find(); // Bookinging 데이터를 조회하는 코드
    const userCount = await User.countDocuments();

    // Fetch current purchases (with "Paid" status)
    const currentPurchases = await Purchase.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent purchases

    // Fetch pending invoices
    const pendingInvoices = await Invoice.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent pending invoices

    // Fetch golf courses for Golf Courses Management section
    const golfCourses = await Golf.find()
      .select("title price status course_info.holes course_info.par")
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent golf courses

    res.render("admins/layout", {
      admin: req.user,
      users,
      wallet,
      vouchers,
      reservations,
      purchases,
      invoices,
      hotels,
      bookings, // 조회된 booking 데이터를 추가로 전달
      currentPurchases,
      pendingInvoices,
      golfCourses, // Add this line
      userCount,
      title: "Dashboard",
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.render("../view/errors/500");
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const users = await User.find();
    const wallet = await Wallet.find();
    const vouchers = await Voucher.find();
    const reservations = await Reservation.find();
    const purchases = await Purchase.find();
    const invoices = await Invoice.find({ userId: { $ne: "" } });
    const hotels = await Hotel.find();
    const bookings = await Booking.find(); // Bookinging 데이터를 조회하는 코드
    const userCount = await User.countDocuments();

    // Fetch current purchases (with "Paid" status)
    const currentPurchases = await Purchase.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent purchases

    // Fetch pending invoices
    const pendingInvoices = await Invoice.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent pending invoices

    // Fetch golf courses for Golf Courses Management section
    const golfCourses = await Golf.find()
      .select("title price status course_info.holes course_info.par")
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 most recent golf courses

    // dashboard.ejs로 데이터 전달
    res.render("admins/dashboard", {
      layout: false,
      admin: req.user,
      users,
      wallet,
      vouchers,
      reservations,
      purchases,
      invoices,
      hotels,
      bookings, // 조회된 booking 데이터를 추가로 전달
      currentPurchases,
      pendingInvoices,
      golfCourses, // Add this line
      userCount,
      title: "Dashboard",
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.render("../view/errors/500");
  }
};

exports.getUsers = async (req, res) => {
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { email: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { role: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ address
            { companyName: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [users, totalDocument] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/user/users", {
      admin: req.user,
      users,
      currentPage,
      totalDocument,
      totalPages,
      title: "Users",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.render("../views/errors/500", { layout: false });
  }
};

exports.getUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let user = null;
    const isAdd = id === undefined;
    if (!isAdd) {
      user = await User.findOne({ _id: id });
    }

    res.render("admins/user/update", {
      admin: req.user,
      title: isAdd ? "Add User" : "Edit User",
      isAdd,
      user,
    });
  } catch (error) {
    console.error("Error in getUpdateUser:", error);
    res.status(500).send(error);
  }
};

exports.getHotels = async (req, res) => {
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { address: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ address
            { nameEn: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [hotels, totalDocument] = await Promise.all([
      Hotel.find(filter).skip(skip).limit(limit),
      Hotel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/hotel/hotels", {
      admin: req.user,
      hotels,
      currentPage,
      totalDocument,
      totalPages,
      title: "Hotels",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.render("../views/errors/500", { layout: false });
  }
};

exports.getUpdateHotel = async (req, res) => {
  try {
    const { id } = req.params;
    let hotel = null;
    const isAdd = id === undefined;
    if (!isAdd) {
      hotel = await Hotel.findOne({ _id: id });
    }

    res.render("admins/hotel/update", {
      admin: req.user,
      title: isAdd ? "Add Hotel" : "Edit Hotel",
      isAdd,
      hotel,
    });
  } catch (error) {
    console.error("Error in getUpdateHotel:", error);
    res.status(500).send(error);
  }
};

exports.getRooms = async (req, res) => {
  try {
    const hotelId = req.params.id;
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { content: { $regex: searchQuery, $options: "i" } },
          ],
        }
      : {};

    const hotelRooms = await Hotel.aggregate([
      { $match: { _id: new ObjectId(hotelId) } }, // กรองที่ระดับ hotel
      { $unwind: "$rooms" }, // แยก rooms ให้ออกมาเป็นเอกสารแต่ละรายการ
      { $match: filter }, // กรองข้อมูลที่ระดับของ room (title หรือ content)
      {
        $group: {
          _id: "$_id", // รวมกลับเป็น hotel เดิม
          rooms: { $push: "$rooms" }, // นำ rooms ที่ match เก็บไว้ใน array
        },
      },
      { $project: { rooms: { $slice: ["$rooms", skip, limit] } } }, // ใช้ slice จัดการ skip และ limit
    ]);
    const totalDocument =
      hotelRooms.length > 0 ? hotelRooms[0].rooms.length : 0;
    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งหมด
    res.render("admins/room/rooms", {
      admin: req.user,
      hotelId,
      rooms: hotelRooms[0]?.rooms || [],
      currentPage,
      totalDocument,
      totalPages,
      title: "Room",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getRooms:", error);
    // res.render("../views/errors/500", { layout: false });
  }
};

exports.getUpdateRoom = async (req, res) => {
  console.log("form add room");

  const hotelId = req.params.hotelID;
  const roomId = req.params.roomID;
  const isAdd = roomId === undefined;

  let room
  if(!isAdd){
   room = await Hotel.find(
    { _id: hotelId,"rooms._id":roomId },{"rooms.$":1,_id:0},
  )}

  const periodSeason = await Hotel.find(
    { _id: hotelId },
    { _id: 0, price_periods: 1 }
  );

  try {
    res.render("admins/room/update", {
      hotelId,
      roomId,
      periodSeason: periodSeason[0].price_periods,
      isAdd,
      room: isAdd ? null :  room[0]?.rooms[0]
    });
  } catch (error) {
    console.error("Error in getUpdateRoom:", error);
    res.render("../views/errors/500", { layout: false });
  }
};

exports.getGolfs = async (req, res)=>{
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { address: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ address
            { nameEn: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [golfs, totalDocument] = await Promise.all([
      Golf.find(filter).skip(skip).limit(limit),
      Golf.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/golf/golfs", {
      admin: req.user,
      golfs,
      currentPage,
      totalDocument,
      totalPages,
      title: "Golfs",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getGolfs:", error);
    res.render("../views/errors/500", { layout: false });
  }
}

exports.getUpdateGolf = async (req, res) => {
  try {
    const { id } = req.params;
    let golf = null;
    const isAdd = id === undefined;
    if (!isAdd) {
      golf = await Golf.findOne({ _id: id });
    }

    res.render("admins/golf/update", {
      admin: req.user,
      title: isAdd ? "Add Golf" : "Edit Golf",
      isAdd,
      golf,
    });
  } catch (error) {
    console.error("Error in getUpdateGolf:", error);
    res.status(500).send(error);
  }
};

exports.getPackages = async (req, res)=>{
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { title: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { address: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ address
            { nameEn: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [packages, totalDocument] = await Promise.all([
      Package.find(filter).skip(skip).limit(limit),
      Package.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/package/packages", {
      admin: req.user,
      packages,
      currentPage,
      totalDocument,
      totalPages,
      title: "Packages",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getPackages:", error);
    res.render("../views/errors/500", { layout: false });
  }
}

exports.getUpdatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    let package = null;
    const isAdd = id === undefined;
    if (!isAdd) {
      package = await Package.findOne({ _id: id });
    }

    res.render("admins/package/update", {
      admin: req.user,
      title: isAdd ? "Add Package" : "Edit Package",
      isAdd,
      package,
    });
  } catch (error) {
    console.error("Error in getUpdatePackage:", error);
    res.status(500).send(error);
  }
};

exports.getInvoices = async (req, res)=>{
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { invoiceNumber: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { userId: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [invoices, totalDocument] = await Promise.all([
      Invoice.find(filter).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/invoice/invoices", {
      admin: req.user,
      invoices,
      currentPage,
      totalDocument,
      totalPages,
      title: "Invoice",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getInvoice:", error);
    res.render("../views/errors/500", { layout: false });
  }
}

exports.getPurchases = async (req, res)=>{
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { purchaseId: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { paymentMethod: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
            { invoice: { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [purchases, totalDocument] = await Promise.all([
      Purchase.find(filter).skip(skip).limit(limit),
      Purchase.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/purchase/purchases", {
      admin: req.user,
      purchases,
      currentPage,
      totalDocument,
      totalPages,
      title: "Purchase",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getPurchases:", error);
    res.render("../views/errors/500", { layout: false });
  }
}

exports.getVouchers = async (req, res)=>{
  try {
    const limit = 10; // จำนวนรายการต่อหน้า
    const currentPage = parseInt(req.query.page) || 1; // หน้าปัจจุบัน (ค่าเริ่มต้น = 1)
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit; // จำนวนรายการที่ต้องข้าม

    const filter = searchQuery
      ? {
          $or: [
            { "voucher.voucherCode": { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ title
            { "purchase.purchaseId": { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
            { "voucher.title": { $regex: searchQuery, $options: "i" } }, // ค้นหาในฟิลด์ description
          ],
        }
      : {};

    // ดึงข้อมูลโรงแรมและคำนวณจำนวนหน้าทั้งหมด
    const [vouchers, totalDocument] = await Promise.all([
      Voucher.aggregate([
        // เชื่อม `User`
        {
          $lookup: {
            from: "purchases",
            localField: "purchaseId",
            foreignField: "_id",
            as: "purchase",
          },
        },
        { $unwind: "$purchase" },
        { $match: filter }, // กรองตามเงื่อนไข
        { $skip: skip }, // ข้ามตาม pagination
        { $limit: limit }, // จำกัดจำนวนข้อมูล
      ]),
      Voucher.aggregate([
        // เชื่อม `User`
        {
          $lookup: {
            from: "purchases",
            localField: "purchaseId",
            foreignField: "_id",
            as: "purchase",
          },
        },
        { $unwind: { path: "$purchase", preserveNullAndEmptyArrays: true } },
        { $match: filter },
        { $count: "total" },
      ])
    ]);

    console.log(vouchers)
    const totalPages = Math.ceil(totalDocument / limit); // คำนวณจำนวนหน้าทั้งห
    // dashboard.ejs로 데이터 전달
    res.render("admins/voucher/vouchers", {
      admin: req.user,
      vouchers,
      currentPage,
      totalDocument,
      totalPages,
      title: "Voucher",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getVouchers:", error);
    res.render("../views/errors/500", { layout: false });
  }
}

exports.getBookings = async (req, res) => {
  try {
    const limit = 10;
    const currentPage = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || "";
    const skip = (currentPage - 1) * limit;

    // สร้าง filter เงื่อนไขการค้นหา
    const matchStage = {};

    if (searchQuery) {
      matchStage.$or = [
        { "voucher.voucherCode": { $regex: searchQuery, $options: "i" } },
        { "voucher.validFrom": { $regex: searchQuery, $options: "i" } },
        { "voucher.validUntil": { $regex: searchQuery, $options: "i" } },
        { "user.email": { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Query ด้วย Aggregate
    const [bookings, totalDocument] = await Promise.all([
      Booking.aggregate([
        // เชื่อม `User`
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },

        // เชื่อม `Voucher` (หรือเปลี่ยนเป็น `Invoice` ถ้าข้อมูลอยู่ที่นั่น)
        {
          $lookup: {
            from: "vouchers",
            localField: "voucherId",
            foreignField: "_id",
            as: "voucher",
          },
        },
        { $unwind: { path: "$voucher", preserveNullAndEmptyArrays: true } },

        { $match: matchStage }, // กรองตามเงื่อนไข
        { $skip: skip }, // ข้ามตาม pagination
        { $limit: limit }, // จำกัดจำนวนข้อมูล
      ]),
      Booking.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "vouchers",
            localField: "voucherId",
            foreignField: "_id",
            as: "voucher",
          },
        },
        { $unwind: { path: "$voucher", preserveNullAndEmptyArrays: true } },
        { $match: matchStage },
        { $count: "total" },
      ]),
    ]);

    const totalPages = Math.ceil((totalDocument[0]?.total || 0) / limit);

    res.render("admins/booking/bookings", {
      admin: req.user,
      bookings,
      currentPage,
      totalDocument: totalDocument[0]?.total || 0,
      totalPages,
      title: "Bookings",
      searchQuery,
    });
  } catch (error) {
    console.error("Error in getBookings:", error);
    res.render("../views/errors/500", { layout: false });
  }
};

// post

exports.postAddHotel = async (req, res) => {
  console.log("form postAddhotel");
  try {
    const {
      title,
      nameEn,
      slug,
      map_zoom,
      city,
      map_url,
      address,
      content,
      star_rate,
      isPromotion,
      promotionStartDate,
      promotionEndDate,
      promotionType,
      is_featured,
      highlights,
      amenities,
      isFreeAmenities,
      metro,
      airport,
      train,
      check_in_start,
      check_in_end,
      check_out_start,
      check_out_end,
      bed_policy,
      breakfast,
      deposit_policy,
      pet_policy,
      service_animal_policy,
      age_policy,
      payment,
      status,
      startDate,
      endDate,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
    } = req.body;

    // const image_id = req.files.image_id ? req.files.image_id[0].location : null;
    //   const banner_image_id = req.files.banner_image_id ? req.files.banner_image_id[0].location : null;
    //   const gallery = req.files.gallery ? req.files.gallery.map(file => file.location) : [];

    const image_id = req.files.image_id ? req.files.image_id[0].filename : null;
    const banner_image_id = req.files.banner_image_id
      ? req.files.banner_image_id[0].filename
      : null;
    const gallery = req.files.gallery
      ? req.files.gallery.map((file) => file.filename)
      : [];

    const price_periods = startDate.map((start, index) => {
      const endDateData = endDate[index];
      return {
        start_date: start,
        end_date: endDateData,
        room_prices: {},
      };
    });

    const newHotel = new Hotel({
      title,
      nameEn,
      slug,
      address,
      content,
      map_url,
      map_zoom,
      city,
      image_id,
      banner_image_id,
      gallery,
      star_rate,
      isPromotion,
      promotionStartDate:isPromotion ? new Date(promotionStartDate):null ,
      promotionEndDate:isPromotion ? new Date(promotionEndDate):null,
      promotionType,
      is_featured,
      highlights,
      amenities,
      isFreeAmenities,
      surrounding: { metro, airport, train },
      check_in_start,
      check_in_end,
      check_out_start,
      check_out_end,
      bed_policy,
      breakfast,
      deposit_policy,
      pet_policy,
      service_animal_policy,
      age_policy,
      payment,
      price_periods,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      rooms: [],
      status,
    });

    await newHotel.save();

    // แสดงผลลัพธ์ หรือเปลี่ยนหน้า
    res.json({ redirectUrl: "/admins#hotels" });
  } catch (error) {
    console.error("Error saving hotel:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.postAddRoom = async (req, res) => {
  console.log("form postAddRoom");
  try {
    const {
      hotelId,
      name,
      size,
      amenities,
      price,
      bedType,
      bedQuantity,
      adults,
      children,
      startDate,
      endDate,
      room_prices,
      is_breakfast_included,
      is_refundable,
      is_instantConfirmation,
      is_onlinepay,
      content,
      status,
    } = req.body;

    console.log(req.body)
    // const image_id = req.files.image_id ? req.files.image_id[0].location : null;
    //   const banner_image_id = req.files.banner_image_id ? req.files.banner_image_id[0].location : null;
    //   const gallery = req.files.gallery ? req.files.gallery.map(file => file.location) : [];

    const image_id = req.files.image_id ? req.files.image_id[0].filename : null;

    let sleeps = 0;

    bedType.forEach((bed, index) => {
      sleeps += (typeOfBeds[bed] || 0) * (bedQuantity[index] || 0); // Add default values to avoid errors
    });

    const objectBedType = bedType.reduce((acc, bed, index) => {
      acc[bed] = bedQuantity[index]; // กำหนด key เป็น bed และ value เป็น bedQuantity[index]
      return acc;
    }, {});


    const hotel = await Hotel.findById(hotelId);
    if (!hotel) throw new Error("Hotel not found");
    const newRoomId = new mongoose.Types.ObjectId().toString();

    const newRoom = {
      _id: newRoomId,
      title: name,
      price: Number(price),
      size: Number(size),
      beds: sleeps,
      status: status,
      bedType: objectBedType,
      amenities,
      adults: Number(adults),
      children: Number(children),
      is_breakfast_included: is_breakfast_included === "1",
      is_refundable: is_refundable === "1",
      is_instantConfirmation: is_instantConfirmation === "1",
      is_onlinepay: is_onlinepay === "1",
      created_at: new Date(),
      updated_at: new Date(),
      // กำหนดค่าเริ่มต้นสำหรับฟิลด์อื่นๆ ตามต้องการ
      content,
      images: [image_id],
      room_details: {},
    };

    hotel.rooms.push(newRoom);

    
    
    if(startDate.length > 0){

    for (let i = 0; i < startDate.length; i++) {
      const startDateSeason = new Date(startDate[i]);
      const endDateSeason = new Date(endDate[i]);
      const roomPriceSeason = Number(room_prices[i]);


      // ค้นหา period ที่มี start_date และ end_date ตรงกับที่ส่งมา
      const period = hotel.price_periods.find(
        (p) =>
          new Date(p.start_date).toISOString() ===
            startDateSeason.toISOString() &&
          new Date(p.end_date).toISOString() === endDateSeason.toISOString()
      );

      if (!period) {
        throw new Error(
          `ไม่พบช่วงวันที่ ${startDateSeason[i]} ถึง ${endDateSeason[i]}`
        );
      }

      // เพิ่มราคาห้องใหม่เข้าไป
      period.room_prices[newRoomId] = roomPriceSeason;
      period.markModified('room_prices');

    }
  }

    await hotel.save();


    //     // แสดงผลลัพธ์ หรือเปลี่ยนหน้า
    //     res.json({ redirectUrl: "/admins#hotels" });
  } catch (error) {
    console.error("Error saving hotel:", error);
    res.status(500).send("Internal Server Error");
  } 
}

exports.postAddGolf = async (req, res) => {
  console.log("form postAddGolf");
  try {
    const {
      title,
      nameEn,
      price,
      slug,
      address,
      content,
      location,
      star_rate,
      isPromotion,
      promotionStartDate,
      promotionEndDate,
      promotionType,
      is_featured,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    } = req.body;
  

    // const image_id = req.files.image_id ? req.files.image_id[0].location : null;
    //   const banner_image_id = req.files.banner_image_id ? req.files.banner_image_id[0].location : null;
    //   const gallery = req.files.gallery ? req.files.gallery.map(file => file.location) : [];

    const image_id = req.files.image_id ? req.files.image_id[0].filename : null;
    const banner_image_id = req.files.banner_image_id
      ? req.files.banner_image_id[0].filename
      : null;
    const gallery = req.files.gallery
      ? req.files.gallery.map((file) => file.filename)
      : [];


    const newGolf = new Golf({
      title,
      nameEn,
      price,
      slug,
      address,
      content,
      location,
      star_rate,
      isPromotion,
      promotionStartDate:isPromotion ? new Date(promotionStartDate):null ,
      promotionEndDate:isPromotion ? new Date(promotionEndDate):null,
      promotionType,
      is_featured,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status,
      image_id,
      banner_image_id,
      gallery,
    });

    await newGolf.save();

    // แสดงผลลัพธ์ หรือเปลี่ยนหน้า
    res.json({ redirectUrl: "/admins#golfs" });
  } catch (error) {
    console.error("Error saving golf:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.postAddPackage = async (req, res) => {
  console.log("form postAddPackage");
  try {
    const {
      title,
      nameEn,
      room_price,
      golf_price,
      location,
      slug,
      address,
      content,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    } = req.body;
  

    // const image_id = req.files.image_id ? req.files.image_id[0].location : null;
    //   const banner_image_id = req.files.banner_image_id ? req.files.banner_image_id[0].location : null;
    //   const gallery = req.files.gallery ? req.files.gallery.map(file => file.location) : [];

    const image_id = req.files.image_id ? req.files.image_id[0].filename : null;
    const banner_image_id = req.files.banner_image_id
      ? req.files.banner_image_id[0].filename
      : null;
    const gallery = req.files.gallery
      ? req.files.gallery.map((file) => file.filename)
      : [];


    const newPackage = new Package({
      title,
      nameEn,
      room_price,
      golf_price,
      slug,
      address,
      content,
      location,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status,
      image_id,
      banner_image_id,
      gallery,
    });

    await newPackage.save();

    // แสดงผลลัพธ์ หรือเปลี่ยนหน้า
    res.json({ redirectUrl: "/admins#golfs" });
  } catch (error) {
    console.error("Error saving golf:", error);
    res.status(500).send("Internal Server Error");
  }
};

// put
exports.putEditUser = async (req, res) => {
  console.log('from put putEditUser ')

try {
 const userId = req.params.id;
 const {
  companyName,
  contactPerson,
  contactNumber,
  businessNumber,
  companyAddress,
  email,
  role,
  kycStatus,
  isVerified,
  isEmailVerified,
  isApproved, 
  userLevel,
  userReceiveEmail,
  userPaybackRate,
 } = req.body;
 console.log(req.body)

   const user = await User.findById(userId);
   if (!user) throw new Error("User not found");

 //   // อัปเดตข้อมูลโรงแรม (ยกเว้น price_periods)
   const updateData = {
    companyName,
    contactPerson,
    contactNumber,
    businessNumber,
    companyAddress,
    email,
    role,
    kycStatus,
    isVerified,
    isEmailVerified,
    isApproved, 
    userLevel,
    userReceiveEmail,
    userPaybackRate,
   };


 await User.findByIdAndUpdate(userId, updateData);
 await user.save();

 res.json({ redirectUrl: "/admins#users" });
} catch (error) {
 console.error("Error saving user:", error);
 res.status(500).send("Internal Server Error");
}
};


exports.putEditHotel = async (req, res) => {
  console.log('from put edithotel ')
try {
 const hotelId = req.params.id;
 const {
   title,
   nameEn,
   slug,
   map_zoom,
   city,
   map_url,
   address,
   content,
   star_rate,
   isPromotion,
   promotionType,
   promotionStartDate,
   promotionEndDate,
   is_featured,
   highlights,
   amenities,
   isFreeAmenities,
   metro,
   airport,
   train,
   check_in_start,
   check_in_end,
   check_out_start,
   check_out_end,
   bed_policy,
   breakfast,
   deposit_policy,
   pet_policy,
   service_animal_policy,
   age_policy,
   payment,
   startDate,
   endDate,
   season_id,
   Services_textediter,
   Policies_textediter,
   Description_textediter,
   status,
 } = req.body;

 const image_id = req.files["image_id"]
   ? req.files["image_id"][0].filename
   : null; // path ของ main_image
 const banner_image_id = req.files["banner_image_id"]
   ? req.files["banner_image_id"][0].filename
   : null; // path ของ main_image
 const gallery = req.files["gallery"]
   ? req.files.gallery?.map((file) => file.filename)
   : null; // path ของ other_image ทั้งหมด

   const hotel = await Hotel.findById(hotelId);
   if (!hotel) throw new Error("Hotel not found");

 //   // อัปเดตข้อมูลโรงแรม (ยกเว้น price_periods)
   const updateData = {
     title,
     nameEn,
     slug,
     address,
     content,
     map_url,
     map_zoom,
     city,
     isPromotion,
     is_featured,
     star_rate,
     highlights: highlights || [],
     amenities: amenities || [],
     isFreeAmenities: isFreeAmenities || [],
     surrounding: { metro, airport, train },
     check_in_start,
     check_in_end,
     check_out_start,
     check_out_end,
     bed_policy,
     breakfast,
     deposit_policy,
     pet_policy,
     service_animal_policy,
     Services_textediter,
     Policies_textediter,
     Description_textediter,
     age_policy,
     payment,
     status,
   };

 if (image_id) updateData.image_id = image_id;
 if (banner_image_id) updateData.banner_image_id = banner_image_id;
 if (gallery && gallery.length > 0) updateData.gallery = gallery;

 if(isPromotion==="true"){
   updateData.promotionStartDate = new Date(promotionStartDate)
   updateData.promotionEndDate = new Date(promotionEndDate)
   updateData.promotionType = promotionType
 }

 const validSeasonIds = season_id?.filter((id) => id !== "0").map(id => id);

 hotel.price_periods = hotel.price_periods.filter(period =>
   validSeasonIds.includes(period._id.toString())
 );

 startDate?.forEach((start, index) => {
   const end = endDate[index];
   const seasonId = season_id[index];

   if (seasonId === "0") {
     hotel.price_periods.push({
       start_date: new Date(start),
       end_date: new Date(end),
       room_prices: {},
     });
   } else {
     const existingPeriod = hotel.price_periods.find(period => period._id.toString() === seasonId);
     if (existingPeriod) {
       existingPeriod.start_date = new Date(start);
       existingPeriod.end_date = new Date(end);
     }
   }
 });



 await Hotel.findByIdAndUpdate(hotelId, updateData);
 await hotel.save();


 res.json({ redirectUrl: "/admins#hotels" });
} catch (error) {
 console.error("Error saving hotel:", error);
 res.status(500).send("Internal Server Error");
}
};

exports.putEditRoom = async (req, res) => {
  try {
    console.log("form putEditRoom");

    const roomId = req.params.id

    const {
      hotelId,
      name,
      size,
      price,
      bedType,
      bedQuantity,
      adults,
      children,
      startDate,
      endDate,
      room_prices,
      amenities,
      is_breakfast_included,
      is_refundable,
      is_instantConfirmation,
      is_onlinepay,
      status,
      content,
    } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) throw new Error("Hotel not found");


    // ค้นหา Room ที่ต้องการแก้ไข
    const roomIndex = hotel.rooms.findIndex((room) => room._id.toString() === roomId);
    if (roomIndex === -1) throw new Error("Room not found");

    let sleeps = 0;

    bedType.forEach((bed, index) => {
      sleeps += (typeOfBeds[bed] || 0) * (bedQuantity[index] || 0); // Add default values to avoid errors
    });

    // แปลง bedType + bedQuantity เป็น Object
    const objectBedType = bedType.reduce((acc, bed, index) => {
      acc[bed] = bedQuantity[index]; // สร้าง { "Single": "2", "Double": "1" }
      return acc;
    }, {});

    // อัปเดตข้อมูลห้องพัก
    hotel.rooms[roomIndex] = {
      ...hotel.rooms[roomIndex], // เก็บค่าที่มีอยู่ก่อนหน้า
      title: name,
      price: Number(price),
      size: Number(size),
      beds:sleeps,
      bedType: objectBedType,
      amenities,
      adults: Number(adults),
      children: Number(children),
      is_breakfast_included: is_breakfast_included === "1",
      is_refundable: is_refundable === "1",
      is_instantConfirmation: is_instantConfirmation === "1",
      is_onlinepay: is_onlinepay === "1",
      updated_at: new Date(),
      content,
      status,
    };

    // อัปเดตราคาใน price_periods
    if (startDate?.length > 0) {
      // ลบ period ที่ไม่มีอยู่ใน `startDate` ใหม่
      hotel.price_periods = hotel.price_periods.filter((period) =>
        startDate.includes(period.start_date.toISOString().split("T")[0])
      );

      // อัปเดตหรือเพิ่ม period ใหม่
      startDate.forEach((start, index) => {
        const end = endDate[index];
        const roomPriceSeason = Number(room_prices[index]);


        // ค้นหา period ที่มี start_date และ end_date ตรงกัน
        let period = hotel.price_periods.find(
          (p) =>
            new Date(p.start_date).toISOString().split("T")[0] === start &&
            new Date(p.end_date).toISOString().split("T")[0] === end
        );

        if (!period) {
          // ถ้ายังไม่มี ให้เพิ่มใหม่
          hotel.price_periods.push({
            start_date: new Date(start),
            end_date: new Date(end),
            room_prices: { [roomId]: roomPriceSeason },
          });
        } else {
          // ถ้ามีอยู่แล้วให้แค่เพิ่มราคาห้องเข้าไป
          period.room_prices[roomId] = roomPriceSeason;
        }

        period.markModified('room_prices');
      });

    }

    
    await hotel.save();

    res.json({ redirectUrl: `/admins#hotels/${hotelId}/rooms?page=1` });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.putEditGolf = async (req, res) => {
  try {
    console.log("form putEditRoom");

    const goflId = req.params.id

    const {
      title,
      nameEn,
      price,
      slug,
      address,
      location,
      content,
      star_rate,
      isPromotion,
      promotionStartDate,
      promotionEndDate,
      promotionType,
      is_featured,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    } = req.body;

    const golf = await Golf.findById(goflId);
    if (!golf) throw new Error("golf not found");

    const image_id = req.files["image_id"]
    ? req.files["image_id"][0].filename
    : null; // path ของ main_image
  const banner_image_id = req.files["banner_image_id"]
    ? req.files["banner_image_id"][0].filename
    : null; // path ของ main_image
  const gallery = req.files["gallery"]
    ? req.files.gallery?.map((file) => file.filename)
    : null; // path ของ other_image ทั้งหมด


    const updateData = {
      title,
      nameEn,
      price,
      slug,
      address,
      location,
      content,
      star_rate,
      isPromotion,
      promotionStartDate:isPromotion ? new Date(promotionStartDate):null ,
      promotionEndDate:isPromotion ? new Date(promotionEndDate):null,
      promotionType,
      is_featured,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    };

  if (image_id) updateData.image_id = image_id;
  if (banner_image_id) updateData.banner_image_id = banner_image_id;
  if (gallery && gallery.length > 0) updateData.gallery = gallery;
    

  await Golf.findByIdAndUpdate(goflId, updateData);
    await golf.save();

    res.json({ redirectUrl: `/admins#golfs?page=1` });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.putEditPackage = async (req, res) => {
  try {
    console.log("form putEditPackage");

    const packageId = req.params.id

    const {
      title,
      nameEn,
      room_price,
      golf_price,
      slug,
      address,
      location,
      content,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    } = req.body;


    const golf = await Package.findById(packageId);
    if (!golf) throw new Error("golf not found");

    const image_id = req.files["image_id"]
    ? req.files["image_id"][0].filename
    : null; // path ของ main_image
  const banner_image_id = req.files["banner_image_id"]
    ? req.files["banner_image_id"][0].filename
    : null; // path ของ main_image
  const gallery = req.files["gallery"]
    ? req.files.gallery?.map((file) => file.filename)
    : null; // path ของ other_image ทั้งหมด


    const updateData = {
      title,
      nameEn,
      room_price,
      golf_price,
      slug,
      address,
      location,
      content,
      Services_textediter,
      Policies_textediter,
      Description_textediter,
      status
    };

  if (image_id) updateData.image_id = image_id;
  if (banner_image_id) updateData.banner_image_id = banner_image_id;
  if (gallery && gallery.length > 0) updateData.gallery = gallery;
    

  await Package.findByIdAndUpdate(packageId, updateData);
    await golf.save();

    res.json({ redirectUrl: `/admins#packages` });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.putInvoiceStatus = async (req, res)=>{
  try {
    console.log("form putInvoiceStatus");

    const { id, status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    await Invoice.findByIdAndUpdate(id, { status });
    

    res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("Error updating invoice status:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
}

exports.putPurchaseStatus = async (req, res)=>{
  try {
    console.log("form putPurchaseStatus");

    const { id, status } = req.body;
    if (!id || !status) {
        return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    const purchaseUpdateData = await Purchase.findByIdAndUpdate(id, { status });

    if(status === 'Complete'){

      const vouchers = purchaseUpdateData.items.map((item) => {
      return {
        voucherCode: "VCH-" + Math.random().toString(36).substr(2, 9).toUpperCase(), 
        purchaseId:purchaseUpdateData._id,
        title: item.packageName || item.golfName || item.hotelName +' '+ item.roomName , // ใช้ชื่อโรงแรมหรือแพ็กเกจ
        detail: item.detail || "", // รายละเอียด (อาจเป็น string)
        initialQuantity: item.quantity, // จำนวนเริ่มต้น
        remainingQuantity: item.quantity, // จำนวนที่เหลือ
        validFrom: new Date(item.period_start), // วันที่เริ่มต้น
        validUntil: new Date(item.period_end), // วันที่สิ้นสุด
        userId: purchaseUpdateData.user, 
        hotelId: item.hotel ? item.hotel : null, // ID โรงแรม (ถ้ามี)
        golfId: item.golf ? item.golf : null, // ID แพ็กเกจ (ถ้ามี)
        packageId: item.package ? item.package : null, // ID แพ็กเกจ (ถ้ามี)
        list:Array.from({ length: item.quantity }, (_, i) => ({
          no: i + 1, // สร้างหมายเลข 1, 2, 3, ... ตามจำนวน quantity
          status: "unused", // ค่าเริ่มต้นเป็น unused
          usedAt: null, // ยังไม่ถูกใช้
        })),
      };
    });
    
    await Voucher.insertMany(vouchers);
  }

  if(status ==='Processing'){
    await Voucher.deleteMany({ purchaseId: purchaseUpdateData._id });
  }

    res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("Error updating Purchase status:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
}
