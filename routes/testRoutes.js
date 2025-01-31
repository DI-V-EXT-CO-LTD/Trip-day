const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
mongoose = require('mongoose');
const hotelModel = mongoose.model('Hotel');
const roomModel = require('../models/room');
const userModel = require('../models/user');
const bookingModel = require('../models/Booking');
const Wallet = require('../models/wallet');
const crypto = require('crypto');
const mailgunConfig = require('../config/mailgun');
const mailgun = require('mailgun-js')(mailgunConfig);
const EmailLog = require('../models/emailLog');
const voucherModel = require('../models/voucher');
const invoiceModel = require('../models/inv');
const golfCourseModel = require('../models/golf');
const packageModel = require('../models/package');
const Message = require('../models/message');
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELGRAM_BOT_TOKEN, {polling: false});
const APIS = require('../models/APIS');
const moment = require('moment');
const xlsx = require('xlsx');



// Increase the default timeout
router.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  next();
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
}).single('image');

// GET route to render the upload page
router.get('/upload', (req, res) => {
  res.render('test/uploadImg');
});

router.get('/fetch/validdate/:validfrom', async (req, res) => {
  try {
    const validfrom = req.params.validfrom;
    const date = moment(validfrom);

    if (!date.isValid()) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    let returnDate;

    if (date.isBetween(moment(date).month(10).date(1), moment(date).month(11).date(24), null, '[]')) {
      returnDate = moment(date).month(11).date(25);
    } else if (date.isBetween(moment(date).month(11).date(25), moment(date).month(0).date(7), null, '[]')) {
      returnDate = moment(date).month(0).date(7);
    } else if (date.isBetween(moment(date).month(0).date(8), moment(date).month(3).date(15), null, '[]')) {
      returnDate = moment(date).month(3).date(15);
    } else if (date.isBetween(moment(date).month(3).date(16), moment(date).month(9).date(31), null, '[]')) {
      returnDate = moment(date).month(9).date(31);
    } else {
      return res.status(400).json({ success: false, message: "Date out of range" });
    }

    res.status(200).json({ success: true, validDate: returnDate.format('YYYY-MM-DD') });
  } catch (error) {
    console.error('Error getting Valid Date:', error);
    res.status(500).json({ success: false, message: "Error getting Valid Date" });
  }
});

router.get('/update/HotelValids', async (req, res) => {
  const AllHotels = await hotelModel.find();

  for (let i = 0; i < AllHotels.length; i++) {
    AllHotels[i].validFrom = new Date();
    
    // validFrom 날짜로부터 30일 후로 설정
    const expiredDate = new Date(AllHotels[i].validFrom);
    expiredDate.setDate(expiredDate.getDate() + 30);
    AllHotels[i].ExpiredAt = expiredDate;
  }

  // 모든 호텔의 업데이트를 데이터베이스에 저장
  await Promise.all(AllHotels.map(hotel => hotel.save()));

  res.send("Hotel valid dates updated successfully");

});

// POST route to handle the image upload
router.post('/upload/img', (req, res) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(500).send(`Multer error: ${err.message}`);
    } else if (err) {
      console.error('Unknown error:', err);
      return res.status(500).send(`Unknown error: ${err.message}`);
    }

    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    console.log('File uploaded successfully:', req.file);
    res.send('File uploaded successfully! Filename: ' + req.file.filename);
  });
});

router.get('/fetch/validdate/:validfrom', async (req, res) => {
  try {
    const validfrom  = req.params.validfrom;
    const date = moment(validfrom);

    if (!date.isValid()) {
      return res.status(400).json({ success: false, message: "Invalid date format" });
    }

    const year = date.year();
    let returnDate;
    let season;

    if (date.isBetween(moment(`${year}-11-01`), moment(`${year}-12-24`), null, '[]')) {
      returnDate = moment(`${year}-12-25`);
      season = "A";
    } else if (date.isBetween(moment(`${year}-12-25`), moment(`${year + 1}-01-07`), null, '[]')) {
      returnDate = moment(`${year + 1}-01-07`);
      season = "B";
    } else if (date.isBetween(moment(`${year}-01-08`), moment(`${year}-04-15`), null, '[]')) {
      returnDate = moment(`${year}-04-15`);
      season = "C";
    } else if (date.isBetween(moment(`${year}-04-16`), moment(`${year}-10-31`), null, '[]')) {
      returnDate = moment(`${year}-10-31`);
      season = "D";
    } else {
      return res.status(400).json({ success: false, message: "Date out of range" });
    }

    res.status(200).json({ success: true, validDate: returnDate.format('YYYY-MM-DD'), season: season });
  } catch (error) {
    console.error('Error getting Valid Date:', error);
    res.status(500).json({ success: false, message: "Error getting Valid Date" });
  }
});

router.get('/fetch/HotelImages', async (req, res) => {
  const url = 'http://trip-day.com/api/hotel-list';
  const dataArray = await fetchJsonToArray(url);

  let FindAllHotels = await hotelModel.find();
    for(let i=0; i < FindAllHotels.length; i++) 
    {
      for(let j=0; j < dataArray.length; j++) {
        if(FindAllHotels[i].image_id == dataArray[j].id) {
          FindAllHotels[i].image_id = dataArray[j].file_path;
          
        }
      }
      for(let k=0; k < dataArray.length; k++) {
        if(FindAllHotels[i].banner_image_id == dataArray[k].id) {
          FindAllHotels[i].banner_image_id = dataArray[k].file_path;
          
        }
      }
      for(let q = 0; q < FindAllHotels[i].gallery.length; q++) {
        for(let l=0; l < dataArray.length; l++) {
          if(FindAllHotels[i].gallery[q] == dataArray[l].id) {
            FindAllHotels[i].gallery[q] = dataArray[l].file_path;
           
          }
        }
      }
      await FindAllHotels[i].save();
    }
  

  res.send("Complete"); // 데이터를 클라이언트에 응답으로 보냅니다.
});

router.get('/fetch/CreateHotelRoomFromJson', async (req, res) => {
  const hotelRoomData = fs.readFileSync('json/bravo_hotel_rooms.json', 'utf8');
  const hotelData = fs.readFileSync('json/bravo_hotels.json', 'utf8');
  const mediafileData = fs.readFileSync('json/media_files.json', 'utf8');

  const hotelRoomArray = JSON.parse(hotelRoomData);
  const hotelArray = JSON.parse(hotelData);
  const mediafileArray = JSON.parse(mediafileData);

  for(let i = 0; i < hotelRoomArray.length; i++) {
    let thisHotelName = "";

    for(let h = 0; h < hotelArray.length; h++) {
      if(hotelRoomArray[i].parent_id == hotelArray[h].id) {
        thisHotelName = hotelArray[h].title;
        break;
      }
    }
    console.log("Found Hotel Name: " + thisHotelName);
    let FindHotel = await hotelModel.findOne({title: thisHotelName});
    if(FindHotel != null) {
      console.log("+++++++++++++"+FindHotel);
      let newGallery = hotelRoomArray[i].gallery.split(',');
      let newMediaUrls = [];
      for(let j = 0; j < mediafileArray.length; j++) 
      {
        for(let k = 0; k < newGallery.length; k++) 
        {
          if(mediafileArray[j].id == newGallery[k]) 
          {
            newMediaUrls.push(mediafileArray[j].file_path);
          }   
        }
      }
      
      if(FindHotel !== null && FindHotel !== undefined) {
        let newHotelRoom = new roomModel({
          title: hotelRoomArray[i].title,
          content: hotelRoomArray[i].content || "",
          images: newMediaUrls,
          price: hotelRoomArray[i].price || 0,
          hotel: FindHotel.title,
          number: hotelRoomArray[i].number,
          beds: hotelRoomArray[i].beds,
        
          adults: hotelRoomArray[i].adults || 2,
          children: hotelRoomArray[i].children || 0,
          status: "active",
          amenties: [],
          is_breakfast_included: false,
          is_refundable: false,
          available_dates: [],
        });
        console.log(newHotelRoom.title);
        await newHotelRoom.save();

        FindHotel.rooms.push(newHotelRoom);
        await FindHotel.save();
      }
    }
    
  }
 

  res.send("Complete"); // 데이터를 클라이언트에 응답으로 보냅니다.
});
router.get('/update/hotelData', async (req, res) => {
  
  const AllHotels = await hotelModel.find();

  if(AllHotels.length > 0) {
    for(let i = 0; i < AllHotels.length; i++) {
      AllHotels[i].rooms = [];
      await AllHotels[i].save();
    }
  }

  res.send ("Complete");
});

