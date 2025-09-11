/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/redirect', 'N/log', 'N/search', 'N/email', 'N/runtime', 'N/url']
    , (serverWidget, record, redirect, log, search, email, runtime, url) => {
        const onRequest = (context) => {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: 'Approval Confirmation'
                });
                var Flag = context.request.parameters.custparam_flag;

                if (Flag == 2) { // Ankit for Approval VSA Special Discount

                    var action = context.request.parameters.custparam_action;
                    var RecordID = context.request.parameters.custparam_recid;
                    if (!RecordID || !action) {
                        context.response.write('Invalid or missing parameters.');
                        return;
                    }
                    const soRec = record.load({ type: 'salesorder', id: RecordID, isDynamic: true });
                    const discountStatus = soRec.getValue('custbody_package_approval_status');
                    const discountStatusText = soRec.getText('custbody_package_approval_status');
                    if (discountStatus === '2' || discountStatus === '3') {        // Approved Rejected
                        context.response.write(`VSA has already been ${discountStatusText}.`);
                        return;
                    }
                    addHiddenFieldsToForm(form, Flag, action, RecordID);
                    form.addField({
                        id: 'custpage_remark',
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'Remarks',
                    });
                    if (action === 'Reject') {
                        form.title = 'Reject Action';
                        form.addSubmitButton({ label: 'Reject' });
                    }
                    else if (action === 'Approve') {
                        form.title = 'Approve Action';
                        form.addSubmitButton({ label: 'Approve' });
                    }

                }
                if (Flag == 1) {

                    var rec_id = context.request.parameters.custparam_rec_id;

                    form.addField({
                        id: 'custpage_rec_id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'rec_id'
                    }).defaultValue = rec_id;
                    form.getField('custpage_rec_id').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                    form.addField({
                        id: 'custpage_info',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Info'
                    }).defaultValue = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <title>Eurokars Supersports Extended Test Drive Form</title>
                      <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
                      <link href="https://9908878-sb1.app.netsuite.com/core/media/media.nl?id=8163&c=9908878_SB1&h=1WdD_mbxCcHQ0mS1FAwr1wn4ZxxzKzYZtGePCeWiVWMotoyF&_xt=.css" rel="stylesheet">
                      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet">
                    </head>
                    <body>
                    <div class="container mt-3 form-wrapper">
                    
                    <form method="POST">
                    
                      <input type="hidden" name="custpage_demo" value="${''}" />
                     <div style="margin-top:20px;font-size:16px;font-weight:bold;">
                                  Signed by customer and sales consultant.<br>
                                  Do you want to approve as Sales Manager?
                                </div>
                    
                    <div class="row mt-4">
                      <div class="col-md-6">
                        <h3>Sales Manager's Signature <span style="color:red">*</span></h3>
                        <canvas id="signature-pad" width="400" height="200" style="border:1px solid #ccc; background:#f9f9f9;"></canvas>
                        <br/>
                        <button type="button" class="btn btn-sm btn-secondary mt-2" onclick="clearSignature('signature-pad', 'signature-data')">Clear</button>
                        <p class="mt-2">
                          <span style="text-decoration:underline; cursor:pointer;" onclick="setDrawMode('signature-pad')">draw</span> |
                          <span style="text-decoration:underline; cursor:pointer;" onclick="setTypeMode('signature-pad', 'signature-data')">type</span>
                        </p>
                        <input type="hidden" id="signature-data" name="signature_data" />
                      </div>
                    </div>
                    <br/>
                    <script>
                      function setupSignature(canvasId, inputId) {
                        const canvas = document.getElementById(canvasId);
                        const ctx = canvas.getContext('2d');
                        let drawing = false;
                    
                        canvas.addEventListener('mousedown', function (e) {
                          drawing = true;
                          ctx.beginPath();
                          ctx.moveTo(e.offsetX, e.offsetY);
                        });
                    
                        canvas.addEventListener('mousemove', function (e) {
                          if (drawing) {
                            ctx.lineTo(e.offsetX, e.offsetY);
                            ctx.stroke();
                          }
                        });
                    
                        canvas.addEventListener('mouseup', function () {
                          drawing = false;
                          document.getElementById(inputId).value = canvas.toDataURL();
                        });
                      }
                    
                      function clearSignature(canvasId, inputId) {
                        const canvas = document.getElementById(canvasId);
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        document.getElementById(inputId).value = '';
                      }
                    
                      function setDrawMode(canvasId) {
                        document.getElementById(canvasId).style.display = 'block';
                      }
                    
                      function setTypeMode(canvasId, inputId) {
                        const canvas = document.getElementById(canvasId);
                        const ctx = canvas.getContext('2d');
                        canvas.style.display = 'none';
                        let typedName = prompt("Type your name for the signature:");
                        if (typedName) {
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                          ctx.font = "20px Arial";
                          ctx.fillText(typedName, 10, 50);
                          document.getElementById(inputId).value = canvas.toDataURL();
                          canvas.style.display = 'block';
                        }
                      }
                    
                      setupSignature('signature-pad', 'signature-data');
                      setupSignature('signature-pad1', 'signature-data1');
                    </script>
                    
                    </form>
                    
                    </div>
                    </body>
                    </html>
                        `;

                    form.addSubmitButton({ label: 'Approve' });
                    form.addButton({
                        id: 'custpage_no',
                        label: 'Reject',
                        functionName: 'cancelApproval(' + rec_id + ')'
                    });

                    form.addField({
                        id: 'custpage_clientscript',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Client Script'
                    }).defaultValue = `
                      <script>
                        function cancelApproval() {
                          // Example: call same Suitelet with POST to update custom record
                          const form = document.createElement('form');
                          form.method = 'POST';
                          form.action = window.location.href;
                    
                          // hidden inputs to convey intent and record id
                          const actionInput = document.createElement('input');
                          actionInput.type = 'hidden';
                          actionInput.name = 'custpage_action';
                          actionInput.value = 'Reject';
                          form.appendChild(actionInput);
                    
                          const recIdInput = document.createElement('input');
                          recIdInput.type = 'hidden';
                          recIdInput.name = 'custpage_recid';
                          recIdInput.value = '${rec_id}'; // suitelet variable interpolated server-side
                          form.appendChild(recIdInput);
                    
                          document.body.appendChild(form);
                          form.submit();
                        }
                      </script>
                    `;

                    //   form.clientScriptModulePath = 'SuiteScripts/your_client_script.js'; // Add below
                }
                context.response.writePage(form);
            } else if (context.request.method === 'POST') {

                var flag = context.request.parameters.custparam_flag;
                var action = context.request.parameters.custparam_action;
                var RecordID = context.request.parameters.custparam_recid;
                var Record_Type = context.request.parameters.custparam_rectype;
                var Remarks = context.request.parameters.custpage_remark;
                
               if(!flag){
                var body = context.request.body;
                var data = JSON.parse(body);
                log.error('POST parameters', data);
                if (data) {
                    flag = data.custparam_flag;
                    RecordID = data.custparam_recid;
                }
               }
                log.error("flag", flag);

                if (flag == 2) { // Ankit for Approval VSA Special Discount
                     log.error("flag entered", flag);
                    const soRec = record.load({ type: 'salesorder', id: RecordID, isDynamic: true });
                    // Fetch fields
                    const discountStatus = soRec.getValue('custbody_package_approval_status');
                    const discountStatusText = soRec.getText('custbody_package_approval_status');
                    var currentLevel = parseInt(soRec.getValue('custbody_packg_current_level_apprv')) || 1;
                    var maxLevel = parseInt(soRec.getValue('custbody_package_max_approv_level')) || 1;
                    const currentApprover = soRec.getValue('custbody_package_current_approver');
                    var child_table = 'recmachcustrecord_transaction_';

                    if (action === 'Reject') {
                        soRec.setValue({ fieldId: 'custbody_package_approval_status', value: 3 }); // Rejected
                        soRec.setValue({ fieldId: 'custbody_package_next_approver', value: '' });
                        soRec.setValue({ fieldId: 'custbody_special_dis', value: 0.0 });
                        add_child_approval_record(soRec, child_table, RecordID, new Date(), currentApprover, currentLevel, Remarks);
                        soRec.save();
                        context.response.write('Discount has been rejected. Sales Order is unlocked.');
                        return;
                    }
                    else if (action === 'Approve') {
                        add_child_approval_record(soRec, child_table, RecordID, new Date(), currentApprover, currentLevel, Remarks);
                        if (currentLevel >= maxLevel) {
                            // Final approval
                            soRec.setValue({ fieldId: 'custbody_package_approval_status', value: 2 }); // Approved
                            soRec.setValue({ fieldId: 'custbody_packg_current_level_apprv', value: maxLevel });
                            soRec.setValue({ fieldId: 'custbody_package_next_approver', value: '' });
                            soRec.save();
                            context.response.write('Final approval complete. VSA is unlocked.');
                            return;
                        } else {
                            // Move to next level
                            var nextLevel = currentLevel + 1;
                            var Json_emailStup = GetEmailSetup_Approver();
                            var nextApproverId = '';
                            var currentApproverId = '';
                            var msg = '';

                            if (nextLevel == 2) {
                                currentApproverId = Json_emailStup.approverGM;
                                nextApproverId = (maxLevel >= 3) ? Json_emailStup.approverMD : '';
                                msg = 'Approved by ' + Json_emailStup.approverSM_Text + '. Approval request sent to ' + Json_emailStup.approverGM_Text;
                                send_email_for_approver(Json_emailStup, RecordID, Json_emailStup.approverGM_Text, currentApproverId);
                            } else if (nextLevel == 3) {
                                currentApproverId = Json_emailStup.approverMD;
                                msg = 'Approved by ' + Json_emailStup.approverGM_Text + '. Approval request sent to .' + Json_emailStup.approverMD_Text;
                                send_email_for_approver(Json_emailStup, RecordID, Json_emailStup.approverMD_Text, currentApproverId);
                            }
                            log.error('nextLevel', nextLevel + ' Json_emailStup ' + JSON.stringify({ Json_emailStup }));

                            soRec.setValue({ fieldId: 'custbody_packg_current_level_apprv', value: nextLevel });
                            soRec.setValue({ fieldId: 'custbody_package_current_approver', value: currentApproverId });
                            soRec.setValue({ fieldId: 'custbody_package_next_approver', value: nextApproverId }); // Set if you support preview
                            soRec.setValue({ fieldId: 'custbody_package_approval_status', value: 1 }); // In Progress
                            soRec.save();

                            context.response.write(msg);
                            return;
                        }

                    }

                } else if (data.custparam_flag == 3) {// Ankit for UPdate VSA from ROC Approval

                    if (RecordID) { // ROC record ID

                        var AdditionalDisItemID = 14818; // for Additional
                        var OptOutItemID = 14914;     // for CashinLieu

                        var customrecord_rocSearchObj = search.create({
                            type: "customrecord_roc",
                            filters:
                                [
                                    ["internalid", "anyof", RecordID]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord_orignal_net_selling_price", label: "Original Net Selling Price" }),
                                    search.createColumn({ name: "custrecord_revised_net_price", label: "Revised  Net Selling Price" }),
                                    search.createColumn({ name: "custrecord_vsa_roc", label: "Original VSA" }),
                                    search.createColumn({
                                        name: "name",
                                        join: "CUSTRECORD_ROC_HEADER",
                                        label: "Name"
                                    }),
                                    search.createColumn({
                                        name: "custrecord_roc_item_amount",
                                        join: "CUSTRECORD_ROC_HEADER",
                                        label: "Item Amount"
                                    }),
                                    search.createColumn({
                                        name: "custrecord_impact_line",
                                        join: "CUSTRECORD_ROC_HEADER",
                                        label: "Impact line"
                                    })
                                ]
                        });
                        var soId = null;
                        var impactMap = {};
                        var impactLine = '';
                        var searchResultCount = customrecord_rocSearchObj.runPaged().count;
                        log.debug("customrecord_rocSearchObj result count", searchResultCount);
                        customrecord_rocSearchObj.run().each(function (result) {

                            if (!soId) {
                                soId = result.getValue({ name: "custrecord_vsa_roc" });
                            }
                             impactLine = result.getValue({ name: "custrecord_impact_line", join: "CUSTRECORD_ROC_HEADER" });
                            var amount = parseFloat(result.getValue({ name: "custrecord_roc_item_amount", join: "CUSTRECORD_ROC_HEADER" })) || 0;

                            if (impactLine) {
                                if (!impactMap[impactLine]) {
                                    impactMap[impactLine] = 0;
                                }
                                impactMap[impactLine] += amount;
                            }

                            return true;
                        });



                        log.error("ROC Impact Lines", JSON.stringify(impactMap) + ' soId ' + soId);

                        if (soId) {
                            var soRec = record.load({ type: record.Type.SALES_ORDER, id: soId, isDynamic: true });
                            // Process each Impact Line
                            Object.keys(impactMap).forEach(function (line) {
                                var targetItem = (line === "Additional") ? AdditionalDisItemID : (line === "CashinLieu") ? OptOutItemID : null;
                                if (!targetItem) return;

                                var foundLine = -1;
                                var lineCount = soRec.getLineCount({ sublistId: "item" });

                                for (var i = 0; i < lineCount; i++) {
                                    var itemId = soRec.getSublistValue({ sublistId: "item", fieldId: "item", line: i });
                                    if (parseInt(itemId) === targetItem) {
                                        foundLine = i;
                                        break;
                                    }
                                }
                                if (foundLine > -1) {
                                    // Update existing line
                                    soRec.selectLine({ sublistId: "item", line: foundLine });
                                    var exit_amount = parseFloat(soRec.getCurrentSublistValue({sublistId: "item",fieldId: "rate"})) || 0;
                                    var new_rate = exit_amount + impactMap[impactLine];
                                    soRec.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: new_rate });
                                    soRec.commitLine({ sublistId: "item" });
                                } else {
                                    var InventoryType = '';
                                    if (itemId == AdditionalDisItemID) {
                                        InventoryType = 15;
                                    } else {
                                        InventoryType = 8;
                                    }
                                    // Add new line
                                    soRec.selectNewLine({ sublistId: "item" });
                                    soRec.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_advs_selected_inventory_type', value: InventoryType });
                                    soRec.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: targetItem });
                                    soRec.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: impactMap[line] });
                                    soRec.commitLine({ sublistId: "item" });
                                }
                            });

                            var soIdSaved = soRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                            log.error("Updated Sales Order", soIdSaved);
                            if (soIdSaved) {
                                record.submitFields({
                                    type: 'customrecord_roc',
                                    id: RecordID,
                                    values: {
                                        custrecord_vsa_updated: true // Approved
                                    }
                                });
                            }


                        }

                    }



                }
                else {

                    var action = context.request.parameters.custpage_action;
                    var recId = context.request.parameters.custpage_recid;
                    if (action === 'Reject' && recId) {
                        try {
                            record.submitFields({
                                type: 'customrecord_expression_of_interest', // replace with your custom record type
                                id: recId,
                                values: {
                                    custrecord_eoi_status: '10' // field you want to update
                                }
                            });
                            context.response.write('Rejected and updated.');
                        } catch (e) {
                            log.error('Update failed', e);
                            context.response.write('Error: ' + e.message);
                        }
                    }
                    else {
                        try {
                            var record_id = context.request.parameters.custpage_rec_id;


                            // Load and update record to mark "Approved"
                            record.submitFields({
                                type: 'customrecord_expression_of_interest',
                                id: record_id,
                                values: {
                                    custrecord_eoi_status: '4'
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: false
                                }
                            });

                            // Redirect or confirmation
                            context.response.write(`
                          <html><body>
                          <h3 style="color:green;">Approval Successful</h3>
                          <script>setTimeout(function(){ window.close(); }, 2000);</script>
                          </body></html>
                        `);
                        } catch (e) {
                            log.error('Error in approval', e.message);
                            context.response.write(`
                          <html><body>
                          <h3 style="color:red;">Error: ${e.message}</h3>
                          </body></html>
                        `);
                        }
                    }
                }
            }
        };

        function addHiddenFieldsToForm(form, Flag, action, RecordID) {
            form.addField({
                id: 'custparam_flag',
                type: serverWidget.FieldType.TEXT,
                label: 'Flag'
            }).defaultValue = Flag;
            form.getField('custparam_flag').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addField({
                id: 'custparam_action',
                type: serverWidget.FieldType.TEXT,
                label: 'Action'
            }).defaultValue = action;
            form.getField('custparam_action').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addField({
                id: 'custparam_recid',
                type: serverWidget.FieldType.TEXT,
                label: 'Record'
            }).defaultValue = RecordID;
            form.getField('custparam_recid').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        }

        function add_child_approval_record(rec, child_table, RecordID, date, approved_by, approved_level, remarks) {
            rec.selectNewLine({ sublistId: child_table });

            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecord_transaction_",
                value: RecordID
            });
            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecord_module",
                value: 1   // Vehicle
            });
            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecordapprover_date",
                value: date
            });
            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecord_approved_by",
                value: approved_by
            });
            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecord_approval_level_",
                value: approved_level
            });
            rec.setCurrentSublistValue({
                sublistId: child_table,
                fieldId: "custrecord_remarks_",
                value: remarks
            });
            rec.commitLine({ sublistId: child_table });
            // Remove Special Discouunt line

            var specialDiscountItemID = 14869;
            var lineCount = rec.getLineCount({ sublistId: 'item' });
            var foundLine = -1;

            for (var i = 0; i < lineCount; i++) {
                var itemId = rec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                if (parseInt(itemId) === specialDiscountItemID) {
                    foundLine = i;
                    break;
                }
            }
            if (foundLine !== -1) {
                rec.removeLine({ sublistId: 'item', line: foundLine });
            }
        }

        function send_email_for_approver(JsonEmail, SO_ID, approver_name, approver_id) {

            var Customer = '';
            var ModelText = '';
            var SpecialDis = '';
            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid", "anyof", SO_ID],
                        "AND",
                        ["custcol_advs_selected_inventory_type", "anyof", "1"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entity" }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "custcol_advs_selected_inventory_type", label: "Selected Inventory Type" }),
                        search.createColumn({ name: "custbody_special_dis" }),

                    ]
            });
            var searchResultCount = transactionSearchObj.runPaged().count;
            log.debug("transactionSearchObj result count", searchResultCount);
            if (searchResultCount > 0) {
                transactionSearchObj.run().each(function (result) {

                    var ModelId = result.getValue({ name: "item" });
                    ModelText = result.getText({ name: "item" });
                    Customer = result.getText({ name: "entity" });
                    SpecialDis = result.getValue({ name: "custbody_special_dis" });

                    return false;
                });
            }

            var subject = JsonEmail.smEmailSubject;
            var body = JsonEmail.smEmailBody;
            var sender = JsonEmail.sender;

            var EmailUrl = url.resolveScript({
                deploymentId: 'customdeploy_advs_ssvg_eoi_sm_approve',
                scriptId: 'customscript_advs_eoi_sm_approve',
                returnExternalUrl: true

            });

            var ApproveURL = "&custparam_recid=" + SO_ID + "&custparam_action=Approve&custparam_flag=2";
            var RejectURL = "&custparam_recid=" + SO_ID + "&custparam_action=Reject&custparam_flag=2";

            body += "<br/><br/><br/><p>Please review.</p>" +
                "<html><head></head><body>" +
                "<a href=\"" + EmailUrl + ApproveURL + "\" " +
                "style=\"display:inline-block;padding:10px 20px;margin:5px;font-size:14px;" +
                "color:#fff;background-color:#34ab56;border-radius:5px;text-decoration:none;font-family:sans-serif;\">" +
                "Approve</a>" +
                "&nbsp;&nbsp;&nbsp;" +
                "<a href=\"" + EmailUrl + RejectURL + "\" " +
                "style=\"display:inline-block;padding:10px 20px;margin:5px;font-size:14px;" +
                "color:#fff;background-color:#e76f51;border-radius:5px;text-decoration:none;font-family:sans-serif;\">" +
                "Reject</a>" +
                "</body></html>";

            subject = subject.replace('@CustomerName@', Customer);
            body = body.replace('@approver@', approver_name);
            body = body.replace('@CustomerName@', Customer);
            body = body.replace('@Model@', ModelText);
            body = body.replace('@discount@', '$' + SpecialDis);

            var approverSMEmail = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: approver_id,
                columns: ['email']
            }).email;

            log.error('approverSMEmail ', approverSMEmail + ' approver_id ' + approver_id);

            email.send({
                author: sender,
                recipients: approverSMEmail,
                subject: subject,
                body: body,
            });
            log.error('Email sent to ', approverSMEmail);
        }

        function GetEmailSetup_Approver() {
            var setupData = {};
            const searchObj = search.create({
                type: "customrecord_advs_pa_pdi_email_app_setup",
                filters: [
                    ["isinactive", "is", "F"],
                    "AND",
                    ["custrecord_advs_pa_pdi_module", "anyof", "1"]
                ],
                columns: [
                    "internalid",
                    "custrecord_package_approver_subject",
                    "custrecord_package_approver_body",
                    "custrecord_packg_approver_sm",
                    "custrecord_package_approver_gm",
                    "custrecord_package_approver_md",
                    "custrecord_sender_special_discount"

                ]
            });

            var emailBody = '', emailSubject = '';
            searchObj.run().each(function (result) {

                emailBody = result.getValue("custrecord_package_approver_body");
                emailSubject = result.getValue("custrecord_package_approver_subject");
                approverSM = result.getValue("custrecord_packg_approver_sm");
                approverSM_Text = result.getText("custrecord_packg_approver_sm");
                approverGM = result.getValue("custrecord_package_approver_gm");
                approverGM_Text = result.getText("custrecord_package_approver_gm");
                approverMD = result.getValue("custrecord_package_approver_md");
                approverMD_Text = result.getText("custrecord_package_approver_md");
                sender = result.getValue("custrecord_sender_special_discount");
                return false;
            });

            setupData.smEmailBody = emailBody;
            setupData.smEmailSubject = emailSubject;
            setupData.approverSM = approverSM;
            setupData.approverSM_Text = approverSM_Text;
            setupData.approverGM = approverGM;
            setupData.approverGM_Text = approverGM_Text;
            setupData.approverMD = approverMD;
            setupData.approverMD_Text = approverMD_Text;
            setupData.sender = sender;

            return setupData;
        };
        return { onRequest };

    });