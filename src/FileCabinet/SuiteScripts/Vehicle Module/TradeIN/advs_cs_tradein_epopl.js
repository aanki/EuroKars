/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/url', 'N/https'], 
function (currentRecord, search, url, https) {

    function fieldChanged(context) {
        var rec = context.currentRecord;
        var name = context.fieldId;

        if (name === 'custpage_subsidiary') {
            var subsidiary = rec.getValue('custpage_subsidiary');
            var loc = window.location.href;
            loc = loc.replace(/(&custpage_subsidiary=)[^&]*/, '');
            if (loc.indexOf('custpage_subsidiary=') === -1) {
                if (loc.indexOf('?') === -1) {
                    loc += '?custpage_subsidiary=' + subsidiary;
                } else {
                    loc += '&custpage_subsidiary=' + subsidiary;
                }
            } else {
                loc += '&custpage_subsidiary=' + subsidiary;
            }
            window.location.href = loc;
        }

        if (name === 'custpage_purchaser') {
            var purchaser = rec.getValue('custpage_purchaser');
            var loc = window.location.href;
            loc = loc.replace(/(&custpage_purchaser=)[^&]*/, '');
            if (loc.indexOf('custpage_purchaser=') === -1) {
                if (loc.indexOf('?') === -1) {
                    loc += '?custpage_purchaser=' + purchaser;
                } else {
                    loc += '&custpage_purchaser=' + purchaser;
                }
            } else {
                loc += '&custpage_purchaser=' + purchaser;
            }
            window.location.href = loc;
        }

        if (name === 'custpage_type_record_e') {
            var filterType = rec.getValue('custpage_type_record_e');
            var loc = window.location.href;
            loc = loc.replace(/(&custparam_type_record_e=)[^&]*/, '');
            loc += '&custparam_type_record_e=' + (filterType || '');
            window.location.href = loc;
        }

        if (name === 'custpage_overtrade' || name === 'custpage_eff' || name === 'custpage_sales') {
            recalcCost(rec);
        }
    }

    function recalcCost(rec) {
        var tradeIn   = parseFloat(rec.getValue('custpage_tradein')) || 0;
        var overTrade = parseFloat(rec.getValue('custpage_overtrade')) || 0;
        var eff       = parseFloat(rec.getValue('custpage_eff')) || 0;
        var sales     = parseFloat(rec.getValue('custpage_sales')) || 0;

        var cost = (tradeIn - overTrade) + eff + sales;
        rec.setValue('custpage_cost', cost);
    }

    function createVendor() {
        var rec = currentRecord.get();
        var tradeId = rec.getValue('custpage_tradeid_hidden');

        // lookupField equivalent in client script → use Search
        var soLookup = search.lookupFields({
            type: 'customrecord_advs_tradein_info_opp',
            id: tradeId,
            columns: ['custrecord_advs_t_i_info_so']
        });
        var soId = soLookup.custrecord_advs_t_i_info_so;

        var soEntity = search.lookupFields({
            type: search.Type.SALES_ORDER,
            id: soId,
            columns: ['entity']
        });
        var customer = soEntity.entity[0] ? soEntity.entity[0].text : null;

        var vendorExists = false;
        var vendorSearch = search.create({
            type: search.Type.VENDOR,
            filters: [['entityid', 'is', customer]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (vendorSearch && vendorSearch.length > 0) {
            vendorExists = true;
            alert("Vendor already exist!");
        }

        if (!vendorExists) {
            var slUrl = url.resolveScript({
                scriptId: 'customscript_advs_ss_cretae_vendor',
                deploymentId: 'customdeploy_advs_ss_create_vendor',
                returnExternalUrl: false,
                params: { createvendor: 'T', tradeid: tradeId }
            });

            var response = https.get({ url: slUrl });
            if (response.code === 200) {
                alert('Vendor Created Successfully!');
                location.reload();
            }
        }
    }

    function createModel() {
        var rec = currentRecord.get();
        var tradeId = rec.getValue('custpage_tradeid_hidden');

        var slUrl = url.resolveScript({
            scriptId: 'customscript_advs_ss_create_model',
            deploymentId: 'customdeploy_advs_ss_create_model',
            returnExternalUrl: false,
            params: { createvendor: 'T', tradeid: tradeId }
        });

        var response = https.get({ url: slUrl });
        if (response.code === 200) {
            location.reload();
        }
    }

    return {
        fieldChanged: fieldChanged,
        createVendor: createVendor,
        createModel: createModel
    };
});
