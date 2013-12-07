function CustomerOrder( issue ) {
  this.issue = issue;
  this.lineItems = [];
}

CustomerOrder.prototype = {
  findByPreviewsID:function( previewsID ) {
    var ret = -1;
    for ( var idx = 0; idx < this.lineItems.length; idx++ ) {
      if ( this.lineItems[idx].previews == previewsID ) {
        ret = idx;
        break;
      }
    }
    return ret;
  },
  addToOrder:function( lineItem ) {
    this.lineItems.push( lineItem );
//--------------------------------------------------
// 
//     this.lineItems.sort( function( a, b ) ) {
//       return a.previews.localeCompare( b.previews );
//     },
// 
//-------------------------------------------------- 
  },
  deleteFromOrder:function( previewsId ) {
    var idx = this.findByPreviewsID( previewsId );

    if ( idx > -1 ) {
      this.lineItems.splice( idx, 1 );
    }
  },
  setQuantity:function( previewsId, quantity ) {
    if ( quantity == 0 ) {
      this.deleteFromOrder( previewsId );
    }
    else {
      var idx = this.findByPreviewsID( previewsId );
      if ( idx > -1 ) {
        this.lineItems[idx].quantity = quantity;
      }
    }
  },
  setComment:function( previewsId, comment ) {
      var idx = this.findByPreviewsID( previewsId );
      if ( idx > -1 ) {
        this.lineItems[idx].comment = comment;
      }
  },
  getTotal:function() {
    var total = 0;
    for ( var i in this.lineItems ) {
      total += (this.lineItems[i].price * 100 ) * this.lineItems[i].quantity;
    }
    return total;
  },
  getNumItems:function() {
    var total = 0;
    for ( var i in this.lineItems ) {
      total += this.lineItems[i].quantity;
    }
    return total;
  },
  getNumTitles:function() {
    return this.lineItems.length;
  },
}

function LineItem( previewsID, title, price, publisher ) {
  this.previews = previewsID;
  this.title = title;
  this.price = price;
  this.publisher = publisher;
  this.quantity = 1;
  this.comment = '';
}

LineItem.prototype = {
  constructor:LineItem,
}
