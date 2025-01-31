// 정규식 기본 패턴 //

var gPtEmail	= /^([\w-]+(?:\.[\w-]+)*)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
var gPtEmail_1	= /^([\w-]+(?:\.[\w-]+)*)/;
var gPtEmail_2	= /((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
var gMemJoinUrl	= "/Front/Member/Join.asp";
var gPtEnText	= /^[A-Za-z0-9 \&\,\.+]*$/;

//------------------------------------------------------------------------------
// 윈도우 팝업
//------------------------------------------------------------------------------
function fnPopWinCT(Url, Title, iWidth, iHeight) {
	var fWinOpt;
	var fLeft, fTop;

	//var iLeft, iTop;
	fLeft = (screen.width - iWidth)/2;
	fTop = (screen.height - iHeight)/2;

	Title = Title.replace(" ", "_");

	fWinOpt = "width=" + iWidth + ", height=" + iHeight;
	fWinOpt += " toolbar=no, directories=no, status=no, menubar=no, location=no, resizable=no, left=" + fLeft + ", top=" + fTop + ", scrollbars=yes";

	var loNewWin = window.open(Url, Title, fWinOpt);
	//loNewWin.focus();

	return loNewWin;
}

//------------------------------------------------------------------------------
// Input/CheckBox/ComboBox 값 체크
//------------------------------------------------------------------------------
function fnFormChk( MethodNm, Obj ) {
	var Tf = false;

	switch ( MethodNm ) {
	case "input": 
		if ( $.trim(Obj.val()) == "" ) Tf = false;
		else Tf = true;
		break;
	case "select": 
		if ( $.trim(Obj.val()) == "" ) Tf = false;
		else Tf = true;
		break;
	case "checkbox": 
		if ( fnCkBoxVal(Obj) == "" ) Tf = false;
		else Tf = true;
		break;
	}

	return Tf;
}

//------------------------------------------------------------------------------
// Input/CheckBox/ComboBox 값 길이 체크
//------------------------------------------------------------------------------
function fnFormLenChk( Obj, Min, Max ) {
	var Tf = false, Val = $.trim(Obj.val());

	// 최소/최대 체크
	if ( Val.length >= Min && Val.length <= Max ) {
		Tf = true;
	};

	return Tf;
}

//------------------------------------------------------------------------------
// 체크박스 값 가져오기
//------------------------------------------------------------------------------
function fnCkBoxVal( Obj ) {
	var fChkVal = "";

	Obj.each( function() {
		if ( $(this).is(":checked") ) {
			fChkVal += fChkVal != '' ? "," + $(this).val() : $(this).val();
		}
	});

	return fChkVal;
}

//------------------------------------------------------------------------------
// 체크된 체크박스 수
//------------------------------------------------------------------------------
function fnCkBoxCnt( Obj ) {
	var fChkCnt = 0;

	Obj.each( function() {
		if ( $(this).is(":checked") ) {
			fChkCnt += 1;
		}
	});

	return fChkCnt;
}

//------------------------------------------------------------------------------
// 체크박스 전체 선택
//------------------------------------------------------------------------------
function fnCkBoxAllSel( pFrmNm, pColAllNm, pColNm ) {
 
	var fColAllNm = $("#" + pFrmNm + " input[name='"+pColAllNm+"']");
	var fColNm = $("#" + pFrmNm + " input[name='"+pColNm+"']");
	var fChkVal = "";

	if ( fColNm ) {
		fColNm.prop("checked", fColAllNm.prop("checked"));
	}

}

//------------------------------------------------------------------------------
// 3자리 콤마
//------------------------------------------------------------------------------
function fnNumComma( Num ) {

   var fVal = "" + Num;
   var objRegExp = new RegExp("(-?[0-9]+)([0-9]{3})");
   while (objRegExp.test(fVal)) {
      fVal = fVal.replace(objRegExp, "$1,$2");
   }

   return fVal;
}

//------------------------------------------------------------------------------
// 숫자 체크
//------------------------------------------------------------------------------
function fnNumChk( Val ) {
	var fNum = Val;
	var fMns = "";

	fNum = fNum.replace(/[^0-9]/gi, '');
	//fNum = isNaN(fNum) ? '' : fNum;

	if ( fNum < 0 || isNaN(fNum) ) {
		fNum = '';
	}

	return fNum;
}

//------------------------------------------------------------------------------
// 소수자릿수
//------------------------------------------------------------------------------
function fnNumChiper( Val, Chiper ) {
	var fNum = Val;
	var fMns = "";

	fNum = fNum.replace(/,/g, "");
	fNum = isNaN(fNum) ? 0 : fNum;

	if ( fNum < 0 ) {
		fMns = "-";
	}

	fNum = Math.abs(fNum);
	//fNum = Math.round(fNum);
	fNum = fNum.toFixed(Chiper);
	
	return fMns + "" + fNum;
}

//------------------------------------------------------------------------------
// 소수자릿수, 콤마
//------------------------------------------------------------------------------
function fnNumChiperCom( Val, Chiper ) {
	var fNum = Val;
	var fMns = "";

	fNum = fNum.replace(/,/g, "");
	fNum = isNaN(fNum) ? 0 : fNum;

	if ( fNum < 0 ) {
		fMns = "-";
	}

	fNum = Math.abs(fNum);
	//fNum = Math.round(fNum);
	fNum = fNum.toFixed(Chiper);
	
	return fMns + "" + fnNumComma(fNum);
}

//------------------------------------------------------------------------------
// 한글->영문 이름 번역
//------------------------------------------------------------------------------
function fnHanEng(pVal, pTarget) {	
/**
 *
 *  초성 19개:   ㄱ   ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
 *  중성 21개:   ㅏ   ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
 *  종성 28개:  Fill  ㄱ ㄲ ㄳ ㄴ ㄵ ㄶ ㄷ ㄹ ㄺ ㄻ ㄼ ㄽ ㄾ ㄿ ㅀ ㅁ ㅂ ㅄ ㅅ ㅆ ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ 
 *
 *  유니코드 2.0 한글의 범위
 *      AC00(가) ~ D7A3(힣)
 *
 *  유니코드 2.0 한글을 영문자로 표시하기
 *      ㄱ  <-->  ㅋ
 *      ㄷ  <-->  ㅌ
 *      ㅂ  <-->  ㅃ
 *      ㅈ  <-->  ㅉ
 */

	var sCho, sJung, sChong;

	sCho		= ["G","Gg","N","D","Tt","R","M","B","Pp","S","Ss","O","J","Jj","Ch","K","T","P","H"];
	sJung		= ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"];
	sChong	= ["","g","gg","gs","n","nz","nh","d","l","lg","lm","lb","ls","lt","lp","lh","m","b","bs","s","ss","ng","z","ch","k","t","p","h"];

	var sVal = pVal;
	var sTarget = pTarget;

	var t = "";
	var tmp = "";
	var n, n1, n2, n3;
	var c, d;
	var PHAN = "";
	var PENG = "";
	var j;
	var o = sTarget;
	for (i = 0; i < sVal.length; i++) {
		c = sVal.charAt(i);
		n = parseInt(escape(c).replace(/%u/g, ''), 16); 
		if (n >= 0xAC00 && n <= 0xD7A3) {
			n = n - 0xAC00;
			n1 = Math.floor(n / (21 * 28));
			n = n % (21 * 28);
			n2 = Math.floor(n / 28);
			n3 = Math.floor(n % 28);
			tmp = sCho[n1] + sJung[n2] + sChong[n3];
			if (tmp.length > 1 && tmp.charAt(0) == 'O')
				tmp = ("" + tmp.charAt(1)).toUpperCase() + tmp.substring(2);
				if (i == 0)	{
				//	tmp ="KWON" ;
					if(c == "권"){
						tmp = "KWON";					
					}else if(c == "김"){ 
						tmp = "KIM";
					}else if(c == "이"){
						tmp ="LEE";
					}else if(c == "류"){
						tmp ="RYU";
					}else if(c == "박"){
						tmp ="PARK";
					}else if(c == "최"){
						tmp ="CHOI";
					}else if(c == "오"){
						tmp ="OH";
					}else if(c == "우"){
						tmp ="WOO";
					}else if(c == "주"){
						tmp ="JOO";
					}
				}
				t += tmp;				
		}
		else
		t += c;
		
	}

	//		for (j = LBound(Split(t, " ")); j = UBound(Split(t, " ")); j++) {
	//			PHAN(j) = Split(t, " ")(j);
	//		} 			
	//		while (j >= 0){
	//			PENG = PENG + PHAN(j) & " ";
	//			j = j - 1;
	//		}	

	//		t = PENG.toUpperCase();
	//		alert(t);
		t = t.toUpperCase();
		o.value = t;
		return t;
}

//------------------------------------------------------------------------------
// 동적 폼 생성
//------------------------------------------------------------------------------
function fnDnyamicForm( FrmNm, Method ) {
	var $DynFrm = "";

	//if ( $DynFrm.attr("id") == undefined ) {
		$DynFrm = $("<form/>").attr({id:FrmNm, name:FrmNm, method:Method});
		$(document.body).append($DynFrm);
	//}

	$DynFrm.empty();

	return $DynFrm;
}

//------------------------------------------------------------------------------
// 동적 Input 생성
//------------------------------------------------------------------------------
function fnDnyamicInput( FrmNm, Nm, Val ) {

	$("<input></input>").attr({type:"hidden", name:Nm, value:Val}).appendTo(FrmNm);

}

//------------------------------------------------------------------------------
// 다이아로그 팝업
//------------------------------------------------------------------------------
function fnDialogPopup( modalNm, Tit, Url, Wh, Ht ) {

	var Html = "";
	Html += '<div id="'+modalNm+'" title="'+Tit+'" style="padding:0;margin:2px;background:#fff;border:1px solid #eee;">';
	Html += '	<div id="'+modalNm+'Cont" style="padding:20px;">';
	Html += '	</div>';
	Html += '</div>';

	$("html,body").append(Html);

	$.ajax({ url: Url ,
		method: 'GET',
		dataType : 'html' , 
		success: function(data) { 
			$("#"+modalNm+"Cont").html(data);
		}
	});

	$("#"+modalNm).dialog({
		modal:true,
		minWidth:Wh,
		minHeight:Ht
	});

}

// 상단 로그인
function fnTopLogin() {
	var FrmNm = "#frmTopLogin";
	var oField = null;

	// 아이디
	oField = $(FrmNm + " input[name='sMemId']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('아이디를 입력하십시오.'); oField.focus();
		return;
	}

	// 이메일
	oField = $(FrmNm + " input[name='sMemId']");
	if ( gPtEmail.test(oField.val()) === false ) {
		alert('이메일 형식이 아닙니다.'); oField.focus();
		return;
	}

	// 비밀번호
	oField = $(FrmNm + " input[name='sMemPw']");
	if ( !fnFormChk( "input", oField ) ) {
		alert('비밀번호를 입력하십시오.'); oField.focus();
		return;
	}

	//$(FrmNm).attr("action", "./Login_A.asp").submit();
	//return;

	$.ajax({ url: "/Front/Login_A.asp" ,
		method: 'POST',
		data : $(FrmNm).serialize(),
		dataType : 'json' , 
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				top.location.href = '/';
				break;
			case "1":
				alert('아이디 또는 비번이 틀립니다.'); break;
			case "2":
				alert('승인되지 않은 계정입니다.');
				break;
			}
		}
	});

}

