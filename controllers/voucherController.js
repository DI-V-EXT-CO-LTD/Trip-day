const Voucher = require("../models/voucher");
const APIS = require("../models/APIS");
const Booking = require("../models/Booking");
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, { polling: false });
const Message = require("../models/message");

exports.getVouchers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const skip = (page - 1) * perPage;
    const vouchers = await Voucher.find({ userId: req.user.email })
      .skip(skip)
      .limit(perPage);
    const totalVouchers = await Voucher.countDocuments({
      userId: req.user.email,
    });
    const totalPages = Math.ceil(totalVouchers / perPage);

    if (req.xhr) {
      // AJAX 요청인 경우 부분적인 HTML을 반환
      res.render("partials/voucherList", {
        vouchers,
        currentPage: page,
        totalPages,
        layout: false,
      });
    } else {
      // 일반 요청인 경우 전체 페이지를 렌더링
      res.render("vouchers", {
        vouchers,
        user: { email: req.user.email },
        currentPage: page,
        totalPages,
      });
    }
  } catch (error) {
    console.error("Error fetching vouchers:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching vouchers" });
  }
};

exports.submitVoucher = async (req, res) => {
  try {
    const { voucher_id, email, amount } = req.body;
    const amountNumber = Number(amount);

    let FindVoucher = await Voucher.findOne({
      _id: voucher_id,
      // remainingQuantity: { $gte: amountNumber },
    });
    if (FindVoucher) {
      // ค้นหาใบ `list` ที่ยัง unused
      let availableLists = FindVoucher.list
        .filter((item) => item.status === "unused")
        .slice(0, amountNumber);

      if (availableLists.length < amountNumber) {
        return res
          .status(400)
          .json({ message: "Not enough available vouchers" });
      }

      FindVoucher.list.forEach((item) => {
        if (availableLists.some((list) => list.no === item.no)) {
          item.status = "used";
          item.usedAt = new Date();
        }
      });

      FindVoucher.remainingQuantity -= amountNumber;

      FindVoucher.markModified("list");

      await FindVoucher.save();

      // บันทึกการใช้ใน `Booking`
      const newBooking = new Booking({
        voucherId: voucher_id,
        email,
        userId:req.user._id,
        usedList: availableLists.map((item) => ({
          no: item.no,
          usedAt: new Date(),
        })),
      });

      await newBooking.save();

      let guestInfoContent = `
          Guest :
          - Company: ${req.user.companyName}
          - Contact Person: ${req.user.contactPerson}
          - Email : ${email}
          `;

      let MessageContent = `
          APIS Registeration Confirmation
          Your requested booking has been confirmed. Please check the details below:
          
          Voucher Code: ${voucher_id}
          title : ${FindVoucher.title}
          Check-in: ${FindVoucher.validFrom}
          Check-out: ${FindVoucher.validUntil}
          Guest Information:
          ${guestInfoContent}
                `;

      const newMessage = new Message({
        content: MessageContent,
        email: req.user.email,
        userId: req.user._id,
        isIndividualMesssage: true,
        sender: "TRIP-DAY",
        isRead: false,
        readAt: null,
      });
      await newMessage.save();

      bot.sendMessage(
        process.env.TELGRAM_CHAT_ID,
        `[${voucher_id}] 시스템 강제등록 발생 ${req.user._id}님의 바우처가 사용되었습니다. \n\n 사용내역: ${MessageContent}`
      );

      res.status(200).json({
        success: true,
        message: "Voucher submitted successfully",
      });
    } else {
      return res
        .status(404)
        .json({ message: "Voucher not found or insufficient quantity" });
    }
  } catch (error) {
    console.error("Error in submitVoucher:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting voucher",
      error: error.message,
    });
  }
};

// exports.renderVouchersPage = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const perPage = 20;
//         const skip = (page - 1) * perPage;

//         const vouchers = await Voucher.find({ userId: req.user.email }).skip(skip).limit(perPage);
//         const totalVouchers = await Voucher.countDocuments({ userId: req.user.email });
//         const totalPages = Math.ceil(totalVouchers / perPage);

//         res.render('vouchers', {
//             vouchers: vouchers,
//             user: {
//                 email: req.user.email,
//             },
//             currentPage: page,
//             totalPages: totalPages
//         });
//     } catch (error) {
//         console.error('Error rendering vouchers page:', error);
//         res.status(500).send('Error rendering vouchers page');
//     }
// };
