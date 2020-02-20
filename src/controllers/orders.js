const ordersModel = require('../models/orders');
const miscHelper = require('../helpers/helpers');
const jwt = require('jsonwebtoken');

module.exports = {
    getOrders: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];           
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        ordersModel.getOrders(userId)
        .then((result) => {
            miscHelper.response(res, result, 200);
        })
        .catch(err => console.log(err));
    },
    orderDetails: (req, res) => {
        const id = req.params.id;
        const token = req.headers.authorization.split(" ")[1];           
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        ordersModel.ordersDetail(id, userId)
        .then((result) => {
            if (result.length < 1) {
                res.json({
                    message: 'Id order tidak ditemukan'
                })
            } else {
                const order = result;
                ordersModel.ordersDetailItem(id)
                .then((result) => {
                    order[0].detailItem = result;
                    res.json({
                        data: order
                        //detail: result
                    })
                })
            }
        })
        .catch(err => console.log(err));
    },
    getTotalOrders: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];           
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        ordersModel.getTotalOrders(userId)
        .then((result) => {
            miscHelper.response(res, result, 200);
        })
        .catch(err => console.log(err));
    }
};