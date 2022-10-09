/******************************************************
   _____ _       _           _  __      __            
  / ____| |     | |         | | \ \    / /            
 | |  __| | ___ | |__   __ _| |  \ \  / /_ _ _ __ ___ 
 | | |_ | |/ _ \| '_ \ / _` | |   \ \/ / _` | '__/ __|
 | |__| | | (_) | |_) | (_| | |    \  / (_| | |  \__ \
  \_____|_|\___/|_.__/ \__,_|_|     \/ \__,_|_|  |___/
*******************************************************/
// Helper / Flags
var row_no = 1;
var COUNTER = 0;
var WORK_ORDER_FLAG = false;
var HAS_INSURANCE = false;
var prescriptionsArray = ["SPH", "CYL", "AXIS", "ADD", "IPD"];

// Needed for validation and CRM Records
// prescriptions sides
var _right_prescriptions = new Map();
var _left_prescriptions = new Map();

// Needed for CRM records creation
var CONTACT_RECORD = new Map();  		// New Contact
var WORK_ORDER_RECORD = new Map();		// New Work Order
var WORK_ORDER_LENS_IDS = new Set();
var INSURANCE_RECORD = new Map();		// Selected Insurance
var PRESCRIPTION_RECORD = new Map();	// New PRESCRIPTION
var PRODUCTLIST = [];					// Selected Products
var CONTACT_ID = null;					// Searched Contact ID
var VP_ID = null;
var TOTAL_PRICE = 0;
var TOTAL_WO_PRICE = 0;
var LEFT_LENS = "";
var RIGHT_LENS = "";
var FRAME_PRODUCT = "";
/******************************************************************************
  _          _                   ______                _   _                 
 | |        | |                 |  ____|              | | (_)                
 | |__   ___| |_ __   ___ _ __  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
 | '_ \ / _ \ | '_ \ / _ \ '__| |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
 | | | |  __/ | |_) |  __/ |    | |  | |_| | | | | (__| |_| | (_) | | | \__ \
 |_| |_|\___|_| .__/ \___|_|    |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
              | |                                                            
              |_|                                                            
*******************************************************************************/
function testme(){
	getProductsInformation();
}
function prodListVisability(stat = 'false'){
	// Display Accessories products
	let pro_list = document.getElementById("AccessoriesContainer");
	let toContactBtn = document.getElementById("productNextButton");
	toContactBtn.style.display = "block";
	if(stat === 'true'){pro_list.style.display = "block"}
	else{pro_list.style.display = "none"}
}
function isNumeric(val) {
	// validate if passed string is digits only
    return /^[+-]?\d+(\.\d+)?$/.test(val);
}
function get_today_date(){
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
	let yyyy = today.getFullYear();
	return `${yyyy}-${mm}-${dd}`;
}
/****************************************************************************************
  _____  _                           ______                _   _                 
 |  __ \| |                         |  ____|              | | (_)                
 | |__) | |__   __ _ ___  ___  ___  | |__ _   _ _ __   ___| |_ _  ___  _ __  ___ 
 |  ___/| '_ \ / _` / __|/ _ \/ __| |  __| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
 | |    | | | | (_| \__ \  __/\__ \ | |  | |_| | | | | (__| |_| | (_) | | | \__ \
 |_|    |_| |_|\__,_|___/\___||___/ |_|   \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
****************************************************************************************/
/** Navigation buttons **/
function toProduct(evt){
	changeStage(evt, "product-type")
}
function toContacts(evt){
	changeStage(evt, "contact-data");
	getProductsInformation();
}
function toWorkOrder(evt){
	changeStage(evt, "work-order");
}
function toInsurance(evt){
	changeStage(evt, "insurance-stage");
	get_all_insurance_from_crm();
	// get_products();
}
function toInvoices(evt){
	changeStage(evt, "invoice");
}
function changeStage(evt, stageID){
	let tabcontent = document.getElementsByClassName("tabcontent");
	for (let i = 0; i < tabcontent.length; i++){
		tabcontent[i].style.display = "none";
	}
	// Delete all active status from all container
	let tablinks = document.getElementsByClassName("tablinks");
	for (let i = 0; i < tablinks.length; i++){
		tablinks[i].className = tablinks[i].className.replace(" active", "");
	}
	document.getElementById(stageID).style.display = "block"; // Active the passed stage id
	evt.currentTarget.className += " active";
}
/**********************************************************************************************/
//[+] Product Phase functions:
function removerRecord(recid){
	/* Delete product record from products table */
	let record = document.getElementById(recid);
	record.remove(); // delete the record
	// changes indexes after delete operation
	let list = document.getElementsByClassName("tableRecord");
	let COUNTER = 0;
	while(COUNTER < list.length){
		if(list[COUNTER] != undefined){
			let itemNo = list[COUNTER].getElementsByTagName("td"); // update counter
			itemNo[0].innerHTML = `<center><b># ${COUNTER + 1}</b><center>`;
			COUNTER ++;
		}else{return}
		row_no = COUNTER + 1; // reset and update counter
	}
	// start from #1 when list is empty.
	let newlist = document.getElementsByClassName("tableRecord");
	if (newlist.length == 0){row_no = 1;}
}
// What a Clean Code 😊
function render_accessories_record(){
	/* Prepaire the product table record */
	let table = document.getElementById("table-body");
	let tableRow = document.createElement("tr");
	tableRow.id = `${row_no}`;
    tableRow.className = "tableRecord";
    // Prepair order number
    let td0 = document.createElement("td");
    td0.style = "padding-top: 35px;";
    td0.innerHTML = `<center><b># ${row_no}</b></center>`
    // Prepair order product type
    let td1 = document.createElement("td");
    td1.style = "padding-top: 30px;";
    let prodSelect = document.createElement("select");
	prodSelect.id = `select_${row_no}`;
	prodSelect.className = "form-select product";
	prodSelect.setAttribute("onchange", `getModels("select_${row_no}", "modelSelect_${row_no}")`);
	prodSelect.setAttribute("aria-label", "Default select example");
    prodSelect.innerHTML = `
    <option selected value="-None-">-None-</option>
    <option value="Lens">Lens</option>
    <option value="Contact Lens">Contact Lens</option>
    <option value="Sun Glasses Frame">Sun Glasses Frame</option>
    <option value="Optical Glasses Frame">Optical Glasses Frame</option>
    <option value="Reading glasses ready">Reading glasses ready</option>
    <option value="Clip-On Glasses">Clip-On Glasses</option>
    <option value="Accessories">Accessories</option>`; //TODO: may be updated and remove some options
    td1.appendChild(prodSelect);
    // Prepair order Model
    let td2 = document.createElement("td");
    td2.style = "padding-top: 30px;";
    let modelSelect = document.createElement("select");
	modelSelect.setAttribute("onchange", `turnOnqty("qty_${row_no}", "modelSelect_${row_no}")`);
	modelSelect.setAttribute("disabled", true);
	modelSelect.id = `modelSelect_${row_no}`;
	modelSelect.className = "form-select";
	modelSelect.setAttribute("aria-label", "Default select example");
    modelSelect.innerHTML = `<option selected value="-None-">-None-</option>`;
    td2.appendChild(modelSelect);
    // Prepair order qty
    let td3 = document.createElement("td");
	td3.style = "padding-top: 30px;";
	let qtyDiv = document.createElement("div");
	qtyDiv.className = "input-group mb-3";
	let qtyInput = document.createElement("input");
	qtyInput.id = `qty_${row_no}`;
	qtyInput.className = "form-control";
	qtyInput.type = "text";
	qtyInput.setAttribute("onchange", `validQty("qty_${row_no}", "modelSelect_${row_no}")`);
	qtyInput.setAttribute("aria-describedby", "basic-addon3");
	qtyInput.setAttribute("value", "1");
	qtyDiv.appendChild(qtyInput);
	td3.appendChild(qtyDiv);
    // Prepair order price
    let td4 = document.createElement("td");
	td4.id = `price_${row_no}`;
    td4.style = "padding: 35px";
    td4.innerHTML = "0 SAR";
	// Prepair discount
	let td5 = document.createElement("td");
	td5.style = "padding: 30px";
	let td5Div = document.createElement("div");
	td5Div.className = "input-group";
	let td5Input = document.createElement("input");
	td5Input.type = "text";
	td5Input.id = `discount_${row_no}`;
	td5Input.className = "form-control"; 
	td5Input.value = "0";
	td5Input.setAttribute("aria-label", "Dollar amount (with dot and two decimal places)");
	td5Input.setAttribute("onchange", `validateDiscount('discount_${row_no}')`);
	let td5Span = document.createElement("span");
	td5Span.className = "input-group-text";
	td5Span.innerHTML = "%";
	td5Div.appendChild(td5Input);
	td5Div.appendChild(td5Span);
	td5.appendChild(td5Div);
	// Prepair sub total
	let td6 = document.createElement("td");
	td6.id = `subTotal_${row_no}`;
	td6.setAttribute(onchange, testme());
	td6.style = "padding: 35px";
	td6.innerHTML = "0 SAR";
    // remove order
    let td7 = document.createElement("td");
    td7.style = "padding: 45px";
    td7.innerHTML = `<center><button class="recButtonDel" onclick="removerRecord('${row_no}')" type="button" name="myButton"> - </button></center>`;
	// Create total price record
	let totalPriceTR = document.createElement("tr");
	totalPriceTR.id = "totalPriceRec";
	let totalPriceTD = document.createElement("td");
	totalPriceTD.id = "totalPrice";
	totalPriceTD.style = "padding:25px; text-align:center; background-color: #212529;color: white;";
	totalPriceTD.setAttribute("colspan", "8");
	totalPriceTD.innerHTML = "<center><b>Total Price: 00.00</b> SAR</center>";
	totalPriceTR.appendChild(totalPriceTD);
	// Append product data to record.
    tableRow.appendChild(td0);
    tableRow.appendChild(td1);
    tableRow.appendChild(td2);
    tableRow.appendChild(td3);
    tableRow.appendChild(td4);
    tableRow.appendChild(td5);
	tableRow.appendChild(td6);
	tableRow.appendChild(td7);
	// Append to table
    table.appendChild(tableRow);
    table.appendChild(totalPriceTR);
}
function add_new_item(){
	/* Add new item to the products table after validate the whole table */
	if (row_no == 1){
		let getTotal = document.getElementById("totalPriceRec");
		getTotal.remove();
		render_accessories_record();
		row_no += 1;
		calculate_products_total();
	}else{
		let allRecords = document.querySelectorAll(".tableRecord");
		for(var i = 0; i < allRecords.length; i++){
			let internalRecord = allRecords[i].getElementsByTagName("td");
			// Record Data
			let productElement = internalRecord[1].getElementsByTagName("select")[0];
			let modelElement = internalRecord[2].getElementsByTagName("select")[0];
			let qtyElement = internalRecord[3].getElementsByTagName("div")[0].getElementsByTagName("input")[0];
			let discountElement =  internalRecord[5].getElementsByTagName("div")[0].getElementsByTagName("input")[0].value;
			// Stop execution and fail early
			if (productElement.value == "-None-"){
				return;
			}
			if (modelElement.value == "-None-"){
				return;
			}
			if (qtyElement.value < 1){
				internalRecord.remove();
				return;
			}
			if(discountElement < 0){
				return;
			}
		}
		let getTotal = document.getElementById("totalPriceRec");
		getTotal.remove();
		render_accessories_record();
		row_no += 1;		
	}
	calculate_products_total();
}
function setWorkOrderFlag(flag){
	if (flag != true){
		WORK_ORDER_FLAG = true;
		let toContactButton = document.getElementById("productNextButton");
		toContactButton.style.display = "block";
		prodListVisability("false");
	}else{
		WORK_ORDER_FLAG = false;
		prodListVisability("true");
	}
}
function calculate_products_total(){
	let allRecords = document.querySelectorAll(".tableRecord");
	TOTAL_PRICE = 0
	for(var i = 0; i < allRecords.length; i++){
		let internalRecord = allRecords[i].getElementsByTagName("td");
		let priceElement =  parseInt(internalRecord[6].textContent);
		TOTAL_PRICE += priceElement;
		}
		let tot_price_element = document.getElementById("totalPrice");
		tot_price_element.innerHTML = `<b>Total Price: ${TOTAL_PRICE}</b> SAR`;
}
// TODO: validate -None- values
function getModels(prod_id, model_id){
	let id = prod_id.split("_")[1];
	let produtElement = document.getElementById(prod_id);
	let modelElement = document.getElementById(model_id);
	let search_criteria = `(Product_Type:equals:${produtElement.value})`;
	console.log(search_criteria);
	ZOHO.CRM.API.searchRecord({Entity:"Products",Type:"criteria",Query:search_criteria}).then(function(response){
		let data = response.data;
		for(let i = 0; i < data.length; i++){
			console.log(data[0].Model);
			modelElement.innerHTML += `<option value="${data[i].Unit_Price}">${data[i].Model}</option>`;
		}
	});
	if(produtElement.value != "-None-"){
		modelElement.disabled = false;
		modelElement.setAttribute("value", "-None-");
		if(modelElement.value != "-None-"){
			qtyElement.disabled = false;
		} else{
			qtyElement.disabled = true;
		}
	}else{
		modelElement.value = "-None-";
		modelElement.disabled = true;
	}
}
//TODO: Fix the NONE option
function turnOnqty(qtyID, modID){
	let id = qtyID.split("_")[1];
	let modEl = document.getElementById(modID);
	let qtyElement = document.getElementById(qtyID);
	let price = document.getElementById(`price_${id}`);
	let subTotal = document.getElementById(`subTotal_${id}`);
	// let discountElement = document.getElementById(`discount_${id}`);
	if(qtyElement.value < 1){return}
	if (modEl.value == "-None-"){
		qtyElement.disabled = true;
		price.innerHTML = "0 SAR";
		subTotal.innerHTML = "0 SAR";
		qtyElement.setAttribute("value", "0");
	}
	else{
		qtyElement.disabled = false;
		price.innerHTML = `${modEl.value * qtyElement.value} SAR`;
		subTotal.innerHTML = `${modEl.value * qtyElement.value} SAR`;
	}
}
function validQty(qtyID, modelID){
	turnOnqty(qtyID, modelID);
}
function validateDiscount(discount_id){
	// Validate the record discount field
	let id = discount_id.split("_")[1];
	let subTotal = document.getElementById(`subTotal_${id}`);
	let discountElement = document.getElementById(discount_id);
	try{
		let discountValue = parseInt(discountElement.value);
		if (discountValue >= 0){
			let pricevalue = document.getElementById(`price_${id}`).textContent.split(" ")[0];
			let price = parseFloat(pricevalue);
			let result = price - (price * discountValue/100);
			subTotal.innerHTML = `${result} SAR`;
		}else{
			return;
		}
	}
	catch(err){
		alert(err)
	}
}
// TODO: Implement this :)
function getProductsInformation(){
	PRODUCTLIST = []
	if (WORK_ORDER_FLAG){
		// Get the work order data and prices
		// To be implemented.
	}else{
		// He have normal product here, get the products data
		let allRecords = document.querySelectorAll(".tableRecord");
		for(var i = 0; i < allRecords.length; i++){
			let recordMap = new Map();
			let internalRecord = allRecords[i].getElementsByTagName("td");
			recordMap.set("product", internalRecord[1].getElementsByTagName("select")[0].value);
			recordMap.set("model", internalRecord[2].getElementsByTagName("select")[0].value);
			recordMap.set("price", parseInt(internalRecord[4].textContent));
			recordMap.set("qty", internalRecord[3].getElementsByTagName("div")[0].getElementsByTagName("input")[0].value);
			recordMap.set("discount", internalRecord[5].getElementsByTagName("div")[0].getElementsByTagName("input")[0].value);
			PRODUCTLIST.push(recordMap);
		}
		console.log(PRODUCTLIST);
	}
}
function check_work_order(){
	console.log(WORK_ORDER_FLAG);
	let toin_btn = document.getElementById("toIn");
	let towo_btn = document.getElementById("toWo");
	// Check if we have wo or normal product
	if(WORK_ORDER_FLAG == true){
		// Go to work order.
		towo_btn.style.display = "block";
		toin_btn.style.display = "none";
	}else{
		// Go to Insuranse.
		towo_btn.style.display = "none";
		toin_btn.style.display = "block";
	}
}
//TODO: Fix insurance logic and get insurance policy amount/percentage from CRM
/**********************************************************************************************/
//[+] Insurance Phase functions:
function getInsuranceData(){
	let insuranceName = document.getElementById("insurance-company-name");
	let insurancePolicy = document.getElementById("insurance-company-policy");
	let companyBears = document.getElementById("Insurance-bears");
	let customerBears = document.getElementById("Customer-bear");
	if(insuranceName.value != "-None-"){
		companyBears.disabled = false;
		customerBears.disabled = false;
		insurancePolicy.disabled = false;
		let _id = `(Lookup_1:equals:${insuranceName.value})`;
		ZOHO.CRM.API.searchRecord({Entity:"Insurance_Policies",Type:"criteria",Query:_id}).then(function(response){
			let policies = response["data"];
			for(let i = 0; i< policies.length; i++){
				let option_element = document.createElement("option");
				option_element.textContent = policies[i].Name;
				option_element.value = policies[i].id;
				insurancePolicy.appendChild(option_element);
			}
		})
	}
	else{
		companyBears.disabled = true;
		companyBears.value = "-None-";
		customerBears.disabled = true;
		customerBears.value = "-None-";
		insurancePolicy.disabled = true;
		insurancePolicy.value = "-None-";
	}
}
// TODO: Implement this :)
function validateInsuranceData(){
	/* Function to validate insurance dana and go to the final stage of creating records.*/
	let insuranceName = document.getElementById("insurance-company-name");
	let companyBears = document.getElementById("Insurance-bears");
	let customerBears = document.getElementById("Customer-bear");

	if (HAS_INSURANCE == true){
		if (isNumeric(companyBears.value) &&
			isNumeric(customerBears.value) &&
			insuranceName.value != "-None-"){
			// True Add all to the insurance record map.
			INSURANCE_RECORD.set("company_name", insuranceName.value);
			INSURANCE_RECORD.set("company_bears", companyBears.value);
			INSURANCE_RECORD.set("customer_bears", customerBears.value);
			// TODO: go to the next phase

		}else{
			// make the map empty
			INSURANCE_RECORD.clear();
			return;
		}
	}else{
	}
}

