//==========================================//
//sANDI: structures ANDI 					//
//Created By Social Security Administration //
//==========================================//
function init_module(){
	
var sANDIVersionNumber = "1.4.2";

//TODO: add a role overlay
						 
//create sANDI instance
var sANDI = new AndiModule(sANDIVersionNumber,"s");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey) //check for holding shift key
		sANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	sANDI.inspect(this);
	andiResetter.resizeHeights();
};

var structureExists = false;
var headingsArray = [];
var listsArray = [];
var listsCount = 0;
var olCount = 0;
var ulCount = 0;
var dlCount = 0;
var fakeHeadingCount = 0;

var landmarksArray = [];

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{headings:true}); //default
	$.extend(AndiModule.activeActionButtons,{lists:false});
	$.extend(AndiModule.activeActionButtons,{landmarks:false});
}

//This function will analyze the test page for graphics/image related markup relating to accessibility
sANDI.analyze = function(){
	
	//Loop through every visible element
	$('#ANDI508-testPage *').filter(':visible').each(function(){
		
		if($(this).is("h1,h2,h3,h4,h5,h6,[role='heading']")){
			//Add to the headings array	
			headingsArray.push($(this));
			structureExists = true;
			
			if(AndiModule.activeActionButtons.headings){
				andiData = new AndiData($(this));
				andiData.grabComponents($(this));
				if($(this).attr("role") && !$(this).attr("aria-level"))
					andiAlerter.throwAlert(alert_0180);
				andiCheck.commonNonFocusableElementChecks(andiData, $(this));
				andiData.attachDataToElement($(this));
			}
		}
		else if($(this).is("ol,ul,li,dl,dd,dt")){
			//Add to the headings array
			listsArray.push($(this));
			structureExists = true;
			
			if($(this).is("ol,ul,dl")){
				if($(this).is("ul"))
					ulCount++;
				else if($(this).is("ol"))
					olCount++;
				else if($(this).is("dl"))
					dlCount++;
				listsCount++;
			}
			
			if(AndiModule.activeActionButtons.lists){
				andiData = new AndiData($(this));
				
				if($(this).is("li")){
					//Is the li contained by an appropriate list container?
					if(!$(this).closest("ol,ul").length){
						andiAlerter.throwAlert(alert_0079);
					}
				}
				else if($(this).is("dd,dt")){
					//Is the dl,dt contained by a dl?
					if(!$(this).closest("dl").length){
						andiAlerter.throwAlert(alert_007A);
					}
				}
				
				andiData.grabComponents($(this));
				andiCheck.commonNonFocusableElementChecks(andiData, $(this));
				andiData.attachDataToElement($(this));
			}
		}
		else if($(this).is("main,header,footer,nav,form,aside,[role='banner'],[role='complementary'],[role='contentinfo'],[role='form'],[role='main'],[role='navigation'],[role='search'],[role='application']")){
			landmarksArray.push($(this));
			structureExists = true;
			
			if(AndiModule.activeActionButtons.landmarks){
				andiData = new AndiData($(this));
				andiData.grabComponents($(this));
				andiCheck.commonNonFocusableElementChecks(andiData, $(this));
				andiData.attachDataToElement($(this));
			}
		}
		else if(AndiModule.activeActionButtons.headings && headingsArray.length == 0 && $(this).is("p,div,span")){
			//No headings exist, look for fake headings
			
			var fakeHeading_limit_textLength = 30;
			var fakeHeading_limit_fontSize = 23; //px
			
			var fakeHeadingFound = false;
			
			var fakeHeading_text = $(this).text();
			if(fakeHeading_text.length < fakeHeading_limit_textLength){
				//fakeHeading_text is less than char limit
				var fakeHeading_fontSize = parseInt($(this).css("font-size"));
				if(fakeHeading_fontSize > fakeHeading_limit_fontSize){
					//fakeHeading_fontSize is greater than size limit
					var nextElement = $(this).next().filter(":visible");
					if($.trim($(nextElement).text())!="" && parseInt($(nextElement).css("font-size")) < fakeHeading_fontSize){
						//next element has text and is smaller than fakeHeading font size
						fakeHeadingFound = true;
					}
					else if(parseInt($(this).parent().css("font-size")) < fakeHeading_fontSize){
						fakeHeadingFound = true;
					}
					else if($(this).css("font-weight") == "bold" || $(this).css("font-weight") == "bolder" || $(this).css("font-weight") >= 700){
						fakeHeadingFound = true;
					}
				}
			}
			
			if(fakeHeadingFound){
				fakeHeadingCount++;
				structureExists = true;
				
				andiData = new AndiData($(this));
				andiData.grabComponents($(this));
				andiAlerter.throwAlert(alert_0190);
				andiData.attachDataToElement($(this));
			}
		}
	});
};

//Initialize outline
sANDI.outline = "<h3 tabindex='-1' id='sANDI508-outline-heading'>Structure Outline:</h3><div class='sANDI508-outline-scrollable'>";

