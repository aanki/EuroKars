/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/record', 'N/format', 'N/file'], (serverWidget, search, log, record, format, file) => {
    const onRequest = (context) => {

        var details = {};
        if (context.request.method === 'GET') {

            var transactionId = context.request.parameters.transactionId;
            var rocId = context.request.parameters.rocId;
            log.debug("transactionId", transactionId + " rocId: " + rocId);

            var ROC_Record_data = {
                RevisedcolourName: '',
                RevisedcolourAmount: '',
                RevisedbankPackg: '',
                RevisedBankTerm: '',
                RevisedBankLoan: '',
                RevisedInsuCom: '',
                RevisedInsuPeriod: '',
                RevisedNetSellingPriceAmount: '',
                ROCchild: []
            };

            // Create the main form
            var form = serverWidget.createForm({
                title: ' ',
                hideNavBar: true
            });
            //Hidden fields
            var curr_model_id = form.addField({
                id: 'custpage_current_model_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ROC ID'
            });
            curr_model_id.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            var curr_variant_id = form.addField({
                id: 'custpage_current_varian_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ROC ID'
            });
            curr_variant_id.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            var curr_colour_id = form.addField({
                id: 'custpage_current_colour_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ROC ID'
            });
            curr_colour_id.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            var ROCField = form.addField({
                id: 'custpage_roc_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ROC ID'
            });
            ROCField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            if (rocId && rocId !== "undefined") {
                ROCField.defaultValue = rocId;
                // Means suitlet opened from ROC Record
                var Unique = [];
                var UniqueChild = [];
                // Get Data fromm ROC Record
                var customrecord_rocSearchObj = search.create({
                    type: "customrecord_roc",
                    filters:
                        [
                            ["internalid", "anyof", rocId],
                            "AND",
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_vsa_roc.custcol_advs_selected_inventory_type", "anyof", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custrecord_colour_revised", label: "Colour Revised" }),
                            search.createColumn({ name: "custrecord_roc_color_amount", label: "Colour Amount" }),
                            search.createColumn({ name: "custrecord_revised_net_price" }),
                            search.createColumn({ name: "custrecord_roc_current_model" }),
                            search.createColumn({ name: "custrecord_roc_current_vriant" }),
                            search.createColumn({ name: "custrecord_colour_orignal" }),
                            search.createColumn({ name: "custrecord_original_loan" }),
                            search.createColumn({ name: "custrecord_original_term" }),
                            search.createColumn({ name: "custrecord_original_bank_pckg" }),
                            search.createColumn({ name: "custrecord_revised_bank_pckg" }),
                            search.createColumn({ name: "custrecord_revised_term" }),
                            search.createColumn({ name: "custrecord_revised_loan" }),
                            search.createColumn({ name: "custrecord_original_interest_rate" }),
                            search.createColumn({ name: "custrecord_original_insurance_period" }),
                            search.createColumn({ name: "custrecord_revised_insurance_period" }),
                            search.createColumn({ name: "custrecord_orignal_insurance_company" }),
                            search.createColumn({ name: "custrecord_revised_insurance_company" }),
                            search.createColumn({ name: "custrecord_original_obu_touch" }),
                            search.createColumn({ name: "custrecord_original_proces_unit_loc" }),
                            search.createColumn({ name: "tranid", join: "CUSTRECORD_VSA_ROC" }),
                            search.createColumn({ name: "entity", join: "CUSTRECORD_VSA_ROC" }),
                            search.createColumn({ name: "subsidiary", join: "CUSTRECORD_VSA_ROC" }),
                            search.createColumn({ name: "custbody_monthly_installement", join: "CUSTRECORD_VSA_ROC" }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTRECORD_ROC_HEADER",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_ROC_HEADER",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "custrecord_roc_item_amount",
                                join: "CUSTRECORD_ROC_HEADER"

                            }),
                            search.createColumn({
                                name: "custrecord_roc_item_type",
                                join: "CUSTRECORD_ROC_HEADER",
                                label: "ROC Item type"
                            })
                        ]
                });
                var searchResultCount = customrecord_rocSearchObj.runPaged().count;
                log.debug("customrecord_rocSearchObj result count", searchResultCount);
                customrecord_rocSearchObj.run().each(function (result) {

                    var roc_ID = result.getValue({ name: 'internalid' });
                    if (!Unique[roc_ID]) {
                        Unique[roc_ID] = true;

                        ROC_Record_data.RevisedcolourName = result.getText({ name: 'custrecord_colour_revised' });
                        ROC_Record_data.RevisedcolourAmount = result.getValue({ name: 'custrecord_roc_color_amount' });
                        ROC_Record_data.RevisedbankPackg = result.getText({ name: 'custrecord_revised_bank_pckg' });
                        ROC_Record_data.RevisedBankTerm = result.getText({ name: 'custrecord_revised_term' });
                        ROC_Record_data.RevisedBankLoan = result.getValue({ name: 'custrecord_revised_loan' });
                        ROC_Record_data.RevisedInsuCom = result.getText({ name: 'custrecord_revised_insurance_company' });
                        ROC_Record_data.RevisedInsuPeriod = result.getText({ name: 'custrecord_revised_insurance_period' });
                        var NetAmountRevised = result.getValue({ name: 'custrecord_revised_net_price' });
                        var formattedPrice = Number(NetAmountRevised).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2
                        });
                        ROC_Record_data.RevisedNetSellingPriceAmount = formattedPrice;

                        var VSA = result.getValue({ name: 'tranid', join: 'CUSTRECORD_VSA_ROC' });
                        var customer = result.getText({ name: 'entity', join: 'CUSTRECORD_VSA_ROC' });
                        var model = result.getText({ name: 'custrecord_roc_current_model' });
                        var modelID = result.getValue({ name: 'custrecord_roc_current_model' });
                        var variant = result.getText({ name: 'custrecord_roc_current_vriant' });
                        var variantID = result.getValue({ name: 'custrecord_roc_current_vriant' });
                        var colour = result.getText({ name: 'custrecord_colour_orignal' }) || '';
                        var colourID = result.getValue({ name: 'custrecord_colour_orignal' }) || '';
                        var priceFormat = result.getValue({ name: 'custrecord_revised_net_price' });
                        var formattedPrice = Number(priceFormat).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2
                        });
                        var netPrice = formattedPrice;
                        var loanamount = result.getValue({ name: 'custrecord_original_loan' });
                        var loanTerm = result.getText({ name: 'custrecord_original_term' });
                        var montlyInstal = result.getValue({ name: 'custbody_monthly_installement', join: 'CUSTRECORD_VSA_ROC' });
                        var bankPckg = result.getText({ name: 'custrecord_original_bank_pckg' });
                        var IntrestRate = result.getValue({ name: 'custrecord_original_interest_rate' });
                        var InsurancePeriod = result.getText({ name: 'custrecord_original_insurance_period' });
                        var InsuranceCom = result.getText({ name: 'custrecord_orignal_insurance_company' });
                        var obuTouch = result.getValue({ name: 'custrecord_original_obu_touch' });
                        var obuTouch_Opposit = '';
                        if (obuTouch === 'Yes') {
                            obuTouch_Opposit = 'No';
                        }
                        else {
                            obuTouch_Opposit = 'Yes';
                        }
                        var obu_loc = result.getValue({ name: 'custrecord_original_proces_unit_loc' });
                        var obu_loc_Opp = '';
                        if (obu_loc === "Driver's Side") {
                            obu_loc_Opp = "Passenger's Side";
                        } else {
                            obu_loc_Opp = "Driver's Side";
                        }

                        create_detail_JSON(VSA, customer, model, modelID, variant, variantID, colour, colourID, netPrice, loanamount,
                            loanTerm, montlyInstal, bankPckg, IntrestRate, InsurancePeriod, InsuranceCom, obuTouch, obuTouch_Opposit, obu_loc, obu_loc_Opp);

                    }

                    var rocCHild_ID = result.getValue({ name: 'internalid', join: 'CUSTRECORD_ROC_HEADER' });

                    if (!UniqueChild[rocCHild_ID]) {
                        UniqueChild[rocCHild_ID] = true;
                        ROC_Record_data.ROCchild.push({
                            selecteditemName: result.getText({ name: 'custrecord_roc_item_type', join: 'CUSTRECORD_ROC_HEADER' }),
                            selectedItem: result.getValue({ name: 'custrecord_roc_item_type', join: 'CUSTRECORD_ROC_HEADER' }),
                            itemName: result.getValue({ name: 'name', join: 'CUSTRECORD_ROC_HEADER' }),
                            amount: result.getValue({ name: 'custrecord_roc_item_amount', join: 'CUSTRECORD_ROC_HEADER' }),
                            rocItemId: rocCHild_ID
                        });
                    }

                    return true;
                });
                log.debug("ROC_Record_data", ROC_Record_data);
            }

            if (transactionId) {  // Measn suitlet Opened from VSA
                var Transactionield = form.addField({
                    id: 'custpage_transaction_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transaction ID'
                });
                Transactionield.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                Transactionield.defaultValue = transactionId;
                // Get Data from VSA
                var details = {};

                var transactionSearch = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["internalid", "anyof", transactionId],
                            "AND",
                            ["custcol_advs_selected_inventory_type", "anyof", "1"]
                        ],
                    columns: [
                        search.createColumn({ name: "tranid" }),
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "subsidiary" }),
                        search.createColumn({ name: "item" }),
                        search.createColumn({ name: "parent", join: "item" }),
                        search.createColumn({ name: "custcol_advs_st_exterior_color" }),
                        search.createColumn({ name: "total", label: "Amount (Transaction Total)" }),
                        search.createColumn({ name: "custbody_advs_loan_amt" }),
                        search.createColumn({ name: "custbody_advs_loan_terms" }),
                        search.createColumn({ name: "custbody_monthly_installement" }),
                        search.createColumn({ name: "custbody_advs_bank_package" }),
                        search.createColumn({ name: "custbody_interest_rate" }),
                        search.createColumn({ name: "custbodyadvs_ins_per" }),
                        search.createColumn({ name: "custbody_obu_touchscreen" }),
                        search.createColumn({ name: "custbody_obu_install_loc" }),
                        search.createColumn({ name: "custbody_insurance_com" })
                    ]
                });


                var resultSet = transactionSearch.run();
                resultSet.each(function (result) {

                    var VSA = result.getValue({ name: 'tranid' });
                    var customer = result.getText({ name: 'entity' });
                    var model = result.getText({ name: 'parent', join: 'item' });
                    var modelID = result.getValue({ name: 'parent', join: 'item' });
                    var variant = result.getText({ name: 'item' });
                    var variantID = result.getValue({ name: 'item' });
                    var colour = result.getText({ name: 'custcol_advs_st_exterior_color' }) || '';
                    var colourID = result.getValue({ name: 'custcol_advs_st_exterior_color' }) || '';
                    var priceFormat = result.getValue({ name: 'total' });
                    var formattedPrice = Number(priceFormat).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 2
                    });
                    var netPrice = formattedPrice;
                    var loanamount = result.getValue({ name: 'custbody_advs_loan_amt' });
                    var loanTerm = result.getText({ name: 'custbody_advs_loan_terms' });
                    var montlyInstal = result.getValue({ name: 'custbody_monthly_installement' });
                    var bankPckg = result.getText({ name: 'custbody_advs_bank_package' });
                    var IntrestRate = result.getValue({ name: 'custbody_interest_rate' });
                    var InsurancePeriod = result.getText({ name: 'custbodyadvs_ins_per' });
                    var InsuranceCom = result.getText({ name: 'custbody_insurance_com' });
                    var obuTouch = '';
                    var obuTouch_Opposit = '';
                    if (result.getValue({ name: 'custbody_obu_touchscreen' })) {
                        obuTouch = 'Yes';
                        obuTouch_Opposit = 'No';
                    } else {
                        obuTouch = 'No';
                        obuTouch_Opposit = 'Yes';
                    }
                    var obu_loc_value = result.getValue({ name: 'custbody_obu_install_loc' });
                    var obu_loc = '';
                    var obu_loc_Opp = '';
                    if (obu_loc_value) {
                        if (obu_loc_value == "Driver's Side") {
                            obu_loc = "Driver's Side";
                            obu_loc_Opp = "Passenger's Side";
                        } else {
                            obu_loc = "Passenger's Side";
                            obu_loc_Opp = "Driver's Side";
                        }
                    }

                    create_detail_JSON(VSA, customer, model, modelID, variant, variantID, colour, colourID, netPrice, loanamount,
                        loanTerm, montlyInstal, bankPckg, IntrestRate, InsurancePeriod, InsuranceCom, obuTouch, obuTouch_Opposit, obu_loc, obu_loc_Opp);

                    return false;

                });


                log.debug("details", details);
                // Get Colour Option

                var optionsHtmlColor = '<option value="">Select colour</option>';
                var Search = search.create({
                    type: 'customrecord_advs_st_model_option',
                    filters: [['isinactive', 'is', 'F'], 'AND', ['custrecord_st_m_o_head_link', 'anyof', details.variantID]],
                    columns: ['name', 'internalid', 'custrecord_advs_m_o_o_price']
                });
                Search.run().each(function (result) {
                    var price = result.getValue('custrecord_advs_m_o_o_price') || 0;
                    optionsHtmlColor += '<option value="' + result.getValue('internalid') + '" data-price="' + price + '">' +
                        result.getValue('name') +
                        '</option>';

                    return true;
                });

                // Get BankPackage
                var bankPackageArr = [];
                var optionsHtml = '<option value="">Select Bank Package</option>';
                var bankSearch = search.create({
                    type: 'customrecord_bank_package',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['name', 'internalid']
                });
                bankSearch.run().each(function (result) {
                    bankPackageArr.push({
                        id: result.getValue('internalid'),
                        name: result.getValue('name')
                    });
                    optionsHtml += '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';

                    return true;
                });
                // Get Loan Term
                var optionsHtmlTerm = '<option value="">Select Term</option>';
                var termSearch = search.create({
                    type: 'customlist_finance_term',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['name', 'internalid']
                });
                termSearch.run().each(function (result) {
                    optionsHtmlTerm += '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';

                    return true;
                });
                // Get Insurance Period
                var optionsHtmlPeriod = '<option value="">Select Insurance Period</option>';
                var insuSearch = search.create({
                    type: 'customlist_insurance_period',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['name', 'internalid']
                });
                insuSearch.run().each(function (result) {
                    optionsHtmlPeriod += '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';

                    return true;
                });
                // Get Insurance Company
                var optionsHtmlIsnCom = '<option value="">Select Insurance Company</option>';
                var insuSearch = search.create({
                    type: 'customlist_advs_insu_company',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['name', 'internalid']
                });
                insuSearch.run().each(function (result) {
                    optionsHtmlIsnCom += '<option value="' + result.getValue('internalid') + '">' + result.getValue('name') + '</option>';

                    return true;
                });

                // // Get ROC Item Type
                var optionsHtmlROC = '<option value="">Select Item Type</option>';
                optionsHtmlROC += '<option value="1">Add Items</option>';
                optionsHtmlROC += '<option value="2">Remove Items</option>';
                var results = get_Selected_package(transactionId);
                log.debug("Selected Package", JSON.stringify(results) + '  result.packageHead ' + results.packageHead);

                // Get Which item selected
                var selected_item = [];
                if (results.packageHead) {
                    selected_item = get_selected_Pack_item(results.packageHead);
                    log.debug("Selected select_item", JSON.stringify(selected_item));
                }
                if (results.vsaPackage) {
                    var all_item = get_all_packg_item(results.vsaPackage);

                }
                var diff_items = [];
                if (all_item) {
                    diff_items = all_item.filter(function (all) {
                        return !selected_item.some(function (sel) {
                            return all.SelecteditemName === sel.SelecteditemName;
                        });
                    });
                    log.debug("diff_items", JSON.stringify(diff_items));

                }

            }
            // Set Value in Hidden Fields
            curr_model_id.defaultValue = details.modelID;
            curr_variant_id.defaultValue = details.variantID;
            curr_colour_id.defaultValue = details.colourID;
            // get current date
            var currentDate = new Date();
            var formattedDate = format.format({
                value: currentDate,
                type: format.Type.DATE
            });

            const html = `
      
     <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RoC - Amendment Form</title>
  <link href="https://9908878-sb1.app.netsuite.com/core/media/media.nl?id=13204&c=9908878_SB1&h=7oIh1LSSA9HktmshXzzU7ih3ahPxXiM5HwMckPZHF-S3rWie&_xt=.css" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css" rel="stylesheet"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js"></script>
   
    </head>
<body>
    <div class="container" >
        <!--<div class="header"> RoC - Amendment</div>   -->

     <div id="roc-loader" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div class="loader-spinner"></div>
     </div>

</div>

        <div class="form-content" id="fullcontainer" style="display:none;">
            <h3 class="section-title">RoC - Amendment Details</h3> 
            
            <div class="details-grid">
                <div class="detail-item">
                    <label class="detail-label">VSA :</label>
                    <span class="detail-value">${details.vsa || ''}</span>
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">RoC Requested</label>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Customer</label>
                    <span class="detail-value">${details.customer || ''}</span>
                     
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Net Selling Price</label>
                    <span class="detail-value">${details.netPrice || ''}</span>
                    
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Original Model</label>
                    <span class="detail-value">${details.model || ''}</span>
                    
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Current Model</label>
                    <span class="detail-value">${details.model || ''}</span>
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Original Variant</label>
                    <span class="detail-value">${details.variant || ''}</span>
                    
                </div>  
                
                <div class="detail-item">
                    <label class="detail-label">Current Variant</label>
                    <span class="detail-value">${details.variant || ''}</span>
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Original Colour</label>
                    <span class="detail-value">${details.colour || ''}</span>
                     
                </div>
                
                <div class="detail-item">
                    <label class="detail-label">Current Colour</label>
                    <span class="detail-value">${details.colour || ''}</span>
                </div>
            </div>
            <div id="main-roc-div" style="display:none;">
             <h3 class="section-title">Change of Colour</h3>
            <table class="amendment-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Original</th>
                        <th>Revised</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="label-column">Colour</td>
                        <td class="original-column">${details.colour || ''}</td>
                        <td class="revised-column">
                            <select class="form-input form-select" id="custpage_colour_select">
                                ${optionsHtmlColor}
                            </select>
                        </td>
                        <td class="revised-column">
                            <input type="text" class="form-input roc-amount-input" id="custpage_color_amount" placeholder="$0.00" readonly>
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3 class="section-title">Change of Financing</h3>
            <table class="amendment-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Original</th>
                        <th>Revised Financing</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="label-column">Bank Package</td>
                        <td class="original-column">${details.bankPckg || ''}</td>
                        <td class="revised-column">
                            <select id="bankPackageSelect" class="form-input form-select">
                              ${optionsHtml}
                            </select>
                             
                        </td>
                    </tr>
                    <tr>
                        <td class="label-column">Term</td>
                        <td class="original-column">${details.loanTerm || ''}</td>
                        <td class="revised-column">
                            <select class="form-input form-select" id="custpage_term_select">
                                ${optionsHtmlTerm}
                            </select>
                             
                        </td>
                    </tr>
                    <tr>
                        <td class="label-column">Loan Amount</td>
                        <td class="original-column">${details.loanamount || ''}</td>
                        <td class="revised-column">
                            <input type="text" class="form-input" id="custpage_loanamnt_selected"placeholder="$0.00">
                        </td>
                    </tr>
                    <tr>
                        <td class="label-column">Interest Rate(%)</td>
                        <td class="original-column">${details.IntrestRate || ''}</td>
                        <td class="revised-column">
                            <input type="text" class="form-input" id="custpage_int_rate" placeholder="Enter interest rate">
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3 class="section-title">Change of Insurance</h3>
            <table class="amendment-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Original</th>
                        <th>Revised</th>
                    </tr>
                </thead>
                <tbody>
                    
                     <tr>
                        <td class="label-column">Insurance Company</td>
                        <td class="original-column">${details.InsuranceCom || ''}</td>
                        <td class="revised-column">
                            <select class="form-input form-select" id="custpage_insurance_company_selected">
                               ${optionsHtmlIsnCom}
                            </select>
                             
                        </td>
                    </tr>
                    <tr>
                        <td class="label-column">Insurance Period</td>
                        <td class="original-column">${details.InsurancePeriod || ''}</td>
                        <td class="revised-column">
                            <select class="form-input form-select" id="custpage_insurance_period_selected">
                               ${optionsHtmlPeriod}
                            </select>
                             
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3 class="section-title">Change of OBU Details</h3>
            <table class="amendment-table">
                <thead>
                    <tr>
                        <th></th>
                        <th>Original</th>
                        <th>Revised</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="label-column">OBU Touch Screen</td>
                        <td class="original-column">${details.obuTouch || ''}</td>
                        <td class="revised-column">
                            <div class="checkbox-container">
                                <input type="checkbox" class="checkbox-input" >
                                <label class="checkbox-label" id="custpage_obu_touchscreen" for="obu-no">${details.obuTouch_Opposit || ''}</label>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label-column">Processing Unit Location</td>
                        <td class="original-column">${details.obu_loc || ''}</td>
                        <td class="revised-column">
                            <div class="checkbox-container">
                                <input type="checkbox" class="checkbox-input" >
                                <label class="checkbox-label"  id="custpage_obu_loc_selected" for="passenger-side">${details.obu_loc_Opp || ''}</label>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <h3 class="section-title">RoC Item</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <span></span>
                <button type="button" class="add-item-btn">Add RoC Line Item</button>
            </div>
            
            <table class="amendment-table" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr>
                        <th style="width:15%;">RoC Item Type</th>
                        <th style="width:45%;">Item Name</th>
                        <th style="width:20%;">Item Amount</th>
                        <th style="width:10%;">Actions</th>
                    </tr>
                </thead>
                <tbody id="roc-items-tbody">
                    <tr>
                        <td class="revised-column">
                            <select class="form-input form-select rocItemType">
                                ${optionsHtmlROC}
                            </select> 
                        </td>
                       <td class="revised-column">
                         <select class="form-input diffItemsSelect"></select>
                        </td>
                        <td class="revised-column">
                            <input type="text" class="form-input itemAmount" placeholder="$0.00" readonly>
                        </td>
                        <td class="revised-column" style="text-align: center;">
                            <button type="button" class="remove-item-btn" style="background: #e53e3e; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style="display: flex; justify-content: flex-end; margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="font-weight: 600; color: #4a5568;">New Net Selling Price</span>
                    <input type="text" id="netSellingPrice" class="form-input" value="${details.netPrice || 0.00}" data-base="${details.netPrice || 0.00}" readonly style="width: 150px; text-align: center; font-weight: 600; background: #e2e8f0;">
                </div>
            </div>

            <h3 class="section-title">Remarks/Notes</h3>
            <div style="margin-bottom: 30px;">
                <textarea class="form-input" id="remarks"  placeholder="Remarks/Notes" rows="4" style="width: 100%; resize: vertical; min-height: 100px;"></textarea>
            </div>
            </div>


            
           <div id="roc-signature-section" style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;display: none;">
            <h3 class="section-title">RoC - Revised Summary</h3>
            <div id="roc-tabel">

            </div>

    <div class="signature-wrapper">
        <!-- Customer Signature -->
        <div class="signature-box">
           <h5 style="font-size: 15px;">Customer's Signature <span style="color:red">*</span></h5>

            <canvas id="signature-pad" width="400" height="200" style="border:1px solid #ccc; background:#f9f9f9;"></canvas>
            <br/>
            <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="clearSignature('signature-pad', 'signature-data')">Clear</button>
            <p class="mt-2">
                <span style="text-decoration:underline; cursor:pointer;" onclick="setDrawMode('signature-pad')">draw</span> |
                <span style="text-decoration:underline; cursor:pointer;" onclick="setTypeMode('signature-pad', 'signature-data')">type</span>
            </p>
            <input type="hidden" id="signature-data" name="signature_data" />
        </div>

        <!-- Sales Signature -->
        <div class="signature-box">
            <h5 style="font-size: 15px;">Sales's Signature <span style="color:red">*</span></h5>
            <canvas id="signature-pad1" width="400" height="200" style="border:1px solid #ccc; background:#f9f9f9;"></canvas>
            <br/>
            <button type="button" class="btn btn-sm btn-secondary mt-2"  onclick="clearSignature('signature-pad1', 'signature-data1')">Clear</button>
            <p class="mt-2">
                <span style="text-decoration:underline; cursor:pointer;" onclick="setDrawMode('signature-pad1')">draw</span> |
                <span style="text-decoration:underline; cursor:pointer;" onclick="setTypeMode('signature-pad1', 'signature-data1')">type</span>
            </p>
            <input type="hidden" id="signature-data1" name="signature_data1" />
        </div>
       
    </div>
     <p style="font-size: 14px; color: #4a5568;">Note: Please review the changes. If everything is correct, Please sign the ROC to accept the changes.</p>
            
</div>

            <div class="submit-section">
                <div style="display: flex; justify-content: flex-end; gap: 15px;">
                     
                    <button type="button" class="save-sign-btn" id="btnSign">Save & Sign</button>
                    <button type="submit" class="submit-btn" id="btnSubmit">Save & Exit</button>
                    <button type="button" class="cancel-btn" id="btnCancel"  >Cancel</button>
                    <button type="button" class="accept-btn" id="btnAccept" >Accept</button>

                </div>
            </div>
        </div>
         </div>
    
    <script>
     var optionsHtmlROC = \`${optionsHtmlROC}\`;
    var selected_items = ${JSON.stringify(selected_item)}; 
    var all_diff_items = ${JSON.stringify(diff_items)}; 
     var ROC_custom_record_data = ${JSON.stringify(ROC_Record_data)};
    </script>
</body>
</html>
     `;
            form.addField({
                id: 'custpage_customhtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML'
            }).defaultValue = html;
            form.clientScriptModulePath = './ADVS_CS_ROC_Amendment.js';
            context.response.writePage(form);

        }
        else if (context.request.method === 'POST') {
            try {

                var requestBody = JSON.parse(context.request.body);
                log.debug("requestBody", requestBody);
                var VSA_Id = requestBody.transactionId;

                if (requestBody.action === 'updateSignatures') {

                    var rocId = requestBody.ROCrecordId;
                    var custSignature = requestBody.custSignature;
                    var salesSignature = requestBody.salesSignature;

                    const customerImageData = custSignature.replace(/^data:image\/png;base64,/, '');

                    const customerImageFile = file.create({
                        name: 'customer_signature_roc' + Date.now() + '.png',
                        fileType: file.Type.PNGIMAGE,
                        contents: customerImageData,
                        folder: 2237,
                        isOnline: true
                    });

                    const customerSignFileId = customerImageFile.save();

                    const salesImageData = salesSignature.replace(/^data:image\/png;base64,/, '');

                    const salesImageFile = file.create({
                        name: 'sales_signature_roc' + Date.now() + '.png',
                        fileType: file.Type.PNGIMAGE,
                        contents: salesImageData,
                        folder: 2237,
                        isOnline: true
                    });
                    const salesSignFileId = salesImageFile.save();

                    // Update the ROC record with signatures
                    record.submitFields({
                        type: 'customrecord_roc',
                        id: rocId,
                        values: {
                            custrecord_roc_cust_sign: customerSignFileId,
                            custrecord_roc_sm_signed: salesSignFileId,
                            custrecord_cust_sign: true,
                            custrecord_sm_sign: true,
                            custrecord_roc_status: 4 // SM Approved
                        }
                    });
                    log.debug('ROC Updated with Signatures', rocId);
                    context.response.write(JSON.stringify({ success: true, message: 'Signatures updated successfully.' }));
                    return;
                }
                else {
                    var Revisedtotal_Addd_Amount = 0;
                    var child_table = 'recmachcustrecord_roc_header';
                    var RevisedAm = 0;
                    if (requestBody.RevisednetSellingPrice) {
                        RevisedAm = parseFloat(requestBody.RevisednetSellingPrice.replace(/[$,]/g, ''));
                    }
                    var LoanAm = 0;
                    if (requestBody.LoanAmount) {
                        LoanAm = parseFloat(requestBody.LoanAmount.replace(/[$,]/g, ''));
                    }
                    var ColourAm = 0;
                    if (requestBody.RevisedColourAmount) {
                        ColourAm = parseFloat(requestBody.RevisedColourAmount.replace(/[$,]/g, ''));
                        Revisedtotal_Addd_Amount += ColourAm;
                    }

                    var existingRocSearch = search.create({
                        type: 'customrecord_roc',
                        filters: [
                            ["custrecord_vsa_roc", "anyof", VSA_Id],
                            "AND",
                            ["custrecord_roc_status", "noneof", "10"] // Not Cacelled
                        ],
                        columns: ['internalid']
                    });

                    var existingRocId = null;

                    existingRocSearch.run().each(function (result) {
                        existingRocId = result.getValue('internalid');
                        return false; // break after first match
                    });
                    if (existingRocId) {
                        record.submitFields({
                            type: 'customrecord_roc',
                            id: existingRocId,
                            values: {
                                custrecord_roc_status: 10 // Canceled
                            }
                        });
                        log.debug('ROC Updated', existingRocId);
                    }
                    //Auto generate ROC Name
                    var roc_name = 'ROC - Amendment - ' + requestBody.transactionId;

                    var rec = record.create({ type: 'customrecord_roc', isDynamic: true });
                    rec.setValue({ fieldId: 'name', value: roc_name });
                    rec.setValue({ fieldId: 'custrecord_vsa_roc', value: VSA_Id });
                    rec.setValue({ fieldId: 'custrecord_roc_status', value: 3 }); // SM Review
                    rec.setValue({ fieldId: 'custrecord_revised_net_price', value: RevisedAm });
                    rec.setValue({ fieldId: 'custrecord_colour_revised', value: requestBody.RevisedColourID });
                    rec.setValue({ fieldId: 'custrecord_roc_color_amount', value: ColourAm });
                    rec.setValue({ fieldId: 'custrecord_revised_term', value: requestBody.TermID });
                    rec.setValue({ fieldId: 'custrecord_revised_bank_pckg', value: requestBody.BankPackage });
                    rec.setValue({ fieldId: 'custrecord_revised_loan', value: LoanAm });
                    rec.setValue({ fieldId: 'custrecord_revised_insurance_company', value: requestBody.InsCompany });
                    rec.setValue({ fieldId: 'custrecord_revised_insurance_period', value: requestBody.InsPeriod });
                    rec.setValue({ fieldId: 'custrecord_remarks_roc', value: requestBody.Remarks });
                    rec.setValue({ fieldId: 'custrecord_revised_processs_unit_loc', value: requestBody.obuLoc });
                    rec.setValue({ fieldId: 'custrecord_roc_current_model', value: requestBody.CurrentModelID });
                    rec.setValue({ fieldId: 'custrecord_roc_current_vriant', value: requestBody.CurrentVariantID });
                    rec.setValue({ fieldId: 'custrecord_colour_orignal', value: requestBody.CurrentColourID });
                    if (requestBody.obuTouch === 'Yes') {
                        rec.setValue({ fieldId: 'custrecord_revised_obu_touch', value: true });
                    } else {
                        rec.setValue({ fieldId: 'custrecord_revised_obu_touch', value: false });
                    }

                    var dynamicItems = requestBody.dynamicItems;
                    dynamicItems.forEach(function (item, index) {
                        var itemAmnt = 0;
                        if (item.amount) {
                            itemAmnt = parseFloat(item.amount.replace(/[$,]/g, ''));
                            Revisedtotal_Addd_Amount += itemAmnt;
                        }

                        rec.selectNewLine({ sublistId: child_table });

                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "name",
                            value: item.itemName
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "custrecord_roc_item_type",
                            value: item.selectedItem
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "custrecord_roc_item_amount",
                            value: itemAmnt
                        });

                        rec.commitLine({ sublistId: child_table });
                    });

                    if (VSA_Id) {
                        // Load Sales Order
                        var soRec = record.load({
                            type: record.Type.SALES_ORDER,
                            id: VSA_Id,
                            isDynamic: true
                        });

                        var lineCount = soRec.getLineCount({ sublistId: 'item' });

                        for (var i = 0; i < lineCount; i++) {
                            var itemId = soRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });

                            if (parseInt(itemId) === 14818) { // Addtional Line

                                soRec.selectLine({ sublistId: 'item', line: i });
                                var addtional_amount = soRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                });
                                Revisedtotal_Addd_Amount += addtional_amount;
                                soRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: Revisedtotal_Addd_Amount
                                });

                                soRec.commitLine({ sublistId: 'item' });
                                break;
                            }
                        }

                        var SOSavedId = soRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.debug('Sales Order Updated', SOSavedId);
                    }

                    var ROC_saved_Id = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.debug('ROC Saved', ROC_saved_Id);
                }

                context.response.write(JSON.stringify({
                    success: true,
                    recordId: ROC_saved_Id
                }));

            } catch (e) {
                log.error('Error while saving ROC', e.message);
                context.response.write(JSON.stringify({
                    success: false,
                    error: e.message || e.toString()
                }));
            }


        }

        function create_detail_JSON(vsa, customer, model, modelID, variant, variantID, colour, colourID, netPrice, loanamount,
            loanTerm, montlyInstal, bankPckg, IntrestRate, InsurancePeriod, InsuranceCom, obuTouch, obuTouch_Opposit, obu_loc, obu_loc_Opp) {

            details = {
                vsa: vsa,
                customer: customer,
                model: model,
                modelID: modelID,
                variant: variant,
                variantID: variantID,
                colour: colour,
                colourID: colourID,
                netPrice: netPrice,
                loanamount: loanamount,
                loanTerm: loanTerm,
                montlyInstal: montlyInstal,
                bankPckg: bankPckg,
                IntrestRate: IntrestRate,
                InsurancePeriod: InsurancePeriod,
                InsuranceCom: InsuranceCom,
                obuTouch: obuTouch,
                obuTouch_Opposit: obuTouch_Opposit,
                obu_loc: obu_loc,
                obu_loc_Opp: obu_loc_Opp
            };

            return details;
        }
        function get_Selected_package(soId) {
            var soRec = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: false
            });

            var lineCount = soRec.getLineCount({ sublistId: 'item' });
            var selectedPkg = null;

            for (var i = 0; i < lineCount; i++) {
                var inventoryType = soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_advs_selected_inventory_type',
                    line: i
                });

                if (inventoryType == '1') {
                    var packageHead = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_package_head',
                        line: i
                    });

                    var vsaPackage = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_ps_vsa_package',
                        line: i
                    });

                    selectedPkg = {
                        line: i,
                        packageHead: packageHead,
                        vsaPackage: vsaPackage
                    };

                    break;
                }
            }

            return selectedPkg;
        }
        function get_selected_Pack_item(selectedPckgId) {
            var results = [];
            var customrecord_save_vsa_package_itemSearchObj = search.create({
                type: "customrecord_save_vsa_package_item",
                filters:
                    [
                        ["custrecord_parent_package_head", "anyof", selectedPckgId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "internalid"}),
                        search.createColumn({ name: "custrecord_save_item_cost_group", label: "Cost Group" }),
                        search.createColumn({ name: "custrecord_parent_package_head" }),
                        search.createColumn({ name: "custrecord_save_item_cost" }),
                        search.createColumn({ name: "custrecord_package_item_isselected" })
                    ]
            });
            var searchResultCount = customrecord_save_vsa_package_itemSearchObj.runPaged().count;
            log.debug("customrecord_save_vsa_package_itemSearchObj result count", searchResultCount);
            customrecord_save_vsa_package_itemSearchObj.run().each(function (result) {

                results.push({
                    SelecteditemName: result.getValue('name'),
                    SelecteditemID: result.getValue('internalid'),
                    SelectedpackageHead: result.getValue('custrecord_parent_package_head'),
                    Selectedcost: result.getValue('custrecord_save_item_cost')
                });

                return true;
            });

            return results;

        }
        function get_all_packg_item(PckgId) {
            var results = [];
            var customrecord_save_vsa_package_itemSearchObj = search.create({
                type: "customrecord_vsa_package_item",
                filters:
                    [
                        ["custrecord_master_packg", "anyof", PckgId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "internalid"}),
                        search.createColumn({ name: "custrecord_master_packg" }),
                        search.createColumn({ name: "custrecord_pckg_item_cost" })

                    ]
            });
            var searchResultCount = customrecord_save_vsa_package_itemSearchObj.runPaged().count;
            log.debug("customrecord_vsa_package_item result count", searchResultCount);
            customrecord_save_vsa_package_itemSearchObj.run().each(function (result) {

                results.push({
                    SelecteditemName: result.getValue('name'),
                    SelecteditemID: result.getValue('internalid'),
                    SelectedpackageHead: result.getValue('custrecord_master_packg'),
                    Selectedcost: result.getValue('custrecord_pckg_item_cost')
                });

                return true;
            });

            return results;

        }


    };



    return { onRequest };
});

