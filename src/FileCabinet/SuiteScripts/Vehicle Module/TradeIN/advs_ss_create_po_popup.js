/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.10       03 Jul 2025     ChatGPT Enhanced
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet_popup(request, response) {
    if (request.getMethod() == "GET") {
        var tradeId = request.getParameter("tradeid");
        var CustIsCustomer = request.getParameter("cust_is_owner");
        var tradeInAmnt = request.getParameter("tradeInAmnt") || 0;
        var vinid = request.getParameter("vinid");
        var orignlRegdate = request.getParameter("orignlRegdate");
        var firstRegdate = request.getParameter("firstRegdate");
        nlapiLogExecution("ERROR", "tradeId", tradeId);
        nlapiLogExecution("ERROR", "CustIsCustomer", CustIsCustomer);
        var form = nlapiCreateForm("Create VPA");

        // Vendor Dropdown
        var vendorFilters = [
            new nlobjSearchFilter("subsidiary", null, "anyof", 19),
            new nlobjSearchFilter("isinactive", null, "is", "F")
        ];
        var vendorColumns = [
            new nlobjSearchColumn("entityid"),
            new nlobjSearchColumn("companyname")
        ];
        var vendorResults = nlapiSearchRecord("vendor", null, vendorFilters, vendorColumns);
        var vendorField = form.addField("custpage_vendfld", "select", "Vendor");
        vendorField.setMandatory(true);
        vendorField.addSelectOption("", "");
        if (vendorResults && vendorResults.length > 0) {
            for (var i = 0; i < vendorResults.length; i++) {
                var vendId = vendorResults[i].getId();
                var vendName = vendorResults[i].getValue("entityid");
                var Name = vendorResults[i].getValue("companyname");
                vendorField.addSelectOption(vendId, vendName + " " + Name);
            }
        }
        var chasisField = form.addField("custpage_chasis", "select", "Chasis");
        //chasisField.setMandatory(true);
        chasisField.addSelectOption("", "");

        var chasisFilters = [
            new nlobjSearchFilter("isinactive", null, "is", "F"),
            new nlobjSearchFilter("custrecord_appvantage", null, "is", "T"),
        ];
        var chasisColumns = [new nlobjSearchColumn("name"),
        ];
        var chasisResults = nlapiSearchRecord("customrecord_advs_vm", null, chasisFilters, chasisColumns);

        if (chasisResults && chasisResults.length > 0) {
            for (var j = 0; j < chasisResults.length; j++) {
                var chasisId = chasisResults[j].getId();
                var chsisName = chasisResults[j].getValue("name");

                chasisField.addSelectOption(chasisId, chsisName);
            }
        }
        if (vinid) {
            chasisField.setDefaultValue(vinid);
        }

        var oriDate = form.addField('custpage_oriregdate', 'date', 'orignal Registration Date');
        oriDate.setDefaultValue(orignlRegdate);
        var oriFirstDate = form.addField('custpage_frstregdate', 'date', 'First Registration Date');
        oriFirstDate.setDefaultValue(firstRegdate);

        var TradeinField = form.addField("custpage_tradein", "currency", "VPA Price to Customer");
        // TradeinField.setDefaultValue(tradeInAmnt);
        var OverTradeField = form.addField("custpage_overtrade", "currency", "Over Trade");
        form.addField('custpage_eff', 'text', 'Sales Efficiency Commission (Under Quote)');
        var radioField = form.addField('custpage_radio', 'select', 'Sales Commission Ratio');
        radioField.addSelectOption('', '');
        radioField.addSelectOption('100% to Company', '100% to Company');
        radioField.addSelectOption('60/40 Company/Sales', '60/40 Company/Sales');
        form.addField('custpage_sales', 'text', 'Used Cars Sales Commission');

         var radioField = form.addField('custpage_type', 'select', 'Vehicle Type');
        radioField.addSelectOption('', '');
        radioField.addSelectOption('Whole car', 'Whole car');
        radioField.addSelectOption('Body + Paper', 'Body + Paper');


        var CostField = form.addField("custpage_cost", "currency", "Cost");
        CostField.disabled = true;
        // Model Dropdown
        var modelField = form.addField("custpage_modelfld", "select", "Model");
        modelField.setDisplayType("hidden");
        // modelField.setMandatory(true);
        modelField.addSelectOption("", "");

        var modelFilters = [
            new nlobjSearchFilter("type", null, "anyof", "InvtPart"),
            new nlobjSearchFilter("isinactive", null, "is", "F"),
            new nlobjSearchFilter("custitem_advs_inventory_type", null, "anyof", "1"),
            new nlobjSearchFilter("custitem_advs_st_is_model", null, "is", "T"),
            new nlobjSearchFilter("subsidiary", null, "anyof", "19"),
        ];
        var modelColumns = [new nlobjSearchColumn("itemid"),
        new nlobjSearchColumn("displayname")];
        var modelResults = nlapiSearchRecord("inventoryitem", null, modelFilters, modelColumns);

        if (modelResults && modelResults.length > 0) {
            for (var j = 0; j < modelResults.length; j++) {
                var modelId = modelResults[j].getId();
                var modelName = modelResults[j].getValue("itemid");
                var display = modelResults[j].getValue("displayname");
                modelField.addSelectOption(modelId, modelName + " " + display);
            }
        }

        if (CustIsCustomer == 'T') {
            form.addButton(
                "custpage_btn_new_vendor",
                "Create Vendor",
                "createVendor()"
            );

        } else {
            form.addButton(
                "custpage_btn_new_vendor",
                "Create Vendor",
                "window.open('https://9908878-sb1.app.netsuite.com/app/common/entity/vendor.nl?cf=355&whence=', '_blank');"
            );

        }
        form.addField("custpage_tradeid_hidden", "text", "Trade ID").setDisplayType("hidden").setDefaultValue(tradeId);
        form.addSubmitButton("Create VPA");
        form.setScript("customscript_tradein_createpo_cs");
        response.writePage(form);
    } else {
        // -----POST---------------------
        var vendID = request.getParameter("custpage_vendfld");
        var tradeId = request.getParameter("custpage_tradeid_hidden");
        var modelId = request.getParameter("custpage_modelfld");
        var chasisId = request.getParameter("custpage_chasis");
        // var locationId = request.getParameter("custpage_locfld");
        var TradeInValue = request.getParameter("custpage_tradein");
        var OverTradeValue = request.getParameter("custpage_overtrade");
        var TradeCostValue = request.getParameter("custpage_cost");
        //Commision
        var custpage_eff = request.getParameter("custpage_eff");
        var custpage_sales = request.getParameter("custpage_sales");
        var custpage_radio = request.getParameter("custpage_radio");

        nlapiLogExecution("ERROR", "chasisId POST", chasisId + ' custpage_radio ' + custpage_radio);


        var fields = [
            "name",
            "custrecord_st_v_m_model_variant",
            "custrecord_advs_vm_model_year",
            "cseg_advs_sto_num",
            "custrecord_advs_vm_invoice_amount"
        ];
        var chasisValues = nlapiLookupField("customrecord_advs_vm", chasisId, fields);

        var amount = chasisValues.custrecord_advs_vm_invoice_amount;
        var vin = chasisValues.name;
        var year = chasisValues.custrecord_advs_vm_model_year;
        var stock = chasisValues.cseg_advs_sto_num;
        var model = chasisValues.custrecord_st_v_m_model_variant

        // var PurchaseRec = nlapiCreateRecord("purchaseorder", { recordmode: "dynamic" });
        // PurchaseRec.setFieldValue("customform", "357");
        // PurchaseRec.setFieldValue("entity", vendID);
        // PurchaseRec.setFieldValue("class", "19"); // POS Location
        // PurchaseRec.setFieldValue("location", 12); // EPOPL-7KC-Showroom
        // PurchaseRec.setFieldValue("custbody_advs_is_trade_in_po", "T");
        // PurchaseRec.setFieldValue("custbody_created_from_trd_scrn", "T");
        // PurchaseRec.setFieldValue("custbody_advs_created_from", tradeId);
        // PurchaseRec.setFieldValue("custbody_advs_module_name", '1');

        // PurchaseRec.setFieldValue("custbody_advs_trade_in", TradeInValue);
        // PurchaseRec.setFieldValue("custbody_advs_over_trade", OverTradeValue);
        // PurchaseRec.setFieldValue("custbody_advs_trade_cost", TradeCostValue);

        // PurchaseRec.setFieldValue("custbody_sales_effciency_comm", custpage_eff);
        // PurchaseRec.setFieldValue("custbody_advs_sales_comm", custpage_sales);
        // PurchaseRec.setFieldValue("custbody_sales_eff_option", custpage_radio);

        // PurchaseRec.selectNewLineItem("item");
        // PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_selected_inventory_type", '1');
        // PurchaseRec.setCurrentLineItemValue("item", "item", model);
        // PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_task_item", model);
        // PurchaseRec.setCurrentLineItemValue("item", "quantity", 1);
        // PurchaseRec.setCurrentLineItemValue("item", "rate", TradeInValue || '0');
        // PurchaseRec.setCurrentLineItemValue("item", "class", 19);
        // PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_st_vin_purchase", vin);
        // PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_st_model_year", year);
        // PurchaseRec.setCurrentLineItemValue("item", "cseg_advs_sto_num", stock);
        // PurchaseRec.commitLineItem("item");

        // var poid = nlapiSubmitRecord(PurchaseRec, true, true);
        var poid = 16780;

        nlapiLogExecution("ERROR", "poid", poid);
        nlapiSetRedirectURL("RECORD", "purchaseorder", poid, false);
        if (poid) {

            var poRec = nlapiLoadRecord('purchaseorder', poid);
            var poNumber = poRec.getFieldValue('tranid') || '';
            var vendorName = poRec.getFieldText('entity') || '';
            nlapiLogExecution("ERROR", "lookup", poNumber);

            var emailSetup = GetEmailSetup_Approver();
            var subject = emailSetup.smEmailSubject;
            var smEmailBody = emailSetup.smEmailBody;
            subject = subject.replace('@VPAno@', poNumber || '');

            smEmailBody = smEmailBody.replace('@VPAno@', poNumber || '');
            smEmailBody = smEmailBody.replace('@vendor@', vendorName || '');
            smEmailBody = smEmailBody.replace('@chasis@', vin || '');
            smEmailBody = smEmailBody.replace('@salesefecomm@', custpage_eff || '');
            smEmailBody = smEmailBody.replace('@salesefecommtype@', custpage_radio || '');
            smEmailBody = smEmailBody.replace('@salescomm@', custpage_sales || '');
            smEmailBody = smEmailBody.replace('@tradein@', TradeInValue || '');
            smEmailBody = smEmailBody.replace('@overtrade@', OverTradeValue || '');
            smEmailBody = smEmailBody.replace('@cost@', TradeCostValue || '');

            // Build recipients array
            // var recipientsSM = [];
            // if (emailSetup.SMrecevier) {
            //     recipients = emailSetup.SMrecevier.split(',');
            //     for (var i = 0; i < recipients.length; i++) {
            //         recipientsSM[i] = recipients[i].trim();
            //     }
            // }
            // // Get current user
            // var currentUserId = nlapiGetUser();
            // // Send email
            // nlapiSendEmail(currentUserId, recipientsSM, subject, smEmailBody);

            // Send Email to Puchaser for Approve
            var currentUserId = nlapiGetUser();

            var baseUrl = nlapiResolveURL('SUITELET', 'customscript_advs_eoi_sm_approve', 'customdeploy_advs_ssvg_eoi_sm_approve', true);
            if (emailSetup.SMrecevier) {
                var recipientss = emailSetup.SMrecevier.split(',');
                for (var i = 0; i < recipientss.length; i++) {
                    var approverId = recipientss[i].trim();

                    var approveUrl = baseUrl + '&custparam_action=Approve&custparam_flag=4'
                        + '&custparam_recid=' + poid
                        + '&custparam_approver=' + approverId
                        + '&custparam_role=SM';

                    var rejectUrl = baseUrl + '&custparam_action=Reject&custparam_flag=4'
                        + '&custparam_recid=' + poid
                        + '&custparam_approver=' + approverId
                        + '&custparam_role=SM';

                    var smEmailBodyBase = smEmailBody;

                    smEmailBodyBase +=
                        "<html><head></head><body>" +
                        "<a href=\"" + approveUrl + "\" " +
                        "style=\"display:inline-block;padding:10px 20px;margin:5px;font-size:14px;" +
                        "color:#fff;background-color:#34ab56;border-radius:5px;text-decoration:none;font-family:sans-serif;\">" +
                        "Approve</a>" +
                        "&nbsp;&nbsp;&nbsp;" +
                        "<a href=\"" + rejectUrl + "\" " +
                        "style=\"display:inline-block;padding:10px 20px;margin:5px;font-size:14px;" +
                        "color:#fff;background-color:#e76f51;border-radius:5px;text-decoration:none;font-family:sans-serif;\">" +
                        "Reject</a>" +
                        "</body></html>";
                    nlapiSendEmail(currentUserId, approverId, subject+' (SM)', smEmailBodyBase);
                }
            }
            nlapiLogExecution("ERROR", "email send");

        }
        return;
    }
    function GetEmailSetup_Approver() {
        var setupData = {};
        var emailBody = '', emailSubject = '', recevier = '', sender = '';
        var filters = [
            new nlobjSearchFilter('isinactive', null, 'is', 'F')
        ];
        var columns = [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('custrecord_email_sub_epopl'),
            new nlobjSearchColumn('custrecord_email_body_epopl'),
            new nlobjSearchColumn('custrecord_sales_manager_epopl'),
            new nlobjSearchColumn('custrecord_purchase_manager_epopl')
        ];
        var searchResults = nlapiSearchRecord('customrecord_epopl_vpa_email_setup', null, filters, columns);

        if (searchResults && searchResults.length > 0) {
            var result = searchResults[0];
            emailBody = result.getValue('custrecord_email_body_epopl');
            emailSubject = result.getValue('custrecord_email_sub_epopl');
            SMrecevier = result.getValue('custrecord_sales_manager_epopl');
            PMrecevier = result.getValue('custrecord_purchase_manager_epopl');
        }
        setupData.smEmailBody = emailBody;
        setupData.smEmailSubject = emailSubject;
        setupData.SMrecevier = SMrecevier;
        setupData.PMrecevier = PMrecevier;

        return setupData;
    }

}