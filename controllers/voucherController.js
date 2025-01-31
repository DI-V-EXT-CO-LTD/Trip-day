const Voucher = require('../models/voucher');
const APIS = require('../models/APIS');
const Booking = require('../models/Booking');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});
const Message = require('../models/message');

exports.getVouchers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 20;
    const skip = (page - 1) * perPage;
    const vouchers = await Voucher.find({ userId: req.user.email }).skip(skip).limit(perPage);
    const totalVouchers = await Voucher.countDocuments({ userId: req.user.email });
    const totalPages = Math.ceil(totalVouchers / perPage);

    if (req.xhr) {
      // AJAX 요청인 경우 부분적인 HTML을 반환
      res.render('partials/voucherList', {
        vouchers,
        currentPage: page,
        totalPages,
        layout: false
      });
    } else {
      // 일반 요청인 경우 전체 페이지를 렌더링
      res.render('vouchers', {
        vouchers,
        user: { email: req.user.email },
        currentPage: page,
        totalPages
      });
    }
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ success: false, message: 'Error fetching vouchers' });
  }
};

exports.submitVoucher = async (req, res) => {
    try {
        const {
            userId,
            hotelName,
            voucherCode,
            remainingQuantity,
            roomCount,
            startDate,
            endDate,
            totalUsage,
            guestInfo
        } = req.body;

        // 여기에서 바우처 사용 로직을 구현합니다.
        // 예: 바우처 수량 업데이트, 사용 내역 저장 등
        // 임시 로직: 바우처 수량 감소
        let APISCODE = 'APIS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        let FindVoucher = await Voucher.findOne({ voucherCode: voucherCode });
        if(FindVoucher){
          
          if(FindVoucher.quantity >= totalUsage){
              FindVoucher.quantity -= totalUsage;
              await FindVoucher.save();

              let newAPIS = new APIS({
                  APISCODE: APISCODE,
                  userId: userId,
                  Hotel: hotelName,
                  Amount: totalUsage,
                  useDate_Start: startDate,
                  useDate_End: endDate,
                  
                  CustomerInfo: []
              });
              newAPIS.CustomerInfo.push(guestInfo);
              await newAPIS.save();
              
              let newBooking = new Booking({
                  APISCODE: APISCODE,
                  userId: userId,
                  Hotel: hotelName,
                  Amount: totalUsage,
                  useDate: startDate,
                  
                  CustomerInfo: []
              });
              newBooking.CustomerInfo.push(guestInfo);
              await newBooking.save();
          } 
        }

        let guestInfoContent = guestInfo.map((guest, index) => `
        Guest ${index + 1}:
        - Name: ${guest.lastName} ${guest.firstName}
        - Passport Number: ${guest.passportNumber}
        - Sex: ${guest.sex}
        - Date of birth: ${guest.birthday}
        - Remark: ${guest.remark}
        `).join('\n');

        let MessageContent = `
        APIS Registeration Confirmation
        Your requested booking has been confirmed. Please check the details below:
        
        APISCODE: ${APISCODE}
        Hotel: ${hotelName}
        Voucher Code: ${voucherCode}
        Check-in: ${startDate}
        Check-out: ${endDate}
        Nights: ${totalUsage}
        Guest Information:
        ${guestInfoContent}
              `;
        const newMessage = new Message({
          content: MessageContent,
          email: userId,
          recipient: userId,
          isIndividualMesssage: true,
          sender: "TRIP-DAY",
          isRead: false,  
          readAt: null
        });
        await newMessage.save();

        bot.sendMessage(process.env.TELGRAM_CHAT_ID, `[${APISCODE}] 시스템 강제등록 발생 ${userId}님의 바우처가 사용되었습니다. \n\n 사용내역: ${MessageContent}`);

       
        // 실제로는 데이터베이스 업데이트 로직이 여기에 들어가야 합니다.
        // 예: await Voucher.findOneAndUpdate({ voucherCode: voucherCode }, { quantity: updatedQuantity });


        res.status(200).json({
            success: true,
            message: "Voucher submitted successfully",
        });
    } catch (error) {
        console.error('Error in submitVoucher:', error);
        res.status(500).json({ success: false, message: "Error submitting voucher", error: error.message });
    }
};

exports.renderVouchersPage = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const perPage = 20;
        const skip = (page - 1) * perPage;
        
        const vouchers = await Voucher.find({ userId: req.user.email }).skip(skip).limit(perPage);
        const totalVouchers = await Voucher.countDocuments({ userId: req.user.email });
        const totalPages = Math.ceil(totalVouchers / perPage);
        
        res.render('vouchers', { 
            vouchers: vouchers,
            user: {
                email: req.user.email,
            },
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.error('Error rendering vouchers page:', error);
        res.status(500).send('Error rendering vouchers page');
    }
};