var rePrice = /(\d+(\.\d\d)?)/;

// I hate these two global fields.
var orderData = [];

/**
 * Another hack that is a major TODO.
 * 
 * It's a search function, really. Surely there's a better way.
 */
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

function csv2datatable( sURL) {
	$.ajax(
		{
			url : sURL,
			scriptCharset : "UTF-8",
			type : "GET",
			dataType : "text",
			success : function( data, textStatus, jqXHR ) {
				var csvdata = jQuery.csv()( data );

				// The first row's not useful as it's the header row
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
					row[4] = csvdata[i][7].toLowerCase();

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

/**
 * Takes the selected items and displays a dialog containing a summary
 * of the selected items. From there, users can either get a CSV version
 * for emailing to Ace, or go back to the data table.
 */
function calculateOrder() {

	$('#dialogcontents').setTemplateURL( 'templates/ordertable.html' );
	$('#dialogcontents').processTemplate( orderData );

	$('#dialogcontents').dialog( "open" );

  /**
   * This came about after a bug report that pointed out that
   * edits to the quantities didn't stick if the user went
   * back to the data table.
   */
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

  /**
   * For any spinner that changes, recalculate the order.
   * Not overly efficient, but it's never going to be noticeable.
   */
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

		var orderTotal = 0;
		for ( var i = 0; i < orderData.length; i++ ) {
			orderTotal += ( (orderData[i]['price']*100) * orderData[i]['quantity'] );
    }

		// Add the callback
		$('#exportorder').submit(function() {
			$( '#dialogcontents' ).dialog( "close" );
			$( '#postsubmitmessage' ).dialog( "open" );
		} );

    /**
     * Get the Previews number from elsewhere in the page.
     * For the record, I don't like the next line any more than you do.
     */
    var previewsIssue = /[^\d]*(\d+)\..*/.exec( $('#nowdisplaying').text() )[1];
    var completeOrder = new Object();
    completeOrder.issue = previewsIssue;
    completeOrder.line_items = orderData;
    completeOrder.order_total = orderTotal;

    var encoded = $.toJSON( completeOrder );
    // console.log( encoded );

    // Memory fails me as to why I did it like this rather than an
    // asynchronous call
		$('#encodeddata').val( Base64.encode( encoded ) );
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
