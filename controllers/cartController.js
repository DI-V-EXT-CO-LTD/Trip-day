const Cart = require("../models/cart");
const Room = require("../models/room");
const Hotel = require("../models/hotel");
const Golf = require("../models/golf"); // Import the Golf model
const Package = require("../models/package");
const {
  PaymentMethod,
  BankTransfer,
  CreditCard,
  Crypto,
} = require("../models/paymentMethod");
const axios = require("axios");
const userModel = require("../models/user");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, { polling: false });
const moment = require("moment");
const mongoose = require("mongoose");

exports.getCart = async (req, res) => {
  console.log("cartController.getCart");
  try {
    let cart = await Cart.findOne({ user: req.user._id, status: "active" })
      .populate({
        path: "items.room",
        select: "type price images",
      })
      .populate("items.hotel")
      .populate("items.golf") // Populate golf items and include images
      .populate("items.package"); // Populate package items

    let cartData = {
      items: [],
      subtotal: 0,
      total: 0,
    };

    if (cart) {
      cart = cart.toObject();
      let subtotal = 0;

      cartData.items = await Promise.all(
        cart.items.map(async (item) => {
          if (item.room) {
            // Handle hotel room items
            const FindHotel = await Hotel.findById(item.hotel);

            const checkIn = FindHotel.validFrom;
            const checkOut = FindHotel.ExpiredAt;
            const nights = item.quantity;

            const itemTotal = item.price * nights;
            subtotal += itemTotal;

            const room = await Hotel.find({
              rooms: { $elemMatch: { id: item.room._id } },
            });

            const roomImage = room.images;

            return {
              _id: item.room._id,
              roomImage: roomImage,
              hotelName: FindHotel.title,
              roomType: room.title,
              price: item.price,
              period: item.period,
              checkInDate: checkIn,
              checkOutDate: checkOut,
              nights: nights,
              total: itemTotal,
              ProductType: "Hotel",
            };
          } else if (item.golf) {
            // Handle golf items

            const golf = await Golf.findById(item.golf); // Fetch the golf object by ID
            const itemTotal = golf.price; // Use sale price if available
            subtotal += itemTotal;

            return {
              _id: item._id,
              hotelName: golf.title,
              nights: item.quantity,
              checkInDate: golf.validFrom,
              checkOutDate: golf.ExpiredAt,
              golfImage: image_id, // Include the golf image URL
              price: golf.price,
              total: golf.price * item.quantity,
              ProductType: "Golf",
            };
          } else {
            const package = await Package.findById(item.package); // Fetch the golf object by ID
            const itemTotal = package.price; // Use sale price if available

            subtotal += itemTotal;

            const packageImage = package.gallery[0]; // Assuming golf.images is an array of image URLs
            return {
              _id: item._id,
              hotelName: package.title,
              nights: item.nights,
              checkInDate: item.check_in,
              checkOutDate: item.check_out,
              packageImage: packageImage, // Include the golf image URL
              price: package.price,
              total: package.price * item.quantity * item.nights,
              quantity: item.quantity,
              ProductType: "Package",
            };
          }
        })
      );

      cartData.subtotal = subtotal;
      cartData.total = subtotal;
    }

    res.render("cart", { cart: cartData });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Error fetching cart" });
  }
};

