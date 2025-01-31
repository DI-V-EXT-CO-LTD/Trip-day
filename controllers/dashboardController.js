const User = require("../models/user");
const Wallet = require("../models/wallet");
const Voucher = require("../models/voucher");
const Reservation = require("../models/reservation");
const Purchase = require("../models/purchase");
const Cart = require("../models/cart");
const Room = require("../models/room");
const Hotel = require("../models/hotel");
const Message = require("../models/message");
const Golf = require("../models/golf");
const {
  PaymentMethod,
  BankTransfer,
  CreditCard,
  Crypto,
} = require("../models/paymentMethod");
const axios = require("axios");
const crypto = require("crypto");
const Package = require("../models/package");
const Invoice = require("../models/inv");
const stripe = require("stripe")(
  "pk_test_51PuT0tA6p5oChLYbdz5BDBRgVNM9IdVFVm08jtUZ1HbgCjVi8YK8cAPbNp69lV5brOBy9a1ejLlKyqX6Ydhc7fh3004YSIaJpr"
);

exports.getDashboard = async (req, res) => {
  console.log("dshboardController.getDashboard");
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });
    const vouchers = await Voucher.find({ userId: req.user.email });
    const reservations = await Reservation.find({ user: req.user.id }).populate(
      "hotel"
    );
    const purchases = await Purchase.find({ user: req.user.id }).populate(
      "voucher"
    );
    const unreadMessagesCount = await Message.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    const messages = await Message.find({ recipient: req.user.email })
      .sort({ createdAt: -1 })
      .limit(10);

    let cart = await Cart.findOne({ user: req.user.id, status: "active" });

    let cartData = {
      items: [],
      subtotal: 0,
      taxesAndFees: 0,
      total: 0,
    };

    let totalCheckOut;

    if (cart) {
      cart = cart.toObject();

      let subtotal = 0;

      cartData.items = await Promise.all(
        cart.items.map(async (item) => {
          if (item.room) {
            // Handle hotel room items
            const FindHotel = await Hotel.findById(item.hotel);

            const quantity = item.quantity;

            const itemTotal = item.price * quantity;
            subtotal += Number(itemTotal);

            let roomIndex, roomImage;

            if (item.room && item.room._id) {
              const room = await Hotel.findOne(
                { "rooms._id": item.room._id.toString() },
                { "rooms.$": 1 }
              );
              roomIndex = room.rooms[0];
              roomImage =
                roomIndex.images && roomIndex.images.length > 0
                  ? "/uploads/" + roomIndex.images[0]
                  : "";
            }

            return {
              _id: item._id,
              roomImage: roomImage,
              hotelName: FindHotel ? FindHotel.title : "N/A",
              roomType: roomIndex ? roomIndex.title : "N/A",
              price: item.price,
              period_start: item.period_start,
              period_end: item.period_end,
              quantity,
              total: itemTotal,
              isSelected: item.isSelected,
              ProductType: "Hotel",
            };
          } else if (item.golf) {
            // Handle golf items

            const quantity = item.quantity;
            const itemTotal = item.price * quantity; // Use sale price if available
            subtotal += itemTotal;

            const golf = await Golf.findById(item.golf); // Fetch the golf object by ID

            const golfImage = "/uploads/" + golf.image_id; // Assuming golf.images is an array of image URLs

            return {
              _id: item._id,
              hotelName: golf.title,
              roomImage: golfImage, // Include the golf image URL
              quantity,
              price: item.price,
              checkInDate: item.check_in,
              checkOutDate: item.check_out,
              isSelected: true,
              total: itemTotal,
              isSelected: item.isSelected,
              ProductType: "Golf",
            };
          } else {
            const itemTotal = item.price * item.nights * item.quantity; // Use sale price if available
            subtotal += itemTotal;

            const package = await Package.findById(item.package); // Fetch the golf object by ID

            let imageID =
              package && package.image_id ? package.image_id : "default.jpg";
            const packageImage = "/uploads/" + imageID; // Assuming golf.images is an array of image URLs

            return {
              _id: item._id,
              hotelName: package?.title ?? "N/A", // Null-safe title with default value
              roomImage: packageImage,
              nights: item.nights,
              price: item.price,
              isSelected: true,
              total: itemTotal,
              quantity: item.quantity,
              ProductType: "Package",
              check_in: item.check_in.toISOString().split("T")[0],
              check_out: item.check_out.toISOString().split("T")[0],
              adults: item.adults,
              play_golf: item.play_golf,
            };
          }
        })
      );

      cartData.subtotal = subtotal;
      cartData.total = subtotal;

      const selectedItems = cartData.items.filter((item) => item.isSelected);
      totalCheckOut = selectedItems.reduce(
        (total, item) => total + item.total,
        0
      );
    }

    res.render("dashboard", {
      user,
      wallet,
      vouchers,
      reservations,
      purchases,
      cart: cartData,
      unreadMessagesCount,
      messages,
      totalCheckOut,
      title: "Dashboard",
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY, // 추가된 부분
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.status(500).send("An error occurred while loading the dashboard");
  }
};
exports.postCheckout = async (req, res) => {
  console.log("dshboardController.postCheckout");
  try {
    const { items } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, status: "active" });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const selectedItems = cart.items.filter((item) =>
      items.includes(item._id.toString())
    );

    const checkoutData = {
      items: selectedItems.map((item) => {
        const nights = item.nights;
        return {
          _id: item._id,
          key: process.env.STRIPE_PUBLISHABLE_KEY,
          hotelName: item.hotel ? item.hotel.title : "N/A",
          roomType: item.room ? item.room.title : "N/A",
          price: item.price,
          checkIn: item.check_in,
          checkOut: item.check_out,
          nights: nights,
          total: item.price * nights,
        };
      }),
      subtotal: selectedItems.reduce((sum, item) => {
        const nights = item.nights;
        return sum + item.price * nights;
      }, 0),
    };

    checkoutData.total = checkoutData.subtotal;

    res.json({ success: true, checkout: checkoutData });
    //res.render('checkout',{checkout: checkoutData});
  } catch (error) {
    console.error("Error in postCheckout:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while loading the checkout data",
    });
  }
};

