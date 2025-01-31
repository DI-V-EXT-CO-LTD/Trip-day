// routes/hotelDetails.js
const express = require('express');
const router = express.Router();
const Hotel = require('../models/hotel');
const Room = require('../models/room');
const RefundPolicy = require('../models/refundPolicy');

// Hotel Details page
router.get('/:hotelId', async (req, res) => {
  try {
    const hotelId = req.params.hotelId;
    const hotel = await Hotel.findById(hotelId).populate('rooms');
    const refundPolicy = await RefundPolicy.findOne();

    if (!hotel) {
      return res.status(404).send('Hotel not found');
    }
    const hotelImages = [
      { url: hotel.image_id, type: 'image' },
      ...(hotel.gallery || []).map(img => ({ url: img, type: 'image' }))
  ];

    res.render('hotelDetails', { 
      hotel, 
      refundPolicy,
      pageTitle: hotel.title || 'Hotel Details',
      hotelAddress: hotel.address,
      hotelDescription: hotel.content,

      hotelImages: [
        { url: hotel.image_id, type: 'image' },
        ...hotel.gallery.map(img => ({ url: img, type: 'image' }))
      ],
      hotelRooms: hotel.rooms
    });
  } catch (error) {
    console.error('Error in hotelDetails route:', error);
    res.status(500).send('Server error');
  }
});

// Purchase page
router.get('/:hotelId/purchases/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const hotel = await Hotel.findOne({ id: hotelId });
    const room = await Room.findById(roomId);
    const refundPolicy = await RefundPolicy.findOne();

    if (!hotel || !room) {
      return res.status(404).send('Hotel or room not found');
    }

    res.render('purchaseVoucher', { hotel, room, refundPolicy });
  } catch (error) {
    console.error('Error in purchase route:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
