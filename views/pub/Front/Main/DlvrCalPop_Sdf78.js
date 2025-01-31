$(document).ready( function() {

});



// 무게 재호출
$(document).on("change", "select[name='sCenterSeq'], select[name='sGradeNo']", function(){
	
	fnDlvrChk();

});



// 무게 요율 가져오기
function fnDlvrChk(){

	var GradeNo = $("select[name='sGradeNo']").val();

	var CenterSeq = $("select[name='sCenterSeq']").val().split("|");
	var CtrSeq	= CenterSeq[0];
	var DlvrCd	= CenterSeq[1];

	var DlvrSel = $("select[name='sDlvrMny']");
	DlvrSel.html('');
	DlvrSel.append("<option value='0'>선택</option>");

	$.ajax({ url: "/Front/Main/DlvrMny_A.asp",
		method: 'POST',
		data : {sCateSeq:CtrSeq, sDlvrWayCd:DlvrCd, sGradeNo:GradeNo},
		dataType : 'json' , 
		success: function(data) { 
			$.each(data, function(key, entry) {
				//console.log(entry.MNY + ' - ' + entry.WT);
				DlvrSel.append("<option value='"+entry.MNY+"' CrrCd='" + entry.SHIP_CRR_CD + "' CrrDigit='" + entry.SHIP_CRR_DIGIT + "' <%=fnSelBoxChk( "+entry.MNY+", sDlvrMny )%>>"+entry.WT+" "+entry.WT_NM+"</option>");
			});
		}
	});

}



// 계산
function fnDlvrMny(){

	var ChkBox = $("input[name='EtcDlvr']");
	var TotProMny = 0;
	var DetMny4 = 0, DetMny5 = 0, DetMny6 = 0;
	var TtMny1 = 0, TtMny2 = 0, TtMny3 = 0;
	var ExgRtMny = Number($("input[name='sExgRtMny']").val());

	if ( $("select[name='sItemSeq']").val() == "") {
		alert('품목을 선택해 주세요.');
		return;
	}
 
	if ( $("input[name='sTotalMny']").val() == "" || $("input[name='sTotalMny']").val() == "0" ) {
		alert('상품 총금액을 입력해 주세요.');
		return;
	}

	if ( $("select[name='sCenterSeq']").val() == "0" || $("select[name='sCenterSeq']").val() == "") {
		alert('센터를 선택해 주세요.');
		return;
	}

	if ( $("select[name='sDlvrMny']").val() == "0" || $("select[name='sDlvrMny']").val() == "" ) {
		alert('무게를 선택해 주세요.');
		return;
	}   


	// 무게별 배송비
	DetMny4 = Number($("select[name='sDlvrMny']").val()).toFixed($("select[name='sDlvrMny']").attr('CrrDigit'));
	//상품 가격 
	TotProMny = Number($("input[name='sTotalMny']").val()) * ExgRtMny;
	// 상품가격 = 상품가격 + 배송비
	TotProMny = Number(TotProMny) + Number(DetMny4);
	TotProMny = parseInt(TotProMny);


	// 구매 비용
	DetMny6   = Number(TotProMny) -Number(DetMny4);

	console.log(DetMny6);
	console.log(TotProMny);
	console.log(DetMny4);


	//기타 금액
	if (ChkBox.length == undefined) {
			if (ChkBox.checked){
				DetMny5 = DetMny5 + Number(ChkBox.value);
			}
	}
	else { 
		ChkBox.each(function(){
			if ( $(this).is(":checked")==true ){

				if ($(this).attr("CrrCd") == "1" ) {
					DetMny5 = DetMny5 + Number(this.value); 
				} else {
					DetMny5 = DetMny5 + Number(this.value) * ExgRtMny;
				}	

			}
		});
	}

	$("#DetMny4").html( gPayCrrNm + fnNumComma(DetMny4) ); // 배송비용
	$("#DetMny5").html( gPayCrrNm + fnNumComma(DetMny5) ); // 기타수수료
	$("#TtBuy1").html( gPayCrrNm + fnNumComma(DetMny6) ); // 구매비용
 
	// 예상비용
	TtMny2 = ( Number(DetMny4) + Number(DetMny5) );

	TtMny3 = Number(TtMny2);

	$("#TtMny2").html( gPayCrrNm + fnNumComma(TtMny2) ); // 부가세
	$("#TtMny3").html( "<strong class='num fc_red'>" + gPayCrrNm + fnNumComma(TtMny3) + "</span>" ); // 통관수수료

}