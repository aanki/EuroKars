/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       02 Jul 2025     
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response) {
    var form = nlapiCreateForm("Trade-In List");

    var subsidiaryField = form.addField("custpage_subsidiary", "select", "Subsidiary");

    subsidiaryField.addSelectOption('', '', true);

    var subSearch = nlapiSearchRecord('subsidiary', null, null, [
        new nlobjSearchColumn('namenohierarchy')
    ]);

    if (subSearch) {
        for (var i = 0; i < subSearch.length; i++) {
            var id = subSearch[i].getId();
            var name = subSearch[i].getValue('namenohierarchy');
            subsidiaryField.addSelectOption(id, name);
        }
    }

    var PurchaserField = form.addField("custpage_purchaser", "select", "Purchaser Name", "Employee");
    var selectedSubsidiary = request.getParameter("custpage_subsidiary");
    if (selectedSubsidiary) {
        subsidiaryField.setDefaultValue(selectedSubsidiary);
    }

    var selectedPurchaser = request.getParameter("custpage_purchaser");
    var selectedPurchaserText='';
    if (selectedPurchaser) {
        PurchaserField.setDefaultValue(selectedPurchaser);
        selectedPurchaserText = nlapiLookupField('employee', selectedPurchaser, 'entityid');
    }
  
    var typeValueF = request.getParameter("custparam_type_record_e");

    var TypeFiled = form.addField("custpage_type_record_e", "SELECT", "TYPE");

    TypeFiled.addSelectOption('', '', true);

    TypeFiled.addSelectOption('1', 'From VSA');
    TypeFiled.addSelectOption('2', 'From ETI');

    if (typeValueF) {
        TypeFiled.setDefaultValue(typeValueF);
    }

    // Add sublist
    var sublist = form.addSubList("custpage_sublist", "list", "Trade-In List");
    sublist.addField("custpage_line_so", "select", "VSA #", 'salesorder').setDisplayType("inline");
    sublist.addField("custpage_line_tradeid", "text", "Trade #").setDisplayType("inline");
    sublist.addField("custpage_line_model", "text", "Model").setDisplayType("inline");
    sublist.addField("custpage_line_brand", "text", "Brand").setDisplayType("inline");
    sublist.addField("custpage_line_year", "text", "Registration Year").setDisplayType("inline");
    sublist.addField("custpage_line_vin", "text", "Vin").setDisplayType("inline");
    sublist.addField("custpage_line_button", "text", "Action");
    //sublist.addField("custpage_line_prchaser_name", "select", "Purchaser Name", 'Employee').setDisplayType("inline");
    sublist.addField("custpage_line_prchaser_name", "text", "Purchaser Name").setDisplayType("inline");
    sublist.addField("custpage_line_customer_is_vendor", "checkbox", "Customer Is Owner").setDisplayType("inline");
    sublist.addField("custpage_line_stock", "text", "Stock").setDisplayType("inline");
    sublist.addField("custpage_line_coe", "text", "COE category").setDisplayType("inline");
    sublist.addField("custpage_line_reg_no", "text", "Registration Number").setDisplayType("inline");
    sublist.addField("custpage_line_agent", "text", "Agent").setDisplayType("inline");
    sublist.addField("custpage_line_mileage", "text", "Mileage").setDisplayType("inline");
    sublist.addField("custpage_line_reg_date", "date", "Registration Date").setDisplayType("inline");
    sublist.addField("custpage_line_ownership", "text", "Ownership").setDisplayType("inline");
    sublist.addField("custpage_line_amount", "currency", "Trade-In Value").setDisplayType("inline");

    nlapiLogExecution("Error", "typeValueF ", typeValueF+' selectedPurchaser '+selectedPurchaserText);

    processData(typeValueF, selectedSubsidiary, selectedPurchaserText, sublist);

    if (!typeValueF) {
        // If both needed
        var line = 1;
        line = processData("1", selectedSubsidiary, selectedPurchaserText, sublist, line);
        line = processData("2", selectedSubsidiary, selectedPurchaserText, sublist, line);
    }

    // Attach client script
    form.setScript("customscript_tradein_createpo_cs");
    response.writePage(form);
}

