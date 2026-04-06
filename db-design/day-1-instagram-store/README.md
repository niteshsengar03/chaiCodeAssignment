# ER Diagram Design for Thrift / Handmade Store

So i designed a database for a small instagram store which sells thrifted and handmade items.  
At starting it was small but later it grows so we need proper system to manage products, orders, payments etc.

if you are facing any probmlem in viewing the image then i have attached a .dbml file you can copy paste the code in your eraser.io
---

## Entities

### Customer
- customer_id (PK)
- name  
- contact_info  
- address  

one customer can place multiple orders.

---

### Product
- product_id (PK)
- name  
- description  
- category  
- type (thrift / handmade)  
- price  

type is important because thrift items are mostly single piece and handmade can have multiple.

---

### Inventory (Product Variant)
- inventory_id (PK)
- product_id (FK)
- size  
- color  
- condition  
- quantity  

this table handles stock.

for thrift:
- only 1 quantity
- condition is important

for handmade:
- can have multiple quantity
- can have diff sizes/colors

one product can have many inventory entries.

---

### Order
- order_id (PK)
- customer_id (FK)
- order_date  
- total_amount  
- payment_status  
- shipping_status  

each order belongs to one customer.

---

### OrderItem
- order_item_id (PK)
- order_id (FK)
- inventory_id (FK)
- quantity  
- price  

this is used because:
one order can have multiple products  
and one product can be in multiple orders  

so this solves many to many.

---

### Payment
- payment_id (PK)
- order_id (FK)
- payment_date  
- amount  
- method  
- status  

used to track if order is paid or not.

---

### Shipment
- shipment_id (PK)
- order_id (FK)
- shipped_date  
- delivered_date  
- status  
- tracking_number  

used to track delivery.

one order can have multiple shipments also sometimes.

---

## Relationships

- customer -> orders (1:N)
- order -> order_items (1:N)
- product -> inventory (1:N)
- inventory -> order_items (1:N)
- order -> payment (1:1 or 1:N)
- order -> shipment (1:N)

---

## Notes / Thinking

- kept product and inventory separate because thrift and handmade are diff
- inventory handles stock + variants
- order_items is important for many-to-many
- payment and shipment separated to keep things clean
- tried to keep it simple will improve in next one also will try to add more colors and icons 

---

## ER Diagram (eraser.io)

