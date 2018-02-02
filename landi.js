//==========================================//
//lANDI: links ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var landiVersionNumber = "5.1.5";

//create lANDI instance
var lANDI = new AndiModule(landiVersionNumber,"l");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey) //check for holding shift key
		lANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	lANDI.inspect(this);
	andiResetter.resizeHeights();
};

//This object class is used to store data about each link. Object instances will be placed into an array.
function Link(href, nameDescription, index, alerts, target, linkPurpose){
	this.href = href;
	this.nameDescription = nameDescription;
	this.index = index;
	this.alerts = alerts;
	this.target = target;
	this.linkPurpose = linkPurpose;
}

//This object class is used to store data about each button. Object instances will be placed into an array.
function Button(nameDescription, index, alerts){
	this.nameDescription = nameDescription;
	this.index = index;
	this.alerts = alerts;
}

//Arrays which will store data for each link/button and eventually be presented in the view list table.
var links = [];
var buttons = [];

//Will be incremented each time a set of ambiguous links are found
//Stored into the data-lANDI508-ambiguousIndex attribute
var ambiguousIndex = 0;
var ambiguousLinkCount = 0;
var internalLinksCount = 0;
var externalLinksCount = 0;
var linkCount = 0;
var buttonCount = 0;
var nonUniqueButtonCount = 0;

//Alert icons for the links list table
var alertIcon_danger_noAccessibleName = iconMaker("danger","No Accessible Name");
var alertIcon_danger_anchorTargetNotFound = iconMaker("warning","In-page anchor target not found");
var alertIcon_warning_ambiguous = iconMaker("warning","Ambiguous: same name, different href");
var alertIcon_caution_ambiguous = iconMaker("caution","Ambiguous: same name, different href");
var alertIcon_caution_vagueText = iconMaker("caution","Vague: does not identify link purpose.");
var alertIcon_warning_nonUnique = iconMaker("warning","Non-Unique: same name as another button");

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{linksMode:true});
	$.extend(AndiModule.activeActionButtons,{linksList:false});
	$.extend(AndiModule.activeActionButtons,{highlightAmbiguousLinks:false});
	$.extend(AndiModule.activeActionButtons,{buttonsMode:false});
	$.extend(AndiModule.activeActionButtons,{buttonsList:false});
	$.extend(AndiModule.activeActionButtons,{highlightNonUniqueButtons:false});
}

