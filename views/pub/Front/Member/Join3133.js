var FrmNm = "#frmMemReg";


$(document).on("change", "#AGREE_ALL", function() {
	var fChk = $(this).prop("checked");
	$(".AgreeCk").each(function() {
		$(this).prop("checked", fChk);
	});
});


// 이메일 뒷자리 선택
$(document).on("change", "select[name='EMAIL_SEL']", function() {
	if ( $(this).val() != '' ) {
		$("input[name='EMAIL_2']").val($(this).val());
	} else {
		$("input[name='EMAIL_2']").val("");$("input[name='EMAIL_2']").focus();
	}
});

// 이메일 뒷자리 선택
$(document).on("change", "input[name='EMAIL_1'], input[name='EMAIL_2'], select[name='EMAIL_SEL']", function() {
	$(FrmNm + " input[name='ID_CHK']").val("");
	$("#RstId").text("아이디 중복확인을 하셔야됩니다.");
});

// 휴대폰 번호 '-'
/*$(document).on("keydown", "input[name='MOB_NO']", function(event) {
	var key = event.charCode || event.keyCode || 0;

	fnPhoneReg( key, $(this) );
});*/


// 회원정보 가입
function fnMemJoin_M() {
	var oField = null;
	var pattern = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9|]+$/;

	// 아이디
	oField = $("input[name='MEM_ID']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('아이디를 입력하십시오.'); oField.focus();
		return;
	}
	// 아이디 자릿수 체크
	if ( oField.val().length < 5 || oField.val().length > 20 ) {
		alert('아이디는 5 ~ 20자리 내에 입력하십시오.'); oField.focus();
		return;
	}
	// 비밀번호
	oField = $("input[name='MEM_PW']");
	if ( !fnFormLenChk( oField, 6, 20 ) ) {
		alert('비밀번호를 입력하십시오( 6~20자리 )'); oField.focus();
		return;
	}
	// 비밀번호 확인
	oField = $("input[name='MEM_PW_RE']");
	if ( !fnFormLenChk( oField, 6, 20 ) ) {
		alert('비밀번호 확인을 입력하십시오( 6~20자리 )'); oField.focus();
		return;
	}
	// 이름
	oField = $("input[name='MEM_NM']");
	if ( !fnFormChk( "input", oField ) || pattern.test(oField.val()) == false ) {
		alert('이름(한글)을 입력하십시오.(특수문자는 입력하실 수 없습니다.)'); oField.focus();
		return;
	}
	/*
	// 이름(영문)
	oField = $("input[name='MEM_NM_EN']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('이름(영문)을 입력하십시오.'); oField.focus();
		return;
	} */ 
	// 휴대폰번호
	oField = $("input[name='MOB_NO']");
	if ( !fnFormLenChk( oField, 9, 20 ) ) {
		alert('휴대폰번호를 입력하십시오.'); oField.focus();
		return;
	}  
	// 휴대폰번호 인증
