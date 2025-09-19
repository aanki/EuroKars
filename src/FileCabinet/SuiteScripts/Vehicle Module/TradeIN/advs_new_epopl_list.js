/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/format'],
    function (serverWidget, search, url, format) {

        var RecordNumber = 0;

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var request = context.request;
                var form = serverWidget.createForm({ title: 'Trade-In List' });

                // Purchaser Field
                var PurchaserField = form.addField({
                    id: 'custpage_purchaser',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Purchaser Name'
                });

                var selectedPurchaser = request.parameters.custpage_purchaser;
                if (selectedPurchaser) {
                    PurchaserField.defaultValue = selectedPurchaser;
                }

                var modelField = form.addField({
                    id: 'custpage_model',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Model',
                    source: 'serializedinventoryitem'
                });
                var selectedModel = request.parameters.custpage_model;
                if (selectedModel) {
                    modelField.defaultValue = selectedModel;
                }
                //Make filter
                var makeField = form.addField({
                    id: 'custpage_make',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Model',
                    source: 'customrecord_advs_st_model_option'
                });
                var selectedMake = request.parameters.custpage_make;
                if (selectedMake) {
                    makeField.defaultValue = selectedMake;
                }

                // Count field
                var countField = form.addField({
                    id: 'custpage_sublist_count',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Record Count'
                });
                countField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                // Add sublist
                var sublist = form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Trade-In List'
                });

                // Sublist fields
                sublist.addField({ id: 'custpage_line_button', type: serverWidget.FieldType.TEXT, label: 'Action' });
                sublist.addField({ id: 'custpage_line_reg_no', type: serverWidget.FieldType.TEXT, label: 'Registration Number' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_vin', type: serverWidget.FieldType.TEXT, label: 'Chassis Number' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_prchaser_name', type: serverWidget.FieldType.TEXT, label: 'Purchaser Name' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_assign_sc', type: serverWidget.FieldType.TEXT, label: 'Assigned SC' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_model', type: serverWidget.FieldType.TEXT, label: 'Model' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_brand', type: serverWidget.FieldType.TEXT, label: 'Vehicle Make' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_new_brand', type: serverWidget.FieldType.TEXT, label: 'New Car Brand' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_year', type: serverWidget.FieldType.TEXT, label: 'Registration Year' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_datecreated', type: serverWidget.FieldType.TEXT, label: 'Date Created' });
                sublist.addField({ id: 'custpage_line_coe', type: serverWidget.FieldType.TEXT, label: 'COE category' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_mileage', type: serverWidget.FieldType.TEXT, label: 'Mileage' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                sublist.addField({ id: 'custpage_line_reg_date', type: serverWidget.FieldType.DATE, label: 'Registration Date' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

                // Process data
                processData(null, sublist);
                countField.defaultValue = RecordNumber.toString();

                // Attach client script
                form.clientScriptModulePath = './advs_cs_tradein_epopl.js';

                context.response.writePage(form);
            }
        }

        function getAppvantageFilters(selectedSubsidiary) {
            var filters = [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_appvantage', 'is', 'T']
            ];
            if (selectedSubsidiary) {
                filters.push('AND', ['custrecord_advs_vm_subsidary', 'anyof', selectedSubsidiary]);
            }
            return filters;
        }

        function processData(selectedSubsidiary, sublist) {
            // Reset counter
            RecordNumber = 0;

            var appSearch = search.create({
                type: 'customrecord_advs_vm',
                filters: getAppvantageFilters(selectedSubsidiary),
                columns: [
                    'internalid',
                    'name',
                    'custrecord_advs_vm_model',
                    'custrecord_advs_vm_mileage',
                    'custrecord_advs_vm_vehicle_status',
                    'custrecord_advs_vm_vehicle_brand',
                    search.createColumn({ name: 'custrecord_advs_appvantage_brand', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecord_advs_appvantage_coe_cate', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecord_advs_appvantage_regi_date', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecord_advs_appvantage_f_regis_date', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecord_advs_appvantage_assigned_pur', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecord_advs_appvantage_ass_sc', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    search.createColumn({ name: 'custrecordadvs_appvantage_price', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }),
                    'custrecord_advs_vm_license_no_compressed',
                    'created'
                ]
            });

            // Use runPaged for better performance and control
            var pagedData = appSearch.runPaged({ pageSize: 1000 });
            var currentLine = 0; // Start from 0 for LIST sublist

            pagedData.pageRanges.forEach(function (pageRange) {
                var currentPage = pagedData.fetch({ index: pageRange.index });
                currentPage.data.forEach(function (result) {
                    // For LIST sublist, line numbers start from 0
                    populateAppvantageLine(sublist, result, currentLine);
                    RecordNumber++;
                    currentLine++;
                });
            });
        }

        function populateAppvantageLine(sublist, rec, line) {
            //try {
            // Date processing
            var RegDate = rec.getValue({ name: 'custrecord_advs_appvantage_regi_date', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            var regDateStr = null, Regyear = null, FirstregDateStr = null;

            if (RegDate) {
                try {
                    var regDateObj = format.parse({ value: RegDate, type: format.Type.DATE });
                    if (regDateObj) {
                        regDateStr = format.format({ value: regDateObj, type: format.Type.DATE });
                        Regyear = regDateObj.getFullYear().toString();
                    }
                } catch (e) {
                    console.error('Error parsing registration date:', e);
                }
            }

            var RegDateFirst = rec.getValue({ name: 'custrecord_advs_appvantage_f_regis_date', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            if (RegDateFirst) {
                try {
                    var regDateObj = format.parse({ value: RegDateFirst, type: format.Type.DATE });
                    if (regDateObj) {
                        FirstregDateStr = format.format({ value: regDateObj, type: format.Type.DATE });
                    }
                } catch (e) {
                    console.error('Error parsing first registration date:', e);
                }
            }

            // Set sublist values only if they have valid data
            // Model
            var modelText = rec.getText({ name: 'custrecord_advs_vm_model' });
            if (modelText) {
                sublist.setSublistValue({ id: 'custpage_line_model', line: line, value: modelText });
            }

            // VIN
            var vinValue = rec.getValue({ name: 'name' });
            if (vinValue) {
                sublist.setSublistValue({ id: 'custpage_line_vin', line: line, value: vinValue });
            }

            // New Brand
            var newBrandText = rec.getText({ name: 'custrecord_advs_appvantage_brand', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            if (newBrandText) {
                sublist.setSublistValue({ id: 'custpage_line_new_brand', line: line, value: newBrandText });
            }

            // Brand
            var brandText = rec.getText({ name: 'custrecord_advs_vm_vehicle_brand' });
            if (brandText) {
                sublist.setSublistValue({ id: 'custpage_line_brand', line: line, value: brandText });
            }
            // Year
            if (Regyear) {
                sublist.setSublistValue({ id: 'custpage_line_year', line: line, value: Regyear });
            }
            // Date Created
            var createdValue = rec.getValue({ name: 'created' });
            if (createdValue) {
                sublist.setSublistValue({ id: 'custpage_line_datecreated', line: line, value: createdValue });
            }

            // Mileage
            var mileageValue = rec.getValue({ name: 'custrecord_advs_vm_mileage' });
            if (mileageValue) {
                sublist.setSublistValue({ id: 'custpage_line_mileage', line: line, value: mileageValue });
            }

            // Purchaser Name
            var purchaserText = rec.getText({ name: 'custrecord_advs_appvantage_assigned_pur', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            if (purchaserText) {
                sublist.setSublistValue({ id: 'custpage_line_prchaser_name', line: line, value: purchaserText });
            }

            // Assigned SC
            var assignScText = rec.getText({ name: 'custrecord_advs_appvantage_ass_sc', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            if (assignScText) {
                sublist.setSublistValue({ id: 'custpage_line_assign_sc', line: line, value: assignScText });
            }
            // COE
            var coeText = rec.getText({ name: 'custrecord_advs_appvantage_coe_cate', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' });
            if (coeText) {
                sublist.setSublistValue({ id: 'custpage_line_coe', line: line, value: coeText });
            }

            // Registration Number
            var regNoValue = rec.getValue({ name: 'custrecord_advs_vm_license_no_compressed' });
            if (regNoValue) {
                sublist.setSublistValue({ id: 'custpage_line_reg_no', line: line, value: regNoValue });
            }

            // Registration Date
            if (regDateStr) {
                sublist.setSublistValue({ id: 'custpage_line_reg_date', line: line, value: regDateStr });
            }

            // Action Button - Always set this as it's required
            var internalId = rec.getValue({ name: 'internalid' });
            if (internalId) {

                var resolvedUrl = url.resolveScript({
                    scriptId: 'customscript_tradein_po_popup_sl',
                    deploymentId: 'customdeploy_tradein_po_popup_sl',
                    returnExternalUrl: false
                });

                var tradeInAmount = rec.getValue({ name: 'custrecordadvs_appvantage_price', join: 'CUSTRECORD_APPVANTAGE_VM_LINK' }) || '';
                var actionLink = resolvedUrl +
                    '&vinid=' + internalId +
                    '&tradeInAmnt=' + tradeInAmount +
                    '&orignlRegdate=' + (regDateStr || '') +
                    '&firstRegdate=' + (FirstregDateStr || '');

                sublist.setSublistValue({
                    id: 'custpage_line_button',
                    line: line,
                    value: "<u><a href='" + actionLink + "' target='_blank'><span style='color:#666;'>Create VPA</span></a></u>"
                });

            }

            // } catch (error) {
            //     log.debug('Error',line+' '+error)            
            // }
        }

        return { onRequest: onRequest };
    });