sANDI.getOutlineItem = function(element){
	var displayCharLength = 60;
	var tagName = $(element).prop('tagName').toLowerCase();
	var role = $(element).attr("role");
	var ariaLevel = $(element).attr("aria-level");
	
	//Indent the heading according to the level
	var indentLevel;
	if(ariaLevel)
		indentLevel = parseInt(ariaLevel);
	else
		indentLevel = parseInt(tagName.slice(1));
	indentLevel = (indentLevel - 1) * 3; //multiply the indentLevel to increase the margin
	
	var outlineItem = "<a style='margin-left:"+indentLevel+"em' href='#' data-ANDI508-relatedIndex='"+$(element).attr('data-ANDI508-index')+"'>&lt;"+tagName;
	
	//attributes
	if(role)
		outlineItem += " role='" + role + "' ";
	if(ariaLevel)
		outlineItem += " aria-level='" + ariaLevel + "' ";
	
	outlineItem += "&gt;";
	outlineItem += "<span class='ANDI508-display-innerText'>";
	outlineItem += $.trim(andiUtility.formatForHtml($(element).text().substring(0,displayCharLength)));
	if($(element).html().length > displayCharLength){
		outlineItem += "...";
	}
	outlineItem += "</span>";
	outlineItem += "&lt;/"+tagName+"&gt;</a>";
	outlineItem += "<br />";
	return outlineItem;
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
sANDI.results = function(){
	
	var moduleActionButtons = "";
	moduleActionButtons += "<button id='ANDI508-headings-button' class='sANDI508-mode' aria-label='"+headingsArray.length+" Headings'>"+headingsArray.length+" headings</button>";
	moduleActionButtons += "<button id='ANDI508-lists-button' class='sANDI508-mode' aria-label='"+listsCount+" Lists'>"+listsCount+" lists</button>";
	moduleActionButtons += "<button id='ANDI508-landmarks-button' class='sANDI508-mode' aria-label='"+landmarksArray.length+" Landmarks'>"+landmarksArray.length+" landmarks</button>";
	
	$("#ANDI508-module-actions").html(moduleActionButtons);

	//Define sANDI mode buttons (headings, lists, landmarks)
	$("#ANDI508-headings-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = true;
		AndiModule.activeActionButtons.lists = false;
		AndiModule.activeActionButtons.landmarks = false;
		AndiModule.launchModule("s");
		andiResetter.resizeHeights();
	});
	$("#ANDI508-lists-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = false;
		AndiModule.activeActionButtons.lists = true;
		AndiModule.activeActionButtons.landmarks = false;
		AndiModule.launchModule("s");
		andiResetter.resizeHeights();
	});
	$("#ANDI508-landmarks-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = false;
		AndiModule.activeActionButtons.lists = false;
		AndiModule.activeActionButtons.landmarks = true;
		AndiModule.launchModule("s");
		andiResetter.resizeHeights();
	});
	
	//Deselect all mode buttons
	$("#ANDI508-module-actions button.sANDI508-mode").attr("aria-selected","false");
	
	if(structureExists){
		
		//HEADINGS
		if(AndiModule.activeActionButtons.headings){
			$("#ANDI508-headings-button")
				.attr("aria-selected","true")
				.addClass("ANDI508-module-action-active");
			if(headingsArray.length > 0){
				//Build Outline
				for(var x=0; x<headingsArray.length; x++){
					sANDI.outline  += sANDI.getOutlineItem(headingsArray[x]);
				}
				sANDI.outline += "</div>";

				andiBar.updateResultsSummary("Headings: "+headingsArray.length);
				
				$("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-pressed='false'>view outline "+listIcon+"</button><div id='sANDI508-outline-container'></div>");
				
				//Define outline button
				$("#ANDI508-viewOutline-button").click(function(){
					if($(this).attr("aria-pressed")=="true"){
						//hide Outline, show alert list
						$("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
						if(testPageData.numberOfAccessibilityAlertsFound > 0){
							$("#ANDI508-alerts-list").show();
						}
						$(this)
							.html("view outline "+listIcon)
							.attr("aria-pressed","false")
							.removeClass("ANDI508-module-action-active");
					}
					else{
						//show Outline, hide alert list
						$("#ANDI508-alerts-list").hide();
						
						andiSettings.minimode(false);
						$(this)
							.html("hide outline "+listIcon)
							.attr("aria-pressed","true")
							.addClass("ANDI508-module-action-active")
							.find("img").attr("src",icons_url+"list-on.png");
						$("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed);
							//.find("h3").first().focus();
					}
					andiResetter.resizeHeights();
					return false;
				});
				
				andiBar.showStartUpSummary("Heading structure found.<br />Determine if headings are appropriatly applied.",true);
			}
			else if(testPageData.numberOfAccessibilityAlertsFound==0){
				//No Alerts
				andiBar.showStartUpSummary("No Headings.",false);
			}
			else{
				//Alerts were found
				andiBar.updateResultsSummary("Headings: "+headingsArray.length);
				andiBar.showStartUpSummary("No Heading structure was found, <br />however there are some accessibility alerts.",true);
			}
		}
		//LISTS
		else if(AndiModule.activeActionButtons.lists){
			$("#ANDI508-lists-button")
				.attr("aria-selected","true")
				.addClass("ANDI508-module-action-active");
			//No outline for lists mode
			if(listsArray.length > 0){
				andiBar.updateResultsSummary("List Elements: "+listsArray.length);
				var listCounts = "";
				var delimiter = "";
				var listTypesUsed = "";
				if(olCount>0){
					listCounts += olCount + " ordered list (ol)";
					listTypesUsed += "ol";
					delimiter = ", ";
				}
				if(ulCount>0){
					listCounts += delimiter + ulCount + " unordered list (ul)";
					listTypesUsed += delimiter + "ul";
					delimiter = ", ";
				}
				if(dlCount>0){
					listCounts += delimiter + dlCount + " description list (dl)";
					listTypesUsed += delimiter + "dl";
				}
				$("#ANDI508-additionalPageResults").html(listCounts);
				andiBar.showStartUpSummary("List structure found.<br />Determine if the list container types used ("+listTypesUsed+") are appropriatly applied.",true);
			}
			else{
				andiBar.showStartUpSummary("No Lists.",false);
				
			}
		}
		//LANDMARKS
		else if(AndiModule.activeActionButtons.landmarks){
			$("#ANDI508-landmarks-button")
				.attr("aria-selected","true")
				.addClass("ANDI508-module-action-active");
			//No outline for landmarks mode
			if(landmarksArray.length > 0){
				andiBar.updateResultsSummary("Landmarks: "+landmarksArray.length);
								
				andiBar.showStartUpSummary("Landmark structure found.<br />Ensure that each landmark is applied appropriately to the corresponding section of the page.",true);
			}
			else{
				andiBar.showStartUpSummary("No Landmarks.",false);
			}
		}
		
		andiAlerter.updateAlertList();
		
		$("#sANDI508-outline-container")
		.html(sANDI.outline)
		.find("a[data-ANDI508-relatedIndex]").each(function(){
			andiFocuser.addFocusClick($(this));
			var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
			var relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+relatedIndex+"]").first();
			andiLaser.createLaserTrigger($(this),$(relatedElement));
			$(this)
			.hover(function(){
				if(!event.shiftKey)
					sANDI.inspect($(relatedElement));
			})
			.focus(function(){
				sANDI.inspect($(relatedElement));
			});
		});
		
		$("#sANDI508-outline-container")
		.html(sANDI.outline)
		.find("a[data-ANDI508-relatedIndex]").each(function(){
			andiFocuser.addFocusClick($(this));
			var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
			var relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+relatedIndex+"]").first();
			andiLaser.createLaserTrigger($(this),$(relatedElement));
			$(this)
			.hover(function(){
				if(!event.shiftKey)
					sANDI.inspect($(relatedElement));
			})
			.focus(function(){
				sANDI.inspect($(relatedElement));
			});
		});
	}
	else{
		andiBar.showStartUpSummary("No Headings, Lists, or Landmarks Found.",false);
	}
	
	$("#ANDI508").focus();
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
sANDI.inspect = function(element){
	if($(element).hasClass("ANDI508-element")){
		andiBar.prepareActiveElementInspection(element);
		
		var elementData = $(element).data("ANDI508");
		
		displayTable(element);
		
		//This function defines ANDI's output logic for any type of element.
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
		
		var additionalComponents = [];
		
		if(andiCheck.wereComponentsFound(elementData, additionalComponents)){
			//add table rows for components found
			andiBar.appendRow("aria-labelledby",	elementData.ariaLabelledby,false,true);
			andiBar.appendRow("aria-label",			elementData.ariaLabel);
			andiBar.appendRow("alt",				elementData.alt);
			andiBar.appendRow("innerText",			elementData.innerText);
			andiBar.appendRow("child&nbsp;element",	elementData.subtree);
			andiBar.appendRow("imageSrc",			elementData.imageSrc);
			andiBar.appendRow("aria-describedby",	elementData.ariaDescribedby,false,true);
			andiBar.appendRow("title",				elementData.title);
			
			//add table rows for add-on properties found
			if(elementData.addOnPropertiesTotal != 0){
				andiBar.appendRow("role",			elementData.addOnProperties.role, true);
				andiBar.appendRow("accesskey",		elementData.addOnProperties.accesskey, true);
				andiBar.appendRow("tabindex",		elementData.addOnProperties.tabindex, true);
				andiBar.appendRow("aria-hidden",	elementData.addOnProperties.ariaHidden, true);
			}
		}
	}
};

sANDI.analyze();
sANDI.results();

}//end init
