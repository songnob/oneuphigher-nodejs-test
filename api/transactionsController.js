'use strict';
var Transactions = require('../models/transactions.model.js');
var User = require('../models/user.model.js');
var config = require('../config');
var Stripe = require('stripe')(config.stripeApiKey);
var debug = require('debug')('stripe-transaction');
exports.index = function (req, res, next) {
    if (req.body) {
        var transaction = new Transactions({
            name: req.body.name
        });
        transaction.save(function (err, trans) {
            if (err) {
                return console.log(err);
            }
            res.status(200).end();
        });
    }
};
exports.createTransaction = function (req, res, next) {
    var loggedUser = req.decoded._doc;
    var fakeEmail = loggedUser.name + '@payment.oneuphigher.com';
    debug('Using saved card %s', JSON.stringify(req.body));
    if (eval(req.body.use_saved_card) == true) {
        User.findOne({
            name: loggedUser.name
        }, function (err, user) {
            if (err) {
                // do something
            }
            if (!user) {
                // do something
            } else if (user) {
                debug('User stripe customer id: %s', user.stripe_customer_id);
                Stripe.charges.create({
                    amount: req.body.amount,
                    currency: req.body.currency,
                    customer: user.stripe_customer_id,
                    description: 'Charge for ' + fakeEmail
                }, function (err, charge) {
                    if (err) {
                        res.status(200).json({success: false, message: err.raw.message});
                    } else {
                        var transaction = new Transactions({
                            transactionId: charge.id,
                            amount: charge.amount,
                            created: charge.created,
                            currency: charge.currency,
                            description: charge.description,
                            paid: charge.paid,
                            sourceId: charge.source.id
                        });
                        transaction.save(function (err) {
                            if (err) {
                                return res.status(500);
                            } else {
                                res.status(200).json({
                                    message: 'Payment is created.'
                                });
                            }
                        });
                    }
                    // asynchronously called
                });
            }
        });

    } else {
        debug('value of remember_card %s', req.body.remember_card);
        if (eval(req.body.remember_card) == true) {
            debug('Remember card is choosing');
            Stripe.customers.create(
                    {card: req.body.stripe_token, email: fakeEmail},
                    function (err, customer) {
                        if (err) {
                            // do something
                        } else {
                            debug('Stripe customer id %s', customer.id);
                            User.findOne({
                                name: loggedUser.name
                            }, function (err, user) {
                                if (err) {
                                    // do something
                                }
                                if (!user) {
                                    // do something
                                } else if (user) {
                                    user.stripe_customer_id = customer.id;
                                    user.save(function (err) {
                                        if (err != null) {
                                            debug('Save user credit card ok');
                                        }
                                    });
                                }
                            });
                            Stripe.charges.create({
                                amount: req.body.amount,
                                currency: req.body.currency,
                                customer: customer.id,
                                description: 'Charge for ' + fakeEmail
                            }, function (err, charge) {
                                if (err) {
                                    res.status(200).json({success: false, message: err.raw.message});
                                } else {
                                    var transaction = new Transactions({
                                        transactionId: charge.id,
                                        amount: charge.amount,
                                        created: charge.created,
                                        currency: charge.currency,
                                        description: charge.description,
                                        paid: charge.paid,
                                        sourceId: charge.source.id
                                    });
                                    transaction.save(function (err) {
                                        if (err) {
                                            return res.status(500);
                                        } else {
                                            res.status(200).json({
                                                message: 'Payment is created.',
                                                reload: true
                                            });
                                        }
                                    });
                                }                               
                            });
                        }
                    }
            );
        } else {
            debug('Using card number input');
            Stripe.charges.create({
                amount: req.body.amount,
                currency: req.body.currency,
                source: req.body.stripe_token,
                description: 'Charge for ' + fakeEmail
            }, function (err, charge) {
                if (err) {
                    res.status(200).json({success: false, message: err.raw.message});
                } else {
                    var transaction = new Transactions({
                        transactionId: charge.id,
                        amount: charge.amount,
                        created: charge.created,
                        currency: charge.currency,
                        description: charge.description,
                        paid: charge.paid,
                        sourceId: charge.source.id
                    });
                    transaction.save(function (err) {
                        if (err) {
                            return res.status(500);
                        } else {
                            res.status(200).json({
                                message: 'Payment is created.'
                            });
                        }
                    });
                }
            });
        }
    }
};
