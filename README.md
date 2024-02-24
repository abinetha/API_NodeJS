# E-commerce API

This project implements an e-commerce API using Node.js, Express.js, Sequelize, and PostgreSQL. The API provides endpoints for user registration, authentication, product and category listing, cart management, order processing, and more.

## Features

- User registration and authentication using JSON Web Tokens (JWT)
- Category listing and product listing with essential details
- Product details retrieval
- Cart management: add, view, update, and remove items from the cart
- Order placement and order history retrieval
- Error handling and meaningful error messages

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/abinetha/e-commerce-api.git
   ```

2. Navigate to the project directory:

   ```bash
   cd e-commerce-api
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up PostgreSQL database and configure the connection in `config.js`.

5. Start the server:

   ```bash
   node API.js
   ```

6. The server will start running on http://localhost:3000 by default.

## Usage

- **Register a new user**:
  - Send a POST request to `/register` with JSON body containing `username` and `password`.

- **Login**:
  - Send a POST request to `/login` with JSON body containing `username` and `password`. Upon successful login, you'll receive a JWT token.

- **Category Listing**:
  - Send a GET request to `/categories` to retrieve a list of categories.

- **Product Listing**:
  - Send a GET request to `/products/:categoryId` to retrieve a list of products based on category ID.

- **Product Details**:
  - Send a GET request to `/product/:productId` to retrieve detailed information about a specific product.

- **Cart Management**:
  - Add product to cart: Send a POST request to `/cart` with JSON body containing `productId` and `quantity`.
  - View cart: Send a GET request to `/cart` to retrieve the user's cart.
  - Update cart item: Send a PUT request to `/cart/:productId` with JSON body containing `quantity` to update the quantity of a product in the cart.
  - Remove item from cart: Send a DELETE request to `/cart/:productId` to remove a product from the cart.

- **Order Placement**:
  - Send a POST request to `/orders` to place an order using the products in the user's cart.

- **Order History**:
  - Send a GET request to `/orders` to retrieve the order history for the authenticated user.

- **Order Details**:
  - Send a GET request to `/orders/:orderId` to retrieve detailed information about a specific order.

## API Documentation

The API endpoints are documented using Swagger. You can view the API documentation by accessing the following URL in your browser after starting the server:

```
http://localhost:3000/api-docs
```

