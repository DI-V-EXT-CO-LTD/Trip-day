$(window).on("hashchange", function () {
  var page = location.hash.substring(1);

  // โหลดเนื้อหาจาก URL
  loadContent(page || "dashboard");

  // เปลี่ยนแปลงการแสดงผลปุ่มที่ active
  updateActiveLink(page || "dashboard");
});

function loadContent(page) {
  $.get("/admins/" + page, function (html) {
    $("#dashboard-content").html(html);
  });
}

function updateActiveLink(page) {
  // ลบคลาส active จากทุกปุ่ม
  $(".sidebar-link").removeClass("text-blue-500");

  page = page.split("/")[0];

  // เพิ่มคลาส active ให้กับปุ่มที่ตรงกับ URL
  $("#" + page + "Link")
    .addClass("text-blue-500")
    .removeClass("hover:text-gray-900");
}

// เรียกใช้ครั้งแรก
var initialPage = location.hash.substring(1) || "dashboard";
loadContent(initialPage);
updateActiveLink(initialPage);
