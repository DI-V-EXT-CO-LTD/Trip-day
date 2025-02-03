function fetchHotelrangePrice(min, max) {
  const urlParams = new URLSearchParams(window.location.search);

  urlParams.set("minPrice", min);
  urlParams.set("maxPrice", max);

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

  window.location.href = newUrl;
}

function initializeFiltersFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  //checkbok
  const filters = [
    "breakfast",
    "refund",
    "beds",
    "Smoking room",
    "Balcony",
    "Washing machine",
    "Hotel",
    "Homes",
    "Serviced apartment",
    "Airport pick-up service",
    "Smoking area",
    "Currency exchange",
    "Family-friendly",
    "Great Views",
    "Signature Hot Spring",
  ];

  // radio
  const filtersRadio = [
    "location",
    "BedType",
    "Bedrooms",
    "Payment",
    "Room Features",
    
  ];

  // ลูปผ่านค่าทั้งหมดใน filters
  filters.forEach(filter => {
    if (urlParams.has(filter)) {
      const filterId = `filter-${filter}`; // แทนที่ช่องว่างด้วย ""
      const element = document.getElementById(filterId);
      if (element) {
        element.checked = true; // ทำให้ checkbox หรือ radio button ตรงกับ filter ถูกเลือก
      }
    }
  });

  filtersRadio.forEach(filter=>{
    if(urlParams.has(filter)){
      const paramsValue = urlParams.get(filter);
      const element = document.getElementById(paramsValue)
      if(element){
        element.checked = true
      }else{
        console.log("can't find element "+paramsValue)
      }
    }
  })
}



function fetchCheckboxFilter(filterName, isChecked) {
  const urlParams = new URLSearchParams(window.location.search);

  if (isChecked) {
    urlParams.set(filterName, "true");
  } else {
    urlParams.delete(filterName);
  }

  const newUrl = `${window.location.pathname}?${urlParams.toString()}`;

  window.location.href = newUrl;
}

function filterByStars(stars, comparison = "eq") {
  const url = new URL(window.location.href);

  // เพิ่มค่าฟิลเตอร์ใน URL
  if (comparison === "lte") {
    url.searchParams.set("maxStars", stars);
    url.searchParams.delete("exactStars");
  } else {
    url.searchParams.set("exactStars", stars);
    url.searchParams.delete("maxStars");
  }

  window.location.href = url.toString();
}


function filterUtils (setName,value){
  const url = new URL(window.location.href);

  url.searchParams.set(setName, value);


window.location.href = url.toString();
}
document.addEventListener("DOMContentLoaded", initializeFiltersFromURL);
