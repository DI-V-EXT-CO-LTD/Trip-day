const Package = require('../models/package');
const he = require('he');



exports.getPackageDetails = async (req, res) => {
  try {
    const packageId = req.params.id;
    const package = await Package.findById(packageId);

    if (!package) {
      return res.status(404).send('package not found');
    }

    const total_price = package.room_price + (package.golf_price*2);

    res.render('packageDetails', { package,total_price} );
  } catch (error) {
    console.error('Error fetching package details:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.listPackageCourses = async (req, res) => {
  console.log("log form listPackageCourses")
  try {
    const packageList = await Package.find();
    res.render('packageList', { packageList });
  } catch (error) {
    console.error('Error fetching packageList:', error);
    res.status(500).send('Internal Server Error');
  }
};

exports.searchPackages = async (req, res) => {
  console.log("search Packages")
    try {
        const { s,query = '', page = 1, limit = 90 } = req.query;
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = parseInt(limit);

        let searchQuery = s || query || "";

        let filter = {};
        if (query && query.trim() !== '' && query !== 'All Packages') {
            const searchTerms = query.trim().split(/\\s+/);
            const searchRegexes = searchTerms.map(term => new RegExp(term, 'i'));
            
            filter.$and = searchRegexes.map((regex) => ({
              $or: [
                { title: regex },
                { location: regex },
              ],
            }));
        }

        const totalPackages = await Package.countDocuments(filter);
        const totalPages = Math.max(1, Math.ceil(totalPackages / pageSize));

        // Ensure the requested page number is not greater than the total number of pages
        const validPageNumber = Math.min(pageNumber, totalPages);

        const packages = await Package.find(filter)
            .skip((validPageNumber - 1) * pageSize)
            .limit(pageSize);

        // Sort hotels in memory based on relevance
        packages.sort((a, b) => {
            const aRelevance = calculateRelevance(a, query);
            const bRelevance = calculateRelevance(b, query);
            return bRelevance - aRelevance;
        });

        // Decode HTML entities and remove HTML tags from content
        const processedHotels = packages.map(package => {
            if (package.content) {
              package.content = he.decode(package.content).replace(/<[^>]*>/g, '');
            }
            return package;
        });

        res.render('partials/packageSearchResults', {
            Packages: processedHotels,
            query: searchQuery || 'All Packages',
            currentPage: validPageNumber,
            totalPages: totalPages,
            he
        });
    } catch (error) {
        console.error('Error searching packages:', error);
        res.status(500).send('Error searching packages');
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

