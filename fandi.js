//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var fandiVersionNumber = "7.0.0";

//create fANDI instance
var fANDI = new AndiModule(fandiVersionNumber,"f");

AndiModule.initActiveActionButtons({
	tabOrder:false,
	titleAttributes:false,
	labelTags:false
});

//This function will analyze the test page for focusable element related markup relating to accessibility
fANDI.analyze = function(){
	
	fANDI.accesskeys = new AndiAccesskeys();
	
	//Loop through every visible element and run tests
	$(TestPageData.allVisibleElements).each(function(){
		if($(this).is(":focusable,canvas")){//If element is focusable, search for accessibility components.
			andiData = new AndiData(this);
			
			andiCheck.commonFocusableElementChecks(andiData, $(this));
			andiCheck.lookForCanvasFallback(this);
			if(andiData.accesskey)
				fANDI.accesskeys.push(this, andiData.accesskey, andiData.andiElementIndex);
			testPageData.firstLaunchedModulePrep(this, andiData);
			AndiData.attachDataToElement(this);
		}
		else{
			testPageData.firstLaunchedModulePrep(this);
			andiCheck.isThisElementDisabled(this);
		}
	});
	
	andiCheck.areLabelForValid();
	andiCheck.areThereDisabledElements("elements");
};

function AndiAccesskeys(){
	//Raw accesskey values will be stored here and checked against
	var duplicateComparator = "";
	
	//Stores HTML to display the accesskeys
	var list = "";
	
	this.getListHtml = function(){
		return list;
	};
	
	this.push = function(element, accesskey, index){
		if(accesskey){
			//Is accesskey value more than one character?
			if(accesskey.length > 1){ //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
				andiAlerter.throwAlert(alert_0052,[accesskey]);
				addToList(accesskey, alert_0052);
			}
			else{
				//Check for duplicate accesskey
				if(duplicateComparator.includes(accesskey)){
					if($(element).is("button,input:submit,input:button,input:reset,input:image")){
						//duplicate accesskey found on button
						andiAlerter.throwAlert(alert_0054,[accesskey]);
						addToList(accesskey, alert_0054);
					}
					else if($(element).is("a[href]")){
						//duplicate accesskey found on link
						andiAlerter.throwAlert(alert_0056,[accesskey]);
						addToList(accesskey, alert_0056);
					}
					else{
						//duplicate accesskey found
						andiAlerter.throwAlert(alert_0055,[accesskey]);
						addToList(accesskey, alert_0055);
					}
				}
				else{
					addToList(accesskey);
					duplicateComparator += accesskey;
				}
			}
		}
		
		function addToList(accesskey, alertObject){
			var addClass = "";
			var titleText = "";
			if(alertObject){
				addClass = "class='ANDI508-display-"+alertObject.level+"'";
				titleText = alertObject.level+": "+alertObject.message+accesskey;
			}
			else
				titleText = "AccessKey "+accesskey+" found, focus on element";
			
			if(index === 0)
				list += "<span tabindex='0' "+addClass+" title='"+ titleText +"'>"+accesskey+"</span> ";
			else
				list += "<a href='#' data-andi508-relatedindex='"+index+"' title='"+ titleText +"'><span "+addClass+">"+accesskey+"</span></a> ";
		}
	};
}

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
//Inserts some counter totals, displays the accesskey list
fANDI.results = function(){

	andiBar.updateResultsSummary("Focusable Elements Found: "+testPageData.andiElementIndex);
	
	//Are There Focusable Elements?
	if(testPageData.andiElementIndex > 0){
		//Yes, Focusable Elements were found
		
		//Accesskeys List:
		if(fANDI.accesskeys.getListHtml()){
			$("#ANDI508-additionalPageResults").append("<p id='ANDI508-accesskeysFound'>AccessKeys: "+"{ "+fANDI.accesskeys.getListHtml()+"}</p>");
			$("#ANDI508-accesskeysFound").find("a").each(function(){
				andiFocuser.addFocusClick($(this));
				$(this).on("mouseover" 	,andiLaser.drawAlertLaser);
				$(this).on("click"		,andiLaser.eraseLaser);
				$(this).on("mouseleave"	,andiLaser.eraseLaser);
			});
			$("#ANDI508-accesskeysFound").show();
		}
		
		//Tab Order button
		var moduleActionButtons = "<button id='ANDI508-tabOrder-button' aria-label='Tab Order Indicators' aria-pressed='false'>tab order"+overlayIcon+"</button>";
		if(TestPageData.page_using_titleAttr)
			moduleActionButtons += "<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes"+overlayIcon+"</button>";
		if(testPageData.page_using_label)
			moduleActionButtons += "<button id='ANDI508-labelTags-button' aria-label='Label Tags' aria-pressed='false'>label tags"+overlayIcon+"</button>";
		
		$("#ANDI508-module-actions").append(moduleActionButtons);
		
		//Define tabOrder button functionality
		$("#ANDI508-tabOrder-button").click(function(){
			if($(this).attr("aria-pressed") == "false"){
				andiOverlay.overlayButton_on("overlay",$(this));
				andiOverlay.overlayTabOrder();
				AndiModule.activeActionButtons.tabOrder = true;
			}
			else{
				andiOverlay.overlayButton_off("overlay",$(this));
				andiOverlay.removeOverlay("ANDI508-overlay-tabSequence");
				AndiModule.activeActionButtons.tabOrder = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define titleAttributes button functionality
		$("#ANDI508-titleAttributes-button").click(function(){
			if($(this).attr("aria-pressed") == "false"){
				andiOverlay.overlayButton_on("overlay",$(this));
				andiOverlay.overlayTitleAttributes();
				AndiModule.activeActionButtons.titleAttributes = true;
			}
			else{
				andiOverlay.overlayButton_off("overlay",$(this));
				andiOverlay.removeOverlay("ANDI508-overlay-titleAttributes");
				AndiModule.activeActionButtons.titleAttributes = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define titleAttributes button functionality
		$("#ANDI508-labelTags-button").click(function(){
			if($(this).attr("aria-pressed") == "false"){
				andiOverlay.overlayButton_on("overlay",$(this));
				andiOverlay.overlayLabelTags();
				AndiModule.activeActionButtons.labelTags = true;
			}
			else{
				andiOverlay.overlayButton_off("overlay",$(this));
				andiOverlay.removeOverlay("ANDI508-overlay-labelTags");
				AndiModule.activeActionButtons.labelTags = false;
			}
			andiResetter.resizeHeights();
			return false;
		});

		andiBar.focusIsOnInspectableElement();
		andiBar.showElementControls();
		andiBar.showStartUpSummary("Discover accessibility markup for focusable elements by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every focusable element.",true);
	}
	else{
		//No Focusable Elements were found
		andiBar.hideElementControls();
		andiBar.showStartUpSummary("No focusable elements were found on this page.");
}
	
	andiAlerter.updateAlertList();
	
	AndiModule.engageActiveActionButtons([
		"tabOrder",
		"titleAttributes",
		"labelTags"
	]);
	
	$("#ANDI508").focus();
};

//This function will overlay the tab order sequence.
//It will take into account, tabindexes that are greater than zero and less than zero
AndiOverlay.prototype.overlayTabOrder = function(){
	var tabindex;
	var tabSequence = 0;
	var overlayObject;
	//PASS 1: Get tabindexes greater than 0:
	var greaterThanZeroArray = []; //Will store elements with tabindex greater than 0
	$("#ANDI508-testPage [tabindex].ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if(tabindex > 0)//tab index is greater than 0
			greaterThanZeroArray.push(this); //Add to the array
	});
	//loop through the greater than zero array until all elements have been addressed
	var i = 1;
	var z = greaterThanZeroArray.length;
	while(z > 0){
		for(var x=0; x<greaterThanZeroArray.length; x++){
			if($(greaterThanZeroArray[x]).attr("tabindex") == i){
				tabSequence++;
				overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabIndex="+i, i);
				andiOverlay.insertAssociatedOverlay($(greaterThanZeroArray[x]), overlayObject, true);
				z--;
			}
		}
		i++;
	}
	
	//PASS 2: Get tabindex=0 and natively tabbable:
	var titleText;
	var lastRadioGroupName;
	$("#ANDI508-testPage .ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if(tabindex < 0){
			//tab index is negative
			overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0);
			andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
		}
		else if(tabindex == 0 || ($(this).is(":tabbable") && !(tabindex > 0) )){
			//tabindex is 0 or natively tabbable and tabindex is not greater than zero
			
			if($(this).is("input[type=radio][name]")){
				if(lastRadioGroupName !== undefined && lastRadioGroupName === $(this).attr("name"))
					return; //this is a subsequent radio button, don't add overlay
				else
					lastRadioGroupName = $(this).attr("name");
			}
			tabSequence++;
			titleText = (tabindex == 0) ? "tabIndex=0" : "natively tabbable";
			overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0);
			andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
		}
	});
};

//This function will overlay the label elements.
AndiOverlay.prototype.overlayLabelTags = function(){
	var labelText, labelFor, overlayClasses, overlayObject, titleText;
	$("#ANDI508-testPage label").filter(":visible").each(function(){
		labelText = "&lt;label";
		overlayClasses = "ANDI508-overlay-labelTags";
		titleText = "";
		labelFor = $(this).attr("for");

		if(labelFor){
			labelText += " for=" + labelFor;
			if(!document.getElementById(labelFor)){ //id that matches for cannot be found
				overlayClasses += " ANDI508-overlay-alert";
				titleText += "no matching [id]";
			}
		}
		else
			titleText += "no [for] attribute";
		labelText += "&gt;";

		overlayObject = andiOverlay.createOverlay(overlayClasses, labelText, titleText, 0);
		andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
		$(this).after(andiOverlay.createOverlay(overlayClasses, "&lt;/label&gt;", "", 0));
	});
	
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	
	var elementData = $(element).data("andi508");
	var addOnProps = AndiData.getAddOnProps(element, elementData);
	
	andiBar.displayOutput(elementData, element, addOnProps);
	andiBar.displayTable(elementData, element, addOnProps);
};

fANDI.analyze();
fANDI.results();

}//end init
