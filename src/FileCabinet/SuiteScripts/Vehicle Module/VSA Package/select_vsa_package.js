/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log', 'N/redirect', 'N/email', 'N/url', 'N/runtime'],
    function (serverWidget, search, record, log, redirect, email, url, runtime) {
        function onRequest(context) {
            if (context.request.method === 'GET') {

                //var form = serverWidget.createForm({ title: 'Package', hideNavBar: true });

                //form.clientScriptModulePath = 'SuiteScripts/Vehicle Module/VSA Package/validation_on_packg_item.js';
                var parentOPC = '';
                var parentSpecialdisSM = '';
                var parentSpecialdisGM = '';
                var parentSpecialdisMD = '';
                var html = "";

                var ModelId = '';
                var ModelText = '';
                var lineNum = '';
                var SelectedPckgHeadID = '';
                var Customer = '';
                var Parent_Pckg_ID = '';


                var recordId = context.request.parameters.custparam_record_id;
                var transactionType = context.request.parameters.custparam_record_type;

                if (!recordId) {
                    html += "<div style='color:red; font-weight:bold; font-size:14px; margin-top:15px;'>Missing " + transactionType + " Record ID</div>";
                    context.response.write(html);
                    return;
                }

                var transactionSearchObj = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["internalid", "anyof", recordId],
                            "AND",
                            ["custcol_advs_selected_inventory_type", "anyof", "1"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "entity" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "custcol_advs_selected_inventory_type", label: "Selected Inventory Type" }),
                            search.createColumn({ name: "line", label: "Line ID" }),
                            search.createColumn({ name: "custcol_package_head", label: "Package Head" })
                        ]
                });
                var searchResultCount = transactionSearchObj.runPaged().count;
                log.debug("transactionSearchObj result count", searchResultCount);
                if (searchResultCount > 0) {
                    transactionSearchObj.run().each(function (result) {

                        ModelId = result.getValue({ name: "item" });
                        ModelText = result.getText({ name: "item" });
                        var LineNum = result.getValue({ name: "line" });
                        lineNum = parseInt(LineNum) - 1;
                        SelectedPckgHeadID = result.getValue({ name: "custcol_package_head" });
                        Customer = result.getText({ name: "entity" });

                        return false;
                    });
                } else {
                    html += "<div style='color:red; font-weight:bold; font-size:14px; margin-top:15px;'>No Model Line Found</div>";
                    context.response.write(html);
                    return;

                }

                // Get all available Colour
                var colorMap = {};
                var customrecord_advs_vmSearchObj = search.create({
                    type: "customrecord_advs_vm",
                    filters:
                        [
                            ["custrecord_st_v_m_model_variant", "anyof", ModelId],
                            "AND",
                            ["custrecord_advs_vm_reservation_status", "anyof", "3"],
                            "AND",
                            ["custrecord_advs_vm_vehicle_status", "anyof", "1"],
                            "AND",
                            ['isinactive', 'is', 'F'],
                            "AND",
                            ["custrecord_advs_st_sales_ord_link", "anyof", "@NONE@"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "name", label: "Name" }),
                            search.createColumn({ name: "custrecord_advs_vm_exterior_color", label: "Exterior Color" }),
                            search.createColumn({
                                name: "custrecord_advs_m_o_o_price",
                                join: "CUSTRECORD_ADVS_VM_EXTERIOR_COLOR",
                                label: "Top Amount"
                            })
                        ]
                });
                var searchResultCount = customrecord_advs_vmSearchObj.runPaged().count;
                log.debug("customrecord_advs_vmSearchObj result count", searchResultCount);
                customrecord_advs_vmSearchObj.run().each(function (result) {

                    var color = result.getText({ name: "custrecord_advs_vm_exterior_color" }) || '';
                    var colorId = result.getValue({ name: "custrecord_advs_vm_exterior_color" }) || '';
                    var topAmount = result.getValue({
                        name: "custrecord_advs_m_o_o_price",
                        join: "CUSTRECORD_ADVS_VM_EXTERIOR_COLOR"
                    }) || 0;

                    var key = color + '|' + colorId;

                    if (!colorMap[key]) {
                        colorMap[key] = {
                            exteriorColor: color,
                            topAmount: topAmount,
                            internalId: colorId,
                            count: 1
                        };
                    } else {
                        colorMap[key].count++;
                    }

                    return true;
                });

                log.debug("colorMap", JSON.stringify(colorMap));
                var summarizedColors = [];
                if (colorMap) {
                    for (var k in colorMap) {
                        if (colorMap.hasOwnProperty(k)) {
                            summarizedColors.push(colorMap[k]);
                        }
                    }
                }

                html += "<!DOCTYPE html>" +
                    "<html>" +
                    "<head>" +
                    "<meta charset='UTF-8'>" +
                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                    "<title>Select Package For Model " + ModelText + "</title>" +
                    //"<link href='https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css' rel='stylesheet'>" +
                    "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>" +
                    "<link href='https://9908878-sb1.app.netsuite.com/core/media/media.nl?id=8163&c=9908878_SB1&h=1WdD_mbxCcHQ0mS1FAwr1wn4ZxxzKzYZtGePCeWiVWMotoyF&_xt=.css' rel='stylesheet'>" +
                    "<link href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css' rel='stylesheet'>" +
                    "<script src='https://code.jquery.com/jquery-3.6.0.min.js'></script>" +
                    "<link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>" +
                    "<script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'></script>" +

                    "</head>" +
                    "<body>";


                html += "<div class='container mt-5'>" +
                    "<div class='header fade-in'>" +
                    "<h3 id='titleText' class='text-center mt-3' style='color: #000000;'>Select Package For Model " + ModelText + "</h3>";
                " <div class='header-actions'>";
                html += "<div id='bottomButtons' style='margin-top: 20px; display: flex; gap: 10px; align-items: center;'>" +
                    "<button id='btnsubmit' type='submit' class='btn btn-primary' onclick='submitPackage()' style='display:none; width:auto;'>SUBMIT</button>" +
                    "<button id='btnback' class='btn btn-secondary' onclick='showTable()'  style='display:none;'>BACK</button>" +
                    "<button class='btn btn-danger' onclick='window.close()' style='margin-left:auto;'>CANCEL</button>" +
                    "</div>" +
                    "</div>" +
                    "</div>" +
                    "</div>";

                //Table for Avail Colour
                html += "<div id='availColourTable' class='container mt-5'style='display:none;'>" +
                    "<div class='header fade-in'>" +
                    "<table class='table table-bordered'>" +
                    "<thead class='thead-light'>" +
                    "<tr >" +
                    "<th>Available Colour</th>" +
                    "<th>Top Up</th>" +
                    "<th>In Stock</th>" +
                    "<th>Count</th>" +
                    "<th>Select</th>" +
                    "</tr>" +
                    "</thead>" +
                    "<tbody>";
                summarizedColors.forEach(function (item) {
                    html += "<tr>" +
                        "<td>" + item.exteriorColor + "</td>" +
                        "<td>" + item.topAmount + "</td>" +
                        "<td>" + item.internalId + "</td>" +
                        "<td>" + item.count + "</td>" +
                        "<td><input type='radio' name='colorSelect' onchange='updateColourTopUpAmount(" + item.topAmount + ")'></td>" +
                        "</tr>";
                });

                html += "</tbody></table></div></div>";



                html += "<div class='container mt-3 form-wrapper'>" +
                    "<form id='packageForm'>";

                html += "<nav>" +
                    "<div id='tabNavWrapper' class=' fade-in' style='display: none;'>" +
                    "<div class=\"tabs\" id=\"nav-tab\" role=\"tablist\">" +
                    "<button class=\"tab active\" id=\"nav-home-tab\" data-bs-toggle=\"tab\" data-bs-target=\"#nav-home\" type=\"button\" role=\"tab\" aria-controls=\"nav-home\" aria-selected=\"true\" > 📦 Package Items</button>" +
                    "<button class=\"tab\" id=\"nav-finance-tab\" data-bs-toggle=\"tab\" data-bs-target=\"#nav-finance\" type=\"button\" role=\"tab\" aria-controls=\"nav-finance\" aria-selected=\"false\"> 💰 Finance</button>" +
                    "<button class=\"tab\" id=\"nav-insurance-tab\" data-bs-toggle=\"tab\" data-bs-target=\"#nav-insurance\" type=\"button\" role=\"tab\" aria-controls=\"nav-insurance\" aria-selected=\"false\"> 🛡️ Insurance</button>" +
                    "<button class=\"tab\" id=\"nav-configurator-tab\" data-bs-toggle=\"tab\" data-bs-target=\"#nav-configurator\" type=\"button\" role=\"tab\" aria-controls=\"nav-configurator\" aria-selected=\"false\"> ⚙️ Configurator</button>" +
                    "</div>" +
                    "</div>" +
                    "</nav>" +

                    //Tab Main DIV
                    "<div class=\"tab-content border border-top-0 bg-white p-3\" id=\"nav-tabContent\">" +
                    //First Tab DIv
                    "<div class=\"tab-pane fade show active\" id=\"nav-home\" role=\"tabpanel\" aria-labelledby=\"nav-home-tab\">";

                html += "<table class='vehicle-table'>" +
                    "<thead>" +
                    "<tr>" +
                    "<th>Package Name</th>" +
                    "<th>List Price (SGD)</th>" +
                    "<th></th>" +
                    "</tr>" +
                    "</thead>" +
                    "<tbody>";

                var parentArray = [];
                var childObject = {};
                var child_config = {};
                // Get Packages and Item Details
                var customrecord_vsa_packageSearchObj = search.create({
                    type: "customrecord_vsa_package",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custrecord_variant_vsa_pckg", "anyof", ModelId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "name", label: "Name" }),
                            search.createColumn({ name: "custrecord_list_price", label: "List Price" }),
                            search.createColumn({ name: "custrecord_model_vsa_pckg", label: "Model" }),
                            search.createColumn({ name: "custrecord_pckg_dis", label: "Package Description" }),
                            search.createColumn({ name: "custrecord_no_coe_bids" }),
                            search.createColumn({ name: "custrecord_non_gurante_coe_discount" }),
                            search.createColumn({ name: "custrecord_finance_rebate_pckg" }),
                            search.createColumn({ name: "custrecord_opc_dis" }),
                            search.createColumn({ name: "custrecord_spcl_dis_sm" }),
                            search.createColumn({ name: "custrecord_spcl_dis_gm" }),
                            search.createColumn({ name: "custrecord_spcl_dis_md" }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTRECORD_MASTER_PACKG",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_MASTER_PACKG"
                            }),
                            search.createColumn({
                                name: "custrecord_pckg_item_type",
                                join: "CUSTRECORD_MASTER_PACKG",
                                label: "Package Item Type"
                            }),
                            search.createColumn({
                                name: "custrecord_pckg_iem_cost_group",
                                join: "CUSTRECORD_MASTER_PACKG"
                            }),
                            search.createColumn({
                                name: "custrecord_pckg_item_cost",
                                join: "CUSTRECORD_MASTER_PACKG"
                            }),
                            search.createColumn({
                                name: "custrecord_include_price_list",
                                join: "CUSTRECORD_MASTER_PACKG"
                            }),
                            search.createColumn({
                                name: "custrecord_code",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD",
                                label: "Code"
                            }),
                            search.createColumn({
                                name: "custrecord_package_config_category",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            }),
                            search.createColumn({
                                name: "custrecord_features_sub_catogory",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            }),
                            search.createColumn({
                                name: "custrecord_amount",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            }),
                            search.createColumn({
                                name: "custrecord_free_of_cost",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            }),
                            search.createColumn({
                                name: "name",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "CUSTRECORD_PACKAGE_MASTER_HEAD"
                            })
                        ]
                });
                var searchResultCount = customrecord_vsa_packageSearchObj.runPaged().count;
                log.debug("customrecord_vsa_packageSearchObj result count", searchResultCount + " model id " + ModelId + " SelectedPckgHeadID " + SelectedPckgHeadID + " recordId " + recordId + " TransactionType " + transactionType);
                if (searchResultCount === 0) {
                    html += "<p style='color: red; font-weight: bold;'>No Package found for selected Model: " + ModelText + "</p>";
                    context.response.write(html);
                    return;
                }
                var Unique_Child_item = {};
                var Unique_Child_Config = {};
                var categoryMap = {};
                customrecord_vsa_packageSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    const pckName = result.getValue({ name: "name" });
                    var parentId = result.getValue({ name: 'internalid' });
                    var parentListPrice = result.getValue({ name: 'custrecord_list_price' }) || 0;
                    var parentCOEBids = result.getValue({ name: 'custrecord_no_coe_bids' });
                    var parentNonGurnteDisL = result.getValue({ name: 'custrecord_non_gurante_coe_discount' });
                    var parentFinanceRebate = result.getValue({ name: 'custrecord_finance_rebate_pckg' });
                    parentSpecialdisSM = result.getValue({ name: 'custrecord_spcl_dis_sm' });
                    parentSpecialdisGM = result.getValue({ name: 'custrecord_spcl_dis_gm' });
                    parentSpecialdisMD = result.getValue({ name: 'custrecord_spcl_dis_md' });
                    parentOPC = result.getValue({ name: 'custrecord_opc_dis' });
                    var chldName = result.getValue({ name: "name", join: "CUSTRECORD_MASTER_PACKG" });
                    var chlditemType = result.getValue({ name: "custrecord_pckg_item_type", join: "CUSTRECORD_MASTER_PACKG" });
                    var childCostGroup = result.getValue({ name: "custrecord_pckg_iem_cost_group", join: "CUSTRECORD_MASTER_PACKG" });
                    var childCostGroupText = result.getText({ name: "custrecord_pckg_iem_cost_group", join: "CUSTRECORD_MASTER_PACKG" });
                    var childCost = result.getValue({ name: "custrecord_pckg_item_cost", join: "CUSTRECORD_MASTER_PACKG" });
                    var childInternalID = result.getValue({ name: "internalid", join: "CUSTRECORD_MASTER_PACKG" });
                    var childInclidePrice = result.getValue({ name: "custrecord_include_price_list", join: "CUSTRECORD_MASTER_PACKG" });
                    //Configuration
                    var child_Config_name = result.getValue({ name: "name", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_internalid = result.getValue({ name: "internalid", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_category = result.getValue({ name: "custrecord_package_config_category", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_categoryText = result.getText({ name: "custrecord_package_config_category", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_subcategory_features = result.getValue({ name: "custrecord_features_sub_catogory", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_subcategory_featuresText = result.getText({ name: "custrecord_features_sub_catogory", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_amount = result.getValue({ name: "custrecord_amount", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_foc = result.getValue({ name: "custrecord_free_of_cost", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });
                    var child_Config_code = result.getValue({ name: "custrecord_code", join: "CUSTRECORD_PACKAGE_MASTER_HEAD" });

                    if (parentArray.indexOf(parentId) == -1) {
                        parentArray.push(parentId);

                        html +=
                            "<tr>" +
                            "<td>" + pckName + "</td>" +
                            "<td class='option-price' id='parentListPriceCell'>" + parentListPrice + "</td>" +
                            "<td><button class='btn btn-select' type='button' onclick='showDetails(\"" + pckName + "\", \"" + parentId + "\", \"" + parentListPrice + "\", \"" + parentNonGurnteDisL + "\", \"" + parentFinanceRebate + "\", \"" + parentSpecialdisSM + "\", \"" + parentSpecialdisGM + "\", \"" + parentSpecialdisMD + "\", \"" + parentOPC + "\")'>Select</button></td>" +
                            "</tr>";
                    }
                    if (childInternalID) {
                        if (!childObject[parentId]) {
                            childObject[parentId] = {};
                        }
                        if (!childObject[parentId][childCostGroupText]) {
                            childObject[parentId][childCostGroupText] = [];
                        }
                        if (!Unique_Child_item[childInternalID]) {
                            Unique_Child_item[childInternalID] = true;
                            childObject[parentId][childCostGroupText].push({
                                parentId: parentId,
                                childName: chldName,
                                chlditemType: chlditemType,
                                childCostGroup: childCostGroup,
                                childCostGroupText: childCostGroupText,
                                childCost: childCost,
                                childIncludePrice: childInclidePrice
                            });
                        }
                    }
                    //Configuration
                    if (child_Config_internalid) {

                        if (!child_config[parentId]) {
                            child_config[parentId] = {};
                        }

                        if (!child_config[parentId][child_Config_category]) {
                            child_config[parentId][child_Config_category] = {};
                        }

                        if (!child_config[parentId][child_Config_category][child_Config_subcategory_featuresText]) {
                            child_config[parentId][child_Config_category][child_Config_subcategory_featuresText] = [];
                        }
                        if (!Unique_Child_Config[child_Config_internalid]) {
                            Unique_Child_Config[child_Config_internalid] = true;
                            child_config[parentId][child_Config_category][child_Config_subcategory_featuresText].push({
                                parentId: parentId,
                                child_Config_name: child_Config_name,
                                child_Config_internalid: child_Config_internalid,
                                child_Config_category: child_Config_category,
                                child_Config_categoryText: child_Config_categoryText,
                                child_Config_subcategory_features: child_Config_subcategory_features,
                                child_Config_subcategory_featuresText: child_Config_subcategory_featuresText,
                                child_Config_amount: child_Config_amount,
                                child_Config_foc: child_Config_foc,
                                child_Config_code: child_Config_code
                            });
                            if (!categoryMap[parentId]) {
                                categoryMap[parentId] = {};
                            }
                            if (!categoryMap[parentId][child_Config_categoryText]) {
                                categoryMap[parentId][child_Config_categoryText] = child_Config_category;
                            }
                        }
                    }

                    return true;
                });

                log.debug("child  Table", JSON.stringify(childObject));
                log.debug("child Config  Table", JSON.stringify(child_config));
                // Insurance Subsidy Rate 
                var insuranceRate = [];
                var itemSearch = search.create({
                    type: 'customrecord_insurance_susidy_rate',
                    filters: [['isinactive', 'is', 'F']],
                    columns: [search.createColumn({ name: 'custrecord_insurance_period', sort: search.Sort.ASC }), 'custrecord_insurance_susidy_amount', 'custrecord_insurance_company', 'custrecord_advs_insurance_com']
                });
                itemSearch.run().each(function (result) {
                    insuranceRate.push({
                        InsuranePeriodID: result.getValue('custrecord_insurance_period'),
                        InsuranePeriodText: result.getText('custrecord_insurance_period'),
                        InsuraneAmount: parseFloat(result.getValue('custrecord_insurance_susidy_amount')),
                        InsuraneComAIGText: result.getText('custrecord_advs_insurance_com'),
                        InsuraneComAIGId: result.getValue('custrecord_advs_insurance_com'),
                        InsuranceCompany: result.getValue('custrecord_insurance_company')

                    });
                    return true;
                });
                // Finance Record data 
                var financerate = [];
                var itemSearch = search.create({
                    type: 'customrecord_finance_rate',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['custrecord_bank_frate', 'custrecord_bank_package_frate', 'custrecord_finance_term',
                        'custrecord_sdate_frate', 'custrecord_edate_frate', 'custrecord_company_frate', 'custrecord_finance_loan_min',
                        'custrecord_finance_loan_max', 'custrecord_finance_interest_rate', 'custrecord_finance_rebate'
                    ]
                });
                itemSearch.run().each(function (result) {
                    financerate.push({
                        BankPckgID: result.getValue('custrecord_bank_package_frate'),
                        BankPckgText: result.getText('custrecord_bank_package_frate'),
                        FianceMinLoan: result.getValue('custrecord_finance_loan_min') || 0,
                        FianceMaxLoan: result.getValue('custrecord_finance_loan_max') || 0,
                        FinancetermID: result.getValue('custrecord_finance_term'),
                        FinancetermText: result.getText('custrecord_finance_term'),
                        FinanceEnddate: result.getValue('custrecord_edate_frate'),
                        FinanceRebate: result.getValue('custrecord_finance_rebate'),
                        FinanceIntrate: result.getValue('custrecord_finance_interest_rate')
                    });
                    return true;
                });


                //Load already created/Selected Package -------------------
                var totalAddtion_amntObject = {};
                var childItemsPrefill = {};
                var child_Pckg_config_Prefill = {};
                if (SelectedPckgHeadID) {

                    var lookupResult = search.lookupFields({
                        type: 'customrecord_save_vsa_package',
                        id: SelectedPckgHeadID, // record ID
                        columns: ['custrecord_selected_total_amount', 'custrecord_select_package', 'custrecord_save_addtional_amount',
                            'custrecord_selected_finance_rebate', 'custrecord_selected_loan_term', 'custrecord_selected_bank_packg',
                            'custrecord_selected_loan_amount', 'custrecord_selected_insurance_rebate', 'custrecord_selected_insurance_period',
                            'custrecord_selected_scwd', 'custrecord_selected_opc_dis', 'custrecord_selected_config_amount']
                    });
                    log.emergency("lookupResult", JSON.stringify(lookupResult));
                    var totalAmountprefill = lookupResult.custrecord_selected_total_amount;
                    var selectdPckgID = lookupResult.custrecord_select_package && lookupResult.custrecord_select_package.length > 0
                        ? lookupResult.custrecord_select_package[0].value
                        : '';

                    var selectedAddtional = lookupResult.custrecord_save_addtional_amount;
                    var preFinance_rebate = lookupResult.custrecord_selected_finance_rebate;

                    var preFinance_loanTerm = (
                        lookupResult.custrecord_selected_loan_term &&
                        lookupResult.custrecord_selected_loan_term[0]
                    ) ? lookupResult.custrecord_selected_loan_term[0].value : '';

                    var preFinance_bankpackg = (
                        lookupResult.custrecord_selected_bank_packg &&
                        lookupResult.custrecord_selected_bank_packg[0]
                    ) ? lookupResult.custrecord_selected_bank_packg[0].value : '';

                    var preFinance_loanAmount = lookupResult.custrecord_selected_loan_amount;
                    var preInsurance_Rebate = lookupResult.custrecord_selected_insurance_rebate;

                    var preInsurance_Period = (
                        lookupResult.custrecord_selected_insurance_period &&
                        lookupResult.custrecord_selected_insurance_period[0]
                    ) ? lookupResult.custrecord_selected_insurance_period[0].value : '';

                    var preFinance_SCWD = lookupResult.custrecord_selected_scwd;
                    var preFinance_OPC = lookupResult.custrecord_selected_opc_dis;
                    var preFinance_ConfigAmount = lookupResult.custrecord_selected_config_amount;

                    if (selectdPckgID) {

                        if (!totalAddtion_amntObject[selectdPckgID]) {
                            totalAddtion_amntObject[selectdPckgID] = [];
                        }
                        totalAddtion_amntObject[selectdPckgID].push({
                            totalAmountprefill: totalAmountprefill,
                            selectedAddtionalprefill: selectedAddtional,
                            preFinance_rebate: preFinance_rebate,
                            preFinance_loanTerm: preFinance_loanTerm,
                            preFinance_bankpackg: preFinance_bankpackg,
                            preFinance_loanAmount: preFinance_loanAmount,
                            preInsurance_Rebate: preInsurance_Rebate,
                            preInsurance_Period: preInsurance_Period,
                            preFinance_SCWD: preFinance_SCWD,
                            preFinance_OPC: preFinance_OPC,
                            preFinance_ConfigAmount: preFinance_ConfigAmount

                        });
                        log.debug("totalAddtion_amntObject_Prefill", JSON.stringify(totalAddtion_amntObject));
                    }

                    // Load child items
                    var itemSearch = search.create({
                        type: 'customrecord_save_vsa_package_item',
                        filters: [['custrecord_parent_package_head', 'is', SelectedPckgHeadID]],
                        columns: ['name', 'custrecord_save_item_cost_group', 'custrecord_save_item_cost', 'custrecord_package_item_isselected']
                    });
                    itemSearch.run().each(function (result) {

                        if (selectdPckgID) {

                            if (!childItemsPrefill[selectdPckgID]) {
                                childItemsPrefill[selectdPckgID] = [];
                            }
                            childItemsPrefill[selectdPckgID].push({
                                item_name: result.getValue('name'),
                                costgroup: parseFloat(result.getValue('custrecord_save_item_cost_group')),
                                cost: parseFloat(result.getValue('custrecord_save_item_cost')),
                                is_selected: result.getValue('custrecord_package_item_isselected')
                            });

                        }
                        return true;
                    });
                    log.debug("childItems_Prefill", JSON.stringify(childItemsPrefill));

                    //Load Prefill  Package Configuration Data

                    var itemSearch = search.create({
                        type: 'customrecord_selected_child_pckg_coonfig',
                        filters: [['custrecord_parent_package_head_config', 'is', SelectedPckgHeadID]],
                        columns: ['name', 'custrecord_selected_configtab_id', 'custrecord_selected_config_cate', 'custrecord_selected_features', 'custrecord_selected_code']
                    });
                    itemSearch.run().each(function (result) {

                        if (selectdPckgID) {

                            if (!child_Pckg_config_Prefill[selectdPckgID]) {
                                child_Pckg_config_Prefill[selectdPckgID] = [];
                            }
                            child_Pckg_config_Prefill[selectdPckgID].push({
                                config_name: result.getValue('name'),
                                config_category: result.getValue('custrecord_selected_config_cate'),
                                config_features: result.getValue('custrecord_selected_features'),
                                config_code: result.getValue('custrecord_selected_code'),
                                config_selected_tab_id: result.getValue('custrecord_selected_configtab_id')
                            });

                        }
                        return true;
                    });
                    log.debug("child_Pckg_config_Prefill", JSON.stringify(child_Pckg_config_Prefill));
                }

                html += "</tbody></table>" +
                    "<div id='detailsSection' class='fade-in' style='display:none;'></div>" +
                    "</form></div>";

                //----------------Script start added logic---------------------

                html += "<script>";
                html += "const toggledItems = {};";
                html += "var child_Object = " + JSON.stringify(childObject) + ";";

                html += "var prefill_MainValues = " + JSON.stringify(totalAddtion_amntObject) + ";";
                html += "var insurance_Object = " + JSON.stringify(insuranceRate) + ";";
                html += "var childItemsPrefill = " + JSON.stringify(childItemsPrefill) + ";";
                html += "var lineNum = " + lineNum + ";";
                html += "var ModelId = " + ModelId + ";";
                html += "var ModelText = '" + ModelText.replace(/'/g, "\\'") + "';\n";
                html += "var Customer = " + JSON.stringify(Customer) + ";";

                html += "var transtype = " + JSON.stringify(transactionType) + ";";
                html += "var SOrecordId = " + recordId + ";";
                html += "var isPrefilled = " + (SelectedPckgHeadID ? "true" : "false") + ";";
                html += "var SelectedPckgHeadID = '" + SelectedPckgHeadID + "';";
                html += "var OpcdDiscount = '';";


                html += "var financerate = " + JSON.stringify(financerate) + ";";

                html += "const categoryMap = {exterior: '2',interior: '3'};";

                html += "  var itemDataNew = [];";
                html += "  var itemData_Option_config = [];";
                html += "  var last_InsuranceAmount =0.00;";
                html += "  var last_FinanceAmount =0.00;";

                // Escape HTML to prevent XSS
                html += "function escapeHtml(str) {";
                html += "var div = document.createElement('div');";
                html += "div.textContent = str;";
                html += "return div.innerHTML;";
                html += "}";
                // Click on Select Package Button
                html += "function showDetails(pckgName, parentId,listprice,coedisL,financeRebate,spclDisSM,spclDisGM,spclDisMD,opcDis) {";
                html += '  console.log("showDetails triggered", {pckgName, parentId});';
                html += "  Parent_Pckg_ID = parentId;";
                html += "  var prefillAddtinalCost = 0;";
                html += "  var selectedAddtionalprefill = 0;";
                html += "  last_FinanceAmount = financeRebate;";
                html += "document.getElementById('hidden_packageid').value = parentId;";
                html += "var prefillChildItems = childItemsPrefill[parentId] || [];";
                html += "  parentSpecialdisSM = spclDisSM;";
                html += "  parentSpecialdisGM = spclDisGM;";
                html += "  parentSpecialdisMD = spclDisMD;";

                html += "  OpcdDiscount = opcDis;";

                //Show/Hide other tables 
                html += "document.getElementById('availColourTable').style.display = 'block';";
                html += "document.getElementById('tabNavWrapper').style.display = 'block';";
                html += "document.getElementById('packgOption').style.display = 'block';";
                html += "var table = document.querySelector('.vehicle-table');";
                html += "if (table) table.style.display = 'none';";
                html += "var detailsSection = document.getElementById('detailsSection');";
                html += "if (detailsSection) detailsSection.style.display = 'block';";
                html += "var totaltable = document.getElementById('totaltable');";
                html += "if (totaltable) totaltable.style.display = 'block';";
                html += "var titleText = document.getElementById('titleText');";
                html += "if (titleText) titleText.textContent = escapeHtml(pckgName);";
                html += "document.getElementById('btnback').style.display = 'inline-block';";
                html += "document.getElementById('btnsubmit').style.display = 'inline-block';";
                html += "var container = document.getElementById('detailsSection');";
                html += "if (!container) {console.error('dynamicContent element not found'); return; }";
                html += "container.innerHTML = '';";
                //Updating Pckage Amount // Prefill Amount 
                html += "const packageAmount = document.getElementById('packageAmount');";
                html += "packageAmount.innerText = Number(listprice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });";
                // Option Base Price
                html += "const baseprice = document.getElementById('baseprice');";
                html += "baseprice.innerText = Number(listprice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });" +

                    "const nongaurnateelamnt = document.getElementById('nongaurnateelamnt');" +
                    "nongaurnateelamnt.innerText = coedisL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });" +
                    "const totalAmount = document.getElementById('totalAmount');" +
                    "const addtionalAmount = document.getElementById('addtionalAmount');";
                html += "  totalAmount.innerText = Number(listprice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                // Set Main Prefill value
                html += "if (isPrefilled) {";
                html += "  var amnt_addtiona_data_arr = prefill_MainValues[parentId];";
                html += "  if (amnt_addtiona_data_arr && amnt_addtiona_data_arr.length > 0) {";
                html += "    var data = amnt_addtiona_data_arr[0];";
                html += "    prefillAddtinalCost = Number(data.totalAmountprefill);";
                html += "    selectedAddtionalprefill = Number(data.selectedAddtionalprefill);";
                html += "    totalAmount.innerText = prefillAddtinalCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                html += "    addtionalAmount.innerText = selectedAddtionalprefill.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                // SCWD prefill
                html += "    var scwdInput = document.getElementById('scwdtext');";
                html += "    if (scwdInput && data.preFinance_SCWD !== undefined) {";
                html += "      scwdInput.value = parseFloat(data.preFinance_SCWD || 0).toFixed(2);";
                html += "      updateSCWDAmount(scwdInput);";
                html += "    }";
                // OPC Prefill
                html += "    if (data.preFinance_OPC !== undefined && parseFloat(data.preFinance_OPC) < 0) {";
                html += "      var opcToggle = document.getElementById('opcdiscount');";
                html += "      if (opcToggle) {";
                html += "        opcToggle.checked = true;";
                html += "        toggleopcdiscount();";
                html += "      }";
                html += "    }";
                // Loan Amount prefill
                html += "    var loanamount = document.getElementById('loanamount');";
                html += "    if (loanamount && data.preFinance_loanAmount !== undefined) {";
                html += "      loanamount.value = parseFloat(data.preFinance_loanAmount || 0).toFixed(2);";
                html += "      updateLoanAmount(loanamount);";
                html += "    }";
                // Config Option Amount prefill
                html += "    var configAmount = document.getElementById('optionconfig');";
                html += "    if (configAmount && data.preFinance_ConfigAmount !== undefined) {";
                html += "      configAmount.innerText = parseFloat(data.preFinance_ConfigAmount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                html += "      updateOptionSummary();";
                html += "    }";


                html += "  } else {";
                //  html += "  totalAmount.innerText = Number(listprice).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                // html += "  addtionalAmount.innerText = '0';";
                html += "  }";
                html += "} else {";
                // html += "updateTotalAmount();";
                html += "}";
                html += "updateTotalAmount();";

                // Fatching data from Parent and Child Array and updating row
                html += "try {";
                html += "var packgItem_data = child_Object[parentId];";
                html += "if (!packgItem_data) {container.innerHTML = '<p style=\"color: red;\">No Item found for Package: ' + escapeHtml(pckgName) + '</p>'; return; }";
                html += "var allAccHtml = '';";
                html += "for (var costGroup in packgItem_data) {";
                html += "var items = packgItem_data[costGroup];";
                html += "var accHtml = '<button type=\"button\" class=\"accordion\" aria-expanded=\"false\" aria-controls=\"panel-' + escapeHtml(costGroup) + '\"><span class=\"arrow\">▶</span> ' + escapeHtml(costGroup) + '</button>';";

                html += "accHtml += '<div class=\"panel\" id=\"panel-' + escapeHtml(costGroup) + '\">';";
                html += "for (var i = 0; i < items.length; i++) {";
                html += "accHtml += '<div class=\"panel\" style=\"display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px;\">';";
                html += "accHtml += '<div><span>' + escapeHtml(items[i].childName) + ' - </span><span style=\"color: green; font-weight: bold;\">$' + items[i].childCost + '</span></div>'; ";

                //---------Adding lock or slider based on checkbox
                html += "if (items[i].childIncludePrice) {";
                html += "  accHtml += '<i class=\"fas fa-lock\" style=\"margin-left: 10px; color: #999;\"></i>';";
                html += "} else {";
                html += "  accHtml += '<label class=\"switch\" style=\"margin-left: 10px;\">';";
                html += "  accHtml += '<input type=\"checkbox\" class=\"item-checkbox\" " +
                    "data-name=\"' + escapeHtml(items[i].childName) + '\" " +
                    "data-costgroup=\"' + escapeHtml(items[i].childCostGroup) + '\" " +
                    "onchange=\"handleCheckboxChange(this, \\'' + escapeHtml(items[i].childName) + '\\',\\'' + escapeHtml(items[i].childCost) + '\\',\\'' + escapeHtml(items[i].childCostGroup) + '\\')\">';";
                html += "  accHtml += '<span class=\"slider\"></span></label>';";

                html += "}";
                html += "accHtml += '</div>';";

                html += "}";
                html += "accHtml += '</div>';";
                html += "allAccHtml += accHtml;";
                html += "}";

                html += "container.innerHTML = allAccHtml;";
                html += "bindAccordions();";
                //Packg  Item Slider on  prefill data
                html += "if (isPrefilled) {";
                html += "  prefillChildItems.forEach(function(savedItem) {";
                html += "    if (savedItem.is_selected) {";
                html += "      var checkbox = document.querySelector('.item-checkbox[data-name=\"' + savedItem.item_name + '\"]');";
                html += "      if (checkbox){ ";
                html += " checkbox.checked = true;";

                html += "    itemDataNew.push({";
                html += "      item_name: savedItem.item_name,";
                html += "      item_cost: savedItem.cost,";
                html += "      item_costGroup: savedItem.costgroup,";
                html += "      is_selected: 'true'";
                html += "    });";

                html += "    }";
                html += "    }";
                html += "  });";
                html += "    }";// End of isPrefilled
                //-----------------------
                html += "} catch (e) {";
                html += "container.innerHTML = '<p>Error loading details: ' + escapeHtml(e.message) + '</p>';";
                html += "}";
                html += "}";

                html += "function showTable() {" +
                    "itemDataNew = [];" +
                    "itemData_Option_config = [];" +
                    "var table = document.querySelector('.vehicle-table');" +
                    "if (table) table.style.display = 'table';" +
                    "var detailsSection = document.getElementById('detailsSection');" +
                    "if (detailsSection) detailsSection.style.display = 'none';" +
                    "var totaltable = document.getElementById('totaltable');" +
                    "if (totaltable) totaltable.style.display = 'none';" +
                    "document.getElementById('btnback').style.display = 'none';" +
                    "document.getElementById('btnsubmit').style.display = 'none';" +
                    "document.getElementById('packgOption').style.display = 'none';" +
                    "var titleText = document.getElementById('titleText');" +
                    "if (titleText) titleText.textContent = 'Select Package for Model ' + ModelText;" +
                    "hideTabsAndReset();" +
                    "}";
                // Hide Tab and Open First Tab
                html += "function hideTabsAndReset() {";
                html += "  document.getElementById('availColourTable').style.display = 'none';";
                html += "  document.getElementById('tabNavWrapper').style.display = 'none';";
                html += "  var homeTab = new bootstrap.Tab(document.getElementById('nav-home-tab'));";
                html += "  homeTab.show();";
                html += "}";

                // Radio togel for Total Gaurnate and Non Guaranteed
                html += "  function toggleCOEDiscount() {";
                html += "    var selected = document.querySelector('input[name=\"bidOption\"]:checked').value;";
                html += "    var row = document.getElementById('row_nongaurnateelamnt');";
                html += "    if (selected === 'non_guaranteed') {";
                html += "      row.style.display = 'table-row';";
                html += "    } else {";
                html += "      row.style.display = 'none';";
                html += "    }";
                html += "  }";

                // Update Total Amount 
                html += "  function parseAmount(id) {";
                html += "    var el = document.getElementById(id);";
                html += "    if (!el) return 0;";
                html += "    var val = el.innerText || el.textContent;";
                html += "    val = val.replace(/,/g, '').trim();";
                html += "    return parseFloat(val) || 0;";
                html += "  }";
                html += "  function updateTotalAmount() {";
                html += "    var packageAmount = parseAmount('packageAmount');";
                html += "    var financeAmount = parseAmount('financeAmount');";
                html += "    var insuranceAmount = parseAmount('insuranceAmount');";
                html += "    var additionalAmount = parseAmount('addtionalAmount');";
                html += "    var colourTopupAmount = parseAmount('colourTopupAmount');";
                html += "    var opcamount = parseAmount('opcamount');";
                html += "    var scwdamount = parseAmount('scwdamount');";
                html += "    var spcldisamount = parseAmount('spcldisamount');";
                html += "    var total = 0;";
                html += "    total += packageAmount;";
                html += "    total += financeAmount;";
                html += "    total += insuranceAmount;";
                html += "    total += additionalAmount;";
                html += "    total += colourTopupAmount;";
                html += "    total += opcamount;";
                html += "    total += scwdamount;";
                html += "    total += spcldisamount;";
                html += "    document.getElementById('totalAmount').innerText = total.toLocaleString('en-US', { minimumFractionDigits: 2 });";
                html += "    var coeDisL = parseAmount('nongaurnateelamnt');";
                html += "    var result = total + coeDisL;";
                html += "  amountNonGuaranteed.innerText = result.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";
                html += "  }";

                html += "  function updateOptionSummary() {";
                html += "    var baseprice = parseAmount('baseprice');";
                html += "    var optionconfig = parseAmount('optionconfig');";
                html += "    var total = 0;";
                html += "    total += baseprice;";
                html += "    total += optionconfig;";
                html += "    document.getElementById('totalconfig').innerText = total.toLocaleString('en-US', { minimumFractionDigits: 2 });";
                html += "  }";
                //-------

                html += "function handleCheckboxChange(checkbox, childName,childCost,ChildCostGroup) {" +

                    "const optInCell = document.getElementById('addtionalAmount');" +
                    "const currentOptInValue = parseFloat(optInCell.innerText.replace(/,/g, '')) || 0;" +
                    "const currentchildCost = parseFloat(childCost) || 0;" +
                    "const newOptInValue = checkbox.checked" +
                    "? currentOptInValue + currentchildCost" +
                    ": currentOptInValue - currentchildCost;" +
                    "optInCell.innerText = newOptInValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });";
                html += "updateTotalAmount();";
                //value is pushing in array
                html += "if (checkbox.checked) {" +
                    "var exists = itemDataNew.some(function (item) {" +
                    " return item.item_name === childName;" +
                    " });" +
                    " if (!exists) {";
                html += "    itemDataNew.push({";
                html += "      item_name: childName,";
                html += "      item_cost: childCost,";
                html += "      item_costGroup: ChildCostGroup,";
                html += "      is_selected: 'true'";
                html += "    });";
                html += "  }";
                html += " } else {";
                // Remove item
                html += " itemDataNew = itemDataNew.filter(function (item) {";
                html += "   return item.item_name !== childName;";
                html += "  });";
                html += "  }";

                html += "console.log('Checkbox for ' + escapeHtml(childCost) + ' is ' + (checkbox.checked ? 'checked' : 'unchecked'));";
                html += "}";
                // funcation caall on Option Configure toggel
                html += "function handletogelOptionConfig(checkbox, config_Name,config_amount,config_category,config_features,config_code) {" +
                    "const isChecked = checkbox.checked;" +
                    "const itemId = checkbox.getAttribute('data-id');" +
                    "toggledItems[itemId] = isChecked;" +

                    "const optInCell = document.getElementById('addtionalAmount');" +
                    "const currentOptInValue = parseFloat(optInCell.innerText.replace(/,/g, '')) || 0;" +
                    "const currentchildCost = parseFloat(config_amount) || 0;" +
                    "const newOptInValue = checkbox.checked" +
                    "? currentOptInValue + currentchildCost" +
                    ": currentOptInValue - currentchildCost;" +
                    "optInCell.innerText = newOptInValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });";

                html += "const optionconfig = document.getElementById('optionconfig');" +
                    "const currentConfigInValue = parseFloat(optionconfig.innerText.replace(/,/g, '')) || 0;" +
                    "const currentconfigCost = parseFloat(config_amount) || 0;" +
                    "const newConfigValue = checkbox.checked" +
                    "? currentConfigInValue + currentconfigCost" +
                    ": currentConfigInValue - currentconfigCost;" +
                    "optionconfig.innerText = newConfigValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });";

                html += "updateTotalAmount();";
                html += "updateOptionSummary();";
                //value is pushing in array
                html += "if (checkbox.checked) {" +
                    "var exists = itemData_Option_config.some(function (item) {" +
                    " return item.item_name === config_Name;" +
                    " });" +
                    " if (!exists) {";
                html += "    itemData_Option_config.push({";
                html += "      config_Name: config_Name,";
                html += "      config_category: config_category,";
                html += "      config_features: config_features,";
                html += "      config_code: config_code,";
                html += "      config_selected_id: itemId,";
                html += "      config_selected_amount: config_amount,";
                html += "      is_selected: 'true'";
                html += "    });";
                html += "  }";
                html += " } else {";

                html += " itemData_Option_config = itemData_Option_config.filter(function (item) {";
                html += "   return item.item_name !== config_Name;";
                html += "  });";
                html += "  }";
                html += "updateToggleCount();";
                html += "console.log('Checkbox for ' + escapeHtml(config_amount) + ' is ' + (checkbox.checked ? 'checked' : 'unchecked'));";
                html += "}";

                // Bind Accordions
                html += "function bindAccordions() {";
                html += "var acc = document.getElementsByClassName('accordion');";
                html += "for (var i = 0; i < acc.length; i++) {";
                html += "acc[i].onclick = function () {";
                html += "this.classList.toggle('active');";
                html += "var panel = this.nextElementSibling;";
                html += "var arrow = this.querySelector('.arrow');";
                html += "var isExpanded = panel.style.display === 'block';";
                html += "panel.style.display = isExpanded ? 'none' : 'block';";
                html += "arrow.textContent = isExpanded ? '▶' : '▼';";
                html += "this.setAttribute('aria-expanded', !isExpanded);";
                html += "};";
                html += "}";
                html += "}";


                // Insurance Period DropDown
                html += "  function updateInsuranceAmount() {";
                html += "    var selectedId = document.getElementById('insurancePeriod').value;";
                html += "    var match = insurance_Object.find(function(item) { return item.InsuranePeriodID == selectedId; });";
                html += "    if (match) {";
                html += "    last_InsuranceAmount= (-1 * match.InsuraneAmount).toLocaleString('en-US', { minimumFractionDigits: 2 });";
                html += "    document.getElementById('insuranceAmount').innerText = (-1 * match.InsuraneAmount).toLocaleString('en-US', { minimumFractionDigits: 2 });";
                html += "    updateTotalAmount();";
                html += "    }";
                html += "  }";
                // Call byDefault
                html += "document.addEventListener('DOMContentLoaded', function() {";
                html += "  bindAccordions();";
                html += "  updateInsuranceAmount();";
                html += "  filterFinanceTable();";
                html += "  filterInsuranceTable();";
                html += "  var toggle = document.getElementById('unitSwitch');";
                html += "  toggle.addEventListener('change', updatedisableRadio);";
                html += "  updatedisableRadio();";

                // html += "  var loanInput = document.getElementById('loanamount');";
                // html += "  if (loanInput) {";
                // html += "    loanInput.addEventListener('input', function() {";
                // html += "     var amount = (parseFloat(last_FinanceAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });";
                // html += "      document.getElementById('financeAmount').innerText = amount;";
                // html += "    updateTotalAmount();";
                // html += "    });";
                // html += "  }";
                html += '  const configureTab = document.getElementById("nav-configurator-tab");';
                html += '  if (configureTab) {';
                html += '    configureTab.addEventListener("shown.bs.tab", function () {';
                html += '      configTabLoaded();';
                html += '      const firstCategory = document.querySelector(".category-item");';
                html += '      if (firstCategory) firstCategory.click();';
                html += '    });';
                html += '  }';
                html += "});";
                // Hide Insuraance Table on Togel
                html += "function toggleInsuranceTable() {";
                html += "  var toggle = document.getElementById('addInsuranceToggle');";
                html += "  var tableWrapper = document.getElementById('insuranceTableWrapper');";
                html += "  var insuranceAmount = document.getElementById('insuranceAmount');";

                html += "  if (toggle.checked) {";
                html += "    tableWrapper.style.display = 'block';";
                html += "     insuranceAmount.innerText = last_InsuranceAmount;";
                html += "  } else {";
                html += "    tableWrapper.style.display = 'none';";
                html += "    insuranceAmount.innerText = '0.00';";
                html += "  }";

                html += "  updateTotalAmount();";
                html += "}";
                //Hide Finance Table on togel
                html += "function toggleFianceTable() {";
                html += "  var toggle = document.getElementById('addFinanceToggle');";
                html += "  var tableWrapper = document.getElementById('financeTableWrapper');";
                html += "  var financeAmount = document.getElementById('financeAmount');";

                html += "  if (toggle.checked) {";
                html += "    tableWrapper.style.display = 'flex';";
                html += "  document.getElementById('loanamount').value = '';";
                html += "  } else {";
                html += "    tableWrapper.style.display = 'none';";
                html += "    financeAmount.innerText = '0.00';";
                html += "  }";

                html += "  updateTotalAmount();";
                html += "}";
                // Show OPC Discount on Togel
                html += "function toggleopcdiscount() {";
                html += "  var toggle = document.getElementById('opcdiscount');";
                html += "  var tableWrapper = document.getElementById('row_opcamount');";
                html += "  var opcAmount = document.getElementById('opcamount');";

                html += "  if (toggle.checked) {";
                html += "     tableWrapper.style.display = 'table-row';";
                html += "     opcAmount.innerText = Number(OpcdDiscount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });";
                html += "  } else {";
                html += "    tableWrapper.style.display = 'none';";
                html += "    opcAmount.innerText = '0.00';";
                html += "  }";
                html += "  updateTotalAmount();";
                html += "}";
                // Funcation call when enter on SCWD field
                html += "function updateSCWDAmount(input) {";
                html += "  var value = input.value.replace(/[^0-9.]/g, '');";
                html += "  input.value = value;";
                html += "  var num = parseFloat(value);";
                html += "  var displayValue = value ? '-' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';";
                html += "  document.getElementById('scwdamount').innerText = displayValue;";
                html += "  updateTotalAmount();";
                html += "}";

                // Funcation call when enter on Special Discount field

                html += "var SpclDisciunt_level = '';";

                html += "function updateSpclDisAmount(input) {";
                html += "  SpclDisciunt_level='';";
                html += "  var value = input.value.replace(/[^0-9.]/g, '');";
                html += "  input.value = value;";
                html += "  var num = parseFloat(value);";
                html += "  if (isNaN(num)) num = 0;";
                html += "  var displayValue = value ? '-' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';";
                html += "  document.getElementById('spcldisamount').innerText = displayValue;";
                html += "  updateTotalAmount();";
                html += "}";

                html += "function handleSpclDisApproval(input) {";
                html += "  var num = parseFloat(input.value);";
                html += "  if (isNaN(num)) return;";
                html += "  var SpecialDiscount_SM = parseFloat(parentSpecialdisSM) || Infinity;";
                html += "  var SpecialDiscount_GM = parseFloat(parentSpecialdisGM) || Infinity;";
                html += "  var SpecialDiscount_MD = parseFloat(parentSpecialdisMD) || Infinity;";
                html += "  if (num <= Math.abs(SpecialDiscount_MD)) {";
                html += "    if (num <= Math.abs(SpecialDiscount_GM)) {";
                html += "      if (num <= Math.abs(SpecialDiscount_SM)) {";
                html += "        alert('Sales Manager will approve this discount.');";
                html += "         SpclDisciunt_level='1';";
                html += "      } else {";
                html += "        alert('General Manager will approve this discount.');";
                html += "         SpclDisciunt_level='2';";
                html += "      }";
                html += "    } else {";
                html += "      alert('Managing Director will approve this discount.');";
                html += "         SpclDisciunt_level='3';";
                html += "    }";
                html += "  }";
                html += "}";

                // Funcation call when enter on Loan Amount field
                html += "function updateLoanAmount(input) {";
                html += "  var value = input.value.replace(/[^0-9.]/g, '');";
                html += "  input.value = value;";
                html += "  var num = parseFloat(value);";
                html += "  var amount = 0.00;";
                html += "  if (!isNaN(num)) {";
                html += "    amount = last_FinanceAmount;";
                html += "  }";
                html += "  var amount = (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });";
                html += "  document.getElementById('financeAmount').innerText = amount;";
                html += "  updateTotalAmount();";
                html += "}";
                // update Badge Count on Option Config
                html += "function updateToggleCount() {";
                html += "  const packageId = document.getElementById('hidden_packageid').value;";
                html += "  const counts = {};";
 
                html += "  const catMap = categoryMapNew[packageId];";
                html += "  if (catMap) {";
                html += "    for (const label in catMap) {";
                html += "      counts[label] = 0;";
                html += "    }";
                html += "  }";

                html += "  for (const id in toggledItems) {";
                html += "    if (toggledItems[id]) {";
                html += "      for (const category in child_config[packageId]) {";
                html += "        for (const subcat in child_config[packageId][category]) {";
                html += "          child_config[packageId][category][subcat].forEach(function(item) {";
                html += "            if (item.child_Config_internalid === id) {";
                html += "              for (const label in catMap) {";
                html += "                if (catMap[label] === category) {";
                html += "                  const key = label;";
                html += "                  counts[key]++;";
                html += "                }";
                html += "              }";
                html += "            }";
                html += "          });";
                html += "        }";
                html += "      }";
                html += "    }";
                html += "  }";

                html += "  for (const key in counts) {";
                html += "    const el = document.getElementById('badge-' + key);";
                html += "    if (el) el.textContent = counts[key];";
                html += "  }";

                html += "}";

                // radio Disable
                html += "function updatedisableRadio() {";
                html += "  var toggle = document.getElementById('unitSwitch');";
                html += "  var driverRadio = document.getElementById('driverSide');";
                html += "  var passengerRadio = document.getElementById('passengerSide');";

                html += "  if (!toggle.checked) {";
                html += "    driverRadio.checked = false;";
                html += "    passengerRadio.checked = false;";
                html += "    driverRadio.disabled = true;";
                html += "    passengerRadio.disabled = true;";
                html += "  } else {";
                html += "    driverRadio.disabled = false;";
                html += "    passengerRadio.disabled = false;";
                html += "  }";
                html += "}";
                // Update Colour Topup Amount
                html += "function updateColourTopUpAmount(amount) {" +

                    "var formattedAmount = parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 });" +
                    "document.getElementById('colourTopupAmount').innerText = formattedAmount;" +
                    "updateTotalAmount();" +
                    "}";

                // click on Submit button
                html += "function submitPackage() {";

                html += "  var btn = document.getElementById('btnsubmit');";
                html += "  if (btn) btn.disabled = true;";
                html += "  btn.innerText = 'Submitting...';";
                html += "  btn.innerHTML = '<span class=\"spinner-border spinner-border-sm\"></span> Submitting...';";

                html += "  var packgeName = document.getElementById('titleText').innerText.replace(/,/g, '');";
                html += "  var packageAmount = document.getElementById('packageAmount').innerText.replace(/,/g, '');";
                html += "  var packageid = document.getElementById('hidden_packageid').value;";

                html += "  var selectedLabel = \"\";";
                html += "  var selectedRadio = document.querySelector('input[name=\"processingUnit\"]:checked');";
                html += "  if (selectedRadio) {";
                html += "    var label = document.querySelector('label[for=\"' + selectedRadio.id + '\"]');";
                html += "    if (label) {";
                html += "      selectedLabel = label.textContent.trim();";
                html += "    }";
                html += "  }";

                html += "    var obuTouchEnabled = document.getElementById('obutouch').checked;";

                //Inside Submit() Get Total amount based on Radio button
                html += "  var selectedOption = document.querySelector('input[name=\"bidOption\"]:checked').value;";
                html += "  var totalAmount = 0;";
                html += "  if (selectedOption === 'guaranteed') {";
                html += "   totalAmount = parseFloat(document.getElementById('totalAmount').innerText.replace(/,/g, '') || '0');";
                html += "  } else if (selectedOption === 'non_guaranteed') {";
                html += "   totalAmount = parseFloat(document.getElementById('amountNonGuaranteed').innerText.replace(/,/g, '') || '0');";
                html += "  }";

                html += "var addtionalAmount = document.getElementById('addtionalAmount').innerText.replace(/,/g, '');";
                html += "    addtionalAmount = parseFloat(addtionalAmount) || 0;";

                html += "var colourTopupAmount = document.getElementById('colourTopupAmount').innerText.replace(/,/g, '');";
                html += "    colourTopupAmount = parseFloat(colourTopupAmount) || 0;";

                html += "var optionconfigAmount = document.getElementById('optionconfig').innerText.replace(/,/g, '');";
                html += "    optionconfigAmount = parseFloat(optionconfigAmount) || 0;";
                //Inside Submit() get Finance and Insurance Rebate value
                html += "  var financeAmountText = document.getElementById('financeAmount')?.innerText || '0';";
                html += "  var financeAmount = parseFloat(financeAmountText.replace(/[^0-9.-]/g, '')) || 0;";

                html += "  var insuranceAmountText = document.getElementById('insuranceAmount')?.innerText || '0';";
                html += "  var insuranceAmount = parseFloat(insuranceAmountText.replace(/[^0-9.-]/g, '')) || 0;";
                //Inside Submit() get OPC and SCWD Rebate value
                html += "  var opcamountText = document.getElementById('opcamount')?.innerText || '0';";
                html += "  var OpcAmount = parseFloat(opcamountText.replace(/[^0-9.-]/g, '')) || 0;";

                html += "  var SCWDAmountText = document.getElementById('scwdamount')?.innerText || '0';";
                html += "  var SCWDAmount = parseFloat(SCWDAmountText.replace(/[^0-9.-]/g, '')) || 0;";

                html += "  var spcldisamountText = document.getElementById('spcldisamount')?.innerText || '0';";
                html += "  var spcldisAmount = parseFloat(spcldisamountText.replace(/[^0-9.-]/g, '')) || 0;";
                //Inside Submit() Get Dropdowns Value
                html += "var insurancePeriod= document.getElementById('insurancePeriod').value;";
                html += "var insuranceCompany= document.getElementById('insuranceCompany').value;";
                html += "var financeBankpckg= document.getElementById('financeBankpckg').value;";
                html += "var financeTerm= document.getElementById('financeTerm').value;";
                html += "var loanamount= document.getElementById('loanamount').value;";


                // Hit AJAX
                html += "  fetch(window.location.href, {";
                html += "    method: 'POST',";
                html += "    headers: { 'Content-Type': 'application/json' },";
                html += "    body: JSON.stringify({";
                html += "      package_name: packgeName,";
                html += "      package_ID: packageid,";
                html += "      SO_ID: SOrecordId,";
                html += "      transtype: transtype,";
                html += "      Model_ID: ModelId,";
                html += "      SelectedPckgHeadID: SelectedPckgHeadID,";
                html += "      itemData: itemDataNew,";
                html += "      itemDataConfig: itemData_Option_config,";
                html += "      LineNum: lineNum,";
                html += "      totalAmount: totalAmount,";
                html += "      addtionalAmount: addtionalAmount,";
                html += "      colourTopupAmount: colourTopupAmount,";
                html += "      loanamount: loanamount,";
                html += "      financeBankpckg: financeBankpckg,";
                html += "      financeTerm: financeTerm,";
                html += "      insurancePeriod: insurancePeriod,";
                html += "      insuranceCompany: insuranceCompany,";
                html += "      financeAmount: financeAmount,";
                html += "      insuranceAmount: insuranceAmount,";
                html += "      OpcAmount: OpcAmount,";
                html += "      SCWDAmount: SCWDAmount,";
                html += "      ListPrice: packageAmount,";
                html += "      SpecialDis: spcldisAmount,";
                html += "      OBU: obuTouchEnabled,";
                html += "      Obu_loc: selectedLabel,";
                html += "      SpclDisciunt_level: SpclDisciunt_level,";
                html += "      Customer: Customer,";
                html += "      ModelText: ModelText,";
                html += "      optionconfigAmount: optionconfigAmount";
                html += "    })";
                html += "  })";
                // Ajax Response
                html += "  .then(res => res.json())";
                html += "  .then(data => {";
                html += "    if (!data.success) {";
                html += "      alert('Error: ' + data.error);";
                html += "      document.getElementById('btnsubmit').disabled = false;"; // Re-enable button
                html += "      document.getElementById('btnsubmit').innerText = 'Submit';"; // Reset text
                html += "      return;";
                html += "    }";
                html += "    if (window.opener) {";
                html += "      window.opener.location.reload(true);";
                html += "      window.close();";
                html += "    }";
                html += "  })";
                html += "  .catch(err => {";
                html += "    alert('Unexpected error: ' + err);";
                html += "    document.getElementById('btnsubmit').disabled = false;";
                html += "    document.getElementById('btnsubmit').innerText = 'Submit';";
                html += "  });";

                html += "}";

                html += "  var cell = document.getElementById('parentListPriceCell');";
                html += "  var value = parseFloat(cell.innerText) || 0;";
                html += "  cell.innerText = value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});";

                // Child Configurations tab Data-----------------------------------
                html += "var child_config = " + JSON.stringify(child_config) + ";";
                html += "var child_Pckg_config_Prefill = " + JSON.stringify(child_Pckg_config_Prefill) + ";";
                html += "var categoryMapNew = " + JSON.stringify(categoryMap) + ";";

                html += "function configTabLoaded() {";
                html += 'const packageId = document.getElementById("hidden_packageid").value;';
                // Load Type data Interion or ext
                html += '    var currentCategoryMap = categoryMapNew[packageId];';
                html += '    var categoryHTML = "";';
                html += '    for (var categoryName in currentCategoryMap) {';
                html += '      if (currentCategoryMap.hasOwnProperty(categoryName)) {';
                //html += '        var categoryKey = categoryName.toLowerCase().replace(/\\s+/g, "-");';
                html += '        categoryHTML += \'<a href="#" class="list-group-item list-group-item-action category-item" data-category="\' + categoryName + \'">\';';
                html += '        categoryHTML += categoryName + \' <span class="badge badge-pill badge-primary" id="badge-\' + categoryName + \'" style="float: right; background:rgb(75, 142, 98); color: #fff;">0</span>\';';
                html += '        categoryHTML += \'</a>\';';
                html += '      }';
                html += '    }';
                html += '    document.getElementById("category-list").innerHTML = categoryHTML;';
                //

                html += '    const categoryLinks = document.querySelectorAll(".category-item");';
                html += '    categoryLinks.forEach(function (link) {';
                html += '      link.addEventListener("click", function (e) {';
                html += '        e.preventDefault();';

                html += '  document.querySelectorAll(".category-item").forEach(function(el) {';
                html += '    el.classList.remove("active");';
                html += '  });';
                html += '  this.classList.add("active");';

                html += '        const categoryName = this.getAttribute("data-category");';
                //html += '        const categoryId = categoryMapNew[selected];';
                // html += "const categoryName = selected.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());";
                html += 'const categoryId = categoryMapNew[packageId][categoryName];';
                html += '        const container = document.getElementById("accordionContainer");';
                html += '        container.innerHTML = "";';
                html += '        container.style.maxHeight = "500px";';
                html += '        container.style.overflowY = "auto";';
                html += "        var prefillChildConfig = child_Pckg_config_Prefill[packageId] || [];";

                html += '        const categoryData = child_config[packageId] && child_config[packageId][categoryId];';
                html += '        if (!categoryData) {';
                html += '          container.innerHTML = "<p>No configuration found.</p>";';
                html += '          return;';
                html += '        }';

                html += '        for (const subcategory in categoryData) {';
                html += '          const items = categoryData[subcategory];';

                html += '          const accHtml = `<button type="button" class="accordion" aria-expanded="false"><span class="arrow">▶</span> ${subcategory}</button>`;';
                html += '          let panelHtml = `<div class="panel">`;';

                html += '          for (let i = 0; i < items.length; i++) {';

                html += "panelHtml += '<div style=\"display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 12px; border-bottom: 1px solid #ccc; padding-bottom: 8px;\">';";
                html += "panelHtml += '<div style=\"margin-bottom: 10px; \">';";

                // First line: Amount - Name
                html += "panelHtml += '<div>' + escapeHtml(items[i].child_Config_name) + ' - <span style=\"color: green; font-weight: bold;\">$' + Number(items[i].child_Config_amount).toLocaleString('en-US', { maximumFractionDigits: 0 }) + '</span></div>'; ";

                // Second line: Code
                html += "panelHtml += '<div><strong>Code:</strong> ' + escapeHtml(items[i].child_Config_code) + '</div>'; ";

                html += "panelHtml += '</div>';";

                html += "if (items[i].child_Config_foc) {";
                html += "  panelHtml += '<span style=\"margin-left: 6px; color: #007bff;\">FOC</span>';";
                html += "} else {";
                html += "  panelHtml += '<label class=\"switch\" style=\"margin-left: 2px;\">';";
                html += "  const isChecked = toggledItems[items[i].child_Config_internalid] ? 'checked' : '';";
                html += "  panelHtml += '<input type=\"checkbox\" class=\"item-checkbox\" ' +";
                html += "    'data-id=\"' + escapeHtml(items[i].child_Config_internalid) + '\" ' +";
                html += "    'data-name=\"' + escapeHtml(items[i].child_Config_name) + '\" ' +";
                html += "    'data-costgroup=\"' + escapeHtml(items[i].child_Config_category) + '\" ' +";
                html += "    isChecked + ' ' +";
                html += "    'onchange=\"handletogelOptionConfig(this, \\'' + escapeHtml(items[i].child_Config_name) + '\\', \\'' + escapeHtml(items[i].child_Config_amount) + '\\', \\'' + escapeHtml(items[i].child_Config_category) + '\\', \\'' + escapeHtml(items[i].child_Config_subcategory_features) + '\\', \\'' + escapeHtml(items[i].child_Config_code) + '\\')\">';";

                html += "  panelHtml += '<span class=\"slider\"></span></label>';";

                html += "}";
                html += "panelHtml += '</div> ';";
                html += '}';

                html += '     container.innerHTML += accHtml + panelHtml;';
                html += '        }';

                html += '        bindAccordions();';
                html += "if (isPrefilled) {";
                html += '    if (typeof prefillChildConfig !== "undefined") {';
                html += '      prefillChildConfig.forEach(function (item) {';
                html += '        toggledItems[item.config_selected_tab_id] = true;';
                html += '        const checkbox = document.querySelector(\'input.item-checkbox[data-id="\' + item.config_selected_tab_id + \'"]\');';
                html += "      if (checkbox){ ";
                html += "         checkbox.checked = true;";
                html += "    itemData_Option_config.push({";
                html += "      config_Name: item.config_name,";
                html += "      config_category: item.config_category,";
                html += "      config_features: item.config_features,";
                html += "      config_code: item.config_code,";
                html += "      config_selected_id: item.config_selected_tab_id,";
                html += "      is_selected: 'true'";
                html += "    });";

                html += "    }";
                html += '      });';
                html += '    }';// End of prefillChildConfig
                html += "    updateToggleCount();";
                html += '    }';// End of isPrefilled
                html += '      });';

                html += '    });';
                html += "}";
                // On chnage of Finance Bank Package dropdown
                html += "  function filterFinanceTable() {";
                html += "    var selectedPckg = document.getElementById('financeBankpckg').value;";
                html += "    var selectedTerm = document.getElementById('financeTerm').value;";
                html += "    var tbody = document.getElementById('financeTableBody');";
                html += "    tbody.innerHTML = '';";
                html += "    financerate.forEach(function(item) {";
                html += "      var packageMatch = !selectedPckg || item.BankPckgID == selectedPckg;";
                html += "      var termMatch = !selectedTerm || item.FinancetermID == selectedTerm;";
                html += "      if (packageMatch && termMatch) {";
                html += "        var row = '<tr style=\"background-color: #fafafa;\">' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.BankPckgText + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FianceMinLoan + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FianceMaxLoan + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FinancetermText + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FinanceIntrate + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FinanceEnddate + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.FinanceRebate + '</td>' +";
                html += "                '</tr>';";
                html += "        tbody.innerHTML += row;";
                html += "      }";
                html += "    });";
                html += "  }";

                // On chnage of Insurance Company dropdown
                html += "  function filterInsuranceTable() {";
                html += "    var selectedCompany = document.getElementById('insuranceCompany').value;";
                html += "    var tbody = document.getElementById('InsuranceTableBody');";
                html += "    tbody.innerHTML = '';";  // Clear existing rows
                html += "    insurance_Object.forEach(function(item) {";
                html += "      if (!selectedCompany || item.InsuraneComAIGId == selectedCompany) {";
                html += "        var row = '<tr style=\"background-color: #fafafa;\">' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.InsuranePeriodText + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.InsuraneAmount + '</td>' +";
                html += "                  '<td style=\"padding: 10px; border: 1px solid #ccc;\">' + item.InsuraneComAIGText + '</td>' +";
                html += "                '</tr>';";
                html += "        tbody.innerHTML += row;";
                html += "      }";
                html += "    });";
                html += "  }";

                html += "</script>";

                // Insurance Tab
                html += "<div class=\"tab-pane fade\" id=\"nav-insurance\" role=\"tabpanel\" aria-labelledby=\"nav-insurance-tab\" style=\"background-color: white; padding: 20px;\">";

                html += "<div style='display: flex; align-items: center; margin-bottom: 15px; font-weight: bold;'>";
                html += "  <label for='addInsuranceToggle'   style='font-weight: bold;'>Add Insurance</label>";
                html += "  <label class='switch'>";
                html += "    <input type='checkbox' id='addInsuranceToggle' onchange='toggleInsuranceTable()' checked>";
                html += "    <span class='slider round'></span>";
                html += "  </label>";
                html += "</div>";
                // Dropdown label
                html += "<div id='insuranceTableWrapper' style='margin-top: 20px;'>";

                html += "<div style='display: flex; gap: 30px; margin-bottom: 15px;'>";

                // First dropdown block
                html += "  <div style='flex: 1;'>";
                html += "    <label for='insurancePeriod' style='display: block; margin-bottom: 5px;'>Insurance Period</label>";
                html += "    <select id='insurancePeriod' name='insurancePeriod' onchange='updateInsuranceAmount()' ";
                html += "            style='padding: 6px 8px; width: 100%; border-radius: 4px; border: 1px solid #ccc;'>";
                html += "    <option value=''>-- Select Period --</option>";
                for (var i = 0; i < insuranceRate.length; i++) {
                    var insurance = insuranceRate[i];
                    var selected = insurance.InsuranePeriodID == preInsurance_Period ? " selected" : "";
                    html += "      <option value='" + insurance.InsuranePeriodID + "'" + selected + ">" + insurance.InsuranePeriodText + "</option>";
                }
                html += "    </select>";
                html += "  </div>";

                // Second dropdown block
                html += "  <div style='flex: 1;'>";
                html += "    <label for='insuranceCompany' style='display: block; margin-bottom: 5px;'>Insurance Company</label>";
                html += "    <select id='insuranceCompany' name='insuranceCompany' onchange='filterInsuranceTable()' ";
                html += "            style='padding: 6px 8px; width: 100%; border-radius: 4px; border: 1px solid #ccc;'>";
                html += "    <option value=''>-- Select Company --</option>";
                var seenComIds = {};
                for (var i = 0; i < insuranceRate.length; i++) {
                    var insurance = insuranceRate[i];
                    if (!seenComIds[insurance.InsuraneComAIGId]) {
                        seenComIds[insurance.InsuraneComAIGId] = true;
                        var selected = "";
                        html += "<option value='" + insurance.InsuraneComAIGId + "'" + selected + ">" + insurance.InsuraneComAIGText + "</option>";
                    }
                }
                html += "    </select>";
                html += "  </div>";

                html += "</div>"; // end of flex row


                html += "  <div style='font-weight: bold; margin: 20px 0 10px;'>AVAILABLE INSURANCE REBATE</div>";
                html += "  <table style='width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;'>";
                html += "    <thead>";
                html += "      <tr style='background-color: #f3f3f3;'>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Insurance Period</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Insurance Rebate (SGD)</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Insurance Company</th>";
                html += "      </tr>";
                html += "    </thead>";
                html += "    <tbody id='InsuranceTableBody'>";

                for (var i = 0; i < insuranceRate.length; i++) {
                    var insurance = insuranceRate[i];
                    html += "      <tr style='background-color: #fafafa;'>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + insurance.InsuranePeriodText + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + insurance.InsuraneAmount + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + insurance.InsuraneComAIGText + "</td>";
                    html += "      </tr>";
                }

                html += "    </tbody>";
                html += "  </table>";
                html += "</div>";
                html += "</div>";

                // finance Tab -------------------
                html += "<div class=\"tab-pane fade\" id=\"nav-finance\" role=\"tabpanel\" aria-labelledby=\"nav-finance-tab\" style=\"background-color: white; padding: 20px;\">";

                html += "<div style='display: flex; align-items: center; margin-bottom: 15px;'>";
                html += "  <label for='addFinanceToggle' style='margin-right: 10px; font-weight: bold;'>Add Finance</label>";
                html += "  <label class='switch'>";
                html += "    <input type='checkbox' id='addFinanceToggle' onchange='toggleFianceTable()' checked>";
                html += "    <span class='slider round'></span>";
                html += "  </label>";
                html += "  </div>";

                html += "<div id='financeTableWrapper' class='row'>";

                html += "  <div class='col-md-4'>";
                html += "    <label for='loanamount'>Loan Amount</label>";
                html += "    <input type='text' class='form-control' id='loanamount' name='loanamount' placeholder='Loan Amount' oninput='updateLoanAmount(this)'>";
                html += "  </div>";

                html += "  <div class='col-md-4'>";
                html += "  <div style='align-items: center; margin-bottom: 15px;'>";
                html += "  <label for='financeBankpckg' style='width: 150px;'>Bank Package</label>";
                html += "  <select id='financeBankpckg' name='financeBankpckg' onchange='filterFinanceTable()' style='padding: 6px 8px; width: 300px; border-radius: 4px; border: 1px solid #ccc;'>";
                html += "    <option value=''>-- Select Period --</option>";
                var seenBankIds = {};
                for (var i = 0; i < financerate.length; i++) {
                    var financeratee = financerate[i];
                    //var selected = i === 0 ? " selected" : "";
                    if (!seenBankIds[financeratee.BankPckgID]) {
                        seenBankIds[financeratee.BankPckgID] = true;
                        var selected = financeratee.BankPckgID == preFinance_bankpackg ? " selected" : "";
                        html += "    <option value='" + financeratee.BankPckgID + "'" + selected + ">" + financeratee.BankPckgText + "</option>";
                    }
                }
                html += "  </select>";
                html += "  </div>";
                html += "  </div>";

                html += "  <div class='col-md-4'>";
                html += "  <div style='align-items: center; margin-bottom: 15px;'>";
                html += "  <label for='financeTerm' style='width: 150px;'>Term</label>";
                html += "  <select id='financeTerm' name='financeTerm' onchange='filterFinanceTable()' style='padding: 6px 8px; width: 300px; border-radius: 4px; border: 1px solid #ccc;'>";
                html += "    <option value=''>-- Select Term --</option>";
                var seenTermIds = {};
                for (var i = 0; i < financerate.length; i++) {
                    var financeR = financerate[i];
                    if (!seenTermIds[financeR.FinancetermID]) {
                        seenTermIds[financeR.FinancetermID] = true;
                        var selected = financeR.FinancetermID == preFinance_loanTerm ? " selected" : "";
                        html += "    <option value='" + financeR.FinancetermID + "'" + selected + ">" + financeR.FinancetermText + "</option>";
                    }
                }
                html += "  </select>";
                html += "  </div>";
                html += "  </div>";
                // Deropdown Finance end
                html += "  <div style='margin: 20px 0 10px; font-weight: bold;'>AVAILABLE FINANCE REBATE</div>";
                html += "  <table style='width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;'>";
                html += "    <thead>";
                html += "      <tr style='background-color: #f3f3f3;'>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Bank Package</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Min Loan Amount</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Max Loan Amount</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Term</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Interest Rate</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>End Date</th>";
                html += "        <th style='text-align: left; padding: 10px; border: 1px solid #ccc;'>Finance Rebate</th>";
                html += "      </tr>";
                html += "    </thead>";
                html += "    <tbody id='financeTableBody'>";

                for (var i = 0; i < financerate.length; i++) {
                    var financeratee = financerate[i];
                    html += "      <tr style='background-color: #fafafa;'>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.BankPckgText + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FianceMinLoan + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FianceMaxLoan + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FinancetermText + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FinanceIntrate + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FinanceEnddate + "</td>";
                    html += "        <td style='padding: 10px; border: 1px solid #ccc;'>" + financeratee.FinanceRebate + "</td>";
                    html += "      </tr>";
                }

                html += "    </tbody>";
                html += "  </table>";
                html += "</div>";

                html += "  </div>";
                // html += "  </div>";

                //  --- Configutor Tab--------------------------------------

                html += "<div class=\"tab-pane fade\" id=\"nav-configurator\" role=\"tabpanel\" aria-labelledby=\"nav-configurator-tab\" style=\"background-color: white; padding: 20px;\">";

                html += '<div class="row">';
                // Left Column: Dropdown Categories -->
                html += '  <div class="col-md-3">';
                html += "  <label><strong>Type</strong></label>";
                html += '    <div id="category-list" class="list-group menu" style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">';
                // // html += '      <a href="#" class="list-group-item list-group-item-action category-item" data-category="exterior">Exterior</a>';
                // html += '<a href="#" class="list-group-item list-group-item-action category-item" data-category="exterior">';
                // html += '  Exterior <span class="badge badge-pill badge-primary" id="badge-exterior" style="float: right; background:rgb(75, 142, 98); color: #fff;">0</span>';
                // html += '</a>';
                // // html += '      <a href="#" class="list-group-item list-group-item-action category-item" data-category="interior">Inetrior</a>';
                // html += '<a href="#" class="list-group-item list-group-item-action category-item" data-category="interior">';
                // html += '  Interior <span class="badge badge-pill badge-primary" id="badge-interior" style="float: right; background:rgb(75, 142, 98); color: #fff;">0</span>';
                // html += '</a>';

                html += '    </div>';
                html += '  </div>';

                html += '  <div class="col-md-6">';
                html += "<label><strong>Features</strong></label>";
                html += ' <div id="accordionContainer"></div>';
                html += '  </div>';

                html += ' <div class="col-md-3">';
                html += "<div id='totalsummary' style='margin-top: 20px; max-width: 400px;'>";
                html += "  <table style='width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden;'>";
                html += "    <thead>";
                html += "      <tr style='background-color: #f5f5f5; color: #333;'>";
                html += "        <th colspan='2' class='breakdown-title' style='padding: 7px; font-size: 16px; '>Option Summary</th>";
                html += "      </tr>";
                html += "    </thead>";
                html += "    <tbody>";
                html += "      <tr>";
                html += "        <td style='padding: 7px; border-top: 1px solid #ddd;'>Base Price</td>";
                html += "        <td id='baseprice' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td>";
                html += "      </tr>";
                html += "      <tr>";
                html += "        <td style='padding: 7px; border-top: 1px solid #ddd;'>Options</td>";
                html += "        <td id='optionconfig' class='price-value positive' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td>";
                html += "      </tr>";
                html += "      <tr>";
                html += "        <td style='padding: 7px; border-top: 1px solid #ddd; font-weight: bold;'>Total Amount</td>";
                html += "        <td id='totalconfig' style='padding: 7px; border-top: 1px solid #ddd; font-weight: bold; text-align: right;'>0.00</td>";
                html += "      </tr>";
                html += "    </tbody>";
                html += "  </table>";
                html += "</div>";

                html += '  </div>';
                html += '</div>';

                // Configurator Tab End
                html += "  </div>";
                // Main Tab End
                html += "  </div>";

                //  Packages Option SCWD
                html += "<div id='packgOption' style='border: 1px solid #ccc; background-color: #fff; padding: 10px; margin: 5px; border-radius: 1px; display:none;'>";
                html += "<label><strong>Package Options</strong></label>";

                html += "<div style='height: 1px; background-color: #ccc; margin: 10px 0;'></div>";

                html += "<div class='form-row' style='display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; margin-top: 10px;'>";
                html += "  <label for='opcdiscount' style='margin-right: 10px;'>Off-Peak Car (OPC) Discount</label>";
                html += "  <label class='switch' style='margin-right: 10px;'>";
                html += "    <input type='checkbox' id='opcdiscount' onchange='toggleopcdiscount()'>";
                html += "    <span class='slider round'></span>";
                html += "  </label>";
                html += "</div>";

                html += "<div style='height: 1px; background-color: #ccc; margin: 10px 0;'></div>";

                html += "<div class='form-row' style='display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; margin-top: 10px;'>";
                html += "  <label for='obutouch' style='margin-right: 10px;'>OBU Touchscreen</label>";
                html += "  <label class='switch' style='margin-right: 10px;'>";
                html += "    <input type='checkbox' id='obutouch'>";
                html += "    <span class='slider round'></span>";
                html += "  </label>";
                html += "</div>";
                // Install Processing Unit at
                html += "<div class='form-row' style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; margin-top: 10px; padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px;'>";

                html += "<div>";
                html += "  <label style='display: block; font-weight: 500; margin-bottom: 5px;'>Install Processing Unit at</label>";
                html += "  <div style='margin-bottom: 5px;'>";
                html += "    <input type='radio' id='driverSide' name='processingUnit' value='driver'>";
                html += "    <label for='driverSide'>Driver's Side</label>";
                html += "  </div>";
                html += "  <div>";
                html += "    <input type='radio' id='passengerSide' name='processingUnit' value='passenger'>";
                html += "    <label for='passengerSide'>Passenger's Side (Recommended)</label>";
                html += "  </div>";
                html += "</div>";

                html += "<label class='switch'>";
                html += "  <input type='checkbox' id='unitSwitch' checked>";
                html += "  <span class='slider round'></span>";
                html += "</label>";

                html += "</div>";

                html += "<div style='height: 1px; background-color: #ccc; margin: 10px 0;'></div>";
                html += '<div class="form-row">';

                html += '  <div class="form-group col-md-6 d-flex align-items-center">';
                html += '    <label for="scwdtext" class="col-md-4 col-form-label">SCWD</label>';
                html += '    <div class="col-md-8">';
                html += '      <input type="text" class="form-control" id="scwdtext" name="scwdtext" oninput="updateSCWDAmount(this)">';
                html += '    </div>';
                html += '  </div>';
                html += "<div style='height: 1px; background-color: #ccc; margin: 10px 0;'></div>";

                // Special Discount Field
                html += '  <div class="form-group col-md-6 d-flex align-items-center">';
                html += '    <label for="spcldistext" class="col-md-4 col-form-label">Special Discount</label>';
                html += '    <div class="col-md-8">';
                html += '      <input type="text" class="form-control" id="spcldistext" name="spcldistext" oninput="updateSpclDisAmount(this)" onblur="handleSpclDisApproval(this)">';
                html += '    </div>';
                html += '  </div>';

                html += '</div>';

                html += "</div>"; // Closing wrapper div


                html += "  <div class='containerr'>";
                html += "  <div class='left-panel'>";
                //---------Total Amount Table------------
                html += "<div id='totaltable' class='price-summary fade-in' style='margin-top: 30px; max-width: 600px; display: none; text-align: left;'>";

                html += "  <table style='width: 100%; background-color: #fff; border-collapse: collapse; font-family: Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 6px; overflow: hidden;'>";

                html += "    <thead>";
                html += "      <tr style='background-color: #f2f2f2;'>";
                html += "        <th colspan='2' class='breakdown-title' style='padding: 12px; font-size: 16px; '>Total Amount Breakdown</th>";
                html += "      </tr>";
                html += "    </thead>";

                html += "    <tbody>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>List Price</td><td class='price-value' id='packageAmount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0</td></tr>";
                html += "      <tr   id='row_opcamount' style='display: none;'><td class='price-label' style='padding: 7px; border-top: 1px solid #ddd;'>OPC</td><td class='price-value negative' id='opcamount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>SCWD</td><td class='price-value negative' id='scwdamount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>Special Discount</td><td class='price-value negative' id='spcldisamount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>Discount Rebate</td><td class='price-value negative' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>Finance Rebate</td><td class='price-value negative' id='financeAmount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td   style='padding: 7px; border-top: 1px solid #ddd;'>Insurance Rebate</td><td class='price-value negative' id='insuranceAmount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>Additional Options (Opt-In)</td><td class='price-value positive' id='addtionalAmount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr  ><td  style='padding: 7px; border-top: 1px solid #ddd;'>Top Up Amount (Different Color)</td><td class='price-value positive' id='colourTopupAmount' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0.00</td></tr>";
                html += "      <tr   id='row_nongaurnateelamnt' style='display: none;'><td style='padding: 7px; border-top: 1px solid #ddd;'>Non-Guaranteed COE Discount L</td><td class='price-value negative' id='nongaurnateelamnt' style='padding: 7px; border-top: 1px solid #ddd; text-align: right;'>0</td></tr>";
                html += "      <tr style='display: none;'><td>Hidden ID</td><td id='hidden_packageid' style='text-align: right;'>0</td></tr>";
                html += "    </tbody>";

                html += "  </table>";

                html += "  <div style='display: flex; gap: 30px; margin-top: 25px;'>";

                html += "    <div  style='background-color: #fff; border: 1px solid #ccc; border-radius: 6px; padding: 10px 15px; flex: 1; text-align: center;'>";
                html += "      <div style='font-weight: bold; font-size: 15px;'>Guaranteed</div>";
                html += "      <div id='totalAmount' style='font-size: 24px; font-weight: bold; color: #007bff; margin-top: 8px;'>0.0</div>";
                html += "      <div style='margin-top: 12px;'><input type='radio' name='bidOption' value='guaranteed' onchange='toggleCOEDiscount()' checked></div>";
                html += "    </div>";

                html += "    <div  style='background-color: #fff; border: 1px solid #ccc; border-radius: 6px; padding: 15px 20px; flex: 1; text-align: center;'>";
                html += "      <div style='font-weight: bold; font-size: 15px;'>Non-Guaranteed L</div>";
                html += "      <div id='amountNonGuaranteed' style='font-size: 24px; font-weight: bold; color: #007bff; margin-top: 8px;'>0.0</div>";
                html += "      <div style='margin-top: 12px;'><input type='radio' name='bidOption' value='non_guaranteed' onchange='toggleCOEDiscount()'></div>";
                html += "    </div>";


                html += "  </div>";
                html += "</div>";
                html += "</div>";

                //rightt
                //     html += "  <div class='right-panel'>"+
                //     "<div class='panel-card'>" +
                //    "<div class='card-title'>" +
                //        "<div class='card-icon'>📊</div>" +
                //        "Price Comparison" +
                //    "</div>" +
                //    "<div class='comparison-bars'>" +

                //        "<div class='comparison-item'>" +
                //            "<div class='comparison-label'>Original</div>" +
                //            "<div class='comparison-bar'>" +
                //                "<div class='comparison-fill' style='width: 100%'></div>" +
                //            "</div>" +
                //            "<div class='comparison-value'>$224,888</div>" +
                //        "</div>" +

                //        "<div class='comparison-item'>" +
                //            "<div class='comparison-label'>Guaranteed</div>" +
                //            "<div class='comparison-bar'>" +
                //                "<div class='comparison-fill' style='width: 98.7%'></div>" +
                //            "</div>" +
                //            "<div class='comparison-value'>$222,038</div>" +
                //        "</div>" +

                //        "<div class='comparison-item'>" +
                //            "<div class='comparison-label'>Non-Guaranteed</div>" +
                //            "<div class='comparison-bar'>" +
                //                "<div class='comparison-fill' style='width: 96.3%'></div>" +
                //            "</div>" +
                //            "<div class='comparison-value'>$216,538</div>" +
                //        "</div>" +

                //    "</div>" +
                //     "</div>" ;


                "</div>";
                //--------------------------------
                html += "</div>";

                html += "</div></div>";
                html += "</body></html>";

                // form.addField({
                //     id: 'custpage_customhtml',
                //     type: serverWidget.FieldType.INLINEHTML,
                //     label: 'HTML'
                // }).defaultValue = html;
                // context.response.writePage(form);
                context.response.write(html);
            }

            else {

                var requestBody = JSON.parse(context.request.body);
                log.debug("requestBody", requestBody);
                var totalAmount = requestBody.totalAmount;
                var packageAmount = requestBody.ListPrice;
                var itemsArr = requestBody.itemData;
                var itemDataConfig = requestBody.itemDataConfig;
                var headerId = requestBody.SelectedPckgHeadID;
                var SO_ID = requestBody.SO_ID;
                var LineNum = requestBody.LineNum;
                var insuranceAmount = requestBody.insuranceAmount;
                var financeAmount = requestBody.financeAmount;
                var loanamount = requestBody.loanamount;
                var financeBankpckg = requestBody.financeBankpckg;
                var financeTerm = requestBody.financeTerm;
                var insurancePeriod = requestBody.insurancePeriod;
                var insuranceCompany = requestBody.insuranceCompany;
                var existingModel_ID = requestBody.Model_ID;
                var transtype = requestBody.transtype;
                var OpcDiscount = requestBody.OpcAmount;
                var SCWdDiscount = requestBody.SCWDAmount;
                var addtionalAmount = requestBody.addtionalAmount;
                var colourTopupAmount = requestBody.colourTopupAmount;
                var optionconfigAmount = requestBody.optionconfigAmount;
                var SpecialDis = requestBody.SpecialDis;
                var SpclDisciunt_level = requestBody.SpclDisciunt_level;
                var OBU = requestBody.OBU;
                var Obu_loc = requestBody.Obu_loc;
                var ModelText = requestBody.ModelText;
                var Customer = requestBody.Customer;

                var FinanceRebateItemID = 14801; // Finance Rebate Item ID
                var InsuranceRebateItemID = 14800; // Insurance Rebate Item ID
                var OpcDiscountItemID = 14812; // OPC Discount Item ID
                var SCWDItemID = 14813; // SCWD Item ID
                var addtionalItemID = 14818; // Additional Item ID
                var specialDiscountItemID = 14869; // Special discount Item ID
                var DiffColourItemID = 14902; // Special discount Item ID


                var child_table = 'recmachcustrecord_parent_package_head';
                var child_table_config = 'recmachcustrecord_parent_package_head_config';
                // Remove Package  Item child
                if (itemsArr && headerId) {
                    var childSearch = search.create({
                        type: 'customrecord_save_vsa_package_item',
                        filters: [['custrecord_parent_package_head', 'is', headerId]],
                        columns: ['internalid']
                    });
                    childSearch.run().each(function (result) {
                        record.delete({ type: 'customrecord_save_vsa_package_item', id: result.id });
                        return true;
                    });
                }
                // Remove Package Config Option child
                if (itemDataConfig && headerId) {
                    var childSearch_config = search.create({
                        type: 'customrecord_selected_child_pckg_coonfig',
                        filters: [['custrecord_parent_package_head_config', 'is', headerId]],
                        columns: ['internalid']
                    });
                    childSearch_config.run().each(function (result) {
                        record.delete({ type: 'customrecord_selected_child_pckg_coonfig', id: result.id });
                        return true;
                    });
                }
                //  Create custom record
                var rec = headerId
                    ? record.load({ type: 'customrecord_save_vsa_package', id: headerId, isDynamic: true })
                    : record.create({ type: 'customrecord_save_vsa_package', isDynamic: true });
                rec.setValue({ fieldId: 'name', value: requestBody.package_name });
                rec.setValue({ fieldId: 'custrecord_vsa_package', value: requestBody.SO_ID });
                rec.setValue({ fieldId: 'custrecord_model_vsa', value: requestBody.Model_ID });
                rec.setValue({ fieldId: 'custrecord_select_package', value: requestBody.package_ID });
                rec.setValue({ fieldId: 'custrecord_list_price_vsa', value: requestBody.ListPrice });
                rec.setValue({ fieldId: 'custrecord_selected_total_amount', value: totalAmount });
                rec.setValue({ fieldId: 'custrecord_selected_finance_rebate', value: financeAmount });
                rec.setValue({ fieldId: 'custrecord_selected_bank_packg', value: financeBankpckg });
                rec.setValue({ fieldId: 'custrecord_selected_loan_amount', value: loanamount });
                rec.setValue({ fieldId: 'custrecord_selected_loan_term', value: financeTerm });
                rec.setValue({ fieldId: 'custrecord_selected_insurance_rebate', value: insuranceAmount });
                rec.setValue({ fieldId: 'custrecord_selected_insurance_period', value: insurancePeriod });
                rec.setValue({ fieldId: 'custrecord_selected_insurance_company', value: insuranceCompany });
                rec.setValue({ fieldId: 'custrecord_selected_scwd', value: SCWdDiscount });
                rec.setValue({ fieldId: 'custrecord_selected_opc_dis', value: OpcDiscount });
                rec.setValue({ fieldId: 'custrecord_selected_config_amount', value: optionconfigAmount });
                rec.setValue({ fieldId: 'custrecord_save_addtional_amount', value: addtionalAmount });
                rec.setValue({ fieldId: 'custrecord_diff_colour_topup', value: colourTopupAmount });
                rec.setValue({ fieldId: 'custrecord_selected_special_discount', value: SpecialDis });

                // Package Item Line
                if (itemsArr) {
                    itemsArr.forEach(function (item) {
                        var isSelected = item.is_selected === 'true';

                        //  log.debug('Child Item', item.item_name + ', ' + item.item_cost + ', ' + isSelected + ', ' + item.item_costGroup);
                        rec.selectNewLine({ sublistId: child_table });

                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "name",
                            value: item.item_name
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "custrecord_save_item_cost",
                            value: item.item_cost
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "custrecord_package_item_isselected",
                            value: isSelected
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table,
                            fieldId: "custrecord_save_item_cost_group",
                            value: item.item_costGroup
                        });
                        rec.commitLine({ sublistId: child_table });

                    });
                }
                // Package Configurator Line
                if (itemDataConfig) {
                    itemDataConfig.forEach(function (item) {
                        //var isSelected = item.is_selected === true;

                        rec.selectNewLine({ sublistId: child_table_config });

                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "name",
                            value: item.config_Name
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_code",
                            value: item.config_code
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_config_cate",
                            value: item.config_category
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_features",
                            value: item.config_features
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_config_tab",
                            value: true
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_configtab_id",
                            value: item.config_selected_id
                        });
                        rec.setCurrentSublistValue({
                            sublistId: child_table_config,
                            fieldId: "custrecord_selected_config_amount_child",
                            value: item.config_selected_amount
                        });
                        rec.commitLine({ sublistId: child_table_config });
                        log.debug("Commit Config", item.config_selected_id);
                    });
                }

                var CusrrecordId = rec.save();
                log.debug('Data saved Custom', CusrrecordId);
                // Add Rebate Lines on SalesOrder
                var soRec = record.load({
                    type: transtype,
                    id: SO_ID,
                    isDynamic: true
                });
                soRec.setValue({ fieldId: 'custbody_advs_loan_amt', value: loanamount });
                soRec.setValue({ fieldId: 'custbody_advs_bank_package', value: financeBankpckg });
                soRec.setValue({ fieldId: 'custbody_advs_loan_terms', value: financeTerm });
                soRec.setValue({ fieldId: 'custbodyadvs_ins_per', value: insurancePeriod });
                soRec.setValue({ fieldId: 'custbody_insurance_com', value: insuranceCompany });
                soRec.setValue({ fieldId: 'custbody_special_dis', value: SpecialDis });
                soRec.setValue({ fieldId: 'custbody_obu_touchscreen', value: OBU });
                soRec.setValue({ fieldId: 'custbody_obu_install_loc', value: Obu_loc });

                //Update Rate on
                soRec.selectLine({ sublistId: 'item', line: LineNum });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item',
                    value: existingModel_ID
                });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                    value: packageAmount
                });
                soRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_package_head',
                    value: CusrrecordId
                });
                soRec.commitLine({ sublistId: 'item' });

                // Add new items
                if (insuranceAmount < 0 || financeAmount < 0 || OpcDiscount < 0 || SCWdDiscount < 0 || SpecialDis < 0 || addtionalAmount > 0 || colourTopupAmount > 0) {
                    var itemUpdateMap = [];

                    if (insuranceAmount < 0) {
                        itemUpdateMap.push({ id: InsuranceRebateItemID, rate: insuranceAmount });
                    }
                    if (financeAmount < 0) {
                        itemUpdateMap.push({ id: FinanceRebateItemID, rate: financeAmount });
                    }
                    if (OpcDiscount < 0) {
                        itemUpdateMap.push({ id: OpcDiscountItemID, rate: OpcDiscount });
                    }
                    if (SCWdDiscount < 0) {
                        itemUpdateMap.push({ id: SCWDItemID, rate: SCWdDiscount });
                    }
                    if (SpecialDis < 0) {
                        itemUpdateMap.push({ id: specialDiscountItemID, rate: SpecialDis });
                    }
                    if (addtionalAmount > 0) {
                        itemUpdateMap.push({ id: addtionalItemID, rate: addtionalAmount });
                    }
                    if (colourTopupAmount > 0) {
                        itemUpdateMap.push({ id: DiffColourItemID, rate: colourTopupAmount });
                    }

                    // First Remove existing Rebate Discount Lines
                    var itemIdsToDelete = [FinanceRebateItemID, InsuranceRebateItemID, OpcDiscountItemID, SCWDItemID, specialDiscountItemID, addtionalItemID];
                    var lineCount = soRec.getLineCount({ sublistId: 'item' });

                    for (var i = lineCount - 1; i >= 0; i--) {
                        var existingItemId = soRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
                        if (itemIdsToDelete.indexOf(parseInt(existingItemId)) !== -1) {
                            soRec.removeLine({
                                sublistId: 'item',
                                line: i
                            });
                        }
                    }

                    for (var i = 0; i < itemUpdateMap.length; i++) {
                        var itemId = itemUpdateMap[i].id;
                        var itemRate = itemUpdateMap[i].rate;
                        var found = false;

                        // Check existing lines to update Rebate Discount
                        // for (var j = 0; j < lineCount; j++) {
                        //     var existingItemId = soRec.getSublistValue({
                        //         sublistId: 'item',
                        //         fieldId: 'item',
                        //         line: j
                        //     });
                        //     if (parseInt(existingItemId) === itemId) {
                        //         soRec.selectLine({ sublistId: 'item', line: j });
                        //         soRec.setCurrentSublistValue({
                        //             sublistId: 'item',
                        //             fieldId: 'rate',
                        //             value: itemRate
                        //         });
                        //         soRec.commitLine({ sublistId: 'item' });
                        //         found = true;
                        //         break;
                        //     }
                        // }
                        // Add new line if not found

                        soRec.selectNewLine({ sublistId: 'item' });
                        var InventoryType = '';
                        if (itemId == addtionalItemID || itemId == DiffColourItemID) {
                            InventoryType = 15;
                        } else {
                            InventoryType = 8;
                        }
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
                try {
                    if (SpclDisciunt_level) {
                        soRec.setValue({ fieldId: 'custbody_package_max_approv_level', value: SpclDisciunt_level });
                        soRec.setValue({ fieldId: 'custbody_package_approval_status', value: 5 }); // Submit for Approval
                        var JsonEmail = GetEmailSetup_Approver();

                        soRec.setValue({ fieldId: 'custbody_package_current_approver', value: JsonEmail.approverSM });
                        soRec.setValue({ fieldId: 'custbody_packg_current_level_apprv', value: 1 });
                        if (SpclDisciunt_level == 2 || SpclDisciunt_level == 3) {
                            soRec.setValue({ fieldId: 'custbody_package_next_approver', value: JsonEmail.approverGM });
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
                        body = body.replace('@approver@', JsonEmail.approverSM_Text);
                        body = body.replace('@CustomerName@', Customer);
                        body = body.replace('@Model@', ModelText);
                        body = body.replace('@discount@', '$' + SpecialDis);

                        var approverSMEmail = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: JsonEmail.approverSM,
                            columns: ['email']
                        }).email;

                        email.send({
                            author: sender,
                            recipients: approverSMEmail,
                            subject: subject,
                            body: body,
                        });
                        log.debug('Email sent to ', approverSMEmail);

                    }
                    var updatedId = soRec.save();
                    log.debug('SO Saved', updatedId);

                    context.response.write(JSON.stringify({
                        success: true,
                        recordId: updatedId,
                        package_amount: packageAmount,
                        lineNum: lineNum
                    }));
                } catch (e) {
                    log.error('Error while saving Sales Order', e.message);
                    context.response.write(JSON.stringify({
                        success: false,
                        error: e.message || e.toString()
                    }));
                }

            }


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
                    "custrecord_sender_special_discount",

                ]
            });

            var emailBody = '', emailSubject = '';
            searchObj.run().each(function (result) {

                emailBody = result.getValue("custrecord_package_approver_body");
                emailSubject = result.getValue("custrecord_package_approver_subject");
                approverSM = result.getValue("custrecord_packg_approver_sm");
                approverSM_Text = result.getText("custrecord_packg_approver_sm");
                approverGM = result.getValue("custrecord_package_approver_gm");
                approverMD = result.getValue("custrecord_package_approver_md");
                sender = result.getValue("custrecord_sender_special_discount");
                return false;
            });

            log.error("emailSubject- > " + emailSubject, "emailBody-> " + emailBody);

            setupData.smEmailBody = emailBody;
            setupData.smEmailSubject = emailSubject;
            setupData.approverSM = approverSM;
            setupData.approverSM_Text = approverSM_Text;
            setupData.approverGM = approverGM;
            setupData.approverMD = approverMD;
            setupData.sender = sender;

            return setupData;
        };

        return {
            onRequest: onRequest
        };
    });

