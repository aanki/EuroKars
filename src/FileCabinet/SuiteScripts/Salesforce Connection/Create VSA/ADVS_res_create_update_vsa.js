/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    // Some Hardoced ids
    var SalesOrder_CustomFrom = 356; //ADVS Vechile SO

    var FinanceRebateItemID = 14801; // Finance Rebate Item ID
    var InsuranceRebateItemID = 14800; // Insurance Rebate Item ID
    var OpcDiscountItemID = 14812; // OPC Discount Item ID
    var SCWDItemID = 14813; // SCWD Item ID
    var addtionalItemID = 14818; // Additional Item ID
    var TradeINItemID = 14774;
    var AdopterDisItemID = 14910;
    var specialDiscountItemID = 14869;
    var DiffColourItemID = 14902;
    var MVCDiscountItemID = 14913;
    var OptOutItemID = 14914;
    var COEDiscountItemID = 14915;
    var DiscountRebateItemID = 14916;

    var VSASuccesmsg = '';
    var selected_pckgID = '';
    var TradeIn_record_ID = null;
    var VSA_update_Msg = 'VSA has been updated sucessfully';


    function post(request) {

        var items = Array.isArray(request) ? request : [request];
        var response = [];
        var child_table = 'recmachcustrecord_parent';
        var author = 141;
        var recipients = ['ankit.t@advectus.net', 'faraz.a@advectus.net'];
        var recParentBuffer = null;

        items.forEach(function (entry) {

            if (entry.action == 'CREATE_VSA') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        customerDmsId: null,
                        purchaserDmdId: null,
                        tradeInVehicleDmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request CREATE_VSA', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.customerSfId || !entry.customerEntityName || !entry.modelDmsId || !entry.variantDmsId || !entry.listPrice) {

                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId,customerSfId, customerEntityName, modelDmsId,variantDmsId,listPrice';
                        response.push(res);
                        return;
                    }
                    if (entry.fleetVSA) {
                        if (!entry.purchaserSfId || !entry.purchaserFirstName) {
                            res.statusCode = 500;
                            res.statusMessage = 'Required:  purchaserSfId,purchaserFirstName ';
                            response.push(res);
                            return;
                        }
                    } if (entry.tradeInVehicleSfId) {
                        if (!entry.tradeInVehicleModel || !entry.tradeInVehicleRegistrationYear || !entry.tradeInVehicleTradeInValue) {
                            res.statusCode = 500;
                            res.statusMessage = 'Required:  tradeInVehicleModel , tradeInVehicleRegistrationYear , tradeInVehicleTradeInValue';
                            response.push(res);
                            return;
                        }
                    }

                    // 1. Find or Create Customer
                    var customerId = getOrCreateCustomer(entry);

                    //2. Find or Create Contact
                    if (entry.fleetVSA) {
                        var contactId = getOrCreateContact(entry, customerId);
                    }
                    // 3. Create Sales Order
                    if (customerId)
                        var salesOrderId = createSalesOrder(entry, customerId);

                    if (salesOrderId) {
                        res.statusCode = 200;
                        res.statusMessage = VSASuccesmsg;
                        res.customerDmsId = customerId;
                        res.purchaserDmdId = contactId;
                        res.dmsId = salesOrderId;
                        res.tradeInVehicleDmsId = TradeIn_record_ID;
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response CREATE_VSA', res);


            } else if (entry.action == 'SPECIAL_DISCOUNT') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request SPECIAL_DISCOUNT', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.specialDiscountStatus) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId , specialDiscountStatus';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.sfId);
                    if (SoId) {
                        var stausID = '';
                        if (entry.specialDiscountStatus) {
                            stausID = getIntrrnalIdByText('customlist_special_disstatus', entry.specialDiscountStatus);
                        }
                        var soRec = record.load({ type: record.Type.SALES_ORDER, id: SoId, isDynamic: true });

                        soRec.setValue({ fieldId: 'custbody_special_dis', value: entry.specialDiscount });
                        soRec.setValue({ fieldId: 'custbody_special_dis_remarks', value: entry.specialDiscountRemark });
                        soRec.setValue({ fieldId: 'custbody_special_dis_status', value: stausID });

                        // Add update Remove Special Discount line
                        var specialDiscountItemID = 14869;

                        var lineCount = soRec.getLineCount({ sublistId: 'item' });
                        var foundLine = -1;

                        for (var i = 0; i < lineCount; i++) {
                            var itemId = soRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                            if (parseInt(itemId) === specialDiscountItemID) {
                                foundLine = i;
                                break;
                            }
                        }

                        if (stausID == 3) {         // Rejected
                            if (foundLine !== -1) {
                                soRec.removeLine({ sublistId: 'item', line: foundLine });
                                res.statusMessage = "Special Discount line has been removed Sucessfully";
                            }
                        } else {
                            if (foundLine !== -1) {
                                // Update the amount
                                soRec.selectLine({ sublistId: 'item', line: foundLine });
                                soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_advs_selected_inventory_type', value: 8 }); // Discount
                                soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: entry.specialDiscount });
                                soRec.commitLine({ sublistId: 'item' });
                                res.statusMessage = "Special Discount line has been updated Sucessfully";

                            } else {
                                // Add the line
                                soRec.selectNewLine({ sublistId: 'item' });
                                soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_advs_selected_inventory_type', value: 8 }); // Discount
                                soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: specialDiscountItemID });
                                soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: entry.specialDiscount });
                                soRec.commitLine({ sublistId: 'item' });
                                res.statusMessage = "Special Discount line has been added Sucessfully";

                            }
                        }
                        soRec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        // End ----- 
                        res.dmsId = SoId;
                        res.statusCode = 200;


                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                    log.debug('POST response SPECIAL_DISCOUNT', res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
            }
            else if (entry.action == 'STOCK_ALLOCATION') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        vehicleStockDmsId: null,
                        vehicleStockReserved: false,
                        omvReserved: 0,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request STOCK_ALLOCATION', entry);

                    // Mandatory key
                    if (!entry.sfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId';
                        response.push(res);
                        return;
                    }
                    var salesOrderId = findSalesOrder(entry.sfId);
                    if (salesOrderId) {

                        // Add VIN(Vehicle Master) on Model line
                        var soRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId, isDynamic: true });

                        var subsidiary = soRec.getValue({ fieldId: 'subsidiary' });
                        var lineCount = soRec.getLineCount({ sublistId: 'item' });

                        for (var i = 0; i < lineCount; i++) {
                            soRec.selectLine({ sublistId: 'item', line: i });

                            var inventoryType = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_advs_selected_inventory_type'
                            });
                            var itemID = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item'
                            });
                            var vin = soRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_advs_st_equip_sales'
                            });
                            log.debug('vin ', vin);

                            if (inventoryType == 1 && !vin) {
                                var CusutomerID = soRec.getValue({ fieldId: 'entity' });
                                var sodate = soRec.getValue({ fieldId: 'trandate' });
                                // Set the VIN to default value
                                var VIN_ID_detail = find_VehicleMaster_toadd_online(subsidiary, itemID) || '';
                                var vinParts = VIN_ID_detail.split('$');

                                var VIN_ID = vinParts.length > 0 ? vinParts[0] : '';
                                var VIN_Name = vinParts.length > 1 ? vinParts[1] : '';
                                log.debug('VIN_ID STOCK_ALLOCATION 1', VIN_ID);

                                if (VIN_ID) {

                                    var stausID = '';
                                    if (entry.vsaStatus) {
                                        stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                                    }

                                    soRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_advs_st_equip_sales',
                                        value: VIN_ID
                                    });

                                    // // Inventory Detail
                                    try {
                                        var inventoryDetailSubrecord = soRec.getCurrentSublistSubrecord({
                                            sublistId: 'item',
                                            fieldId: 'inventorydetail'
                                        });
                                        inventoryDetailSubrecord.selectNewLine({
                                            sublistId: 'inventoryassignment'
                                        });
                                        inventoryDetailSubrecord.setCurrentSublistText({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'issueinventorynumber',
                                            text: VIN_Name
                                        });
                                        inventoryDetailSubrecord.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'quantity',
                                            value: 1
                                        });
                                        inventoryDetailSubrecord.commitLine({ sublistId: 'inventoryassignment' });
                                    } catch (e) {
                                        log.error('Error in assignInventoryDetail: ' + e.message);
                                    }

                                    soRec.commitLine({ sublistId: 'item' });

                                    soRec.setValue({ fieldId: 'custbody_advs_vehicle_stock_reserved', value: true }); // Stock Assigned
                                    soRec.setValue({ fieldId: 'custbody_advs_pdi_process_status', value: stausID });
                                    soRec.setValue({ fieldId: 'custbody_advs_customer_signed', value: entry.customerSigned });
                                    soRec.setValue({ fieldId: 'custbody_advs_sales_cons_signed', value: entry.scSigned });

                                    record.submitFields({
                                        type: 'customrecord_advs_vm',
                                        id: VIN_ID,
                                        values: {
                                            custrecord_advs_vm_reservation_status: '4', // Assigned
                                            custrecord_advs_st_sales_ord_date: sodate,
                                            custrecord_advs_st_sales_ord_link: salesOrderId,
                                            custrecord_advs_vm_customer_number: CusutomerID
                                        }
                                    });
                                    log.error('Updated Vehicle Master ', 'Yes');

                                } else {
                                    res.statusCode = 500;
                                    res.statusMessage = 'Stock is not available for this model';
                                    response.push(res);
                                    return;
                                }
                            }

                            // else {
                            //     res.statusCode = 500;
                            //     res.statusMessage = 'Stock is already assigned for this model';
                            //     response.push(res);
                            //     return;
                            // }
                        }

                        var soId = soRec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        res.dmsId = soId;
                        res.statusCode = 200;
                        res.vehicleStockDmsId = VIN_ID;
                        res.statusMessage = 'Stock has been allocated on VSA Sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                    log.debug('POST response STOCK_ALLOCATION', res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
            } else if (entry.action == 'SM_APPROVED_VSA') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request SM_APPROVED_VSA', entry);

                    // Mandatory key
                    if (!entry.sfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.sfId);
                    if (SoId) {
                        var stausID = '';
                        if (entry.vsaStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                        }
                        record.submitFields({
                            type: 'salesorder',
                            id: SoId,
                            values: {
                                custbody_advs_pdi_process_status: stausID,
                                custbody_advs_sales_manager_signed: entry.smSigned

                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });
                        res.dmsId = SoId;
                        res.statusCode = 200;
                        res.statusMessage = VSA_update_Msg;

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                    log.debug('POST response SM_APPROVED_VSA', res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
            } else if (entry.action == 'INCREASE_COE_BID_COUNT') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request INCREASE_COE_BID_COUNT', entry);

                    // Mandatory key
                    if (!entry.sfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.sfId);
                    if (SoId) {
                        var stausID = '';
                        if (entry.vsaStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                        }
                        record.submitFields({
                            type: 'salesorder',
                            id: SoId,
                            values: {
                                custbody_advs_pdi_process_status: stausID,
                                custbody_number_of_coebids: entry.numberOfCOEBids

                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });
                        // updated COE bid on Save Package Record
                        var childSearch = search.create({
                            type: 'customrecord_save_vsa_package',
                            filters: [['custrecord_vsa_package', 'anyof', SoId]],
                            columns: ['internalid']
                        });
                        childSearch.run().each(function (result) {
                            var childId = result.getValue('internalid');
                            if (childId) {
                                record.submitFields({
                                    type: 'customrecord_save_vsa_package',
                                    id: childId,
                                    values: {
                                        custrecord_selecyed_bid_count_coe: entry.numberOfCOEBids

                                    },
                                    options: {
                                        enableSourcing: false, // not needed since you're directly setting
                                        ignoreMandatoryFields: true
                                    }
                                });
                            }
                            return true;
                        });
                        res.dmsId = SoId;
                        res.statusCode = 200;
                        res.statusMessage = 'COE bid has been updated sucessfully on VSA';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                    log.debug('POST response INCREASE_COE_BID_COUNT', res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
            } else if (entry.action == 'KICKSTART_PDI') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        vehicleStockAssigned: false,
                        omvAssigned: 0,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request KICKSTART_PDI', entry);

                    // Mandatory key
                    if (!entry.sfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.sfId);
                    if (SoId) {
                        var stausID = '';
                        var child_PDI_table = 'recmachcustrecord_advs_transaction';
                        if (entry.vsaStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                        }
                        var soRec = record.load({ type: record.Type.SALES_ORDER, id: SoId, isDynamic: true });
                        var veh_assigned = soRec.getValue({ fieldId: 'custbody_advs_vehicle_stock_assigned' });
                        soRec.setValue({ fieldId: 'custbody_advs_pdi_process_status', value: stausID });
                        //PDI line
                        soRec.selectNewLine({ sublistId: child_PDI_table });
                        if (entry.registrationDate instanceof Date) {
                            soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: 'custrecord_registration_date', value: entry.registrationDate });
                        }

                        if (entry.estimatedDeliveryDatePDI instanceof Date) {
                            soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: 'custrecord_estmt_delivery_date_pdi', value: entry.estimatedDeliveryDatePDI });
                        }
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_pdi_ref_no", value: entry.pdiReferenceNo });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_pdi_remarks", value: entry.pdiRemarks });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_sm_pdi_notification", value: entry.pdiNotificationSent });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_sm_allows_pdi_notification", value: entry.allowsPDINotification });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_pdi_sold_chit_sent", value: entry.pdiSoldChitSent });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_start_pdi_approval_process", value: entry.startPDIApprovalProcess });
                        soRec.setCurrentSublistValue({ sublistId: child_PDI_table, fieldId: "custrecord_advs_pdi_status", value: stausID });
                        soRec.commitLine({ sublistId: child_PDI_table });
                        soRec.save();

                        res.dmsId = SoId;
                        res.vehicleStockAssigned = veh_assigned;
                        res.statusCode = 200;
                        res.statusMessage = 'PDI has been triggred sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response KICKSTART_PDI', res);
            }
            else if (entry.action == 'VSA_ITEM') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        vsaSfId: entry.vsaSfId,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request VSA_ITEM', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.vsaSfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId,vsaSfId';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.vsaSfId);
                    if (SoId) {
                        var selected_PckgID = findSelected_PackageRecord(SoId);
                        if (selected_PckgID) {
                            var pckg_item_record = findSelected_Package_Item_Record(entry.sfId);
                            var rec;
                            if (pckg_item_record) {
                                rec = record.load({ type: 'customrecord_save_vsa_package_item', id: pckg_item_record, isDynamic: true });
                            } else {
                                rec = record.create({ type: 'customrecord_save_vsa_package_item', isDynamic: true });
                                rec.setValue({ fieldId: 'custrecord_selected_pckgitem_sfid', value: entry.sfId });
                                rec.setValue({ fieldId: 'custrecord_parent_package_head', value: selected_PckgID });
                            }
                            rec.setValue({ fieldId: 'name', value: entry.vsaItemName });
                            rec.setValue({ fieldId: 'custrecord_save_item_cost', value: entry.costPrice });
                            if (entry.costGroup) {
                                var costgroupID = getIntrrnalIdByText('customlist_pckg_iem_cost_group', entry.costGroup);
                                rec.setValue({ fieldId: 'custrecord_save_item_cost_group', value: costgroupID });
                            }
                            if (entry.lineItemAppearance) {
                                var ID = getIntrrnalIdByText('customlist_pckg_line_appearance', entry.lineItemAppearance);
                                rec.setValue({ fieldId: 'custrecord_selected_pkgitem_lineitemapp', value: ID });
                            }
                            if (entry.vsaItemType) {
                                var IDD = getIntrrnalIdByText('customlist_pckg_item_type', entry.vsaItemType);
                                rec.setValue({ fieldId: 'custrecord_selected_pkgitem_pkgtype', value: IDD });
                            }

                            rec.setValue({ fieldId: 'custrecord_selected_pkgitem_optin', value: entry.optInValue });
                            rec.setValue({ fieldId: 'custrecord_selected_pkgitem_optout', value: entry.optOutValue });
                            rec.setValue({ fieldId: 'custrecord_selected_pckgitem_includepric', value: entry.includedInPrice });
                            rec.setValue({ fieldId: 'custrecord_selected_pckgitem_appinvsa', value: entry.appearInVSA });
                            rec.setValue({ fieldId: 'custrecord_package_item_isselected', value: true });
                            rec.setValue({ fieldId: 'custrecord_selected_pkgitem_savestate', value: entry.lineItemSavedState });
                            var selcted_pckgItemID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                            res.dmsId = selcted_pckgItemID;
                            res.statusCode = 200;
                            res.statusMessage = 'VSA Item has been updated sucessfully';
                        } else {
                            res.statusCode = 500;
                            res.statusMessage = 'Parent Selected Package does not exit under this VSA';
                        }
                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response VSA_ITEM', res);
            }
            else if (entry.action == 'VSA_DEPOSIT') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        vsaSfId: entry.vsaSfId,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request VSA_DEPOSIT', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.vsaSfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId,vsaSfId';
                        response.push(res);
                        return;
                    }

                    var So_search = search.create({
                        type: record.Type.SALES_ORDER,
                        filters: [["custbody_advs_salesforceid", "is", entry.vsaSfId]],
                        columns: ['internalid', 'entity']
                    }).run().getRange({ start: 0, end: 1 });

                    if (So_search.length > 0) {
                        var SoId = So_search[0].getValue('internalid');
                        var So_customer = So_search[0].getValue('entity');

                        var rec;
                        var depositSearch = search.create({
                            type: "customerdeposit",
                            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                            filters:
                                [
                                    ["type", "anyof", "CustDep"],
                                    "AND",
                                    ["custbody_advs_salesforceid", "is", entry.sfId]
                                ],
                            columns: ['internalid']
                        }).run().getRange({ start: 0, end: 1 });

                        if (depositSearch.length > 0) {
                            var depostID = depositSearch[0].getValue('internalid');
                            rec = record.load({ type: 'customerdeposit', id: depostID, isDynamic: true });
                            res.statusMessage = 'VSA Deposit has been updated sucessfully';
                        } else {
                            rec = record.create({ type: 'customerdeposit', isDynamic: true });
                            rec.setValue({ fieldId: 'customer', value: So_customer });
                            rec.setValue({ fieldId: 'salesorder', value: SoId });
                            rec.setValue({ fieldId: 'custbody_advs_salesforceid', value: entry.sfId });
                            res.statusMessage = 'VSA Deposit has been created sucessfully';
                        }

                        if (entry.paymentDate) {
                            var paydate = parseDateFromDDMMYYYY(entry.paymentDate);
                            rec.setValue({ fieldId: 'trandate', value: paydate });
                        }
                        rec.setValue({ fieldId: 'payment', value: entry.amount });
                        rec.setValue({ fieldId: 'memo', value: entry.paymentReference });
                        var DepositID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        res.dmsId = DepositID;
                        res.statusCode = 200;


                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response VSA_DEPOSIT', res);
            }
            else if (entry.action == 'VSA_CANCEL') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request VSA_CANCEL', entry);

                    // Mandatory key
                    if (!entry.sfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId ';
                        response.push(res);
                        return;
                    }

                    var salesOrderId = findSalesOrder(entry.sfId);
                    if (salesOrderId) {
                        var updated = false;
                        var Assign_VIN_ID = entry.vehicleStockDmsId;
                        var stausID = '';
                        if (entry.vsaStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                        }
                        log.debug('Assign_VIN_ID', Assign_VIN_ID + ' stausID ' + stausID);

                        var soRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId, isDynamic: true });
                        soRec.setValue({ fieldId: 'custbody_advs_pdi_process_status', value: stausID });
                        //soRec.setValue({ fieldId: 'status', value: 'SalesOrd:C' });

                        if (Assign_VIN_ID) {
                            var lineCount = soRec.getLineCount({ sublistId: 'item' });

                            for (var i = 0; i < lineCount; i++) {
                                soRec.selectLine({ sublistId: 'item', line: i });

                                var inventoryType = soRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_advs_selected_inventory_type'
                                });

                                var lineVINId = soRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_advs_st_equip_sales'
                                });
                                var VIN_Name = soRec.getCurrentSublistText({
                                    sublistId: 'item',
                                    fieldId: 'custcol_advs_st_equip_sales'
                                });
                                log.debug('lineVINId', lineVINId + ' Assign_VIN_ID ' + Assign_VIN_ID + ' VIN_Name ' + VIN_Name);

                                if (inventoryType == '1' && lineVINId == Assign_VIN_ID) {

                                    soRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_advs_st_equip_sales',
                                        value: ''
                                    });
                                    // remove Inventoiry Detail
                                    try {
                                        soRec.removeCurrentSublistSubrecord({
                                            sublistId: 'item',
                                            fieldId: 'inventorydetail'
                                        });
                                    } catch (e) {
                                        log.error('No inventory detail for line ' + i, e.message);
                                    }
                                    //---
                                    soRec.commitLine({ sublistId: 'item' });
                                    updated = true;
                                    break;
                                }
                            } if (updated) {
                                record.submitFields({
                                    type: 'customrecord_advs_vm',
                                    id: Assign_VIN_ID,
                                    values: {
                                        custrecord_advs_vm_reservation_status: '3', // Stock
                                        custrecord_advs_st_sales_ord_date: '',
                                        custrecord_advs_st_sales_ord_link: '',
                                        custrecord_advs_vm_customer_number: 37 // Internal Customer
                                    }
                                });
                            }
                        }

                        var soId = soRec.save();

                        res.dmsId = salesOrderId;
                        res.statusCode = 200;
                        res.statusMessage = 'VSA has been canceled sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);
                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response VSA_CANCEL', res);
            }
            else if (entry.action == 'CREATE_ROC_AMENDMENT' || entry.action == 'CREATE_ROC_CANCELLATION') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        vsaSfId: entry.vsaSfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request CREATE_ROC_AMENDMENT', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.vsaSfId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId, vsaSfId';
                        response.push(res);
                        return;
                    }
                    var SoId = findSalesOrder(entry.vsaSfId);
                    if (SoId) {
                        var stausID = '';
                        if (entry.rocStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.rocStatus);
                        }

                        var rec = record.create({ type: 'customrecord_roc', isDynamic: true });
                        rec.setValue({ fieldId: 'custrecord_vsa_roc', value: SoId });
                        rec.setValue({ fieldId: 'custrecord_roc_status', value: stausID });
                        if (entry.dateRequested) {
                            var Reqdate = parseDateFromDDMMYYYY(entry.dateRequested);
                            rec.setValue({ fieldId: 'custrecord_date_requested', value: Reqdate });
                        }
                        rec.setValue({ fieldId: 'custrecord_salesforce_id_roc', value: entry.sfId });
                        rec.setValue({ fieldId: 'custrecord_record_type', value: entry.sfRecordType });
                        if (entry.action == 'CREATE_ROC_CANCELLATION') {
                            rec.setValue({ fieldId: 'custrecord_roc_current_model', value: entry.modelDmsId });
                            rec.setValue({ fieldId: 'custrecord_roc_current_vriant', value: entry.variantDmsId });
                            rec.setValue({ fieldId: 'custrecord_remarks_roc', value: entry.cancellationReason });
                        } else {
                            rec.setValue({ fieldId: 'custrecord_orignal_net_selling_price', value: entry.originalNettSellingPrice });
                            rec.setValue({ fieldId: 'custrecord_revised_net_price', value: entry.newNettSellingPrice });
                            rec.setValue({ fieldId: 'custrecord_remarks_roc', value: entry.remarks });
                        }

                        if (entry.recordOwnerEmail) {
                            var dmsid = getEmployeeIdByEmail(entry.recordOwnerEmail);
                            if (dmsid)
                                rec.setValue({ fieldId: 'owner', value: dmsid });
                        }
                        var ROCID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        res.dmsId = ROCID;
                        res.statusCode = 200;
                        res.statusMessage = 'ROC ' + entry.sfRecordType + ' has been created sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VSA does not exist with given sfid';
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response CREATE_ROC_AMENDMENT', res);
            }
            else if (entry.action == 'SC_CANCELLED_ROC') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request SC_CANCELLED_ROC', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.rocStatus) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId, rocStatus';
                        response.push(res);
                        return;
                    }
                    var ROC_Id = find_Record_Common('customrecord_roc', entry.sfId, 'custrecord_salesforce_id_roc');
                    if (ROC_Id) {
                        var stausID = '';
                        if (entry.rocStatus) {
                            stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.rocStatus);
                        }

                        record.submitFields({
                            type: 'customrecord_roc',
                            id: ROC_Id,
                            values: {
                                custrecord_roc_status: stausID
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });

                        res.dmsId = ROC_Id;
                        res.statusCode = 200;
                        res.statusMessage = 'ROC Status has been updated sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'ROC does not exist with given sfid';
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response SC_CANCELLED_ROC', res);
            }
            else if (entry.action == 'SM_APPROVED_ROC_AMENDMENT') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        vsaSfId: entry.vsaSfId || null,
                        vehicleStockDmsId: entry.vehicleStockDmsId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request SM_APPROVED_ROC_AMENDMENT', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.vsaSfId || !entry.vehicleStockDmsId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId, vsaSfId , vehicleStockDmsId';
                        response.push(res);
                        return;
                    }
                    var ROC_Id = find_Record_Common('customrecord_roc', entry.sfId, 'custrecord_salesforce_id_roc');
                    var Req_VIN_ID = entry.vehicleStockDmsId;
                    var Assign_VIN_ID = find_Free_VehicleMaster_fromSalesforce(Req_VIN_ID);
                    if (Assign_VIN_ID) {
                        if (ROC_Id) {
                            var salesOrderId = findSalesOrder(entry.vsaSfId);
                            if (salesOrderId) {
                                var stausID = '';
                                if (entry.rocStatus) {
                                    stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.rocStatus);
                                }
                                record.submitFields({
                                    type: 'customrecord_roc',
                                    id: ROC_Id,
                                    values: {
                                        custrecord_roc_status: stausID,
                                        custrecord_cust_sign: entry.customerSigned,
                                        custrecord_sm_sign: entry.salesManagerSigned,
                                        custrecord_revised_net_price: entry.vsaNewNettSellingPrice
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    }
                                });

                                var soRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId, isDynamic: true });
                                var CusutomerID = soRec.getValue({ fieldId: 'entity' });
                                var sodate = soRec.getValue({ fieldId: 'trandate' });
                                var lineCount = soRec.getLineCount({ sublistId: 'item' });

                                for (var i = 0; i < lineCount; i++) {
                                    soRec.selectLine({ sublistId: 'item', line: i });

                                    var inventoryType = soRec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_advs_selected_inventory_type'
                                    });

                                    var lineVINId = soRec.getCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_advs_st_equip_sales'
                                    });
                                    // Free to already Allocate VIN on line 
                                    if (inventoryType == '1') {
                                        if (lineVINId) {
                                            record.submitFields({
                                                type: 'customrecord_advs_vm',
                                                id: lineVINId,
                                                values: {
                                                    custrecord_advs_vm_reservation_status: '3', // Stock
                                                    custrecord_advs_st_sales_ord_date: '',
                                                    custrecord_advs_st_sales_ord_link: '',
                                                    custrecord_advs_vm_customer_number: 37 // Internal Customer
                                                }
                                            });
                                        }


                                        soRec.setCurrentSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_advs_st_equip_sales',
                                            value: Assign_VIN_ID
                                        });
                                        soRec.setValue({ fieldId: 'custbody_advs_vehicle_stock_assigned', value: true }); // Stock Assigned
                                        // soRec.setValue({ fieldId: 'custbody_advs_customer_signed', value: entry.customerSigned });
                                        // soRec.setValue({ fieldId: 'custbody_advs_sales_cons_signed', value: entry.scSigned });
                                        soRec.commitLine({ sublistId: 'item' });
                                        updated = true;
                                        break;
                                    }
                                }

                                var soId = soRec.save();

                                record.submitFields({
                                    type: 'customrecord_advs_vm',
                                    id: Assign_VIN_ID,
                                    values: {
                                        custrecord_advs_vm_reservation_status: '5', // Assigned
                                        custrecord_advs_st_sales_ord_date: sodate,
                                        custrecord_advs_st_sales_ord_link: salesOrderId,
                                        custrecord_advs_vm_customer_number: CusutomerID
                                    }
                                });
                                log.error('Updated Vehicle Master ', 'Yes');



                                res.dmsId = ROC_Id;
                                res.statusCode = 200;
                                res.statusMessage = 'ROC and Vechile Stock has been updated sucessfully';

                            } else {
                                res.statusCode = 500;
                                res.statusMessage = 'VSA does not exist with given vsaSfId';
                            }

                        } else {
                            res.statusCode = 500;
                            res.statusMessage = 'ROC does not exist with given sfid';
                        }
                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'VIN stock is not available for allocation with given vehicleStockDmsId';
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response SM_APPROVED_ROC_AMENDMENT', res);
            }
            else if (entry.action == 'SM_APPROVED_ROC_CANCELLATION') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        vsaSfId: entry.vsaSfId || null,
                        vehicleStockDmsId: entry.vehicleStockDmsId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request SM_APPROVED_ROC_CANCELLATION', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.vsaSfId || !entry.vehicleStockDmsId) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId, vsaSfId , vehicleStockDmsId';
                        response.push(res);
                        return;
                    }
                    var ROC_Id = find_Record_Common('customrecord_roc', entry.sfId, 'custrecord_salesforce_id_roc');
                    var Assign_VIN_ID = entry.vehicleStockDmsId;

                    if (ROC_Id) {
                        var salesOrderId = findSalesOrder(entry.vsaSfId);
                        if (salesOrderId) {
                            var stausID = '';
                            var VSAstausID = '';
                            if (entry.rocStatus) {
                                stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.rocStatus);
                            } if (entry.vsaStatus) {
                                VSAstausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
                            }
                            record.submitFields({
                                type: 'customrecord_roc',
                                id: ROC_Id,
                                values: {
                                    custrecord_roc_status: stausID,
                                    custrecord_cust_sign: entry.customerSigned,
                                    custrecord_sm_sign: entry.salesManagerSigned

                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                }
                            });


                            var soRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId, isDynamic: true });

                            var lineCount = soRec.getLineCount({ sublistId: 'item' });

                            for (var i = 0; i < lineCount; i++) {
                                soRec.selectLine({ sublistId: 'item', line: i });

                                var inventoryType = soRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_advs_selected_inventory_type'
                                });

                                var lineVINId = soRec.getCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_advs_st_equip_sales'
                                });
                                log.debug('lineVINId', lineVINId + ' Assign_VIN_ID ' + Assign_VIN_ID);

                                if (inventoryType == '1' && lineVINId == Assign_VIN_ID) {
                                    soRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'custcol_advs_st_equip_sales',
                                        value: ''
                                    });
                                    soRec.commitLine({ sublistId: 'item' });
                                    soRec.setValue({ fieldId: 'custbody_advs_vehicle_stock_assigned', value: false }); // Stock unAssigned
                                    soRec.setValue({ fieldId: 'custbody_advs_pdi_process_status', value: VSAstausID });
                                    updated = true;
                                    break;
                                }
                            }
                            if (updated) {
                                var soId = soRec.save();
                                record.submitFields({
                                    type: 'customrecord_advs_vm',
                                    id: Assign_VIN_ID,
                                    values: {
                                        custrecord_advs_vm_reservation_status: '3', // Stock
                                        custrecord_advs_st_sales_ord_date: '',
                                        custrecord_advs_st_sales_ord_link: '',
                                        custrecord_advs_vm_customer_number: 37 // Internal Customer
                                    }
                                });
                                res.dmsId = salesOrderId;
                                res.statusCode = 200;
                                res.statusMessage = 'ROC and VSA has been canceled sucessfully';

                            } else {
                                res.dmsId = salesOrderId;
                                res.statusCode = 500;
                                res.statusMessage = 'vehicleStockDmsId not found on VSA';
                            }

                        } else {
                            res.statusCode = 500;
                            res.statusMessage = 'VSA does not exist with given vsaSfId';
                        }

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'ROC does not exist with given sfid';
                    }

                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response SM_APPROVED_ROC_CANCELLATION', res);
            }
            else if (entry.action == 'ROC_ITEM') {
                try {
                    var res = {
                        sfId: entry.sfId || null,
                        rocSfId: entry.rocSfId || null,
                        dmsId: null,
                        statusCode: '',
                        statusMessage: ''
                    };
                    log.debug('POST request ROC_ITEM', entry);

                    // Mandatory key
                    if (!entry.sfId || !entry.rocSfId || !entry.rocItemName) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required: sfId, rocSfId, rocItemName';
                        response.push(res);
                        return;
                    }
                    var ROC_Id = find_Record_Common('customrecord_roc', entry.rocSfId, 'custrecord_salesforce_id_roc');
                    if (ROC_Id) {

                        var ROC_item_Id = find_Record_Common('customrecord_roc_line_item', entry.sfId, 'custrecord_salesforce_id_roc_line');

                        var rec = ROC_item_Id
                            ? record.load({ type: 'customrecord_roc_line_item', id: ROC_item_Id, isDynamic: true })
                            : record.create({ type: 'customrecord_roc_line_item', isDynamic: true });

                        rec.setValue({ fieldId: 'name', value: entry.rocItemName });
                        rec.setValue({ fieldId: 'custrecord_roc_header', value: ROC_Id });
                        if (entry.rocAmendmentType) {
                            var ROC_ype = getIntrrnalIdByText('customlist_roc_item_type', entry.rocAmendmentType);
                            rec.setValue({ fieldId: 'custrecord_roc_item_type', value: ROC_ype });
                        }
                        rec.setValue({ fieldId: 'custrecord_roc_item_amount', value: entry.amountChange });
                        rec.setValue({ fieldId: 'custrecord_salesforce_id_roc_line', value: entry.sfId });
                        var ROCID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });

                        res.dmsId = ROCID;
                        res.statusCode = 200;
                        res.statusMessage = 'ROC item has been created sucessfully';

                    } else {
                        res.statusCode = 500;
                        res.statusMessage = 'ROC does not exist with given rocSfId';
                    }
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
                log.debug('POST response ROC_ITEM', res);
            }

            // to store Req in Buffer Table
            recParentBuffer = record.create({ type: 'customrecord_buffer_table', isDynamic: true });
            recParentBuffer.setValue({ fieldId: 'custrecord_buffer_record_type', value: 3 }); // craete VSa

            recParentBuffer.selectNewLine({ sublistId: child_table });
            recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_request", value: JSON.stringify(entry) });
            recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_record_type_", value: 3 });
            recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_error", value: res.statusMessage });
            if (res.statusCode == 500) {
                recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_status_cust_buffer", value: 4 }); // Error
            } else {
                recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_status_cust_buffer", value: 2 }); // Success
            }
            recParentBuffer.commitLine({ sublistId: child_table });

        });
        if (recParentBuffer)
            recParentBuffer.save();

        return response;
    }

    // Function to find or create a customer
    function getOrCreateCustomer(entry) {
        var customerId;
        var customerRec;

        var customerSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [['isinactive', 'is', 'F'], 'AND', ['custentity_salesforce_id', 'is', entry.customerSfId]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        log.debug('customerSearch.length', customerSearch.length);
        if (customerSearch.length > 0) {
            customerId = customerSearch[0].getValue('internalid');
            customerRec = record.load({ type: record.Type.CUSTOMER, id: customerId });
        } else {
            customerRec = record.create({ type: record.Type.CUSTOMER, isDynamic: true });
            customerRec.setValue({ fieldId: 'customform', value: 550 }); // Custom form Mazda
            customerRec.setValue({ fieldId: 'custentity_salesforce_id', value: entry.customerSfId });
            customerRec.setValue({ fieldId: 'externalid', value: entry.customerSfId });
            customerRec.setValue({ fieldId: 'subsidiary', value: 9 }); //  Temp   Mazda
            // Address Book Entry
            customerRec.selectNewLine({ sublistId: 'addressbook' });
            var addressSubrecord = customerRec.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            addressSubrecord.setValue({ fieldId: 'addr1', value: entry.customerMailingStreet });
            addressSubrecord.setValue({ fieldId: 'zip', value: entry.customerMailingPostcode });
            addressSubrecord.setValue({ fieldId: 'country', value: getCountryCode(entry.customerMailingCountry) });
            //addressSubrecord.setValue({ fieldId: 'addressee', value: entry.customerEntityName });
            customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
            customerRec.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
            customerRec.commitLine({ sublistId: 'addressbook' });
        }

        if (entry.fleetVSA) {
            customerRec.setValue({ fieldId: 'isperson', value: 'F' });
            customerRec.setValue({ fieldId: 'companyname', value: entry.customerNRICName });
        } else {
            customerRec.setValue({ fieldId: 'isperson', value: 'T' });
            customerRec.setValue({ fieldId: 'salutation', value: entry.customerSalutation });
            customerRec.setValue({ fieldId: 'firstname', value: entry.customerNRICName });
            customerRec.setValue({ fieldId: 'mobilephone', value: entry.customerMobilePhone });

        }

        customerRec.setValue({ fieldId: 'entityid', value: entry.customerEntityName });
        customerRec.setValue({ fieldId: 'email', value: entry.customerEmail || '' });
        customerRec.setValue({ fieldId: 'custentity_nric', value: entry.customerNRICName });
        customerRec.setValue({ fieldId: 'custentity_advs_race', value: entry.customerRace });
        customerRec.setValue({ fieldId: 'custentity_advs_documentid', value: entry.customerDocumentId });
        var parsedDOB = parseDateFromDDMMYYYY(entry.customerBirthDate);
        if (parsedDOB) {
            customerRec.setValue({ fieldId: 'custentity_dob', value: parsedDOB });
        }
        customerRec.setValue({ fieldId: 'phone', value: entry.customerPhone });

        customerId = customerRec.save({ enableSourcing: true, ignoreMandatoryFields: true });

        return customerId;
    }


    // Function to find or create a contact
    function getOrCreateContact(entry, customerId) {
        var contactId;
        var contactRec;

        var contactSearch = search.create({
            type: search.Type.CONTACT,
            filters: [['isinactive', 'is', 'F'], 'AND', ['custentity_salesforce_id', 'is', entry.purchaserSfId]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (contactSearch.length > 0) {
            contactId = contactSearch[0].getValue('internalid');
            contactRec = record.load({ type: record.Type.CONTACT, id: contactId });

        } else {
            contactRec = record.create({ type: record.Type.CONTACT });
            contactRec.setValue({ fieldId: 'custentity_salesforce_id', value: entry.purchaserSfId });

        }
        contactRec.setValue({ fieldId: 'salutation', value: entry.purchaserSalutation });
        contactRec.setValue({ fieldId: 'firstname', value: entry.purchaserFirstName });
        contactRec.setValue({ fieldId: 'lastname', value: entry.purchaserLastName });
        contactRec.setValue({ fieldId: 'mobilephone', value: entry.purchaserMobilePhone });
        contactRec.setValue({ fieldId: 'email', value: entry.purchaserEmail });
        contactRec.setValue({ fieldId: 'company', value: customerId }); // link to customer
        contactId = contactRec.save({ enableSourcing: true, ignoreMandatoryFields: true });

        return contactId;
    }

    // Function to create a sales order
    function createSalesOrder(entry, customerId) {
        var salesOrderId;
        var soRec;

        var existingSO = search.create({
            type: record.Type.SALES_ORDER,
            filters: [["custbody_advs_salesforceid", "is", entry.sfId]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (existingSO.length > 0) {
            // Update SalesOrder
            salesOrderId = existingSO[0].getValue('internalid');
            soRec = record.load({ type: record.Type.SALES_ORDER, id: salesOrderId, isDynamic: true });
            VSASuccesmsg = 'VSA has been updated sucessfully';

        } else {
            // Create SalesOrder
            soRec = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });

            soRec.setValue({ fieldId: 'customform', value: SalesOrder_CustomFrom });
            soRec.setValue({ fieldId: 'custbody_advs_module_name', value: 1 }); // Set Vehicle Module
            soRec.setValue({ fieldId: 'entity', value: customerId });
            soRec.setValue({ fieldId: 'location', value: 5 });
            soRec.setValue({ fieldId: 'custbody_advs_salesforceid', value: entry.sfId });
            soRec.setValue({ fieldId: 'custbody_special_dis', value: entry.specialDiscount });
            soRec.setValue({ fieldId: 'custbody_special_dis_remarks', value: entry.specialDiscountRemark });
            soRec.setText({ fieldId: 'custbody_special_dis_status', text: entry.specialDiscountStatus });
            soRec.setValue({ fieldId: 'custbody_number_of_coebids', value: entry.numberOfCOEBids });
            VSASuccesmsg = 'VSA has been created sucessfully'
        }//
        soRec.setValue({ fieldId: 'custbody_obu_touchscreen', value: entry.obuTouchScreen });
        soRec.setValue({ fieldId: 'custbody_obu_install_loc', value: entry.obuInstallationLocation });
        soRec.setValue({ fieldId: 'custbody_opc_checkbox', value: entry.offPeakCar });
        soRec.setValue({ fieldId: 'custbody_advs_quick_vsa', value: entry.quickVSA });
        if (entry.fleetVSA)
            soRec.setValue({ fieldId: 'custbody_advs_fleet_vsa', value: entry.fleetVSA });

        if (entry.vsaStatus) {
            var stausID = getIntrrnalIdByText('customlist_advs_pdi_process_status_lis', entry.vsaStatus);
            soRec.setValue({ fieldId: 'custbody_advs_pdi_process_status', value: stausID });
        }

        if (entry.salesManager) {
            var sm_id = getEmployeeIdByEmail(entry.salesManager);
            if (sm_id)
                soRec.setValue({ fieldId: 'custbody_advs_sales_manager', value: sm_id });
        }
        var exptedDate = parseDateFromDDMMYYYY(entry.estimatedDeliveryDate);
        if (exptedDate) {
            soRec.setValue({ fieldId: 'custbody_advs_pa_est_delivery_date', value: exptedDate });
        }

        if (entry.addFinance) {
            soRec.setValue({ fieldId: 'custbody_advs_loan_amt', value: entry.loanAmount });
            if (entry.bankPackage) {
                var bankPckgID = getIntrrnalIdByText('customrecord_bank_package', entry.bankPackage);
                soRec.setValue({ fieldId: 'custbody_advs_bank_package', value: bankPckgID });
            }
            soRec.setValue({ fieldId: 'custbody_advs_loan_terms', value: entry.term });
            soRec.setValue({ fieldId: 'custbody_interest_rate', value: entry.interestRate });
            soRec.setValue({ fieldId: 'custbody_monthly_installement', value: entry.monthlyInstallment });
            soRec.setValue({ fieldId: 'custbody_interest_pack_code', value: entry.interestPackageCode });

        } if (entry.addInsurance) {
            soRec.setValue({ fieldId: 'custbodyadvs_ins_per', value: entry.insurancePeriod });
            soRec.setValue({ fieldId: 'custbody_advs_ins_rebate', value: entry.insuranceRebate });
        }

        add_line_onSalesOrder(soRec, entry);
        salesOrderId = soRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
        if (salesOrderId) {
            if (selected_pckgID) {
                record.submitFields({
                    type: 'customrecord_save_vsa_package',
                    id: selected_pckgID,
                    values: {
                        custrecord_vsa_package: salesOrderId
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });
            }
            // TRadeIN record
            if (entry.tradeInVehicleSfId) {
                create_update_TradeIN_Record(soRec, entry, salesOrderId);
            }
        }

        return salesOrderId;
    }


    function add_line_onSalesOrder(soRec, entry) {
        var variantItemId = parseInt(entry.variantDmsId);
        var modelDmsId = parseInt(entry.modelDmsId);
        var listPrice = parseFloat(entry.listPrice);
        var exteriorColor = entry.variantColourDmsId;
        var itemLineCount = soRec.getLineCount({ sublistId: 'item' });
        var lineUpdatedModel = false;

        for (var i = 0; i < itemLineCount; i++) {
            var existingItemId = parseInt(soRec.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i
            }));

            if (existingItemId === variantItemId) {
                var existingI_Selected_packgID = parseInt(soRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_package_head',
                    line: i
                }));
                selected_pckgID = create_update_selectedPackageDetal(existingI_Selected_packgID, entry);
                // ✅ Update existing line
                soRec.selectLine({ sublistId: 'item', line: i });

                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_advs_selected_inventory_type',
                    value: 1 // Model
                });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: listPrice
                });
                if (exteriorColor) {
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_advs_st_exterior_color',
                        value: exteriorColor
                    });
                }
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_package_head',
                    value: selected_pckgID
                });
                soRec.commitLine({ sublistId: 'item' });
                lineUpdatedModel = true;
                break;
            }
        }

        if (!lineUpdatedModel) {
            selected_pckgID = create_update_selectedPackageDetal('', entry);
            // ➕ Add new line
            soRec.selectNewLine({ sublistId: 'item' });

            soRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_advs_selected_inventory_type',
                value: 1
            });
            soRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                value: variantItemId
            });
            soRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                value: listPrice
            });
            if (exteriorColor) {
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_advs_st_exterior_color',
                    value: exteriorColor
                });
            }
            soRec.setCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_package_head',
                value: selected_pckgID
            });

            soRec.commitLine({ sublistId: 'item' });
        }

        var insuranceRebate = entry.insuranceRebate;
        var FinanceRebate = entry.financeRebate;
        var OpcDiscount = entry.offPeakCarDiscount;
        var SCWD_rebate = entry.scwd;
        var addtionalAmount = entry.optInAdditionalOptions;
        var tradeInDiscount = entry.tradeInDiscount;
        var adopterDiscount = entry.adopterDiscount;
        var specialDiscount = entry.specialDiscount;
        var discountRebate = entry.discountRebate;
        var optOutCashInLieu = entry.optOutCashInLieu;
        var mvcDiscount = entry.mvcDiscount;
        var differentColourTopUpAmount = entry.differentColourTopUpAmount;
        var coeDiscount = entry.coeDiscount;

        var validAddition_amt = false;
        var amtNum = Number(addtionalAmount); 
        if (!isNaN(amtNum) && amtNum !== 0) {
            validAddition_amt = true;
        }
         var validOptOut_amt = false;
        var optOutCashInLieuNum = Number(optOutCashInLieu); 
        if (!isNaN(optOutCashInLieuNum) && optOutCashInLieuNum !== 0) {
            validOptOut_amt = true;
        }


        if (insuranceRebate < 0 || FinanceRebate < 0 || OpcDiscount < 0 || SCWD_rebate < 0 || tradeInDiscount < 0 ||
            adopterDiscount < 0 || specialDiscount < 0 || validAddition_amt || discountRebate > 0 || validOptOut_amt || mvcDiscount < 0 ||
            coeDiscount < 0 || differentColourTopUpAmount > 0) {

            var itemUpdateMap = [];

            if (insuranceRebate < 0) {
                itemUpdateMap.push({ id: InsuranceRebateItemID, rate: insuranceRebate });
            }
            if (FinanceRebate < 0) {
                itemUpdateMap.push({ id: FinanceRebateItemID, rate: FinanceRebate });
            }
            if (OpcDiscount < 0) {
                itemUpdateMap.push({ id: OpcDiscountItemID, rate: OpcDiscount });
            }
            if (SCWD_rebate < 0) {
                itemUpdateMap.push({ id: SCWDItemID, rate: SCWD_rebate });
            }
            if (tradeInDiscount < 0) {
                itemUpdateMap.push({ id: TradeINItemID, rate: tradeInDiscount });
            }
            if (adopterDiscount < 0) {
                itemUpdateMap.push({ id: AdopterDisItemID, rate: adopterDiscount });
            }
            if (specialDiscount < 0) {
                itemUpdateMap.push({ id: specialDiscountItemID, rate: specialDiscount });
            }
            if (validAddition_amt) {
                itemUpdateMap.push({ id: addtionalItemID, rate: addtionalAmount });
            }
            if (discountRebate > 0) {
                itemUpdateMap.push({ id: DiscountRebateItemID, rate: discountRebate });
            }
            if (differentColourTopUpAmount > 0) {
                itemUpdateMap.push({ id: DiffColourItemID, rate: differentColourTopUpAmount });
            }
            if (validOptOut_amt) {
                itemUpdateMap.push({ id: OptOutItemID, rate: optOutCashInLieu });
            }
            if (mvcDiscount < 0) {
                itemUpdateMap.push({ id: MVCDiscountItemID, rate: mvcDiscount });
            }
            if (coeDiscount < 0) {
                itemUpdateMap.push({ id: COEDiscountItemID, rate: coeDiscount });
            }

            for (var i = 0; i < itemUpdateMap.length; i++) {
                var itemId = itemUpdateMap[i].id;
                var itemRate = itemUpdateMap[i].rate;
                var InventoryType = (itemId == addtionalItemID) ? 15 : 8;
                var lineUpdated = false;

                for (var line = 0; line < itemLineCount; line++) {
                    var existingItemId = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: line
                    });
                    if (parseInt(existingItemId) === parseInt(itemId)) {
                        // Update existing line
                        soRec.selectLine({ sublistId: 'item', line: line });

                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_advs_selected_inventory_type',
                            value: InventoryType
                        });
                        soRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: itemRate
                        });
                        soRec.commitLine({ sublistId: 'item' });
                        lineUpdated = true;
                        break;
                    }
                }
                if (!lineUpdated) {
                    //  Add new line if not found
                    soRec.selectNewLine({ sublistId: 'item' });
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_advs_selected_inventory_type',
                        value: InventoryType
                    });
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: itemId
                    });
                    soRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: itemRate
                    });

                    soRec.commitLine({ sublistId: 'item' });
                }

            }
        }

    }

    function create_update_selectedPackageDetal(packgeId, entry) {
        var rec = packgeId
            ? record.load({ type: 'customrecord_save_vsa_package', id: packgeId, isDynamic: true })
            : record.create({ type: 'customrecord_save_vsa_package', isDynamic: true });
        rec.setValue({ fieldId: 'custrecord_model_vsa', value: entry.modelDmsId });
        rec.setValue({ fieldId: 'custrecord_select_package', value: entry.packageDmsId });
        rec.setValue({ fieldId: 'custrecord_list_price_vsa', value: entry.listPrice });
        rec.setValue({ fieldId: 'custrecord_selected_finance_rebate', value: entry.financeRebate });
        rec.setText({ fieldId: 'custrecord_selected_bank_packg', value: entry.bankPackage });
        rec.setValue({ fieldId: 'custrecord_selected_loan_amount', value: entry.loanAmount });
        rec.setText({ fieldId: 'custrecord_selected_loan_term', value: entry.term });
        rec.setValue({ fieldId: 'custrecord_selected_insurance_rebate', value: entry.insuranceRebate });
        rec.setText({ fieldId: 'custrecord_selected_insurance_period', value: entry.insurancePeriod });
        rec.setValue({ fieldId: 'custrecord_selected_scwd', value: entry.scwd });
        rec.setValue({ fieldId: 'custrecord_selected_opc_dis', value: entry.offPeakCarDiscount });
        rec.setValue({ fieldId: 'custrecord_save_addtional_amount', value: entry.optInAdditionalOptions });
        rec.setValue({ fieldId: 'custrecord_selected_obutouch', value: entry.obuTouchScreen });
        rec.setValue({ fieldId: 'custrecord_selected_obu_location', value: entry.obuInstallationLocation });
        var selcted_pckgID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
        return selcted_pckgID;
    }
    function create_update_TradeIN_Record(soRec, entry, SalesOrderID) {

        var TradinID = findTradinRecord_Exiting(SalesOrderID);
        log.debug('TraDein ID', TradinID);
        var rec = TradinID
            ? record.load({ type: 'customrecord_advs_tradein_info_opp', id: TradinID, isDynamic: true })
            : record.create({ type: 'customrecord_advs_tradein_info_opp', isDynamic: true });
        rec.setValue({ fieldId: 'custrecord_advs_t_i_i_model_no', value: entry.tradeInVehicleModel });
        rec.setValue({ fieldId: 'custrecord_trade_in_variant', value: entry.tradeInVehicleVariant });
        rec.setValue({ fieldId: 'custrecord_advs_t_i_o_brand', value: entry.tradeInVehicleMake });
        rec.setValue({ fieldId: 'custrecord_purchaser_name', value: entry.tradeINpurchaserdmsid });
        if (entry.tradeInVehicleRegistrationYear) {
            var yearID = getIntrrnalIdByText('customrecord_advs_model_year', entry.tradeInVehicleRegistrationYear);
            rec.setValue({ fieldId: 'custrecord_advs_t_i_o_mdl_yr', value: yearID });
        }
        if (entry.tradeInVehicleOwnership) {
            var ownershipID = getIntrrnalIdByText('customlist_advs_owner', entry.tradeInVehicleOwnership);
            rec.setValue({ fieldId: 'custrecord_advs_ownership', value: ownershipID });
        }
        if (entry.tradeInVehicleCoeCategory) {
            var coeCatID = getIntrrnalIdByText('customlist2146', entry.tradeInVehicleCoeCategory);
            rec.setValue({ fieldId: 'custrecord414', value: coeCatID });

        }
        if (entry.tradeInVehicleAgent) {
            var agenyID = getIntrrnalIdByText('customlist2161', entry.tradeInVehicleAgent);
            rec.setValue({ fieldId: 'custrecord_advs_agent', value: agenyID });
        }

        rec.setValue({ fieldId: 'custrecord_advs_mileage', value: entry.tradeInVehicleMileage });
        rec.setValue({ fieldId: 'custrecord415', value: entry.tradeInVehicleOverTrade });
        rec.setValue({ fieldId: 'custrecord413', value: entry.tradeInVehicleRegistrationNumber });
        rec.setValue({ fieldId: 'custrecord_advs_t_i_o_trade_amount', value: entry.tradeInVehicleTradeInValue });
        rec.setValue({ fieldId: 'custrecord_advs_t_i_info_so', value: SalesOrderID });
        rec.setValue({ fieldId: 'custrecord_tradein_salesforce_id', value: entry.tradeInVehicleSfId });
        var regisDate = parseDateFromDDMMYYYY(entry.tradeInVehicleRegistrationDate);
        if (regisDate) {
            rec.setValue({ fieldId: 'custrecord_advs_reg_date', value: regisDate });
        }
        TradeIn_record_ID = rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
    }

    function getCountryCode(countryName) {
        var map = {
            'United States': 'US',
            'India': 'IN',
            'Singapore': 'SG',
            'Australia': 'AU',
            'United Kingdom': 'GB'
            // Add more as needed
        };
        return map[countryName] || 'US'; // fallback default
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
    function findSalesOrder(sfid) {
        var existingSO = search.create({
            type: record.Type.SALES_ORDER,
            filters: [["custbody_advs_salesforceid", "is", sfid]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
        return existingSO.length ? existingSO[0].getValue({ name: 'internalid' }) : null;
    }
    function findSelected_PackageRecord(SalesOrderID) {
        var childSearch = search.create({
            type: 'customrecord_save_vsa_package',
            filters: [['isinactive', 'is', 'F'],
                'AND', ['custrecord_vsa_package', 'anyof', SalesOrderID]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
        return childSearch.length ? childSearch[0].getValue({ name: 'internalid' }) : null;
    }
    function findSelected_Package_Item_Record(SalesforceID) {
        var childSearch = search.create({
            type: 'customrecord_save_vsa_package_item',
            filters: [['isinactive', 'is', 'F'],
                'AND',
            ['custrecord_selected_pckgitem_sfid', 'is', SalesforceID]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
        return childSearch.length ? childSearch[0].getValue({ name: 'internalid' }) : null;
    }
    function find_Record_Common(recordType, sfid, filter_field) {
        var existingSO = search.create({
            type: recordType,
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                [filter_field, 'is', sfid]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        return existingSO.length ? existingSO[0].getValue({ name: 'internalid' }) : null;
    }

    function find_VehicleMaster_toadd_online(subsidiary, itemId) {
        var vinRecordId = '';
        var VIN_Name = '';
        var vinSearch = search.create({
            type: 'customrecord_advs_vm',
            filters: [
                ['custrecord_st_v_m_model_variant', 'anyof', itemId],
                'AND',
                ['custrecord_advs_vm_reservation_status', 'anyof', '3'], // Stock
                'AND',
                ['custrecord_advs_vm_subsidary', 'anyof', subsidiary],
                'AND',
                ["custrecord_advs_st_pur_rec_link", "noneof", "@NONE@"],
                'AND',
                ["custrecord_advs_st_sales_ord_link", "anyof", "@NONE@"],
                'AND',
                ["custrecord_advs_vm_vehicle_status", "anyof", "1"] // New Vehicle
            ],

            columns: [
                search.createColumn({ name: 'name' }),
                search.createColumn({ name: 'internalid' }),
                search.createColumn({
                    name: 'custrecord_advs_st_pur_rec_date',
                    sort: search.Sort.ASC
                })
            ]
        });
        var resultSet = vinSearch.run().getRange({ start: 0, end: 1 });
        log.error("SO Vechile Master resultSet", resultSet);
        if (resultSet && resultSet.length > 0) {
            vinRecordId = resultSet[0].getValue('internalid');
            VIN_Name = resultSet[0].getValue('name');
        }
        return vinRecordId + "$" + VIN_Name;
    }
    function find_Free_VehicleMaster_fromSalesforce(dmsID) {
        var vinRecordId = '';
        var vinSearch = search.create({
            type: 'customrecord_advs_vm',
            filters: [
                ['internalid', 'anyof', dmsID],
                'AND',
                ['custrecord_advs_vm_reservation_status', 'anyof', '3'], // Stock
                'AND',
                ["custrecord_advs_st_pur_rec_link", "noneof", "@NONE@"],
                'AND',
                ["custrecord_advs_st_sales_ord_link", "anyof", "@NONE@"],
                'AND',
                ["custrecord_advs_vm_vehicle_status", "anyof", "1"] // New Vehicle
            ],

            columns: [
                search.createColumn({ name: 'name' }),
                search.createColumn({ name: 'internalid' }),
                search.createColumn({
                    name: 'custrecord_advs_st_pur_rec_date',
                    sort: search.Sort.ASC
                })
            ]
        });
        var resultSet = vinSearch.run().getRange({ start: 0, end: 1 });
        log.error("SO Vechile Master resultSet", resultSet);
        if (resultSet && resultSet.length > 0) {
            vinRecordId = resultSet[0].getValue('internalid');
        }
        return vinRecordId;
    }
    function findTradinRecord_Exiting(value) {
        if (!value) return null;
        var s = search.create({
            type: 'customrecord_advs_tradein_info_opp',
            filters: [
                ['isinactive', 'is', 'F'], 'AND', ['custrecord_advs_t_i_info_so', 'is', value]
            ],
            columns: ['internalid']
        })
            .run()
            .getRange({ start: 0, end: 1 });
        return s.length ? s[0].getValue({ name: 'internalid' }) : null;
    }
    function getIntrrnalIdByText(listScriptId, labelText) {
        var results = search.create({
            type: listScriptId,
            filters: [['name', 'is', labelText]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        return results.length > 0 ? results[0].getValue('internalid') : null;
    }
    function getEmployeeIdByEmail(email) {
        if (!email) return null;
        var s = search.create({
            type: search.Type.EMPLOYEE,
            filters: [['email', 'is', email]],
            columns: ['internalid']
        })
            .run()
            .getRange({ start: 0, end: 1 });
        return s.length ? s[0].getValue({ name: 'internalid' }) : null;
    }
    return {
        post: post
    };
});
