/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 */
define(['N/record', 'N/search', 'N/log', 'N/format'], function (record, search, log, format) {

    var SalesOrder_CustomFrom = 356; //ADVS Vechile SO
    var VSASuccesmsg = '';
    var selected_pckgID = '';
    var TradeIn_record_ID = null;
    var VSA_update_Msg = 'VSA has been updated sucessfully';

    function post(request) {

        var items = Array.isArray(request) ? request : [request];
        var response = [];
        var child_table = 'recmachcustrecord_parent';

        var recParentBuffer = null;
        var sucessMsg = '';

        items.forEach(function (entry) {
            var res = {
                dmsId: null,
                statusCode: '',
                statusMessage: ''
            };

            if (entry.action == 'VEHICLE_MASTER') {
                try {

                    log.error('POST res', res);
                    var VehDMS_ID = entry.dmsid;

                    // Mandatory key

                    if (!entry.chassisno || !entry.vehicle_make || !entry.vehicle_model || !entry.engine_no || !entry.vehicle_license_plate) {
                        res.statusCode = 500;
                        res.statusMessage = 'Required:  chassisno, vehicle_make, vehicle_model  ,engine # , license palte #';
                        response.push(res);
                        return;
                    }

                    if (VehDMS_ID) {
                        var vehicleRecordObj = record.load({
                            type: "customrecord_advs_vm",
                            id: VehDMS_ID, // need to confirrm 
                            isDynamic: true
                        });
                        sucessMsg = "Vehicle Master updated successfully with ID: ";
                    } else {
                        var vehicleRecordObj = record.create({ type: "customrecord_advs_vm", isDynamic: true });
                        sucessMsg = "Vehicle Master created successfully with ID: ";
                    }

                    // if (entry.chassisno) {
                    vehicleRecordObj.setValue({
                        fieldId: "name",
                        value: entry.chassisno
                    });
                    // }
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_reservation_status",
                        value: 8 // on Hold
                    });
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_subsidary",
                        value: 19 // Pre Owned 
                    });
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_vehicle_status",
                        value: 1 // Old Vehicle
                    });
                    
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_appvantage",
                        value: true
                    });
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_send_salesforce_vm",
                        value: false
                    });

                    if (entry.vehicle_make) {
                        vehicleRecordObj.setValue({
                            fieldId: "custrecord_advs_vm_vehicle_brand",
                            value: getIntrrnalIdByText("customrecord_advs_brands", entry.vehicle_make)
                        });
                    }


                    if (entry.vehicle_model) {
                        vehicleRecordObj.setValue({
                            fieldId: "custrecord_advs_vm_model",
                            value: getIntrrnalIdByText("item", entry.vehicle_model)
                        });
                    }

                    // if (entry.vehicle_license_plate) {
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_license_no_compressed",
                        value: entry.vehicle_license_plate
                    });
                    // }


                    // if (entry.engine_no) {
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_engine_number",
                        value: entry.engine_no
                    });
                    // }

                    // if (entry.mileage) {
                    vehicleRecordObj.setValue({
                        fieldId: "custrecord_advs_vm_mileage",
                        value: entry.mileage
                    });
                    // }


                    var AppvantageSublist = "recmachcustrecord_appvantage_vm_link";

                    if (VehDMS_ID) {
                        vehicleRecordObj.selectLine({
                            sublistId: AppvantageSublist,
                            line: 0 // line remain same for each time 
                        });
                    } else {
                        vehicleRecordObj.selectNewLine({
                            sublistId: AppvantageSublist
                        });
                    }

                    // if (entry.appvantage_id) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_id",  // field created other then excel 
                        value: entry.appvantage_id
                    });
                    // }


                    // if (entry.transaction_no) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_trans",
                        value: entry.transaction_no
                    });
                    // }

                    // if (entry.transaction_state) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_trans_state",
                        value: entry.transaction_state
                    });
                    // }


                    if (entry.created_on) {

                        // log.error("entry.created_on", entry.created_on);
                        var createdon = parseCustomDate(entry.created_on);
                        // log.error("createdon", createdon);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_created_on",
                            value: createdon
                        });
                    }

                    // if (entry.created_by) {

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_created_by",
                        value: entry.created_by
                    });

                    // }

                    if (entry.last_updated_on) {
                        var last_updated_on = parseCustomDate(entry.last_updated_on);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_last_update_on",
                            value: last_updated_on
                        });
                    }

                    if (entry.close_on) {
                        var close_on = parseCustomDate(entry.close_on);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_close_on",
                            value: close_on
                        });
                    }

                    // if (entry.internal_remark) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_internal_r",
                        value: entry.internal_remark
                    });
                    // }
                    // if (entry.admin_remark) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_admin_r",
                        value: entry.admin_remark
                    });
                    // }


                    // if (entry.purchase_transaction_number) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_po_tran_no",
                        value: entry.purchase_transaction_number
                    });
                    // }


                    if (entry.transaction_action) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_action",
                            value: getIntrrnalIdByText("customrecord_advs_appvantage_action_list", entry.transaction_action)
                        });
                    }



                    if (entry.updated_on) {

                        var updated_on = parseCustomDate(entry.updated_on);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_update_on",
                            value: updated_on
                        });
                    }

                    // if (entry.updated_by) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_update_by",
                        value: entry.updated_by
                    });
                    // }
                    // if (entry.vehicle_to_be_exported) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_veh_exported",
                        value: entry.vehicle_to_be_exported
                    });
                    // }



                    if (entry.deregistration_date) {

                        var deregistration_date = parseCustomDate(entry.deregistration_date);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_intended_der_date",
                            value: deregistration_date
                        });
                    }
                    // if (entry.primary_color) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_pri_color",
                        value: entry.primary_color
                    });
                    // }

                    // if (entry.secondary_color) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_sec_color",
                        value: entry.secondary_color
                    });
                    // }

                    // if (entry.manufacturing_year) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_manu_year",
                        value: entry.manufacturing_year
                    });
                    // }

                    // if (entry.max_power_output) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_max_p_output",
                        value: entry.max_power_output
                    });
                    // }

                    // if (entry.open_market_value) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecordadvs_appvantage_open_mkt_v",
                        value: entry.open_market_value
                    });
                    // }


                    if (entry.orignal_registration_date) {
                        var orignal_registration_date = parseCustomDate(entry.orignal_registration_date);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_regi_date",
                            value: orignal_registration_date
                        });
                    }

                    if (entry.first_registration_date) {

                        var first_registration_date = parseCustomDate(entry.first_registration_date);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_f_regis_date",
                            value: first_registration_date
                        });
                    }
                    // if (entry.transfer_count) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvanytage_transfer_c",
                        value: entry.transfer_count
                    });
                    // }

                    // if (entry.actual_arf_paid) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_arf_paid",
                        value: entry.actual_arf_paid
                    });
                    // }

                    if (entry.opc_cash_rebate_eligibility) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_opc_rebate_e",
                            value: entry.opc_cash_rebate_eligibility
                        });
                    }


                    if (entry.opc_cash_rebate_eligibility_date) {

                        var opc_cash_rebate_eligibility_date = parseCustomDate(entry.opc_cash_rebate_eligibility_date);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_opc_rebate_d",
                            value: opc_cash_rebate_eligibility_date
                        });
                    }




                    // if (entry.opc_cash_rebate_amount) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_opc_rebate_amount",
                        value: entry.opc_cash_rebate_amount
                    });
                    // }


                    // if (entry.parf_eligibility) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_pafr_eligi",
                        value: entry.parf_eligibility
                    });
                    // }



                    if (entry.parf_eligibility_expiry_date) {
                        var parf_eligibility_expiry_date = parseCustomDate(entry.parf_eligibility_expiry_date);

                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_parf_exp_date",
                            value: parf_eligibility_expiry_date
                        });
                    }
                    // if (entry.parf_rebate_amount) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_parf_rebate_a",
                        value: entry.parf_rebate_amount
                    });
                    // }


                    if (entry.coe_expiry_date) {

                        var coe_expiry_date = parseCustomDate(entry.coe_expiry_date);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_coe_exp_d",
                            value: coe_expiry_date
                        });
                    }

                    // if (entry.coe_category) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_coe_cate",
                        value: entry.coe_category
                    });
                    // }

                    // if (entry.coe_period) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_coe_period",
                        value: entry.coe_period
                    });
                    // }

                    // if (entry.qp_paid) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_qp_paid",
                        value: entry.qp_paid
                    });
                    // }

                    // if (entry.pqp_paid) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_pqp_paid",
                        value: entry.pqp_paid
                    });
                    // }

                    // if (entry.coe_rebate) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_coe_rebate_a",
                        value: entry.coe_rebate
                    });
                    // }

                    // if (entry.total_rebate_amount) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_t_rebate_a",
                        value: entry.total_rebate_amount
                    });
                    // }

                    // if (entry.lta_message) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_lta_message",
                        value: entry.lta_message
                    });
                    // }

                    if (entry.import_method) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_import_method",
                            value: getIntrrnalIdByText("customrecord_advs_import_method", entry.import_method)
                        });
                    }

                    // if (entry.set_of_key) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_set_of_keys",
                        value: entry.set_of_key
                    });
                    // }
                    // else{
                    //      vehicleRecordObj.setCurrentSublistValue({
                    //         sublistId: AppvantageSublist,
                    //         fieldId: "custrecord_advs_appvantage_set_of_keys",
                    //         value: "0"
                    //     });
                    // }



                    if (entry.user_guide) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_user_guide",
                            value: entry.user_guide
                        });
                    } else {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_user_guide",
                            value: false
                        });
                    }



                    // if (entry.dealer_one) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_dealer",
                        value: entry.dealer_one
                    });
                    // }

                    // if (entry.dealer_one_price) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecordadvs_appvantage_price",
                        value: entry.dealer_one_price
                    });
                    // }

                    // if (entry.dealer_two) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_dealer_two",
                        value: entry.dealer_two
                    });
                    // }


                    // if (entry.dealer_two_price) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_price_t",
                        value: entry.dealer_two_price
                    });
                    // }

                    // if (entry.dealer_three) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_dealer_three",
                        value: entry.dealer_three
                    });
                    // }

                    // if (entry.dealer_three_price) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_price_three",
                        value: entry.dealer_three_price
                    });
                    // }


                    // if (entry.new_car_vsa) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_adva_appvantage_new_car_vsa",
                        value: entry.new_car_vsa
                    });
                    // }




                    if (entry.target_handover_date) {
                        var target_handover_date = parseCustomDate(entry.target_handover_date);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_target_h_d",
                            value: target_handover_date
                        });
                    }

                    // if (entry.assigned_handover_vt) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_ass_ho_vt",
                        value: entry.assigned_handover_vt
                    });
                    // }

                    // if (entry.handover_location) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_h_loc",
                        value: entry.handover_location
                    });
                    // }


                    if (entry.actual_handover_date) {
                        var actual_handover_date = parseCustomDate(entry.actual_handover_date);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_ac_handover_d",
                            value: actual_handover_date
                        });
                    }
                    // if (entry.handover_remark) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_handover_r",
                        value: entry.handover_remark
                    });
                    // }

                    // if (entry.awarded_dealer) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_awarded_deale",
                        value: entry.awarded_dealer
                    });
                    // }


                    if (entry.bidding_status) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_status",
                            value: getIntrrnalIdByText("customrecord_advs_appvantage_bidding_sta", entry.bidding_status)
                        });
                    }

                    // if (entry.bidding_session) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_bidding_sessi",
                        value: entry.bidding_session
                    });
                    // }


                    if (entry.open_bid_on) {

                        var open_bid_on = parseCustomDate(entry.open_bid_on);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_open_bid_on",
                            value: open_bid_on
                        });
                    }


                    if (entry.close_bid_on) {

                        var close_bid_on = parseCustomDate(entry.close_bid_on);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_close_bid_on",
                            value: close_bid_on
                        });
                    }
                    // if (entry.bid_notes) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_bid_notes",
                        value: entry.bid_notes
                    });
                    // }
                    // if (entry.top_bid_number_one) {
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_top_bid_nu_",
                        value: entry.top_bid_number_one
                    });
                    // }

                    if (entry.transaction_type) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_apvantage_trans_type",
                            value: getIntrrnalIdByText("customrecord_advs_app_trans_type", entry.transaction_type)
                        });
                    }

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_ass_sc",
                        value: entry.assignedSc
                    });

                    if (entry.brand) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_brand",
                            value: getIntrrnalIdByText("customrecord_advs_brands", entry.brand)
                        });
                    }

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_last_ud_by",
                        value: entry.last_update_by
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_cancle_r",
                        value: entry.cancle_remark
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_owner_id",
                        value: entry.owner_id
                    });
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_owner_type",
                        value: entry.owner_type
                    });
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appnvantage_owner_name",
                        value: entry.owner_name
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_model_in",
                        value: entry.model_interested
                    });
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_v_pur_agree_n",
                        value: entry.vehicle_pur_agreement
                    });
                    if (entry.delivery_period) {
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvanatge_delivery_p",
                            value: getIntrrnalIdByText("customrecord_advs_delivery_period", entry.delivery_period)
                        });
                    }


                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_valuation",
                        value: entry.valuation
                    });
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_last_val",
                        value: entry.latest_valuation
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_valuated_by",
                        value: entry.valuated_by
                    });
                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_1st_val",
                        value: entry.first_valuation
                    });
                    if (entry.valuation_on) {
                        var valuation_on = parseCustomDate(entry.valuation_on);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_val_on",
                            value: valuation_on
                        });
                    }

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_val_by_1nd",
                        value: entry.valuation_by_first
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_conditional_remark",
                        value: entry.conditional_remark
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_v_dia_comm",
                        value: entry.vehicle_diagram_comments
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_assigned_pur",
                        value: entry.assigned_purchaser
                    });

                    if (entry.purchaser_assigned_on) {
                        var purchaser_assigned_on = parseCustomDate(entry.purchaser_assigned_on);
                        vehicleRecordObj.setCurrentSublistValue({
                            sublistId: AppvantageSublist,
                            fieldId: "custrecord_advs_appvantage_pur_ass_on",
                            value: purchaser_assigned_on
                        });
                    }

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_t_set_of_key",
                        value: entry.target_set_of_keys
                    });

                    vehicleRecordObj.setCurrentSublistValue({
                        sublistId: AppvantageSublist,
                        fieldId: "custrecord_advs_appvantage_target_handbo",
                        value: entry.target_handbook
                    });


                    vehicleRecordObj.commitLine({
                        sublistId: AppvantageSublist,
                        ignoreRecalc: true
                    });
                    var UserCompID = vehicleRecordObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    res.statusCode = 200;
                    res.dmsId = UserCompID;
                    res.statusMessage = sucessMsg + UserCompID;
                    response.push(res);

                } catch (e) {
                    log.error('Error processing entry', e);
                    res.statusCode = 500;
                    res.statusMessage = e.message;
                    response.push(res);
                }
            } else {
                res.statusCode = 500;
                res.statusMessage = 'Action does not match !';
                response.push(res);

                return;
            }

            // to store Req in Buffer Table
            recParentBuffer = record.create({ type: 'customrecord_buffer_table', isDynamic: true });
            recParentBuffer.setValue({ fieldId: 'custrecord_buffer_record_type', value: 5 }); // Appvantage Integration

            recParentBuffer.selectNewLine({ sublistId: child_table });
            recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_request", value: JSON.stringify(entry) });
            recParentBuffer.setCurrentSublistValue({ sublistId: child_table, fieldId: "custrecord_record_type_", value: 5 });
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
            filters: [['custrecord_vsa_package', 'anyof', SalesOrderID]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
        return childSearch.length ? childSearch[0].getValue({ name: 'internalid' }) : null;
    }
    function findSelected_Package_Item_Record(SalesforceID) {
        var childSearch = search.create({
            type: 'customrecord_save_vsa_package_item',
            filters: [['custrecord_selected_pckgitem_sfid', 'is', SalesforceID]],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });
        return childSearch.length ? childSearch[0].getValue({ name: 'internalid' }) : null;
    }
    function find_VehicleMaster_toadd_online(subsidiary, itemId) {
        var vinRecordId = '';
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
        }
        return vinRecordId;
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

    function getVendorIdByEmail(email) {
        if (!email) return null;
        var s = search.create({
            type: search.Type.VENDOR,
            filters: [['email', 'is', email]],
            columns: ['internalid']
        })
            .run()
            .getRange({ start: 0, end: 1 });
        return s.length ? s[0].getValue({ name: 'internalid' }) : null;
    }

    function parseCustomDate(str) {
        // Example input: "28/07/2025 4:40:00 pm"
        var dateTimeParts = str.split(' ');
        var dateParts = dateTimeParts[0].split('/'); // ['28', '07', '2025']
        var timeParts = dateTimeParts[1].split(':'); // ['4', '40', '00']
        var hour = parseInt(timeParts[0], 10);
        var minute = parseInt(timeParts[1], 10);
        var second = parseInt(timeParts[2], 10);
        var ampm = dateTimeParts[2].toLowerCase();

        // Convert hour based on AM/PM
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        // JS Date: new Date(year, month-1, day, hour, minute, second)
        return new Date(
            parseInt(dateParts[2], 10),          // year
            parseInt(dateParts[1], 10) - 1,      // month (0-based)
            parseInt(dateParts[0], 10),          // day
            hour,
            minute,
            second
        );
    }



    return {
        post: post
    };
});
