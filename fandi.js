//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var fandiVersionNumber = "4.2.3";

//create fANDI instance
var fANDI = new AndiModule(fandiVersionNumber,"f");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey) //check for holding shift key
		fANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	fANDI.inspect(this);
	andiResetter.resizeHeights();
};

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{tabOrder:false});
	$.extend(AndiModule.activeActionButtons,{titleAttributes:false});
}

//This function will analyze the test page for focusable element related markup relating to accessibility
fANDI.analyze = function(){
	
	//Loop through every visible element and run tests
	$('#ANDI508-testPage *').filter(':visible').each(function(){
		
		testPageData.firstLaunchedModulePrep(this); //Only the first launched module needs this.
		
		//If element is focusable, search for accessibility components.
		if($(this).is(":focusable")){
			andiData = new AndiData($(this));
			andiData.grabComponents($(this));
			andiCheck.commonFocusableElementChecks(andiData,$(this));
			andiData.attachDataToElement($(this));
		}
		else{
			andiCheck.isThisElementDisabled(this);
			andiCheck.areThereAccesskeysThatMightNotGetVisualFocus(this);
			andiCheck.areThereAnyMouseEventsWithoutKeyboardAccess(this);
		}
	});
	
	andiCheck.areThereDisabledElements("elements");
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
//Inserts some counter totals, displays the accesskey list
fANDI.results = function(){

	andiBar.updateResultsSummary("Focusable Elements Found: "+testPageData.andiElementIndex);

	//Are There Focusable Elements?
	if(testPageData.andiElementIndex>0){
		//Yes, Focusable Elements were found
		
		//Accesskeys List:
		if(testPageData.accesskeysListHtml != ""){
			$("#ANDI508-additionalPageResults").append("<p id='ANDI508-accesskeysFound'>AccessKeys: "+"{ "+testPageData.accesskeysListHtml+"}</p>");
			$("#ANDI508-accesskeysFound").find("a").each(function(){
				andiFocuser.addFocusClick($(this));
				$(this).on("mouseover" 	,andiLaser.drawAlertLaser);
				$(this).on("click"		,andiLaser.eraseLaser);
				$(this).on("mouseleave"	,andiLaser.eraseLaser);
			});
			$("#ANDI508-accesskeysFound").show();
		}
		else
			$("#ANDI508-accesskeysFound").remove();
		
		//Tab Order button
		var moduleActionButtons = "<button id='ANDI508-tabOrder-button' aria-label='Tab Order Indicators' aria-pressed='false'>tab order"+overlayIcon+"</button>";
		if(TestPageData.page_using_titleAttr)
			//Title Attributes Button
			moduleActionButtons += "<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes"+overlayIcon+"</button>";
			
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
						
		if(!andiBar.focusIsOnInspectableElement()){
			andiBar.showStartUpSummary("Discover accessibility markup for focusable elements by tabbing to or hovering over the highlighted elements.",true,"focusable element");
		}
	}
	else{
		//No Focusable Elements were found
		if(testPageData.numberOfAccessibilityAlertsFound==0){
			//No Alerts
			andiBar.showStartUpSummary("No Focusable Elements were found on this page.",false);
		}
		else{
			//Alerts were found
			andiBar.showStartUpSummary("No Focusable Elements were found, <br />however there are some accessibility alerts.",true);
		}
	}
	
	andiAlerter.updateAlertList();
	
	//Click previously active buttons
	if(AndiModule.activeActionButtons.tabOrder){
		$("#ANDI508-tabOrder-button").click();
	}
	if(AndiModule.activeActionButtons.titleAttributes){
		$("#ANDI508-titleAttributes-button").click();
	}
		
};

//This function will overlay the tab order sequence.
//It will take into account, tabindexes that are greater than zero and less than zero
AndiOverlay.prototype.overlayTabOrder = function(){
	var tabindex;
	var tabSequence = 0;
	
	//PASS 1: Get tabindexes greater than 0:
	var greaterThanZeroArray = []; //Will store elements with tabindex greater than 0
	$("#ANDI508-testPage [tabindex].ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if(tabindex > 0){
			//tab index is greater than 0
			greaterThanZeroArray.push(this); //Add to the array
		}
	});
	//loop through the greater than zero array until all elements have been addressed
	var i = 1;
	var z = greaterThanZeroArray.length;
	while(z > 0){
		for(var x=0; x<greaterThanZeroArray.length; x++){
			if($(greaterThanZeroArray[x]).attr("tabindex") == i){
				tabSequence++;
				greaterThanZeroArray[x].insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabindex="+i, i));
				z--;
			}
		}
		i++;
	}
	
	//PASS 2: Get tabindex=0 and natively tabbable:
	$("#ANDI508-testPage .ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if(tabindex < 0){
			//tab index is negative
			this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0));
		}
		if($(this).is(":tabbable") && (!tabindex || tabindex == 0) ){
			tabSequence++;
			
			var titleText = "natively tabbable";
			if(tabindex == 0)
				titleText = "tabindex=0";
		
			this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0));
		}
	});
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
fANDI.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	
	var elementData = $(element).data("ANDI508");
	
	displayTable(element);
	
	//This function defines ANDI's output logic for any type of element.
	AndiModule.outputLogic = function(){
		var usingTitleAsNamer = false;
		//legend
		if(!elementData.ignoreLegend && andiBar.output.legend(elementData)); //Spec not clear on placement relating to form elements. Screen Readers are prefixing it to form elements.
	//Accessible Name
		//aria-labelledby
		if(andiBar.output.ariaLabelledby(elementData));
		//aria-label
		else if(andiBar.output.ariaLabel(elementData));
	//HTML Namers
		//label
		else if(!elementData.ignoreLabel && andiBar.output.label(elementData));
		//alt
		else if(!elementData.ignoreAlt && andiBar.output.alt(elementData));
		//figcaption
		else if(!elementData.ignoreFigcaption && andiBar.output.figcaption(elementData));
		//caption
		else if(!elementData.ignoreCaption && andiBar.output.caption(elementData));
		//value
		else if(andiBar.output.value(elementData));
		//innerText/child
		else if(andiBar.output.innerText(elementData));
		//title
		else if(andiBar.output.title(elementData)) usingTitleAsNamer=true;
	//Accessible Description
		//aria-describedby
		if(andiBar.output.ariaDescribedby(elementData));
	//HTML Describers
		//title
		else if(!usingTitleAsNamer && andiBar.output.title(elementData));
	//Add-On Properties
		if(andiBar.output.addOnProperties(elementData));
	};
	
	andiBar.displayOutput(elementData);	
	
	//This function displays the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	function displayTable(element){

		if(andiCheck.wereComponentsFound(elementData)){
			//add table rows for components found
			andiBar.appendRow("legend",				elementData.legend);
			andiBar.appendRow("figcaption",			elementData.figcaption);
			andiBar.appendRow("caption",			elementData.caption);
			
			andiBar.appendRow("aria-labelledby",	elementData.ariaLabelledby,false,true);
			andiBar.appendRow("aria-label",			elementData.ariaLabel);
			
			andiBar.appendRow("label",				elementData.label,false,true);
			andiBar.appendRow("alt",				elementData.alt);
			andiBar.appendRow("value",				elementData.value);
			andiBar.appendRow("innerText",			elementData.innerText);
			andiBar.appendRow("child&nbsp;element",	elementData.subtree);
			andiBar.appendRow("imageSrc",			elementData.imageSrc);
			andiBar.appendRow("placeholder",		elementData.placeholder);

			andiBar.appendRow("aria-describedby",	elementData.ariaDescribedby,false,true);
			andiBar.appendRow("title",				elementData.title);
			
			//add table rows for add-on properties found
			if(elementData.addOnPropertiesTotal != 0){
				andiBar.appendRow("role",			elementData.addOnProperties.role, true);
				andiBar.appendRow("accesskey",		elementData.addOnProperties.accesskey, true);
				andiBar.appendRow("tabindex",		elementData.addOnProperties.tabindex, true);
				andiBar.appendRow("aria-controls",	elementData.addOnProperties.ariaControls, true);
				andiBar.appendRow("aria-disabled",	elementData.addOnProperties.ariaDisabled, true);
				andiBar.appendRow("aria-expanded",	elementData.addOnProperties.ariaExpanded, true);
				andiBar.appendRow("aria-haspopup",	elementData.addOnProperties.ariaHaspopup, true);
				andiBar.appendRow("aria-hidden",	elementData.addOnProperties.ariaHidden, true);
				andiBar.appendRow("aria-invalid",	elementData.addOnProperties.ariaInvalid, true);
				andiBar.appendRow("readonly",		elementData.addOnProperties.readonly, true);
				andiBar.appendRow("aria-readonly",	elementData.addOnProperties.ariaReadonly, true);
				andiBar.appendRow("required",		elementData.addOnProperties.required, true);
				andiBar.appendRow("aria-required",	elementData.addOnProperties.ariaRequired, true);
				andiBar.appendRow("aria-sort",		elementData.addOnProperties.ariaSort, true);
				
			}
		}
	}
};

fANDI.analyze();
fANDI.results();

}//end init
