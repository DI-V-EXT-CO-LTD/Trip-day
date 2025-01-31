const Hotel = require("../models/hotel");
const Golf = require("../models/golf");
const Package = require("../models/package");

exports.search = async (req, res) => {
  try {
    const query = req.query.s || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // 검색어 전처리
    const searchTerm = query.trim();

    // 검색 조건
    const searchCondition = {
      $or: [
        { title: new RegExp(searchTerm, "i") },
        { address: new RegExp(searchTerm, "i") },
      ],
    };
    // 검색 실행
    const [
      hotelResults,
      golfResults,
      packageResults,
      totalHotels,
      totalGolf,
      totalPackages,
    ] = await Promise.all([
      Hotel.find(searchCondition).skip(skip).limit(limit),
      Golf.find(searchCondition).skip(skip).limit(limit),
      Package.find(searchCondition).skip(skip).limit(limit),
      Hotel.countDocuments(searchCondition),
      Golf.countDocuments(searchCondition),
      Package.countDocuments(searchCondition),
    ]);

    const totalResults = totalHotels + totalGolf + totalPackages;
    const totalPages = Math.ceil(totalResults / limit);

    res.render("pages/search", {
      query,
      hotels: hotelResults,
      golfCourses: golfResults,
      packages: packageResults,
      currentPage: page,
      totalPages,
      user: req.user,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).render("error", {
      message: "An error occurred while searching",
      error: error,
    });
  }
};
