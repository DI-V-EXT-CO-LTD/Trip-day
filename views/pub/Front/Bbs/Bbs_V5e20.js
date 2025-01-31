var gBbCode	= '';
var gBbsSeq	= '';

$(document).ready( function() {

	gBbCode	= $("#frmList input[name='sBbCode']").val();
	gBbsSeq	= $("#frmList input[name='sBbsSeq']").val();

});


// 주문정보 보기
function fnOrderView(OrderNo) {
	window.open('/Front/Acting/Order_V.asp?sOrderNo='+OrderNo, '_blank');
}

// 주문정보 보기
function fnOrderSearch(TrkNo, SendYn) {
	window.open('/Front/Acting/Order_L.asp?sTrkNo='+TrkNo, '_blank');
}

// 목록
function fnList_S() {
	$("#frmList input[name='sBbsSeq']").remove();
	$("#frmList").attr("action", "./Bbs_L.asp").submit();
}

// 다운로드
function fnFileDown(FileSeq) {
	var Url = "./FileDown_S.asp?BB_CODE="+gBbCode+"&BBS_SEQ="+gBbsSeq+"&FILE_SEQ="+FileSeq;

	top.downFrm.location.assign(Url);
}

// 덧글쓰기
function fnComt_M() {
	var oField = null;

	// 내용
	oField = $("textarea[name='CONT']");
	if ( oField.val() == '' ) {
		alert('내용을 입력하십시오.'); oField.focus();
		return;
	}
	//$("#frmComt").attr("action", "./Bbs_IMD.asp").submit();
	//return;

	var NewData = new FormData($("#frmComt")[0]);
	$.ajax({ url: "./Bbs_IMD.asp" ,
		method: 'POST',
		data : NewData,
		processData: false,
		contentType: false,
		cache: false,
		dataType : 'json',
		success: function(data) { 
			switch ( data.RST_NO ) {
			case "0":
				top.location.reload();
				break;
			default: alert(data.RST_NO+' 정상적으로 저장되지 않았습니다.\n솔루션 관리자에게 문의하십시오.');
				break;
			}
		},
		error: function(error) {
			alert( error );
		}
	});

}

// 덧글 삭제
function fnCmtDel_M(ComtSeq) {

	if ( confirm("선택 덧글을 삭제하시겠습니까?") ) {
		var NewData = new FormData();
		NewData.append('sKind', 'CD');
		NewData.append('BB_CODE', gBbCode);
		NewData.append('BBS_SEQ', gBbsSeq);
		NewData.append('COMT_SEQ', ComtSeq);

		$.ajax({ url: "./Bbs_IMD.asp" ,
			method: 'POST',
			data : NewData,
			processData: false,
			contentType: false,
			cache: false,
			dataType : 'json',
			success: function(data) { 
				switch ( data.RST_NO ) {
				case "0":
					top.location.reload();
					break;
				default: alert(data.RST_NO+' 정상적으로 저장되지 않았습니다.\n솔루션 관리자게에 문의하십시오.');
					break;
				}
			},
			error: function(e) {
				alert( e.responseText );
			}
		});

	}
}

// 게시글 삭제
function fnBbsDel_M() {

	if ( confirm("게시글을 삭제하시겠습니까?") ) {
		var NewData = new FormData();
		NewData.append('sKind', 'D');
		NewData.append('BB_CODE', gBbCode);
		NewData.append('BBS_SEQ', gBbsSeq);

		$.ajax({ url: "./Bbs_IMD.asp" ,
			method: 'POST',
			data : NewData,
			processData: false,
			contentType: false,
			cache: false,
			dataType : 'json',
			success: function(data) { 
				switch ( data.RST_NO ) {
				case "0":
					fnList_S();
					break;
				default: alert(data.RST_NO+' 정상적으로 저장되지 않았습니다.\n솔루션 관리자게에 문의하십시오.');
					break;
				}
			},
			error: function(e) {
				alert( e.responseText );
			}
		});

	}
}

// 수정
function fnBbsMod_W() {
	$("#frmList").attr("action", "./Bbs_W.asp").submit();
}
// 보기
function fnBbs_V(val) {
	$("#frmList input[name='sBbsSeq']").val(val);
	$("#frmList").attr("action", "./Bbs_V.asp").submit();
}