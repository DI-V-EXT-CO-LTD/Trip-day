// 쿠키값 가져오기
function fnCookieGet(sName) {
	var from_idx = document.cookie.indexOf(sName+'=');
	if (from_idx != -1) {
		from_idx += sName.length + 1
		to_idx = document.cookie.indexOf(';', from_idx)
		if (to_idx == -1) {
			to_idx = document.cookie.length
		}
		return unescape(document.cookie.substring(from_idx, to_idx))
	}
}

//설정한 날짜만큼 쿠키가 유지되게. sExpDay가 1 이면 하루동안 유지
function fnCookieSet(sName, sVal, sExpDay) {
	var expire_date = new Date();

	expire_date.setDate(expire_date.getDate() + sExpDay );
	document.cookie = sName + "=" + escape(sVal) + "; expires=" + expire_date.toGMTString() + "; path=/";
}

//쿠키 소멸 함수
function fnCookieClear(sName) {
	var expire_date = new Date();
	//어제 날짜를 쿠키 소멸 날짜로 설정한다.
	expire_date.setDate(expire_date.getDate() - 1)
	document.cookie = sName + "= " + "; expires=" + expire_date.toGMTString() + "; path=/"
}

//체크 상태에 따라 쿠키 생성과 소멸을 제어하는 함수
function fnCookieControl(sEle) {
	fnCookieSet(sEle, "true", 1);

	return;
}