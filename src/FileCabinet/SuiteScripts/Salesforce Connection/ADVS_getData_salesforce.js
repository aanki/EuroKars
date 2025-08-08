/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/error', 'N/log', 'N/task'], function (record, search, error, log, task) {

    function doPost(requestData) {

        var items = Array.isArray(requestData) ? requestData : [requestData];
        var results = [];
        var recParentBuffer = null;
        var child_table = 'recmachcustrecord_parent';

        items.forEach(function (item) {


            if (item.Flag == 'BlacklistedCustomer') {

                var res = {
                    sfId: item.sfId || null,
                    dmsId: null,
                    statusCode: '',
                    statusMessage: ''
                };

                if (!item.sfId || !item.name ) {

                    res.statusCode = 500;
                    res.statusMessage = 'Required: sfId,name';
                    results.push(res);
                    return;

                }
                //Validet required fields
                try {
                    var ownerId = getEmployeeIdByEmail(item.recordOwnerEmail);
                    if (!ownerId) {
                        res.statusCode = 500;
                        res.statusMessage = 'No Owner found in DMS with email: ' + item.recordOwnerEmail;
                        results.push(res);
                        return;

                    }

                    var customerID = findDuplicate(item.sfId);
                    if (customerID) {
                        // If customer exists, update the Customer record

                        var customerRec = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerID,
                            isDynamic: true
                        });
                        log.audit('Customer Updated', 'YES ');
                        res.statusMessage = "Record Updated successfully";

                    } else {
                        // Create new customer record
                        var customerRec = record.create({
                            type: record.Type.CUSTOMER,
                            isDynamic: true
                        });
                        customerRec.setValue({ fieldId: 'custentity_salesforce_id', value: item.sfId });
                        customerRec.setValue({ fieldId: 'externalid', value: item.sfId });
                        customerRec.setValue({ fieldId: 'subsidiary', value: 9 }); //  Temp   Mazda
                        log.audit('Customer Created', 'YES ');
                        res.statusMessage = "Record created successfully";
                    }

                    customerRec.setValue({ fieldId: 'entityid', value: item.name });
                    customerRec.setValue({ fieldId: 'companyname', value: item.name });
                    customerRec.setValue({ fieldId: 'email', value: item.email });
                    customerRec.setValue({ fieldId: 'phone', value: item.phone });
                    customerRec.setValue({ fieldId: 'custentity_created_by_cusomer', value: ownerId });
                    customerRec.setValue({ fieldId: 'custentity_reason_blacklist', value: item.reason });
                    customerRec.setValue({ fieldId: 'custentity_blacklist', value: true });
                   
                    var customerIdDone = customerRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    log.audit('Customer Created', 'ID: ' + customerIdDone);
                    if (customerIdDone) {
                        res.dmsId = customerIdDone;
                        res.statusCode = 200;
                    }
                } catch (e) {
                    res.statusCode = 500;
                    res.statusMessage = e.message || 'Unexpected error';
                }

            } else if (item.Flag == 'VehicleStock') {
                try {
                    var res = {
                        VehicleStock: [],
                        statusCode: '',
                        statusMessage: ''
                    };
                    if (!item.TestDrive) {
                        if (!item.manufacturer || !item.modelDmsId || !item.variantDmsId) {
                            res.statusCode = 500;
                            res.statusMessage = 'Required: manufacturer,modelDmsId, variantDmsId';
                            results.push(res);
                            return;
                        }

                        if (isNaN(item.modelDmsId) || isNaN(item.variantDmsId)) {

                            res.statusCode = 500;
                            res.statusMessage = 'Please enter Valid/Numeric dmsid';
                            results.push(res);
                            return;
                        }
                    } 
                    var custom_filter = '';

                    var manufactureID = getIntrrnalIdByText('customrecord_advs_brands', item.manufacturer);

                    if (item.TestDrive) {

                        custom_filter = [
                            ["custrecord_advs_vm_vehicle_brand", "anyof", manufactureID], // Mazda
                            "AND",
                            ["custrecord_advs_vm_reservation_status", "anyof", "6", "10"], // 
                            "AND",
                            ["isinactive", "is", "F"]
                        ]

                    } else {

                        custom_filter = [
                            ["custrecord_advs_vm_model", "anyof", item.modelDmsId],
                            "AND",
                            ["custrecord_st_v_m_model_variant", "anyof", item.variantDmsId],
                            "AND",
                            ["custrecord_advs_vm_vehicle_brand", "anyof", manufactureID], // Mazda
                            "AND",
                            ["custrecord_advs_vm_reservation_status", "anyof", "7", "8", "6", "3", "10", "2"], // 
                            "AND",
                            ["isinactive", "is", "F"]
                        ]
                    }

                    var searchResults = search.create({
                        type: "customrecord_advs_vm",
                        filters: custom_filter,
                        columns: [
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "name" }),
                            search.createColumn({ name: "custrecord_advs_vm_vehicle_brand" }),
                            search.createColumn({ name: "custrecord_advs_vm_model" }),
                            search.createColumn({ name: "custrecord_st_v_m_model_variant" }),
                            search.createColumn({ name: "custrecord_advs_vm_exterior_color" }),
                            search.createColumn({ name: "custrecord_advs_vm_remark" }),
                            search.createColumn({ name: "custrecord_advs_vm_customer_number" }),
                            search.createColumn({ name: "custrecord_advs_vm_reservation_status" }),
                            search.createColumn({ name: "custrecord_test_drive_vm" }),
                            search.createColumn({ name: "custrecord_showroom_car_vm" }),
                            search.createColumn({ name: "custrecord_advs_vm_engine_number" }),
                            search.createColumn({ name: "custrecord_advs_st_sales_ord_link" }),
                            search.createColumn({ name: "custrecord_advs_st_sales_ord_date" }),
                            search.createColumn({ name: "custrecord_advs_st_registration_date" }),
                            search.createColumn({ name: "custrecord_advs_st_vm_ex_showroom" }),
                            search.createColumn({ name: "custrecord_advs_vm_location_code" }),
                            search.createColumn({ name: "custrecord_registration_number" }),
                            search.createColumn({ name: "custrecord_registration_number_new" }),
                            search.createColumn({ name: "custrecord_permit_number" }),
                            search.createColumn({ name: "custrecord_case_number" }),
                            search.createColumn({ name: "custrecord_advs_vm_model_year" }),
                            search.createColumn({ name: "custrecord_advs_prod_month" }),
                            search.createColumn({ name: "custrecord_advs_eta" }),
                            search.createColumn({ name: "email", join: "custrecord_created_by_vm", label: "Email" }),
                            search.createColumn({ name: "isinactive" })
                        ]
                    });
                    const modelList = [];
                    var UniqueModelDesc = {};
                    var searchResultCount = searchResults.runPaged().count;
                    log.debug("searchResults result count", searchResultCount);
                    if (searchResultCount > 0) {
                        SucessMsg = 'Success. Total Vehicle Stock found: ' + searchResultCount;

                        searchResults.run().each(function (result) {

                            const internalid = result.getValue({ name: "internalid" }) || "";
                            const chassicNumber = result.getValue({ name: "name" }) || "";
                            const manufacturer = result.getText({ name: "custrecord_advs_vm_vehicle_brand" }) || "";
                            const modelDmsId = result.getValue({ name: "custrecord_advs_vm_model" }) || "";
                            const variantDmsId = result.getValue({ name: "custrecord_st_v_m_model_variant" }) || "";
                            const variantColourDmsId = result.getValue({ name: "custrecord_advs_vm_exterior_color" }) || "";
                            const remarks = result.getValue({ name: "custrecord_advs_vm_remark" }) || "";
                            const customerDmsId = result.getValue({ name: "custrecord_advs_vm_customer_number" }) || "";
                            const status = result.getText({ name: "custrecord_advs_vm_reservation_status" }) || "";
                            const testDriveCar = result.getValue({ name: "custrecord_test_drive_vm" }) || false;
                            const showroomCar = result.getValue({ name: "custrecord_showroom_car_vm" }) || false;
                            const engineNumber = result.getValue({ name: "custrecord_advs_vm_engine_number" }) || "";
                            const vsaName = result.getValue({ name: "custrecord_advs_st_sales_ord_link" }) || "";
                            const vsaDmsId = result.getValue({ name: "custrecord_advs_st_sales_ord_link" }) || "";
                            const vsaDate = result.getValue({ name: "custrecord_advs_st_sales_ord_date" }) || null;
                            const registrationDate = result.getValue({ name: "custrecord_advs_st_registration_date" }) || null;
                            const showroom = result.getValue({ name: "custrecord_advs_st_vm_ex_showroom" }) || "";
                            const location = result.getText({ name: "custrecord_advs_vm_location_code" }) || "";
                            const permitNumber = result.getValue({ name: "custrecord_permit_number" }) || "";
                            const registrationNumber = result.getValue({ name: "custrecord_registration_number" }) || "";
                            const registrationNumberNew = result.getValue({ name: "custrecord_registration_number_new" }) || "";
                            const caseNumber = result.getValue({ name: "custrecord_case_number" }) || "";
                            const prodYear = result.getText({ name: "custrecord_advs_vm_model_year" }) || "";
                            const prodMonth = result.getText({ name: "custrecord_advs_prod_month" }) || "";
                            var eta = result.getValue({ name: "custrecord_advs_eta" }) || null;
                            const isinactive = result.getValue({ name: "isinactive" }) || "";
                            const created_email = result.getValue({ name: "email", join: "custrecord_created_by_vm", label: "Email" }) || "";

                            var VSADateN = null, RegisendDateN = null;
                            //Convert date to YYYY-MM-DD format
                            if (vsaDate) {
                                VSADateN = convertDateToYMD(vsaDate);
                            }
                            if (registrationDate) {
                                RegisendDateN = convertDateToYMD(registrationDate);
                            }
                            if (eta) {
                                eta = convertDateToYMD(eta);
                            }
                            res.VehicleStock.push({
                                action: 'UPSERT_UNSOLD_VEHICLE_STOCK',
                                dmsId: internalid,
                                manufacturer: manufacturer,
                                modelDmsId: modelDmsId,
                                variantDmsId: variantDmsId,
                                variantColourDmsId: variantColourDmsId,
                                remarks: remarks,
                                customerDmsId: customerDmsId,
                                status: status,
                                testDriveCar: testDriveCar,
                                showroomCar: showroomCar,
                                engineNumber: engineNumber,
                                vsaName: vsaName,
                                vsaDmsId: vsaDmsId,
                                vsaDate: VSADateN,
                                showroom: showroom,
                                registrationDate: RegisendDateN,
                                location: location,
                                caseNumber: caseNumber,
                                permitNumber: permitNumber,
                                chassisNumber: chassicNumber,
                                registrationNumber: registrationNumber,
                                registrationNumberNew: registrationNumberNew,
                                customerB2BDmsId: "",
                                specificPackageDmsId: "",
                                productionMonth: prodMonth,
                                productionYear: prodYear,
                                etaDate: eta,
                                baseCarCostApproximateOMV: null,
                                dutyPaidOMV: null,
                                Active: (isinactive == "T" || isinactive == true) ? false : true,
                                recordOwnerEmail: created_email

                            });

                            return true;
                        });
                    } else {
                        SucessMsg = 'Vehicle Stock not found in DMS';
                    }


                    res.statusCode = 200;
                    res.statusMessage = SucessMsg;

                } catch (e) {
                    res.statusCode = 500;
                    res.statusMessage = e.message || 'Unexpected error';
                }
            }
            else if (item.Flag == 'Purchaser') {
                try {
                    var SucessMsg = '';
                    var res = {
                        purchasers: [],
                        statusCode: '',
                        statusMessage: ''
                    };

                    var customrecord_advs_vmSearchObj = search.create({
                        type: "employee",
                        filters:
                            [
                                ["subsidiary", "anyof", '19'],
                                "AND",
                                ["isinactive", "anyof", "F"]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "entityid" }),
                                search.createColumn({ name: "email" }),
                                search.createColumn({ name: "internalid" })
                            ]
                    });
                    var searchResultCount = customrecord_advs_vmSearchObj.runPaged().count;

                    log.debug("customrecord_advs_vmSearchObj result count", searchResultCount);
                    if (searchResultCount > 0) {
                        SucessMsg = 'Success. Total purchasers found: ' + searchResultCount;
                        customrecord_advs_vmSearchObj.run().each(function (result) {

                            res.purchasers.push({
                                purchaserName: result.getValue({ name: "entityid" }),
                                purchaserEmailid: result.getValue({ name: "email" }),
                                dmsid: result.getValue({ name: "internalid" })
                            });

                            return true;
                        });
                    } else {
                        SucessMsg = 'Purchase not found in DMS';

                    }

                    res.statusCode = 200;
                    res.statusMessage = SucessMsg;


                } catch (e) {
                    res.statusCode = 500;
                    res.statusMessage = e.message || 'Unexpected error';
                }
            }
            else {
                var res = {
                    statusCode: 500,
                    statusMessage: 'Flag did not match'
                };
            }
            log.debug('Response Payload 1', JSON.stringify(res));
            results.push(res);

            
        });
         
        
        return results;
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
    function convertDateToYMD(inputDateStr) {
        // Input: "02/06/2025" (DD/MM/YYYY)
        const parts = inputDateStr.split('/');
        const dd = parts[0];
        const mm = parts[1];
        const yyyy = parts[2];
        // Reformat to "YYYY-MM-DD"
        return `${yyyy}-${mm}-${dd}`;
    }

    function findDuplicate(value) {

        if (!value) return null;

        var s = search.create({
            type: search.Type.CUSTOMER,
            filters: [
                ['isinactive', 'is', 'F'], 'AND', ['custentity_salesforce_id', 'is', value]
            ],
            columns: ['internalid']
        })
            .run()
            .getRange({ start: 0, end: 1 });
        return s.length ? s[0].getValue({ name: 'internalid' }) : null;
    }
    function makeErr(code, msg) {
        return error.create({ name: code, message: msg, notifyOff: true });
    }
    return { post: doPost };
});
