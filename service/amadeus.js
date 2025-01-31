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
    max = 3
  } = props;

  const isNonStop = (non_stop !== undefined) ? true : false;


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
      nonStop: isNonStop
    });
  } else if (trip_type === "roundtrip") {
    // สำหรับ Round Trip
    return await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: flight_depart,
      returnDate: flight_return,  // ต้องมีการตั้ง returnDate สำหรับ roundtrip
      adults: adults,
      children: child,
      infants: infants,
      travelClass: classType ,
      currencyCode: currencyCode,
      max: max,
      nonStop: isNonStop
    });
  } else if (trip_type === "multicity") {
    // สำหรับ Multi-City (มีหลายเมือง)
    // ตัวอย่างสมมุติว่ามี 3 จุดหมาย
    return await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: flight_depart,
      returnDate: flight_return,  // อาจจะต้องปรับแต่งให้รองรับ multi-city
      adults: adults,
      children: child,
      infants: infants,
      travelClass: classType ,
      currencyCode: currencyCode,
      max: max,
      nonStop: isNonStop
    });
  } else {
    throw new Error("Invalid trip_type. Please choose 'oneway', 'roundtrip', or 'multicity'.");
  }
};


const iatacode_to_name = async (airlineCodes) =>
  await amadeus.referenceData.airlines.get({
    airlineCodes: airlineCodes,
  });

module.exports = { flightOffers, iatacode_to_name };