// 트래킹검색 처리페이지
function fnDlvrSearch(ObjNm){
	var frmNm = "#" + ObjNm;
	var NationTy = $(frmNm + " input[name='NATION_TYPE']").val();
	var TrkNo = $(frmNm + " input[name='TRACKING_NO']");

	if ( TrkNo.val() == "" ) {

		if ( NationTy == "EN"  ) {
			alert('Tracking Number를 입력하십시오.'); TrkNo.focus();
			return false;
		} else {
			alert('운송장번호를 입력하십시오.'); TrkNo.focus();
			return false;
		}

	}

	fnPopWinCT("/Front/Main/TrkSearchPop_S.asp?NATION_TYPE=" + NationTy + "&TRACKING_NO=" + TrkNo.val(), "TRACKING_SEARCH", 1000, 700, "Y");

}

// 트래킹검색
function fnTrkSearch(TrkNo) {
	// 전세계
	//fnPopWinCT('https://www.packagetrackr.com/track/'+TrkNo, 'TrkSearch', 1000, 700);

	// 중국
	fnPopWinCT('https://www.baidu.com/s?wd='+TrkNo, 'TrkSearch', 1000, 700);

}

// 무게 단위
function fnUnitWt(Code , Num) { 
   
   var fWt = Num, fFst = 0, fLast = 0;

   fLast   = fWt % 1;
   fFst   = Math.floor(fWt);

	// kg
   if(Code == 1){
	   if ( fLast <= 0 ) {
		  fLast = 0;
	   } else if ( fLast > 0 && fLast <= 0.5 ) {
		  fLast = 0.5;
	   } else {
		  fLast = 1;
	   }
	// lbs
	} else if(Code == 2) {
	   if ( fLast > 0 ) {
		  fLast = 1;
	   } else {
		  fLast = 0;
	   }
	   return fFst + fLast;
   }
   return fFst + fLast;
}