function runSearch(recordType, filters, columns) {
    return nlapiCreateSearch(recordType, filters, columns).runSearch();
}
function getTradeInFilters(selectedSubsidiary, selectedPurchaser) {
    var filters = [["isinactive", "is", "F"]];
    filters.push("AND", ["custrecord_advs_t_i_o_po_link", "anyof", "@NONE@"]);
    filters.push("AND", ["custrecord_whos_trading", "anyof", "1"]); // Trading By EPOPL

    if (selectedSubsidiary) {
        filters.push("AND", ["custrecord_advs_t_i_info_so.subsidiary", "anyof", selectedSubsidiary]);
        filters.push("AND", ["custrecord_advs_t_i_info_so.mainline", "is", "T"]);
    }
    if (selectedPurchaser) {
        filters.push("AND", ["custrecord_purchaser_name", "is", selectedPurchaser]);
    }
    return filters;
}

function getAppvantageFilters(selectedSubsidiary) {
    var filters = [["isinactive", "is", "F"], "AND", ["custrecord_appvantage", "is", "T"]];
    if (selectedSubsidiary) {
        filters.push("AND", ["custrecord_advs_vm_subsidary", "anyof", selectedSubsidiary]);
    }
    return filters;
}

function populateTradeInLine(sublist, rec, line) {
    var tradeId = rec.getValue("internalid");
    var CustIsOwner = rec.getValue("custrecord_customer_is_owner");

    sublist.setLineItemValue("custpage_line_so", line, rec.getValue("custrecord_advs_t_i_info_so"));
    sublist.setLineItemValue("custpage_line_tradeid", line, rec.getValue("name"));
    sublist.setLineItemValue("custpage_line_model", line, rec.getValue("custrecord_advs_t_i_i_model_no"));
    sublist.setLineItemValue("custpage_line_vin", line, rec.getValue("custrecord_advs_t_i_o_unit"));
    sublist.setLineItemValue("custpage_line_amount", line, rec.getValue("custrecord_advs_t_i_o_trade_amount"));
    sublist.setLineItemValue("custpage_line_brand", line, rec.getValue("custrecord_advs_t_i_o_brand"));
    sublist.setLineItemValue("custpage_line_year", line, rec.getText("custrecord_advs_t_i_o_mdl_yr"));
    sublist.setLineItemValue("custpage_line_stock", line, rec.getValue("custrecord_advs_t_i_o_stock_number"));
    sublist.setLineItemValue("custpage_line_mileage", line, rec.getValue("custrecord_advs_mileage"));
    sublist.setLineItemValue("custpage_line_coe", line, rec.getText("custrecord414"));
    sublist.setLineItemValue("custpage_line_reg_no", line, rec.getValue("custrecord413"));
    sublist.setLineItemValue("custpage_line_agent", line, rec.getText("custrecord_advs_agent"));
    sublist.setLineItemValue("custpage_line_reg_date", line, rec.getValue("custrecord_advs_reg_date"));
    sublist.setLineItemValue("custpage_line_ownership", line, rec.getText("custrecord_advs_ownership"));
    sublist.setLineItemValue("custpage_line_prchaser_name", line, rec.getValue("custrecord_purchaser_name"));
    sublist.setLineItemValue("custpage_line_customer_is_vendor", line, CustIsOwner);

    var url = nlapiResolveURL("SUITELET", "customscript_tradein_po_popup_sl", "customdeploy_tradein_po_popup_sl", false);
    url += "&tradeid=" + tradeId + "&cust_is_owner=" + CustIsOwner;

    sublist.setLineItemValue("custpage_line_button", line, "<u><a href='" + url + "' target='_blank'><span style='color:#666;'>Create VPA</span></a></u>");

}