router.get('/fetch/HotelList', async (req, res) => {
  const url = 'http://trip-day.com/api/hotel-list';
  const dataArray = await fetchJsonToArray(url);

  for (let i = 0; i < dataArray.length; i++) {
    let hotelData = dataArray[i];

    // 호텔 데이터를 스키마에 맞게 변환하여 새로운 호텔 인스턴스를 생성합니다.
    let newHotel = new hotelModel({
      title: hotelData.title,
      slug: hotelData.slug,
      content: hotelData.content || "",
      image_id: hotelData.image_id || 0,
      banner_image_id: hotelData.banner_image_id || 0,
      location_id: hotelData.location_id,
      address: hotelData.address || "",

      map_zoom: 14,
      star_rate: 5,
      price: parseFloat(hotelData.price) || 0,
      check_in_time: "13:00",
      check_out_time: "11:00",
      status: hotelData.status,
      is_featured: hotelData.is_featured ? true : false,
      gallery: hotelData.gallery ? hotelData.gallery.split(',') : [],
      video: hotelData.video,
      policy: hotelData.policy,
      review_score: 5,
      enable_extra_price: hotelData.enable_extra_price ? true : false,
      service_fee: 0,
      surrounding: "",
      min_day_before_booking: hotelData.min_day_before_booking,
      min_day_stays: hotelData.min_day_stays
    });

    // 호텔 데이터를 데이터베이스에 저장합니다.
    try {
      await newHotel.save();
    } catch (error) {
      console.error(`Failed to save hotel: ${hotelData.title}`, error);
    }
  }

  res.send("Complete"); // 데이터를 클라이언트에 응답으로 보냅니다.
});
router.get("/create/booking", async (req, res) => {
  
  let HotelNames = [
    "[STAY&JOY Product] Siam Country Club Plantation + Mytt Hotel Pattaya",
    "Gems Mining Pattaya",
    "Pullman Pattaya",
    "Dusit Thani Pattaya",
    "Aspery Phuket",
    "Cres Resort & Pool Villa Phuket",
    "Dusit Thani Pattaya",
    "D'varee Rancho Khao Yai",
    "Crest Resort Phuket",
    "Wyndham Phuket",
    "Greenery Resort Khao Yai"
  ]
  let VoucherCount = [
    4176,
    360,
    2668,
    2368,
    4065,
    1071,
    3276,
    1176,
    588,
    1085,
    2860
  ]

  for(let i = 0; i < HotelNames.length; i++) {
    let createBooking1 = new bookingModel({
      userId: "perfectholders2877@gmail.com",
      Hotel: HotelNames[i],
      Amount: VoucherCount[i],
      useDate: Date.now(),
      createAt: Date.now(),
      CustomerInfo: []
    });
    await createBooking1.save();
  };

  
  res.send("Complete");
});
router.get('/reset/hotelDatas', async (req, res) => {
  const UpdateHotels = await hotelModel.updateMany({rooms:[]});
  res.send("Hotel Data Reset Complete");
});
router.get('/change/promotions', async (req, res) => {
  const BestSellersCount = 30;
  const FireSalesCount = 30;
  const EarlyBirdCount = 30;

  //전체 호텔의 프로모션의 종류를 변경. BestSellers, FireSales, EarlyBird의 갯수만큼 랜덤한 호텔을 프로모션을 변경
  
  let ResetAllHotels = await hotelModel.updateMany({}, {isPromotion: false, promotionType: "", promotionStartDate: null, promotionEndDate: null, voucherAmount: 2000});

  let AllHotels = await hotelModel.find();
  let BestSellersHotels = [];
  let FireSalesHotels = [];
  let EarlyBirdHotels = [];

  for(let i = 0; i < AllHotels.length; i++) {
    let randomPromotion = Math.floor(Math.random() * 3);
    if(randomPromotion == 0) {
      BestSellersHotels.push(AllHotels[i]);
    } else if(randomPromotion == 1) {
      FireSalesHotels.push(AllHotels[i]);
    } else {
      EarlyBirdHotels.push(AllHotels[i]);
    }
  }
  console.log("BestSellersHotels: " + BestSellersHotels.length);
  console.log("FireSalesHotels: " + FireSalesHotels.length);
  console.log("EarlyBirdHotels: " + EarlyBirdHotels.length);


  for(let i = 0; i < BestSellersCount; i++) {
    let randomIndex = Math.floor(Math.random() * BestSellersHotels.length);
    BestSellersHotels[randomIndex].isPromotion = true;
    BestSellersHotels[randomIndex].promotionType = "BestSellers";
    BestSellersHotels[randomIndex].promotionStartDate = new Date();
    BestSellersHotels[randomIndex].promotionEndDate = new Date();
    BestSellersHotels[randomIndex].voucherAmount = 20000;
    await BestSellersHotels[randomIndex].save();
  }

  for(let i = 0; i < FireSalesCount; i++) {
    let randomIndex = Math.floor(Math.random() * FireSalesHotels.length);
    FireSalesHotels[randomIndex].isPromotion = true;
    FireSalesHotels[randomIndex].promotionType = "FireSales";
    FireSalesHotels[randomIndex].promotionStartDate = new Date();
    FireSalesHotels[randomIndex].promotionEndDate = new Date();
    FireSalesHotels[randomIndex].voucherAmount = 20000;
    await FireSalesHotels[randomIndex].save();
  }

  for(let i = 0; i < EarlyBirdCount; i++) {
    let randomIndex = Math.floor(Math.random() * EarlyBirdHotels.length);
    EarlyBirdHotels[randomIndex].isPromotion = true;
    EarlyBirdHotels[randomIndex].promotionType = "EarlyBird";
    EarlyBirdHotels[randomIndex].promotionStartDate = new Date();
    EarlyBirdHotels[randomIndex].promotionEndDate = new Date();
    EarlyBirdHotels[randomIndex].voucherAmount = 20000;
    await EarlyBirdHotels[randomIndex].save();
  }
  res.send("Complete");
});

async function createNewAccounts(){
  let userEmails = [
      "eastasiacontact@cjtour.co.kr",
      "globaltour@giniairtour.co.kr",
      "eastasia@verygoodtour.com",
      "contactea@kyowontour.com",
      "Thaithotels@modetour.com",
      "https://www.koreatravel.com",


      "contacthelp@asianplustravel.com",
      "Book@expertasiatravel.com/",
      "nstravel@nstravel.com",
      "siam@siamtraveller.com",
      "trunkhelp@trunk.travel",

      "hotels@lagunaphuket.com",


      "hotel@malaysianharmony.com.my",

      "hotelbook@sunway.travel",

      "partner@travelplanner.com.my",
      "contackthtl@pplevacations.my",
      "hotel@reliancepremiertravel.com",

      "asia@www.his-j.com",
      "eastasia@newtripstyle.com",
      "tourpass@.inaka-experiences.com",
      "thaivc@motenas-japan.com",
      "thaihotelvc@etravel.nagoya",
      "hotelbook@jtbcorp.jp",
      "asiahotel@ntainbound.com",
      "hotelgolf@knt.co.jp",

      "aisa@tuniu.com",

      "thaihtl@cits.net",
      "travelbook@ly.com",
      "vcattion@springtour.com",

      "tourasia@cyts.com",
      "reservehotel@utourworld.com",

      "hotelvc@masalathai.com",
      "thaivoucher@holidify.com",
      "travelvc@traveltriangle.com",
      "voucher@hellotravel.com",
      "hotelrv@thomascook.in",
      "voucherpartner@sotc.in",
      "tripasia@kesari.in",
      "thaitrip@veenaworld.com",
      "maketripthai@makemytrip.com",

      "asiatrip@russtd.com",
      "hotelrv@anextour.com",
      "book@coral.ru",
      "contactasia@tez-tour.com",
      "thaitole@bgoperator.ru",
      "bookhelp@intourist.com",
      "partnerbz@natalie-tours.ru",
      "asiatour@sunmar.ru",
  ]

  try {

    for(let i = 0; i < userEmails.length; i++) {
      const existingUser = await userModel.findOne({ email : userEmails });

      if (existingUser) {
        console.log("Existing User");
        console.log('Email is already registered.' );
      }
      const newUser = new userModel({
        email:userEmails[i],
        verificationToken: crypto.randomBytes(32).toString('hex'),
        status: 'Pending',
        registrationIP: "0.0.0.0",
        registrationCountry: "TH",
        registrationBrowser: "Chrome",
        registrationDevice: "Manual",
        isEmailVerified: false
      });

      await newUser.save();

      // Create a wallet for the new user
      const newWallet = new Wallet({
        user: newUser._id,
        thbBalance: 0,
        usdtBalance: 0
      });

      await newWallet.save();

      const data = {
        from: 'TRIP-DAY EMAIL VERIFICATION <contact@trip-day.com>',
        to: userEmails[i],
        subject: 'Email Verification',
        text: `Click the link to verify your email: http://trip-day.com/auth/verify-email?token=${newUser.verificationToken}`
      };

      mailgun.messages().send(data, (error, body) => {
        if (error) {
          console.log('Error sending verification email');
        }
        console.log('Verification email sent. Please check your inbox.' );
        
        
      });
      const newEmailLog = new EmailLog({
        from: data.from,
        to: data.to,
        subject: data.subject,
        text: data.text,
      });
      await newEmailLog.save();
    }
  } catch (error) {
    console.error('Error in registerUser:', error);

  }
  
}
const generateSlug = (name) => {
  return name.toLowerCase().replace(/\s+/g, '_');
};

// 엑셀 파일 경로 설정
//엑셀 파일경로: public/datasheet.xlsx
const filePath = path.join(__dirname, '..', 'public', 'datasheet_1.xlsx');
const workbook = xlsx.readFile(filePath);
// const sheet = workbook.Sheets[workbook.SheetNames[0]];
// const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// const hotelNameList = [];
// const hotelExplains = [];
// const hotelAddressList = [];
// const hotelPrice = [];
// const Image1Path = [];
// const Image2Path = [];
// const Image3Path = [];
// const Image4Path = [];
// const Image5Path = [];
// const Image6Path = [];
// const location = [];

// // 첫 번째 행(헤더)을 제외하고 데이터를 각 배열에 할당
// data.slice(1).forEach(row => {
//   hotelNameList.push(row[0]);
//   hotelExplains.push(row[1]);
//   hotelAddressList.push(row[2]);
//   hotelPrice.push(row[3]);
//   Image1Path.push(row[4]);
//   Image2Path.push(row[5]);
//   Image3Path.push(row[6]);
//   Image4Path.push(row[7]);
//   Image5Path.push(row[8]);
//   Image6Path.push(row[9]);
//   location.push(row[10]);
// });

// function loadSheetData(sheetName) {
//   const sheet = workbook.Sheets[sheetName];
//   const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
//   return data.slice(1); // 헤더 제외
// }


//roomData
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}
//roomData
function loadSheetData(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  return data; // 첫 번째 행도 포함하여 전체 데이터 반환
}

// 시즌별 데이터를 저장할 배열 초기화
const hotelNames = [];
const RoomNames = [];
const SeasonData = {
  Season1Price: [],
  Season1Start: [],
  Season1End: [],
  Season2Price: [],
  Season2Start: [],
  Season2End: [],
  Season3Price: [],
  Season3Start: [],
  Season3End: [],
  Season4Price: [],
  Season4Start: [],
  Season4End: [],
  Season5Price: [],
  Season5Start: [],
  Season5End: [],
  Season6Price: [],
  Season6Start: [],
  Season6End: []
};

// 각 시트에서 데이터를 읽어와 시즌별 객체에 할당
const seasonSheets = [
  //{ sheetName: 'Season1', priceKey: 'Season1Price', startKey: 'Season1Start', endKey: 'Season1End' },
  //{ sheetName: 'Season2', priceKey: 'Season2Price', startKey: 'Season2Start', endKey: 'Season2End' },
  //{ sheetName: 'Season3', priceKey: 'Season3Price', startKey: 'Season3Start', endKey: 'Season3End' },
  //{ sheetName: 'Season4', priceKey: 'Season4Price', startKey: 'Season4Start', endKey: 'Season4End' },
  //{ sheetName: 'Season5', priceKey: 'Season5Price', startKey: 'Season5Start', endKey: 'Season5End' },
  //{ sheetName: 'Season6', priceKey: 'Season6Price', startKey: 'Season6Start', endKey: 'Season6End' }
];


