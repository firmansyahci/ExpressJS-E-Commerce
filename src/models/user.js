const connection = require('../configs/db');

module.exports = {
    getUser: () => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM user", (err, result) => {
                if (!err) {
                    resolve(result);
                } else {
                    reject(new Error(err));
                }
            });
        });
    },
    insertUser: (data) => {
        return new Promise((resolve, reject) => {
            connection.query("INSERT INTO user SET ?", data, (err, result) => {
                if (!err) {
                    resolve(result);
                } else {
                    reject(new Error(err));
                }
            });
        });
    },
    loginUser: (email) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT * FROM user WHERE email = ?", email, (err, result) => {
                if (!err) {
                    resolve(result);
                } else {
                    reject(new Error(err));
                }
            });
        });
    }
}