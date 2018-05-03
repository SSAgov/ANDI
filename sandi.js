//==========================================//
//sANDI: structures ANDI 					//
//Created By Social Security Administration //
//==========================================//
function init_module(){
	
var sANDIVersionNumber = "1.10.4";

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
var listRoleCount = 0;
var fakeHeadingCount = 0;
var langAttributesCount = 0;
var roleAttributesCount = 0;
var htmlLangAttribute = $.trim($("html").first().prop("lang")); //get the lang attribute from the HTML element

var landmarksArray = [];

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{headings:true}); //default
	$.extend(AndiModule.activeActionButtons,{lists:false});
	$.extend(AndiModule.activeActionButtons,{landmarks:false});
	$.extend(AndiModule.activeActionButtons,{roleAttributes:false});
	$.extend(AndiModule.activeActionButtons,{langAttributes:false});
}

//This function will analyze the test page for graphics/image related markup relating to accessibility
sANDI.analyze = function(){
	
	//Loop through every visible element
	$(TestPageData.allVisibleElements).each(function(){
		
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
		else if($(this).is("ol,ul,li,dl,dd,dt,[role=listitem],[role=list]")){
			//Add to the headings array
			listsArray.push($(this));
			structureExists = true;
			
			if($(this).is("ol,ul,dl,[role=list]")){
				if($(this).is("ul"))
					ulCount++;
				else if($(this).is("ol"))
					olCount++;
				else if($(this).is("dl"))
					dlCount++;
				else
					listRoleCount++;
				listsCount++;
			}
			
			if(AndiModule.activeActionButtons.lists){
				andiData = new AndiData($(this));
				
				if($(this).is("li")){
					//Is the li contained by an appropriate list container?
					if(!$(this).closest("ol,ul").length)
						andiAlerter.throwAlert(alert_0079);
				}
				else if($(this).is("dd,dt") && !$(this).closest("dl").length){//Is the dl,dt contained by a dl?
					andiAlerter.throwAlert(alert_007A);
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
		else if(AndiModule.activeActionButtons.headings && headingsArray.length === 0 && $(this).is("p,div,span")){
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
					if($.trim($(nextElement).text()) !== "" && parseInt($(nextElement).css("font-size")) < fakeHeading_fontSize){
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
		
		if($(this).attr("role"))
			roleAttributesCount++;
		
		if($(this).prop("lang") && $(this).prop("lang").trim() !== ""){
			langAttributesCount++;
		}

	});
	
	if(htmlLangAttribute)
		langAttributesCount++;
};

//Initialize outline
sANDI.outline = "<h3 tabindex='-1' id='sANDI508-outline-heading'>Structure Outline:</h3><div class='sANDI508-outline-scrollable'>";

sANDI.getOutlineItem = function(element){
	var displayCharLength = 60;
	var tagName = $(element).prop("tagName").toLowerCase();
	var role = $(element).attr("role");
	var ariaLevel = $(element).attr("aria-level");
	
	//Indent the heading according to the level
	//Results in h1 = 1% left margin, h2 = 2% left margin, etc.
	var indentLevel;
	if(ariaLevel)
		indentLevel = parseInt(ariaLevel);
	else
		indentLevel = parseInt(tagName.slice(1));
	
	var outlineItem = "<a style='margin-left:"+indentLevel+"%' href='#' data-ANDI508-relatedIndex='"+$(element).attr('data-ANDI508-index')+"'>&lt;"+tagName;
	
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
	
	moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-role-button' aria-pressed='false' aria-label='"+roleAttributesCount+" Role Attributes'>"+roleAttributesCount+" role attributes"+overlayIcon+"</button>";
	
	//lang attributes button
	var htmlLangText = "The HTML element does not have a lang attribute.";
	if(htmlLangAttribute)
		htmlLangText = "The HTML element has a lang attribute value of "+htmlLangAttribute+".";
	moduleActionButtons += "<button id='ANDI508-lang-button' aria-pressed='false' aria-label='"+langAttributesCount+" Lang Attributes, "+htmlLangText+"'>"+langAttributesCount+" lang attributes"+overlayIcon+"</button>";
	
	$("#ANDI508-module-actions").html(moduleActionButtons);

	//Define sANDI mode buttons (headings, lists, landmarks)
	$("#ANDI508-headings-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = true;
		AndiModule.activeActionButtons.lists = false;
		AndiModule.activeActionButtons.landmarks = false;
		AndiModule.launchModule("s");
	});
	$("#ANDI508-lists-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = false;
		AndiModule.activeActionButtons.lists = true;
		AndiModule.activeActionButtons.landmarks = false;
		AndiModule.launchModule("s");
	});
	$("#ANDI508-landmarks-button").click(function(){
		andiResetter.softReset($("#ANDI508-testPage"));
		AndiModule.activeActionButtons.headings = false;
		AndiModule.activeActionButtons.lists = false;
		AndiModule.activeActionButtons.landmarks = true;
		AndiModule.launchModule("s");
	});
	
	//Define the lang attributes button
	$("#ANDI508-lang-button").click(function(){
		if($(this).attr("aria-pressed") == "false"){
			andiOverlay.overlayButton_on("overlay",$(this));
			
			var langOverlayText = "";
			var overlayObject;
			$("#ANDI508-testPage [lang]").filter(":visible").each(function(){
				if($(this).prop("lang").trim() != ""){
					langOverlayText = $(this).prop("tagName").toLowerCase()+" lang="+$(this).prop("lang");
					overlayObject = andiOverlay.createOverlay("ANDI508-overlay-langAttributes", langOverlayText);
					andiOverlay.insertOverlay(this, overlayObject);
				}
			});
			
			if($("html").first().prop("lang")){
				langOverlayText = "html lang="+$("html").first().prop("lang");
				overlayObject = andiOverlay.createOverlay("ANDI508-overlay-langAttributes", langOverlayText);
				$("#ANDI508-testPage").prepend(overlayObject);
			}
			
			AndiModule.activeActionButtons.langAttributes = true;
		}
		else{
			andiOverlay.overlayButton_off("overlay",$(this));
			andiOverlay.removeOverlay("ANDI508-overlay-langAttributes");
			AndiModule.activeActionButtons.langAttributes = false;
		}
		andiResetter.resizeHeights();
		return false;
	});
	
	//Define the lang attributes button
	$("#ANDI508-role-button").click(function(){
		if($(this).attr("aria-pressed") == "false"){
			andiOverlay.overlayButton_on("overlay",$(this));
			
			var langOverlayText = "";
			var overlayObject;
			$("#ANDI508-testPage [role]").filter(":visible").each(function(){
				langOverlayText = $(this).prop('tagName').toLowerCase()+" role="+$(this).attr("role");
				overlayObject = andiOverlay.createOverlay("ANDI508-overlay-roleAttributes", langOverlayText);
				andiOverlay.insertOverlay(this, overlayObject);
			});

			AndiModule.activeActionButtons.roleAttributes = true;
		}
		else{
			andiOverlay.overlayButton_off("overlay",$(this));
			andiOverlay.removeOverlay("ANDI508-overlay-roleAttributes");
			AndiModule.activeActionButtons.roleAttributes = false;
		}
		andiResetter.resizeHeights();
		return false;
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
				
				$("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view outline</button><div id='sANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");
				
				//Define outline button
				$("#ANDI508-viewOutline-button").click(function(){
					if($(this).attr("aria-expanded")=="true"){
						//hide Outline, show alert list
						$("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
						if(testPageData.numberOfAccessibilityAlertsFound > 0){
							$("#ANDI508-alerts-list").show();
						}
						$(this)
							.addClass("ANDI508-viewOtherResults-button-expanded")
							.html(listIcon+"view outline")
							.attr("aria-expanded","false")
							.removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
					}
					else{
						//show Outline, hide alert list
						$("#ANDI508-alerts-list").hide();
						
						andiSettings.minimode(false);
						$(this)
							.html(listIcon+"hide outline")
							.attr("aria-expanded","true")
							.addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
							.find("img").attr("src",icons_url+"list-on.png");
						$("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
					}
					andiResetter.resizeHeights();
					return false;
				});
				
				andiBar.showElementControls();
				andiBar.showStartUpSummary("Heading structure found.<br />Determine if <span class='ANDI508-module-name-s'>headings</span> are appropriatly applied.",true);
			}
			else{
				//No Headings
				andiBar.hideElementControls();
				if(testPageData.numberOfAccessibilityAlertsFound === 0){
					//No Alerts
					andiBar.showStartUpSummary("No <span class='ANDI508-module-name-s'>headings</span>.",false);
				}
				else{
					//Alerts were found
					andiBar.updateResultsSummary("Headings: "+headingsArray.length);
					andiBar.showStartUpSummary("No <span class='ANDI508-module-name-s'>headings</span> detected, <br />however there are some accessibility alerts.",true);
				}
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
				if(listRoleCount>0){
					listCounts += delimiter + listRoleCount + " role=list";
					listTypesUsed += delimiter + "[role=list]";
				}
				$("#ANDI508-additionalPageResults").html(listCounts);
				andiBar.showElementControls();
				andiBar.showStartUpSummary("List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used ("+listTypesUsed+") are appropriatly applied.",true);
			}
			else{
				//No Lists
				andiBar.hideElementControls();
				andiBar.showStartUpSummary("No <span class='ANDI508-module-name-s'>lists</span>.",false);
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
				andiBar.showElementControls();
				andiBar.showStartUpSummary("Landmark structure found.<br />Ensure that each <span class='ANDI508-module-name-s'>landmark</span> is applied appropriately to the corresponding section of the page.",true);
			}
			else{
				//No Landmarks
				andiBar.hideElementControls();
				andiBar.showStartUpSummary("No <span class='ANDI508-module-name-s'>landmarks</span>.",false);
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
		
		//Click previously active buttons
		if(AndiModule.activeActionButtons.roleAttributes){
			$("#ANDI508-role-button").click();
		}
		if(AndiModule.activeActionButtons.langAttributes){
			$("#ANDI508-lang-button").click();
		}
	}
	else{
		andiBar.hideElementControls();
		andiBar.showStartUpSummary("No <span class='ANDI508-module-name-s'>headings</span>, <span class='ANDI508-module-name-s'>lists</span>, or <span class='ANDI508-module-name-s'>landmarks</span> were detected.",false);
	}
	
	$("#ANDI508").focus();
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
sANDI.inspect = function(element){
	if($(element).hasClass("ANDI508-element")){
		andiBar.prepareActiveElementInspection(element);
		
		var elementData = $(element).data("ANDI508");
		
		var additionalComponents = [
			$(element).attr("aria-level")
		];
		
		andiBar.displayTable(elementData,
			[
				["aria-labelledby", elementData.ariaLabelledby],
				["aria-label", elementData.ariaLabel],
				["alt", elementData.alt],
				["innerText", elementData.innerText],
				["child", elementData.subtree],
				["imageSrc", elementData.imageSrc],
				["aria-describedby", elementData.ariaDescribedby],
				["title", elementData.title]
			],
			[
				["aria-level", additionalComponents[0]],
				["aria-hidden", elementData.addOnProperties.ariaHidden],
				["tabindex", elementData.addOnProperties.tabindex],
				["accesskey", elementData.addOnProperties.accesskey]
			],
			additionalComponents
		);

		andiBar.displayOutput(elementData);	
	}
};

sANDI.analyze();
sANDI.results();

}//end init
