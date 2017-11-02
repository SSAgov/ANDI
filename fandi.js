//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var fandiVersionNumber = "3.7.1";
						 
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
			andiCheck.areThereAccesskeysThatMightNotGetVisualFocus(this);
			andiCheck.areThereAnyMouseEventsWithoutKeyboardAccess(this);
		}
	});
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
		
		//Show Tab Order button
		$("#ANDI508-module-modes").append("<button id='ANDI508-tabOrder-button' title='Indicators will appear after each focusable element'>show tab order"+overlayIcon+"</button>");
		
		//Define tabOrder button functionality
		$("#ANDI508-tabOrder-button").click(function(){
			if($(this).html().includes("show tab order")){
				$(this).html("hide tab order"+overlayIcon).attr("title","Indicators will be removed");
				andiOverlay.overlayTabOrder();
			}
			else{
				$(this).html("show tab order"+overlayIcon).attr("title","Indicators will appear after each focusable element");
				andiOverlay.removeOverlay("ANDI508-overlay-tabSequence");
			}
			andiResetter.resizeHeights();
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
};

//This function will overlay the tab order sequence.
//It will take into account, tabindexes that are greater than zero and less than zero
AndiOverlay.prototype.overlayTabOrder = function(){
	var tabindex;
	var tabSequence = 0;
	//first pass: natively focusable elements and tabindex less than 1
	$("#ANDI508-testPage .ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if($(this).is(":tabbable") && (!tabindex || tabindex == 0) ){
			tabSequence++;
			
			var titleText = "natively tabbable";
			if(tabindex == 0)
				titleText = "tabindex=0";
		
			this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0));
		}
		else if(tabindex < 0){
			//tab index is negative
			this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0));
		}
	});
	//additional passes:
	var t = []; //elements with tabindex greater than 0
	
	//Build the array
	$("#ANDI508-testPage [tabindex].ANDI508-element").each(function(){
		if($(this).attr("tabindex") > 0)
			t.push(this);
	});
	
	//loop through the array until all elements have been addressed
	//array will shrink as elements are removed.
	var i = 0;
	while(t.length){
		i++;
		for(x=0; x<t.length; x++){
			if($(t[x]).attr("tabindex") == i){
				tabSequence++;
				t[x].insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabindex="+i, i));
				
				//remove the element from the array.
				t[x] = t[t.length-1]; t.pop();
			}
		}
	}
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
