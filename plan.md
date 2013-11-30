# The plan

## Use Object Orientation

At the very least, the user's order should be an object. Suggested methods:

   - addToOrder
   - deleteFromOrder
   - getOrderTotal

## Local storage

Holding everything in memory is weak. By utilising local storage the user could 
add to the order over time.

## Reactive templates

If the order was made into an object, could the template for displaying the order
subscribe to it as a reactive datasource?