exports.renderPaymentPage = async (req, res) => {
  console.log("dshboardController.renderPaymentPage");
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: "active" })
      .populate({
        path: "items.room",
        select: "title price",
      })
      .populate("items.hotel", "title");

    if (!cart || cart.items.length === 0) {
      return res.redirect("/dashboard");
    }

    const cartData = {
      items: cart.items
        .filter((item) => item.isSelected)
        .map((item) => {
          const checkIn = new Date(item.check_in);
          const checkOut = new Date(item.check_out);
          const nights = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
          );
          const totalPrice = item.price * nights;

          return {
            hotelName: item.hotel ? item.hotel.title : "N/A",
            roomType: item.room ? item.room.title : "N/A",
            price: item.price,
            nights: nights,
            checkIn: item.check_in,
            checkOut: item.check_out,
            quantity: item.quantity,
            total: totalPrice,
          };
        }),
      total: cart.items
        .filter((item) => item.isSelected)
        .reduce((sum, item) => {
          const nights = Math.ceil(
            (new Date(item.check_out) - new Date(item.check_in)) /
              (1000 * 60 * 60 * 24)
          );
          return sum + item.price * nights * item.quantity;
        }, 0),
    };

    const bankTransfer = await BankTransfer.findOne({ isActive: true });
    const creditCard = await CreditCard.findOne({ isActive: true });
    const crypto = await Crypto.findOne({ isActive: true });

    res.render("payment", {
      cart: cartData,
      total: cartData.total,
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
  console.log("dshboardController.processPayment");
  try {
    const { paymentMethod } = req.body;
    const cart = await Cart.findOne({ user: req.user.id, status: "active" });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const total = cart.items
      .filter((item) => item.isSelected)
      .reduce((sum, item) => {
        const nights = Math.ceil(
          (new Date(item.check_out) - new Date(item.check_in)) /
            (1000 * 60 * 60 * 24)
        );
        return sum + item.price * nights * item.quantity;
      }, 0);

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

exports.acceptPayment = async (req, res) => {
  console.log("dshboardController.acceptPayment");
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: "active" })
      .populate("items.room")
      .populate("items.hotel");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const purchaseId = generatePurchaseId();
    const total = cart.items
      .filter((item) => item.isSelected)
      .reduce((sum, item) => {
        const nights = Math.ceil(
          (new Date(item.check_out) - new Date(item.check_in)) /
            (1000 * 60 * 60 * 24)
        );
        return sum + item.price * nights * item.quantity;
      }, 0);

    const purchase = new Purchase({
      user: req.user.id,
      purchaseId: purchaseId,
      items: cart.items
        .filter((item) => item.isSelected)
        .map((item) => {
          const nights = Math.ceil(
            (new Date(item.check_out) - new Date(item.check_in)) /
              (1000 * 60 * 60 * 24)
          );
          return {
            hotel: item.hotel ? item.hotel._id : null,
            room: item.room ? item.room._id : null,
            price: item.price,
            quantity: item.quantity,
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            total: item.price * nights * item.quantity,
          };
        }),
      total: total,
      status: "completed",
    });

    await purchase.save();

    // Remove selected items from the cart
    cart.items = cart.items.filter((item) => !item.isSelected);
    if (cart.items.length === 0) {
      cart.status = "completed";
    }
    await cart.save();

    res.json({ success: true, purchaseId: purchaseId });
  } catch (error) {
    console.error("Error accepting payment:", error);
    res
      .status(500)
      .json({ success: false, message: "Error accepting payment" });
  }
};

