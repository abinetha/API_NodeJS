// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Initialize Express app
const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());

// Sequelize configuration
const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'postgres',
  host: 'localhost',
  port: 5432,
});

// Define models for Product, Category, User, Cart, and Order
const Product = sequelize.define('Product', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: DataTypes.TEXT,
  availability: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
});

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Cart = sequelize.define('Cart', {
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
});

const Order = sequelize.define('Order', {
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
  },
});

// Define associations between models
Category.hasMany(Product);
Product.belongsTo(Category);

User.hasMany(Order);
Order.belongsTo(User);

User.hasOne(Cart);
Cart.belongsTo(User);

Product.belongsToMany(Order, { through: 'OrderItem' });
Order.belongsToMany(Product, { through: 'OrderItem' });

// Database synchronization
(async () => {
  await sequelize.sync();
  console.log('Database synchronized');
})();

// API Endpoints
// Register a new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid username or password');
    }
    const token = jwt.sign({ userId: user.id }, 'secretKey');
    res.json({ token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ error: 'Token is required' });

  jwt.verify(token, 'secretKey', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Unauthorized' });
    req.userId = decoded.userId;
    next();
  });
};

// Protected routes
app.use(verifyToken);

// Category Listing
app.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product Listing
app.get('/products/:categoryId', async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const products = await Product.findAll({ where: { categoryId } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product Details
app.get('/product/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findByPk(productId);
    if (!product) throw new Error('Product not found');
    res.json(product);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Cart Management
// Add product to cart
app.post('/cart', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    await cart.addProduct(productId, { through: { quantity } });
    res.status(201).json({ message: 'Product added to cart successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// View cart
app.get('/cart', async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.userId }, include: Product });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update cart item
app.put('/cart/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const productId = req.params.productId;
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    await cart.addProduct(productId, { through: { quantity } });
    res.json({ message: 'Cart updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove item from cart
app.delete('/cart/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const cart = await Cart.findOne({ where: { userId: req.userId } });
    await cart.removeProduct(productId);
    res.json({ message: 'Product removed from cart successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Order Placement
app.post('/orders', async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { userId: req.userId }, include: Product });
    const order = await Order.create({ status: 'pending', UserId: req.userId });
    await order.addProducts(cart.Products, { through: { quantity: cart.quantity } });
    await cart.setProducts([]);
    res.status(201).json({ message: 'Order placed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Order History
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.findAll({ where: { userId: req.userId }, include: Product });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Order Details
app.get('/orders/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findByPk(orderId, { include: Product });
    if (!order) throw new Error('Order not found');
    res.json(order);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Hashing Password
const hashPassword = (password) => {
  // Implement your hashing algorithm here (e.g., bcrypt)
  return password; // For demonstration purpose only, replace with actual hashing
};

// Compare Password
const comparePassword = (password, hashedPassword) => {
  // Implement your password comparison logic here (e.g., bcrypt)
  return password === hashedPassword; // For demonstration purpose only, replace with actual comparison
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
