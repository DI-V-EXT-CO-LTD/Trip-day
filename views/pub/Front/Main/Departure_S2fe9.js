$(document).ready( function() {

	fnDepartureInit('');

});


// Ajax
function fnDepartureInit(MoveTy) {
	var oBeginDt = $("#frmSchedule input[name='sBeginDt']");

	// 달력
	$.ajax({ url: "/Front/Main/Departure_A.asp" ,
		method: 'POST',
		data : {MOVE_TY: MoveTy, BEGIN_DT: oBeginDt.val()},
		dataType : 'html',
		success: function(data) { 
			$("#ScheduleBox").html(data);
		},
		error: function(e) {
			alert( e.responseText );
		}
	});

}

// 일자 선택
function fnDepartureDay(BeginDt) {
	$("#frmSchedule input[name='sBeginDt']").val(BeginDt);

	fnDepartureInit('');
}