// 체크박스의 value 값 설정하여 전체 가져오기
function fnChkBoxYnVal(pColNm) {
    var fColNm = pColNm;
    var fChkVal = "";

    $("input[name='" + fColNm + "']").each(function () {
        if ($(this).is(":checked")) fChkVal += "," + $(this).val();

    });

    if (fChkVal != "") {
        fChkVal = fChkVal.substring(1, fChkVal.length);
    }

    return fChkVal;
}

// 한국 운송장 조회
function fnKrDlvrSearch(IvcNo) {
	var Url = '';

	if ( IvcNo == '' ) {
		alert('운송장번호를 입력하십시오.'); return;
	} else {
		window.open('/Front/Main/TrkSearchPop_S.asp?NATION_TYPE=KR&TRACKING_NO='+IvcNo, 'KrDlvrSearch', 800, 800);
	}
}

// 해외 배송조회
function fnCnDlvrSearch(TrkNo) {
	if ( TrkNo == '' ) {
		alert('중국 트래킹번호를 입력하십시오.'); return;
	} else {
		// 중국 운송장 조회
		window.open('https://www.baidu.com/s?wd='+TrkNo);
	}
}


// 관/부가세 계산기
function fnDutyCal_W() {
   fnPopWinCT("/Front/Page/DutyCal_W.asp", "DutyCal_W", 800, 700);
}


