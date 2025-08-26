/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/runtime'], function (search, record, runtime) {

    function execute(context) {
        // var poId = runtime.getCurrentScript().getParameter({ name: 'custscript_target_po_id' });

        // if (!poId) {
        //     log.error('Missing Parameter', 'No PO ID provided');
        //     return;
        // }

        // Run line-level search
        var poLineSearch = search.create({
            type: search.Type.PURCHASE_ORDER,
            filters: [
                // ['internalid', 'anyof', 1495],
                // "AND",
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["mainline", "is", "F"],
                "AND",
                ["custcol_advs_st_equipment_link", "anyof", "@NONE@"],
                "AND",
                ['taxline', 'is', 'F'],
                'AND',
                ['shipping', 'is', 'F'],
                "AND",
                ["custcol_advs_selected_inventory_type", "anyof", "1"],
                "AND",
                ["custcol_advs_st_vin_purchase", "isnotempty", ""]
            ],
            columns: [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
                'trandate',
                'internalid',
                'custcol_advs_st_vin_purchase',
                'applyingtransaction',
                'item',
                'custcol_advs_st_exterior_color',
                'location',
                'subsidiary',
                'department',
                'line',
                search.createColumn({ name: 'custitem_advs_st_vehicle_make', join: 'item' }),
                'custcol_advs_permit_num',
                'custcol_advs_so_engine_number',
                'custcol_advs_st_mach_serial_number',
                'custcol_advs_prod_month',
                'custcol_advs_st_model_year',
                'custcol_advs_vehicle_po_eta_column',
                'custcol_advs_case_number',
                search.createColumn({ name: "custrecord_st_m_o_description", join: "CUSTCOL_ADVS_ST_EXTERIOR_COLOR" })
            ]
        });

        poLineSearch.run().each(function (result) {
            try {
                var PoId = result.getValue("internalid");
                var PoDate = result.getValue("trandate");
                var VINNumber = result.getValue("custcol_advs_st_vin_purchase");
                var VariantID = result.getValue("item");
                var ModelID = result.getValue("parent", "item");
                var ExteriorCOlor = result.getValue("custcol_advs_st_exterior_color");
                var ColorDes = result.getValue("custrecord_st_m_o_description", "CUSTCOL_ADVS_ST_EXTERIOR_COLOR");
                var Location = result.getValue("location");
                var Subsidiary = result.getValue("subsidiary");
                var department = result.getValue("department");
                var MakeId = result.getValue("custitem_advs_st_vehicle_make", "item");
                var permitNumber = result.getValue("custcol_advs_permit_num");
                var engineNumber = result.getValue("custcol_advs_so_engine_number");
                var serialNumber = result.getValue("custcol_advs_st_mach_serial_number");
                var prodMonth = result.getValue("custcol_advs_prod_month");
                var prodYear = result.getValue("custcol_advs_st_model_year");
                var eta = result.getValue("custcol_advs_vehicle_po_eta_column");
                var caseNumber = result.getValue("custcol_advs_case_number");
                var LineId = result.getValue("line");

                if (PoDate) {
                    var parts = PoDate.split('/');
                    PoDate = new Date(parts[2], parts[1] - 1, parts[0]);
                }
                if (eta) {
                    var parts = eta.split('/');
                    eta = new Date(parts[2], parts[1] - 1, parts[0]);
                }

                var VIN_Master_ID = SearchEquipment(VINNumber);
               // var quniueNoSegmentid = generateVSNumber();
                if (!VIN_Master_ID) {
                    log.debug('Processing PO Line', 'PoId: ' + PoId + ', VIN: ' + VINNumber + ', VariantID: ' + VariantID + ', ModelID: ' + ModelID + ', ExteriorCOlor: ' + ExteriorCOlor + ', MakeId: ' + MakeId);// + ' quniueNoSegmentid: ' + quniueNoSegmentid
                    // Create new custom record
                    var newRec = record.create({ type: 'customrecord_advs_vm', isDynamic: true });
                    newRec.setValue({ fieldId: 'name', value: VINNumber });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_vehicle_brand', value: MakeId });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_model', value: ModelID });
                    newRec.setValue({ fieldId: 'custrecord_st_v_m_model_variant', value: VariantID });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_customer_number', value: 37 });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_exterior_color', value: ExteriorCOlor });
                    newRec.setValue({ fieldId: 'custrecord_advs_exterior_color_descp', value: ColorDes });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_reservation_status', value: 8 });  // On Hold
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_subsidary', value: Subsidiary });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_department', value: department });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_location_code', value: Location });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_vehicle_status', value: 1 }); // Inventory
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_purchase_invoice_date', value: PoDate });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_purchase_order', value: PoId });
                    newRec.setValue({ fieldId: 'custrecord_permit_number', value: permitNumber });
                    //newRec.setValue({ fieldId: 'cseg_advs_sto_num', value: quniueNoSegmentid });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_engine_number', value: engineNumber });
                    newRec.setValue({ fieldId: 'custrecord_advs_prod_month', value: prodMonth });
                    newRec.setValue({ fieldId: 'custrecord_advs_vm_model_year', value: prodYear });
                    newRec.setValue({ fieldId: 'custrecord_advs_eta', value: eta });
                    newRec.setValue({ fieldId: 'custrecord_case_number', value: caseNumber });
                    VIN_Master_ID = newRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.debug('Created Custom Record', 'ID: ' + VIN_Master_ID);

                } else {
                    log.debug('Vehicle Master Record already Exist, only updating line', VINNumber + ' PoId ' + PoId);
                }
                //Update VIN master on line

                var poRecObj = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: PoId,
                    isDynamic: true
                });
                var lineCount = poRecObj.getLineCount({ sublistId: 'item' });
                for (var i = 0; i < lineCount; i++) {

                    const lineIdCheck = poRecObj.getSublistValue({ sublistId: 'item', fieldId: 'line', line: i });
                    // Match line by VIN or other criteria (if item ID is needed, add a condition)
                    if (lineIdCheck == LineId) {
                        poRecObj.selectLine({ sublistId: 'item', line: i });
                        poRecObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_advs_st_equipment_link',
                            value: VIN_Master_ID
                        });
                        // poRecObj.setCurrentSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'cseg_advs_sto_num',
                        //     value: quniueNoSegmentid
                        // });
                        var inventoryDetail = poRecObj.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });
                        inventoryDetail.selectNewLine({ sublistId: 'inventoryassignment' });

                        inventoryDetail.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: VINNumber
                        });
                        inventoryDetail.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: 1
                        });
                        inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
                   
                        poRecObj.commitLine({ sublistId: 'item' });
                        break;
                    }
                }
                var POUpdated = poRecObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('PO saved', POUpdated);

                

            } catch (e) {
                log.error('Record Creation Failed', e.message);
            }

            return true;
        });


       

        function SearchEquipment(VIN) {
            if (!VIN || VIN.trim() === '') VIN = '';
            var equiId = 0;
            var equipmentSearch = search.create({
                type: 'customrecord_advs_vm',
                filters: [['name', 'is', VIN]],
                columns: ['internalid']
            });
            equipmentSearch.run().each(function (result) {
                equiId = result.getValue({ name: 'internalid' });
                return false;
            });
            return equiId;
        }
        function generateVSNumber() {
            // log.debug('generateVSNumber', 'Generating next VS- number');
            var counterRec = search.create({
                type: 'customrecord_unique_number_counter',
                columns: ['internalid', 'custrecord_unique_last_number', 'custrecord_unique_prefix']
            }).run().getRange({ start: 0, end: 1 });

            var lastNum = 0;
            var preFix = '';
            var recId;
            if (counterRec.length > 0) {
                recId = counterRec[0].id;
                lastNum = parseInt(counterRec[0].getValue('custrecord_unique_last_number')) || 0;
                preFix = counterRec[0].getValue('custrecord_unique_prefix');
            } else {
                var rec = record.create({ type: 'customrecord_unique_number_counter' });
                rec.setValue({ fieldId: 'custrecord_unique_last_number', value: 1 });
                recId = rec.save();
                lastNum = 1;
            }

            var nextNum = lastNum + 1;
            //var nextVSId = preFix + nextNum.toString().padStart(7, '0');
            var paddedNum = padStartES5(nextNum, 7, '0'); // Equivalent of .padStart(7, '0')
            var nextVSId = preFix + paddedNum;

            // Save new number
            var counterRecord = record.load({ type: 'customrecord_unique_number_counter', id: recId });
            counterRecord.setValue({ fieldId: 'custrecord_unique_last_number', value: nextNum });
            counterRecord.save();

            // Now Create Segment Record
            var segmentRec = record.create({
                type: 'customrecord_cseg_advs_sto_num',
                isDynamic: true
            });
            segmentRec.setValue({
                fieldId: 'name', // system field required for custom segments
                value: nextVSId
            });
            var segmentId = segmentRec.save();

            return segmentId;
        }

        function padStartES5(str, targetLength, padChar) {
            str = String(str);
            while (str.length < targetLength) {
                str = padChar + str;
            }
            return str;
        }
    }

    return { execute };
});