function populateAppvantageLine(sublist, rec, line) {
    var RegDate = rec.getValue("custrecord_advs_appvantage_regi_date", "CUSTRECORD_APPVANTAGE_VM_LINK");
    var regDateStr = "", Regyear = "";

    if (RegDate) {
        var dateOnly = RegDate.split(" ")[0];
        var regDateObj = nlapiStringToDate(dateOnly);
        regDateStr = nlapiDateToString(regDateObj);
        Regyear = regDateObj.getFullYear().toString();
    }

    sublist.setLineItemValue("custpage_line_so", line, "");
    sublist.setLineItemValue("custpage_line_tradeid", line, " ");
    sublist.setLineItemValue("custpage_line_model", line, rec.getText("custrecord_advs_vm_model"));
    sublist.setLineItemValue("custpage_line_vin", line, rec.getValue("name"));
    sublist.setLineItemValue("custpage_line_amount", line, rec.getValue("custrecordadvs_appvantage_open_mkt_v", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_brand", line, rec.getText("custrecord_advs_appvantage_brand", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_year", line, Regyear);
    sublist.setLineItemValue("custpage_line_stock", line, " ");
    sublist.setLineItemValue("custpage_line_mileage", line, rec.getValue("custrecord_advs_vm_mileage"));
    sublist.setLineItemValue("custpage_line_coe", line, rec.getValue("custrecord_advs_appvantage_coe_cate", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_reg_no", line, rec.getValue("custrecord_registration_number"));
    sublist.setLineItemValue("custpage_line_agent", line, "");
    sublist.setLineItemValue("custpage_line_reg_date", line, regDateStr);
    sublist.setLineItemValue("custpage_line_ownership", line, "");
    var url = nlapiResolveURL("SUITELET", "customscript_tradein_po_popup_sl", "customdeploy_tradein_po_popup_sl", false);
    url += "&vinid=" + rec.getValue("internalid");
    sublist.setLineItemValue("custpage_line_button", line, "<u><a href='" + url + "' target='_blank'><span style='color:#666;'>Create VPA</span></a></u>");
}


function processData(typeValueF, selectedSubsidiary, selectedPurchaser, sublist, line) {


    if (!line) line = 1;

    if (typeValueF == "1" || typeValueF == 1) {

        var tradeInSearch = runSearch("customrecord_advs_tradein_info_opp", getTradeInFilters(selectedSubsidiary, selectedPurchaser), [
            new nlobjSearchColumn("internalid"),
            new nlobjSearchColumn("name"),
            new nlobjSearchColumn("custrecord_advs_t_i_info_so"),
            new nlobjSearchColumn("custrecord_advs_t_i_i_model_no"),
            new nlobjSearchColumn("custrecord_advs_t_i_o_trade_amount"),
            new nlobjSearchColumn("custrecord_advs_t_i_o_unit"),
            new nlobjSearchColumn("custrecord_advs_t_i_o_brand"),
            new nlobjSearchColumn("custrecord_advs_t_i_o_mdl_yr"),
            new nlobjSearchColumn("custrecord_advs_t_i_o_stock_number"),
            new nlobjSearchColumn("custrecord_advs_mileage"),
            new nlobjSearchColumn("custrecord414"),
            new nlobjSearchColumn("custrecord413"),
            new nlobjSearchColumn("custrecord_advs_agent"),
            new nlobjSearchColumn("custrecord_advs_reg_date"),
            new nlobjSearchColumn("custrecord_advs_ownership"),
            new nlobjSearchColumn("custrecord_purchaser_name"),
            new nlobjSearchColumn("custrecord_customer_is_owner"),
        ]);

        tradeInSearch.forEachResult(function (rec) {
            populateTradeInLine(sublist, rec, line++);


            return true;
        });



    }


    if (typeValueF == "2" || typeValueF == 2) {

        var appSearch = runSearch("customrecord_advs_vm", getAppvantageFilters(selectedSubsidiary), [
            new nlobjSearchColumn("internalid"),
            new nlobjSearchColumn("name"),
            new nlobjSearchColumn("custrecord_advs_vm_model"),
            new nlobjSearchColumn("custrecord_advs_vm_mileage"),
            new nlobjSearchColumn("custrecord_advs_appvantage_brand", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_coe_cate", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_regi_date", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_assigned_pur", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecordadvs_appvantage_open_mkt_v", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_registration_number")
        ]);

        appSearch.forEachResult(function (rec) {
            populateAppvantageLine(sublist, rec, line++);
            return true;
        });

    }


    return line;


}