function has_insurance(stat = false){
	let ins_box = document.getElementById("ins-box");
	if(stat == true){
		ins_box.style.display = "block";
		HAS_INSURANCE = true;
	}else{
		ins_box.style.display = "none";
		HAS_INSURANCE = false;
	}
}
function get_all_insurance_from_crm(){
	/* Append all insurace company to the list */
	let com_name = document.getElementById("insurance-company-name");
	ZOHO.CRM.API.getAllRecords({Entity:"Insurance_Company"}).then(function(response){
   		console.log(response["data"]);
		for(i = 0; i < response["data"].length; i++){
			let com_name_element = document.createElement("option");
			com_name_element.value = response["data"][i].id;
			com_name_element.textContent = response["data"][i].Name;
			com_name.appendChild(com_name_element);
		}
	});
}
/**********************************************************************************************/
//[+] Contact Phase functions:
function displayContactPageContent(evt, contactStatus){
	/* Display the contacts fileds based on selected status new or old */
	let newContactObj = document.getElementById("show-new-contact");
	let oldContactObj = document.getElementById("show-old-contact");
	if (contactStatus == "show-new-contact"){
		oldContactObj.style.display = "none";
		newContactObj.style.display  = "block";
	}else{
		newContactObj.style.display  = "none";
		oldContactObj.style.display  = "block";	
	}
}
function validate_new_contact(e){
	/* Validate the entred contact data as it not empty */
	let first_name = document.getElementById("fname").value;
	let last_name = document.getElementById("lname").value;
	let phone_number = document.getElementById("phone").value;
	if (first_name == "" || last_name == "" || phone_number == ""){return;}
	else{
		CONTACT_RECORD.set("First_Name", first_name);
		CONTACT_RECORD.set("Last_Name", last_name);
		CONTACT_RECORD.set("Phone", phone_number);
	}

	if(WORK_ORDER_FLAG){
		toWorkOrder(event);
	}else{
		toInsurance(event);
	}
}
function createContactCard(crm_record){
	crm_record = crm_record["data"][0];
	const recordID = crm_record["id"];
	// Getting Data from record
	let contact_name  	 = crm_record["Full_Name"];
	let contact_phone 	 = crm_record["Phone"];
	let recImg 			 = crm_record["Record_Image"];
	let contact_email 	 = crm_record["Email"];
	let contact_imagesrc = "https://ttwo.dk/wp-content/uploads/2017/08/person-placeholder.jpg";
	// Create Card
	let cardElement = document.createElement("div");
	cardElement.className = "contact-card ";
	// Contact Image
	let imageElement = document.createElement("img");
	imageElement.src = contact_imagesrc;
	imageElement.setAttribute("height", "30%");
	imageElement.alt = `${contact_name}'s Image` 				// contact name image
	imageElement.style ="width:100%";
	let nameElement = document.createElement("h1");
	nameElement.textContent = contact_name;
	let emailElement = document.createElement("p");
	emailElement.className = "contact-card-email";
	emailElement.textContent = contact_email; 	
	let phoneElement = document.createElement("p");
	phoneElement.textContent = contact_phone;
	let ContactButtonsContainer = document.createElement("p");
	let editContactButton = document.createElement("button");
	editContactButton.className = "contact-card-button";
	editContactButton.innerHTML = `<a class="buttons-links" href="https://crm.zoho.com/crm/org786621963/tab/Contacts/${recordID}/edit?layoutId=5430321000000091033" target="_blank">Edit Contact</a>`;
	let viewContactButton = document.createElement("button");
	viewContactButton.className = "contact-card-button";
	viewContactButton.innerHTML = `<a class="buttons-links" href="https://crm.zoho.com/crm/org786621963/tab/Contacts/${recordID}" target="_blank">View Contact</a>`
	// Appemd elemet to page
	ContactButtonsContainer.appendChild(viewContactButton);
	ContactButtonsContainer.appendChild(editContactButton);
	cardElement.appendChild(imageElement);
	cardElement.appendChild(nameElement);
	cardElement.appendChild(emailElement);
	cardElement.appendChild(phoneElement);
	cardElement.appendChild(ContactButtonsContainer);
	let newContactButton = document.getElementById("contact-card-element");
	newContactButton.appendChild(cardElement);
}
function search_contact(){
	/*
	** Function to search contact by the entred phone number then it's update the-
	** global "CONTACT_ID" variable to be reused after while.
	*/
	let phoneNum = document.getElementById("phone_search").value;
	if (phoneNum == "")
		return;
	// search contact with phone number
	ZOHO.CRM.API.searchRecord({Entity:"Contacts",Type:"phone",Query: phoneNum, delay:false}).then(function(response){
		if (response["data"] == undefined){
			// showErrorMsg("block");
			// showSuccessMsg("Hide", "none");
			console.log("Error Message will be display soon");
			// go to create contact
		}else{
			// Go to create contact
			CONTACT_ID = response["data"][0].id;
			createContactCard(response);
			CONTACT_RECORD.clear();
			console.log(CONTACT_ID);
			check_work_order();
		}
	});
}
/**********************************************************************************************/
//[+] Work order phase functions
function readPrescriptions(){
	let right_eye_prescription = validate_right_prescriptions();
	console.log(right_eye_prescription);
	let left_eye_prescription  = validate_left_prescriptions();
	console.log(left_eye_prescription);
	let frame_model = document.getElementById("wo_frame").value;
	let prescription_for = document.getElementById("wo_for").value;
	if(right_eye_prescription == undefined || left_eye_prescription == undefined || frame_model.length < 1 || prescription_for == ""){
		console.log("Error !!");
		return;
	}else{
		PRESCRIPTION_RECORD.set("right_vp", right_eye_prescription);
		PRESCRIPTION_RECORD.set("left_vp", left_eye_prescription);
		// PRESCRIPTION_RECORD.set("prescription_for", prescription_for);
		console.log(PRESCRIPTION_RECORD);
		search_products('right', right_eye_prescription);
		console.log()
		search_products('left', left_eye_prescription);
		search_frame(frame_model);
	}
}
function validate_right_prescriptions(){
	for(let i = 0; i< prescriptionsArray.length; i++){
		let side_pres = `right_${prescriptionsArray[i]}`;
		let pres_Element = document.getElementById(side_pres);
		let arg_name = pres_Element.id.split("_")[1];
		// console.log(pres_Element);
		if (isNumeric(pres_Element.value) == false){
			_right_prescriptions.clear();
			return;
		}else{
			_right_prescriptions.set(`${arg_name}`, parseFloat(pres_Element.value));
		}
	}
	return _right_prescriptions;
}
function validate_left_prescriptions(){
	for(let i = 0; i< prescriptionsArray.length; i++){
		let side_pres = `left_${prescriptionsArray[i]}`;
		let pres_Element = document.getElementById(side_pres);
		let arg_name = pres_Element.id.split("_")[1];
		if (isNumeric(pres_Element.value) == false){
			_left_prescriptions.clear();
			return;
		}else{
			_left_prescriptions.set(`${arg_name}`, parseFloat(pres_Element.value));
		}
	}
	return _left_prescriptions;
}
function search_frame(wo_frame_model){
	/* search the entered frame in crm then display it's card on screen */
	let query_string = `((Product_Type:equals:Optical Glasses Frame)and(Model:equals:${wo_frame_model}))`;
	ZOHO.CRM.API.searchRecord({Entity:"Products", Type:"criteria", Query:query_string}).then(function(response){
	    let incomming_data = response["data"][0];
		// Prepare the Product Card
		build_frame_card(incomming_data);
	});
}
function build_frame_card(frame_search_result){
	let result = document.getElementById("frames-rows");
	// Getting Data
	let _product_name = frame_search_result["Product_Name"];
	let _product_price = frame_search_result["Unit_Price"];
	let _product_info_1 = `Lens Diameter: ${frame_search_result["Lens_Diameter"]}<br>Model: ${frame_search_result["Model"]}<br>Material: ${frame_search_result["Material"]}<br>Lens Diameter: ${frame_search_result["Lens_Diameter"]}`;
	let _product_info_2 = `<br>Product Code: ${frame_search_result["Product_Code"]}<br>Bridge Size: ${frame_search_result["Bridge_Size"]}<br>Arm Size: ${frame_search_result["Arm_Size"]}<br>Quantity in Stock: ${frame_search_result["Qty_in_Stock"]}`;
	let _product_id = frame_search_result["id"];
    let col_4_div = document.createElement("div");
    col_4_div.className = "col-6";
    let card_div = document.createElement("div"); // Card div
    card_div.className ="card";
    let table_element = document.createElement("table"); // create table
    let table_body = document.createElement("tbody");
    let table_1_col = document.createElement("td");
        // Lets create the flap image card
        let flap_card = document.createElement("div");
        flap_card.className = "flip-card";
        let flap_inner = document.createElement("div");
        flap_inner.className = "flip-card-inner";
        let flap__front = document.createElement("div");
        flap__front.className = "flip-card-front";
        let flap__img = document.createElement("img");
        flap__img.src = "https://user-images.githubusercontent.com/60070427/189909595-19eb8d35-ecdf-4b44-ae44-fc235699ce7e.jpg";
        flap__img.style ="width:150px;height:150px;";
        let card_flap_view = document.createElement("div");
        card_flap_view.className = "flip-card-back";
        let view_button = document.createElement("button");
        view_button.className = "view-button";
        let product_link = document.createElement("a");
        product_link.href = `https://crm.zoho.com/crm/org786621963/tab/Products/${_product_id}`;
		product_link.target = "_blank";
        product_link.className = "view-link";
        product_link.textContent = "View"
        view_button.appendChild(product_link);
        card_flap_view.appendChild(view_button);
        flap__front.appendChild(flap__img);
        flap_inner.appendChild(flap__front);
        flap_inner.appendChild(card_flap_view);
        flap_card.appendChild(flap_inner); // first td.
        table_1_col.appendChild(flap_card)
        // Lets create the product details
        let table_2_col = document.createElement("td");
        let product_name = document.createElement("h3");
        product_name.textContent = _product_name;
        let product_price = document.createElement("p");
        product_price.className = "price";
        product_price.textContent = `${_product_price} SAR`;
        let product_data_1 = document.createElement("p");
        product_data_1.innerHTML = _product_info_1;
        let product_data_2 = document.createElement("p");
        product_data_2.innerHTML = _product_info_2;
        let add_button = document.createElement("button");
		add_button.id = `${_product_id}`;
		add_button.setAttribute("onclick", `add_to_cart('${_product_id}', '${_product_price}')`);
		// add_button.setAttribute("onclick", `add_to_cart('${_product_id}')`);
        add_button.className = "select-button";
        add_button.textContent = "Add to Cart";
    table_2_col.appendChild(product_name);
    table_2_col.appendChild(product_price);
    table_2_col.appendChild(product_data_1);
    table_2_col.appendChild(product_data_2);
    table_2_col.appendChild(add_button);
	// Append to table body
    table_body.appendChild(table_1_col);
    table_body.appendChild(table_2_col);
    table_element.appendChild(table_body);
    card_div.appendChild(table_element);
    col_4_div.appendChild(card_div);
    result.appendChild(col_4_div);
}
function search_products(eye, vision_prescription){
	let eye_type = "";
	// Check for the eye type
	if(eye == "right")
		eye_type = "Right"
	else
		eye_type = "Left"
	let cyl = vision_prescription.get("CYL");
	let axis = vision_prescription.get("AXIS");
	let sph = vision_prescription.get("SPH");
	let add = vision_prescription.get("ADD");
	let query_string = `((Cyl:equals:${cyl})and(Axis:equals:${axis})and(Sph:equals:${sph})and(Add:equals:${add})and(Eye:equals:${eye_type}))`;
	ZOHO.CRM.API.searchRecord({Entity:"Products", Type:"criteria", Query:query_string}).then(function(response){
	    let incomming_data = response["data"][0];
		// console.log(incomming_data);
		if (eye_type == "Right"){
			RIGHT_LENS = incomming_data.id;
			console.log("RIGHT LENS:", RIGHT_LENS);
		}else{
			LEFT_LENS = incomming_data.id;
			console.log("LEFT LENS:", LEFT_LENS);
		}
		// Prepare the Product Card
		build_product_card(incomming_data);
	});
}
function build_product_card(search_result){
    let result = document.getElementById("myrows");
	// Getting Data
	let _product_name = search_result["Product_Name"];
	let _product_price = search_result["Unit_Price"];
	// Vision Type  ---  Eye  --  Quantity in Stock 
	let _product_info_1 = `Frame Type: ${search_result["Frame_Type"]}<br>Model: ${search_result["Model"]}<br>Material: ${search_result["Material"]}<br>Lens Diameter: ${search_result["Lens_Diameter"]}`;
	let _product_info_2 = `<br>Vision Type: ${search_result["Vision_Type"]}<br>Eye: ${search_result["Eye"]}<br>Quantity in Stock: ${search_result["Qty_in_Stock"]}`;
	let _product_id = search_result["id"];
    let col_4_div = document.createElement("div");
    col_4_div.className = "col-6";
    // Card div
    let card_div = document.createElement("div");
    card_div.className ="card";
    // create table
    let table_element = document.createElement("table");
    let table_body = document.createElement("tbody");
    let table_1_col = document.createElement("td");
        // Lets create the flap image card
        let flap_card = document.createElement("div");
        flap_card.className = "flip-card";
        let flap_inner = document.createElement("div");
        flap_inner.className = "flip-card-inner";
        let flap__front = document.createElement("div");
        flap__front.className = "flip-card-front";
        let flap__img = document.createElement("img");
        flap__img.src = "https://www.nicepng.com/png/full/443-4431327_png-file-fa-fa-product-icon.png";
        flap__img.style ="width:150px;height:150px;";

        let card_flap_view = document.createElement("div");
        card_flap_view.className = "flip-card-back";
        let view_button = document.createElement("button");
        view_button.className = "view-button";
        let product_link = document.createElement("a");
        product_link.href = `https://crm.zoho.com/crm/org786621963/tab/Products/${_product_id}`;
		product_link.target = "_blank";
        product_link.className = "view-link";
        product_link.textContent = "View"
        view_button.appendChild(product_link);
        card_flap_view.appendChild(view_button);
        flap__front.appendChild(flap__img);
        flap_inner.appendChild(flap__front);
        flap_inner.appendChild(card_flap_view);
        flap_card.appendChild(flap_inner); // first td.
        table_1_col.appendChild(flap_card)

        // Lets create the product details
        let table_2_col = document.createElement("td");
        let product_name = document.createElement("h3");
        product_name.textContent = _product_name;
        let product_price = document.createElement("p");
        product_price.className = "price";
        product_price.textContent = `${_product_price} SAR`;

        let product_data_1 = document.createElement("p");
        product_data_1.innerHTML = _product_info_1;
        let product_data_2 = document.createElement("p");
        product_data_2.innerHTML = _product_info_2;

        let add_button = document.createElement("button");
		add_button.id = `${_product_id}`;
		add_button.setAttribute("onclick", `add_to_cart('${_product_id}', '${_product_price}')`);
        add_button.className = "select-button";
        add_button.textContent = "Add to Cart";

    table_2_col.appendChild(product_name);
    table_2_col.appendChild(product_price);
    table_2_col.appendChild(product_data_1);
    table_2_col.appendChild(product_data_2);
    table_2_col.appendChild(add_button);

    table_body.appendChild(table_1_col);
    table_body.appendChild(table_2_col);
    table_element.appendChild(table_body);
    card_div.appendChild(table_element);
    col_4_div.appendChild(card_div);
    result.appendChild(col_4_div);
}
function set_workorder_total(){
	let pr_element = document.getElementById("wo_total_price");
	pr_element.textContent = `${TOTAL_WO_PRICE} SAR`;
}
function add_to_cart(pro_id, prod_price){
	set_workorder_total()
	let selected_card = document.getElementById(pro_id);
	if(selected_card.textContent == "Add to Cart"){
		WORK_ORDER_LENS_IDS.add(pro_id);
		// create_vision_prescription(WORK_ORDER_LENS_IDS);
		selected_card.textContent = "Remove From Cart";
		TOTAL_WO_PRICE += parseInt(prod_price);
		// console.log(TOTAL_WO_PRICE);
		console.log(WORK_ORDER_LENS_IDS);
	}else{
		WORK_ORDER_LENS_IDS.delete(pro_id);
		selected_card.textContent = "Add to Cart";
		TOTAL_WO_PRICE -= parseInt(prod_price);
		// console.log(TOTAL_WO_PRICE);
		console.log(WORK_ORDER_LENS_IDS);
	}
	set_workorder_total()
}
/**********************************************************************************************/
// TODO: to be tested :) and fix
//[+] Zoho CRM functions (last phase):
function create_work_order(){
	let record_data = {
		"Prescriptions":{
			"id": VP_ID
		},
		"Status":"Shop Pickup",
		"Contact":{
			"id":CONTACT_ID
		}
	}
	ZOHO.CRM.API.insertRecord({Entity:"Work_Orders", APIData:record_data, Trigger:["workflow"]}).then(function(response){
		console.log("Create WO");
		console.log( JSON.stringify(response)); // return true if created and false otherwise.
	});
}

