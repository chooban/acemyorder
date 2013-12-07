// There's got to be a better way than a global variable.
var order = new CustomerOrder();

function csv2datatable( sURL ) {
	$.ajax(
		{
			url : "csvfilter.php",
			scriptCharset : "UTF-8",
			type : "GET",
			dataType : "json",
			success : function( data, textStatus, jqXHR ) {

        var previewsIssue = data['file'];
        order.issue = previewsIssue;

	 			// Set the "Now displaying..." text
	 			$('#nowdisplaying').text( "Displaying " + previewsIssue );
	 			$('#directlink').html( "<a href=\"csv/" + previewsIssue + ".csv\">Direct link to csv</a>" );
				var csvdata = jQuery.csv()( data['contents'] );

				// The first row's not useful as it's the header row
				csvdata.pop();

				var row;
				var was;
				var match;
				var buttonColTemplate = $.createTemplate( '<input type="checkbox" id="row{$T.rowId}" value="previews_{$T.previewsId}" class="addtoorder"/>' );

				for ( var i = 0; i < csvdata.length; i++ ) {
					row = new Array();

					// Previews code
					// Title
					// Price
					row[0] = csvdata[i][0];
					row[1] = csvdata[i][1];
					row[2] = csvdata[i][3] != null ? parseFloat( csvdata[i][3] ) : "";

					// Reduced from
					was = csvdata[i][5];
					if ( was.length > 0 ) {
						match = /(\d+(\.\d\d)?)/.exec( was );
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

/**
 * This isn't anything to do with calculate much of anything 
 * any more and should be renamed.
 */
function calculateTotals() {
  var formattedTotal = (order.getTotal()/100).toFixed( 2 );
	$('#runningtotal').html( "&pound;" + formattedTotal );
	$('#numitems').html( order.getNumItems() );
	$('#numtitles').html( order.getNumTitles() );
	$('#ordertotal').html( formattedTotal );
}

/**
 * Takes the selected items and displays a dialog containing a summary
 * of the selected items. From there, users can either get a CSV version
 * for emailing to Ace, or go back to the data table.
 */
function calculateOrder() {

	$('#dialogcontents').setTemplateURL( 'templates/ordertable.html' );
	$('#dialogcontents').processTemplate( order.lineItems );
	$('#dialogcontents').dialog( "open" );

	// Now turn the quantity fields into spinners
	$('.spinner').spinner( {
		"min" : 1,
    spin:function( event, ui ) {
      // The ID of the spinner holds the Previews ID
      var previewsId = /spinner_(.*)/.exec( this.id )[1];
      order.setQuantity( previewsId, ui.value );
      calculateTotals();
    },
    change:function( event, ui ) {
      $('tr.orderrow').each( function( i, tr ) {
        var previewsId = /row_(.*)/.exec( tr.id )[1];
        var inputs = tr.getElementsByTagName( "input" );
        order.setQuantity( previewsId, $( inputs[0] ).spinner( "value" ) );
      });
      calculateTotals();
    },
	});

	// And now that the button exists...
	$('#submitorder').click( function( event ) {

		// Iterate through the order table, set the quantities in orderData
		$('tr.orderrow').each( function( i, tr ) {
			var previewsId = /row_(.*)/.exec( tr.id )[1];
			var inputs = tr.getElementsByTagName( "input" );
			order.setQuantity( previewsId, $( inputs[0] ).spinner( "value" ) );
      order.setComment( previewsId, '"' + $( inputs[1] ).val() + '"' );
		});

		// Add the callback
		$('#exportorder').submit(function() {
			$( '#dialogcontents' ).dialog( "close" );
			$( '#postsubmitmessage' ).dialog( "open" );
		} );

    var completeOrder = new Object();
    completeOrder.issue = order.issue;
    completeOrder.line_items = order.lineItems;
    completeOrder.order_total = order.getTotal();

    var encoded = $.toJSON( completeOrder );

    // Memory fails me as to why I did it like this rather than an
    // asynchronous call
		$('#encodeddata').val( Base64.encode( encoded ) );
		$('#exportorder').submit();
	} );
	
	$( 'table#complete_order_form').click( function( event ) {
		if ( $(event.target).is( 'input.delete_from_order') ) {
			event.stopPropagation();
			var previewsId = /id_(.*)/.exec( event.target.id )[1];
			order.deleteFromOrder( previewsId );
			calculateTotals();
		
      /**
       * This is some funkery that swaps classes around so 
       * that items that have been deleted from the order
       * are no longer selected.
       */
			var elem = $( "input:checkbox[value='previews_" + previewsId + "']" );
			elem.removeClass( "deletefromorder" );
			elem.addClass( "addtoorder" );
			elem.attr( 'checked', false );
			
			$( event.target ).closest( 'tr' ).remove();
		}
	});
}

$(document).ready( function() {
  csv2datatable();

	$('table#datatable').click( function(event) {
    var table = $("table#datatable").dataTable( {
      "bRetrieve": true,
    } );

		if ( $(event.target).is( 'input.addtoorder' ) ) {
			// We're on the case
			event.stopPropagation();

      var aData = table.fnGetData( /row(\d+)/.exec( event.target.id )[1] );

			// Add the row to the order. The id is "row(number)"
      var price = parseFloat( /&pound;(.*)/.exec( aData[2] )[1] );

      var lineItem = new LineItem( aData[0], aData[1], price, aData[4] );
      order.addToOrder( lineItem );

			// Check the checkbox
			var elem = $( "#" + event.target.id );
			elem.checked = true;
			elem.removeClass( "addtoorder" );
			elem.addClass( "deletefromorder" );
		}
		else if ( $(event.target).is( 'input.deletefromorder' ) ) {
			event.stopPropagation();
      var aData = table.fnGetData( /row(\d+)/.exec( event.target.id )[1] );
      order.deleteFromOrder( aData[0] );

			// Change the class so that we can toggle orders.
			var elem = $( "#" + event.target.id );
			elem.removeClass( "deletefromorder" );
			elem.addClass( "addtoorder" );
			elem.checked = false;
		}
    calculateTotals();
	});

	$('#dialogcontents').dialog( {
		"modal" : true,
		"autoOpen" : false,
		"minWidth": 800,
    beforeClose:function(event, ui) {
			// On close, update quantities and comments
			$('tr.orderrow').each(
				function( i, tr ) {
          var previewsId = /row_(.*)/.exec( tr.id )[1];
					var inputs = tr.getElementsByTagName( "input" );
					var quantity = $( inputs[0] ).spinner( "value" );
					order.setQuantity( previewsId, quantity );
					order.setComment( previewsId,  $( inputs[1] ).val() );
				}
			)
			calculateTotals();
			return true;
		},
	});
	
	$('#postsubmitmessage').dialog( {
		"modal" : true,
		"autoOpen" : false,
	});

	$('#showorder').click( function( event ) {
		calculateOrder();
	} );

} );