exports.addToCart = async (req, res) => {
  console.log("cartController.addToCart");
  const { roomId, hotelId, golfId, packageId, nights } = req.body;

  try {
    if (!req.user) {
      console.log("User not authenticated");
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // ตรวจสอบว่า cart มีอยู่แล้วหรือไม่
    let cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    if (golfId) {
      const golf = await Golf.findById(golfId); // ค้นหาข้อมูล golf จากฐานข้อมูล
      if (!golf) {
        console.error("Golf not found for ID:", golfId);
        return res
          .status(404)
          .json({ success: false, message: "Golf not found" });
      }

      // เช็คว่ามี item golf นี้ใน cart อยู่แล้วหรือไม่
      const existingGolfItem = cart.items.find(
        (item) => item.ProductType === "Golf" && item.golf.toString() === golfId // เช็คว่า golfId ตรงกับ item ใน cart
      );

      if (existingGolfItem) {
        existingGolfItem.quantity += Number(nights); // เพิ่ม quantity ของ golf item
      } else {
        // หากไม่พบ golf item เดิมใน cart ให้เพิ่มเข้าไป
        cart.items.push({
          golf: golf._id,
          quantity: nights,
          price: golf.price,
          total: golf.price * nights,
          ProductType: "Golf",
        });
      }

      await cart.save(); // บันทึก cart ที่มีการแก้ไขแล้ว
      return res
        .status(200)
        .json({ success: true, message: "Golf added to cart" });
    }

    if (roomId) {
      const { period_start, period_end, roomPrice } = req.body;

      const room = await Hotel.find({ "rooms._id": roomId }, { "rooms.$": 1 });

      if (!room) {
        console.error("Room not found for ID:", roomId);
        return res
          .status(404)
          .json({ success: false, message: "Room not found" });
      }

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        console.error("Hotel not found for ID:", hotelId);
        return res
          .status(404)
          .json({ success: false, message: "Hotel not found" });
      }

      const existingItem = cart.items.find((item) => {
        return (
          item?.room?._id.toString() === roomId &&
          item?.hotel.toString() === hotelId &&
          new Date(item?.period_start).toISOString() ===
            new Date(period_start).toISOString()
        );
      });

      if (existingItem) {
        existingItem.quantity += Number(nights); // เพิ่มจำนวนคืนในไอเทมที่เจออยู่แล้ว
      } else {
        cart.items.push({
          room: room[0].rooms[0]._id,
          hotel: hotelId,
          quantity: nights,
          price: roomPrice,
          check_in: hotel.validFrom,
          check_out: hotel.ExpiredAt,
          period_start, // บันทึกค่า period
          period_end, // บันทึกค่า period
          total: roomPrice * nights,
          ProductType: "Hotel",
        });
      }

      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Room added to cart" });
    }

    if (packageId) {
      const { checkIn, checkOut, adults, golf } = req.body;

      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        console.error("Invalid Room ID format:", packageId);
        return res
          .status(400)
          .json({ success: false, message: "Invalid packageId ID format" });
      }

      const package = await Package.findById(packageId);

      if (!package) {
        console.error("package not found for ID:", package);
        return res
          .status(404)
          .json({ success: false, message: "package not found" });
      }

      function formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split("T")[0]; // แปลงเป็น 'YYYY-MM-DD'
      }

      const existingItem = cart.items.find(
        (item) =>
          item.ProductType === "Package" &&
          item.package.toString() === packageId &&
          formatDate(item.check_in) === formatDate(new Date(checkIn)) && // เปรียบเทียบวันที่
          formatDate(item.check_out) === formatDate(new Date(checkOut)) // เปรียบเทียบวันที่
      );

      const quantity = adults / 2;
      const price = package.room_price * quantity + package.golf_price * golf;

      if (existingItem) {
        existingItem.adults += Number(adults);
        existingItem.play_golf += Number(golf);
        existingItem.quantity = Math.ceil(existingItem.adults / 2);
        existingItem.price =
          (package.room_price * existingItem.adults) / 2 +
          package.golf_price * existingItem.play_golf;
      } else {
        cart.items.push({
          package: package._id,
          adults,
          play_golf: golf,
          quantity: Math.ceil(quantity),
          price,
          check_in: checkIn,
          check_out: checkOut,
          nights: nights,
          ProductType: "Package",
          total: price * nights * Math.ceil(quantity),
        });
      }

      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Room added to cart" });
    }

    res.json({ message: "invalid data" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error adding to cart" });
  }
};