// // 중복 확인 및 시즌별 데이터 할당
// seasonSheets.forEach(season => {
//   const data = loadSheetData(season.sheetName);
//   data.forEach((row, index) => {
//       if (row.length >= 6) { // 행의 필드 개수가 6개 이상인 경우만 처리
//           const hotel = row[1];
//           const room = row[2];

//           if (index === 0 || !hotel || !room) return; // 첫 번째 행 무시 또는 호텔/방 정보가 없는 행은 건너뜀

//           // if (!hotelNames.includes(hotel)){
            
//           //   console.log(hotel + " HOTEL is not in the list");
//           // } 
//           // else{
//           //   hotelNames.push(hotel);
//           // }

//           hotelNames.push(hotel);
//           // if (!RoomNames.includes(room)){
//           //   console.log(room + " ROOM is not in the list");
//           // }else{
//           //   RoomNames.push(room);
//           // } 
//           RoomNames.push(room);

//           const price = row[3] || 0; // 값이 없으면 0으로 설정
//           const start = row[4] ? excelDateToJSDate(row[4]) : ''; // 값이 있으면 변환, 없으면 빈 문자열
//           const end = row[5] ? excelDateToJSDate(row[5]) : ''; // 값이 있으면 변환, 없으면 빈 문자열

//           SeasonData[season.priceKey].push(price);
//           SeasonData[season.startKey].push(start);
//           SeasonData[season.endKey].push(end);
//       }
//   });
// });


async function createHotel() {
  try {
    for (let i = 0; i < hotelNameList.length; i++) {
      const hotelData = {
        title: hotelNameList[i],
        slug: generateSlug(hotelNameList[i]),
        content: hotelExplains[i],
        nameEn: hotelNameList[i],
        location_id: 99,
        address: hotelAddressList[i],
        map_lat: 1,
        map_lng: 12,
        map_zoom: 14,
        is_featured: false,
        star_rate: 5,
        price: hotelPrice[i],
        check_in_time: "13:00",
        check_out_time: "11:00",
        sale_price: undefined,
        status: "active",
        location_category: location[i],
      };

      hotelData.image_id = Image1Path[i];
      hotelData.banner_image_id = Image6Path[i];
      hotelData.gallery = [Image1Path[i], Image2Path[i], Image3Path[i], Image4Path[i], Image5Path[i], Image6Path[i]];

      const newHotel = new hotelModel(hotelData);
      await newHotel.save();
      console.log('Hotel saved:', newHotel.title);
    }
  } catch (error) {
    console.error('Error saving hotel:', error);
  }
}
//createHotel();

//createRooms();
async function createRooms() {
  let RoomJson = [];
  console.log(`Creating ${RoomNames.length} rooms...`);
  for (let i = 0; i < RoomNames.length; i++) {
    console.log(`Creating room ${i + 1} of ${RoomNames.length}`);
    console.log(`Hotel: ${hotelNames[i]}`);
    console.log(`Room: ${RoomNames[i]}`);
      let Room = {
          hotel: hotelNames[i] || 'Unknown Hotel',
          title: RoomNames[i] || 'Unknown Room',
          season1Price: SeasonData.Season1Price[i] || 0,
          season1Start: SeasonData.Season1Start[i] || '',
          season1End: SeasonData.Season1End[i] || '',
          season2Price: SeasonData.Season2Price[i] || 0,
          season2Start: SeasonData.Season2Start[i] || '',
          season2End: SeasonData.Season2End[i] || '',
          season3Price: SeasonData.Season3Price[i] || 0,
          season3Start: SeasonData.Season3Start[i] || '',
          season3End: SeasonData.Season3End[i] || '',
          season4Price: SeasonData.Season4Price[i] || 0,
          season4Start: SeasonData.Season4Start[i] || '',
          season4End: SeasonData.Season4End[i] || '',
          season5Price: SeasonData.Season5Price[i] || 0,
          season5Start: SeasonData.Season5Start[i] || '',
          season5End: SeasonData.Season5End[i] || '',
          season6Price: SeasonData.Season6Price[i] || 0,
          season6Start: SeasonData.Season6Start[i] || '',
          season6End: SeasonData.Season6End[i] || '',
      };
      RoomJson.push(Room);
  }

  try {
      await createRoom(RoomJson);
  } catch (error) {
      console.error('Error saving room:', error);
  }
}

// createRoom 함수
async function createRoom(roomdatas) {
  try {
    console.log(roomdatas)
      for (let i = 0; i < roomdatas.length; i++) {
          const numberOfDays = calculateNumberOfDays(roomdatas[i].season6Start, roomdatas[i].season6End) * 15; //여기 변경
          const FindHotel = await hotelModel.findOne({ title: roomdatas[i].hotel });

          if (FindHotel) {
            console.log(roomdatas[i].hotel);
            console.log(roomdatas[i].title);
              const newRoom = new roomModel({
                  title: `${roomdatas[i].title} ${roomdatas[i].season6Start.toISOString().slice(0, 10)} ~ ${roomdatas[i].season6End.toISOString().slice(0, 10)}`,//여기 변경
                  content: FindHotel.content,
                  images: FindHotel.gallery[2],
                  price: roomdatas[i].season6Price,//여기변경
                  hotel: roomdatas[i].hotel,
                  number: numberOfDays,
                  beds: 1,
                  size: 100,
                  adults: 2,
                  children: 0,
              });
              await newRoom.save();

              await hotelModel.findByIdAndUpdate(
                  FindHotel._id,
                  { $push: { rooms: newRoom } },
                  { new: true }
              );
          } else {
              console.warn(`Hotel not found: ${roomdatas[i].hotel} -- ${roomdatas[i].title}`);
          }
      }
  } catch (error) {
      if (error.name === 'ValidationError') {
          for (let field in error.errors) {
              console.error(`Validation error for field ${field}:`, error.errors[field].message);
          }
      }
      throw error;
  }
}

function calculateNumberOfDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  return diffDays;
}




async function fetchJsonToArray(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
  } catch (error) {
      console.error('Error fetching JSON data:', error);
      return [];
  }
}


const { exec } = require('child_process');

async function backupDatabase() {
  try {
    const dbName = 'invoices'; // 데이터베이스 이름을 입력하세요.
    const backupPath = './backup'; // 백업 파일을 저장할 경로를 입력하세요.

    exec(`mongodump --db ${dbName} --out ${backupPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error backing up database: ${error}`);
        return;
      }
      console.log(`Database backup saved to ${backupPath}`);
    });
  } catch (error) {
    console.error('Error backing up database:', error);
  }
}

async function changePromotion() {
  const BestSellersCount = 30;
  const FireSalesCount = 30;
  const EarlyBirdCount = 30;

  //전체 호텔의 프로모션의 종류를 변경. BestSellers, FireSales, EarlyBird의 갯수만큼 랜덤한 호텔을 프로모션을 변경
  
  let ResetAllHotels = await hotelModel.updateMany({}, {isPromotion: false, promotionType: "", promotionStartDate: null, promotionEndDate: null, voucherAmount: 2000});

  let AllHotels = await hotelModel.find();
  let BestSellersHotels = [];
  let FireSalesHotels = [];
  let EarlyBirdHotels = [];

  for(let i = 0; i < AllHotels.length; i++) {
    let randomPromotion = Math.floor(Math.random() * 3);
    if(randomPromotion == 0) {
      BestSellersHotels.push(AllHotels[i]);
    } else if(randomPromotion == 1) {
      FireSalesHotels.push(AllHotels[i]);
    } else {
      EarlyBirdHotels.push(AllHotels[i]);
    }
  }
  console.log("BestSellersHotels: " + BestSellersHotels.length);
  console.log("FireSalesHotels: " + FireSalesHotels.length);
  console.log("EarlyBirdHotels: " + EarlyBirdHotels.length);


  for(let i = 0; i < BestSellersCount; i++) {
    let randomIndex = Math.floor(Math.random() * BestSellersHotels.length);
    BestSellersHotels[randomIndex].isPromotion = true;
    BestSellersHotels[randomIndex].promotionType = "BestSellers";
    BestSellersHotels[randomIndex].promotionStartDate = new Date();
    BestSellersHotels[randomIndex].promotionEndDate = new Date();
    BestSellersHotels[randomIndex].voucherAmount = 20000;
    await BestSellersHotels[randomIndex].save();
  }

  for(let i = 0; i < FireSalesCount; i++) {
    let randomIndex = Math.floor(Math.random() * FireSalesHotels.length);
    FireSalesHotels[randomIndex].isPromotion = true;
    FireSalesHotels[randomIndex].promotionType = "FireSales";
    FireSalesHotels[randomIndex].promotionStartDate = new Date();
    FireSalesHotels[randomIndex].promotionEndDate = new Date();
    FireSalesHotels[randomIndex].voucherAmount = 20000;
    await FireSalesHotels[randomIndex].save();
  }

  for(let i = 0; i < EarlyBirdCount; i++) {
    let randomIndex = Math.floor(Math.random() * EarlyBirdHotels.length);
    EarlyBirdHotels[randomIndex].isPromotion = true;
    EarlyBirdHotels[randomIndex].promotionType = "EarlyBird";
    EarlyBirdHotels[randomIndex].promotionStartDate = new Date();
    EarlyBirdHotels[randomIndex].promotionEndDate = new Date();
    EarlyBirdHotels[randomIndex].voucherAmount = 20000;
    await EarlyBirdHotels[randomIndex].save();
  }
}

