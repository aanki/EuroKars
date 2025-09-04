/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/log', 'N/runtime', '/SuiteScripts/Salesforce Connection/JWT_token_salesforce', 'N/format', 'N/search', 'N/email', 'N/record'],
	(https, log, runtime, JWTtoken, format, search, email, record) => {

		const endPoint_URL = 'https://eurokars--devbox.sandbox.my.salesforce.com/services/apexrest/dms/v1/processdata/';
		var author = 141;
		var recipients = ['ankit.t@advectus.net'];
		var modelIds = [];
		var variantIds = [];
		var brandIds = ['1'];

		const execute = (scriptContext) => {

			// Get Access Token
			var barer_token = JWTtoken.getSalesforceAccessToken();
			if (barer_token && barer_token != null) {
				//header
				const header = {
					'Authorization': 'Bearer ' + barer_token,
					'Content-Type': 'application/json'
				};

				const script = runtime.getCurrentScript();

				const recordId = script.getParameter({ name: 'custscript_model_record_id' });
				const recParent = script.getParameter({ name: 'custscript_model_parent_id' });
				const custscript_record_type = script.getParameter({ name: 'custscript_record_type' });
				log.debug('Script Peramtere', 'recordId ' + recordId + ' recParent ' + recParent + ' custscript_record_type ' + custscript_record_type);

				if (recordId && recordId != null) { // means its triggered from Salesforce sync Button

					if (custscript_record_type == 'serializedinventoryitem') {
						if (recParent && recParent != null) {
							// Hit Model Variant AAPI
							push_model_variant(header, recordId);
						} else {
							// Hit Model AAPI
							push_model_data(header, recordId);
						}
					} else if (custscript_record_type == 'customrecord_advs_vm') {
						push_vehicle_master(header, recordId);

					} else if (custscript_record_type == 'customrecord_vsa_package') {
						push_pacakge(header, recordId, NewDateString, recParent);

					} else if (custscript_record_type == 'customrecord_vsa_package_item') {
						push_vsa_pacakge_item(header, recordId, NewDateString);

					} else if (custscript_record_type == 'customrecord_advs_st_model_option') {
						push_variant_colour(header, recordId, NewDateString);

					} else if (custscript_record_type == 'customrecord_insurance_susidy_rate') {
						push_insurance_subsidy_rate(header, recordId, NewDateString);

					} else if (custscript_record_type == 'customrecord_finance_rate') {
						push_finance_rate(header, recordId, NewDateString);
					}
					else if (custscript_record_type == 'salesorder') {
						push_vsa_vehicle_fin_cleared(header, recordId, NewDateString);
					}
					else if (custscript_record_type == 'customerdeposit') {
						push_deposit_bank_cleared(header, recordId, NewDateString);
					}
					else if (custscript_record_type == 'customer') {
						push_customer_particular_owner(header, recordId, NewDateString);
					}
					else if (custscript_record_type == 'customrecord_advs_ownership') {
						push_vehicle_ownership(header, recordId, NewDateString);
					}
					else if (custscript_record_type == 'customrecord_advs_coe_bid') {
						push_coe_bid(header, recordId, NewDateString, '');
					}

				} else {// means its triggered from Scheduled Script


					var DateObj = new Date();
					var NewDateObj = new Date(DateObj.getFullYear(), DateObj.getMonth(), (DateObj.getDate() - 2));
					log.debug("NewDateObj", NewDateObj);
					var NewDateString = format.format({ value: NewDateObj, type: format.Type.DATE });
					log.debug("NewDateString", NewDateString);

					// Hit API's to push Data into Salesforce
					push_model_data(header, recordId, NewDateString);
					push_model_variant(header, recordId, NewDateString);
					push_variant_colour(header, recordId, NewDateString);
					push_insurance_subsidy_rate(header, recordId, NewDateString);
					push_finance_rate(header, recordId, NewDateString);
					push_pacakge(header, recordId, NewDateString);
					push_vsa_pacakge_item(header, recordId, NewDateString);
					push_campaign(header, recordId, NewDateString);
					push_vehicle_master(header, recordId, NewDateString, '');
					push_coe_bid(header, recordId, NewDateString, '');
					push_customer_particular_owner(header, recordId, NewDateString, '');

				}
			}

		}
		function push_model_data(head, recordId, modified_date) {

			try {

				var custom_filter = "";
				if (recordId && recordId != null) {// Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custitem_sync_salesforce", "is", "T"]
					]
				}
				else {

					var custom_filter = [
						["custitem_advs_inventory_type", "anyof", "1"],
						"AND",
						["isinactive", "is", "F"],
						"AND",
						["isserialitem", "is", "T"],
						"AND",
						["parent", "anyof", "@NONE@"],
						"AND",
						["custitem_advs_st_is_model", "is", "T"],
						"AND",
						["modified", "onorafter", modified_date],
						"AND",
						["custitem_sync_salesforce", "is", "T"],
						"AND",
						["custitem_advs_st_vehicle_make", "anyof", "1"], // Only Mazda
						"AND",
						["type", "anyof", "InvtPart"]
					]
				}
				log.debug("custom_filter Model", custom_filter);
				var searchResults = search.create({
					type: "item",
					filters: custom_filter,

					columns: [
						search.createColumn({ name: "displayname" }),
						search.createColumn({ name: "itemid" }),
						search.createColumn({ name: "isinactive" }),
						search.createColumn({ name: "created" }),
						search.createColumn({ name: "modified" }),
						search.createColumn({ name: "custitem_advs_st_vehicle_make" }),
						search.createColumn({ name: "purchasedescription" }),
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custitem_advs_sf_id" }),
						search.createColumn({ name: "email", join: "CUSTITEM_CREATED_BY", label: "Email" })

					]
				});

				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const modelDesc = result.getValue({ name: "displayname" }) || "";
						const model_name = result.getValue({ name: "itemid" }) || "";
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const created_date = result.getValue({ name: "created" }) || "";
						const modified_date = result.getValue({ name: "modified" }) || "";
						const internalid = result.getValue({ name: "internalid" }) || "";
						const brnad = result.getText({ name: "custitem_advs_st_vehicle_make" }) || "";
						const pur_des = result.getValue({ name: "purchasedescription" }) || "";
						const sfid = result.getValue({ name: "custitem_advs_sf_id" }) || "";
						const created_email = result.getValue({ name: "email", join: "CUSTITEM_CREATED_BY", label: "Email" }) || "";


						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sfid,
								Manufacturer: brnad,
								ModelName: model_name,
								ModelDescription: pur_des,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString', jsonString_model);


				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertModel',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response', postResponse.body);
				update_sfid_indms(postResponse.body, 'serializedinventoryitem', 'custitem_advs_sf_id', 'custitem_advs_sf_res', 'custitem_sf_sync_time_model');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {
				log.error({
					title: 'Error in push_model_data',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push Model Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});
			}
		}


		function push_model_variant(head, recordId, modified_date) {

			try {

				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custitem_sync_salesforce", "is", "T"]
					]
				}
				else {

					var custom_filter = [

						["isinactive", "is", "F"],
						"AND",
						["isserialitem", "is", "T"],
						"AND",
						["parent", "noneof", "@NONE@"],
						"AND",
						["custitem_advs_st_is_model", "is", "T"],
						"AND",
						["modified", "onorafter", modified_date],
						"AND",
						["custitem_sync_salesforce", "is", "T"],
						"AND",
						["custitem_advs_st_vehicle_make", "anyof", "1"], // Only Mazda
						"AND",
						["type", "anyof", "InvtPart"]
					]

				}

				log.debug("custom_filter Variant", custom_filter);
				var searchResults = search.create({
					type: "item",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "displayname" }),
						search.createColumn({ name: "itemid" }),
						search.createColumn({ name: "isinactive" }),
						search.createColumn({ name: "created" }),
						search.createColumn({ name: "modified" }),
						search.createColumn({ name: "custitem_advs_st_vehicle_make" }),
						search.createColumn({ name: "purchasedescription" }),
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "parent" }),
						search.createColumn({ name: "custitem_advs_item_category" }),
						search.createColumn({ name: "custitem_advs_sf_id" }),
						search.createColumn({ name: "email", join: "CUSTITEM_CREATED_BY", label: "Email" })
					]
				});

				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const modelDesc = result.getValue({ name: "displayname" }) || "";
						const model_name = result.getValue({ name: "itemid" }) || "";
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const created_date = result.getValue({ name: "created" }) || "";
						const modified_date = result.getValue({ name: "modified" }) || "";
						const internalid = result.getValue({ name: "internalid" }) || "";
						const brnad = result.getText({ name: "custitem_advs_st_vehicle_make" }) || "";
						const pur_des = result.getValue({ name: "purchasedescription" }) || "";
						const parent = result.getValue({ name: "parent" }) || "";
						const veh_cat = result.getText({ name: "custitem_advs_item_category" }) || "";
						const sfid = result.getValue({ name: "custitem_advs_sf_id" }) || "";
						const created_email = result.getValue({ name: "email", join: "CUSTITEM_CREATED_BY", label: "Email" }) || "";

						const VariCode = model_name.split(':')[1]?.trim() || "";

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfID: sfid,
								Manufacturer: brnad,
								modelDmsId: parent,
								variantCode: VariCode,
								variantName: model_name,
								variantDescription: pur_des,
								vehicleCategory: veh_cat,
								ves: "",
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString Model Variant', jsonString_model);


				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertVariant',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response Model Variant', postResponse.body);
				update_sfid_indms(postResponse.body, 'serializedinventoryitem', 'custitem_advs_sf_id', 'custitem_advs_sf_res', 'custitem_sf_sync_time_model');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {
				log.error({
					title: 'Error in push_model_variant',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push Model Variant  Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});
			}
		}

		function push_variant_colour(head, recordId, modified_date) {

			try {

				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_sync_salesforce_color", "is", "T"]
					]
				}
				else {

					var custom_filter = [

						["isinactive", "is", "F"],
						"AND",
						["custrecord_st_m_o_type", "anyof", "2"], // Exterior Colour
						"AND",
						["custrecord_sync_salesforce_color", "is", "T"],
						"AND",
						["custrecord_st_m_o_make", "anyof", "1"], // Only Mazda
						"AND",
						["lastmodified", "onorafter", modified_date]

					]

				}

				log.debug("custom_filter Variant colour", custom_filter);
				var searchResults = search.create({
					type: "customrecord_advs_st_model_option",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_st_m_o_make" }),
						search.createColumn({ name: "parent", join: "custrecord_st_m_o_head_link", label: "Parent" }),
						search.createColumn({ name: "custrecord_st_m_o_head_link" }),
						search.createColumn({ name: "custrecord_st_m_o_description" }),
						search.createColumn({ name: "email", join: "custrecord_created_by_colour_", label: "Email" }),
						search.createColumn({ name: "isinactive" }),
						search.createColumn({ name: "name" }),
						search.createColumn({ name: "custrecord_advs_m_o_o_price" }),
						search.createColumn({ name: "custrecord_salesforce_id_colour" }),
						search.createColumn({ name: "custrecord_st_m_o_code" })
					]
				});

				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const brnad = result.getText({ name: "custrecord_st_m_o_make" }) || "";
						const verDMSID = result.getValue({ name: "custrecord_st_m_o_head_link" }) || "";
						const parentID = result.getValue({ name: "parent", join: "custrecord_st_m_o_head_link", label: "Parent" }) || "";
						const colourCode = result.getValue({ name: "custrecord_st_m_o_code" }) || "";
						const colourName = result.getValue({ name: "name" }) || "";
						const colourDes = result.getValue({ name: "custrecord_st_m_o_description" }) || "";
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sfid = result.getValue({ name: "custrecord_salesforce_id_colour" }) || "";
						const topUpAmount = result.getValue({ name: "custrecord_advs_m_o_o_price" }) || 0;
						const created_email = result.getValue({ name: "email", join: "custrecord_created_by_colour_", label: "Email" }) || "";

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sfid,
								Manufacturer: brnad,
								modelDmsId: parentID,
								variantDmsId: verDMSID,
								colourCode: colourCode,
								colourName: colourName,
								colourDescription: colourDes,
								topUpAmount: topUpAmount,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString Variant Colour', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertVariantColour',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response Variant Colour', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_advs_st_model_option', 'custrecord_salesforce_id_colour', 'custrecord_salesforce_res_colour', 'custrecord_sf_sync_time_colour');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_variant_colour',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push Variant Colour Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}


		function push_insurance_subsidy_rate(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_sync_salesforce_subsidy", "is", "T"]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_sync_salesforce_subsidy", "is", "T"],
						"AND",
						["custrecord_insurance_company", "anyof", "1"], // Only Mazda
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_insurance_susidy_rate", custom_filter);
				var searchResults = search.create({
					type: "customrecord_insurance_susidy_rate",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_insurance_period" }),
						search.createColumn({ name: "custrecord_insurance_susidy_amount" }),
						search.createColumn({ name: "custrecord_insurance_company" }),
						search.createColumn({ name: "custrecord_salesforce_id_insu" }),
						search.createColumn({ name: "email", join: "custrecord_created_by", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const company = result.getText({ name: "custrecord_insurance_company" }) || "";
						const InsuPrd = result.getValue({ name: "custrecord_insurance_period" }) || "";
						const InsAmnt = result.getValue({ name: "custrecord_insurance_susidy_amount" }) || 0;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sfid = result.getValue({ name: "custrecord_salesforce_id_insu" }) || "";
						const created_email = result.getValue({ name: "email", join: "custrecord_created_by", label: "Email" }) || "";

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sfid,
								insurancePeriod: InsuPrd,
								insuranceSubsidyAmount: InsAmnt,
								company: company,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString Insurance subsidy Rate', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertInsuranceSubsidyRate',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response Insurance subsidy Rate', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_insurance_susidy_rate', 'custrecord_salesforce_id_insu', 'custrecord_salesforce_res_insu', 'custrecord_sf_sync_time_ins');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_Insurance subsidy Rate',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push Insurance subsidy Rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}

		function push_finance_rate(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_sync_salesforce_finance", "is", "T"]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_sync_salesforce_finance", "is", "T"],
						"AND",
						["custrecord_company_frate", "anyof", brandIds], // Only Mazda
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_finance_rate", custom_filter);
				var searchResults = search.create({
					type: "customrecord_finance_rate",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_bank_frate" }),
						search.createColumn({ name: "custrecord_bank_package_frate" }),
						search.createColumn({ name: "custrecord_finance_term" }),
						search.createColumn({ name: "custrecord_sdate_frate" }),
						search.createColumn({ name: "custrecord_edate_frate" }),
						search.createColumn({ name: "custrecord_finance_loan_min" }),
						search.createColumn({ name: "custrecord_finance_loan_max" }),
						search.createColumn({ name: "custrecord_finance_full_loan" }),
						search.createColumn({ name: "custrecord_finance_interest_rate" }),
						search.createColumn({ name: "custrecord_finance_rebate" }),
						search.createColumn({ name: "custrecord_finance_interest_pkg_code" }),
						search.createColumn({ name: "custrecord_company_frate" }),
						search.createColumn({ name: "custrecord_salesforce_id_finance" }),
						search.createColumn({ name: "email", join: "custrecord_finance_createdby", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const bank = result.getText({ name: "custrecord_bank_frate" }) || "";
						const bank_pkg = result.getText({ name: "custrecord_bank_package_frate" }) || "";
						const term = result.getValue({ name: "custrecord_finance_term" }) || "";
						const S_Date = result.getValue({ name: "custrecord_sdate_frate" }) || "";
						const E_Date = result.getValue({ name: "custrecord_edate_frate" }) || "";
						const min_loan = result.getValue({ name: "custrecord_finance_loan_min" }) || 0;
						const max_loan = result.getValue({ name: "custrecord_finance_loan_max" }) || 0;
						const allow_full_loan = result.getValue({ name: "custrecord_finance_full_loan" }) || false;
						const inrst_rate = result.getValue({ name: "custrecord_finance_interest_rate" }) || 0;
						const rebate = result.getValue({ name: "custrecord_finance_rebate" }) || false;
						const inrst_pkg_code = result.getValue({ name: "custrecord_finance_interest_pkg_code" }) || "";
						const company = (result.getText({ name: "custrecord_company_frate" }) || "").split(',').join(';');
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sfid = result.getValue({ name: "custrecord_salesforce_id_finance" }) || "";
						const created_email = result.getValue({ name: "email", join: "custrecord_finance_createdby", label: "Email" }) || "";

						var startDate, endDate;
						// Convert date to YYYY-MM-DD format
						if (S_Date) {
							startDate = convertDateToYMD(S_Date);
						}
						if (E_Date) {
							endDate = convertDateToYMD(E_Date);
						}

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sfid,
								bank: bank,
								bankPackage: bank_pkg,
								term: term,
								startDate: startDate,
								endDate: endDate,
								minLoanAmount: min_loan,
								maxLoanAmount: max_loan,
								allowFullLoan: allow_full_loan,
								interestRate: inrst_rate,
								financeRebate: rebate,
								interestPackageCode: inrst_pkg_code,
								company: company,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString finance_rate', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertFinanceRate',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response finance_rate', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_finance_rate', 'custrecord_salesforce_id_finance', 'custrecord_sf_res_fin', 'custrecord_sf_sync_time_fin');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_finance_rate',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}

		function push_pacakge(head, recordId, modified_date, recParent) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_sync_salesforce_package", "is", "T"]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_sync_salesforce_package", "is", "T"],
						"AND",
						["custrecord_manufacture_vsa_pckg", "anyof", "1"], // Only Mazda
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_vsa_package", custom_filter);
				var searchResults = search.create({
					type: "customrecord_vsa_package",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "name" }),
						search.createColumn({ name: "custrecord_salesforce_id_package" }),
						search.createColumn({ name: "custrecord_manufacture_vsa_pckg" }),
						search.createColumn({ name: "custrecord_model_vsa_pckg" }),
						search.createColumn({ name: "custrecord_variant_vsa_pckg" }),
						search.createColumn({ name: "custrecord_variant_colour_vsa_pckg" }),
						search.createColumn({ name: "custrecord_no_coe_bids" }),
						search.createColumn({ name: "custrecord_list_price" }),
						search.createColumn({ name: "custrecord_pckg_dis" }),
						search.createColumn({ name: "custrecord_auto_cal_vsa" }),
						search.createColumn({ name: "custrecord_validy_start_date" }),
						search.createColumn({ name: "custrecord_validy_end_date" }),
						search.createColumn({ name: "custrecord_specif_pckg" }),
						search.createColumn({ name: "custrecord_coe_threshold" }),
						search.createColumn({ name: "custrecord_purchase_price_fob_yen" }),
						search.createColumn({ name: "custrecord_freight_insu_pckg" }),
						search.createColumn({ name: "custrecord_yen_exrate" }),
						search.createColumn({ name: "custrecord_coe_rebate_vsa" }),
						search.createColumn({ name: "custrecord_coe_rebate_l_vsa" }),
						search.createColumn({ name: "custrecord_non_gurante_coe_discount" }),
						search.createColumn({ name: "custrecord_coe_rebate_m_vsa" }),
						search.createColumn({ name: "custrecord_non_gurante_coe_discount_m" }),
						search.createColumn({ name: "custrecord_coe_rebate_s_vsa" }),
						search.createColumn({ name: "custrecord_non_gurante_coe_discount_s" }),
						search.createColumn({ name: "custrecord_booking_deposit_normal_vsa" }),
						search.createColumn({ name: "custrecord_booking_deposit_vsa" }),
						search.createColumn({ name: "custrecord_over_trade" }),
						search.createColumn({ name: "custrecord_adopter_discount_vsa" }),
						search.createColumn({ name: "custrecord_opc_dis" }),
						search.createColumn({ name: "custrecord_scwd" }),
						search.createColumn({ name: "custrecord_finance_rebate_pckg" }),
						search.createColumn({ name: "custrecord_insurance_rebate" }),
						search.createColumn({ name: "custrecord_mvc_resale_new_car" }),
						search.createColumn({ name: "custrecord_mvc_resale_used_car" }),
						search.createColumn({ name: "custrecord_mvc_scraped_new_car" }),
						search.createColumn({ name: "custrecord_mvc_scraped_used_car" }),
						search.createColumn({ name: "custrecord_mvc_scraped_service" }),
						search.createColumn({ name: "custrecord_spcl_dis_sm" }),
						search.createColumn({ name: "custrecord_spcl_dis_gm" }),
						search.createColumn({ name: "custrecord_spcl_dis_md" }),
						search.createColumn({ name: "custrecord_fleet_pckg" }),
						search.createColumn({ name: "email", join: "custrecord_created_by_vsapacakge", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const pckg_name = result.getValue({ name: "name" }) || "";
						const sf_id = result.getValue({ name: "custrecord_salesforce_id_package" }) || "";
						const manufacturee = result.getText({ name: "custrecord_manufacture_vsa_pckg" }) || "";
						const modelid = result.getValue({ name: "custrecord_model_vsa_pckg" }) || "";
						const variantID = result.getValue({ name: "custrecord_variant_vsa_pckg" }) || "";
						const variantColourID = result.getValue({ name: "custrecord_variant_colour_vsa_pckg" }) || "";
						const coe_bids = result.getValue({ name: "custrecord_no_coe_bids" }) || 0;
						const list_price = result.getValue({ name: "custrecord_list_price" }) || 0;
						const pacakge_des = result.getValue({ name: "custrecord_pckg_dis" }) || "";
						const auto_calc = result.getValue({ name: "custrecord_auto_cal_vsa" }) || false;
						const S_date = result.getValue({ name: "custrecord_validy_start_date" }) || "";
						const E_date = result.getValue({ name: "custrecord_validy_end_date" }) || "";
						const specific_pckg = result.getValue({ name: "custrecord_specif_pckg" }) || false;
						const coe_thres = result.getValue({ name: "custrecord_coe_threshold" }) || 0;
						const pur_price_fob = result.getValue({ name: "custrecord_purchase_price_fob_yen" }) || 0;
						const freight_insu = result.getValue({ name: "custrecord_freight_insu_pckg" }) || 0;
						const yen_exrate = result.getValue({ name: "custrecord_yen_exrate" }) || 0;
						const coe_rebate = result.getValue({ name: "custrecord_coe_rebate_vsa" }) || 0;
						const coe_rebateL = result.getValue({ name: "custrecord_coe_rebate_l_vsa" }) || 0;
						const non_gurante_coeDis = result.getValue({ name: "custrecord_non_gurante_coe_discount" }) || 0;
						const coe_rebate_m = result.getValue({ name: "custrecord_coe_rebate_m_vsa" }) || 0;
						const coe_discount_m = result.getValue({ name: "custrecord_non_gurante_coe_discount_m" }) || 0;
						const coe_rebate_s = result.getValue({ name: "custrecord_coe_rebate_s_vsa" }) || 0;
						const non_gurante_coe_discount_s = result.getValue({ name: "custrecord_non_gurante_coe_discount_s" }) || 0;
						const booking_deposit_normal = result.getValue({ name: "custrecord_booking_deposit_normal_vsa" }) || 0;
						const booking_deposit = result.getValue({ name: "custrecord_booking_deposit_vsa" }) || 0;
						const over_trade = result.getValue({ name: "custrecord_over_trade" }) || 0;
						const adopter_discount_vsa = result.getValue({ name: "custrecord_adopter_discount_vsa" }) || 0;
						const opc_dis = result.getValue({ name: "custrecord_opc_dis" }) || 0;
						const scwd = result.getValue({ name: "custrecord_scwd" }) || 0;
						const finance_rebate_pckg = result.getValue({ name: "custrecord_finance_rebate_pckg" }) || 0;
						const insurance_rebate = result.getValue({ name: "custrecord_insurance_rebate" }) || 0;
						const mvc_resale_new_car = result.getValue({ name: "custrecord_mvc_resale_new_car" }) || 0;
						const mvc_resale_used_car = result.getValue({ name: "custrecord_mvc_resale_used_car" }) || 0;
						const mvc_scraped_new_car = result.getValue({ name: "custrecord_mvc_scraped_new_car" }) || 0;
						const mvc_scraped_used_car = result.getValue({ name: "custrecord_mvc_scraped_used_car" }) || 0;
						const mvc_scraped_service = result.getValue({ name: "custrecord_mvc_scraped_service" }) || 0;
						const spcl_dis_sm = result.getValue({ name: "custrecord_spcl_dis_sm" }) || 0;
						const spcl_dis_gm = result.getValue({ name: "custrecord_spcl_dis_gm" }) || 0;
						const spcl_dis_md = result.getValue({ name: "custrecord_spcl_dis_md" }) || 0;
						const fleet_pckg = result.getValue({ name: "custrecord_fleet_pckg" }) || false;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const created_email = result.getValue({ name: "email", join: "custrecord_created_by_vsapacakge", label: "Email" }) || "";

						var startDate, endDate;
						//Convert date to YYYY-MM-DD format
						if (S_date) {
							startDate = convertDateToYMD(S_date);
						}
						if (E_date) {
							endDate = convertDateToYMD(E_date);
						}

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sf_id,
								packageName: pckg_name,
								manufacturer: manufacturee,
								modelDmsId: modelid,
								variantDmsId: variantID,
								variantColourDmsId: variantColourID,
								numberOfCoeBids: coe_bids,
								listPrice: list_price,
								packageDescription: pacakge_des,
								autoCalculate: auto_calc,
								validityStartDate: startDate,
								validityEndDate: endDate,
								specificPackage: specific_pckg,
								coeThreshold: coe_thres,
								purchasePrice: pur_price_fob,
								freightInsurance: freight_insu,
								exchangeRate: yen_exrate,
								coeRebateG: coe_rebate,
								coeRebateL: coe_rebateL,
								nonGuaranteedCoeDiscountL: non_gurante_coeDis,
								coeRebateM: coe_rebate_m,
								nonGuaranteedCoeDiscountM: coe_discount_m,
								coeRebateS: coe_rebate_s,
								nonGuaranteedCoeDiscountS: non_gurante_coe_discount_s,
								bookingDepositNormal: booking_deposit_normal,
								bookingDepositIndent: booking_deposit,
								overTrade: over_trade,
								adopterDiscount: adopter_discount_vsa,
								opcDiscount: opc_dis,
								scwd: scwd,
								financeRebate: finance_rebate_pckg,
								insuranceRebate: insurance_rebate,
								mvcResaleNewCar: mvc_resale_new_car,
								mvcResaleUsedCar: mvc_resale_used_car,
								mvcScrappedNewCar: mvc_scraped_new_car,
								mvcScrappedUsedCar: mvc_scraped_used_car,
								mvcScrappedServiceCredit: mvc_scraped_service,
								specialDiscountSM: spcl_dis_sm,
								specialDiscountGM: spcl_dis_gm,
								specialDiscountMD: spcl_dis_md,
								fleetPackage: fleet_pckg,
								recordTypeName: "Mazda Package",
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_vsa_pacakge', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertPackage',
					headers: head,
					body: jsonString_model
				});
				var responseData = JSON.parse(postResponse.body);
				log.debug('POST response push_vsa_pacakge', responseData);

				update_sfid_indms(postResponse.body, 'customrecord_vsa_package', 'custrecord_salesforce_id_package', 'custrecord_sf_res_pckg', 'custrecord_sf_sync_time_packg');
				if (responseData[0].statusCode === '200' || responseData[0].statusCode === '201') {
					if (recParent == 'allitems') {
						push_vsa_pacakge_item_with_Master(head, recordId);
					}
				}
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_vsa_pacakge',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push vsa_package Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}
		function push_vsa_pacakge_item_with_Master(head, MasterrecordId) {

			try {

				var custom_filter = [
					["isinactive", "is", "F"],
					"AND",
					["custrecord_sync_salesforce_pckg_item", "is", "T"],
					"AND",
					["custrecord_master_packg.custrecord_manufacture_vsa_pckg", "anyof", "1"], // Only Mazda
					"AND",
					["custrecord_master_packg", "anyof", MasterrecordId]
				]

				log.debug("customrecord_vsa_package_item", custom_filter);
				var searchResults = search.create({
					type: "customrecord_vsa_package_item",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_master_packg" }),
						search.createColumn({ name: "name" }),
						search.createColumn({ name: "custrecord_pckg_iem_cost_group" }),
						search.createColumn({ name: "custrecord_pckg_item_appear_quote" }),
						search.createColumn({ name: "custrecord_pckg_line_item_app" }),
						search.createColumn({ name: "custrecord_include_price_list" }),
						search.createColumn({ name: "custrecord_pckg_item_type" }),
						search.createColumn({ name: "custrecord_pckgitem_optout" }),
						search.createColumn({ name: "custrecord_pckgitem_optin" }),
						search.createColumn({ name: "custrecord_pckg_item_cost" }),
						search.createColumn({ name: "custrecord_salesforce_id_pckg_item" }),
						search.createColumn({ name: "email", join: "custrecord_created_by_vsapacakgeitem", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const PckgID = result.getValue({ name: "custrecord_master_packg" }) || "";
						const pckg_item_name = result.getValue({ name: "name" }) || "";
						const cost_group = result.getText({ name: "custrecord_pckg_iem_cost_group" }) || "";
						const appera_quote = result.getValue({ name: "custrecord_pckg_item_appear_quote" }) || false;
						const line_item_app = result.getText({ name: "custrecord_pckg_line_item_app" }) || "";
						const include_price_list = result.getValue({ name: "custrecord_include_price_list" }) || false;
						const item_type = result.getText({ name: "custrecord_pckg_item_type" }) || "";
						const opt_out = result.getValue({ name: "custrecord_pckgitem_optout" }) || null;
						const opt_in = result.getValue({ name: "custrecord_pckgitem_optin" }) || null;
						const cost = result.getValue({ name: "custrecord_pckg_item_cost" }) || 0;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sf_id = result.getValue({ name: "custrecord_salesforce_id_pckg_item" }) || "";
						const created_email = result.getValue({ name: "email", join: "custrecord_created_by_vsapacakgeitem", label: "Email" }) || "";


						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sf_id,
								packageDmsId: PckgID,
								packageItemName: pckg_item_name,
								costGroup: cost_group,
								appearInQuote: appera_quote,
								lineItemAppearance: line_item_app,
								includedInPriceList: include_price_list,
								packageItemType: item_type,
								optOutValue: opt_out,
								optInValue: opt_in,
								costPrice: cost,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_vsa_pacakge_item_with_Master', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertPackageItem',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response push_vsa_pacakge_item_with_Master', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_vsa_package_item', 'custrecord_salesforce_id_pckg_item', 'custrecord_sf_res_pckg_item', 'custrecord_sf_sync_time_pckitem');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_vsa_pacakge_item_with_Master',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push vsa_package_item Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}

		function push_vsa_pacakge_item(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_sync_salesforce_pckg_item", "is", "T"]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_sync_salesforce_pckg_item", "is", "T"],
						"AND",
						["custrecord_master_packg.custrecord_manufacture_vsa_pckg", "anyof", "1"], // Only Mazda
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_vsa_package_item", custom_filter);
				var searchResults = search.create({
					type: "customrecord_vsa_package_item",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_master_packg" }),
						search.createColumn({ name: "name" }),
						search.createColumn({ name: "custrecord_pckg_iem_cost_group" }),
						search.createColumn({ name: "custrecord_pckg_item_appear_quote" }),
						search.createColumn({ name: "custrecord_pckg_line_item_app" }),
						search.createColumn({ name: "custrecord_include_price_list" }),
						search.createColumn({ name: "custrecord_pckg_item_type" }),
						search.createColumn({ name: "custrecord_pckgitem_optout" }),
						search.createColumn({ name: "custrecord_pckgitem_optin" }),
						search.createColumn({ name: "custrecord_pckg_item_cost" }),
						search.createColumn({ name: "custrecord_salesforce_id_pckg_item" }),
						search.createColumn({ name: "email", join: "custrecord_created_by_vsapacakgeitem", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const PckgID = result.getValue({ name: "custrecord_master_packg" }) || "";
						const pckg_item_name = result.getValue({ name: "name" }) || "";
						const cost_group = result.getText({ name: "custrecord_pckg_iem_cost_group" }) || "";
						const appera_quote = result.getValue({ name: "custrecord_pckg_item_appear_quote" }) || false;
						const line_item_app = result.getText({ name: "custrecord_pckg_line_item_app" }) || "";
						const include_price_list = result.getValue({ name: "custrecord_include_price_list" }) || false;
						const item_type = result.getText({ name: "custrecord_pckg_item_type" }) || "";
						const opt_out = result.getValue({ name: "custrecord_pckgitem_optout" }) || null;
						const opt_in = result.getValue({ name: "custrecord_pckgitem_optin" }) || null;
						const cost = result.getValue({ name: "custrecord_pckg_item_cost" }) || 0;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sf_id = result.getValue({ name: "custrecord_salesforce_id_pckg_item" }) || "";
						const created_email = result.getValue({ name: "email", join: "custrecord_created_by_vsapacakgeitem", label: "Email" }) || "";



						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sf_id,
								packageDmsId: PckgID,
								packageItemName: pckg_item_name,
								costGroup: cost_group,
								appearInQuote: appera_quote,
								lineItemAppearance: line_item_app,
								includedInPriceList: include_price_list,
								packageItemType: item_type,
								optOutValue: opt_out,
								optInValue: opt_in,
								costPrice: cost,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString vsa_package_item', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertPackageItem',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response vsa_package_item', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_vsa_package_item', 'custrecord_salesforce_id_pckg_item', 'custrecord_sf_res_pckg_item', 'custrecord_sf_sync_time_pckitem');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_vsa_package_item',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push vsa_package_item Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}

		function push_campaign(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custevent_send_salesforce_cam", "is", "T"]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["lastmodifieddate", "onorafter", modified_date],
						"AND",
						["custevent_send_salesforce_cam", "is", "T"],
						"AND",
						["campaigneventtype", "anyof", "EMAIL"]
					]
				}
				log.debug("campaign", custom_filter);
				var searchResults = search.create({
					type: "campaign",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "title" }),

						search.createColumn({ name: "custevent_parent_campaign" }),
						search.createColumn({ name: "category" }),
						search.createColumn({ name: "message" }),
						search.createColumn({ name: "status" }),
						search.createColumn({ name: "startdate" }),
						search.createColumn({ name: "enddate" }),
						search.createColumn({ name: "custevent_num_sent_campaign" }),
						search.createColumn({ name: "custevent_expected_response" }),
						search.createColumn({ name: "custevent_budgete_cost" }),
						search.createColumn({ name: "cost" }),
						search.createColumn({ name: "expectedrevenue" }),
						search.createColumn({ name: "email", join: "custevent_created_by_campaign", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" }) || "";
						const campaignName = result.getValue({ name: "title" }) || "";
						const parentCampaignDmsId = result.getValue({ name: "custevent_parent_campaign" }) || "";
						const campaignType = result.getText({ name: "category" }) || "";
						const campaignDescription = result.getValue({ name: "message" }) || "";
						const status = result.getText({ name: "status" }) || "";
						const startDate = result.getValue({ name: "startdate" }) || "";
						const endDate = result.getValue({ name: "enddate" }) || "";
						const numberSentInCampaign = result.getValue({ name: "custevent_num_sent_campaign" }) || 0;
						const expectedResponsePercentage = result.getValue({ name: "custevent_expected_response" }) || 0;
						const budgetedCostInCampaign = result.getValue({ name: "custevent_budgete_cost" }) || null;
						let ActualCostInCampaign = result.getValue({ name: "cost" }) || null;
						const expectedrevenue = result.getValue({ name: "expectedrevenue" }) || null;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const created_email = result.getValue({ name: "email", join: "custevent_created_by_campaign", label: "Email" }) || "";

						var startDateN = null, endDateN = null;
						//Convert date to YYYY-MM-DD format
						if (startDate) {
							startDateN = convertDateToYMD(startDate);
						}
						if (endDate) {
							endDateN = convertDateToYMD(endDate);
						}
						var ActualCostInCampaignNew = (ActualCostInCampaign && ActualCostInCampaign.trim() !== '' && ActualCostInCampaign.trim() !== '.00')
							? parseInt(parseFloat(ActualCostInCampaign))
							: null;

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								campaignName: campaignName,
								parentCampaignDmsId: parentCampaignDmsId,
								campaignType: campaignType,
								campaignDescription: campaignDescription,
								status: status,
								startDate: startDateN,
								endDate: endDateN,
								numberSentInCampaign: numberSentInCampaign,
								expectedResponsePercentage: expectedResponsePercentage,
								budgetedCostInCampaign: budgetedCostInCampaign,
								ActualCostInCampaign: ActualCostInCampaignNew,
								expectedrevenue: expectedrevenue,
								recordTypeName: "Mazda",
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString campaign', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertCampaign',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response campaign', postResponse.body);
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_campaign',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push vsa_campaign Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}




		function push_vehicle_master(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_send_salesforce_vm", "is", "T"]
					]
				}
				else {
					custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["lastmodified", "onorafter", modified_date],
						"AND",
						["custrecord_advs_vm_vehicle_brand", "anyof", "1"], // Only Mazda
						"AND",
						["custrecord_send_salesforce_vm", "is", "T"],
						"AND",
						["custrecord_advs_vm_subsidary", "noneof", "19"], // Not EPOPL
						"AND",
						["custrecord_appvantage", "is", "F"]
					]
				}
				log.debug("customrecord_advs_vm", custom_filter);
				var searchResults = search.create({
					type: "customrecord_advs_vm",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "name" }),
						search.createColumn({ name: "custrecord_salesforce_id_stock" }),
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
						search.createColumn({ name: "custrecord_approx_omv" }),
						search.createColumn({ name: "email", join: "custrecord_created_by_vm", label: "Email" }),
						search.createColumn({ name: "isinactive" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

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
						var omv = result.getValue({ name: "custrecord_approx_omv" }) || null;
						const isinactive = result.getValue({ name: "isinactive" }) || "";
						const sf_id = result.getValue({ name: "custrecord_salesforce_id_stock" }) || "";
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

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								action: 'UPSERT_UNSOLD_VEHICLE_STOCK',
								dmsId: internalid,
								sfId: sf_id,
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
								baseCarCostApproximateOMV: omv,
								dutyPaidOMV: null,
								Active: (isinactive == "T" || isinactive == true) ? false : true,
								recordOwnerEmail: created_email
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString vehicle_master', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertVehicleStock',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response vehicle_master', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_advs_vm', 'custrecord_salesforce_id_stock', 'custrecord_sf_res_stock', 'custrecord_sf_sync_time_vechile');
				store_BufferTale(postResponse.body, jsonString_model);
			} catch (error) {

				log.error({
					title: 'Error in push_vehicle_master',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push vehicle_master Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}
		function push_vsa_vehicle_fin_cleared(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["mainline", "is", "T"],
						"AND",
						["custbody_advs_salesforceid", "isnotempty", ""]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custbody_advs_salesforceid", "isnotempty", ""],
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("salesorder", custom_filter);
				var searchResults = search.create({
					type: "salesorder",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custbody_advs_vehicle_admin_cleared" }),
						search.createColumn({ name: "custbody_fin_cleared" }),
						search.createColumn({ name: "custbody_advs_salesforceid" })

					]
				});
				const modelList = [];

				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" });
						const veh_cleared = result.getValue({ name: "custbody_advs_vehicle_admin_cleared" });
						const fin_cleared = result.getValue({ name: "custbody_fin_cleared" });
						const sf_id = result.getValue({ name: "custbody_advs_salesforceid" });

						if (veh_cleared || fin_cleared) {
							modelList.push({
								dmsId: internalid,
								action: 'UPDATE_CLEARED_INFO',
								vehicleAdminCleared: veh_cleared,
								financeCleared: fin_cleared
							});
						}


					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_vsa_vehicle_fin_cleared', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'updateVSA',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response push_vsa_vehicle_fin_cleared', postResponse.body);
				//update_sfid_indms(postResponse.body, 'customrecord_finance_rate', 'custrecord_salesforce_id_finance','custrecord_sf_res_fin');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_finance_rate',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}
		function push_deposit_bank_cleared(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custbody_advs_salesforceid", "isnotempty", ""]

					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custbody_advs_salesforceid", "isnotempty", ""],
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customerdeposit", custom_filter);
				var searchResults = search.create({
					type: "customerdeposit",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custbody_bank_cleared" }),
						search.createColumn({ name: "custbody_advs_salesforceid" })

					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" });
						const bank_cleared = result.getValue({ name: "custbody_bank_cleared" });
						const sf_id = result.getValue({ name: "custbody_advs_salesforceid" });

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								financeRemarks: '',
								bankCleared: bank_cleared
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_deposit_bank_cleared', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'updateVSADeposit',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response push_deposit_bank_cleared', postResponse.body);
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in push_finance_rate',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}
		function push_coe_bid(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_coe_bid_vsa.custbody_advs_salesforceid", "isnotempty", ""]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_coe_bid_vsa.custbody_advs_salesforceid", "isnotempty", ""],
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_advs_coe_bid", custom_filter);
				var searchResults = search.create({
					type: "customrecord_advs_coe_bid",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_salesforce_id_coe" }),
						search.createColumn({ name: "custrecord_coe_bid_vsa" }),
						search.createColumn({ name: "custrecord_coe_bid_status" }),
						search.createColumn({ name: "custrecord_coe_bid_submission_date" }),
						search.createColumn({ name: "custrecord_coe_bid_amount" }),
						search.createColumn({ name: "custrecord_coe_bid_category" }),
						search.createColumn({ name: "custrecord_coe_bid_premium_paid" }),
						search.createColumn({ name: "custrecord_coe_bid_expiry_date" })

					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" });
						const vsaID = result.getValue({ name: "custrecord_coe_bid_vsa" });
						const bid_satus = result.getText({ name: "custrecord_coe_bid_status" });
						var bid_date = result.getValue({ name: "custrecord_coe_bid_submission_date" });
						const bid_amount = result.getValue({ name: "custrecord_coe_bid_amount" });
						var vehcate = result.getText({ name: "custrecord_coe_bid_category" });
						const secureAmnt = result.getValue({ name: "custrecord_coe_bid_premium_paid" }) || null;
						const sf_id = result.getValue({ name: "custrecord_salesforce_id_coe" });
						var secureDate = result.getValue({ name: "custrecord_coe_bid_expiry_date" }) || null;

						if (bid_date) {
							bid_date = convertDateToYMD(bid_date);
						}
						if (secureDate) {
							secureDate = convertDateToYMD(secureDate);
						}
						if (vehcate) {
							vehcate = 'Category ' + vehcate;
						}

						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								sfId: sf_id,
								dmsVSAId: vsaID,
								coeBidStatus: bid_satus,
								coeBidDate: bid_date,
								coeBidAmount: bid_amount,
								coeBidVehicleCategory: vehcate,
								coeSecuredDate: secureDate,
								coeSecuredAmount: secureAmnt
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString customrecord_advs_coe_bid', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertVSACOEBidding',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response customrecord_advs_coe_bid', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_advs_coe_bid', 'custrecord_salesforce_id_coe', 'custrecord_sf_res_coe', 'custrecord_sf_sync_time_coe');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in customrecord_advs_coe_bid',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}

		function push_customer_particular_owner(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custentity_salesforce_id", "isnotempty", ""]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custentity_salesforce_id", "isnotempty", ""],
						"AND",
						["lastmodifieddate", "onorafter", modified_date]
					]
				}
				log.debug("customer", custom_filter);
				var searchResults = search.create({
					type: "customer",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "isperson" }),
						search.createColumn({ name: "salutation" }),
						search.createColumn({ name: "firstname" }),
						search.createColumn({ name: "lastname" }),
						search.createColumn({ name: "companyname" }),
						search.createColumn({ name: "mobilephone" }),
						search.createColumn({ name: "email" }),
						search.createColumn({ name: "country" }),
						search.createColumn({ name: "zipcode" }),
						search.createColumn({ name: "address" })
					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" });
						var isperson = result.getValue({ name: "isperson" }) || false;
						var salutation = result.getValue({ name: "salutation" });
						var firstname = result.getValue({ name: "firstname" });
						var lastname = result.getValue({ name: "lastname" });
						var companyname = result.getValue({ name: "companyname" });
						var mobilephone = result.getValue({ name: "mobilephone" }) || null;
						var email = result.getValue({ name: "email" }) || '';
						var country = result.getValue({ name: "country" }) || '';
						var zipcode = result.getValue({ name: "zipcode" }) || '';
						var address = result.getValue({ name: "address" }) || '';

						log.debug('isperson', isperson);
						var customerType = (String(isperson) === "T" || isperson === true)
							? "Individual"
							: "Company";



						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								customerType: customerType,
								customerSalutation: salutation,
								customerFirstName: firstname,
								customerLastName: lastname,
								customerCompanyName: companyname,
								customerPhone: mobilephone,
								customerEmail: email,
								street: '',
								country: country,
								postalCode: zipcode,
								address: address
							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_customer_particular_owner', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'updateOwnerParticular',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response push_customer_particular_owner', postResponse.body);
				//update_sfid_indms(postResponse.body, 'customrecord_advs_coe_bid', 'custrecord_salesforce_id_coe', 'custrecord_sf_res_coe', 'custrecord_sf_sync_time_coe');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in customrecord_advs_coe_bid',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
		}
		function push_vehicle_ownership(head, recordId, modified_date) {

			try {
				var custom_filter = "";
				if (recordId && recordId != null) {         // Measns its triggered from Salesforce Button
					custom_filter = [
						["internalid", "anyof", recordId],
						"AND",
						["custrecord_advs_vehicle_link.custrecord_salesforce_id_stock", "isnotempty", ""]
					]
				}
				else {
					var custom_filter = [
						["isinactive", "is", "F"],
						"AND",
						["custrecord_advs_vehicle_link.custrecord_salesforce_id_stock", "isnotempty", ""],
						"AND",
						["lastmodified", "onorafter", modified_date]
					]
				}
				log.debug("customrecord_advs_ownership", custom_filter);
				var searchResults = search.create({
					type: "customrecord_advs_ownership",
					filters: custom_filter,
					columns: [
						search.createColumn({ name: "internalid" }),
						search.createColumn({ name: "custrecord_advs_strt_date" }),
						search.createColumn({ name: "custrecord_adsv_end_date" }),
						search.createColumn({ name: "custrecord_advs_vehicle_link" }),
						search.createColumn({ name: "custrecord_advs_cus_name" }),
						search.createColumn({ name: "custentity_salesforce_id", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "isperson", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "salutation", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "firstname", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "lastname", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "companyname", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "mobilephone", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "email", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "country", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "zipcode", join: "CUSTRECORD_ADVS_CUS_NAME" }),
						search.createColumn({ name: "address", join: "CUSTRECORD_ADVS_CUS_NAME" }),

					]
				});
				const modelList = [];
				var UniqueModelDesc = {};
				const pagedData = searchResults.runPaged({ pageSize: 1000 });
				pagedData.pageRanges.forEach(function (pageRange) {
					const page = pagedData.fetch({ index: pageRange.index });

					page.data.forEach(function (result) {

						const internalid = result.getValue({ name: "internalid" });
						var sDate = result.getValue({ name: "custrecord_advs_strt_date" }) || null;
						var enddate = result.getValue({ name: "custrecord_adsv_end_date" }) || null;
						var veh_ID = result.getValue({ name: "custrecord_advs_vehicle_link" });
						var custDMSid = result.getValue({ name: "custrecord_advs_cus_name" });
						var cust_sfID = result.getValue({ name: "custentity_salesforce_id", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var isperson = result.getValue({ name: "isperson", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var salutation = result.getValue({ name: "salutation", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var firstname = result.getValue({ name: "firstname", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var lastname = result.getValue({ name: "lastname", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var companyname = result.getValue({ name: "companyname", join: "CUSTRECORD_ADVS_CUS_NAME" });
						var mobilephone = result.getValue({ name: "mobilephone", join: "CUSTRECORD_ADVS_CUS_NAME" }) || '';
						var email = result.getValue({ name: "email", join: "CUSTRECORD_ADVS_CUS_NAME" }) || '';

						var customerType = (String(isperson) === "T" || isperson === true)
							? "Individual"
							: "Company";

						if (sDate) {
							sDate = convertDateToYMD(sDate);
						}
						if (enddate) {
							enddate = convertDateToYMD(enddate);
						}


						if (!UniqueModelDesc[internalid]) {
							UniqueModelDesc[internalid] = true;

							modelList.push({
								dmsId: internalid,
								vehicleStockDmsId: veh_ID,
								customerDmsId: custDMSid,
								customerSfId: cust_sfID,
								customerType: customerType,
								customerSalutation: salutation,
								customerFirstName: firstname,
								customerLastName: lastname,
								customerCompanyName: companyname,
								customerPhone: mobilephone,
								customerEmail: email,
								startDate: sDate,
								endDate: enddate

							});
						}
					});
				});
				var jsonString_model = JSON.stringify(modelList);
				log.debug('POST jsonString push_customer_particular_owner', jsonString_model);

				//---hit POST request-----------
				const postResponse = https.post({
					url: endPoint_URL + 'upsertVehicleOwnership',
					headers: head,
					body: jsonString_model
				});
				log.debug('POST response push_customer_particular_owner', postResponse.body);
				update_sfid_indms(postResponse.body, 'customrecord_advs_ownership', 'custrecord_salesforce_id_car', 'custrecord_sf_res_car', 'custrecord_sf_sync_time_car');
				store_BufferTale(postResponse.body, jsonString_model);

			} catch (error) {

				log.error({
					title: 'Error in customrecord_advs_ownership',
					details: error
				});
				email.send({
					author: author, // or use a specific employee ID
					recipients: recipients, // replace with actual email
					subject: 'Salesforce Push finance_rate Error Notification',
					body: 'An error occurred in the script:\n\n' + error.message + '\n\nStack:\n' + error.stack
				});

			}
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
		function update_sfid_indms(SfResponse, record_type, sf_field, sf_res_field, sf_time_field) {

			var now = new Date();

			var responseArray = JSON.parse(SfResponse);
			responseArray.forEach(function (recordData) {
				var statusCode = recordData.statusCode;
				var statusMessage = recordData.statusMessage;
				var dmsId = recordData.dmsId;
				var sfId = recordData.sfId;

				try {
					record.submitFields({
						type: record_type,
						id: dmsId,
						values: {
							[sf_field]: sfId,
							[sf_res_field]: statusMessage,
							[sf_time_field]: now
						}
					});

					log.debug('SFID Updated', 'DMS ID: ' + dmsId + ' updated with SFID: ' + sfId);

				} catch (e) {
					log.debug('Error updating DMS ID: ' + dmsId, e.message);
				}

			});
		}
		function store_BufferTale(SfResponse, dmsReq) {
			try {
				var responseArray = JSON.parse(SfResponse);
				responseArray.forEach(function (recordData) {
					log.debug('res.statusCode: ', recordData.statusCode);
					var recParentBuffer = record.create({ type: 'customrecord_buffer_sf_api_table', isDynamic: true });
					recParentBuffer.setValue({ fieldId: 'custrecord_record_type_', value: 6 }); // craete VSa
					recParentBuffer.setValue({ fieldId: 'custrecord_request', value: dmsReq });
					recParentBuffer.setValue({ fieldId: 'custrecord_error', value: recordData.statusMessage });
					if (recordData.statusCode != 200 && recordData.statusCode != 201) {
						recParentBuffer.setValue({ fieldId: 'custrecord_status_cust_buffer', value: 4 }); // Error
					} else {
						recParentBuffer.setValue({ fieldId: 'custrecord_status_cust_buffer', value: 2 });  // Success
					}
					recParentBuffer.save();
				});
			} catch (e) {
				log.debug('Error updating Buffer Table: ', e.message);
			}

		}

		return { execute }

	});