exports.getValidDate = async (req, res) => {
  console.log("cartController.getValidDate");
  try {
    const { validfrom } = req.body;
    const date = moment(validfrom);

    if (!date.isValid()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    const year = date.year();
    let returnDate;

    if (
      date.isBetween(
        moment(`${year}-11-01`),
        moment(`${year}-12-24`),
        null,
        "[]"
      )
    ) {
      returnDate = moment(`${year}-12-25`);
    } else if (
      date.isBetween(
        moment(`${year}-12-25`),
        moment(`${year + 1}-01-07`),
        null,
        "[]"
      )
    ) {
      returnDate = moment(`${year + 1}-01-07`);
    } else if (
      date.isBetween(
        moment(`${year}-01-08`),
        moment(`${year}-04-15`),
        null,
        "[]"
      )
    ) {
      returnDate = moment(`${year}-04-15`);
    } else if (
      date.isBetween(
        moment(`${year}-04-16`),
        moment(`${year}-10-31`),
        null,
        "[]"
      )
    ) {
      returnDate = moment(`${year}-10-31`);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Date out of range" });
    }

    res
      .status(200)
      .json({ success: true, validDate: returnDate.format("YYYY-MM-DD") });
  } catch (error) {
    console.error("Error getting Valid Date:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting Valid Date" });
  }
};

