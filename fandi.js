//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var fandiVersionNumber = "5.3.1";

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
	
	fANDI.accesskeys = new AndiAccesskeys();
	
	//Loop through every visible element and run tests
	$(TestPageData.allVisibleElements).each(function(){
		
		testPageData.firstLaunchedModulePrep(this); //Only the first launched module needs this.
		
		//If element is focusable, search for accessibility components.
		if($(this).is(":focusable")){
			andiData = new AndiData($(this));
			andiData.grabComponents($(this));
			andiCheck.commonFocusableElementChecks(andiData,$(this));
			if(andiData.addOnProperties.accesskey)
				fANDI.accesskeys.push($(this), andiData.addOnProperties.accesskey, andiData.andiElementIndex);
			andiData.attachDataToElement($(this));
		}
		else{
			andiCheck.isThisElementDisabled(this);
		}
	});
	
	andiCheck.areThereDisabledElements("elements");

};

function AndiAccesskeys(){
	//Raw accesskey values will be stored here and checked against
	var duplicateComparator = "";
	
	//Stores HTML to display the accesskeys
	var list = "";
	
	this.getListHtml = function(){
		return list;
	}

	this.push = function(element, accesskey, index){
		if(accesskey){
			accesskey = accesskey.toUpperCase();
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
				else
					addToList(accesskey);
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
				list += "<a href='#' data-ANDI508-relatedIndex='"+index+"' title='"+ titleText +"'><span "+addClass+">"+accesskey+"</span></a> ";
			duplicateComparator += accesskey;
		};
	};
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
//Inserts some counter totals, displays the accesskey list
fANDI.results = function(){

	andiBar.updateResultsSummary("Focusable Elements Found: "+testPageData.andiElementIndex);

	//Are There Focusable Elements?
	if(testPageData.andiElementIndex>0){
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
			andiBar.showElementControls();
			andiBar.showStartUpSummary("Discover accessibility markup for focusable elements by tabbing to or hovering over the highlighted elements.",true,"focusable element");
		}
	}
	else{
		//No Focusable Elements were found
		andiBar.hideElementControls();
		if(testPageData.numberOfAccessibilityAlertsFound === 0){
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
	if(AndiModule.activeActionButtons.tabOrder)
		$("#ANDI508-tabOrder-button").click();
	if(AndiModule.activeActionButtons.titleAttributes)
		$("#ANDI508-titleAttributes-button").click();
	
	$("#ANDI508").focus();
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
				//greaterThanZeroArray[x].insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabIndex="+i, i));
				$(greaterThanZeroArray[x]).after(andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero",tabSequence,"tabIndex="+i, i));
				z--;
			}
		}
		i++;
	}
	
	//PASS 2: Get tabindex=0 and natively tabbable:
	var titleText;
	$("#ANDI508-testPage .ANDI508-element").each(function(){
		tabindex = $(this).attr("tabindex");
		if(tabindex < 0){
			//tab index is negative
			//this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0));
			$(this).after(andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0));
		}
		else if(tabindex == 0 || ($(this).is(":tabbable") && !(tabindex > 0) )){
			//tabindex is 0 or natively tabbable and tabindex is not greater than zero
			tabSequence++;
			titleText = (tabindex == 0) ? "tabIndex=0" : "natively tabbable";
			//this.insertAdjacentHTML("afterEnd", andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0));
			$(this).after(andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0));
		}
	});
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
fANDI.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	
	var elementData = $(element).data("ANDI508");
	
	andiBar.displayOutput(elementData);
	
	andiBar.displayTable(elementData,
		[
			["legend", elementData.legend],
			["figcaption", elementData.figcaption],
			["caption", elementData.caption],
			["parent", elementData.groupingText],
			["aria-labelledby", elementData.ariaLabelledby],
			["aria-label", elementData.ariaLabel],
			["label", elementData.label],
			["alt", elementData.alt],
			["value", elementData.value],
			["innerText", elementData.innerText],
			["child", elementData.subtree],
			["imageSrc", elementData.imageSrc],
			["placeholder", elementData.placeholder],
			["aria-describedby", elementData.ariaDescribedby],
			["summary", elementData.summary],
			["title", elementData.title]
		],
		[
			["aria-checked", elementData.addOnProperties.ariaChecked],
			["aria-controls", elementData.addOnProperties.ariaControls],
			["aria-disabled", elementData.addOnProperties.ariaDisabled],
			["aria-expanded", elementData.addOnProperties.ariaExpanded],
			["aria-haspopup", elementData.addOnProperties.ariaHaspopup],
			["aria-hidden",	elementData.addOnProperties.ariaHidden],
			["aria-invalid", elementData.addOnProperties.ariaInvalid],
			["aria-multiline", elementData.addOnProperties.ariaMultiline],
			["aria-readonly", elementData.addOnProperties.ariaReadonly],
			["aria-required", elementData.addOnProperties.ariaRequired],
			["aria-sort", elementData.addOnProperties.ariaSort],
			["checked", elementData.addOnProperties.checked],
			["readonly", elementData.addOnProperties.readonly],
			["required", elementData.addOnProperties.required],
			["tabindex", elementData.addOnProperties.tabindex],
			["accesskey", elementData.addOnProperties.accesskey]
		]
	);
};

fANDI.analyze();
fANDI.results();

}//end init
