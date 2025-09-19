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
  var RecordNumber=0;
function suitelet(request, response) {
  
    var form = nlapiCreateForm("Trade-In List");
    var PurchaserField = form.addField("custpage_purchaser", "select", "Purchaser Name", "Employee");
     
    var selectedPurchaser = request.getParameter("custpage_purchaser");
    var selectedPurchaserText='';
    if (selectedPurchaser && selectedPurchaser!=null) {
        PurchaserField.setDefaultValue(selectedPurchaser);
        selectedPurchaserText = nlapiLookupField('employee', selectedPurchaser, 'entityid');
    }

    var countField = form.addField('custpage_sublist_count', 'integer', 'Record Count');
    countField.setDisplayType('inline');
   
    // Add sublist
    var sublist = form.addSubList("custpage_sublist", "list", "Trade-In List");
    sublist.addField("custpage_line_button", "text", "Action");
    sublist.addField("custpage_line_reg_no", "text", "Registration Number").setDisplayType("inline");
    sublist.addField("custpage_line_vin", "text", "Chassis Number").setDisplayType("inline");
    sublist.addField("custpage_line_prchaser_name", "text", "Purchaser Name").setDisplayType("inline");
    sublist.addField("custpage_line_assign_sc", "text", "Assigned SC").setDisplayType("inline");
    sublist.addField("custpage_line_model", "text", "Model").setDisplayType("inline");
    sublist.addField("custpage_line_brand", "text", "Vehicle Make").setDisplayType("inline");
    sublist.addField("custpage_line_new_brand", "text", "New Car Brand").setDisplayType("inline");
    sublist.addField("custpage_line_year", "text", "Registration Year").setDisplayType("inline");
    sublist.addField("custpage_line_datecreated", "text", "Date Created");
    sublist.addField("custpage_line_coe", "text", "COE category").setDisplayType("inline");
    sublist.addField("custpage_line_mileage", "text", "Mileage").setDisplayType("inline");
    sublist.addField("custpage_line_reg_date", "date", "Registration Date").setDisplayType("inline");
    
    processData(selectedSubsidiary, sublist);
    countField.setDefaultValue((RecordNumber).toString());
    // Attach client script
    form.setScript("customscript_tradein_createpo_cs");
    response.writePage(form);
}

function runSearch(recordType, filters, columns) {
    return nlapiCreateSearch(recordType, filters, columns).runSearch();
}


function getAppvantageFilters(selectedSubsidiary) {
    var filters = [["isinactive", "is", "F"], "AND", ["custrecord_appvantage", "is", "T"]];
    if (selectedSubsidiary) {
        filters.push("AND", ["custrecord_advs_vm_subsidary", "anyof", selectedSubsidiary]);
    }
    return filters;
}

function populateAppvantageLine(sublist, rec, line) {
    var RegDate = rec.getValue("custrecord_advs_appvantage_regi_date", "CUSTRECORD_APPVANTAGE_VM_LINK");
    var regDateStr = "", Regyear = "",FirstregDateStr = "";

    if (RegDate) {
        var dateOnly = RegDate.split(" ")[0];
        var regDateObj = nlapiStringToDate(dateOnly);
        regDateStr = nlapiDateToString(regDateObj);
        Regyear = regDateObj.getFullYear().toString();
    }
    var RegDateFirst = rec.getValue("custrecord_advs_appvantage_f_regis_date", "CUSTRECORD_APPVANTAGE_VM_LINK");
     if (RegDateFirst) {
        var dateOnly = RegDateFirst.split(" ")[0];
        var regDateObj = nlapiStringToDate(dateOnly);
        FirstregDateStr = nlapiDateToString(regDateObj);
    }

    sublist.setLineItemValue("custpage_line_model", line, rec.getText("custrecord_advs_vm_model"));
    sublist.setLineItemValue("custpage_line_vin", line, rec.getValue("name"));
    //sublist.setLineItemValue("custpage_line_vin_status", line, rec.getText("custrecord_advs_vm_vehicle_status"));
    //sublist.setLineItemValue("custpage_line_amount", line, rec.getValue("custrecordadvs_appvantage_price", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_new_brand", line, rec.getText("custrecord_advs_appvantage_brand", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_brand", line, rec.getText("custrecord_advs_vm_vehicle_brand"));
    sublist.setLineItemValue("custpage_line_year", line, Regyear);
    sublist.setLineItemValue("custpage_line_datecreated", line, rec.getValue("created"));
    sublist.setLineItemValue("custpage_line_mileage", line, rec.getValue("custrecord_advs_vm_mileage"));
    sublist.setLineItemValue("custpage_line_prchaser_name", line, rec.getValue("custrecord_advs_appvantage_assigned_pur", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_assign_sc", line, rec.getValue("custrecord_advs_appvantage_ass_sc", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_coe", line, rec.getValue("custrecord_advs_appvantage_coe_cate", "CUSTRECORD_APPVANTAGE_VM_LINK"));
    sublist.setLineItemValue("custpage_line_reg_no", line, rec.getValue("custrecord_advs_vm_license_no_compressed"));
    sublist.setLineItemValue("custpage_line_reg_date", line, regDateStr);
    var url = nlapiResolveURL("SUITELET", "customscript_tradein_po_popup_sl", "customdeploy_tradein_po_popup_sl", false);
    url += "&vinid=" + rec.getValue("internalid");
    url += "&tradeInAmnt=" + rec.getValue("custrecordadvs_appvantage_price", "CUSTRECORD_APPVANTAGE_VM_LINK");
    url += "&orignlRegdate=" + regDateStr;
    url += "&firstRegdate=" + FirstregDateStr;
    sublist.setLineItemValue("custpage_line_button", line, "<u><a href='" + url + "' target='_blank'><span style='color:#666;'>Create VPA</span></a></u>");
}


function processData(selectedSubsidiary, sublist, line) {

    if (!line) line = 1;
        var appSearch = runSearch("customrecord_advs_vm", getAppvantageFilters(selectedSubsidiary), [
            new nlobjSearchColumn("internalid"),
            new nlobjSearchColumn("name"),
            new nlobjSearchColumn("custrecord_advs_vm_model"),
            new nlobjSearchColumn("custrecord_advs_vm_mileage"),
            new nlobjSearchColumn("custrecord_advs_vm_vehicle_status"),
            new nlobjSearchColumn("custrecord_advs_vm_vehicle_brand"),
            new nlobjSearchColumn("custrecord_advs_appvantage_brand", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_coe_cate", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_regi_date", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_f_regis_date", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_assigned_pur", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_appvantage_ass_sc", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecordadvs_appvantage_price", "CUSTRECORD_APPVANTAGE_VM_LINK"),
            new nlobjSearchColumn("custrecord_advs_vm_license_no_compressed"),
            new nlobjSearchColumn("created")
        ]);

        appSearch.forEachResult(function (rec) {
            populateAppvantageLine(sublist, rec, line++);
            RecordNumber++;
            return true;
        });

    return line;
}

