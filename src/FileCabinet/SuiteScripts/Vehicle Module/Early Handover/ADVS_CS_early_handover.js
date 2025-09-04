/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/https'],

    function (url, https) {

        function pageInit(scriptContext) {
            console.log("pageInit triggered");
            // Attach click event to the button
            $('.submit-btn').on('click', function () {
                console.log("Submit button clicked!");
                var TransactionId = $('#custpage_transaction_id').val();

                const $btn = $(this);
                $btn.html('Submitting Handover Request...').addClass('btn-spinner').prop('disabled', true);
                // Get the whole form HTML with filled data
                const form = document.getElementById("handoverFormDiv");
                if (!form) {
                    alert("Form not found!");
                    return;
                }

                const data = {
                    // Customer & Vehicle Information
                    TransactionId:TransactionId,
                    epo_vpa: $('input[name="epo_vpa"]').val(),
                    vpa_id: $('input[name="vpa_id"]').val(),
                    purchaser_name: $('input[name="purchaser_name"]').val(),
                    purchaser_id: $('input[name="purchaser_id"]').val(),
                    car_brand: $('input[name="car_brand"]').val(),
                    subsidiary_id: $('input[name="subsidiary_id"]').val(),
                    car_vsa: $('input[name="car_vsa"]').val(),
                    current_reg: $('input[name="current_reg"]').val(),
                    handover_date: $('input[name="handover_date"]').val(),
                    handover_time: $('input[name="handover_time"]').val(),
                    handover_location: $('#custpage_location').val(),

                    status_no_topup: $('input[name="status_no_topup"]').is(':checked'),
                    status_topup: $('input[name="status_topup"]').is(':checked'),

                    // Financial Information
                    vpa_trade_value: $('input[name="vpa_trade_value"]').val(),
                    overtrade_amount: $('input[name="overtrade_amount"]').val(),
                    full_settlement: $('input[name="full_settlement"]').val(),
                    settlement_expiry: $('input[name="settlement_expiry"]').val(),
                    settlement_bank: $('#custpage_bank').val(),
                    net_balance: $('input[name="net_balance"]').val(),
                    // balance summary
                    balance_available_overtrade: $('input[name="balance_available_overtrade"]').val(),
                    balance_overtrade_amount: $('input[name="balance_overtrade_amount"]').val(),
                    balance_before_registration: $('input[name="balance_before_registration"]').val(),
                    amount_transfer_new_car: $('input[name="amount_transfer_new_car"]').val(),
                    balance_after_registration: $('input[name="balance_after_registration"]').val(),
                    //Payment
                    top_up_cheque: $('input[name="top_up_cheque"]').val(),
                    third_party: $('input[name="third_party"]').val(),

                    special_notes: $('textarea[name="special_notes"]').val()
                };

                console.log("Collected Data:", data);
                const summaryHtml = buildSummaryHTML(data);

                // Send to Suitelet
                $.ajax({
                    url: window.location.href,
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        html: summaryHtml,
                        formData: data
                    }),
                    dataType: 'json',
                    success: function (data) {
                        if (data.success) {
                            showNotification('Email has been trigger sucessfull for Early Handover.', 'success');
                            $btn.removeClass('btn-spinner');
                            setTimeout(function () {
                                
                                window.parent.closePopup();
                                if (window.parent && typeof window.parent.location.reload === 'function') {
                                    window.parent.location.reload();
                                }
                            }, 1000);
                        } else {
                            showNotification('Error accepting Handover: ' + data.error, 'error');
                            $btn.html('Submit Handover Request').removeClass('btn-spinner').prop('disabled', false);

                        }
                    },
                    error: function (xhr, status, error) {
                        alert('Error accepting ROC:', error);
                    }
                });
            });

        }

        // Example summary builder
        function buildSummaryHTML(data) {
            return `
        <h2>New Early Handover Submission</h2>
        <p><b>Form submitted on:</b> ${new Date().toLocaleString()}</p>

         <ul>
            <li><b>No Top Up for Settlement:</b> ${data.status_no_topup ? "Yes" : "No"}</li>
            <li><b>Top Up Required:</b> ${data.status_topup ? "Yes" : "No"}</li>
        </ul>
        <h3>Customer & Vehicle Information</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%;">
            <tr><td><b>EPO VPA no.</b></td><td>${data.epo_vpa}</td></tr>
            <tr><td><b>Purchaser name</b></td><td>${data.purchaser_name}</td></tr>
            <tr><td><b>New Car Brand</b></td><td>${data.car_brand}</td></tr>
            <tr><td><b>New Car VSA no.</b></td><td>${data.car_vsa}</td></tr>
            <tr><td><b>Current Car Reg no.</b></td><td>${data.current_reg}</td></tr>
            <tr><td><b>Handover Date</b></td><td>${data.handover_date}</td></tr>
            <tr><td><b>Handover Time</b></td><td>${data.handover_time}</td></tr>
            <tr><td><b>Handover Location</b></td><td>${data.handover_location}</td></tr>
        </table>

        <h3>Financial Information</h3>
         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%;">
           <tr><td><b>VPA Trade Value</b></td><td>${data.vpa_trade_value}</td></tr>
           <tr><td><b>Overtrade Amount</b></td><td>${data.overtrade_amount}</td></tr>
           <tr><td><b>Full Settlement</b></td><td>${data.full_settlement}</td></tr>
           <tr><td><b>Settlement Expiry</b></td><td>${data.settlement_expiry}</td></tr>
           <tr><td><b>Settlement Bank</b></td><td>${data.settlement_bank}</td></tr>
           <tr><td><b>Net Balance</b></td><td>${data.net_balance}</td></tr>
        </table>
        <h3>Balance Summary</h3>
         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%;">
           <tr><td><b>Balance Available from Overtrade</b></td><td>${data.balance_available_overtrade}</td></tr>
           <tr><td><b>Balance Overtrade Amount</b></td><td>${data.balance_overtrade_amount}</td></tr>
           <tr><td><b>Balance Before Registration</b></td><td>${data.balance_before_registration}</td></tr>
           <tr><td><b>Amount to be Transferred to New Car</b></td><td>${data.amount_transfer_new_car}</td></tr>
           <tr><td><b>Balance After Registration</b></td><td>${data.balance_after_registration}</td></tr>
        </table>

        <h3>Payment Details</h3>
         <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width:100%;">
           <tr><td><b>Top Up Cheque to be collected from Customer</b></td><td>${data.top_up_cheque}</td></tr>
           <tr><td><b>Third Party (if any)</b></td><td>${data.third_party}</td></tr>
        </table>

        <h3>Special Notes/Instructions</h3>
        <p>${data.special_notes}</p>

       
    `;
        }

        function showNotification(message, type = 'info') {
            // Remove any existing notifications
            const existingNotification = document.getElementById('notification');
            if (existingNotification) {
                existingNotification.remove();
            }

            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10001;
        max-width: 400px;
        animation: notificationSlideIn 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
            // Set background color based on type
            const colors = {
                'success': '#27ae60',
                'error': '#e74c3c',
                'warning': '#f39c12',
                'info': '#3498db'
            };
            notification.style.backgroundColor = colors[type] || colors.info;
            notification.textContent = message;
            // Add animation styles if not exists
            if (!document.getElementById('notificationStyles')) {
                const style = document.createElement('style');
                style.id = 'notificationStyles';
                style.textContent = `
            @keyframes notificationSlideIn {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
        `;
                document.head.appendChild(style);
            }
            document.body.appendChild(notification);
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }

        return {
            pageInit: pageInit

        };

    });
