const cartModel = require('../models/cart');
const ordersModel = require('../models/orders');
const miscHelper = require('../helpers/helpers');
const jwt = require('jsonwebtoken');

module.exports = {
    getCart: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        cartModel.getCart(userId)
            .then((result) => {
                miscHelper.response(res, result, 200);
            })
            .catch(err => console.log(err));
    },
    cartDetail: (req, res) => {
        const id = req.params.id;
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        cartModel.cartDetail(id, userId)
            .then((result) => {
                miscHelper.response(res, result, 200);
            })
            .catch(err => console.log(err));
    },
    insertCart: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const { product_id, qty } = req.body;
        const data = {
            user_id: decoded.userId,
            product_id,
            qty,
        };

        const idProduct = req.body.product_id;
        if (data.qty < 1) {
            res.json({
                message: "Product qty tidak boleh kosong atau minus"
            })
        } else {
            cartModel.selectProduct(idProduct)
                .then((result) => {
                    const img = result[0].image;
                    const name = result[0].name;
                    if (result.length < 1) {
                        res.json({
                            message: "Product tidak ditemukan"
                        })
                    } else {
                        const stock = result[0].stock;
                        const updateStock = stock - data.qty;
                        if (updateStock < 0) {
                            res.json({
                                message: "Stock tidak mencukupi"
                            })
                        } else {
                            const price = result[0].price;
                            data.total_price = data.qty * price;
                            cartModel.updateProduct(updateStock, idProduct)
                                .then(() => {
                                    cartModel.insertCart(data)
                                        .then((result) => {
                                            const dataResponse = {id: result.insertId, ...data, name: name, image: img}
                                            miscHelper.response(res, dataResponse, 201);
                                        })
                                        .catch(err => console.log(err));
                                })
                                .catch(err => console.log(err));
                        }
                    }
                })
                .catch(err => console.log(err));
        }
    },
    updateCart: (req, res) => {
        const id = req.params.id;
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;
        const qty = req.body.qty;

        if (qty < 1) {
            res.json({
                message: "Product qty tidak boleh kosong atau minus"
            })
        } else {
            cartModel.cartDetail(id, userId)
                .then((result) => {
                    if (result.length < 1) {
                        res.json({
                            message: "Id cart tidak ditemukan"
                        });
                    } else {
                        const idProduct = result[0].product_id;
                        const oldQty = result[0].qty;
                        const newQty = qty;
                        const total_price = newQty * result[0].price
                        const data = {
                            product_id: idProduct,
                            qty: newQty,
                            total_price: total_price
                        };
                        cartModel.selectProduct(idProduct)
                            .then((result) => {
                                const img = result[0].image;
                                const name = result[0].name;
                                if (result.length < 1) {
                                    res.json({
                                        message: "Product tidak ditemukan"
                                    });
                                } else {
                                    const stock = result[0].stock;
                                    const updateStock = stock + oldQty - newQty;
                                    if (updateStock < 0) {
                                        res.json({
                                            message: "Stock tidak mencukupi"
                                        })
                                    } else {
                                        cartModel.updateProduct(updateStock, idProduct)
                                            .then(() => {
                                                cartModel.updateCart(data, id, userId)
                                                    .then((result) => {
                                                        let dataResponse = {id: id, user_id : userId, ...data, name: name, image: img}
                                                        miscHelper.response(res, dataResponse, 200);
                                                    })
                                                    .catch(err => console.log(err));
                                            })
                                            .catch(err => console.log(err));
                                    }
                                }
                            })
                            .catch(err => console.log(err));
                    }
                })
                .catch(err => console.log(err))
        }
    },
    deleteCart: (req, res) => {
        const id = req.params.id;
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;

        cartModel.cartDetail(id, userId)
            .then((result) => {
                if (result.length < 1) {
                    res.json({
                        message: "Id cart tidak ditemukan"
                    })
                } else {
                    const idProduct = result[0].product_id;
                    const qty = result[0].qty;
                    cartModel.selectProduct(idProduct)
                        .then((result) => {
                            const stock = result[0].stock;
                            const updateStock = stock + qty;
                            cartModel.updateProduct(updateStock, idProduct)
                                .then(() => {
                                    cartModel.deleteCart(id, userId)
                                        .then((result) => {
                                            miscHelper.response(res, id, 200);
                                        })
                                        .catch(err => console.log(err));
                                })
                                .catch(err => console.log(err));
                        })
                        .catch(err => console.log(err));
                }
            })
            .catch(err => console.log(err))
    },
    insertOrders: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;

        ordersModel.getTotalCart(userId)
            .then((result) => {
                if (result[0].qty === null) {
                    res.json({
                        message: "tidak ada barang pada cart"
                    })
                } else {
                    const data = {
                        user_id: userId,
                        qty: result[0].qty,
                        price: result[0].total_price
                    };
                    ordersModel.insertOrders(data)
                        .then((result) => {
                            const dataResponse = {id: result.insertId, ...data, created_at: (new Date()).toISOString(), updated_at: (new Date()).toISOString()}
                            miscHelper.response(res, dataResponse, 201);
                            let idOrders = result.insertId;
                            cartModel.getCart(userId)
                                .then((result) => {
                                    let dataCart;
                                    let idCart;
                                    let lineNbr = 1;
                                    result.forEach(dataArray => {
                                        dataCart = {
                                            id: idOrders,
                                            product_id: dataArray.product_id,
                                            qty: dataArray.qty,
                                            total_price: dataArray.total_price,
                                            line_nbr: lineNbr
                                        };
                                        idCart = dataArray.id;
                                        ordersModel.insertOrderDetails(dataCart);
                                        cartModel.deleteCart(idCart, userId);
                                        lineNbr++;
                                    });
                                })
                                .catch(err => console.log(err));
                        })
                        .catch(err => console.log(err));
                }
            })
            .catch(err => console.log(err));
    },
    cancelCart: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const userId = decoded.userId;

        cartModel.getCart(userId)
            .then((result) => {
                let idCart;
                let idProduct;
                let qty;
                result.forEach(dataArray => {
                    idProduct = dataArray.product_id
                    idCart = dataArray.id;
                    qty = dataArray.qty;
                    cartModel.selectProduct(idProduct)
                        .then((result) => {
                            const stock = result[0].stock;
                            const updateStock = stock + qty;
                            cartModel.updateProduct(updateStock, idProduct);
                        })
                        .catch(err => console.log(err));
                    cartModel.deleteCart(idCart, userId)
                        .then((result) => {
                            // miscHelper.response(res, result, 200);
                        })
                        .catch(err => console.log(err));
                });
                miscHelper.response(res, result, 200)
            })
            .catch(err => console.log(err));
    }
};