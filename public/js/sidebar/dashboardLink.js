$(window).on("hashchange", function () {
  var page = location.hash.substring(1);

  // โหลดเนื้อหาจาก URL
  loadContent(page || "addGolf");

  // เปลี่ยนแปลงการแสดงผลปุ่มที่ active
  updateActiveLink(page || "addGolf");
});

function loadContent(page) {
  $.get("/test/" + page, function (html) {
    $("#dashboard-content").html(html);
  });
}

function updateActiveLink(page) {
  // ลบคลาส active จากทุกปุ่ม
  $(".sidebar-link").removeClass("text-blue-500 hover:text-blue-500");

  // เพิ่มคลาส active ให้กับปุ่มที่ตรงกับ URL
  $("#" + page + "Link")
    .removeClass("hover:text-gray-900")
    .addClass("text-blue-500");
}

// เรียกใช้ครั้งแรก
var initialPage = location.hash.substring(1) || "addGolf";
loadContent(initialPage);
updateActiveLink(initialPage);
