// There's got to be a better way than a global variable.
var order = new CustomerOrder();

function issueToMonth(issueNumber) {
  var months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];
  var epoch = new Date(1988, 8, 1);
  epoch.setMonth(epoch.getMonth() + issueNumber);

  return months[epoch.getMonth()] + (epoch.getFullYear() - 2000);
}

function csv2datatable(sURL) {

  $.ajax({
    url: "/api/previews/latest",
    scriptCharset: "UTF-8",
    type: "GET",
    dataType: "json",
    success: function(data, textStatus, jqXHR) {

      var previewsIssue = data.file;
      order.issue = previewsIssue;

      // Set the "Now displaying..." text
      $('#nowdisplaying').text("Displaying " + previewsIssue);
      $('#directlink').html("<a href=\"csv/" + previewsIssue + ".csv\">Direct link to csv</a>");

      var month = issueToMonth(+previewsIssue.slice(-3));

      var buttonColTemplate = $.createTemplate('<input type="checkbox" id="row{$T.rowId}" value="previews_{$T.previewsId}" class="addtoorder"/>');
      var previewsLinkTemplate = $.createTemplate('<a target="new" href="http://www.previewsworld.com/Catalog/{$T.itemID}">{$T.displayText}</a>');

      $("table#datatable").dataTable({
        data: data.contents,
        destroy: true,
        columns: [
          { data: "previewsCode",
            title: "Previews Code",
            width: "5%",
            render: function(data) {
            var id = data.slice(-4);
            return $.processTemplateToText(
              previewsLinkTemplate, {
                displayText: data,
                itemID: month + id,
              });
            }
          },
          { data: "title",
            title: "Description",
            width: "50%"
          },
          { data: "price",
            title: "Price",
            width: "5%",
            orderable: false,
            searchable: false,
            render: function(d) {
              return '&pound;' + d;
            }
          },
          { data: "reducedFrom",
            title: "Was",
            width: "5%",
            orderable: false,
            searchable: false,
            render: function(d) {
              return d ? "&pound;" + d : null;
            }
          },
          { data: "publisher",
            title: "Publisher",
            className: "publisher",
            render: function(d) {
              return d.toLowerCase();
            }
          },
          {
            title: "Include",
            className: "buttoncol",
            width: "5%",
            orderable: false,
            searchable: false,
            render: function(data, type, row, meta) {
              return $.processTemplateToText(
                buttonColTemplate, {
                  rowId: meta.row,
                  previewsId: row.previewsCode
                }
              );
            }
          }
        ],
        lengthChange: false,
        pageLength: 30
      });
    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert(errorThrown);
    }
  });
}

/**
 * This isn't anything to do with calculate much of anything
 * any more and should be renamed.
 */

function calculateTotals() {
  var formattedTotal = (order.getTotal() / 100).toFixed(2);
  $('#runningtotal').html("&pound;" + formattedTotal);
  $('#numitems').html(order.getNumItems());
  $('#numtitles').html(order.getNumTitles());
  $('#ordertotal').html(formattedTotal);
}

/**
 * Takes the selected items and displays a dialog containing a summary
 * of the selected items. From there, users can either get a CSV version
 * for emailing to Ace, or go back to the data table.
 */

function calculateOrder() {

  $('#dialogcontents').setTemplateURL('templates/ordertable.html');
  $('#dialogcontents').processTemplate(order.lineItems);
  $('#dialogcontents').dialog("open");

  // Now turn the quantity fields into spinners
  $('.spinner').spinner({
    "min": 1,
    spin: function(event, ui) {
      // The ID of the spinner holds the Previews ID
      var previewsId = /spinner_(.*)/.exec(this.id)[1];
      order.setQuantity(previewsId, ui.value);
      calculateTotals();
    },
    change: function(event, ui) {
      $('tr.orderrow').each(function(i, tr) {
        var previewsId = /row_(.*)/.exec(tr.id)[1];
        var inputs = tr.getElementsByTagName("input");
        order.setQuantity(previewsId, $(inputs[0]).spinner("value"));
      });
      calculateTotals();
    },
  });

  // And now that the button exists...
  $('#submitorder').click(function(event) {

    // Iterate through the order table, set the quantities in orderData
    $('tr.orderrow').each(function(i, tr) {
      var previewsId = /row_(.*)/.exec(tr.id)[1];
      var inputs = tr.getElementsByTagName("input");
      order.setQuantity(previewsId, $(inputs[0]).spinner("value"));
      order.setComment(previewsId, '"' + $(inputs[1]).val() + '"');
    });

    // Add the callback
    $('#exportorder').submit(function() {
      $('#dialogcontents').dialog("close");
      $('#postsubmitmessage').dialog("open");
    });

    var completeOrder = {};
    completeOrder.issue = order.issue;
    completeOrder.line_items = order.lineItems;
    completeOrder.order_total = order.getTotal();

    var encoded = JSON.stringify(completeOrder);

    // Memory fails me as to why I did it like this rather than an
    // asynchronous call
    $('#encodeddata').val(Base64.encode(encoded));
    $('#exportorder').submit();
  });

  $('table#complete_order_form').click(function(event) {
    if ($(event.target).is('input.delete_from_order')) {
      event.stopPropagation();
      var previewsId = /id_(.*)/.exec(event.target.id)[1];
      order.deleteFromOrder(previewsId);
      calculateTotals();

      /**
       * This is some funkery that swaps classes around so
       * that items that have been deleted from the order
       * are no longer selected.
       */
      var elem = $("input:checkbox[value='previews_" + previewsId + "']");
      elem.removeClass("deletefromorder");
      elem.addClass("addtoorder");
      elem.attr('checked', false);

      $(event.target).closest('tr').remove();
    }
  });
}

$(document).ready(function() {
  csv2datatable();

  $('table#datatable').click(function(event) {
    var table = $("table#datatable").dataTable().api();

    if ($(event.target).is('input.addtoorder')) {
      event.stopPropagation();

      var row = table.rows(/row(\d+)/.exec(event.target.id)[1]).data();
      var data = row[0];

      var lineItem = new LineItem(
        data.previewsCode,
        data.title,
        parseFloat(data.price),
        data.publisher
      );
      order.addToOrder(lineItem);

      // Check the checkbox
      var elem = $("#" + event.target.id);
      elem.checked = true;
      elem.removeClass("addtoorder");
      elem.addClass("deletefromorder");
    }
    else if ($(event.target).is('input.deletefromorder')) {
      event.stopPropagation();
      var row = table.rows(/row(\d+)/.exec(event.target.id)[1]).data();
      var data = row[0];
      order.deleteFromOrder(data.previewsCode);

      // Change the class so that we can toggle orders.
      var elem = $("#" + event.target.id);
      elem.removeClass("deletefromorder");
      elem.addClass("addtoorder");
      elem.checked = false;
    }
    calculateTotals();
  });

  $('#dialogcontents').dialog({
    modal: true,
    autoOpen: false,
    minWidth: 800,
    beforeClose: function(event, ui) {
      // On close, update quantities and comments
      $('tr.orderrow').each(function(i, tr) {
        var previewsId = /row_(.*)/.exec(tr.id)[1];
        var inputs = tr.getElementsByTagName("input");
        var quantity = $(inputs[0]).spinner("value");
        order.setQuantity(previewsId, quantity);
        order.setComment(previewsId, $(inputs[1]).val());
      });
      calculateTotals();
      return true;
    },
  });

  $('#postsubmitmessage').dialog({
    modal: true,
    autoOpen: false,
  });

  $('#showorder').click(function(event) {
    calculateOrder();
  });

});