//This function will analyze the test page for link related markup relating to accessibility
lANDI.analyze = function(){
	
	//Variables used to build the links/buttons list array.
	var href, nameDescription, alerts, target, linkPurpose;
	
	//Loop through every visible link and run tests
	//ANALYZE LINKS
	$('#ANDI508-testPage a[href]').filter(':shown').each(function(){
		
		if(!andiCheck.isThisElementDisabled(this)){
			
			linkCount++;
			
			if(AndiModule.activeActionButtons.linksMode){
				andiData = new AndiData($(this));
				andiData.grabComponents($(this));
				andiData.preCalculateNameDescription();
				
				nameDescription = andiData.nameDescription;
				
				href = $.trim($(this).attr("href"));
				//slice off last char if it's a slash (elimates false positive during comparison since with or without slash is essentially the same)
				if(href.charAt(href.length - 1) == "/")
					href = href.slice(0, -1);
				
				alerts = "";
				linkPurpose = "";
				
				target = $.trim($(this).attr("target"));
				
				if(nameDescription){
					var thisHref, thatHref, alertIcon, alertObject, relatedElement;
					//Seach through Links Array for same name different href
					for(var x=0; x<links.length; x++){
						if(nameDescription.toLowerCase() == links[x].nameDescription.toLowerCase()){
							//nameDescription match
							
							//Strip out the http:// or https:// from the compare
							thisHref = href.toLowerCase().replace(/^https?:\/\//,'');
							thatHref = links[x].href.toLowerCase().replace(/^https?:\/\//,'');
							
							if(thisHref != thatHref){
								//href doesn't match, throw alert
								alertIcon = "";
								alertObject = "";
								
								//Determine which alert level should be thrown
								if(href.charAt(0)=="#" || links[x].href.charAt(0)=="#"){
									//One link is internal
									alertIcon = alertIcon_caution_ambiguous;
									alertObject = alert_0162;
								}
								else{
									alertIcon = alertIcon_warning_ambiguous;
									alertObject = alert_0161;
								}
								
								//Throw the alert
								if(!links[x].alerts.includes(alertIcon)){
									//Throw alert on first instance only one time
									andiAlerter.throwAlertOnOtherElement(links[x].index,alertObject);
									links[x].alerts = alertIcon;
								}
								
								//Set the ambiguousIndex
								var i; //will store the ambiguousIndex for this match
								//Does the first instance already have a data-lANDI508-ambiguousIndex?
								relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+links[x].index+"]");
								if($(relatedElement).attr("data-lANDI508-ambiguousIndex")){
									//Yes. Copy the ambiguousIndex from the first instance
									i = $(relatedElement).attr("data-lANDI508-ambiguousIndex");
									ambiguousLinkCount++;
								}
								else{
									//No. increment ambiguousIndex and add it to the first instance.
									ambiguousLinkCount = ambiguousLinkCount + 2;
									ambiguousIndex++;
									i = ambiguousIndex;
									$(relatedElement).attr("data-lANDI508-ambiguousIndex",i);
								}
								//Set the ambiguousIndex to this link
								$(this).attr("data-lANDI508-ambiguousIndex",i);
								alerts += alertIcon;
								andiAlerter.throwAlert(alertObject);
								break;//prevents alert from being thrown more than once on an element
							}
						}
					}
					//Search for anchor target if href is internal link and greater than 1 character e.g. href="#x"
					if(href.charAt(0)=="#" && href.length>1){
						var anchorTargetFound = false;
						var id = href.slice(1);
						for(var x=0; x<testPageData.allIds.length; x++){
							if(testPageData.allIds[x].id.toLowerCase() == id.toLowerCase()){
								anchorTargetFound = true;
								break;
							}
						}
						if(!anchorTargetFound){
							//If link has no onclick and no click event was attached with jquery
							if(this.onclick == null && $._data(this, 'events').click === undefined)
							{
								//Throw Alert, Anchor Target not found
								alerts += alertIcon_danger_anchorTargetNotFound;
								andiAlerter.throwAlert(alert_0069, alert_0069.message+"["+id+"].");
							}
						}
						else{
							//The link is an internal link and the anchor target was found
							internalLinksCount++;
							$(this).addClass("lANDI508-internalLink");
							linkPurpose = "i";
						}
					}
					else if(href.charAt(0)!="#" && !href.toLowerCase().includes("javascript:")){
						//this is an external link
						externalLinksCount++;
						$(this).addClass("lANDI508-externalLink");
						linkPurpose = "e";
					}
						
					//Test for vague link text
					switch(nameDescription.toLowerCase()){
					case "click here":
					case "click me":
					case "click":
					case "here":
					case "link":
					case "edit":
					case "select":
					case "more":
					case "more info":
					case "more information":
					case "read more":
					case "details":
					case "page":
					case "go":
					case "go here":
						alerts += alertIcon_caution_vagueText;
						andiAlerter.throwAlert(alert_0163);
					}
					
					if(!alerts)
						//Add this for sorting purposes
						alerts = "<i>4</i>";
				}
				else{
					//No accessible name or description
					alerts = alertIcon_danger_noAccessibleName;
					nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
				}
				
				andiCheck.commonFocusableElementChecks(andiData,$(this));
				andiData.attachDataToElement($(this));

				if(href){
					//create Link object and add to array
					links.push(new Link(href,nameDescription,andiData.andiElementIndex,alerts,target,linkPurpose));
				}
			}

		}
	});
	
	//ANALYZE BUTTONS
	$('#ANDI508-testPage button,#ANDI508-testPage :button,#ANDI508-testPage :submit,#ANDI508-testPage :reset,#ANDI508-testPage :image').filter(':shown').each(function(){
		buttonCount++;
		
		if(AndiModule.activeActionButtons.buttonsMode){
			andiData = new AndiData($(this));
			andiData.grabComponents($(this));
			andiData.preCalculateNameDescription();
				
			nameDescription = andiData.nameDescription;
			alerts = "";
			
			if(nameDescription){
				var alertIcon, alertObject, relatedElement;
				//Seach through Links Array for same name different href
				for(var x=0; x<buttons.length; x++){
					if(nameDescription.toLowerCase() == buttons[x].nameDescription.toLowerCase()){
						alertIcon = alertIcon_warning_nonUnique;
						alertObject = alert_0200;
						
						//Throw the alert
						if(!buttons[x].alerts.includes(alertIcon)){
							//Throw alert on first instance only one time
							andiAlerter.throwAlertOnOtherElement(buttons[x].index,alertObject);
							buttons[x].alerts = alertIcon;
						}
					
						//Set the ambiguousIndex
						var i; //will store the ambiguousIndex for this match
						//Does the first instance already have a data-lANDI508-ambiguousIndex?
						relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+buttons[x].index+"]");
						if($(relatedElement).attr("data-lANDI508-ambiguousIndex")){
							//Yes. Copy the ambiguousIndex from the first instance
							i = $(relatedElement).attr("data-lANDI508-ambiguousIndex");
							nonUniqueButtonCount++;
						}
						else{
							//No. increment ambiguousIndex and add it to the first instance.
							nonUniqueButtonCount = nonUniqueButtonCount + 2;
							ambiguousIndex++;
							i = ambiguousIndex;
							$(relatedElement).attr("data-lANDI508-ambiguousIndex",i);
						}
						//Set the ambiguousIndex to this link
						$(this).attr("data-lANDI508-ambiguousIndex",i);
						alerts += alertIcon;
						andiAlerter.throwAlert(alertObject);
						break;//prevents alert from being thrown more than once on an element
					}
				}
				
				if(!alerts)
					//Add this for sorting purposes
					alerts = "<i>4</i>";
			}
			else{
				//No accessible name or description
				alerts = alertIcon_danger_noAccessibleName;
				nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
			}
			
			andiCheck.commonFocusableElementChecks(andiData,$(this));
			andiData.attachDataToElement($(this));
			
			//create Button object and add to array
			buttons.push(new Button(nameDescription,andiData.andiElementIndex,alerts));
		}
	});
	
	//Detect disabled links or buttons
	if(AndiModule.activeActionButtons.linksMode){
		andiCheck.areThereDisabledElements("links");
	}
	else if(AndiModule.activeActionButtons.buttonsMode){
		andiCheck.areThereDisabledElements("buttons");
	}

};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
lANDI.results = function(){

	//Add Module Mode Buttons
	var moduleModeButtons = "";
	
	//linksMode button
	moduleModeButtons += "<button id='ANDI508-linksMode-button' class='lANDI508-mode' aria-label='"+linkCount+" Links'>"+linkCount+" links</button>";
	moduleModeButtons += "<button id='ANDI508-buttonsMode-button' class='lANDI508-mode' aria-label='"+buttonCount+" Buttons'>"+buttonCount+" buttons</button>";
	
	$("#ANDI508-module-actions").html(moduleModeButtons);
	
	//Define lANDI mode buttons
	$("#ANDI508-linksMode-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.linksMode = true;
		AndiModule.activeActionButtons.buttonsMode = false;
		AndiModule.launchModule("l");
		andiResetter.resizeHeights();
	});
	$("#ANDI508-buttonsMode-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.linksMode = false;
		AndiModule.activeActionButtons.buttonsMode = true;
		AndiModule.launchModule("l");
		andiResetter.resizeHeights();
	});
	
	$("#ANDI508-module-actions button.lANDI508-mode").attr("aria-selected","false");

	if(testPageData.andiElementIndex > 0){
		//Yes, links/buttons were found
		
		if(AndiModule.activeActionButtons.linksMode){
			andiBar.updateResultsSummary("Links Found: "+linkCount);
			
			$("#ANDI508-linksMode-button")
				.attr("aria-selected","true")
				.addClass("ANDI508-module-action-active");
			
			//highlightAmbiguousLinks button
			if(ambiguousIndex > 0)
				$("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightAmbiguousLinks-button' aria-label='Highlight "+ambiguousLinkCount+" Ambiguous Links' aria-pressed='false'>"+ambiguousLinkCount+" ambiguous links"+findIcon+"</button>");
			
			//Ambiguous Links Button
			$("#ANDI508-highlightAmbiguousLinks-button").click(function(){
				var testPage = $("#ANDI508-testPage");
				if(!$(testPage).hasClass("lANDI508-highlightAmbiguous")){
					//On
					$("#lANDI508-listLinks-tab-all").click();
					$("#ANDI508-testPage")
						//.removeClass("lANDI508-highlightInternal lANDI508-highlightExternal")
						.addClass("lANDI508-highlightAmbiguous");
					andiOverlay.overlayButton_on("find",$(this));
					AndiModule.activeActionButtons.highlightAmbiguousLinks = true;
				}
				else{
					//Off
					$("#ANDI508-testPage").removeClass("lANDI508-highlightAmbiguous");
					andiOverlay.overlayButton_off("find",$(this));
					AndiModule.activeActionButtons.highlightAmbiguousLinks = false;
				}
				//$("#ANDI508-testPage a[data-lANDI508-ambiguousIndex]").each(function(){
					//this.insertAdjacentHTML("afterEnd","<span class='ANDI508-overlay'>"+$(this).attr('data-lANDI508-ambiguousIndex')+"</span>");
				//});
				andiResetter.resizeHeights();
				return false;
			});
			
			//BUILD LINKS LIST TABLE
			var linkListTable = "";
			var displayHref, targetText;
			var rowClasses, linksListTabs, prevNextButtons;
			for(var x=0; x<links.length; x++){
				//get target text if internal link
				targetText = "";
				if(!links[x].href.toLowerCase().includes("javascript:")){
					if(links[x].href.charAt(0)!="#")
						//href doesn't start with # (points externally)
						targetText = "target='_landi'";
					displayHref = "<a href='"+links[x].href+"' "+targetText+">"+links[x].href+"</a>";
				}
				else{
					//href contains javascript
					displayHref = links[x].href;
				}

				//determine if there is an alert
				rowClasses = "";
				var nextTabButton = "";
				if(links[x].alerts.includes("Alert"))
					rowClasses += "ANDI508-table-row-alert ";
				
				if(links[x].linkPurpose == "i"){
					rowClasses += "lANDI508-listLinks-internal ";
					nextTabButton = " <button class='lANDI508-nextTab' data-ANDI508-relatedId='"+links[x].href+"' title='focus on the element after id="+links[x].href+"'>next tab</button>";
				}
				else if(links[x].linkPurpose == "e")
					rowClasses += "lANDI508-listLinks-external ";
				
				rowClasses = $.trim(rowClasses);
				
				linkListTable += "<tr class='"+rowClasses+"'>"
					+"<th scope='row'>"+links[x].index+"</th>"
					+"<td class='lANDI-alert-column'>"+links[x].alerts+"</td>"
					+"<td><a href='#' data-ANDI508-relatedIndex='"+links[x].index+"'>"+links[x].nameDescription+"</a></td>"
					+"<td class='ANDI508-code'>"+displayHref+nextTabButton+"</td>"
					+"</tr>";
			}
		
			linksListTabs = "";
			linksListTabs += "<button id='lANDI508-listLinks-tab-all' aria-label='View All Links' aria-selected='true' class='ANDI508-tab-active' data-lANDI508-relatedClass='ANDI508-element'>all links</button>";
			if(internalLinksCount>0)
				linksListTabs += "<button id='lANDI508-listLinks-tab-internal' aria-label='View Skip Links' aria-selected='false' data-lANDI508-relatedClass='lANDI508-internalLink'>skip links ("+internalLinksCount+")</button>";
			if(externalLinksCount>0)
				linksListTabs += "<button id='lANDI508-listLinks-tab-external' aria-label='View External Links' aria-selected='false' data-lANDI508-relatedClass='lANDI508-externalLink'>external links ("+externalLinksCount+")</button>";
			
			prevNextButtons = "";
			prevNextButtons += "<button id='lANDI508-viewList-button-prev' aria-label='Previous Link in this list' accesskey='"+andiHotkeyList.key_prev.key+"'><img src='"+icons_url+"prev.png' alt='' /></button>";
			prevNextButtons += "<button id='lANDI508-viewList-button-next' aria-label='Next Link in this list'  accesskey='"+andiHotkeyList.key_next.key+"'><img src='"+icons_url+"next.png' alt='' /></button>";
			
			$("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewLinksList-button' class='ANDI508-viewOtherResults-button' aria-pressed='false'>view links list "+listIcon+"</button>"
				+"<div id='lANDI508-viewList-tabs'>"+linksListTabs+prevNextButtons+"</div>"
				+"<div id='lANDI508-viewList-scrollable' class='ANDI508-list-scrollable' style='display:none'><table id='lANDI508-viewList-table' aria-label='Links List' tabindex='-1'><thead><tr>"
				+"<th scope='col'><a href='#' aria-label='link number'>#<i aria-hidden='true'></i></a></th>"
				+"<th scope='col'><a href='#'>Alerts <i aria-hidden='true'></i></a></th>"
				+"<th scope='col'><a href='#'>Accessible Name &amp; Description <i aria-hidden='true'></i></a></th>"
				+"<th scope='col'><a href='#'>href <i aria-hidden='true'></i></a></th>"
				+"</tr></thead><tbody>"+linkListTable+"</tbody></table></div>");
			
			//Links List Button
			$("#ANDI508-viewLinksList-button").click(function(){
				if($(this).attr("aria-pressed")=="false"){
					$("#ANDI508-resultsSummary").hide();
					//show Links List, hide alert list
					$("#ANDI508-alerts-list").hide();
					$("#lANDI508-viewList-tabs").show();
					andiSettings.minimode(false);
					$(this)
						.html("hide links list "+listIcon)
						.attr("aria-pressed","true")
						.find("img").attr("src",icons_url+"list-on.png");
					$("#lANDI508-viewList-table").parent().slideDown(AndiSettings.andiAnimationSpeed).focus();
					AndiModule.activeActionButtons.linksList = true;
				}
				else{
					//hide Links List, show alert list
					$("#lANDI508-viewList-table").parent().slideUp(AndiSettings.andiAnimationSpeed);

					$("#lANDI508-viewList-tabs").hide();
					$("#ANDI508-resultsSummary").show();
					
					if(testPageData.numberOfAccessibilityAlertsFound > 0){
						$("#ANDI508-alerts-list").show();
					}
					$(this)
						.html("view links list "+listIcon)
						.attr("aria-pressed","false");
					AndiModule.activeActionButtons.linksList = false;
				}
				andiResetter.resizeHeights();
				return false;
			});
					
			$("#lANDI508-listLinks-tab-all").click(function(){
				selectThisTab(this);
				$("#lANDI508-viewList-table tbody tr").show();
				//Remove All (glowing) Highlights
				$("#ANDI508-testPage").removeClass("lANDI508-highlightInternal lANDI508-highlightExternal lANDI508-highlightAmbiguous");
				//Turn Off Ambiguous Button
				andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
				andiResetter.resizeHeights();
				return false;
			});
			$("#lANDI508-listLinks-tab-internal").click(function(){
				selectThisTab(this);
				$("#lANDI508-viewList-table tbody tr").hide();
				$("#lANDI508-viewList-table tbody tr.lANDI508-listLinks-internal").show();
				//Add (glowing) Highlight for Internal Links
				$("#ANDI508-testPage")
					.removeClass("lANDI508-highlightExternal lANDI508-highlightAmbiguous")
					.addClass("lANDI508-highlightInternal");
				//Turn Off Ambiguous Button
				andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
				andiResetter.resizeHeights();
				return false;
			});
			$("#lANDI508-listLinks-tab-external").click(function(){
				selectThisTab(this);
				$("#lANDI508-viewList-table tbody tr").hide();
				$("#lANDI508-viewList-table tbody tr.lANDI508-listLinks-external").show();
				//Add (glowing) Highlight for External Links
				$("#ANDI508-testPage")
					.removeClass("lANDI508-highlightInternal lANDI508-highlightAmbiguous")
					.addClass("lANDI508-highlightExternal");
				//Turn Off Ambiguous Button
				andiOverlay.overlayButton_off("find",$("#ANDI508-highlightAmbiguousLinks-button"));
				andiResetter.resizeHeights();
				return false;
			});
			
			//Define next tab button
			$("#lANDI508-viewList-table button.lANDI508-nextTab").each(function(){
				$(this)
				.click(function(){
					var allElementsInTestPage = $("#ANDI508-testPage *");
					//TODO: make it work for <a name=>
					var anchorTargetElement = $($(this).attr("data-ANDI508-relatedId"));
					var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
					for(var x=anchorTargetElementIndex; x<allElementsInTestPage.length; x++){
						if($(allElementsInTestPage).eq(x).is(":tabbable")){
							$(allElementsInTestPage).eq(x).focus();
							break;
						}
					}
				});
				//.hover(function(){
				//	var allElementsInTestPage = $("#ANDI508-testPage *");
				//	var anchorTargetElement = $($(this).attr("data-ANDI508-relatedId"));
				//	var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
				//	for(var x=anchorTargetElementIndex; x<allElementsInTestPage.length; x++){
				//		if($(allElementsInTestPage).eq(x).is(":tabbable")){
				//			andiLaser.createLaserTrigger($(this),$(allElementsInTestPage).eq(x));
				//			break;
				//		}
				//	}
				//});
			});

			//Show Startup Summary
			if(!andiBar.focusIsOnInspectableElement()){
				andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>links</span> by tabbing to or hovering over the highlighted elements.",true,"link");
			}
			
			andiAlerter.updateAlertList();
			
			//Click previously active buttons
			if(AndiModule.activeActionButtons.linksList){
				$("#ANDI508-viewLinksList-button").click();
			}
			if(AndiModule.activeActionButtons.highlightAmbiguousLinks){
				$("#ANDI508-highlightAmbiguousLinks-button").click();
			}
		}
		else if(AndiModule.activeActionButtons.buttonsMode){
			andiBar.updateResultsSummary("Buttons Found: "+buttonCount);
			
			$("#ANDI508-buttonsMode-button")
				.attr("aria-selected","true")
				.addClass("ANDI508-module-action-active");
			
			//highlightNonUniqueButtons
			if(nonUniqueButtonCount > 0)
				$("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightNonUniqueButtons-button' aria-label='Highlight "+nonUniqueButtonCount+" Non-Unique Buttons' aria-pressed='false'>"+nonUniqueButtonCount+" non-unique buttons"+findIcon+"</button>");
			
			//highlightNonUniqueButtons Button
			$("#ANDI508-highlightNonUniqueButtons-button").click(function(){
				var testPage = $("#ANDI508-testPage");
				if(!$(testPage).hasClass("lANDI508-highlightAmbiguous")){
					//On
					$("#lANDI508-listButtons-tab-all").click();
					$("#ANDI508-testPage").addClass("lANDI508-highlightAmbiguous");
					andiOverlay.overlayButton_on("find",$(this));
					AndiModule.activeActionButtons.highlightNonUniqueButtons = true;
				}
				else{
					//Off
					$("#ANDI508-testPage").removeClass("lANDI508-highlightAmbiguous");
					andiOverlay.overlayButton_off("find",$(this));
					AndiModule.activeActionButtons.highlightNonUniqueButtons = false;
				}
				andiResetter.resizeHeights();
				return false;
			});
			
			//BUILD BUTTON LIST TABLE
			var buttonListTable = "";
			for(var x=0; x<buttons.length; x++){

				//determine if there is an alert
				rowClasses = "";
				if(buttons[x].alerts.includes("Alert"))
					rowClasses += "ANDI508-table-row-alert ";
				rowClasses = $.trim(rowClasses);
				
				buttonListTable += "<tr class='"+rowClasses+"'>"
					+"<th scope='row'>"+buttons[x].index+"</th>"
					+"<td class='lANDI-alert-column'>"+buttons[x].alerts+"</td>"
					+"<td><a href='#' data-ANDI508-relatedIndex='"+buttons[x].index+"'>"+buttons[x].nameDescription+"</a></td>"
					+"</tr>";
			}
		
			linksListTabs = "";
			linksListTabs += "<button id='lANDI508-listButtons-tab-all' aria-label='View All Buttons' aria-selected='true' class='ANDI508-tab-active' data-lANDI508-relatedClass='ANDI508-element'>all buttons</button>";
			
			prevNextButtons = "";
			prevNextButtons += "<button id='lANDI508-viewList-button-prev' aria-label='Previous Button in this list' accesskey='"+andiHotkeyList.key_prev.key+"'><img src='"+icons_url+"prev.png' alt='' /></button>";
			prevNextButtons += "<button id='lANDI508-viewList-button-next' aria-label='Next Button in this list'  accesskey='"+andiHotkeyList.key_next.key+"'><img src='"+icons_url+"next.png' alt='' /></button>";
			
			$("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewButtonsList-button' class='ANDI508-viewOtherResults-button' aria-label='View Buttons List' aria-pressed='false'>view buttons list "+listIcon+"</button>"
				+"<div id='lANDI508-viewList-tabs'>"+linksListTabs+prevNextButtons+"</div>"
				+"<div id='lANDI508-viewList-scrollable' class='ANDI508-list-scrollable' style='display:none'><table id='lANDI508-viewList-table' aria-label='Buttons List' tabindex='-1'><thead><tr>"
				+"<th scope='col'><a href='#' aria-label='button number'>#<i aria-hidden='true'></i></a></th>"
				+"<th scope='col'><a href='#'>Alerts <i aria-hidden='true'></i></a></th>"
				+"<th scope='col'><a href='#'>Accessible Name &amp; Description <i aria-hidden='true'></i></a></th>"
				+"</tr></thead><tbody>"+buttonListTable+"</tbody></table></div>");
			
			//View Button List Button
			$("#ANDI508-viewButtonsList-button").click(function(){
				if($(this).attr("aria-pressed")=="false"){
					$("#ANDI508-resultsSummary").hide();
					//show Button List, hide alert list
					$("#ANDI508-alerts-list").hide();
					$("#lANDI508-viewList-tabs").show();
					andiSettings.minimode(false);
					$(this)
						.html("hide button list "+listIcon)
						.attr("aria-label","Hide Button List")
						.attr("aria-pressed","true")
						.find("img").attr("src",icons_url+"list-on.png");
					$("#lANDI508-viewList-table").parent().slideDown(AndiSettings.andiAnimationSpeed).focus();
					AndiModule.activeActionButtons.buttonsList = true;
				}
				else{
					//hide Button List, show alert list
					$("#lANDI508-viewList-table").parent().slideUp(AndiSettings.andiAnimationSpeed);

					$("#lANDI508-viewList-tabs").hide();
					$("#ANDI508-resultsSummary").show();
					
					if(testPageData.numberOfAccessibilityAlertsFound > 0){
						$("#ANDI508-alerts-list").show();
					}
					$(this)
						.html("view button list "+listIcon)
						.attr("aria-label","View Button List")
						.attr("aria-pressed","false");
					AndiModule.activeActionButtons.buttonsList = false;
				}
				andiResetter.resizeHeights();
				return false;
			});
					
			$("#lANDI508-listButtons-tab-all").click(function(){
				selectThisTab(this);
				$("#lANDI508-viewList-table tbody tr").show();
				//Remove All (glowing) Highlights
				$("#ANDI508-testPage").removeClass("lANDI508-highlightAmbiguous");
				//Turn Off Ambiguous Button
				andiOverlay.overlayButton_off("find",$("#ANDI508-highlightNonUniqueButtons-button"));
				andiResetter.resizeHeights();
				return false;
			});
			
			//Show Startup Summary
			if(!andiBar.focusIsOnInspectableElement()){
				andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>buttons</span> by tabbing to or hovering over the highlighted elements.",true,"button");
			}
			
			andiAlerter.updateAlertList();
			
			//Click previously active buttons
			if(AndiModule.activeActionButtons.buttonsList){
				$("#ANDI508-viewButtonsList-button").click();
			}
			if(AndiModule.activeActionButtons.highlightNonUniqueButtons){
				$("#ANDI508-highlightNonUniqueButtons-button").click();
			}
		}
		
		//FOR BOTH LINKS AND BUTTONS
		
		//Add focus click to each link (output) in the table
		$("#lANDI508-viewList-table td a[data-ANDI508-relatedIndex]").each(function(){
			andiFocuser.addFocusClick($(this));
			var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
			var relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+relatedIndex+"]").first();
			andiLaser.createLaserTrigger($(this),$(relatedElement));
			$(this)
			.hover(function(){
				if(!event.shiftKey)
					lANDI.inspect($(relatedElement));
			})
			.focus(function(){
				lANDI.inspect($(relatedElement));
			});
		});
		
		//Define listLinks next button
		$("#lANDI508-viewList-button-next").click(function(){
			//Get class name based on selected tab
			var selectedTabClass = $("#lANDI508-viewList-tabs button[aria-selected='true']").attr("data-lANDI508-relatedClass");
			var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
			var focusGoesOnThisIndex;

			if(index == testPageData.andiElementIndex || isNaN(index)){
				//No link being inspected yet, get first element according to selected tab
				focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-ANDI508-index");
				andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to first
			}
			else{
				//Find the next element with class from selected tab and data-ANDI508-index
				//This will skip over elements that may have been removed from the DOM
				for(var x=index; x<testPageData.andiElementIndex; x++){
					//Get next element within set of selected tab type
					if($("#ANDI508-testPage ."+selectedTabClass+"[data-ANDI508-index='"+(x + 1)+"']").length){
						focusGoesOnThisIndex = x + 1;
						andiFocuser.focusByIndex(focusGoesOnThisIndex);
						break;
					}
				}
			}
			
			//Highlight the row in the links list that associates with this element
			lANDI.viewListRowHighlight(focusGoesOnThisIndex);
			
			return false;
		});
		
		//Define listLinks prev button
		$("#lANDI508-viewList-button-prev").click(function(){
			//Get class name based on selected tab
			var selectedTabClass = $("#lANDI508-viewList-tabs button[aria-selected='true']").attr("data-lANDI508-relatedClass");
			var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
			var firstElementInListIndex = $("#ANDI508-testPage ."+selectedTabClass).first().attr("data-ANDI508-index");
			var focusGoesOnThisIndex;
			
			if(isNaN(index)){ //no active element yet
				//get first element according to selected tab
				andiFocuser.focusByIndex(firstElementInListIndex); //loop back to first
				focusGoesOnThisIndex = firstElementInListIndex;
			}
			else if(index == firstElementInListIndex){
				//Loop to last element in list
				focusGoesOnThisIndex = $("#ANDI508-testPage ."+selectedTabClass).last().attr("data-ANDI508-index");
				andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to last
			}
			else{
				//Find the previous element with class from selected tab and data-ANDI508-index
				//This will skip over elements that may have been removed from the DOM
				for(var x=index; x>0; x--){
					//Get next element within set of selected tab type
					if($("#ANDI508-testPage ."+selectedTabClass+"[data-ANDI508-index='"+(x - 1)+"']").length){
						focusGoesOnThisIndex = x - 1;
						andiFocuser.focusByIndex(focusGoesOnThisIndex);
						break;
					}
				}
			}
			
			//Highlight the row in the links list that associates with this element
			lANDI.viewListRowHighlight(focusGoesOnThisIndex);
			
			return false;
		});
	}
	else{
		if(testPageData.numberOfAccessibilityAlertsFound==0){
			//No Alerts
			andiBar.showStartUpSummary("No <span class='ANDI508-module-name-l'>links</span> or <span class='ANDI508-module-name-l'>buttons</span> were found.",false);
		}
		else{
			//Alerts were found
			andiBar.showStartUpSummary("No <span class='ANDI508-module-name-l'>links</span> or <span class='ANDI508-module-name-l'>buttons</span> were found, <br />however there are some accessibility alerts.",true);
			andiAlerter.updateAlertList();
		}
	}
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
lANDI.inspect = function(element){
	if($(element).hasClass("ANDI508-element")){
		
		//Highlight the row in the links list that associates with this element
		var index = $(element).attr("data-ANDI508-index");
		lANDI.viewListRowHighlight(index);
		
		andiBar.prepareActiveElementInspection(element);
		
		var elementData = $(element).data("ANDI508");
		
		displayTable(element);
		
		//This function defines ANDI's output logic for links or buttons.
		AndiModule.outputLogic = function(){
			var usingTitleAsNamer = false;
		//Accessible Name
			//aria-labelledby
			if(andiBar.output.ariaLabelledby(elementData));
			//aria-label
			else if(andiBar.output.ariaLabel(elementData));
		//HTML Namers
			//alt
			else if(!elementData.ignoreAlt && andiBar.output.alt(elementData));
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
	}
	
	//This function displays the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	function displayTable(element){

		var additionalComponents = [
			$(element).attr("href"),
			$(element).attr("rel"),
			$(element).attr("download"),
			$(element).attr("media"),
			$(element).attr("target"),
			$(element).attr("type")
		];
		
		if(andiCheck.wereComponentsFound(elementData,additionalComponents)){
			//add table rows for components found
			andiBar.appendRow("aria-labelledby",	elementData.ariaLabelledby,false,true);
			andiBar.appendRow("aria-label",			elementData.ariaLabel);
			andiBar.appendRow("innerText",			elementData.innerText);
			andiBar.appendRow("child&nbsp;element",	elementData.subtree);
			andiBar.appendRow("imageSrc",			elementData.imageSrc);
			andiBar.appendRow("aria-describedby",	elementData.ariaDescribedby,false,true);
			andiBar.appendRow("title",				elementData.title);
			andiBar.appendRow("href",				additionalComponents[0]);
			andiBar.appendRow("rel",				additionalComponents[1]);
			andiBar.appendRow("download",			additionalComponents[2]);
			andiBar.appendRow("media",				additionalComponents[3]);
			andiBar.appendRow("target",				additionalComponents[4]);
			andiBar.appendRow("type",				additionalComponents[5]);
			
			//add table rows for add-on properties found
			if(elementData.addOnPropertiesTotal != 0){
				andiBar.appendRow("role",			elementData.addOnProperties.role, true);
				andiBar.appendRow("accesskey",		elementData.addOnProperties.accesskey, true);
				andiBar.appendRow("tabindex",		elementData.addOnProperties.tabindex, true);
				andiBar.appendRow("aria-controls",	elementData.addOnProperties.ariaControls, true);
				andiBar.appendRow("aria-expanded",	elementData.addOnProperties.ariaExpanded, true);
				andiBar.appendRow("aria-haspopup",	elementData.addOnProperties.ariaHaspopup, true);
				andiBar.appendRow("aria-hidden",	elementData.addOnProperties.ariaHidden, true);
				andiBar.appendRow("aria-sort",		elementData.addOnProperties.ariaSort, true);
			}
		}
	}
};

