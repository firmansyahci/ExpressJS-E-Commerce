const express = require('express');
const orderController = require('../controllers/orders');
const Router = express.Router();
const checkAuth = require('../helpers/auth');

Router.get('/', checkAuth, orderController.getOrders)
.get('/all', checkAuth, orderController.getTotalOrders)
.get('/:id', checkAuth, orderController.orderDetails);

module.exports = Router;