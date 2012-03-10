var csvdata;
var rePrice = /(\d+(\.\d\d)?)/;

var orderData = [];

function findByPreviewsID(arr, previewsId ) {
	// Set up return value.
	var retVal = -1;
	$.each(arr,function(idx, val){
		if ( val.previews == previewsId ) {
			retVal = idx;
		}
	});
	return retVal;
}


jQuery.extend({
	csv : function(delim, quote, linedelim) {
		delim = typeof delim == "string" ? new RegExp("[" + (delim || ","   ) + "]") : typeof delim == "undefined" ? "," : delim;
		quote = typeof quote == "string" ? new RegExp("^[" + (quote || '"'   ) + "]") : typeof quote == "undefined" ? '"' : quote;
		lined = typeof lined == "string" ? new RegExp("[" + (lined || "\r\n") + "]+") : typeof lined == "undefined" ? "\r\n" : lined;

		function splitline(v) {
			// Split the line using the delimitor
			var arr = v.split(delim), out = [], q;
			for(var i = 0, l = arr.length; i < l; i++) {
				if( q = arr[i].match(quote)) {
					for( j = i; j < l; j++) {
						if(arr[j].charAt(arr[j].length - 1) == q[0]) {
							break;
						}
					}
					var s = arr.slice(i, j + 1).join(delim);
					out.push(s.substr(1, s.length - 2));
					i = j;
				} else {
					out.push(arr[i]);
				}
			}

			return out;
		}

		return function(text) {
			var lines = text.split(lined);
			for(var i = 0, l = lines.length; i < l; i++) {
				lines[i] = splitline(lines[i]);
			}
			return lines;
		};
	}
});


function csv2datatable( sURL ) {
	$.ajax(
		{
			url : sURL,
			scriptCharset : "UTF-8",
			type : "GET",
			dataType : "text",
			success : function( data, textStatus, jqXHR ) {
				csvdata = jQuery.csv()( data );

				// The first row's not useful
				csvdata.pop();

				var row;
				var was;
				var match;
				var buttonColTemplate = $.createTemplate( '<input type="checkbox" id="row{$T.rowId}" value="previews_{$T.previewsId}" class="addtoorder"/>' );

				for ( var i = 0; i < csvdata.length; i++ ) {
					row = new Array();

					// Previews code
					row[0] = csvdata[i][0];

					// Title
					row[1] = csvdata[i][1];

					// Price
					if ( csvdata[i][3] != null ) {
						row[2] = parseFloat( csvdata[i][3] );
					}
					else {
						row[2] = "";
					}

					// Reduced from
					was = csvdata[i][5];
					if ( was.length > 0 ) {
						match = rePrice.exec( was );
						row[3] = match[1];
					}
					else {
						row[3] = "";
					}

					// Publisher
					row[4] = csvdata[i][6].toLowerCase();

					// What will eventually be the button
					row[5] = "";

					// Now overwrite the row in the array
					csvdata[i] = row;
				}

				$("table#datatable").dataTable( {
						"aaData": csvdata,
						"iDisplayLength" : 30,
						"bAutoWidth" : false,
						"bDestroy" : true,
						"aoColumnDefs" : [
							{
								"aTargets" : [ "description" ],
								"sWidth" : "50%",
							},
							{
								"aTargets": [ "publisher" ],
								"sWidth" : "20%",
								"sClass" : "publisher",
							},
							{
								"aTargets": [ "price", "reduced", "previews", "buttoncol" ],
								"sWidth" : "5%",
							},
							{
								"aTargets" : [ "price", "reduced", "buttoncol" ],
								"bSortable" : false,
							},
							{
								"aTargets" : [ "price" ],
								"fnRender" : function( oObj ) {
									return "&pound;" + oObj.aData[2];
								},
							},
							{
								"aTargets" : [ "reduced" ],
								"fnRender" : function( oObj ) {
									return ( oObj.aData[3] != "" ? "&pound;" + oObj.aData[3] : "" );
								},
							},
							{
								"aTargets" : [ "buttoncol" ],
								"fnRender" : function( oObj ) {
									return $.processTemplateToText( 
										buttonColTemplate, 
										{ rowId : oObj.iDataRow,
										  previewsId : oObj.aData[0] } 
									);
								},
								"sClass" : "buttoncol",
							}
						],

					}
				);
			},
			error : function( jqXHR, textStatus, errorThrown ) {
				alert( errorThrown );
			}
		}
	);
}

function addToOrder( iRow ) {
	var table = $("table#datatable").dataTable( {
		"bRetrieve": true,
	} );
	var aData = table.fnGetData( iRow );
	var price = parseFloat( /&pound;(.*)/.exec( aData[2] )[1] );

	orderData.push( {
		"previews" : aData[0],
		"quantity" : 1,
		"title" : aData[1],
		"price" : price,
		"publisher" : aData[4],
		"comment": ''
	});

	orderData.sort( function( a, b ) {
		return a.previews.localeCompare( b.previews );
	});

	calculateTotals();
}

function deleteFromOrder( iRow ) {
	var table = $("table#datatable").dataTable( {
		"bRetrieve": true,
	} );
	var aData = table.fnGetData( iRow );
	var idx = findByPreviewsID( orderData, aData[0] );

	if ( idx > -1 ) {
		orderData.splice( idx, 1 );
	}

	calculateTotals();
}

