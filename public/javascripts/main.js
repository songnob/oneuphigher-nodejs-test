'use strict';

/*global Stripe:true*/
/*global $form:true*/

//set Public key for Stripe payments
Stripe.setPublishableKey('pk_test_milgpEkn9Fn6108VbQqE2IWW');
var isSubmit = false;
$(document).ajaxStart(function () {
    NProgress.start();
});
$(document).ajaxStop(function () {
    NProgress.done();
});
$(document).ready(function () {
    $('#submittransaction').click(function () {
        console.log($('#use_saved_card').val());
        if ($('#use_saved_card').val() == "true") {
            console.log('Using saved card');
             $('#payment-errors').hide();
            $("#payment-form :input").attr("disabled", true);
            $.ajax({
                url: '/createtransaction',
                type: 'POST',
                headers: {
                    'x-access-token': $('#token').val()
                },
                data: {
                    amount: $('#amount').val(),
                    currency: $('#currency').val(),
                    stripe_token: null,
                    remember_card: false,
                    use_saved_card: true
                }
            }).done(function (response) {
                if (response.message) {
                    $('#payment-errors').text(response.message);
                }
            }).error(function (err) {
                console.log(err);
            }).always(function ()
            {
                $('#payment-errors').show();
                $("#payment-form :input").attr("disabled", false);
            });
        } else {
            if (!isSubmit) {
                $("#payment-form :input").attr("disabled", true);
                $('#payment-errors').hide();
                Stripe.card.createToken({
                    number: $('#card-number').val(),
                    cvc: $('#card-cvc').val(),
                    exp_month: $('#card-expiry-month').val(),
                    exp_year: $('#card-expiry-year').val()
                }, function (status, response) {
                    if (response.error) {
                        // Show the errors on the form
                        $('#payment-errors').text(response.error.message);
                        $('#payment-errors').show();
                        $("#payment-form :input").attr("disabled", false);
                    } else {
                        // response contains id and card, which contains additional card details
                        var token = response.id;
                        // Insert the token into the form so it gets submitted to the server
                        //$form.append($('<input type="hidden" name="stripeToken" />').val(token));
                        // and submit
                        console.log('token: ' + token);
                        console.log('User token: ' + $('#token').val());
                        $.ajax({
                            url: '/createtransaction',
                            type: 'POST',
                            headers: {
                                'x-access-token': $('#token').val()
                            },
                            data: {
                                amount: $('#amount').val(),
                                currency: $('#currency').val(),
                                stripe_token: token,
                                remember_card: $('#remember-card').is(':checked'),
                                use_saved_card: eval($('#use_saved_card').val())
                            }
                        }).done(function (response) {
                            if (response.message) {
                                $('#payment-errors').text(response.message);                               
                            }
                            if(response.reload == true){
                                $('#use_saved_card').val('true');
                                $('#no_card').hide();
                            }
                            console.log(JSON.stringify(response));
                        }).error(function (err) {
                            console.log(err);
                        }).always(function ()
                        {
                            $('#payment-errors').show();
                            $("#payment-form :input").attr("disabled", false);
                        });
                    }

                });
            }
        }
    });
});