exports.updateSelectedItems = async (req, res) => {
  console.log("dshboardController.updateSelectedItems");
  try {
    const { selectedItems } = req.body;
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: req.user.id, status: "active" });

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Update selected status for items in cart
    cart.items.forEach((item) => {
      item.isSelected = selectedItems.some(
        (selectedItem) => selectedItem.id === item._id.toString()
      );
    });

    await cart.save();

    const selectedCartItems = cart.items.filter((item) => item.isSelected);

    if (selectedCartItems.length > 0) {
      await Invoice.deleteMany({ userId: userId, status: "Pending" });

      // Prepare invoice details
      let totalAmount = 0;
      const today = new Date();
      const itemDetails = selectedCartItems.map((item) => {
        if (item.ProductType === "Hotel") {
          totalAmount += item.price * item.quantity;
          return {
            room: item.room,
            hotel: item.hotel,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            period_start: item.period_start,
            period_end: item.period_end,
          };
        } else if (item.ProductType === "Golf") {
          totalAmount += item.price * item.quantity;
          const nextYear = new Date();
          nextYear.setFullYear(today.getFullYear() + 1);
          return {
            room: item.room,
            hotel: item.hotel,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            period_start: today,
            period_end: nextYear,
          };
        } else {
          totalAmount += item.price * item.quantity * item.nights;

          return {
            room: item.room,
            hotel: item.hotel,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity * item.nights,
            period_start: item.check_in,
            period_end: item.check_out,
            nights: item.nights,
            detail: `Adults: ${item.adults} Golf: ${item.play_golf} `,
          };
        }
      });

      // Create a single invoice
      const invoice = new Invoice({
        userId: userId,
        invoiceNumber: `INV-${Date.now()}-${userId}`,
        total: totalAmount,
        items: itemDetails, // Store all selected items in a single invoice
        status: "Pending",
      });

      await invoice.save();

      res.json({
        success: true,
        message: "Invoice created successfully",
        invoice,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No items selected",
      });
    }
  } catch (error) {
    console.error("Error updating selected items:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating selected items",
    });
  }
};

exports.getSelectedItems = async (req, res) => {
  console.log("dshboardController.getSelectedItems");
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: "active" })
      .populate("items.room")
      .populate("items.hotel")
      .populate("items.golf")
      .populate("items.package");
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const selectedItems = cart.items
      .filter((item) => item.isSelected)
      .map((item) => {
        const checkIn = new Date(item.check_in);
        const checkOut = new Date(item.check_out);
        const nights = item.nights;
        if (item.ProductType == "Hotel") {
          return {
            id: item._id,
            hotelName: item.hotel ? item.hotel.title : "N/A",
            roomType: item.room ? item.room.title : "N/A",
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            price: item.price,
            total: item.price * nights,
          };
        } else if (item.ProductType == "Golf") {
          return {
            id: item._id,
            hotelName: item.golf ? item.golf.title : "N/A",
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            price: item.price,
            total: item.price * nights,
          };
        } else {
          return {
            id: item._id,
            hotelName: item.package ? item.package.title : "N/A",
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            price: item.price,
            total: item.price * nights,
          };
        }
      });
    res.render("dashboard/cart");
    //res.json({ success: true, selectedItems });
  } catch (error) {
    console.error("Error fetching selected items:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching selected items",
    });
  }
};

