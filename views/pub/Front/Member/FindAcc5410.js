

// 아이디 찾기
function fnFindAccIdChk(){
	var FrmNm = "#frmMemIdReg";

	// 이름
	oField = $(FrmNm + " input[name='MEM_NM']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('이름을 입력하십시오.'); oField.focus();
		return;
	}

	// 핸드폰
	oField = $(FrmNm + " input[name='MOB_NO']");
	if ( !fnFormLenChk( oField, 9, 20 ) ) {
		alert('핸드폰 번호를 입력하십시오.'); oField.focus();
		return;
	}

	//$(FrmNm).attr("action", "./FindAcc_A.asp").submit();
	//return;

	$.ajax({ url: "/Front/Member/FindAcc_A.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				//$("#dvRstMemId").text(data.RST_MSG);
				alert('신청한 아이디 찾기 정보는 가입 시의 휴대폰 번호로 알림톡(또는 문자) 발송되었습니다.');
				top.location.reload();
				break;
			default:
				//$("#dvRstMemId").text(data.RST_MSG);
				alert('입력하신 내용과 일치하는 회원이 없습니다.');
				break;
			}
		}
	});

}

// 비밀번호 찾기
function fnFindAccPwChk(){
	var FrmNm = "#frmMemPwReg";

	// 아이디
	oField = $(FrmNm + " input[name='MEM_ID']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('아이디를 입력하십시오.'); oField.focus();
		return;
	}

	// 이름
	oField = $(FrmNm + " input[name='MEM_NM']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('이름을 입력하십시오.'); oField.focus();
		return;
	}

	// 핸드폰
	oField = $(FrmNm + " input[name='MOB_NO']");
	if ( !fnFormLenChk( oField, 9, 20 ) ) {
		alert('핸드폰 번호를 입력하십시오.'); oField.focus();
		return;
	}

	//$(FrmNm).attr("action", "./FindAcc_A.asp").submit();
	//return;

	$.ajax({ url: "/Front/Member/FindAcc_A.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "1":
				//$("#dvRstMemPw").text(data.RST_MSG);
				alert('가입시 등록하신 휴대폰번혼로 알림톡(또는 문자)로 임시 비밀번호가 발급되었습니다.\n로그인 후 비밀번호를 변경해주시기 바랍니다.');
				top.location.reload();
				break;
			default:
				//$("#dvRstMemPw").text(data.RST_MSG);
				alert('입력하신 내용과 일치하는 회원이 없습니다.');
				break;
			}
		}
	});

}