// SMS 전송
function fnSms_W() {
   fnPopWinCT("/Admin/Sms/Sms_W.asp", "Sms_W", 1100, 700);
}

// sms byte 체크
function fnLengChk(pObj, pEle, pLimit) {
	var temp;
	var count = 0;
	var msg = pObj.value;

	for (var i = 0; i < msg.length; i++) {
		temp = msg.charAt(i);

		if (escape(temp).length > 4) {
			count += 2;
		} else if (temp == '' || temp == '\r') {
			count += 0;
		} else if (temp == '·') {
			count += 2;
		} else {
			++count;
		}
		
		if (count > pLimit) {
			pObj.blur();
			pObj.focus();
			alert('메시지는 ' + pLimit + '바이트까지만 전송이 가능합니다(한글 2byte, 영문숫자 1byte).\r\n초과되는 내용은 삭제됩니다.');
			msg = msg.substring(0, i);
			pObj.value = msg;
			pEle.innerHTML = pLimit;
			return;
		}
	}

	pEle.innerHTML = count;

}
// sms byte 값 보내주기
function fnLengRtn(msg) {
	var temp;
	var count = 0; 

	for (var i = 0; i < msg.length; i++) {
		temp = msg.charAt(i);

		if (escape(temp).length > 4) {
			count += 2;
		} else if (temp == '' || temp == '\r') {
			count += 0;
		} else if (temp == '·') {
			count += 2;
		} else {
			++count;
		} 
	}

	return count;

}

//------------------------------------------------------------------------------
// 기능 : ElementById 기본 설정
//------------------------------------------------------------------------------
function fnEB( pNm ) {
	if (pNm) {
		return document.getElementById(pNm);
	}
}


//------------------------------------------------------------------------------
// 기능 : 자릿수 올림
//------------------------------------------------------------------------------
function fnCalDigit( Mny, Digit ) {
	var RtnMny = Mny;

	RtnMny	= isNaN(RtnMny) ? 0 : RtnMny;
	RtnMny	= Math.ceil(parseFloat(RtnMny) / parseFloat(Digit)) * parseFloat(Digit);

	return RtnMny;
}

