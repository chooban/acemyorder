var csvdata;
var rePrice = /(\d+(\.\d\d)?)/;

var orderData = [];

// Nabbed from stack overflow
function findByPreviewsID(arr, closure, previewsId ) {
	// Set up return value.
	var retVal = -1;
	$.each(arr,function(idx, val){
		// option 2.  Run the closure:
		if ( closure( val, previewsId ) ) {
			retVal = idx;
		}
	});
	return retVal;
}

var closure = function( item, previewsId ) { 
	return item.previews == previewsId;
}

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
 
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	}
 
}

jQuery.extend({
 csv: function(delim, quote, linedelim) {
     delim = typeof delim == "string" ? new RegExp( "[" + (delim || ","   ) + "]" ) : typeof delim == "undefined" ? ","    : delim;
     quote = typeof quote == "string" ? new RegExp("^[" + (quote || '"'   ) + "]" ) : typeof quote == "undefined" ? '"'    : quote;
     lined = typeof lined == "string" ? new RegExp( "[" + (lined || "\r\n") + "]+") : typeof lined == "undefined" ? "\r\n" : lined;

     function splitline (v) {
         // Split the line using the delimitor
         var arr  = v.split(delim), out = [], q;
         for (var i=0, l=arr.length; i<l; i++) {
             if (q = arr[i].match(quote)) {
                 for (j=i; j<l; j++) {
                     if (arr[j].charAt(arr[j].length-1) == q[0]) { break; }
                 }
                 var s = arr.slice(i,j+1).join(delim);
                 out.push(s.substr(1,s.length-2));
                 i = j;
             }
             else { out.push(arr[i]); }
         }

         return out;
     }

     return function(text) {
         var lines = text.split(lined);
         for (var i=0, l=lines.length; i<l; i++) {
             lines[i] = splitline(lines[i]);
         }
         return lines;
     };
 }
});

function stringToBytes ( str ) {
  var ch, st, re = [];
  for (var i = 0; i < str.length; i++ ) {
    ch = str.charCodeAt(i);  // get char 
    st = [];                 // set up "stack"
    do {
      st.push( ch & 0xFF );  // push byte to stack
      ch = ch >> 8;          // shift value down by 1 byte
    }  
    while ( ch );
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat( st.reverse() );
  }
  // return an array of bytes
  return re;
}

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
				var buttonColTemplate = $.createTemplate( '<img id="row{$T.rowId}" class="addtoorder" src="icons/add.png" alt="Add to order"/>' );
				
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
									return $.processTemplateToText( buttonColTemplate, { rowId : oObj.iDataRow } ); 										
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
		"publisher" : aData[4]
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
	var idx = findByPreviewsID( orderData, closure, aData[0] );
	
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

function insertionSort( arr ) {
	for(var j = 1; j < arr.length; j++) {
		var key = arr[j];
		var i = j - 1;

		while(i >= 0 && arr[i] > key) {
			arr[i+1] = arr[i];
			i = i - 1;
		}
	 
		arr[i+1] = key;
	}	
	return arr;
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
		});
		
		// Turn orderData into a csv, set it in the form, submit the form
		var sCSV = '';
		var orderTotal = 0;
		
		for ( var i = 0; i < orderData.length; i++ ) {
			orderTotal += ( (orderData[i]['price']*100) * orderData[i]['quantity'] );
			sCSV += orderData[i]['previews'] + "," + orderData[i]['quantity'] + "," + orderData[i]['title'] + "," + orderData[i]['price'] + "," + orderData[i]['publisher'] + "\n";
		}
		// Let the template do the sums
		sCSV += ",,Total," + (orderTotal/100).toFixed( 2 ) + ",\n";
		sCSV += "\nGenerated by Ace My Order";
	
		$('#encodeddata').val( Base64.encode( sCSV ) );
		$('#exportorder').submit();
	} );
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
		if ( $(event.target).is( 'img.addtoorder' ) ) {
			// We're on the case
			event.stopPropagation();
			
			var elem = $( "#" + event.target.id );
			
			// Add the row to the order. The id is "row(number)"
			addToOrder( /row(\d+)/.exec( event.target.id )[1] );
			
			// Make it a delete symbol
			event.target.src = "icons/remove.png";
			
			// Change the class
			elem.removeClass( "addtoorder" );
			elem.addClass( "deletefromorder" );
		}
		else if ( $(event.target).is( 'img.deletefromorder' ) ) {
			event.stopPropagation();
			
			deleteFromOrder( /row(\d+)/.exec( event.target.id )[1] );
			
			event.target.src = "icons/add.png";
			
			// Change the class
			var elem = $( "#" + event.target.id );
			elem.removeClass( "deletefromorder" );
			elem.addClass( "addtoorder" );
		}
	});
	
	$('#dialogcontents').dialog( { 
		"modal" : true, 
		"autoOpen" : false, 
		"minWidth": 600,
	});
	
	$('#showorder').click( function( event ) {
		calculateOrder();	
	} );

} );