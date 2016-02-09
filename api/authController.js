'use strict';

var User = require('../models/user.model.js');
var jwt = require('jsonwebtoken');
var config = require('../config');
var debug = require('debug')('authController');
exports.index = function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err) {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }

        if (!user) {
            res.json({
                success: false,
                message: 'Authentication failed. User not found.'
            });
        } else if (user) {
            user.comparePassword(req.body.password, function (err, isMatch) {
                if (err) {
                    res.status(500).json({
                        success: false,
                        message: 'Internal server error'
                    });
                }

                if (!isMatch) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication failed. Wrong password.'
                    });
                }

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                });
                debug('User info %s', user);
                // return the information including token as JSON
                res.render('transactions', {
                    token: token,
                    name: user.name,
                    use_saved_card: (user.stripe_customer_id != null ? true : false),
                    title: 'Transactions Page'
                });

            });
        }

    });
};

exports.register = function (req, res) {

    // find the user
    User.findOne({
        name: req.body.name
    }, function (err, user) {

        if (err) {
            res.json({
                success: false,
                message: 'Internal server error'
            });
        }

        if (user) {
            res.json({
                success: false,
                message: 'Register failed. Username is not free'
            });
        } else {
            user = new User({
                name: req.body.name,
                password: req.body.password
            });
            user.save(function (err) {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Registration failed'
                    });
                }

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, config.secret, {
                    expiresIn: 1440 // expires in 24 hours
                });

                // return the information including token as JSON
                res.render('transactions', {
                    token: token,
                    name: user.name,
                    use_saved_card: false,
                    title: 'Transactions Page'
                });
            });
        }

    });
};