function calculateTotals() {
	var totalCost = 0;
	var numItems = 0;
	var numTitles = 0;

	var lineData;
	for ( var i in orderData ) {
		lineData = orderData[i];
		numItems += lineData.quantity;
		numTitles++;
		totalCost += (lineData.price * 100) * lineData.quantity;
	}

	$('#runningtotal').html( "&pound;" + (totalCost/100).toFixed( 2 ) );
	$('#numitems').html( numItems );
	$('#numtitles').html( numTitles );
	$('#ordertotal').html( (totalCost/100).toFixed( 2 ) );
}

function calculateOrder() {

	$('#dialogcontents').setTemplateURL( 'templates/ordertable.html' );
	$('#dialogcontents').processTemplate( orderData );

	$('#dialogcontents').dialog( "open" );
	$( '#dialogcontents' ).bind( "dialogbeforeclose",
		function(event, ui) {
			// On close, update quantities
			$('tr.orderrow').each(
				function( i, tr ) {
					var inputs = tr.getElementsByTagName( "input" );
					var quantity = $( inputs[0] ).spinner( "value" );
					orderData[i].quantity = quantity;
					
					orderData[i].comment = $( inputs[1] ).val();
				}
			)
			calculateTotals();
			return true;
		}
	);

	// Now turn the quantity fields into spinners
	$('.spinner').spinner( {
		"min" : 1,
	});
	
	$('.spinner').change( function () {
		$('tr.orderrow').each( function( i, tr ) {
			var inputs = tr.getElementsByTagName( "input" );
			orderData[i].quantity = $( inputs[0] ).spinner( "value" );
		});
		calculateTotals();
	})

	// And now that the button exists...
	$('#submitorder').click( function( event ) {

		// Iterate through the order table, set the quantities in orderData
		$('tr.orderrow').each( function( i, tr ) {
			var inputs = tr.getElementsByTagName( "input" );
			orderData[i].quantity = $( inputs[0] ).spinner( "value" );
			orderData[i].comment = '"' + $( inputs[1] ).val() + '"';
		});

		// Turn orderData into a csv, set it in the form, submit the form
		var sCSV = 'Previews Code,Quantity,Title,Price,Publisher,Comment\n';
		var orderTotal = 0;

		for ( var i = 0; i < orderData.length; i++ ) {
			orderTotal += ( (orderData[i]['price']*100) * orderData[i]['quantity'] );
			sCSV += orderData[i]['previews'] + ",";
			sCSV += orderData[i]['quantity'] + ",";
			sCSV += orderData[i]['title'] + ",";
			sCSV += orderData[i]['price'] + ",";
			sCSV += orderData[i]['publisher'] + ",";
			sCSV += orderData[i]['comment'] + "\n";
		}
		
		// Let the template do the sums
		sCSV += ",,Total," + (orderTotal/100).toFixed( 2 ) + ",\n";
		sCSV += "\nGenerated by Ace My Order";

		$('#encodeddata').val( Base64.encode( sCSV ) );
		
		// Add the callback
		$('#exportorder').submit(function() {
			$( '#dialogcontents' ).dialog( "close" );
			$( '#postsubmitmessage' ).dialog( "open" );
		} );
		
		// Submit the form
		$('#exportorder').submit();
	} );
	
	$( 'table#complete_order_form').click( function( event ) {
		if ( $(event.target).is( 'input.delete_from_order') ) {
			event.stopPropagation();
			var previewsId = /id_(.*)/.exec( event.target.id )[1];
			
			var idx = findByPreviewsID( orderData, previewsId );

			if ( idx > -1 ) {
				orderData.splice( idx, 1 );
			}
			calculateTotals();
			
			var elem = $( "input:checkbox[value='previews_" + previewsId + "']" );
			elem.removeClass( "deletefromorder" );
			elem.addClass( "addtoorder" );
			elem.attr( 'checked', false );
			
			$( event.target ).closest( 'tr' ).remove();
		}
	});
}

$(document).ready( function() {
	$.ajax(
		{
			url: "csvfilter.php",
			dataType : "json",
			success : function( data, textstatus, jqXHR ) {
				var file = data['files'];
				csv2datatable( "csv/" + file );

				// Set the "Now displaying..." text
				$('#nowdisplaying').text( "Displaying " + file );
				$('#directlink').html( "<a href=\"csv/" + file + "\">Direct link to csv</a>" );
			}
		}
	);

	$('table#datatable').click( function(event) {
		if ( $(event.target).is( 'input.addtoorder' ) ) {
			// We're on the case
			event.stopPropagation();

			// Add the row to the order. The id is "row(number)"
			addToOrder( /row(\d+)/.exec( event.target.id )[1] );

			// Check the checkbox
			var elem = $( "#" + event.target.id );
			elem.checked = true;
			elem.removeClass( "addtoorder" );
			elem.addClass( "deletefromorder" );
		}
		else if ( $(event.target).is( 'input.deletefromorder' ) ) {
			event.stopPropagation();

			deleteFromOrder( /row(\d+)/.exec( event.target.id )[1] );

			// Change the class
			var elem = $( "#" + event.target.id );
			elem.removeClass( "deletefromorder" );
			elem.addClass( "addtoorder" );
			elem.checked = false;
		}
	});

	$('#dialogcontents').dialog( {
		"modal" : true,
		"autoOpen" : false,
		"minWidth": 800,
	});
	
	$('#postsubmitmessage').dialog( {
		"modal" : true,
		"autoOpen" : false,
	});

	$('#showorder').click( function( event ) {
		calculateOrder();
	} );

} );