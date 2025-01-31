// voucherSearch.js
console.log("voucherSearch.js loaded");  // 파일 로드 확인

const voucherSearchBtn = document.getElementById('voucherSearchBtn');
const voucherUserIdSearch = document.getElementById('voucherUserIdSearch');

if (voucherSearchBtn && voucherUserIdSearch) {
    voucherSearchBtn.addEventListener('click', function() {
        const userId = voucherUserIdSearch.value.trim();
        console.log("Searching with User ID:", userId);  // 디버그 로그 추가
        window.location.href = `/admin/vouchers?userId=${userId}&page=1`;
    });
} else {
    console.error("Voucher search button or input field not found");
}