// function get_products(){
// 	const productsIterator = WORK_ORDER_LENS_IDS.values();
// 	for (const pro of productsIterator){
// 		ZOHO.CRM.API.getRecord({Entity:"Products",RecordID:pro}).then(function(response){
// 			console.log(response["data"][0]["Eye"]);
// 		});
// 	}
// }

function create_vision_prescription(vp_map){
	// console.log(WORK_ORDER_LENS_IDS.values());
	const myIterator = WORK_ORDER_LENS_IDS.values();
	// List all Values
	let text = "";
	for (const entry of myIterator) {
	text += ` ${entry}`;
	}
	let record_data = {
		"Prescription_Date" : get_today_date(),
		"Status" : "New",
		"Contact":{
			"id": CONTACT_ID
		},
		"Prescription_For": document.getElementById("wo_for").value,
		//TODO: merge l/r vp into vp_details in vp_map
		"Left_Sphere":  vp_map.get("left_vp").get("SPH"),
		"Left_Axis":    vp_map.get("left_vp").get("AXIS"),
		"Left_ADD":		vp_map.get("left_vp").get("ADD"),
		"Left_IPD":		vp_map.get("left_vp").get("IPD"),
		"Left_Cyl":		vp_map.get("left_vp").get("CYL"),
		"Right_Sphere": vp_map.get("right_vp").get("SPH"),
		"Right_Axis":   vp_map.get("right_vp").get("AXIS"),
		"Right_Cyl":    vp_map.get("right_vp").get("ADD"),
		"Right_ADD":    vp_map.get("right_vp").get("IPD"),
		"Right_IPD":    vp_map.get("right_vp").get("CYL"),
		"Associated_Products" : text
	}

	console.log(text);
	console.log(record_data);
	ZOHO.CRM.API.insertRecord({Entity:"Vision_Prescriptions", APIData:record_data, Trigger:["workflow"]}).then(function(response){
		console.log("VP RECORD");
		VP_ID = response["data"][0]["details"]["id"];
		create_work_order();
	});
}