//------------------------------------------------------------------------------
// 기능 : 화폐 계산
//------------------------------------------------------------------------------
function fnCalMny( Mny1, Mny2, CrrCd ) {
	var RtnMny = 0;

	if ( CrrCd == '1' ) { // 원화
		RtnMny = Number(Mny1) - Number(Mny2);
		RtnMny = Number(RtnMny) <= 0 ? 0 : RtnMny;
	} else { // 퍼센트(%)
		RtnMny = Number(Mny1) - ( Number(Mny2) / 100 * Number(Mny1) ) ;
		RtnMny = Number(RtnMny) <= 0 ? 0 : RtnMny;
	}

	RtnMny	= fnCalDigit( RtnMny, 10);

	return RtnMny;
}

//------------------------------------------------------------------------------
// 기능 : 화폐/금액
//------------------------------------------------------------------------------
function fnMnyCrrNm( Mny, CrrCd, CrrNm ) {
	var RtnTxt = '';

	if ( CrrCd == '3' ) { // 퍼센트(%)
		RtnTxt	= fnNumComma(Mny) + '' + CrrNm;
	} else { // 화폐
		RtnTxt	= CrrNm + '' + fnNumComma(Mny);
	}

	return RtnTxt;
}


//------------------------------------------------------------------------------
// 기능 : 네이버로그인 팝업
//------------------------------------------------------------------------------
function NaverPop( ) {
	var popupX = (window.screen.width / 2) - (500 / 2);
	var popupY= (window.screen.height /2) - (500 / 2);
	window.open('/Front/Join_N.asp', '', 'status=no, height=525, width=600, left='+ popupX + ', top='+ popupY + ', screenX='+ popupX + ', screenY= '+ popupY);
}

// 언어 선택
function fnLanChange(LangCd) {
	$.ajax({url: "/Admin/LangChg_A.asp?sLangCd="+LangCd, success: function(result){
		top.location.reload();
	}});
}

// 센터 선택
function fnAdmCenterChange(CenterSeq) {
	$.ajax({url: "/Admin/AdmCenterChg_A.asp?sAdmCenter="+CenterSeq, success: function(result){
		top.location.reload();
	}});
}

// 일자 자동입력
function fnAutoDateFormat( e, oThis ){
	var num_arr = [ 
		97, 98, 99, 100, 101, 102, 103, 104, 105, 96,
		48, 49, 50, 51, 52, 53, 54, 55, 56, 57
	]
	
	var key_code = ( e.which ) ? e.which : e.keyCode;
	if( num_arr.indexOf( Number( key_code ) ) != -1 ){
	
		var len = oThis.value.length;
		if( len == 4 ) oThis.value += "-";
		if( len == 7 ) oThis.value += "-";
	
	}
	
}

// 전화번호 정규식
function fnPhoneReg(key, $text) {
	if (key !== 8 && key !== 9) {
		if ($text.val().length === 3) {
			$text.val($text.val() + '-');
		}
		if ($text.val().length === 8) {
			$text.val($text.val() + '-');
		}
	}

	return (key == 8 || key == 9 || key == 46 || (key >= 48 && key <= 57) || (key >= 96 && key <= 105));
	// Key 8번 백스페이스, Key 9번 탭, Key 46번 Delete 부터 0 ~ 9까지, Key 96 ~ 105까지 넘버패트
	// 한마디로 JQuery 0 ~~~ 9 숫자 백스페이스, 탭, Delete 키 넘버패드외에는 입력못함
}

// 비밀번호 공백 입력방지
function fnNoSpace(obj) {
	var str_space = /\s/;
	if ( str_space.exec(obj.value) ) {
		obj.focus();
		obj.value = obj.value.replace(' ','');
		return false;
	}
}

