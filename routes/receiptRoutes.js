// routes/invoice.js
const express = require("express");
const router = express.Router();
const receiptController = require('../controllers/receiptController');
// Route handler ใน server (Express)
router.get("/doc/:id",receiptController.getReceipt );

// Route handler ใน server (Express)
// router.get("/docAdmin/:id", async (req, res) => {
//   console.log("invoiceRouter");
//   try {
//     const { id } = req.params;

//     const invoice = await Invoice.findOne({ _id: id });
//     const user = await User.findOne({_id:invoice.userId})
  
//     // ฟังก์ชันจัดรูปแบบวันที่
//     const formatDate = (date) => {
//       const d = new Date(date);
//       const day = ("0" + d.getDate()).slice(-2);
//       const month = ("0" + (d.getMonth() + 1)).slice(-2);
//       const year = d.getFullYear();
//       return `${day}/${month}/${year}`;
//     };

//     const formattedinvoice = invoice.items.map((item) => ({
//       ...item,
//       period_start: formatDate(item.period_start),
//       period_end: formatDate(item.period_end),
//     }));

//     invoice.createAt =  formatDate(invoice.createAt)
  
//     console.log(formattedinvoice)

//     res.render("invoice", { invoices: formattedinvoice,invoiceHeader:invoice, user });
//   } catch (error) {
//     console.error("error:", error);
//     res.status(500).send("error: " + error.message);
//   }
// });


module.exports = router;
