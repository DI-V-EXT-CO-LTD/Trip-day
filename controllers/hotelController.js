const Hotel = require("../models/hotel");
const Golf = require("../models/golf");
const he = require("he");

exports.searchHotels = async (req, res) => {
  console.log('from searchHotels')
  try {
    const {
      s,
      roomValue,
      adultsValue,
      childValue,
      query,
      period,
      minPrice,
      maxPrice,
      refund,
      breakfast,
      beds,
      maxStars,
      exactStars,
      location,
      page = 1,
      limit = 200,
    } = req.query;


    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = parseInt(limit);
    const parseBoolean = (value) => value === "true";
    const parseNumber = (value) =>
      isNaN(value) ? undefined : parseInt(value, 10);

    let searchQuery = s || query || "";

    let filter = {};
    filter.rooms = { $elemMatch: {} };

    if (searchQuery) {
      const searchTerms = searchQuery.trim().split(/\s+/);
      const searchRegexes = searchTerms.map((term) => new RegExp(term, "i"));

      // Initialize $and as an array if not already set
      filter.$and = searchRegexes.map((regex) => ({
        $or: [
          { title: regex },
          { name: regex },
          { description: regex },
          { address: regex },
        ],
      }));
    }

    // // Add location_category to $and
    if (!filter.$and) {
      filter.$and = [];
    }
    filter.$and.push({ city: location });

    // Filter by adults and children
    if (adultsValue) {
      filter.rooms.$elemMatch.adults = { $gte: parseNumber(adultsValue) };
    }
    if (childValue) {
      filter.rooms.$elemMatch.children = { $gte: parseNumber(childValue) };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      filter.rooms.$elemMatch.price = {
        ...(minPrice && { $gte: parseNumber(minPrice) }),
        ...(maxPrice && { $lte: parseNumber(maxPrice) }),
      };
    }

    // Filter by refund, breakfast, and beds
    if (refund) {
      filter.rooms.$elemMatch.is_refundable = parseBoolean(refund);
    }
    if (breakfast) {
      filter.rooms.$elemMatch.is_breakfast_included = parseBoolean(breakfast);
    }
    if (beds) {
      filter.rooms.$elemMatch.beds = { $gte: beds };
    }

    if (!isNaN(maxStars)) {
      const maxStarsInt = parseInt(req.query.maxStars, 10);
      filter.star_rate = { $lte: maxStarsInt };
    }
    if (!isNaN(exactStars)) {
      const exactStarsInt = parseInt(req.query.exactStars, 10);
      filter.star_rate = exactStarsInt;
    }

    const totalHotels = await Hotel.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(totalHotels / pageSize));

    // Ensure the requested page number is not greater than the total number of pages
    const validPageNumber = Math.min(pageNumber, totalPages);

    const hotels = await Hotel.find(filter)
      .populate("rooms")
      .skip((validPageNumber - 1) * pageSize)
      .limit(pageSize);

    // 정렬(선택 사항): relevance 기준으로 정렬
    hotels.sort((a, b) => {
      const aRelevance = calculateRelevance(a, searchQuery);
      const bRelevance = calculateRelevance(b, searchQuery);
      return bRelevance - aRelevance;
    });

    // HTML 엔티티 디코딩 및 HTML 태그 제거
    const processedHotels = hotels.map((hotel) => {
      if (hotel.content) {
        hotel.content = he.decode(hotel.content).replace(/<[^>]*>/g, "");
      }
      return hotel;
    });


    // 모든 데이터를 출력
    res.render("partials/searchResults", {
      hotels: processedHotels,
      query: searchQuery,
      period:period|| new Date().toISOString().split('T')[0],
      he,
      roomValue:roomValue || 1,
      adultsValue:adultsValue||1,
      childValue:childValue|| 0,
    });
  } catch (error) {
    console.error("Error searching hotels:", error);
    res.status(500).send("Error searching hotels");
  }
};

function calculateRelevance(hotel, query) {
  const searchTerms = query.toLowerCase().split(/\\s+/);
  let relevance = 0;

  searchTerms.forEach((term) => {
    if (hotel.title && hotel.title.toLowerCase().includes(term)) relevance += 3;
    if (hotel.name && hotel.name.toLowerCase().includes(term)) relevance += 3;
    if (hotel.description && hotel.description.toLowerCase().includes(term))
      relevance += 2;
    if (hotel.location && hotel.location.toLowerCase().includes(term))
      relevance += 1;
  });

  return relevance;
}

exports.registerHotel = async (req, res) => {
  try {
    const hotelData = req.body;

    // Validate required fields
    const requiredFields = [
      "title",
      "slug",
      "content",
      "image_id",
      "banner_image_id",
      "location_id",
      "address",
      "map_lat",
      "map_lng",
      "map_zoom",
      "star_rate",
      "price",
      "check_in_time",
      "check_out_time",
      "status",
    ];

    const missingFields = requiredFields.filter((field) => !hotelData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields: missingFields,
      });
    }

    // Create a new hotel instance
    const newHotel = new Hotel(hotelData);

    // Save the hotel to the database
    await newHotel.save();

    res.status(201).json({
      success: true,
      message: "Hotel registered successfully",
      data: newHotel,
    });
  } catch (error) {
    console.error("Error registering hotel:", error);
    res.status(400).json({
      success: false,
      message: "Error registering hotel",
      error: error.message,
    });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const { type } = req.query;
    let hotels = [];
    let message = "";

    if (
      type === "FireSales" ||
      type === "EarlyBird" ||
      type === "Best Sellers"
    ) {
      hotels = await Hotel.find({ promotionType: type })
        .select(
          "id title image_id star_rate facilityTags price slug promotionType content"
        )
        .populate("rooms");
    } else if (type === "Promotions") {
      message = "프로모션 준비중입니다";
    } else {
      // Default case: show all promotional hotels
      hotels = await Hotel.find({
        promotionType: { $in: ["FireSales", "EarlyBird", "BestSellers"] },
      })
        .select(
          "id title image_id star_rate facilityTags price slug promotionType content"
        )
        .populate("rooms");
    }

    res.render("promotions/promotions", {
      user: req.user,
      hotels,
      promotionType: type,
      message,
    });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    res.status(500).send("Error fetching promotions");
  }
};