exports.getValidDate = async (req, res) => {
  console.log("cartController.getValidDate");
  try {
    const { validfrom } = req.body;
    const date = moment(validfrom);

    if (!date.isValid()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    let returnDate;

    if (
      date.isBetween(
        moment(date).month(10).date(1),
        moment(date).month(11).date(24),
        null,
        "[]"
      )
    ) {
      returnDate = moment(date).month(11).date(25);
    } else if (
      date.isBetween(
        moment(date).month(11).date(25),
        moment(date).month(0).date(7),
        null,
        "[]"
      )
    ) {
      returnDate = moment(date).month(0).date(7);
    } else if (
      date.isBetween(
        moment(date).month(0).date(8),
        moment(date).month(3).date(15),
        null,
        "[]"
      )
    ) {
      returnDate = moment(date).month(3).date(15);
    } else if (
      date.isBetween(
        moment(date).month(3).date(16),
        moment(date).month(9).date(31),
        null,
        "[]"
      )
    ) {
      returnDate = moment(date).month(9).date(31);
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Date out of range" });
    }

    res
      .status(200)
      .json({ success: true, validDate: returnDate.format("YYYY-MM-DD") });
  } catch (error) {
    console.error("Error getting Valid Date:", error);
    res
      .status(500)
      .json({ success: false, message: "Error getting Valid Date" });
  }
};

// Add golf to cart
exports.addPackageToCart = async (req, res) => {
  console.log("cartController.addPackageToCart");
  try {
    const packageId = req.params.packageId;
    const { packagePrice, checkIn, checkOut, nights, quantity } = req.body;

    const package = await Package.findById(packageId);
    let user = await userModel.findById(req.user._id);
    if (!user) {
      console.log("user not found");
    }
    if (!package) {
      return res.status(404).json({ error: "package not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    cart.items.push({
      nights: nights, // Set a default value for nights
      quantity: quantity, // Set a default value for quantity
      check_in: checkIn,
      check_out: checkOut,
      nights: nights,
      price: package.price, // Set the price from the golf object
      hotel: null, // Set hotel to null as it's not applicable for golf
      room: null, // Set room to null as it's not applicable for golf
      ProductType: "Package",
      package: packageId,
    });
    await cart.save();

    bot.sendMessage(
      process.env.TELGRAM_CHAT_ID,
      `${user.email} 고객이 카트에 ${nights}의 패키지 상품을 담았습니다. \n=================================\n\n\n\n=================================`
    );

    res.status(200).json({ message: "Package added to cart successfully!" });
  } catch (error) {
    console.error("Error adding Package to cart:", error);
    res.status(500).json({ error: "Failed to add Package to cart." });
  }
};

// Add golf to cart
exports.addGolfToCart = async (req, res) => {
  console.log("cartController.addGolfToCart");
  try {
    const golfId = req.params.golfId;
    const { quantity, validFrom, validUntil } = req.body;
    const golf = await Golf.findById(golfId);
    let user = await userModel.findById(req.user._id);
    if (!user) {
      console.log("user not found");
    }
    if (!golf) {
      return res.status(404).json({ error: "Golf course not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    cart.items.push({
      golf: golfId,
      nights: quantity, // Set a default value for nights
      quantity: quantity, // Set a default value for quantity
      check_out: validUntil, // Set a default value for check_out
      check_in: validFrom, // Set a default value for check_in
      price: golf.price * quantity, // Set the price from the golf object
      hotel: null, // Set hotel to null as it's not applicable for golf
      room: null, // Set room to null as it's not applicable for golf
      ProductType: "Golf",
    });
    await cart.save();

    bot.sendMessage(
      process.env.TELGRAM_CHAT_ID,
      `${user.email} 고객이 카트에 ${quantity}의 골프 상품을 담았습니다. \n=================================\n\n\n\n=================================`
    );
    res.status(200).json({ message: "Golf added to cart successfully!" });
  } catch (error) {
    console.error("Error adding golf to cart:", error);
    res.status(500).json({ error: "Failed to add golf to cart." });
  }
};

exports.removeFromCart = async (req, res) => {
  console.log("cartController.removeFromCart");
  try {
    const { itemId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    await cart.save();

    res.status(200).json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res
      .status(500)
      .json({ success: false, message: "Error removing item from cart" });
  }
};

exports.updateQuantity = async (req, res) => {
  console.log("cartController.updateQuantity");
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find((item) => item._id.toString() === itemId);

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = quantity;
    await cart.save();

    res.status(200).json({ success: true, message: "Item quantity updated" });
  } catch (error) {
    console.error("Error updating item quantity:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating item quantity" });
  }
};

exports.renderPaymentPage = async (req, res) => {
  console.log("cartController.renderPaymentPage");
  try {
    const cart = await Cart.findOne({ user: req.user._id, status: "active" })
      .populate({
        path: "items.room",
        select: "type price",
      })
      .populate("items.hotel", "name");

    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const bankTransfer = await BankTransfer.findOne({ isActive: true });
    const creditCard = await CreditCard.findOne({ isActive: true });
    const crypto = await Crypto.findOne({ isActive: true });

    res.render("payment", {
      cart,
      total,
      bankTransfer,
      creditCard,
      crypto,
    });
  } catch (error) {
    console.error("Error rendering payment page:", error);
    res
      .status(500)
      .json({ success: false, message: "Error rendering payment page" });
  }
};

exports.processPayment = async (req, res) => {
  console.log("cartController.processPayment");
  try {
    const { paymentMethod } = req.body;
    const cart = await Cart.findOne({ user: req.user._id, status: "active" });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let paymentDetails;

    switch (paymentMethod) {
      case "bank_transfer":
        const bankTransfer = await BankTransfer.findOne({ isActive: true });
        paymentDetails = {
          type: "Bank Transfer",
          accountNumber: bankTransfer.accountNumber,
          total: total,
        };
        break;
      case "credit_card":
        paymentDetails = {
          type: "Credit Card",
          redirectUrl: "/credit-card-payment", // You would implement this page separately
        };
        break;
      case "crypto":
        const crypto = await Crypto.findOne({ isActive: true });
        const usdtRate = await getUSDTRate();
        const usdtAmount = (total / usdtRate).toFixed(2);
        paymentDetails = {
          type: "Cryptocurrency",
          walletAddress: crypto.walletAddress,
          usdtRate: usdtRate,
          usdtAmount: usdtAmount,
          total: total,
        };
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid payment method" });
    }

    res.json({ success: true, paymentDetails });
  } catch (error) {
    console.error("Error processing payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing payment" });
  }
};

exports.getCartCount = async (req, res) => {
  console.log("cartController.getCartCount");
  try {
    const cart = await Cart.findOne({ user: req.user._id, status: "active" });
    const itemCount = cart
      ? cart.items.reduce((sum, item) => sum + item.quantity, 0)
      : 0;
    res.status(200).json({ success: true, itemCount });
  } catch (error) {
    console.error("Error fetching cart count:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching cart count" });
  }
};

async function getUSDTRate() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd"
    );
    return response.data.tether.usd;
  } catch (error) {
    console.error("Error fetching USDT rate:", error);
    return 1; // Default to 1:1 if unable to fetch
  }
}
