$(document).ready(function() { 
});

// Enter 검색
$(document).on("keydown", ".EnterKey", function(key) {
	if ( key.keyCode == 13 ) {
		fnSearch('frmSearch', 'sGo');
	}
});

// 일자 취소
$(document).on("click", ".DtCan", function() {
	$("input[name='"+$(this).attr("rel")+"']").val('');
});


// 검색
function fnSearch( FrmNm, Go ) {
	
	$("#"+FrmNm + " input[name='sGo']").val(Go);

	$("#"+FrmNm).submit();
}

// 글쓰기
function fnBbs_W( BbCode, BbsSeq ) {
	$("#frmSearch input[name='sBbsSeq']").remove();
	fnDnyamicInput( "#frmSearch", "sBbsSeq", BbsSeq );
	$("#frmSearch").attr("action", "./Bbs_W.asp").submit();
}

// 보기
function fnView_S( BbsSeq, ViewAuth ) {

	$.ajax({ url: "./BbsHits_M.asp" ,
		method: 'POST',
		data : {BB_CODE:$("#frmSearch input[name='sBbCode']").val(), BBS_SEQ:BbsSeq},
		dataType : 'html',
		success: function(data) { 
			$("#frmSearch input[name='sBbsSeq']").remove();
			top.location.href='./Bbs_V.asp?'+$("#frmSearch").serialize()+"&sBbsSeq="+BbsSeq;			
		},
		error: function(request, status, error) {
			alert( "code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error );
		}
	});
}

// FAQ 글보기
function fnFaqView_S( BbsSeq, ViewAuth ) {
	$.ajax({ url: "./Bbs_VA.asp" ,
		method: 'POST',
		data : {sBbCode:$("#frmSearch input[name='sBbCode']").val(), sBbsSeq:BbsSeq},
		dataType : 'html',
		success: function(data) { 
			
			$("#dvFaq_"+BbsSeq).html(data);

			var RstNo = $("input[name='RST_NO_"+BbsSeq+"']").val();
			
			switch ( RstNo ) {
			case "0":
				break;
			case "1":
				alert('게시판정보가 없습니다.'); top.location.href='/'; break;
			case "2":
				alert('게시글이 없습니다.'); break;
			case "3":
				alert('로그인 후 이용이 가능합니다.'); break;
			case "4":
				alert('본인의 글만 보기가 가능합니다.'); break;
			default: alert(RstNo+' 게시판 오류.\n솔루션 관리자에게 문의하십시오.');
				break;
			}
		},
		error: function(request, status, error) {
			alert( "code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error );
		}
	});
}

// 다운로드
function fnBcdFileDown(BbsCd, BbsSeq,FileSeq) {
	var Url = "./FileDown_S.asp?BB_CODE="+BbsCd+"&BBS_SEQ="+BbsSeq+"&FILE_SEQ="+FileSeq; 
	top.downFrm.location.assign(Url);
}
// 수정
function fnBbsMod_W(BbsSeq) {
	var FrmNm = "#frmSearch";

	fnDnyamicInput( FrmNm, "sBbsSeq", BbsSeq )
	$(FrmNm).attr("action", "./Bbs_W.asp").submit();
}

// 게시글 삭제
function fnBbsDel_M(BbCode, BbsSeq) {

	if ( confirm("게시글을 삭제하시겠습니까?") ) {
		var NewData = new FormData();
		NewData.append('sKind', 'D');
		NewData.append('BB_CODE', BbCode);
		NewData.append('BBS_SEQ', BbsSeq);

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
					$("#frmSearch").submit();
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
// 카테고리 클릭
function fnBbsClassNmClick( ClassNm ) {
	$("#frmSearch input[name='sClassNm']").val(ClassNm);
	$("#frmSearch input[name='sGo']").val("1");
	$("#frmSearch").submit();
}
	