exports.getPurchases = async (req, res) => {
  console.log("dshboardController.getPurchases");
  try {
    // 사용자의 구매 내역을 가져오고 생성일을 기준으로 정렬합니다.
    const purchases = await Purchase.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // 각 결제 방식에 대한 세부 정보를 가져옵니다
    const bankTransfers = await BankTransfer.find({ isActive: true });
    const cryptos = await Crypto.find({ isActive: true });

    // 포맷을 적용하여 구매 내역을 변환합니다.
    const formattedPurchases = await Promise.all(
      purchases.map(async (purchase) => {
        let purchaseDetails = null;

        // 결제 방식에 따라 적절한 세부 정보를 설정합니다
        if (
          purchase.paymentMethod === "bank_transfer" &&
          bankTransfers.length > 0
        ) {
          purchaseDetails = {
            type: "bank_transfer",
            accountNumber: bankTransfers[0].accountNumber,
            accountName: bankTransfers[0].accountName,
            bankName: bankTransfers[0].bankName,
          };
        } else if (purchase.paymentMethod === "crypto" && cryptos.length > 0) {
          purchaseDetails = {
            type: "crypto",
            walletAddress: cryptos[0].walletAddress,
            network: cryptos[0].network,
          };
        }

        return {
          _id: purchase._id,
          hotelName: purchase.hotelName || "N/A",
          roomName: purchase.roomName || "N/A",
          checkIn: purchase.checkIn,
          checkOut: purchase.checkOut,
          nights: purchase.nights,
          amount: purchase.amount,
          paymentMethod: purchase.paymentMethod,
          status: purchase.status,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt,
          processDescription: purchase.processDescription,
          purchaseLog: purchase.purchaseLog,
          purchaseDetails: purchaseDetails,
        };
      })
    );

    // 변환된 데이터를 사용하여 purchases 템플릿을 렌더링합니다.
    res.render("purchases", {
      purchases: formattedPurchases,
      title: "Purchases",
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    res.status(500).send("An error occurred while fetching purchases");
  }
};

exports.renderCheckoutPage = async (req, res) => {
  console.log("dshboardController.renderCheckoutPage");
  try {
    const cart = await Cart.findOne({ user: req.user.id, status: "active" })
      .populate("items.room")
      .populate("items.hotel")
      .populate("items.golf")
      .populate("items.package");

    if (!cart || cart.items.length === 0) {
      return res.render("checkout", {
        cartData: null,
        message: "Your cart is empty.",
      });
    }

    const checkoutData = {
      items: cart.items.map((item) => {
        const nights = item.nights;
        if (item.ProductType == "Hotel") {
          return {
            _id: item._id,
            hotelName: item.hotel ? item.hotel.title : "N/A",
            roomType: item.room ? item.room.title : "N/A",
            price: item.price,
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            total: item.price * nights,
          };
        } else if (item.ProductType == "Golf") {
          return {
            _id: item._id,
            hotelName: item.golf ? item.golf.title : "N/A",
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            price: item.price,
            total: item.price * nights,
          };
        } else {
          return {
            _id: item._id,
            hotelName: item.package ? item.package.title : "N/A",
            checkIn: item.check_in,
            checkOut: item.check_out,
            nights: nights,
            price: item.price,
            total: item.price * nights * item.quantity,
          };
        }
      }),
      subtotal: cart.items.reduce((sum, item) => {
        const nights = item.nights;
        if (item.ProductType == "Hotel") {
          return sum + item.price * nights;
        } else if (item.ProductType == "Golf") {
          return sum + item.price * nights;
        } else {
          return sum + item.price * nights * item.quantity;
        }
      }, 0),
    };

    checkoutData.total = checkoutData.subtotal;

    res.render("checkout", { checkoutData });
  } catch (error) {
    console.error("Error rendering checkout page:", error);
    res.status(500).send("An error occurred while loading the checkout page");
  }
};

function generatePurchaseId() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

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
