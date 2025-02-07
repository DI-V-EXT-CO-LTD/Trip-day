const amadeus = require("../config/amadeus");

const flightOffers = async (props) => {
  const {
    trip_type,
    non_stop,
    from,
    to,
    flight_depart,
    flight_return,
    adults,
    child,
    infants,
    classType,
    currencyCode = "THB",
    max = 3,
  } = props;

  const isNonStop = non_stop !== undefined ? true : false;

  // เช็คประเภท trip_type
  if (trip_type === "oneway") {
    // สำหรับ One Way
    return await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: flight_depart,
      adults: adults,
      children: child,
      infants: infants,
      travelClass: classType,
      currencyCode: currencyCode,
      max: max,
      nonStop: isNonStop,
    });
  } else if (trip_type === "roundtrip") {
    // สำหรับ Round Trip
    return await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: flight_depart,
      returnDate: flight_return, // ต้องมีการตั้ง returnDate สำหรับ roundtrip
      adults: adults,
      children: child,
      infants: infants,
      travelClass: classType,
      currencyCode: currencyCode,
      max: max,
      nonStop: isNonStop,
    });
  } else if (trip_type === "multicity") {
    // สำหรับ Multi-City (มีหลายเมือง)
    // ตัวอย่างสมมุติว่ามี 3 จุดหมาย
    return await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: flight_depart,
      returnDate: flight_return, // อาจจะต้องปรับแต่งให้รองรับ multi-city
      adults: adults,
      children: child,
      infants: infants,
      travelClass: classType,
      currencyCode: currencyCode,
      max: max,
      nonStop: isNonStop,
    });
  } else {
    throw new Error(
      "Invalid trip_type. Please choose 'oneway', 'roundtrip', or 'multicity'."
    );
  }
};

const flightOffersPrice = async (props) => {
  const {
    flightOffers
  } = props;
try {
  return await amadeus.shopping.flightOffersPrice.post({
    "data": {
        "type": "flight-offers-pricing",
        "flightOffers":flightOffers
    }
});
} catch (error) {
  console.log(error)
}
  

 
};

const iatacodeAirline_to_name = async (airlineCodes) => {
  try {
    return await amadeus.referenceData.airlines.get({
      airlineCodes: airlineCodes,
    });
  } catch (error) {
    console.error("Error iatacodeAirline_to_name:", error);
    return null;
  }
};

const iatacodeAirport_to_name = async (airportCodes) => {
  try {
    const airportPromises = airportCodes?.map(code =>
      amadeus.referenceData.locations.get({
        keyword: code,
        subType: 'AIRPORT'
      })
    );

    const responses = await Promise.all(airportPromises);

    return responses
  } catch (error) {
    console.error("Error iatacodeAirport_to_name:", error);
    return null;
  }
};

module.exports = {
  flightOffers,
  flightOffersPrice,
  iatacodeAirline_to_name,
  iatacodeAirport_to_name,
  
};