//This function will highlight the text of the row.
lANDI.viewListRowHighlight = function(index){
	//var scrollableContainer = $("#lANDI508-viewList-scrollable");
	$("#lANDI508-viewList-table tbody tr").each(function(){
		$(this).removeClass("ANDI508-table-row-inspecting");
		if($(this).find("th").first().html() == index){
			$(this).addClass("ANDI508-table-row-inspecting");
			//$(scrollableContainer).scrollTop($(this).offset().top - $(scrollableContainer).offset().top + $(scrollableContainer).scrollTop());
		}
	});
};

lANDI.analyze();
lANDI.results();

//This function will handle the selection of a tab.
function selectThisTab(tab){
	$("#lANDI508-viewList-tabs button")
		.removeClass()
		.attr("aria-selected","false");
	$(tab)
		.addClass("ANDI508-tab-active")
		.attr("aria-selected","true");
}

//Table Sort Functionality
function sortCompare(index){
    return function(a, b){
        var valA = getCellValue(a, index);
		var valB = getCellValue(b, index);
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
	};
	function getCellValue(row, index){
		return $(row).children('td,th').eq(index).text();
	}
}
//This will define the click logic for the table sorting.
//Table sorting does not use aria-sort because .removeAttr("aria-sort") crashes in old IE
$('#lANDI508-viewList-table th a').click(function(){
	var table = $(this).closest("table");
	$(table).find("th").find("i").html("")
		.end().find("a"); //remove all arrow

	var rows = $(table).find('tr:gt(0)').toArray().sort(sortCompare($(this).parent().index()));
	this.asc = !this.asc;
	if(!this.asc){
		rows = rows.reverse();
		$(this).attr("title","descending")
			.parent().find("i").html("&#9650;"); //up arrow
	}
	else{
		$(this).attr("title","ascending")
			.parent().find("i").html("&#9660;"); //down arrow
	}
	for(var i=0; i<rows.length; i++){
		$(table).append(rows[i]);
	}
});

//This function creates an icon.
//The sortPriority number (hidden) allows the alerts to be at the top on first sort (ascending)
function iconMaker(alertType,titleText){
	var sortPriority = "3"; //default to caution
	if(alertType=="warning")
		sortPriority = "2";
	else if(alertType=="danger")
		sortPriority = "1";
	return "<img src='"+icons_url+alertType+".png' alt='"+alertType+"' title='Accessibility Alert: "+titleText+"' /><i>"+sortPriority+" </i>";
}

}//end init
