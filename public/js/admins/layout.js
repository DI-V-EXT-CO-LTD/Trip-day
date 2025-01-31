function navigateToPage(document, page) {
  const currentUrl = new URL(window.location.href);
  const hash = currentUrl.hash;

  if (hash.includes("?")) {
    // แยก query string ใน hash
    const [path, queryString] = hash.split("?");
    const hashParams = new URLSearchParams(queryString);

    // ปรับค่าพารามิเตอร์ `page` ใน hash
    hashParams.set("page", page);

    // อัปเดต hash ด้วยค่าใหม่
    currentUrl.hash = `${path}?${hashParams.toString()}`;
  } else {
    // กรณี hash ไม่มี query string ให้ตั้งค่าใหม่
    currentUrl.hash = `#${document}?page=${page}`;
  }

  window.location.href = currentUrl.toString();
}

const search = (document, currentPage) => {
  const searchData = $("#table-search").val() || "";
  window.location.href = `/admins#${document}?page=1&search=${encodeURIComponent(
    searchData
  )}`;
};

function handleEnter(event, callback) {
  if (event.key === "Enter") {
    callback();
  }
}