async function RegisterGolf(){
  let GolfCourseTitle = [
    "Siam Country Club Plantation",
    "Siam Country Club Pattaya Waterside",
    "Siam Country Club Rolling Hills",
    "Siam Country Club Old Course",
    "Laem Chabang Country Club",
    "Chee Chan Resort Golf Club",
    "Burapha Golf and Resort",
    "Springfield Golf Club",
    "Pineapple Valley Golf Club (Banyan Golf Club)",
    "Palm Hills Golf Club",
    "Black Mountain Golf Club",
    "Suwan Golf & Country Club",
    "Alpine Golf Club",
    "Nikanti Golf Club",
    "The RG City Golf Club (Royal Gems Golf City)",
    "Thai Country Club",
    "Green Valley Country Club",
    "Kirimaya Golf Club",
    "Khao Yai Country Club",
    "Rancho Charnvee Country Club",
    "Sir James Country Club (Forest Hills Country Club)",
    "Blue Canyon Country Club Canyon Course",
    "Blue Canyon Country Club Lakes Course",
    "Loch Palm Golf Club",
    "Red Mountain Golf Club",
    "Santiburi Samui Country Club",
    "Rajjaprabha Dam Golf Course",
    "Mission Hills Golf Club Kanchanaburi",
    "Artitaya Golf & Resort(Nichigo Golf Resort & Country Club)",
    "Blue Sapphire Golf Club",
    "Evergreen Hills Golf Club",
    "Mae Jo Golf Club",
    "Chiangmai Highlands Golf Resort",
    "Gassan Panorama Golf Club",
    "Victory Park Golf Course",
    "Royal Creek Golf Club",
    "Singha Park Golf Club",

  ]
  let GolfCourseContent = [
    "Siam Country Club Plantation Course is another brilliant 27-hole course designed by Schmidt & Curley set high in the hills behind Pattaya affording panoramic views all around.  This is another word-class course in every respect and a great golfing challenge.  Definitely one of the Best Golf Courses in Thailand.",
    "Siam Country Club Waterside is another championship course from this prestigious group and sure to become one of the icons of the local golfing scene. As its name suggest you will encounter many lakes, creeks and other water hazards to challenge your shot making.",
    "Siam Country is well known to those who play golf regularly in Thailand.  It is also highly regarded outside the country and has received many rave reviews throughout the years.  There have been three golf courses available to play at Siam Country Club but that has changed recently following the development of a fourth golf course. Siam Country Club Rolling Hills is the latest addition to the golf club and is situated just over 2 kilometres away from the Waterside Course.  The Rolling Hills Course has been designed by Brian Curley and the Siam Motors Group have invested a great deal of money to bring this golf course to life.",
    "Siam Country Club Old Course in Pattaya is an outstanding golf course which ranks with the best in Thailand which was completely revamped in 2007 by Schmidt & Curley Design.  It’s a private members golf club so start times at the weekends are at a prem",
    "Laem Chabang Country Club is one of the best golf courses in Pattaya and also one of the best in Thailand.  The course is is in pristine condition with lush fairways, fast and true putting greens, immaculate clubhouse and top-class caddies.  A “must play” course and one you will not forget.  Also offers night golf starting from 3.30pm which is very popular with Pattaya golfers.",
    "Chee Chan Golf Resort is one of the latest golf developments in Pattaya, Thailand.  Thanks to great links between Bangkok and Pattaya, it is easy to reach Chee Chan from Bangkok Airport and within a few hours, you will be at the resort. Chee Chan opened for play in 2018 and is an 18-hole golf course designed by David Dale from Golf Plan.  For those who believe they have heard of Chee Chan before, it may be due the carving of the Khao Chee Chan Buddha in the mountain face and this golf course sits below that giant image. It’s a dramatic setting for golf course and not only are there great views of the Buddha, there are also tremendous views of Pattaya and Jomtien as you play your way around the golf course. Chee Chan has several tees to choose from on each hole and you can make the course as difficult as you like in terms of length. From 6,527 yards to 7,345 yards, you will find a distance challenge to suit players of all abilities at Chee Chan.",
    "Burapha Golf Club is one of the most popular golf courses in Pattaya offering 36 excellent holes and great value for money.  The course is not that long and stretched to just over 6,800 yards from the back tees but it has regularly hosted some major regional tournaments.Each of the nines have different names  and the East course combines American Wood and British Links and the West course the Crystal Spring and Dune nines and whichever combination you try the course does offer a very enjoyable golfing experience.",
    "Springfield Royal Country Club is one of our favourite golf courses in Hua Hin.  A little further out of town than some of the other courses but can be easily reached within 30 minutes.  As you would expect from a course designed by the legendary Jack Nicklaus there are plenty of traps in the shape of bunkers and water hazards strategically placed to catch that fade or slice off the tee.",
    "Pineapple Valley Golf Club Hua Hin is an outstanding golf courses which we voted onto our list of Best Golf Courses in Thailand.  The course was designed by a local architect he has made use of the natural surroundings and the pineapple plantations which surround the course often come into play. There are six tee boxes to cater to all handicaps and as you would expect the course is dotted with some rather impressive and well-located water hazards and bunkers. Play well, and you may well reach the fast and true greens in regulation.",
    "One of the first international standard courses in Hua Hin, Palm Hills Golf Club remains a firm favourite and although a bit short it’s an excellent layout with fast greens which are tricky to read.  Good clubhouse with excellent bar and restaurant.",
    "Black Mountain Golf Club features 27-holes of breathtaking, championship-standard golf and regularly ranks as one of the top 100 courses in the world. The host of multiple Asian PGA events, the course is set amidst stunning mountains, natural creeks and contours carved by nature; it’s a beautiful area for a really challenging game of golf.",
    "Suwan Golf and Country Club is a challenging course set in the countryside outside Bangkok in a wonderful rural setting. Has won a number of awards and has hosted several major tournaments.  A difficult layout with many elevation changes and well-placed hazards.  It also made our pick of best golf courses in Bangkok.",
    "The Alpine Golf Club in Bangkok is one of the top golf courses in Thailand which has often hosted some top class events including the 2000 Johnnie Walker Classic which was won by Tiger Woods.  Designed by the world-famous Ronald M. Garl this is a superbly designed course that will require you to be on top of your game if you are to score well.  The heavily contoured fairways means there are few level lies and many of the greens slope away from you making it difficult to hold your approach.",
    "Nikanti Golf Club is a very unusual new Bangkok golf course which is unique in several ways:  it’s the first golf club in Thailand to be fully inclusive and once you pay your green fee there is no extra to pay and it even includes food and your caddie tip!  The course construction is also unique and consists of three six-hole layouts rather than the usual two nines.  One of best golf courses in Bangkok.",
    "Royal Gems Golf City is an unusual and unique replica golf course not far from the centre of Bangkok which has a front nine with some of the most iconic holes from around the world and a back nine which has been inspired by the Augusta National – home of the Masters.  Great fun to dream of playing the Road hole at St Andrews or negotiating your way round Amen Corner - not quite as good as the real thing but then few of us will ever get the chance to play at Augusta.  Definitely one of the best golf courses in Thailand and it naturally made our pick of best golf courses in Bangkok.",
    "Thai Country Club in Bangkok is of the top golf courses in Thailand which has hosted several top-class events including the 1997 Asian Honda Classic won by Tiger Woods.  Not the most exciting golf course in Bangkok but certainly has the best service with a wonderfully efficient clubhouse service superb food and some of the best trained caddies in Thailand.  This is a private membes club so access is resticted - especially at weekends but Golfsavers have exclusive access to tee times at excellent prices.   It naturally made our pick of best golf courses in Bangkok.",
    "Green Valley Country Club Golf Course a Robert Trent Jones Jr. design very conveniently located close to Bangkok’s Suvanabhumi International Airport and despite its location it is set in beautiful countryside covered with mature trees and shrubs.",
    "When you play Kirimaya Golf Resort & Spa in Khao Yai you will realise that the designer, Jack Nicklaus, was really in great form when he designed this stunning golf course and we highly recommend it. Often rated as one of the best golf clubs in Khao Yai and up there with the best Nicklaus designs in Asia, Kirimaya Golf Resort & Spa is tranquil oasis set within lush tropical jungle of Khao Yai National Park. ",
    "Khao Yai Golf Club is a once great course which has fallen into disrepair, and so should probably be avoided for the time being. One of the three Jack Nicklaus designed courses under the Mission Hills banner, Khao Yai Golf Club, found just outside the National Park, is an enjoyable challenge that offers some stunning views of the surrounding hills. ",
    "D Varee Charvee Golf Course which was formerly known as Rancho Charnvee is an 18-hole layout in Khao Yai National Park about two hours from Bangkok.  It’s a pretty flat track with enough to keep the better golfer interested and higher handicappers will not find it too daunting.  The scenery and views are great so even if you don’t play that well you will have an enjoyable day out!",
    "The Sir James Resort & Country Club in Khao Yai which was formerly known as Forest Hills is actually closer to Bangkok than many other Khao Yai golf clubs so can be played on the way to the National park or on your way back.   This is a well-designed and challenging parkland course set in the foothills of the park featuring many streams, lakes and waterfalls which together with the local flowering plants make this a very attractive golf course.",
    "Phuket's only true championship course and site of some storied exploits by Tiger Woods Three times the host of the Johnnie Walker Classic, won here in 1998 by a certain Mr. Tiger Woods, the Canyon Course at Blue Canyon Country Club offers you the opportunity to measure yourself against the greats on what is consistently recognised as one of the best courses in Thailand. Weaving its way around an abandoned tin mine and taking advantage of the sheer cliffs of the canyons themselves, the course is a treat for any golfer and a must-play course on any golf holiday in Thailand.",
    "Less famous but no less exciting than its sister course—a hugely satisfying experience The younger sibling to the more famous Canyon course, the Lakes Course at Blue Canyon Country Club has emerged from big brother's shadow to become an excellent course in its own right thanks to rebuilt TifEagle greens and additional bunkers. Sweeping through dramatic scenery and peppered with lakes and canyons, it’s a demanding course with enough leeway that an off-day isn't too heavily punished if you can avoid the creeks and bunkers that intrude upon many of the fairways.",
    "A long-time Phuket favourite where a dry ball should ensure a good score Spectacularly set in a basin surrounded by mountainous jungle, Loch Palm Golf Club has been a firm favourite on the Phuket golf tour since its inception in 1993. More straightforward than some of its more illustrious competitors - but still with enough challenges to test golfers of all abilities thanks largely to the loch itself - this is a hugely enjoyable course.",
    "The most spectacular golf course in Phuket and worth every penny Set in the dramatically undulating landscape of an old tin mine amidst thick jungle, picturesque lakes and the red mountainside from which it took its name, Red Mountain Golf Club is quite simply one of the most spectacular courses in the world, let alone Thailand. Thanks to some memorable holes and the stunning views on offer from its high points, this is an essential stop on any Phuket golf holiday.",
    "Santiburi Samui Golf Club is the only 18-hole golf course on the island of Koh Samui which meanders its way through the jungle and hillsides above the beautiful beaches.  It’s a very tough course – particularly the back nine and you will need to be on top of your game and also enjoy a slice of luck to score well.   Its one of the courses that made it onto our list of Best Golf Courses in Thailand.",
    "Rajjaprabha Dam Golf Course is a  hidden gem in the remote hills near Khao Sok National Park, the quality of golf on offer makes it worth the journey time.  It's a easy day trip from either Phuket or Samui oryou can play enroute between the two.  ",
    "Situated just over 100 kilometres away from the Thailand capital, in the Kanchanaburi region of the country, is Mission Hills Golf Club.  This one of three Jack Nicklaus designed Mission Hills golf courses in Thailand, with the other two being in Phuket and Khao Yai.  The golf club has good road links, making it very easy to reach and is worth the journey, from either Kanchanaburi town or Bangkok.  Mission Hills was first open for play back in 1991 and provides a very good challenge, even for players on top of their game.",
    "Artitaya Golf & Resort Kanchanaburi, formerly known as Nichigo Resort & Country Club, offers a serene escape for golf enthusiasts seeking a balance of challenge and tranquility. Nestled amidst the picturesque landscapes of Kanchanaburi, this expansive resort boasts a 27-hole course that caters to golfers of all skill levels. The course is renowned for its well-maintained fairways, challenging water hazards, and strategically placed bunkers. The combination of lush greenery and natural beauty creates a visually stunning backdrop for a round of golf. Players can expect a fair test of their skills as they navigate the course's diverse layout, featuring a mix of doglegs, uphill lies, and fast greens.",
    "Golf is very popular across the whole of Thailand but golf in Kanchanaburi has really grown and the area offers a huge number of excellent golf courses.  Blue Sapphire Golf and Resort, is one such course and is located a short, 30-minute drive from Kanchanaburi town and 3 hours away from Bangkok.  The Blue Sapphire Golf and Resort is a 36-hole golf course and interestingly, the area in which it has been constructed, was formerly a Sapphire mine, hence the name.  The area of land left over from the mine, could easily house a large football stadium and it’s proved to be the perfect venue for a golf course. ",
    "Evergreen Hills Golf Club and Resort, is located very close to the Burmese border, in the Kanchanaburi region of Thailand.  Kanchanaburi town is about 1 hour drive away and Hua Hin is another 30 minutes further, making Evergreen Hills a possibility, from either of these places, as a day trip or for a longer period.  One of a collection of park land courses in this region of Thailand, Evergreen Hills is frequented by many locals and expatriates but visitors are also made welcome and it’s certainly worth making the trip.",
    "Mae Jo Golf Club in Chiang Mai is an unusual layout which winds its way through mature fruits trees with some excellent views from some of the elevated tees.  Several banana-shaped holes with blind tee shots but very playable for golfers of all standards.",
    "Chiang Mai Highlands Golf & Spa Resort is a superb golf course designed by the renowned team of Schmidt-Curley.  The golf club is located in the hills outside Chiang Mai with great views from almost every hole.  This course is a great experience and one of best in Thailand and since it opened it has won numerous awards.  Another 9 holes are due to open in November 2015.",
    "Gassan Panorama Golf Club is located just 25 minutes north of Chiang Mai in Thailand.  Chiang Mai is situated in northern Thailand and is very different from the coastal resort towns.  It is easy to reach thanks to the Chiang Mai International Airport which is served by Thai Airways and Singapore Airlines among others.  If you are travelling from a place which does not fly direct to Chiang Mai you can easily fly to Bangkok and catch a short, connecting flight.  With Gassan Panorama Golf Club waiting for you, it is well worth the trip. Gassan Panorama has been open for play since 2006 but has recently undergone a major redevelopment having been closed for close to a decade.  The course opened again in 2017 and is one of the longest in Thailand, playing to 7,761 yards.",
    "Designed by James. R. Vaughn and established in 1997, Victory Park Golf and Country Club is not your typical Thai golf venue. The facilities are very much geared towards the local golfer rather than the visiting tourist, with a small clubhouse offering basic amenities and restaurant services. Located 17 kilometres from Nong Khai off Friendship Highway the course lies close to the Thai/Laos border, which makes it popular with tourists from Laos given its proximity.",
    "Royal Creek Golf Club and Resort is an 18-hole championship course 20 minutes from Udon Thani's international airport and 15 minutes from downtown. Royal Creek is the first international standard golf resort in Udon Thani, Thailand and raises the bar on golf in Issan.",
    "A major player on the Asian Professional Golf Tour, the superb Singha Park Khon Kaen Golf Club is an absolute must play if you are visiting Thailand. Located in the province of Khon Kaen, some 400 kilometres from the Thai capital of Bangkok, the golf course has been built on what was a waste area for the Singha beer brewery, as the area became unsuitable for purpose, the owners quickly turned the land into truly remarkable golf course.",

  ]
  let GolfCourseImage_1=[
    "SCC-PTT-07",
    "57a5a3c8f3d465c6b158cdb83fcb8c8c46d491a8",
    "20240212_082926",
    "Old+Course+01-01",
    "2023-07-28",
    "2024-06-11",
    "2022-12-24",
    "T7235x4820-31701",
    "2023-11-25 ",
    "IMG_2644",
    "DJI_0093_0",
    "unnamed(2)",
    "DJI_0093_0",
    "7feb20d49ac723810093a72469a9d3118153e9e7_restaurant-28",
    "cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_15",
    "2023-05-04 (1)-Copy",
    "2024-03-02",
    "golf-gallery-25",
    "2024-09-22",
    "2021-04-04",
    "2022-06-12(2)",
    "IMG_20220121_123039",
    "lc5",
    "IMG_6444",
    "unnamed(3)",
    "20210420_120250",
    "20190918_162421",
    "20191112_173118-EFFECTS ",
    "ArtitayaLandscape1",
    "20180511_124609",
    " 2022-10-02",
    "IMG_6456",
    "2017-05-07",
    "2020-12-30(1)",
    "IMG_20200309_150456",
    "RoyalCreekGolfClubandResort-Fairway1(1)",
    "2022-11-19",
  ]
  let GolfCourseImage_2=[
    "SCC-PTT-06",
    "34cb0ff2feb521fcb8eef728536b58aaefd127de",
    "IMG_7050-2",
    "Old+Course+03-01",
    "2023-11-24 (1)",
    "2020-10-02",
    "2022-12-24",
    "T7424x4924-31069_edit_edit (1)",
    "2022-09-09 (1)",
    "palm-hills-golf-club5",
    "2022-06-12",
    "DSC_3655",
    "2022-11-06 ",
    "IMG_3545",
    "cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_422-1",
    "2022-09-18-Copy",
    "2024-02-07",
    "golf-gallery-17",
    "IMG_25610424_180841",
    "cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_9",
    "IMG_20220430_144855",
    "IMG_20220806_164257",
    "lc6",
    "Hobie Cats",
    "DJI_0077(1)",
    "20210420_120142",
    "2018-03-17 ",
    "2FBC88D5-F405-44CD-933D-5467AFDF78B1",
    "IMG_20200523_163752",
    "DJI_0010A",
    "15713007 70534",
    "Hotel ",
    "2023-10-12 ",
    "2020-06-05 ",
    "2023-01-26 ",
    "Royal Creeek Golf Club and Resort 05",
    "2017-02-14 ",

  ]
  let GolfCourseImage_3=[
    " SCC-PTT-04 ",
    "08ffcbcbc5604a0dea7c02db22116f34bd43059a",
    "2022-12-18 (1)",
    "Old+Course+05-01",
    " 2024-05-28",
    "9",
    " 2023-01-29",
    "20170209_140836",
    " 2024-02-23 ",
    "palm-hills-golf-club3",
    "DSC_2363-retouched",
    " 2023-15-04 ",
    " 2023-11-23 ",
    " 20220503_111454",
    "cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_405",
    " thai+cc+Aramco-11",
    " 2021-05-16 ",
    " golf-gallery-12",
    " 2023-09-04 ",
    " 2022-06-05 (1)",
    " 2022-12-15 ",
    " 2022-09-16",
    "lc1",
    " 20181104_131456_HDR",
    "IMG_8512",
    "20210420_120242",
    " 2020-08-09 ",
    "20220821_164507",
    "2023-02-27 (1)",
    " IMG_5061",
    " 20200104_082335 ",
    " 2023-12-25",
    " 2023-04-22",
    " 2022-06-19 ",
    " 2024-01-14 ",
    "Royal Creek Golf Club and Resort - Green 1",
    "20220530_132655",

  ]
  let GolfCourseImage_4=[
    "SCC-PTT-03",
    " 932278522f511dee171bb683d9c36639594279d8",
    " 2022-08-06 ",
    "Old+Course+06-01 ",
    "The Golf Lodge-40",
    " 2022-08-13",
    " 2021-05-21",
    "DSC_0239",
    "IMG_20220731_143359",
    " 16086340fb2e446b98041db69ae6ec9f93e4f9fa ",
    "west-course",
    " IMG_20181227_122442",
    " IMG_8452",
    "6aa7325f19ad7a1ae98dce8c3fb6059e15c15718_services-11",
    " cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_273",
    "thai+cc+Aramco-07",
    " 2021-06-08 ",
    " experience-golf-gallery3-1",
    "9 (1)",
    "IMG_3092",
    "IMG_20221204_073508",
    " 2022-08-02 ",
    "lc2",
    " 2024-02-27 ",
    "Restaurant",
    " 2019-10-15 ",
    " 2023-09-24 (1)",
    "20220821_165110",
    " 2024-07-09 ",
    "DSC_4121",
    " 2023-02-19",
    " IMG_1826",
    " 2022-10-24 ",
    " 2019-09-18 ",
    "20230602_111929",
    "592260981",
    " 2021-12-27 ",

  ]
  let GolfCourseImage_5=[
    "SCC-PTT-02",
    "a46f4177a7f12b61a15459b9855c48d0ab0cc81a",
    " 2024-03-04",
    "Old+Course+03-01",
    " 2023-07-26",
    " unnamed (1) ",
    " 2023-06-09",
    " 2021-07-26",
    "Banyan-Golf-Club-031",
    "20240203_154635",
    "north-course ",
    " 2023-12-23 ",
    " IMG_20230221_065307",
    "20220822_112622",
    " cf28cdeaba0e61f4215dc9478fddbd598_4811963753195469265_221101_209",
    "thai+cc+Aramco-03",
    " 2023-02-27 ",
    " Kirimaya_Golf-Course_Drone_4",
    " 2024-08-29 ",
    " 2023-01-03 ",
    " 20231031_091323",
    " 2022-09-03 ",
    "Rectangle-91-1",
    " IMG_20181124_092429",
    "20221004_121238",
    " 2021-07-23",
    " 2023-09-24 ",
    "20240425_125142",
    "20230715_071348",
    "1690274589859",
    " 2020-07-17",
    " 2023-04-05",
    "2022-10-24 (1)",
    " 2023-11-28 ",
    "20230723_153901",
    "592260968",
    " 2021-04-10 ",

  ]
  let GolfCourseAddress = [
    "50 6, Pong, Bang Lamung District, Chon Buri 20150",
    "50/10 Pong, Bang Lamung District, Chon Buri 20150",
    "50, 16, Pong, Bang Lamung District, Chon Buri 20150",
    "50 Moo 9 Pong Sub-District Bang Lamung District Chonburi 20150",
    "106 8, Si Racha District, Chon Buri 20230",
    "108/18 Moo 6, Na Jom tien, Sattahip District, Chon Buri 20250",
    "Bo Win, Si Racha District, Chon Buri 20230",
    "208-208/1 Moo 2, Sampraya, Cha-Am, Petchburi 76120 Thailand",
    "101 Moo 9, Tambol Thap Tai, Hua Hin, Prachuabkirikhan 77110, Thailand",
    "Cha-am, Cha-am District, Phetchaburi 76120",
    "565 Moo7 Nong Hieng Road Hin LekFai Hua Hin District, Prachaubkirikhan 77110",
    "15 3, Sisa Thong, Nakhon Chai Si District, Nakhon Pathom 73120",
    "99 Moo 9 , Bangkhan-Sathaneevithayu Road , Klong 5 , Klong Luang , Pathumthani 12120 , Thailand.",
    "333 Moo 2 T.Dhammasala A.Muang, Nakhon Pathom 73000",
    "101, 1, Rangsit, Thanyaburi District, Pathum Thani 12110",
    "88 Bang Na-Trat Frontage Rd, Phimpha, Bang Pakong District, Chachoengsao 24180",
    "92 Bang Chalong, Bang Phli District, Samut Prakan 10540",
    "Thanarat Rd., Moo-Si, Pakchong, Nakhon Ratchasima",
    "151, Mu Si, Pak Chong District, Nakhon Ratchasima 30450",
    "333/2 Moo. 12 Khanongphra, Pakchong,Nakhonrachasrima 30130, Thailand",
    "195 Moo 3 Tumbol Mittraphab, Muaklek District, Saraburi, Thailand 18180",
    "165 Thep Krasattri Rd, Mai Khao, Thalang District, Phuket 83110",
    "165 Thep Krasattri Rd, Mai Khao, Thalang District, Phuket 83110",
    "Thailand Kathu, Kathu District, Phuket 83120",
    "119 Moo 4 Vichitsongkram Rd.,Kathu District, Phuket 83120, Thailand",
    "12/15 Moo 4 Tambol MaeNam, Ampher Koh Samui, SuratThani 84330",
    "Ratchaprapha Dam Golf Course,  XR64+MJ, 53 Village No. 3, Ratchaprapha Dam, Khao Phang, Ban Ta Khun District, Surat Thani 84230",
    "Mission Hills Golf Club Kanchanaburi Nong Tak Ya, Tha Muang District, Kanchanaburi 71110",
    "Artitaya Golf & Resort 71190 Kanchanaburi, Mueang Kanchanaburi District, Wang Dong",
    "Blue Sapphire Golf and Resort, 85 Moo 13, Tambon Chongdan Kanchanaburi",
    "Evergreen Hills Golf Club and Resort, 152, Rang Sali, Tha Muang District, Kanchanaburi",
    "112 Moo 7 Ban Sriboonruang Pahpai Sansai, Chiang Mai 50210 Thailand",
    "Chiangmai Highlands Golf & Spa Resort 167 Moo 2 Onuar, Mae On, Chiang Mai 50130",
    "99 Moo17 Makua jae, Muang, Lamphun, 51000 Thailand",
    "191 Khai Bok Wan, Mueang Nong Khai District, Nong Khai 43100",
    "99 9, Sang Paen, Phen District, Udon Thani 41150",
    "555 Moo 19, 208 Road (Khon Kaen-Mahasarakham Rd Tambon Taphra, Amphur Mueang Khon Kaen District, Khon Kaen 40260",

  ]
  let GolfCoursePrice =[
    5160,
    5160,
    5160,
    5860,
    4280,
    4900,
    2550,
    2700,
    3450,
    2250,
    3650,
    2400,
    5000,
    5300,
    4500,
    4400,
    2650,
    2000,
    3100,
    2250,
    2850,
    4400,
    2700,
    3600,
    4000,
    4550,
    2500,
    1000,
    1300,
    1300,
    1200,
    2450,
    1900,
    1300,
    1400,
    2500,
    1700,

  ]
  let GolfLocation = [
    "Pattaya",
    "Pattaya",
    "Pattaya",
    "Pattaya",
    "Pattaya",
    "Pattaya",
    "Pattaya",
    "Hun Hin",
    "Hun Hin",
    "Hun Hin",
    "Hun Hin",
    "Bangkok",
    "Bangkok",
    "Bangkok",
    "Bangkok",
    "Bangkok",
    "Bangkok",
    "Khao Yai",
    "Khao Yai",
    "Khao Yai",
    "Khao Yai",
    "Phuket",
    "Phuket",
    "Phuket",
    "Phuket",
    "Khao Samui",
    "Khao Samui",
    "Kanchanaburi",
    "Kanchanaburi",
    "Kanchanaburi",
    "Kanchanaburi",
    "Chiang Mai",
    "Chiang Mai",
    "Chiang Mai",
    "Issan",
    "Issan",
    "Issan",
  ]
  let MIMEType = [
    ".png ",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",
    ".jpg",

  ]

  for(let i = 0; i < GolfCourseTitle.length; i++){
    
    let newGolfCourse = new golfCourseModel({
        title: GolfCourseTitle[i],
        slug: GolfCourseTitle[i].toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        content: GolfCourseContent[i],
        nameEn: GolfCourseTitle[i],
        image_id: `GOLF/${GolfCourseImage_5[i].trim()}${MIMEType[i]}`,
        banner_image_id: `GOLF/${GolfCourseImage_1[i].trim()}${MIMEType[i]}`,
        location: GolfLocation[i],
        address: GolfCourseAddress[i],

        is_featured: true,
        gallery: [],


        price: GolfCoursePrice[i],
        tee_time: "05:30~11:30" ,
        sale_price: 0,
        status: "published",

        min_day_before_booking: 10,
        isPromotion: false,

        voucherAmount: 20000,
    });
    newGolfCourse.gallery.push( `GOLF/${GolfCourseImage_1[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `GOLF/${GolfCourseImage_2[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `GOLF/${GolfCourseImage_3[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `GOLF/${GolfCourseImage_4[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `GOLF/${GolfCourseImage_5[i].trim()}${MIMEType[i]}`);
    console.log(newGolfCourse);
    await newGolfCourse.save();
  }
  console.log("GolfCourse Created Complete");
}
async function RegisterPackage(){
  let GolfCourseTitle = [
    "[STAY&JOY Product] Siam Country Club Plantation + Mytt Hotel Pattaya",
  ]
  let GolfCourseContent = [
    "The Siam Country Club Plantation Course is without a doubt one of the best courses in Thailand which is why it has often been chosen to host the annual LGPA Honda classic. The course was designed by the renowned team of Lee Schmidt and Brian Curley who have been responsible for several iconic golf course designs in Thailand. / Boasting sweeping ocean views, our 34-story hotel is adjacent to Central Pattaya – southeast Asia’s largest beachfront shopping center. We’re also just over a kilometer from Pattaya Walking Street. Our outdoor infinity pool boasts panoramic views from the 16th floor, and we have a spa, three restaurants, and a rooftop bar to enjoy.",
  ]
  let GolfCourseImage_1=[
    "Hilton-Pattaya-Hotel-Exterior-2 ",
    "A6",
    "A6",
    "A6",
    " 2021-12-14",
    " 2021-12-14",
    " 2021-12-18",
    " 2021-12-18",
    "20221115_123159",
    "20221115_123159",
    "20221115_123159",
    "20221115_123159",
    " 2023-12-07 ",
    " 2023-12-07 ",
    " 2023-12-07 ",
    " 2023-12-07 ",
    " 2022-06-09 ",
    " 2022-06-09 ",
    " 2022-06-09 ",
    " 2022-06-09 ",
    "unnamed (1)",
    "unnamed (1)",
    "unnamed (1)",
    "unnamed (1)",
    "100_0011",
    "100_0011",
    "100_0011",
    "100_0011",
    " 2020-06-02",
    " 2020-06-02",
    " 2020-06-02",
    " 2020-06-02",
    "Pineapple-Valley-Hua-Hin-Clubhouse",
    "Pineapple-Valley-Hua-Hin-Clubhouse",
    "Pineapple-Valley-Hua-Hin-Clubhouse",
    "Pineapple-Valley-Hua-Hin-Clubhouse",
    "IMG_2644 (1)",
    "IMG_2644 (1)",
    "IMG_2644 (1)",
    "IMG_2644 (1)",
    " 2023-06-19",
    " 2023-06-19",
    " 2023-06-19",
    " 2023-06-19",
    "DSC_3655",
    "DSC_3655",
    "DSC_3655",
    "DSC_3655",
    " 2024-06-18",
    " 2024-06-18",
    " 2024-06-18",
    " 2024-06-18",
    "licensed-image",
    "licensed-image",
    "licensed-image",
    "licensed-image",
    "2024-09-08 (1) ",
    "2024-09-08 (1) ",
    "2024-09-08 (1) ",
    "2024-09-08 (1) ",
    "IMG_7065",
    "IMG_7065",
    "IMG_7065",
    "IMG_7065",
    "PXL_20220814_010521925",
    "PXL_20220814_010521925",
    "PXL_20220814_010521925",
    "PXL_20220814_010521925",
    "thumb_Kirimaya - Fairway",
    "thumb_Kirimaya - Fairway",
    "thumb_Kirimaya - Fairway",
    "thumb_Kirimaya - Fairway",
    " 2024-09-09",
    " 2024-09-09",
    " 2024-09-09",
    " 2024-09-09",
    " 2023-01-03",
    " 2023-01-03",
    " 2023-01-03",
    " 2023-01-03",
    "IMG_20220430_144855",
    "IMG_20220430_144855",
    "IMG_20220430_144855",
    "IMG_20220430_144855",
    " 2020-05-16",
    " 2020-05-16",
    " 2020-05-16",
    " 2020-05-16",
    "Rectangle-91-1",
    "Rectangle-91-1",
    "Rectangle-91-1",
    "Rectangle-91-1",
    "unnamed (11)",
    "unnamed (11)",
    "unnamed (11)",
    "unnamed (11)",
    "unnamed (12)",
    "unnamed (12)",
    "unnamed (12)",
    "unnamed (12)",
    "20210420_120250",
    "20190918_162421",
    "20191112_173118-EFFECTS",
    "Artitaya Landscape1",
    "IMG_6456",
    "IMG_6456",
    "IMG_6456",
    "IMG_6456",
    " 2017-05-07 ",
    " 2017-05-07 ",
    " 2017-05-07 ",
    " 2017-05-07 ",
    "2020-12-30 (1)",
    "2020-12-30 (1)",
    "2020-12-30 (1)",
    "2020-12-30 (1)",
    "IMG_20200309_150456",
    "Royal Creek Golf Club and Resort - Fairway 1 (1)",
    "Royal Creek Golf Club and Resort - Fairway 1 (1)",
    "Royal Creek Golf Club and Resort - Fairway 1 (1)",
    "Royal Creek Golf Club and Resort - Fairway 1 (1)",
    " 2022-11-29 ",

  ]
  let GolfCourseImage_2=[
    " Hilton-Pattaya-Swimming-Pool-2",
    " B9",
    " B9",
    " B9",
    " 2022-12-18",
    " 2022-12-18",
    " 2022-12-18",
    " 2022-12-18",
    " 2022-12-18 (1)",
    " 2022-12-18 (1)",
    " 2022-12-18 (1)",
    " 2022-12-18 (1)",
    " 2023-01-20",
    " 2023-01-20",
    " 2023-01-20",
    " 2023-01-20",
    " 2021-11-27",
    " 2021-11-27",
    " 2021-11-27",
    " 2021-11-27",
    " 2022-12-28",
    " 2022-12-28",
    " 2022-12-28",
    " 2022-12-28",
    "101_0129",
    "101_0129",
    "101_0129",
    "101_0129",
    " 2022-08-24",
    " 2022-08-24",
    " 2022-08-24",
    " 2022-08-24",
    " 2023-11-25",
    " 2023-11-25",
    " 2023-11-25",
    " 2023-11-25",
    "IMG_2644",
    "IMG_2644",
    "IMG_2644",
    "IMG_2644",
    " 2022-12-16",
    " 2022-12-16",
    " 2022-12-16",
    " 2022-12-16",
    "unnamed (3)",
    "unnamed (3)",
    "unnamed (3)",
    "unnamed (3)",
    "20150922_142101",
    "20150922_142101",
    "20150922_142101",
    "20150922_142101",
    " 20220822_112622",
    " 20220822_112622",
    " 20220822_112622",
    " 20220822_112622",
    " 20221130_132110",
    " 20221130_132110",
    " 20221130_132110",
    " 20221130_132110",
    " IMG_4495 ",
    " IMG_4495 ",
    " IMG_4495 ",
    " IMG_4495 ",
    " 2024-02-03",
    " 2024-02-03",
    " 2024-02-03",
    " 2024-02-03",
    "thumb_02_golf02 ",
    "thumb_02_golf02 ",
    "thumb_02_golf02 ",
    "thumb_02_golf02 ",
    " 2024-02-02",
    " 2024-02-02",
    " 2024-02-02",
    " 2024-02-02",
    " 2024-02-06",
    " 2024-02-06",
    " 2024-02-06",
    " 2024-02-06",
    "IMG_20221204_073508",
    "IMG_20221204_073508",
    "IMG_20221204_073508",
    "IMG_20221204_073508",
    " 2023-02-21",
    " 2023-02-21",
    " 2023-02-21",
    " 2023-02-21",
    "Rectangle-93-1",
    "Rectangle-93-1",
    "Rectangle-93-1",
    "Rectangle-93-1",
    " 2024-05-10",
    " 2024-05-10",
    " 2024-05-10",
    " 2024-05-10",
    "IMG_0105",
    "IMG_0105",
    "IMG_0105",
    "IMG_0105",
    "20210420_120142",
    " 2018-03-17",
    "2FBC88D5-F405-44CD-933D-5467AFDF78B1",
    "IMG_20200523_163752",
    "jpg",
    "jpg",
    "jpg",
    "jpg",
    " 2023-10-12 ",
    " 2023-10-12 ",
    " 2023-10-12 ",
    " 2023-10-12 ",
    " 2020-06-05 ",
    " 2020-06-05 ",
    " 2020-06-05 ",
    " 2020-06-05 ",
    " 2023-01-26 ",
    " Royal Creeek Golf Club and Resort 05",
    " Royal Creeek Golf Club and Resort 05",
    " Royal Creeek Golf Club and Resort 05",
    " Royal Creeek Golf Club and Resort 05",
    " 2017-02-14 ",

  ]
  let GolfCourseImage_3=[
    "IMG_1433",
    " _DSC6825",
    " 2024-08-01 (2) ",
    " 2018-07-01",
    "IMG_1433",
    " 2023-02-16",
    " 2024-08-01 (2) ",
    " 2018-07-01 ",
    " IMG_1433",
    " 2023-02-16 ",
    " 2024-08-01",
    " 2018-07-01",
    " IMG_1433",
    " 2023-02-16",
    " 2024-08-01",
    " 2018-07-01",
    " IMG_1433",
    " 2023-02-16",
    " 2024-08-01",
    " 2018-07-01",
    "IMG_1433",
    " 2023-02-16",
    " 2024-08-01",
    " 2018-07-01",
    "IMG_1433",
    " 2023-02-16",
    " 2024-08-01",
    " 2018-07-01",
    "64 You & Mee - Exterior",
    " 2022-08-01",
    " 2024-10-08",
    "unnamed (2) ",
    " 64 You & Mee - Exterior",
    " 2022-08-01",
    " 2024-10-08",
    " unnamed (2)",
    "64 You & Mee - Exterior ",
    " 2022-08-01",
    " 2024-10-08",
    " unnamed (2)",
    " 64 You & Mee - Exterior",
    " 2022-08-01",
    " 2024-10-08",
    " unnamed (2)",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-08-05",
    " 2024-02-11",
    " 2020-11-16",
    " LINE_ALBUM_508 Deluxe รีทัชแล้ว_๒๒๑๑๑๖_1",
    " 2023-04-05",
    " 2022-01-24",
    " 2023-10-29 (1)",
    "475307",
    " 2023-04-05",
    " 2022-01-24",
    " 2023-10-29 (1)",
    "475307",
    " 2023-04-05",
    " 2022-01-24",
    " 2023-10-29 (1)",
    "475307",
    " 2023-04-05",
    " 2022-01-24",
    " 2023-10-29 (1)",
    "475307",
    "20220830_184523",
    "_MG_6389",
    " unnamed (9)",
    " 2022-11-24",
    "20220830_184523",
    "_MG_6389",
    " unnamed (9)",
    " 2022-11-24",
    "20220830_184523",
    "_MG_6389",
    " unnamed (9)",
    " 2022-11-24",
    "20220830_184523",
    "_MG_6389",
    " unnamed (9)",
    " 2022-11-24",
    " 20210420_120242",
    " 2020-08-09",
    "20220821_164507",
    " 2023-02-27 (1)",
    "Rosemary 01",
    " 2021-12-07 ",
    "U Nimman Chiang Mai_Hero Shot 1s ",
    " DSC_0643",
    "Rosemary 01",
    " 2021-12-07 ",
    "U Nimman Chiang Mai_Hero Shot 1s ",
    " DSC_0643",
    "Rosemary 01",
    " 2021-12-07 ",
    "U Nimman Chiang Mai_Hero Shot 1s ",
    " DSC_0643",
    " 2024-01-14 ",
    "Moco-629",
    "Centara Hotel and Convention Centre Udon",
    " 2023-12-17 ",
    " 2022-08-06 ",
    "20220530_132655",

  ]
  let GolfCourseImage_4=[
    " B9",
    " 2024-02-14",
    " 2024-08-01 (1)",
    " IMG_20220124_082500",
    "Hilton-Pattaya-Hotel-Exterior-2",
    " 2024-02-14 ",
    " 2024-08-01 (1)",
    " IMG_20220124_082500",
    "Hilton-Pattaya-Hotel-Exterior-2",
    " 2024-02-14 ",
    " 2024-08-01 (1) ",
    "IMG_20220124_082500",
    " Hilton-Pattaya-Hotel-Exterior-2",
    " 2024-02-14 ",
    "2024-08-01 (1)",
    " IMG_20220124_082500",
    "Hilton-Pattaya-Hotel-Exterior-2",
    " 2024-02-14",
    "2024-08-01 (1)",
    " IMG_20220124_082500",
    "Hilton-Pattaya-Swimming-Pool-2",
    " 2024-02-14",
    " 2024-08-01 (1)",
    "IMG_20220124_082500",
    "Hilton-Pattaya-Hotel-Exterior-2",
    " 2024-02-14",
    "2024-08-01 (1) ",
    " IMG_20220124_082500",
    "20221122_095150",
    " 2021-03-22",
    " 2024-08-18",
    "0.3",
    "20221122_095150",
    " 2021-03-22",
    " 2024-03-18",
    "0.3",
    " 20221122_095150",
    " 2021-03-22",
    " 2024-03-18",
    "0.3",
    "20221122_095150",
    " 2021-03-22",
    " 2024-03-18",
    "0.3",
    "PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    "PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    "PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    " PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    " PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    " PXL_20211226_182553238.MP",
    "unnamed (5) ",
    "NovotelS20_Review_0009",
    " 2024-08-30",
    "20220930_070025 ",
    " 2023-16-26",
    " 2021-05-03",
    "15975246_1274004632679232_6798845326667881202_o",
    "20220930_070025 ",
    " 2023-16-26",
    " 2021-05-03",
    "15975246_1274004632679232_6798845326667881202_o",
    "20220930_070025 ",
    " 2023-16-26",
    " 2021-05-03",
    "15975246_1274004632679232_6798845326667881202_o",
    "20220930_070025 ",
    " 2023-16-26",
    " 2021-05-03",
    "15975246_1274004632679232_6798845326667881202_o",
    "DSC_2722",
    "unnamed (8)",
    " 2024-07-09",
    "2022-11-24 (1)",
    "DSC_2722",
    "unnamed (8)",
    " 2024-07-09",
    "2022-11-24 (1)",
    "DSC_2722",
    "unnamed (8)",
    " 2024-07-09",
    "2022-11-24 (1)",
    "DSC_2722",
    "unnamed (8)",
    " 2024-07-09",
    "2022-11-24 (1)",
    " 2019-10-15",
    "2023-09-24 (1)",
    "20220821_165110",
    " 2024-07-09 ",
    "Deluxe Pool Access King bed 01",
    " Exterior 01 ",
    "Swimming Pool 1",
    " 2022-10-19 ",
    "Deluxe Pool Access King bed 01",
    " Exterior 01 ",
    "Swimming Pool 1",
    " 2022-10-19 ",
    "Deluxe Pool Access King bed 01",
    " Exterior 01 ",
    "Swimming Pool 1",
    " 2022-10-19 ",
    "20230602_111929",
    "328137332",
    " 2022-01-28 ",
    " 2022-04-25 ",
    " 2020-02-04 ",
    " 2021-12-27 ",

  ]
  let GolfCourseImage_5=[
    "A6",
    " 2023-02-16",
    " 2024-08-01",
    "unnamed",
    "Hilton-Pattaya-Swimming-Pool-2",
    " _DSC6825",
    " 2024-08-01",
    "unnamed",
    "Hilton-Pattaya-Swimming-Pool-2",
    "_DSC6825",
    "2024-08-01 (2)",
    "unnamed",
    "Hilton-Pattaya-Swimming-Pool-2",
    "_DSC6825",
    " 2024-08-01 (2)",
    "unnamed",
    "Hilton-Pattaya-Swimming-Pool-2",
    "_DSC6825",
    "2024-08-01 (2)",
    "unnamed ",
    "Hilton-Pattaya-Swimming-Pool-2",
    "_DSC6825",
    "2024-08-01 (2)",
    " unnamed ",
    "Hilton-Pattaya-Swimming-Pool-2",
    "_DSC6825",
    "2024-08-01 (2)",
    " unnamed ",
    "04 Hyatt Guestroom - King",
    " 2022-07-09",
    "DSC08242",
    " DSC_1955_V01",
    " 04 Hyatt Guestroom - King ",
    " 2022-07-09",
    "DSC08242",
    "DSC_1955_V01",
    "04 Hyatt Guestroom - King ",
    " 2022-07-09",
    "DSC08242",
    "DSC_1955_V01",
    " 04 Hyatt Guestroom - King ",
    " 2022-07-09",
    "DSC08242",
    "DSC_1955_V01",
    "unnamed (4)",
    " 2021-10-29",
    "unnamed (6) ",
    "IMG20221218202913",
    "unnamed (4)",
    " 2021-10-29",
    "unnamed (6) ",
    "IMG20221218202913",
    "unnamed (4)",
    " 2021-10-29",
    "unnamed (6) ",
    "IMG20221218202913",
    "unnamed (4)",
    " 2021-10-29",
    " 2021-10-29",
    "IMG20221218202913",
    "unnamed (4)",
    " 2021-10-29",
    " 2021-10-29",
    "IMG20221218202913",
    "unnamed (4)",
    " 2021-10-29",
    " 2021-10-29",
    "IMG20221218202913",
    " 2023-03-30",
    "The-Greenery-Resort-Khao-Yai-Mu-Si-Exterior",
    "475302",
    " 2023-11-04",
    " 2023-03-30",
    "The-Greenery-Resort-Khao-Yai-Mu-Si-Exterior",
    "475302",
    " 2023-11-04",
    " 2023-03-30",
    "The-Greenery-Resort-Khao-Yai-Mu-Si-Exterior",
    "475302",
    " 2023-11-04",
    " 2023-03-30",
    "The-Greenery-Resort-Khao-Yai-Mu-Si-Exterior",
    "475302",
    " 2023-11-04",
    " 2023-12-14",
    "1JCAvWYg",
    " 2024-03-21",
    "unnamed (10)",
    " 2023-12-14",
    "1JCAvWYg",
    " 2024-03-21",
    "unnamed (10)",
    " 2023-12-14",
    "1JCAvWYg",
    " 2024-03-21",
    "unnamed (10)",
    " 2023-12-14",
    "1JCAvWYg",
    " 2024-03-21",
    "unnamed (10)",
    " 2021-07-23",
    " 2023-09-24",
    "20240425_125142",
    "2024-07-09 / 20230715_071348",
    " 2023-01-14 ",
    "Deluxe outdoor spa (1)",
    "Deluxe Blue Twin 1",
    "IMG_7585",
    " 2023-01-14 ",
    "Deluxe outdoor spa (1)",
    "Deluxe Blue Twin 1",
    "IMG_7585",
    " 2023-01-14 ",
    "Deluxe outdoor spa (1)",
    "Deluxe Blue Twin 1",
    "IMG_7585",
    "20230723_153901",
    " 2023-01-29 ",
    "cud-swimming-pool-01",
    " 2022-11-13 ",
    " 2023-03-08 ",
    " 2021-04-10 ",

  ]
  let GolfCourseAddress = [
    "50 6, Pong, Bang Lamung District, Chon Buri 20150 / 333/101 Beach Road, Moo 9 Nong Prue Banglamung, Pattaya, Chonburi, Bang Lamung, Chon Buri Province, 20260, Thailand",
    
  ]
  let GolfCoursePrice =[
    6300,
    
  ]
  let GolfLocation = [
    "Pattaya",
  ]
  let MIMEType = [
    ".jpg",
  ]
  for(let i = 0; i < GolfCourseTitle.length; i++){
    
    let newGolfCourse = new packageModel({
        title: GolfCourseTitle[i],
        slug: GolfCourseTitle[i].toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        content: GolfCourseContent[i],
        nameEn: GolfCourseTitle[i],
        image_id: `Package/${GolfCourseImage_5[i].trim()}${MIMEType[i]}`,
        banner_image_id: `Package/${GolfCourseImage_1[i].trim()}${MIMEType[i]}`,
        location: GolfLocation[i],
        address: GolfCourseAddress[i],

        is_featured: true,
        gallery: [],


        price: GolfCoursePrice[i],
        tee_time: "05:30~11:30" ,
        sale_price: 0,
        status: "published",

        min_day_before_booking: 10,
        isPromotion: false,

        voucherAmount: 20000,
    });
    newGolfCourse.gallery.push( `Package/${GolfCourseImage_1[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `Package/${GolfCourseImage_2[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `Package/${GolfCourseImage_3[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `Package/${GolfCourseImage_4[i].trim()}${MIMEType[i]}`);
    newGolfCourse.gallery.push( `Package/${GolfCourseImage_5[i].trim()}${MIMEType[i]}`);
    console.log(newGolfCourse);
    await newGolfCourse.save();
  }
  console.log("GolfCourse Created Complete");
}

//RegisterPackage();
async function updateUserSchema(){
  let AllUsers = await userModel.find();
  for(let i = 0; i < AllUsers.length; i++) {
    
    AllUsers[i].companyAddress = "";
    await AllUsers[i].save();
  }
}

async function UseVouchers(){
  console.log('submit Voucher function called');
  try {
    let userId = "cocotrip6524@gmail.com";
    let hotelName = "Wyndham Garden Naithon Phuket";
    let voucherCode = "VCH-5A2KY6HXG";
    let remainingQuantity = 0;
    let roomCount = 0;
    let startDate = "2024-10-02T00:00:00.000+00:00";
    let endDate = "2024-10-23T00:00:00.000+00:00";
    let totalUsage = 21;
    let guestInfo = {
        lastName:"Pyon",
        firstName:"JoChan",
        passportNumber:"M181P6913",
        sex:"M",
        birthday:"1969-03-11",
        remark:"",
    };

    let APISCODE = 'APIS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      // 여기에서 바우처 사용 로직을 구현합니다.
      // 예: 바우처 수량 업데이트, 사용 내역 저장 등
      // 임시 로직: 바우처 수량 감소
      let FindVoucher = await voucherModel.findOne({ voucherCode: voucherCode });
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
              
              let newBooking = new bookingModel({
                  APISCODE: APISCODE,
                  userId: userId,
                  Hotel: hotelName,
                  Amount: totalUsage,
                  useDate: startDate,
                  
                  CustomerInfo: []
              });
              console.log("newBooking: ",newBooking);
              newBooking.CustomerInfo.push(guestInfo);
              await newBooking.save();
          } 
        }

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
        - Name: ${guestInfo.lastName} ${guestInfo.firstName}
        - Passport Number: ${guestInfo.passportNumber}
        - Sex: ${guestInfo.sex}
        - Date of birth: ${guestInfo.birthday}
        - Remark: ${guestInfo.remark}
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
      console.log("Updated At: ",new Date());

      
  } catch (error) {
      console.error('Error in submitVoucher:', error);
      res.status(500).json({ success: false, message: "Error submitting voucher", error: error.message });
  }
}

//UseVouchers();



// 1시간마다 backupDatabase 함수를 호출합니다.
//setInterval(backupDatabase, 60 * 60 * 1000);
setInterval(changePromotion, 60 * 60 * 12000);


module.exports = router;