//특수문자, 특정문자열(sql예약어의 앞뒤공백포함) 제거
function fnCheckSearchedWord(obj){
	if(obj.value.length >0){
		//특수문자 제거
		var expText = /[%=><]/ ;
		if(expText.test(obj.value) == true){
			alert("특수문자를 입력 할수 없습니다.") ;
			obj.value = obj.value.split(expText).join(""); 
			return false;
		}
		
		//특정문자열(sql예약어의 앞뒤공백포함) 제거
		var sqlArray = new Array(
			//sql 예약어
			"OR", "SELECT", "INSERT", "DELETE", "UPDATE", "CREATE", "DROP", "EXEC",
             		 "UNION",  "FETCH", "DECLARE", "TRUNCATE" 
		);
		
		var regex;
		for(var i=0; i<sqlArray.length; i++){
			regex = new RegExp( sqlArray[i] ,"gi") ;
			
			if (regex.test(obj.value) ) {
			    alert("\"" + sqlArray[i]+"\"와(과) 같은 특정문자로 검색할 수 없습니다.");
				obj.value =obj.value.replace(regex, "");
				return false;
			}
		}
	}
	return true ;
}

// 주소 검색
function fnEnterJusoSearch(sFormNm, sTxtId) {
	var evt_code = (window.netscape) ? ev.which : event.keyCode;

	fnJusoGetAddr(sFormNm, sTxtId); //jsonp사용시 enter검색 
}

// 주소로 API 호출
function fnJusoGetAddr(sFormNm, sTxtId){
	// 적용예 (api 호출 전에 검색어 체크) 	
	if (!fnCheckSearchedWord(document.frmMemAddrS.keyword)) {
		return ;
	}

	$.ajax({
		 url :"https://www.juso.go.kr/addrlink/addrLinkApiJsonp.do"  //인터넷망
		,type:"post"
		,data:$("#"+sFormNm).serialize()
		,dataType:"jsonp"
		,crossDomain:true
		,success:function(jsonStr){
			$("#"+sTxtId).html("");
			var errCode = jsonStr.results.common.errorCode;
			var errDesc = jsonStr.results.common.errorMessage;
			if(errCode != "0"){
				alert(errCode+"="+errDesc);
			}else{
				if(jsonStr != null){
					fnMakeJusoListJson(jsonStr, sTxtId);
				}
			}
		}
	    ,error: function(xhr,status, error){
	    	alert("에러발생");
	    }
	});
}

// 주소 리스트 생성
function fnMakeJusoListJson(jsonStr, sTxtId){
	var htmlStr = "";
	htmlStr += "<select name=\"searchJusoaddr1\" id=\"searchJusoaddr1\" class=\"with-border\" data-size=\"10\" onChange=\"fnAddJusoChoice('"+sTxtId+"');\">";
	htmlStr += "<option value=\"|@||@|\" Evalue=\"\" Epost=\"\">= 주소를 선택해 주세요.</option>";

	// 주소 : roadAddr, 영문주소 : engAddr, 우편번호 : zipNo
	$(jsonStr.results.juso).each(function(){
		htmlStr += "<option value='"+this.zipNo+"|@|"+this.roadAddrPart1+"|@|"+this.engAddr+"'>"+this.roadAddr+"</option>";
	});
	htmlStr += "</select>";

	$("#"+sTxtId).html(htmlStr);
}

// 주소 Combobox 선택
function fnAddJusoChoice(DivId) {
	var aJuso = $("#searchJusoaddr1").val(); 

	// 실제 쓰일 함수에 전달
	top.fnJusoAddrGet(aJuso);

	$("#"+DivId).html('');

	$.magnificPopup.close();
}


// Popup Dialog
function fnPopupDialog(Url) {

	$.ajax({ url: Url ,
		method: 'GET',
		dataType : 'html' , 
		success: function(data) { 
			$("#dialog-cont").html(data);
			$("#dialog-cont").trigger('create');
		}
	});

}


// 파일다운로드
function fnFileDown(FilePath, FileNm) {
	var $DynFrm = fnDnyamicForm("frmFileDown", "POST");
	fnDnyamicInput( $DynFrm, 'FilePath', FilePath );
	fnDnyamicInput( $DynFrm, 'FileNm', FileNm );
	$DynFrm.attr('action', '/Front/Acting/FileDown_S.asp').submit();
}


// Charact 설정
function fnEmulAcceptCharset(form) {
    if (form.canHaveHTML) { 
        document.charset = form.acceptCharset;
    }
	return true;
}


