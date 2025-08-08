/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/file', 'N/record', 'N/format', 'N/search'], (log, file, record, format, search) => {
    const onRequest = (context) => {


        var html = "";
        if (context.request.method === 'GET') {


            html += "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<meta charset='UTF-8'>" +
                "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                "<title>Handover Checklist</title>" +
                "<link href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css' rel='stylesheet'>" +
                "<link href='https://9908878.app.netsuite.com/core/media/media.nl?id=8163&c=9908878&h=1WdD_mbxCcHQ0mS1FAwr1wn4ZxxzKzYZtGePCeWiVWMotoyF&_xt=.css' rel='stylesheet'>" +
                "<link href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css' rel='stylesheet'>" +
                "<link rel='stylesheet' href='https://tstdrv1064792.app.netsuite.com/core/media/media.nl?id=258362&c=TSTDRV1064792&h=XXAb5P8eN9-Yzh7fb2MumuFHaz-qekzE-xNuMxV9vfnmr0N6&_xt=.css'>" +
                "</head>" +
                "<body>" +
                "<div class='container mt-5'>" +
                "<h3 class='text-center mt-3' style='color: #ff5722;'>Handover Checklist</h3>" +
                "<button type='submit' style='background-color: #ff5722; color: white;'>Submit</button>" +
                "</div>" +
                "<div class='container mt-3 form-wrapper'>" +
                "<form id='testDriveForm' method='POST'>" +
                "<div class='form-row'>" +
                "<div class='form-group col-md-4'>" +
                "<label for='title'>Title</label>" +
                "<input type='text' class='form-control' name='Title' placeholder='Title'>" +
                "</div>" +
                "<div class='form-group col-md-4'>" +
                "<label for='fname'>First Name <span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='first_name' placeholder='First Name' required>" +
                "</div>" +
                "<div class='form-group col-md-4'>" +
                "<label for='lname'>Last Name <span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' id='lname' name='lastname' placeholder='Last' required>" +
                "</div>" +
                "</div>" +
                "<div class='form-row'>" +
                "<div class='form-group col-md-6'>" +
                "<label for='dealername'>Dealer Name<span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='DealerName' value='Eurokars Supersports Pte Ltd'>" +
                "</div>" +
                "<div class='form-group col-md-6'>" +
                "<label for='delivry_date'>Delivery date/time: <span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='delivry_date'>" +
                "</div>" +
                "</div>";

            html += "<div class='form-row'>" +
                "<div class='form-group col-md-4'>" +
                "<label for='salesperson'>SalesPerson<span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='salesperson'  >" +
                "</div>" +
                "<div class='form-group col-md-4'>" +
                "<label for='model'>Model<span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='model' >" +
                "</div>" +
                "<div class='form-group col-md-4'>" +
                "<label for='vin'>VIN Number</label> " +
                "<input type='text' class='form-control' id='vin' name='vin' >" +
                "</div>" +
                "</div>" +
                "<hr style='border: 1px solid red; margin-top: 10px; margin-bottom: 20px;'></hr>";


            var searchSetupData = search.create({
                type: "customrecord_advs_st_c_l_setup_section",
                filters:
                    [
                        ["internalid", "anyof", "6", "7", "8", "9"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "custrecord_st_c_j_s_s_ok", label: "Ok" }),
                        search.createColumn({ name: "custrecord_st_c_j_s_s_fill", label: "Fill" }),
                        search.createColumn({ name: "custrecord_st_c_j_s_s_detailed_boxes", label: "Detailed boxes" }),
                        search.createColumn({ name: "custrecord_st_c_j_s_s_tire_section", label: "Tire Section" }),
                        search.createColumn({ name: "custrecord_st_c_l_s_s_vehicle_section", label: "Vehicle Section" }),

                        search.createColumn({ name: "custrecord_st_c_l_s_s_sequence", label: "Sequence", sort: "ASC" }),
                        search.createColumn({
                            name: "custrecord_st_c_l_s_s_l_details",
                            join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK",
                            label: "Details"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_st_c_l_s_s_l_sequence",
                            join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK",
                            label: "Sequence",
                            sort: "ASC"
                        })
                    ]
            });

            var dataArray = new Array();
            var lineArray = new Array();
            var HeadArray = new Array();

            searchSetupData.run().each(function (result) {

                var HeadId = result.getValue({ name: "internalid" });
                var HeadName = result.getValue({ name: "name" });
                var HeadOk = result.getValue({ name: "custrecord_st_c_j_s_s_ok" });
                var HeadFill = result.getValue({ name: "custrecord_st_c_j_s_s_fill" });
                var HeadDetails = result.getValue({ name: "custrecord_st_c_j_s_s_detailed_boxes" });
                var HeadTire = result.getValue({ name: "custrecord_st_c_j_s_s_tire_section" });
                var HeadVehicle = result.getValue({ name: "custrecord_st_c_l_s_s_vehicle_section" });
                var HeadSeq = result.getValue({ name: "custrecord_st_c_l_s_s_sequence" });

                var LineDetails = result.getValue({
                    name: "custrecord_st_c_l_s_s_l_details",
                    join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK"
                });
                var LineIntid = result.getValue({ name: "internalid", join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK" });
                var LineSeq = result.getValue({
                    name: "custrecord_st_c_l_s_s_l_sequence",
                    join: "CUSTRECORD_ST_C_L_S_S_L_HEAD_LINK"
                });

                if (HeadName) {
                    if (!dataArray[HeadName]) {
                        dataArray[HeadName] = [];
                        lineArray[HeadName] = [];
                    }

                    if (HeadArray.indexOf(HeadName) == -1) {
                        HeadArray.push(HeadName);
                    }
                }

                lineArray[HeadName].push({
                    HeadId: HeadId,
                    HeadName: HeadName,
                    HeadOk: HeadOk,
                    HeadFill: HeadFill,
                    HeadDetails: HeadDetails,
                    HeadTire: HeadTire,
                    HeadVehicle: HeadVehicle,
                    HeadSeq: HeadSeq,
                    LineDetails: LineDetails,
                    LineIntid: LineIntid,
                    LineSeq: LineSeq
                });

                return true;
            });


            for (var h = 0; h < HeadArray.length; h++) {
                dataArray[HeadArray[h]].push(lineArray[HeadArray[h]]);
            }
            log.debug("lineArray 1", JSON.stringify(lineArray));
            log.debug("HeadArray 1", JSON.stringify(HeadArray));

            var recmachList = "recmachcustrecord_st_s_c_l_l_d_head_link";

            var SetupRecObj = record.create({ type: "customrecord_advs_st_saved_check_list", isDynamic: true });
            SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_type", value: 2 });
            checkListId = SetupRecObj.save({ ignoreMandatoryFields: true, enableSourcing: true });

            for (var h = 0; h < HeadArray.length; h++) {

                var DataToCheck = dataArray[HeadArray[h]];

                var sectionName = DataToCheck[0][0].HeadName,
                    HeadOk = DataToCheck[0][0].HeadOk,
                    HeadFill = DataToCheck[0][0].HeadFill,
                    HeadDetails = DataToCheck[0][0].HeadDetails,
                    HeadTire = DataToCheck[0][0].HeadTire,
                    HeadVehicle = DataToCheck[0][0].HeadVehicle;

                //log.debug("DataToCheck", JSON.stringify(DataToCheck));

                var SetupRecObj = record.create({ type: "customrecord_advs_sr_saved_ch_lines", isDynamic: true });

                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_head_link", value: checkListId });
                SetupRecObj.setValue({ fieldId: "name", value: sectionName });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_ok", value: HeadOk });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_fill", value: HeadFill });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_detailed_boxes", value: HeadDetails });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_tire_section", value: HeadTire });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_vehicle_section", value: HeadVehicle });
                SetupRecObj.setValue({ fieldId: "custrecord_st_s_c_l_l_sequence", value: (h * 1 + 1) });

                var LineLengthData = DataToCheck[0].length;

                for (var LD = 0; LD < LineLengthData; LD++) {

                    var LineDetails = DataToCheck[0][LD].LineDetails;

                    SetupRecObj.selectNewLine({ sublistId: recmachList });

                    SetupRecObj.setCurrentSublistValue({
                        sublistId: recmachList,
                        fieldId: "name",
                        value: LineDetails
                    });

                    SetupRecObj.setCurrentSublistValue({
                        sublistId: recmachList,
                        fieldId: "custrecord_st_s_c_l_l_d_sequence",
                        value: LD * 1 + 1
                    });

                    SetupRecObj.setCurrentSublistValue({
                        sublistId: recmachList,
                        fieldId: "custrecord_st_s_c_l_l_d_p_head_link",
                        value: checkListId
                    });

                    SetupRecObj.commitLine({ sublistId: recmachList });


                }

                SetupRecObj.save({ ignoreMandatoryFields: true, enableSourcing: true });

            }


            var SearchCheckListDetails = search.create({
                type: "customrecord_advs_st_s_c_l_l_details",
                filters:
                    [
                        ["custrecord_st_s_c_l_l_d_head_link.custrecord_st_s_c_l_l_head_link", "anyof", checkListId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "name", label: "Name" }),
                        search.createColumn({ name: "internalid", label: "Internal Id" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_ok", label: "Ok" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_fill", label: "Fill" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_details", label: "Details" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_image", label: "Image" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_break_lining", label: "Brake Lining" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_tire_thread", label: "Tire Thread" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_wear_pattern", label: "Wear Pattern" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_tire_pre_before", label: "Tire Pressure Before" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_tire_pre_after", label: "Tire Pressure After" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_rotor_drum", label: "Rotor/Drum" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_sequence", label: "Sequence", sort: "ASC" }),
                        search.createColumn({ name: "custrecord_st_s_c_l_l_d_head_link", label: "Head Link" }),
                        search.createColumn({
                            name: "name",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "internalid",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_sequence",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Sequence"
                            , sort: "ASC"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_tire_section",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Tire Section"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_vehicle_section",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Vehicle Section"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_wheel_balance_req",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Wheel Balance Req"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_ok",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Ok"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_fill",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Fill"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_detailed_boxes",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Detailed boxes"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_break_insp_not_per",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Break Inspection Not Performed this visit"
                        }),
                        search.createColumn({
                            name: "custrecord_st_s_c_l_l_align_check_req",
                            join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK",
                            label: "Alignment Check Req"
                        })
                    ]
            }); 
            

            var dataArray = new Array();

            var HeadArray = new Array();
            let lineArray2 = {};

            SearchCheckListDetails.run().each(function (result) {

                var HeadId = result.getValue({ name: "internalid", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadName = result.getValue({ name: "name", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadOk = result.getValue({ name: "custrecord_st_s_c_l_l_ok", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadFill = result.getValue({ name: "custrecord_st_s_c_l_l_fill", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadDetails = result.getValue({ name: "custrecord_st_s_c_l_l_detailed_boxes", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadTire = result.getValue({ name: "custrecord_st_s_c_l_l_tire_section", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadVehicle = result.getValue({ name: "custrecord_st_s_c_l_l_vehicle_section", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HeadSeq = result.getValue({ name: "custrecord_st_s_c_l_l_sequence", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });

                var HLineWheelBalance = result.getValue({ name: "custrecord_st_s_c_l_l_wheel_balance_req", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HLineBreakInsp = result.getValue({ name: "custrecord_st_s_c_l_l_break_insp_not_per", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });
                var HLineAlignCheck = result.getValue({ name: "custrecord_st_s_c_l_l_align_check_req", join: "CUSTRECORD_ST_S_C_L_L_D_HEAD_LINK" });

                var imageId = result.getValue({ name: "custrecord_st_s_c_l_l_d_image" });
                var imageText = result.getText({ name: "custrecord_st_s_c_l_l_d_image" })

                var LineDetails = result.getValue({
                    name: "name"
                });
                var LineIntid = result.getValue({ name: "internalid" });
                var LineSeq = result.getValue({
                    name: "custrecord_st_s_c_l_l_d_sequence"
                });

                var LineOk = result.getValue({ name: "custrecord_st_s_c_l_l_d_ok" });
                var LineFill = result.getValue({ name: "custrecord_st_s_c_l_l_d_fill" });
                var LineDet = result.getValue({ name: "custrecord_st_s_c_l_l_d_details" });
                var LineBreakLineD = result.getValue({ name: "custrecord_st_s_c_l_l_d_break_lining" });
                var LineTireThreadD = result.getValue({ name: "custrecord_st_s_c_l_l_d_tire_thread" });
                var LineWearPatternD = result.getValue({ name: "custrecord_st_s_c_l_l_d_wear_pattern" });

                var LineTirePreBefore = result.getValue({ name: "custrecord_st_s_c_l_l_d_tire_pre_before" });
                var LineTirePreAfter = result.getValue({ name: "custrecord_st_s_c_l_l_d_tire_pre_after" });
                var LineRotorDrum = result.getValue({ name: "custrecord_st_s_c_l_l_d_rotor_drum" });

                if (HeadName) {
                    if (!dataArray[HeadName]) {
                        dataArray[HeadName] = [];
                        //lineArray[HeadName] = [];
                    }
                    if (HeadArray.indexOf(HeadName) == -1) {
                        HeadArray.push(HeadName);
                        lineArray2[HeadName] = [];
                    }
                }

                lineArray2[HeadName].push({
                    HeadId: HeadId,
                    HeadName: HeadName,
                    HeadOk: HeadOk,
                    HeadFill: HeadFill,
                    HeadDetails: HeadDetails,
                    HeadTire: HeadTire,
                    HeadVehicle: HeadVehicle,
                    HeadSeq: HeadSeq,
                    LineDetails: LineDetails,
                    LineIntid: LineIntid,
                    LineSeq: LineSeq,
                    LineOk: LineOk,
                    LineFill: LineFill,
                    LineDet: LineDet,
                    LineBrakeLine: LineOk,
                    LineTireThread: LineFill,
                    LineWearpattern: LineDet,
                    LineBreakLineD: LineBreakLineD,
                    LineTireThreadD: LineTireThreadD,
                    LineWearPatternD: LineWearPatternD,
                    LineTirePreBefore: LineTirePreBefore,
                    LineTirePreAfter: LineTirePreAfter,
                    LineRotorDrum: LineRotorDrum,
                    HLineWheelBalance: HLineWheelBalance,
                    HLineBreakInsp: HLineBreakInsp,
                    HLineAlignCheck: HLineAlignCheck,
                    imageId: imageId,
                    imageText: imageText
                });


                return true;
            });

            let leftHtml = "";
            let rightHtml = "";
            let switchedToRight = false; // Reset for each header section
            HeadArray.forEach(function (header) {

                let headerHtml = "<br><label style='color: #ff5722; font-weight: bold;'>" + header + "</label><br>";
                let blockHtml = "";

                lineArray2[header].forEach(function (line, index) {
                    // Switch condition
                    if (line.LineDetails === "Introduction to service personnel") {
                        switchedToRight = true;
                    }

                    const checkboxHtml = "<label>" +
                        "<input type='checkbox' name='cbox_" + index + "' />" +
                        "<span style='margin-left: 5px; font-size: 13px;'>" + line.LineDetails + "</span>" +
                        "</label><br>";

                    blockHtml += checkboxHtml;
                });

                // Decide which column to place this header + its items
                if (switchedToRight) {
                    rightHtml += headerHtml + blockHtml;
                } else {
                    leftHtml += headerHtml + blockHtml;
                }
            });

            html += "<div class='row'>" +
                "<div class='col-md-6'>" + leftHtml + "</div>" +
                "<div class='col-md-6'>" + rightHtml + "</div>" +
                "</div>";
            html += "<hr style='border: 1px solid red; margin-top: 10px; margin-bottom: 20px;'></hr>" +

                "<p style='margin-top: 5px; font-size: 12px;'>" +
                "cLaren Automotive Limited (“McLaren”) would like to contact you in the future about invitations, news and information regarding McLaren’s current and future product ranges" +
                "and services we think may be of interest to you.We would also like to share the information you have provided today with our Group’s Companies and selected business partners" +
                "including our authorised dealers in your local region or country who may contact you regarding goods and services which may be of interest to you.Please let us know if you " +
                "are happy to be contacted by: </p>";
             
            html += "<label style='margin-right: 15px;'>" +
                "<input type='checkbox' name='cbox_email' />" +
                "<span style='margin-left: 5px; font-size: 13px;'>Email</span>" +
                "</label>";

            html += "<label style='margin-right: 15px;'>" +
                "<input type='checkbox' name='cbox_phn' />" +
                "<span style='margin-left: 5px; font-size: 13px;'>Phone</span>" +
                "</label>";

            html += "<label style='margin-right: 15px;'>" +
                "<input type='checkbox' name='cbox_sms' />" +
                "<span style='margin-left: 5px; font-size: 13px;'>SMS</span>" +
                "</label>";

            html += "<br><label style='color: #ff5722; font-weight: bold;'>SIGNATURE</label><br>";
            html += "<div class='form-row'>" +
                "<div class='form-group col-md-6'>" +
                "<label for='salesperson'>SalesPerson<span class='text-danger'>*</span> </label>" +
                "<input type='text' class='form-control' name='salesperson2'  >" +
                "</div>" +
                "<div class='form-group col-md-6'>" +
                "<label for='vin'>Customer</label> " +
                "<input type='text' class='form-control' id='cust' name='cust' >" +
                "</div>" +
                "</div>";
            html += "<hr style='border: 1px solid red; margin-top: 10px; margin-bottom: 20px;'></hr>";

            html += "<input type='hidden' name='custpage_check_list_id' id='custpage_check_list_id' value='" + checkListId + "'/>";
            html += "<input type='hidden' name='custpage_total_section' id='custpage_total_section' value='" + HeadArray.length + "'/>";
            html +="<button type='submit' style='background-color: #ff5722; color: white;'>Submit</button>" ;
            html += "</form></div>";
            html += "</body></html>";


            context.response.write(html);
        }
        else if (context.request.method === 'POST') {


        }

    };

    return { onRequest };
});

