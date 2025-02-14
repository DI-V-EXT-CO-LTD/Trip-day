const  Airport  = require('../models/airport');



exports.getAirportCodes = async (req, res) => {
    const airports = await Airport.AutoSearch(req.body.searchString);
    res.status(200).json(airports);
  
  };
  

