/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/file', 'N/email', 'N/log', 'N/search', 'N/record', 'N/runtime'], function (serverWidget, file, email, log, search, record, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: ' ',
                hideNavBar: false
            });
            var transactionId = context.request.parameters.transactionId;
            if (!transactionId) {
                throw new Error("Transaction ID is required in the URL parameters.");
            }
            var Transactionield = form.addField({
                id: 'custpage_transaction_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Transaction ID'
            });
            Transactionield.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            Transactionield.defaultValue = transactionId;

            var subsidiary = '';
            var subsidiaryID = '';
            var purchaser_name = '';
            var info_VPA = '';
            var info_VPA_ID = '';
            var doc = '';
            var purchaser_ID = '';
            //get Data
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", transactionId],
                        "AND",
                        ["mainline", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({
                            name: "custrecord_purchaser_name",
                            join: "CUSTRECORD_ADVS_T_I_INFO_SO",
                            label: "Purchaser Name"
                        }),
                        search.createColumn({
                            name: "custrecord_advs_t_i_o_po_link",
                            join: "CUSTRECORD_ADVS_T_I_INFO_SO"

                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_ADVS_T_I_INFO_SO",
                            label: "Internal ID"
                        })
                    ]
            });
            var searchResultCount = salesorderSearchObj.runPaged().count;
            log.debug("salesorderSearchObj result count", searchResultCount);
            salesorderSearchObj.run().each(function (result) {

                var subsidiaryFull = result.getText({ name: "subsidiary" });
                subsidiaryID = result.getValue({ name: "subsidiary" });
                if(subsidiaryFull){
                var brandParts = subsidiaryFull.split(':');
                subsidiary = brandParts[brandParts.length - 1].trim();
                }
                doc = result.getValue({ name: "tranid" });
                purchaser_name = result.getText({ name: "custrecord_purchaser_name", join: "CUSTRECORD_ADVS_T_I_INFO_SO" });
                purchaser_ID = result.getValue({ name: "custrecord_purchaser_name", join: "CUSTRECORD_ADVS_T_I_INFO_SO" });
                var info_VPA_ = result.getText({ name: "custrecord_advs_t_i_o_po_link", join: "CUSTRECORD_ADVS_T_I_INFO_SO" });
                if(info_VPA_){
                var vpaParts = info_VPA_.split('#');
                info_VPA = vpaParts[vpaParts.length - 1].trim();
                }
                info_VPA_ID = result.getValue({ name: "custrecord_advs_t_i_o_po_link", join: "CUSTRECORD_ADVS_T_I_INFO_SO" });

                return false;
            });



            var optionsLoc = '<option value="">Select Location</option>';
            var Search = search.create({
                type: 'location',
                filters: [['isinactive', 'is', 'F']],
                columns: ['name', 'internalid']
            });
            Search.run().each(function (result) {
                var loc_name = result.getValue('name') || 0;
                optionsLoc += '<option value="' + result.getValue('internalid') + '" data-loc="' + loc_name + '">' +
                    result.getValue('name') +
                    '</option>';

                return true;
            });
            //Bank
            var optionsBank = '<option value="">Select Bank</option>';
            var Search = search.create({
                type: 'customlist_bank',
                filters: [['isinactive', 'is', 'F']],
                columns: ['name', 'internalid']
            });
            Search.run().each(function (result) {
                var _name = result.getValue('name') || 0;
                optionsBank += '<option value="' + result.getValue('internalid') + '" data-bank="' + _name + '">' +
                    result.getValue('name') +
                    '</option>';

                return true;
            });

            // var sql = `
            //         SELECT
            //             so.subsidiary,
            //             so.tranid,
            //             quote.custrecord_purchaser_name,
            //             info.internalid AS info_internalid
            //         FROM
            //             transaction AS so
            //         LEFT JOIN
            //             customrecord_advs_t_i_f_quote AS quote
            //             ON quote.id = so.custrecord_advs_t_i_f_quote
            //         LEFT JOIN
            //             customrecord_advs_t_i_info_so AS info
            //             ON info.id = so.custrecord_advs_t_i_info_so
            //         WHERE
            //             so.type = 'SalesOrd'
            //             AND so.internalid = ?
            //             AND so.mainline = 'T'
            //     `;

            // var resultSet = query.runSuiteQL({
            //     query: sql,
            //     params: [transactionId]
            // });

            // var results = resultSet.asMappedResults();
            // log.debug("SuiteQL Results", results);

            const html = `

          <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://9908878-sb1.app.netsuite.com/core/media/media.nl?id=21736&c=9908878_SB1&h=yz1D1R_54Mta4fxw65pNlhvqNYl9pm6nlP7_VJUU5W7YMjM5&_xt=.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
</head>

<body>
    <div class="container" id="handoverFormDiv">
        <div class="header">
            <h1>Early Handover Form for Payment Request by Sales Consultants.</h1>
        </div>

        <form id="handoverFormID" class="form-content">
            <!-- Status Indicators -->
            <div class="status-section">
    <label class="status-indicator status-no-top-up">
        <input type="radio" name="status" value="no_topup">
        No Top Up for Settlement
    </label>

    <label class="status-indicator status-top-up-required">
        <input type="radio" name="status" value="topup_required">
        Top Up required
    </label>
</div>

            <div class="form-grid">
                <!-- Left Column -->
                <div class="form-section">
                    <h3 class="section-title">Customer & Vehicle Information</h3>
                    <div class="form-group">
                        <label>EPO VPA no.<span class="required">*</span></label>
                        <input type="text" id ="wewe" class="form-control" name="epo_vpa" value="${info_VPA || ''}" readonly>
                    </div>

                    <div class="form-group">
                        <input type="hidden" class="form-control" name="vpa_id" value="${info_VPA_ID || ''}"  readonly> 
                    </div>
                    <div class="form-group">
                        <label>Purchaser name<span class="required">*</span></label>
                        <input type="text" class="form-control" name="purchaser_name" value="${purchaser_name || ''}"  readonly> 
                    </div>

                    <div class="form-group">
                        <input type="hidden" class="form-control" name="purchaser_id" value="${purchaser_ID || ''}"  readonly> 
                    </div>

                    <div class="form-group">
                        <label>New Car Brand franchise name <span class="required">*</span></label>
                        <input type="text" class="form-control" name="car_brand" value="${subsidiary || ''}" readonly>
                    </div>
                    <div class="form-group">
                        <input type="hidden" class="form-control" name="subsidiary_id" value="${subsidiaryID || ''}"  readonly> 
                    </div>

                    <div class="form-group">
                        <label>New Car VSA no.<span class="required">*</span></label>
                        <input type="text" class="form-control" name="car_vsa" value="${doc || ''}" readonly>
                    </div>

                    <div class="form-group">
                        <label>Current Car Reg no.</label>
                        <input type="text" class="form-control" name="current_reg" >
                    </div>

                    <div class="form-group">
                        <label>Handover Date <span class="required">*</span></label>
                        <input type="date" class="form-control" name="handover_date" required>
                    </div>

                    <div class="form-group">
                        <label>Handover Time <span class="required">*</span></label>
                        <input type="time" class="form-control" name="handover_time" required>
                    </div>

                    <div class="form-group">
                        <label>Handover Location</label>
                        <select class="form-control form-select" name="handover_location" id="custpage_location">
                                ${optionsLoc}
                            </select>
                        
                    </div>
                </div>

                <!-- Right Column -->
                <div class="form-section">
                    <h3 class="section-title">Financial Information</h3>

                    <div class="form-group">
                        <label>VPA Trade-in Value</label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="vpa_trade_value">
                                
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Overtrade amount </label>
                        <div class="amount-input highlight-yellow">
                            <input type="number" class="form-control" name="overtrade_amount">
                                
                        </div>
                      
                    </div>

                    <div class="form-group">
                        <label>Full Settlement amount </label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="full_settlement" >
                                
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Full Settlement Expiry date </label>
                        <input type="date" class="form-control" name="settlement_expiry">
                        <div class="note text-red">*amount subject to rebeck if actual settlement date exceeds expiry
                            date</div>
                    </div>

                    <div class="form-group">
                        <label>Full Settlement bank </label>
                        <select class="form-control form-select" name="settlement_bank" id="custpage_bank">
                                ${optionsBank}
                            </select>
                        
                    </div>

                    <div class="form-group">
                        <label> Net Balance after Full settlement</label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="net_balance" >
                               
                        </div>
                    </div>
                </div>
            </div>

            <!-- Balance Section -->
            <div class="form-grid">
                <div class="balance-section">
                    <h3 class="section-title">Balance Summary</h3>

                    <div class="form-group">
                        <label class="balance-label"> Balance Available with Overtrade: </label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="balance_available_overtrade">
                                
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="balance-label"> Balance Overtrade Amount</label>
                        <div class="amount-input highlight-yellow">
                            <input type="number" class="form-control" name="balance_overtrade_amount" >
                               
                        </div>
                        <div class="note">overtrade used for settlement field will be zero</div>
                    </div>
                    <div class="form-group">
                        <label class="balance-label">Balance funds available before New car is Registered</label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="balance_before_registration">
                                
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="balance-label"> Amount to transfer to New Car:</label>
                        <div class="amount-input highlight-yellow">
                            <input type="number" class="form-control" name="amount_transfer_new_car" >
                                
                        </div>
                        <div class="note text-blue">If top up required, this field is 0</div>
                    </div>
                    <div class="form-group">
                        <label class="balance-label"> Balance to customer after New car registration</label>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="balance_after_registration">
                                
                        </div>
                    </div>
                </div>

                <!-- Payment Instructions -->
                <div class="payment-instructions">
                    <h3 class="section-title"> Payment Instructions</h3>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" class="checkbox" name="top_up_cheque" id="top_up_cheque">
                            <label class="checkbox-label" for="top_up_cheque">Top Up Cheque to be collected from Customer</label>
                        </div>
                        <div class="amount-input">
                            <input type="number" class="form-control " name="top_up_amount">
                                
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" class="checkbox" name="balance_cheque" id="balance_cheque">
                            <label class="checkbox-label" for="balance_cheque">Customer's Balance Cheque ready on
                                Handover Date (7 working days advance notice required)</label>
                        </div>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="balance_amount">
                                
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" class="checkbox" name="paynow" id="paynow">
                            <label class="checkbox-label" for="paynow">PayNow</label>
                        </div>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="paynow_amount">
                               
                        </div>

                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" class="checkbox" name="third_party" id="third_party">
                            <label class="checkbox-label" for="third_party">Payment to 3rd party</label>
                        </div>
                        <div class="amount-input">
                            <input type="number" class="form-control" name="third_party_amount">
                               
                        </div>

                    </div>
                </div>
            </div>

            <!-- Additional Fields -->
            <div class="form-section">
                <h3 class="section-title">Additional Information</h3>
                <div class="form-group">
                    <label>Special Instructions / Notes</label>
                    <textarea class="form-control" name="special_notes" rows="4"
                        placeholder="Enter any special instructions or notes here..."></textarea>
                </div>
            </div>

            
            <!-- Submit Section -->
            <div class="submit-section">
                <button type="button" class="submit-btn">Submit Handover Request</button>
            </div>
        </form>
    </div>
</body>
</html>
          `;

            form.addField({
                id: 'custpage_customhtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML'
            }).defaultValue = html;
            form.clientScriptModulePath = './ADVS_CS_early_handover.js';
            context.response.writePage(form);

        }
        else if (context.request.method === 'POST') {

            try {
                var body = JSON.parse(context.request.body);
                var htmlContent = body.html;
                log.debug("Received HTML Content", htmlContent);
                var formData = body.formData;
                log.debug("Received Form Data", formData);

                // Count existing submissions for this Sales Order
                var submissionCount = 0;
                var searchResults = search.create({
                    type: 'customrecord_early_handover',
                    filters: [['custrecord_early_handover_vsa', 'anyof', formData.TransactionId]],
                    columns: [search.createColumn({ name: 'internalid', summary: 'COUNT' })]
                }).run().getRange({ start: 0, end: 1 });

                if (searchResults && searchResults.length > 0) {
                    submissionCount = parseInt(searchResults[0].getValue({
                        name: 'internalid',
                        summary: 'COUNT'
                    })) || 0;
                }
                submissionCount++; // Increment for new record
                // Save form data to custom record
                var recordId = submitForm(formData, submissionCount);
                log.debug("Record Created with ID", recordId);

                if (recordId) {
                    var emailSetup = GetEmailSetup_Approver(9);
                    var subject = emailSetup.smEmailSubject;
                    
                    subject = subject.replace('@vsa@', formData.car_vsa || '');
                    subject = subject.replace('@VPAno@', formData.epo_vpa || '');
                    subject = subject.replace('@CarNo@', formData.current_reg || '');
                    subject = subject.replace('@NewcarBrand@', formData.car_brand || '');
                    // subject = subject.replace('@SCname@', formData.car_brand || '');
                    log.debug("Email Setup Data", emailSetup);
                    var recipients = [];
                    if (emailSetup.recevier) {
                        recipients = emailSetup.recevier.split(',').map(function (id) {
                            return id.trim();
                        });
                    }
                    // Send email
                    //get current user
                    var currentUser = runtime.getCurrentUser();
                    //var userEmail = currentUser.email;

                    email.send({
                        author: currentUser.id,
                        recipients: recipients,
                        subject: subject + ' (Lattest Count: ' + submissionCount + ')',
                        body: `${htmlContent}  `
                    });
                }

                context.response.write(JSON.stringify({ success: true }));
            } catch (e) {
                log.error("Error in POST", e);
                context.response.write(JSON.stringify({ success: false, error: e.message }));
            }
        }
    }

    function GetEmailSetup_Approver(subsidairy) {
        var setupData = {};
        const searchObj = search.create({
            type: "customrecord_early_handover_email_setup",
            filters: [
                ["isinactive", "is", "F"],
                "AND",
                ["custrecord_early_emailsetup_subsidiry", "anyof", subsidairy]
            ],
            columns: [
                "internalid",
                "custrecord_email_subject",
                "custrecord_early_email_body",
                "custrecord_early_sender",
                "custrecord_early_email_recevier",
                "custrecord_early_emailsetup_subsidiry"

            ]
        });

        var emailBody = '', emailSubject = '';
        searchObj.run().each(function (result) {

            emailBody = result.getValue("custrecord_early_email_body");
            emailSubject = result.getValue("custrecord_email_subject");
            recevier = result.getValue("custrecord_early_email_recevier");
            sender = result.getValue("custrecord_early_sender");
            return false;
        });

        setupData.smEmailBody = emailBody;
        setupData.smEmailSubject = emailSubject;
        setupData.recevier = recevier;
        setupData.sender = sender;

        return setupData;
    };

    function submitForm(formData, submissionCount) {
        // Create the custom record
        var rec = record.create({
            type: 'customrecord_early_handover',
            isDynamic: true
        });
        // --- Customer & Vehicle Information ---
        rec.setValue({ fieldId: 'custrecord_early_handover_vsa', value: formData.TransactionId });
        rec.setValue({ fieldId: 'custrecord_epo_vpa', value: formData.vpa_id });
        rec.setValue({ fieldId: 'custrecord_pur_name', value: formData.purchaser_id });
        rec.setValue({ fieldId: 'custrecord_new_car_brand', value: formData.subsidiary_id });
        rec.setValue({ fieldId: 'custrecord_car_vsa_no', value: formData.car_vsa });
        rec.setValue({ fieldId: 'custrecord_current_car_reg', value: formData.current_reg });
        if (formData.handover_date) {
            var parsedDate = parseDateFromDDMMYYYY(formData.handover_date);
            if (parsedDate) {
                rec.setValue({ fieldId: 'custrecord_handover_date', value: parsedDate });
            }
        }
        rec.setValue({ fieldId: 'custrecord_handover_time', value: formData.handover_time });
        rec.setValue({ fieldId: 'custrecord_handover_location', value: formData.handover_location });

        rec.setValue({ fieldId: 'custrecord_no_top_up_settlement', value: formData.status_no_topup || false });
        rec.setValue({ fieldId: 'custrecord_top_up_req', value: formData.status_topup || false });
        // --- Financial Information ---
        rec.setValue({ fieldId: 'custrecord_vpa_value', value: Number(formData.vpa_trade_value) || 0 });
        rec.setValue({ fieldId: 'custrecord_over_amnt', value: Number(formData.overtrade_amount) || 0 });
        rec.setValue({ fieldId: 'custrecord_full_selement_amnt', value: Number(formData.full_settlement) || 0 });
        if (formData.settlement_expiry) {
            var parsedDate = parseDateFromDDMMYYYY(formData.settlement_expiry);
            if (parsedDate) {
                rec.setValue({ fieldId: 'custrecord_full_date', value: parsedDate });
            }
        }

        rec.setValue({ fieldId: 'custrecord_full_bank', value: formData.settlement_bank });
        rec.setValue({ fieldId: 'custrecord_new_amnt_full_stlmnt', value: Number(formData.net_balance) || 0 });

        rec.setValue({ fieldId: 'custrecord_balance_with_overtrade', value: Number(formData.balance_available_overtrade) || 0 });
        rec.setValue({ fieldId: 'custrecord_balance_overtrade_amnt', value: Number(formData.balance_overtrade_amount) || 0 });
        rec.setValue({ fieldId: 'custrecord_balance_before_newcar_reg', value: Number(formData.balance_before_registration) || 0 });
        rec.setValue({ fieldId: 'custrecord_amnt_to_newcar', value: Number(formData.amount_transfer_new_car) || 0 });
        rec.setValue({ fieldId: 'custrecord_balance_custaftr_newcar_reg', value: Number(formData.balance_after_registration) || 0 });
        // --- Payment ---
        rec.setValue({ fieldId: 'custrecord_check_from_cust', value: formData.top_up_cheque });
        rec.setValue({ fieldId: 'custrecord_third_party', value: formData.third_party || '' });
        // --- Extra Fields (not in screenshot but from your data object) ---
        rec.setValue({ fieldId: 'custrecord_special_notes', value: formData.special_notes || '' });
        rec.setValue({ fieldId: 'custrecord_from_submit_time', value: new Date() });
        rec.setValue({ fieldId: 'custrecord_submission_count', value: submissionCount });
        var recId = rec.save();
        log.audit('Early Handover record created', 'Record ID: ' + recId);
        return recId;

    }
    function parseDateFromDDMMYYYY(str) {
        if (!str || typeof str !== 'string') return null;

        var parts = str.split('/');
        if (parts.length !== 3) return null;

        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1;
        var year = parseInt(parts[2], 10);
        var dateObj = new Date(year, month, day);
        if (
            dateObj &&
            dateObj.getDate() === day &&
            dateObj.getMonth() === month &&
            dateObj.getFullYear() === year
        ) {
            return dateObj;
        }

        return null;
    }

    return {
        onRequest: onRequest
    };
});