/*	oField = $("input[name='AUTH_SEQ']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('인증 버튼을 클릭하여 휴대폰 인증을 하십시오.'); oField.focus();
		return;
	} */ 
	// 이메일
	oField = $(FrmNm + " input[name='EMAIL']");
	if ( gPtEmail.test(oField.val()) === false ) {
		alert('이메일 형식이 아닙니다.'); oField.focus();
		return;
	}
	
	if ( $("input[name='MEM_PW']").val() != $("input[name='MEM_PW_RE']").val() ) {
		alert('비밀번호와 비밀번호 확인이 틀립니다.');
		$("input[name='MEM_PW']").val('');
		$("input[name='MEM_PW_RE']").val('');
		return;
	}
	if ( fnCkBoxVal($("input[name='AGREE_1']")) == '' ) {
		alert("서비스 이용약관에 동의를 하셔야 회원가입이 가능합니다.");
		return;
	}
	if ( fnCkBoxVal($("input[name='AGREE_2']")) == '' ) {
		alert("개인정보 수집, 제공 및 활용 동의에 동의를 하셔야 회원가입이 가능합니다.");
		return;
	}


	// SMS 수신 확인
	/*
	oField = $("input[name='SMS_RCV_YN']");
	if ( fnCkBoxVal(oField) == '' ) {
		alert("SMS 수신동의를 하지 않으면 무게측정/출고완료 등의 문자서비스를 받으실 수 없습니다.\n추후 회원정보수정에서 수정하셔서 이용하십시오.");
	}*/

	var NewData = new FormData($(FrmNm)[0]);
  
	$.ajax({ url: "./Join_I.asp" ,
		method: 'POST',
		data : NewData,
		processData: false,
		contentType: false,
		cache: false,
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				var _nao={};
				_nao["cnv"] = wcs.cnv("2", "10");
				wcs_do(_nao);

				alert('회원가입이 완료되었습니다.\n네이버/카카오/페이스북으로 가입 시 회원정보변경에서 휴대폰번호, 이름 등을 입력하여 변경을 해주십시오.');
				top.location.href='/Front/Member/JoinCfm.asp?sMemId='+data.MEM_ID;
				break;
			case "-2":
				alert('약관동의를 하셔야합니다.');top.location.href = gMemJoinUrl;
				break;
			case "-4":
				alert('아이디중복 확인을 하셔야합니다.');
				break;
			case "1":
				alert('이미 가입된 아이디입니다.\n아이디 중복체크를 다시 하십시오.');
				break;
			case "2":
				alert('이미 가입된 휴대폰번호입니다.\n휴대폰번호를 다시 입력하십시오.');
				break;
			case "3":
				alert('이미 가입된 이메일 주소입니다.\n이메일주소를 다시 입력하십시오.');
				break;
			case "4":
				alert('입력하신 추천인 사서함번호와 일치하는 회원이 없습니다.\n확인 후 다시 입력하십시오.');
				break;
			case "5":
				alert('1개의 파일 업로드 용량 제한은 ' + fnNumComma(data.LIMIT_SIZE) + ' KB 입니다.\n현재 파일의 용량은 ' + fnNumComma(data.FILE_SIZE) + ' KB 입니다');
				break;
			default: alert('정상적으로 저장되지 않았습니다.\n관리자에게 문의하십시오.');
				break;
			}
		}
	});

}
 
// 인증번호 전송
function fnSmsSend() {
	var FrmNm = "#frmMob";
	var FrmNo = "#frmMemReg";
	var oField = null;

	// 휴대폰번호
	oField = $(FrmNm + " input[name='MOB_NO']");
	if ( !fnFormLenChk( oField, 11, 20 ) ) {
		alert('휴대폰번호를 입력하십시오.'); oField.focus();
		return;
	}

	//$(FrmNm).attr("action", "./MobAuthSend_I.asp").submit();
	//return;

	$.ajax({ url: "./MobAuthSend_I.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0": // 정상
				alert('인증번호가 발송되었습니다.');
				$(FrmNm + " button[name='SmsSend']").html('인증번호 재전송');
				$(FrmNm + " input[name='AUTH_NO']").focus();
				$(FrmNm + " input[name='AUTH_CNT']").val(data.AUTH_CNT);
				$(FrmNm + " input[name='AUTH_SEQ']").val(data.AUTH_SEQ);
				fnMobAuthSendOk(data.AUTH_SEQ);
				break;
			case "-1":
				alert('휴대폰번호가 정확하지 않습니다.');
				break;
			case "1":
				alert('이미 가입된 휴대폰번호 입니다.');
				break;
			case "2":
				alert('인증번호 3회 발송 초과 입니다.\n5분 후에 다시 시도해주십시오.');
				break;
			default: alert('정상적으로 저장되지 않았습니다.\n관리자에게 문의하십시오.');
				break;
			}
		}
	}); 

}


// 휴대폰 인증 번호 정상 발송
function fnMobAuthSendOk(AuthSeq) {
	var FrmNm = '#frmMob';
	ttSec = 60 * 5;
	tmSec = setInterval( "fnTimeCnt()", 1000 );
	$(FrmNm + " input[name='AUTH_SEQ']").val(AuthSeq);
}

