
// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const { s3, bucketName } = require('../config/s3');


// const uploadHotelImage = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: bucketName,
//     acl: 'public-read', 
//     metadata: function (req, file, cb) {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: function (req, file, cb) {
  
//       // const folderName = 'images/hotels';  
//       const uniqueFileName = `${Date.now()}-${file.originalname}`;
//       // cb(null, `${folderName}/${uniqueFileName}`);  // ตัวอย่าง: images/hotels/1675698352387-photo.jpg
//       cb(null, `images/${uniqueFileName}`); 
//     },
//     contentType: multerS3.AUTO_CONTENT_TYPE
//   })
// });

// module.exports = { uploadHotelImage };

const multer = require('multer');
const path = require('path');

// storage
const hotelStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ระบุโฟลเดอร์ที่ต้องการบันทึกไฟล์
    cb(null, 'public/uploads'); // ตัวอย่าง: เก็บในโฟลเดอร์ uploads/images
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
    const uniqueFileName = `Hotels/${Date.now()}-${Math.random()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});
const roomStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ระบุโฟลเดอร์ที่ต้องการบันทึกไฟล์
    cb(null, 'public/uploads'); // ตัวอย่าง: เก็บในโฟลเดอร์ uploads/images
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
    const uniqueFileName = `${Date.now()}-${Math.random()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

const golfStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ระบุโฟลเดอร์ที่ต้องการบันทึกไฟล์
    cb(null, 'public/uploads'); // ตัวอย่าง: เก็บในโฟลเดอร์ uploads/images
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
    const uniqueFileName = `GOLF/${Date.now()}-${Math.random()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});

const packageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // ระบุโฟลเดอร์ที่ต้องการบันทึกไฟล์
    cb(null, 'public/uploads'); // ตัวอย่าง: เก็บในโฟลเดอร์ uploads/images
  },
  filename: function (req, file, cb) {
    // ตั้งชื่อไฟล์ให้ไม่ซ้ำ
    const uniqueFileName = `Package/${Date.now()}-${Math.random()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
});


//  middleware 
const uploadHotelImage = multer({
  storage: hotelStorage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // กำหนดขนาดไฟล์สูงสุด (5 MB)
  }
});

const uploadRoomImage = multer({
  storage: roomStorage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // กำหนดขนาดไฟล์สูงสุด (5 MB)
  }
});

const uploadGolfImage = multer({
  storage: golfStorage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // กำหนดขนาดไฟล์สูงสุด (5 MB)
  }
});
const uploadPackageImage = multer({
  storage: packageStorage,
  fileFilter: function (req, file, cb) {
    // ตรวจสอบประเภทไฟล์
    const fileTypes = /jpeg|jpg|png|gif/;
    const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = fileTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // กำหนดขนาดไฟล์สูงสุด (5 MB)
  }
});

module.exports = { uploadHotelImage,uploadRoomImage,uploadGolfImage,uploadPackageImage };
