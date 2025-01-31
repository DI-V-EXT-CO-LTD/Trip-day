var FrmNm = "#frmLogin";

$(document).ready(function() {

	if ( fnCkBoxVal($(FrmNm+" input[name='RmbId']")) != '' ) {
		$(FrmNm + " input[name='sMemPw']").focus();
	} else {
		$(FrmNm + " input[name='sMemId']").focus();
	}

});

// Login
function fnUserLogin() {
	var oField = null;

	// 아이디
	oField = $(FrmNm + " input[name='sMemId']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('아이디를 입력하십시오.'); oField.focus();
		return;
	}

	if ( oField.val().length < 5 || oField.val().length > 20 ) {
		alert('아이디는 5 ~ 20자리 내에 입력하십시오.'); oField.focus();
		return;
	}

	// 비밀번호
	oField = $(FrmNm + " input[name='sMemPw']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('비밀번호를 입력하십시오.'); oField.focus();
		return;
	}

	$.ajax({ url: "/Front/Login_A.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				alert('로그인 되었습니다.');
				top.location.href = '/Front/Acting/Order_L.asp';
				break;
			case "1":
				alert('아이디 또는 비번이 틀립니다.'); break;
			case "2":
				alert('승인되지 않은 계정입니다.'); break;
			}
		}
	});
}