// 통관부호 유효체크



function fnUniPassApiPersEcm(AdrsKr, RrnNo) {
	var ApiUrl = "/Front/Acting/UniPassApi.asp";

	return $.ajax({
			type: "post", // post
			url : ApiUrl,
			data : {ApiCd: "01", sAdrsKr: AdrsKr, sRrnNo: RrnNo},
			dataType : "json",
			success: function(data) {
				/*
				if ( data.RST_NO == '1' ) {
					$("input[name='CTMS_SAME_YN']").val('Y');
					$("#vwRtnCtmsNo").text('유효');
				} else {
					$("input[name='CTMS_SAME_YN']").val('N');
					$("#vwRtnCtmsNo").text('불일치');
				}*/
			}
		});

}


// 통관부호 유효체크 팝업
function fnUnipassPop() {
	fnPopWinCT('/Front/Page/UnipassPers.asp', 'fnUnipassPop', 600, 400, 'Y')
}


// 즐겨찾기
function fnBrwsFvrt( SiteUrl, SiteTit ) {

	if (window.sidebar) { 
		window.sidebar.addPanel(SiteTit, SiteUrl, ""); 
	} else if (window.external && ('AddFavorite' in window.external)) {
		window.external.AddFavorite(SiteUrl, SiteTit); 
	} else if (window.opera && window.print) { 
		window.external.AddFavorite(SiteUrl, SiteTit); 
	} else { 
		alert("이 브라우저에서는 작동하지 않습니다.\n'Ctrl + D'를 눌러 즐겨찾기 추가하세요."); 
	} 
 
}


// 웹보안 체크
function fnEdtSecurDel(EdtCont) {

	EdtCont = EdtCont.replace(/background-image/gi, "");
	EdtCont = EdtCont.replace(/-webkit-image-set/gi, "");
	EdtCont = EdtCont.replace(/script/gi, "");
	EdtCont = EdtCont.replace(/onerror/gi, "");
	EdtCont = EdtCont.replace(/onclick/gi, "");
	EdtCont = EdtCont.replace(/nc /gi, "nc_");
	EdtCont = EdtCont.replace(/cc-/gi, "cc_");
	EdtCont = EdtCont.replace(/break-all;/, "");

	return EdtCont;
}

// 웹에디터 캡처 체한
function fnEdtCopImgChk(EdtCont) {
	var RstTf = 0;

	if ( EdtCont.match('base64') && EdtCont.match('data:image') ) {
		RstTf = 1; // 실패 걸림
	} else {
		RstTf = 0; // 제한 없음
	}

	return RstTf;
}

// 운송장 출력
function fnIvcPrt_S(OrderNo, CenterSeq, DlvrWayCd) {
	// 광저우 항공
	if ( CenterSeq == '9' && DlvrWayCd == '1' ) {
		fnPopWinCT('/Admin/Acting/IvcNoPrt_CJ.asp?sOrderNo='+OrderNo, 'IvcNoPrt_CJ', 750, 400)
	}
}


// 클립보드로 복사
function fnCopy(ObjId) {
	var IE = (document.all)?true:false;
	var	Txt = $("#"+ObjId).text();

	 if (IE) {
		 window.clipboardData.setData("Text", Txt);
		 document.execCommand("Copy");
	 } else {
		$("#ClipBoard").val(Txt);
		$("#ClipBoard").css('display','block').select();
		document.execCommand("Copy");
		$("#ClipBoard").css('display','none');
	 }

	 alert('[' + Txt + ']를 복사하였습니다.');
}


// 카카오 로그인
function loginWithKakao() {

	//alert('서비스 준비중입니다.');
	//return;
	Kakao.Auth.loginForm({
		success: function(authObj) {
		//alert(JSON.stringify(authObj));
		   Kakao.API.request({
				 url: '/v2/user/me',
				 success: function(res) {
					var val = "?ApiId=" + escape(res.id) + "&Name=" + escape(res.properties.nickname);
					location.href='/Front/LoginApiKakao.asp'+ val
				 },
				 fail: function(error) {
				   alert(JSON.stringify(error));
				 }
			   });
		 },
		 fail: function(err) {
		   alert(JSON.stringify(err));
		 }
   });
 };