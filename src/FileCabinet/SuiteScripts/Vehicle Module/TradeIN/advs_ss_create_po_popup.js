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
        var vinid = request.getParameter("vinid");
        nlapiLogExecution("ERROR", "tradeId", tradeId);
        nlapiLogExecution("ERROR", "CustIsCustomer", CustIsCustomer);
        var form = nlapiCreateForm("Create VPA");

        // Vendor Dropdown
        var vendorFilters = [
            new nlobjSearchFilter("subsidiary", null, "anyof", 19),
            new nlobjSearchFilter("isinactive", null, "is", "F")
        ];
        var vendorColumns = [new nlobjSearchColumn("entityid"),
        new nlobjSearchColumn("companyname")];
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

         form.addField('custpage_eff', 'text', 'Sales Efficiency Commission');
         var radioField = form.addField('custpage_radio', 'select', 'Sales Efficiency Commission Option');
         radioField.addSelectOption('', ''); 
         radioField.addSelectOption('1', '100%'); 
         radioField.addSelectOption('2', '60/40'); 
         form.addField('custpage_sales', 'text', 'Sales Commission');
 
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

        var locationField = form.addField("custpage_locfld", "select", "Location");
        locationField.setMandatory(true);
        locationField.addSelectOption("", "");

        var locationFilters = [
            new nlobjSearchFilter("subsidiary", null, "anyof", 19),
            new nlobjSearchFilter("isinactive", null, "is", "F")
        ];
        var locationColumns = [new nlobjSearchColumn("name")];
        var locationResults = nlapiSearchRecord("location", null, locationFilters, locationColumns);

        if (locationResults && locationResults.length > 0) {
            for (var k = 0; k < locationResults.length; k++) {
                var locId = locationResults[k].getId();
                var locName = locationResults[k].getValue("name");
                locationField.addSelectOption(locId, locName);
            }
        }

        if (tradeId) {

            var lookup = nlapiLookupField(
                'customrecord_advs_tradein_info_opp',
                tradeId,
                ['custrecord_advs_t_i_o_trade_amount', 'custrecord415']
            );
            Cost = 0;
            var TradeIn = lookup.custrecord_advs_t_i_o_trade_amount;
            var OverTrade = lookup.custrecord415;
            Cost = (TradeIn - OverTrade) * 1

            var TradeinField = form.addField("custpage_tradein", "currency", "Trade In value");
            TradeinField.disabled = true; // disable field

            if (TradeIn) {
                TradeinField.setDefaultValue(TradeIn);
            } else {
                TradeinField.setDefaultValue('0');
            }
            var OverTradeField = form.addField("custpage_overtrade", "currency", "Over Trade");
            OverTradeField.disabled = true; // disable field

            if (OverTrade) {
                OverTradeField.setDefaultValue(OverTrade);
            } else {
                OverTradeField.setDefaultValue('0');
            }
            var CostField = form.addField("custpage_cost", "currency", "Cost");
            CostField.disabled = true; // disable field
            if (Cost) {
                CostField.setDefaultValue(Cost);
            }
        }

        //         form.addButton(
        //     "custpage_btn_new_model", 
        //     "Create New Model", 
        //     "window.open('/app/common/item/item.nl?itemtype=InvtPart&isserialitem=T&cf=398&itemusesbins=F&whence=', '_blank');"
        // );

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
                "window.open('https://9908878-sb1.app.netsuite.com/app/common/entity/vendor.nl?cf=-20&whence=', '_blank');"
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
        var locationId = request.getParameter("custpage_locfld");

        var TradeInValue = request.getParameter("custpage_tradein");
        var OverTradeValue = request.getParameter("custpage_overtrade");
        var TradeCostValue = request.getParameter("custpage_cost");

         nlapiLogExecution("ERROR", "vendID in POST", vendID);
         nlapiLogExecution("ERROR", "tradeId in POST ", tradeId);
        // nlapiLogExecution("ERROR", "modelId", modelId);
        // nlapiLogExecution("ERROR", "locationId", locationId);
         nlapiLogExecution("ERROR", "chasisId POST", chasisId);

      if(tradeId){ // Its will blank if user come from VPA Tradine Button
        var fields = [
            "custrecord_advs_t_i_o_trade_amount",
            "custrecord_advs_t_i_o_unit",
            "custrecord_advs_t_i_o_mdl_yr",
            "custrecord_advs_t_i_o_stock_number"
        ];

        var tradeValues = nlapiLookupField("customrecord_advs_tradein_info_opp", tradeId, fields);

        var tamount = tradeValues.custrecord_advs_t_i_o_trade_amount;
        var tvin = tradeValues.custrecord_advs_t_i_o_unit;
        var tyear = tradeValues.custrecord_advs_t_i_o_mdl_yr;
        var tstock = tradeValues.custrecord_advs_t_i_o_stock_number;
    }


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


        var PurchaseRec = nlapiCreateRecord("purchaseorder", { recordmode: "dynamic" });
        PurchaseRec.setFieldValue("customform", "357");
        PurchaseRec.setFieldValue("entity", vendID);
        //PurchaseRec.setFieldValue("subsidiary", "19");
        PurchaseRec.setFieldValue("class", "19"); // POS Location
        PurchaseRec.setFieldValue("location", locationId);
        PurchaseRec.setFieldValue("custbody_advs_is_trade_in_po", "T");
        PurchaseRec.setFieldValue("custbody_created_from_trd_scrn", "T");
        PurchaseRec.setFieldValue("custbody_advs_created_from", tradeId);
        PurchaseRec.setFieldValue("custbody_advs_module_name", '1');

        PurchaseRec.setFieldValue("custbody_advs_trade_in_link", tradeId);
        PurchaseRec.setFieldValue("custbody_advs_trade_in", TradeInValue);
        PurchaseRec.setFieldValue("custbody_advs_over_trade", OverTradeValue);
        PurchaseRec.setFieldValue("custbody_advs_trade_cost", TradeCostValue);

        PurchaseRec.selectNewLineItem("item");
        PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_selected_inventory_type", '1');
        PurchaseRec.setCurrentLineItemValue("item", "item", model);
        PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_task_item", model);
        PurchaseRec.setCurrentLineItemValue("item", "quantity", 1);
        PurchaseRec.setCurrentLineItemValue("item", "rate", tamount || '0');
        PurchaseRec.setCurrentLineItemValue("item", "class", 19);
        PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_st_vin_purchase", vin);
        PurchaseRec.setCurrentLineItemValue("item", "custcol_advs_st_model_year", year);
        PurchaseRec.setCurrentLineItemValue("item", "cseg_advs_sto_num", stock);
        PurchaseRec.commitLineItem("item");

        var poid = nlapiSubmitRecord(PurchaseRec, true, true);
        nlapiLogExecution("ERROR", "poid", poid);
        if(tradeId){
          nlapiSubmitField("customrecord_advs_tradein_info_opp", tradeId, "custrecord_advs_t_i_o_po_link", poid);
        }
        nlapiSetRedirectURL("RECORD", "purchaseorder", poid, false);
        return;
    }
}