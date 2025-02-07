
const {
  flightOffers,
  iatacodeAirline_to_name,
  iatacodeAirport_to_name,
} = require("../service/amadeus");
// {
//   'trip-type': 'round',
//   non_stop: 'on',
//   from: 'GMP',
//   to: 'BKK',
//   flight_depart: '2025-01-22',
//   flight_return: '2025-01-23',
//   adults: '2',
//   child: '0',
//   infants: '0',
//   class: 'ECONOMY'
// }
exports.getOffer = async (req, res) => {
  try {
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
    } = req.query;

    const max = 2;
    const flightOffersParams = {
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
      max,
    };

    // รวบรวม carrierCode ที่ขาดหาย และเรียก iatacode_to_name
    const flightOffersResults = await flightOffers(flightOffersParams);

    const allCarrierCodes = new Set(); // ใช้ Set เพื่อเก็บ carrierCode ไม่ซ้ำกัน
    flightOffersResults.data.forEach((flight) => {
      flight.itineraries[0].segments.forEach((segment) => {
        allCarrierCodes.add(segment.carrierCode);
      });
    });

    const allAirportCodes = new Set();
    flightOffersResults.data.forEach((flight) => {
      flight.itineraries[0].segments.forEach((segment) => {
        allAirportCodes.add(segment.departure.iataCode);
        allAirportCodes.add(segment.arrival.iataCode);
      });
    });

    // ส่งไปขอชื่อสายการบิน
    const businessName = await iatacodeAirline_to_name(
      [...allCarrierCodes].join(",")
    );

    const airportName = await iatacodeAirport_to_name([...allAirportCodes]);

    // สร้าง Map key:iata value:ชื่อ airline
    const airlineMap = {};
    if (businessName.data && businessName.data.length > 0) {
      businessName.data.forEach((airline) => {
        airlineMap[airline.iataCode] = airline.businessName;
      });
    }
    // สร้าง Map key:iata value:ชื่อ airport
    const airportMap = {};
    airportName.forEach((aiprotArray) => {
      if (aiprotArray.data && aiprotArray.data.length > 0) {
        aiprotArray.data.forEach((airport) => {
          console.log("form loop aiprotArray", JSON.stringify(airport,null,2));
          airportMap[airport.iataCode] = airport.name;
        });
      }
    });

        // สร้าง Map key:iata value:country
        const cityMap = {};
        airportName.forEach((data) => {
          if (data.data && data.data.length > 0) {
            data.data.forEach((airport) => {
              cityMap[airport.iataCode] = airport.address.cityName;
            });
          }
        });


    for (const flight of flightOffersResults.data) {
      // ชื่อ airport ที่ให้บริการ
      const airlineName =
        airlineMap[flight.validatingAirlineCodes[0]] || "Unknown Airline";
      flight.airlineName = airlineName;

      // setTime Duration
      const duration = flight.itineraries[0].duration;
      flight.itineraries[0].formattedDuration = formattedTime(duration);

      flight.itineraries[0].waitAtCounty = formattedTime(duration);

      // หาเวลาที่ลงจอดที่สนามบินแรก
      const firtSemgentArrival = flight.itineraries[0].segments[0].arrival;
      const arrivalTime = firtSemgentArrival.at;

      // หาเวลาที่ออกจากสนามบินแรก
      const SecondSemgentDeparture =
        flight.itineraries[0].segments[1].departure;
      const departureTime = SecondSemgentDeparture.at;

      // หาเวลาที่อยู่ทีสนามบินแรก
      const waitingTime = calculateDifftime(arrivalTime, departureTime);

      // ใส่เวลาอยู่ที่สนามบินแรก
      flight.itineraries[0].waitingTime = waitingTime;

      const fligthSegments = flight.itineraries[0].segments;
      const isCodershare = fligthSegments.every(
        (segment) =>
          segment.carrierCode === flight.itineraries[0].segments[0].carrierCode
      );

      const fligthSegmentsAddName = fligthSegments.map((segment) => ({
        ...segment, 
        departure:{...segment.departure,airportName:airportMap[segment.departure.iataCode],cityName:cityMap[segment.departure.iataCode]},
        arrival:{...segment.arrival,airportName:airportMap[segment.arrival.iataCode],cityName:cityMap[segment.arrival.iataCode]},
        carrierName: airlineMap[segment.carrierCode] || "Unknown Airline", // เพิ่ม carrierName
      }));

      flight.itineraries[0].isCodershare = !isCodershare;
      flight.itineraries[0].segments = fligthSegmentsAddName;
    }

    console.log("--------------------");
    console.log(JSON.stringify(flightOffersResults.data, null, 2));
    res.render("flight/flightList", { flightData: flightOffersResults.data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
};

// const response = await amadeus.shopping.flightOffers.pricing.post(
//   {
//     data: {
//       type: "flight-offers-pricing",
//       flightOffers: [flightOffersResponse.data[0]],
//     },
//   },
//   { include: "credit-card-fees,detailed-fare-rules" }
// );

function calculateDifftime(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const diffMs = Math.abs(end - start); // ความต่างเวลาในมิลลิวินาที
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHours}h ${diffMinutes}m`;
}

function formattedTime(Time) {
  const hoursMatch = Time.match(/(\d+)H/);
  const minutesMatch = Time.match(/(\d+)M/);

  const hours = hoursMatch ? hoursMatch[1] : 0;
  const minutes = minutesMatch ? minutesMatch[1] : 0;

  return `${hours}h ${minutes}m`;
}
