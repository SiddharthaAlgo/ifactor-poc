# Ratings

This section list api endpoints to rate financer and supplier to each other.

## Rate Financer

This api endpoint enables Supplier to rate financer.

### HTTP Request

`POST http://ifactor.xinfin.org/rateFinancer`

### Request Details

Parameters | Arguments | Required
--------- | -------- | --------- 
invoiceId | String | Yes
financerRatings | Integer | Yes
financerRatingRemark | String | No

### Response Details

> The above command returns JSON structured like this:

```json
  {
    "status" : true
  }
```
## Rate Supplier

This api endpoint enables Financer to rate Supplier.

### HTTP Request

`POST http://ifactor.xinfin.org/rateSupplier`

### Request Details

Parameters | Arguments | Required
--------- | -------- | --------- 
invoiceId | String | Yes
supplierRatings | Integer | Yes
supplierRatingRemark | String | No

### Response Details

> The above command returns JSON structured like this:

```json
  {
    "status" : true
  }
```