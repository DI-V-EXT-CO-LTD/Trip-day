const Golf = require('../models/golf');
const he = require('he');

exports.getGolfDetails = async (req, res) => {
  try {
    const golfId = req.params.id;
    const golf = await Golf.findById(golfId);

    if (!golf) {
      return res.status(404).send('Golf course not found');
    }

    res.render('golfDetails', { golf });
  } catch (error) {
    console.error('Error fetching golf details:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.listGolfCourses = async (req, res) => {
  try {
    const golfCourses = await Golf.find({});
    res.render('golfList', { golfCourses,query:"" });
  } catch (error) {
    console.error('Error fetching golf courses:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getAddGolfForm = (req, res) => {
  res.render('addGolf', { pageTitle: 'Add New Golf Course' });
};

exports.addGolf = async (req, res) => {
  try {
    const golfData = req.body;
    
    if (req.files) {
      if (req.files.image) {
        golfData.image_id = req.files.image[0].filename;
      }
      if (req.files.banner_image) {
        golfData.banner_image_id = req.files.banner_image[0].filename;
      }
      if (req.files.gallery) {
        golfData.gallery = req.files.gallery.map(file => file.filename);
      }
    }

    const newGolf = new Golf(golfData);
    await newGolf.save();
    res.redirect('/admin/golf-courses');
  } catch (error) {
    console.error('Error adding golf course:', error);
    res.status(500).send('Error adding golf course');
  }
};

exports.searchGolfCourses = async (req, res) => {

  console.log("search Golf Courses")
    try {
        const { s, query = '', page = 1, limit = 9 } = req.query;
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = parseInt(limit);
        
        let searchQuery = s || query || "";
    

        let filter = {};
        if (searchQuery) {
          const searchTerms = searchQuery.trim().split(/\s+/);
          const searchRegexes = searchTerms.map((term) => new RegExp(term, "i"));
          filter.$and = searchRegexes.map((regex) => ({
            $or: [
              { title: regex },

              { location: regex },
            ],
          }));
        }
        

        const totalGolfcourses = await Golf.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalGolfcourses / pageSize));

        // Ensure the requested page number is not greater than the total number of pages
        const validPageNumber = Math.min(pageNumber, totalPages);

        const golfcourses = await Golf.find(filter)
            .skip((validPageNumber - 1) * pageSize)
            .limit(pageSize);

        // Sort hotels in memory based on relevance
        golfcourses.sort((a, b) => {
            const aRelevance = calculateRelevance(a, query);
            const bRelevance = calculateRelevance(b, query);
            return bRelevance - aRelevance;
        });

        // Decode HTML entities and remove HTML tags from content
        const processedGolfs = golfcourses.map(golf => {
            if (golf.content) {
                golf.content = he.decode(golf.content).replace(/<[^>]*>/g, '');
            }
            return golf;
        });

        res.render('partials/golfSearchResults', {
            golfCourses: processedGolfs,
            query: searchQuery ,
            currentPage: validPageNumber,
            totalPages: totalPages,
            he
        });
    } catch (error) {
        console.error('Error searching golf courses:', error);
        res.status(500).send('Error searching golf courses');
    }
};
function calculateRelevance(hotel, query) {
  const searchTerms = query.toLowerCase().split(/\\s+/);
  let relevance = 0;

  searchTerms.forEach(term => {
      if (hotel.title && hotel.title.toLowerCase().includes(term)) relevance += 3;
      if (hotel.name && hotel.name.toLowerCase().includes(term)) relevance += 3;
      if (hotel.description && hotel.description.toLowerCase().includes(term)) relevance += 2;
      if (hotel.location && hotel.location.toLowerCase().includes(term)) relevance += 1;
  });

  return relevance;
}