// 시간 카운트
function fnTimeCnt() {
	ttSec--;
	var fTmMnt = Math.floor(ttSec / 60);
	var fTmSec = Math.floor(ttSec % 60);

	$("#TM_CNT").val(ttSec);
	$("#TmAtt").html( "남은시간 " + fTmMnt + ":" + fTmSec);

	if ( ttSec <= 0 ) {
		$("#TmAtt").html( "시간이 종료되었습니다." );
		clearInterval(tmSec);
	}
}


// 인증 확인
function fnMobAuthOk() {
	var FrmNm = '#frmMob';
	var oField = null;

	// 휴대폰번호
	oField = $(FrmNm + " input[name='MOB_NO']");
	if ( !fnFormLenChk( oField, 3, 20 ) ) {
		alert('휴대폰번호를 입력하십시오.'); oField.focus();
		return;
	}

	// 인증번호 발송 유무
	oField = $(FrmNm + " input[name='AUTH_CNT']");
	if ( Number(oField.val()) < 0 ) {
		alert('인증번호전송 버튼을 클릭하여 인증번호를 받으십시오.');
		return;
	}

	// 인증번호 시간 제한
	if ( Number($(FrmNm + " input[name='TM_CNT']").val()) <= 0 ) {
		alert("인증번호 입력 시간이 초과되었습니다.\n인증번호전송 버튼을 다시 클릭하여주십시오.");
		return;
	}

	// 휴대폰 인증 번호
	oField = $(FrmNm + " input[name='AUTH_NO']");
	if ( oField.val().length < 4 ) {
		alert('4자리의 휴대폰 인증번호를 입력하세요.');oField.focus();
		return;
	}

	//$(FrmNm).attr("action", "./MobAuthCfm_A.asp").submit();
	//return;

	$.ajax({ url: "./MobAuthCfm_A.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0": // 정상
				fnMobAuthCfm_S(data.MOB_NO, data.AUTH_SEQ, $("input[name='AUTH_NO']").val());
				window.close();
				break;
			case "1":
				alert('입력된 인증번호가 틀립니다.\n인증번호 재전송 후 다시 입력해 주십시오.');
				break;
			default: alert('정상적으로 저장되지 않았습니다.\n관리자에게 문의하십시오.');
				break;
			}
		}
	}); 
}

// 휴대폰번호 인증 완료
function fnMobAuthCfm_S(MobNo, AuthSeq, AuthNo) {
	alert('휴대폰 인증이 완료되었습니다.');

	$(FrmNm + " input[name='MOB_NO']").val(MobNo);
	$(FrmNm + " input[name='AUTH_NO']").val(AuthNo);
	$(FrmNm + " input[name='AUTH_SEQ']").val(AuthSeq);

	$("#RstMobNo").html("인증완료");
}

// 아이디
function fnIdAuth_A() {
	var MemId = $(FrmNm + " input[name='MEM_ID']").val();

	$.ajax({ url: "./IdAuthCfm_A.asp" ,
		method: 'POST',
		data : {MEM_ID: MemId},
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				$(FrmNm + " input[name='ID_CHK']").val("Y");
				$("#RstId").text("인증되었습니다.");
				break;
			case "1":
				alert('이미 가입된 아이디입니다.\n가입 여부를 확인바랍니다.');
				$("#RstId").text("사용불가");
				break;
			case "2":
				$("#RstId").text("5~20자로 입력하십시오.");
				break;
			default: 
				alert('인증확인이 안됩니다.\n관리자에게 문의하십시오.');
				$("#RstId").text("사용불가");
				break;
			}
		}
	});

}


// 이메일
function fnEmailAuth_A() {
	var oField = null;

	// 이메일
	oField = $(FrmNm + " input[name='EMAIL']");
	if ( gPtEmail.test(oField.val()) === false ) {
		alert('이메일 형식이 아닙니다.'); oField.focus();
		return;
	} 

}


// NAVER 로그인
function fnNaverOpen(){

	alert('작업중');


}