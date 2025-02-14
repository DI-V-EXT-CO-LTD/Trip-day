const amadeus = require("../config/amadeus");

const currency = "THB";

const hotelLocation = async (cityCode) => {
  try {
    const respon = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode,
      radius:10,

    });

    return respon.data;
  } catch (err) {
    console.log(err);
  }
};

const hotelSearch = async (props) => {
  const { hotelIds, adults, checkInDate, checkOutDate } = props;
  try {
    const payload = {
        ...(hotelIds && { hotelIds }),
        ...(adults && { adults }),
        ...(checkInDate && { checkInDate }),
        ...(checkOutDate && { checkOutDate }),
        currency:"THB",
      };
    // Get list of available offers in specific hotels by hotel ids
    const respon = await amadeus.shopping.hotelOffersSearch.get(payload);
    return respon.data;
  } catch (error) {
    console.error(error);
  }
};

const hotelRating = async (hotelIds) => {
    try {
      const respon = await amadeus.eReputation.hotelSentiments.get({hotelIds});
      return respon.data;
    } catch (error) {
      console.error(error);
    }
  };

const hotelCityPefer  = async(city)=>{
    try {

     const hotel = await hotelLocation(city)
        const hotelMap = hotel.map(data =>data.hotelId)
        const hotelProps = {
          hotelIds: hotelMap.join(","),
          adults:"1"
        };
        let hotelTree = await hotelSearch(hotelProps);
          
        if(hotelTree.length >=4){
          hotelTree.slice(0,3)
        }
        const hotelTreeId = hotelTree.map(data => data.hotel.hotelId)
        // const Sentiment = await hotelRating(hotelTreeId.join(","))
        // console.log(Sentiment)
        // const respon = {hotel:hotelTree,sentiment:Sentiment}
        const respon = {hotel:hotelTree}
        return respon
                
    } catch (error) {
        console.log(error)
    }
}
module.exports = {
  hotelLocation,
  hotelSearch,
  hotelRating,
  hotelCityPefer,
};
