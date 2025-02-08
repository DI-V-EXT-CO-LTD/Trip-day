const User = require("../models/user");
const Purchase = require("../models/purchase");
const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

exports.getReceipt = async (req, res) => {
    console.log("getReceipt");
    try {
      const { id } = req.params;
  
      const receipt = await Purchase.findOne({ _id: id ,user:req.user._id});

      // ฟังก์ชันจัดรูปแบบวันที่
      const formatDate = (date) => {
        const d = new Date(date);
        const day = ("0" + d.getDate()).slice(-2);
        const month = ("0" + (d.getMonth() + 1)).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };
  
      const formattedreceipt = receipt.items.map((item) => ({
        ...item,
        period_start: formatDate(item.period_start),
        period_end: formatDate(item.period_end),
      }));
  
      receipt.createdAt =  formatDate(receipt.createdAt)
    
  
      res.render("receipt", { receipts: formattedreceipt,receiptHeader:receipt, user: req.user });
    } catch (error) {
      console.error("error:", error);
      res.status(500).send("error: " + error.message);
    }
  }