function create_contact(){
	let recordData = {
		"First_Name": CONTACT_RECORD.get("First_Name"),
		"Last_Name": CONTACT_RECORD.get("Last_Name"),
		"Phone": CONTACT_RECORD.get("Phone")
	}
	ZOHO.CRM.API.insertRecord({Entity:"Contacts", APIData:recordData}).then(function(response){
		if (response["data"] == undefined){
			console.log("Contact isn't created >> Display message Here");
		}else{
			CONTACT_ID = response["data"][0]["details"].id;
			create_vision_prescription(PRESCRIPTION_RECORD);
		}
	});
}

function create_all(){
	const myIterator = WORK_ORDER_LENS_IDS.values();
	// List all Values
	let text = "";
	for (const entry of myIterator) {
	text += ` ${entry}`;
	}
	console.log(text);

	if (CONTACT_ID == null){
		create_contact()
	}
	// create_vision_prescription //
	let vp_data = {
		"Prescription_Date" : get_today_date(),
		"Status" : "New",
		"Contact":{
			"id": CONTACT_ID
		},
		"Prescription_For": document.getElementById("wo_for").value,
		//TODO: merge l/r vp into vp_details in vp_map
		"Left_Sphere":  PRESCRIPTION_RECORD.get("left_vp").get("SPH"),
		"Left_Axis":    PRESCRIPTION_RECORD.get("left_vp").get("AXIS"),
		"Left_ADD":		PRESCRIPTION_RECORD.get("left_vp").get("ADD"),
		"Left_IPD":		PRESCRIPTION_RECORD.get("left_vp").get("IPD"),
		"Left_Cyl":		PRESCRIPTION_RECORD.get("left_vp").get("CYL"),
		"Right_Sphere": PRESCRIPTION_RECORD.get("right_vp").get("SPH"),
		"Right_Axis":   PRESCRIPTION_RECORD.get("right_vp").get("AXIS"),
		"Right_Cyl":    PRESCRIPTION_RECORD.get("right_vp").get("ADD"),
		"Right_ADD":    PRESCRIPTION_RECORD.get("right_vp").get("IPD"),
		"Right_IPD":    PRESCRIPTION_RECORD.get("right_vp").get("CYL"),
		"Associated_Products" : text
	}
	// console.log(WORK_ORDER_LENS_IDS.values());

	console.log(vp_data);
	ZOHO.CRM.API.insertRecord({Entity:"Vision_Prescriptions", APIData:vp_data, Trigger:["workflow"]}).then(function(response){
		console.log("VP RECORD");
		VP_ID = response["data"][0]["details"]["id"];
		// create_work_order //
		create_work_order();
	});
}

/******************** [End of Phases Functions] ********************/
function initializeWidget()
{
	// Subscribe to the EmbeddedApp onPageLoad event before initializing the widget.
	ZOHO.embeddedApp.on("PageLoad",function(data){});
	// initialize the widget.
	ZOHO.embeddedApp.init();
}