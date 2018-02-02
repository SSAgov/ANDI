//==========================================//
//hANDI: hidden content ANDI 				//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var handiVersionNumber = "3.0.10";

//TODO: report whether an element should be visible or invisible to a screen reader

//create hANDI instance
var hANDI = new AndiModule(handiVersionNumber,"h");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey && $(this).hasClass("ANDI508-forceReveal")) //check for holding shift key
		hANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	hANDI.inspect(this);
	andiResetter.resizeHeights();
};

hANDI.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	var hidingTechniques = $(element).attr("data-hANDI508-hidingTechniques");
	var cssContent = $(element).attr("data-hANDI508-cssContent");
	$("#ANDI508-additionalElementDetails").html("");
	
	if(hidingTechniques)
		$("#ANDI508-additionalElementDetails").append(hidingTechniques);
	if(cssContent)
		$("#ANDI508-additionalElementDetails").append(cssContent);
};

var hiddenElements = 0;
var hidingTechniquesUsed = 0;

var hidden_display = 0;
var hidden_visibility = 0;
var hidden_position = 0;
var hidden_opacity = 0;
var hidden_overflow = 0;
var hidden_fontSize = 0;
var hidden_textIndent = 0;
var hidden_html5Hidden = 0;

var elementsWithCssInjectedContent = 0;

var prevNextBtnsVisible = false;

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{forceReveal_display:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_visibility:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_position:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_opacity:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_overflow:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_fontSize:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_textIndent:false});
	$.extend(AndiModule.activeActionButtons,{forceReveal_html5Hidden:false});
	$.extend(AndiModule.activeActionButtons,{highlightCssContent:false});
	$.extend(AndiModule.activeActionButtons,{titleAttributes:false});
}

if(!prevNextBtnsVisible){
	$("#ANDI508-resultsSummary").hide(); //hide next/prev buttons
}

//This function returns true if the element contains elements that might need accessibility testing, false if not.
hANDI.containsTestableContent = function(element){
	var needsTesting = true;
	var isContainerElement = $(element).isContainerElement();
	var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";
	
	//Does this element contain content that needs testing
	if(isContainerElement 
		&& ($.trim($(element).html()) == "" 
			|| ($.trim($(element).text()) == "" 
					&& $(element).find(elementsNeedingTesting).length === 0 )))
	{
		needsTesting = false; //this element doesn't need testing
	}
	//Is this element one that needs testing?
	else if(!isContainerElement
		&& $(element).is(elementsNeedingTesting))
	{
		needsTesting = false; //this element doesn't need testing
	}
	
	return needsTesting;
};

//This function will analyze the test page for elements hidden using CSS
hANDI.analyze = function(){
	var isHidingContent, elementCss;
	$("#ANDI508-testPage *").not("area,base,basefont,datalist,head,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function(){
		isHidingContent = false;
		elementCss = "";
		
		if(hANDI.containsTestableContent(this)){
			if($(this).css("display")=="none"){
				//element display is none
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-display").length === 0)
					hidden_display++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-display");
				elementCss += "display:none; ";
			}
			if($(this).css("visibility")=="hidden"){
				//element visibility is hidden
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-visibility").length === 0)
					hidden_visibility++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-visibility");
				elementCss += "visibility:hidden; ";
			}
			if($(this).css("position")=="absolute" && ($(this).offset().left < 0 || $(this).offset().top < 0)){
				//element is positioned offscreen
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-position").length === 0)
					hidden_position++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-position");
				elementCss += "position:absolute; ";
			}
			if($(this).css("opacity")=="0"){
				//element opacity is zero
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-opacity").length === 0)
					hidden_opacity++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-opacity");
				elementCss += "opacity:0; ";
			}
			//if element has innerText
			if($(this).isContainerElement() && $.trim($(this).text())){
				if($(this).css("overflow")=="hidden"
					&& (convertToInt($(this).css("height"))<=1 || convertToInt($(this).css("width"))<=1))
				{
					//element has overflow hidden and a small height or width
					hiddenElements++;
					isHidingContent = true;
					if($(this).closest(".ANDI508-forceReveal-overflow").length === 0)
						hidden_overflow++; //increment count if not contained by another of same hiding technique
					$(this).addClass("ANDI508-forceReveal-overflow");
					elementCss += "overflow:hidden; ";
				}
				if(convertToInt($(this).css("font-size")) === 0){
					//element font-size is 0
					hiddenElements++;
					isHidingContent = true;
					if($(this).closest(".ANDI508-forceReveal-fontSize").length === 0)
						hidden_fontSize++; //increment count if not contained by another of same hiding technique
					$(this).addClass("ANDI508-forceReveal-fontSize");
					elementCss += "font-size:0; ";
				}
			}
			if($(this).css("text-indent") != "0" || $(this).css("text-indent") != "0px"){
				if(convertToInt($(this).css("text-indent")) < -998){
					//element has a text-indent that makes it off screen
					hiddenElements++;
					isHidingContent = true;
					if($(this).closest(".ANDI508-forceReveal-textIndent").length === 0)
						hidden_textIndent++; //increment count if not contained by another of same hiding technique
					$(this).addClass("ANDI508-forceReveal-textIndent");
					elementCss += "text-indent:"+$(this).css("text-indent")+"; ";
				}
			}
			if($(this).attr("hidden")){
				//element has html5 hidden attribute
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-html5Hidden").length === 0)
					hidden_html5Hidden++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-html5Hidden");
				elementCss += "\/*html5 hidden*\/ ";
			}
		}
		
		if(isHidingContent){
			//create data-hANDI508-hidingTechniques
			if(elementCss != ""){
				elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
				$(this).attr("data-hANDI508-hidingTechniques",elementCss);
			}
			
			andiData = new AndiData($(this));
			andiData.attachDataToElement($(this));
		}
	});
	
	if(!oldIE){
		hANDI.detectCssInjectedContent();
	
		if($("#ANDI508-testPage .hANDI508-hasHiddenCssContent").first().length)
			andiAlerter.throwAlert(alert_0220,"Page has "+alert_0220.message, 0);
		
		//$("#ANDI508-testPage .hANDI508-hasHiddenCssContent").each(function(){
		//	andiData = new AndiData($(this));
		//	andiAlerter.throwAlert(alert_0220);
		//	andiData.attachDataToElement($(this));
		//});
	}
};

//This function will detect content hidden using css :before :after content.
//Current scren readers will not read text injected using this method.
hANDI.detectCssInjectedContent = function(){
	var everyElement = document.querySelectorAll('#ANDI508-testPage *');
	var before, after, hasHiddenCSSContent, cssDisplay;
	
	//Loop through every element on the page
	for(var x=0; x<everyElement.length; x++){
		hasHiddenCSSContent = false; //reset to false
		cssDisplay = "";
		
		before = window.getComputedStyle(everyElement[x], ':before').getPropertyValue('content');
		if(hasContent(before)){
			//element has injected content using :before
			hasHiddenCSSContent = true;
			cssDisplay += before + " ";
		}
			
		after = window.getComputedStyle(everyElement[x], ':after').getPropertyValue('content');
		if(hasContent(after)){
			//element has injected content using :after
			hasHiddenCSSContent = true;
			cssDisplay += after;
		}
		
		if(hasHiddenCSSContent){
			elementsWithCssInjectedContent++;
			$(everyElement[x]).addClass("hANDI508-hasHiddenCssContent");
			//$(everyElement[x]).attr("data-hANDI508-cssContent","<h3 class='ANDI508-heading'>Inaccessible CSS Content:</h3> "+cssDisplay);
		}
	}
	
	//This function will return true if content exists and has printable characters
	function hasContent(content){
		if(content != "none"){
			//Look for printable characters
			for(var i=0; i<content.length; i++){
				if(content.charCodeAt(i) > 32 && content.charCodeAt(i) < 127){
					if(content.charCodeAt(i) != 34) //Exclude double quote
						return true;
				}
			}
		}
		return false;
	}
};

//This function will strip out the unit (px, em, pt) and convert to an Int
function convertToInt(value){
	return parseInt(value.replace(/[^-\d\.]/g, ''));
}

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
hANDI.results = function(){

	andiBar.updateResultsSummary("Revealed Elements: ");

	//Are There Hidden Elements?
	if(hiddenElements > 0 || elementsWithCssInjectedContent > 0){
		//Yes, Hidden Elements were found

		//Add Module Mode Buttons
		var moduleActionButtons = "";
		
		if(hidden_display > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealDisplay-button' class='hANDI-revealButton' aria-label='"+hidden_display+" display:none' aria-pressed='false'>"+hidden_display+" display:none"+findIcon+"</button>";
		}
		if(hidden_visibility > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealVisibility-button' class='hANDI-revealButton' aria-label='"+hidden_visibility+" visibility:hidden' aria-pressed='false'>"+hidden_visibility+" visibility:hidden"+findIcon+"</button>";
		}
		if(hidden_position > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealPosition-button' class='hANDI-revealButton' aria-label='"+hidden_position+" position:absolute' aria-pressed='false'>"+hidden_position+" position:absolute"+findIcon+"</button>";
		}
		if(hidden_overflow > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealOverflow-button' class='hANDI-revealButton' aria-label='"+hidden_overflow+" overflow:hidden' aria-pressed='false'>"+hidden_overflow+" overflow:hidden"+findIcon+"</button>";
		}
		if(hidden_fontSize > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealFontSize-button' class='hANDI-revealButton' aria-label='"+hidden_fontSize+" font-size:0' aria-pressed='false'>"+hidden_fontSize+" font-size:0"+findIcon+"</button>";
		}
		if(hidden_textIndent > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealTextIndent-button' class='hANDI-revealButton' aria-label='"+hidden_textIndent+" text-indent' aria-pressed='false'>"+hidden_textIndent+" text-indent"+findIcon+"</button>";
		}
		if(hidden_html5Hidden > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealHtml5Hidden-button' class='hANDI-revealButton' aria-label='"+hidden_html5Hidden+" html5 hidden' aria-pressed='false'>"+hidden_html5Hidden+" html5 hidden"+findIcon+"</button>";
		}
		if(hidden_opacity > 0){
			hidingTechniquesUsed++;
			moduleActionButtons += "<button id='ANDI508-forceRevealOpacity-button' class='hANDI-revealButton' aria-label='"+hidden_opacity+" opacity:0' aria-pressed='false'>"+hidden_opacity+" opacity:0"+findIcon+"</button>";
		}
		
		if(hidingTechniquesUsed > 1)
			moduleActionButtons = "<button id='ANDI508-forceRevealAll-button' aria-label='Reveal All' aria-pressed='false'>reveal all"+findIcon+"</button><span class='ANDI508-module-actions-spacer'>|</span> " + moduleActionButtons;
		
		if(elementsWithCssInjectedContent > 0){
			if(hidingTechniquesUsed > 0)
				moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;";
			moduleActionButtons += "<button id='ANDI508-highlightCssContent-button' aria-label='content ::before ::after "+elementsWithCssInjectedContent+" CSS Content' aria-pressed='false'>content ::before ::after "+elementsWithCssInjectedContent+findIcon+"</button>";
		}
		
		if(TestPageData.page_using_titleAttr)
			//Title Attributes Button
			moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes"+overlayIcon+"</button>";
		
		$("#ANDI508-module-actions").html(moduleActionButtons);
	
		//Define forceRevealAll button
		$("#ANDI508-forceRevealAll-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				//turn on each reveal button
				$("#ANDI508-module-actions .hANDI-revealButton").each(function(){
					if($(this).attr("aria-pressed")=="false")
						$(this).click();
				});
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				//turn off each reveal button
				$("#ANDI508-module-actions .hANDI-revealButton").each(function(){
					if($(this).attr("aria-pressed")=="true")
						$(this).click();
				});
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealDisplay button
		$("#ANDI508-forceRevealDisplay-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-display").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_display = true;
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_display = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
			
		//Define forceRevealVisibility button
		$("#ANDI508-forceRevealVisibility-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-visibility").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_visibility = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_visibility = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealPosition button
		$("#ANDI508-forceRevealPosition-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-position").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_position = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_position = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealOpacity button
		$("#ANDI508-forceRevealOpacity-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-opacity").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_opacity = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_opacity = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealOverflow button
		$("#ANDI508-forceRevealOverflow-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-overflow").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_overflow = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_overflow = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealFontSize button
		$("#ANDI508-forceRevealFontSize-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-fontSize").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_fontSize = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_fontSize = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealTextIndent button
		$("#ANDI508-forceRevealTextIndent-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-textIndent").addClass("ANDI508-forceReveal");
				AndiModule.activeActionButtons.forceReveal_textIndent = true;
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.forceReveal_textIndent = false;
				hANDI.unreveal();
			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define forceRevealHtml5Hidden button
		//This button will also remove/add the hidden attribute
		$("#ANDI508-forceRevealHtml5Hidden-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-html5Hidden")
					.addClass("ANDI508-forceReveal")
					.removeAttr("hidden"); //remove the attribute
				AndiModule.activeActionButtons.forceReveal_html5Hidden = true;

			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				$("#ANDI508-testPage .ANDI508-forceReveal-html5Hidden")
					.attr("hidden","hidden");//add the attribute back on
				AndiModule.activeActionButtons.forceReveal_html5Hidden = false;
				hANDI.unreveal();

			}
			hANDI.toggleRevealAllButton();
			andiResetter.resizeHeights();
			return false;
		});
		
		//=============================================
		//Define highlightCssContent button
		$("#ANDI508-highlightCssContent-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage").addClass("hANDI508-highlightCssContent");
				AndiModule.activeActionButtons.highlightCssContent = true;
			}
			else{
				$("#ANDI508-testPage").removeClass("hANDI508-highlightCssContent");
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.highlightCssContent = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//=============================================
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
		
		//=============================================
		var showStartUpSummaryText = "";
		if(hiddenElements > 0){
			showStartUpSummaryText += "Discover <span class='ANDI508-module-name-h'>hidden content</span> that should be tested for accessibility using other ANDI modules.<br />"
				+"The revealed content will not remain revealed after changing modules.<br /><br />"
				+"This page has content hidden using CSS - Use the style toggle buttons to force the hidden content to be revealed. ";
		}
		if(elementsWithCssInjectedContent > 0){
			showStartUpSummaryText += "This page has content injected using CSS pseudo-elements ::before or ::after which may not be accessible to users of assistive technologies.";
		}
		andiBar.showStartUpSummary(showStartUpSummaryText,true);
		
		andiAlerter.updateAlertList();
		
		//Click previously active buttons
		if(AndiModule.activeActionButtons.forceReveal_display){
			$("#ANDI508-forceRevealDisplay-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_visibility){
			$("#ANDI508-forceRevealVisibility-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_position){
			$("#ANDI508-forceRevealPosition-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_opacity){
			$("#ANDI508-forceRevealOpacity-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_overflow){
			$("#ANDI508-forceRevealOverflow-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_fontSize){
			$("#ANDI508-forceRevealFontSize-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_textIndent){
			$("#ANDI508-forceRevealTextIndent-button").click();
		}
		if(AndiModule.activeActionButtons.forceReveal_html5Hidden){
			$("#ANDI508-forceRevealHtml5Hidden-button").click();
		}
		
		if(AndiModule.activeActionButtons.titleAttributes){
			$("#ANDI508-titleAttributes-button").click();
		}
		
	}
	else{
		andiBar.showStartUpSummary("No CSS <span class='ANDI508-module-name-h'>hidden content</span> detected.");
	}
	
	$("#ANDI508").focus();
};

//This function will toggle the state of the reveal all button depending on the state of the other buttons
hANDI.toggleRevealAllButton = function(){
	var revealAllOn = true;
	var prevNextBtnsVisible = false;
	
	//Loop through each reveal button
	$("#ANDI508-module-actions .hANDI-revealButton").each(function(){
		if($(this).attr("aria-pressed")=="false"){
			revealAllOn = false;
		}
		else //a reveal button is pressed
			prevNextBtnsVisible = true; //show the prev/next Buttons
	});
	
	//Toggle Reveal All Button
	if(revealAllOn){
		andiOverlay.overlayButton_on("find",$("#ANDI508-forceRevealAll-button"));
	}
	else{
		andiOverlay.overlayButton_off("find",$("#ANDI508-forceRevealAll-button"));
	}
	
	//Toggle Next Prev Buttons
	if(prevNextBtnsVisible){
		//$("#ANDI508-activeElementResults").show();
		$("#ANDI508-resultsSummary").show(); //show next/prev buttons
	}
	else{
		$("#ANDI508-testPage .ANDI508-element-active").removeClass("ANDI508-element-active");
		$("#ANDI508-activeElementResults").hide();
		$("#ANDI508-resultsSummary").hide(); //hide next/prev buttons
	}
};

//This function will remove highlights when the other buttons aren't pressed
hANDI.unreveal = function(){
	var c = "ANDI508-forceReveal-";
	var okayToRemoveHighlight = true;
	$("#ANDI508-testPage .ANDI508-forceReveal").each(function(){
		okayToRemoveHighlight = true;
		if(AndiModule.activeActionButtons.forceReveal_display && $(this).hasClass(c+"display")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_visibility && $(this).hasClass(c+"visibility")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_position && $(this).hasClass(c+"position")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_opacity && $(this).hasClass(c+"opacity")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_overflow && $(this).hasClass(c+"overflow")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_fontSize && $(this).hasClass(c+"fontSize")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_textIndent && $(this).hasClass(c+"textIndent")){
			okayToRemoveHighlight = false;
		}
		else if(AndiModule.activeActionButtons.forceReveal_html5Hidden && $(this).hasClass(c+"html5Hidden")){
			okayToRemoveHighlight = false;
		}
		
		if(okayToRemoveHighlight){
			$(this).removeClass("ANDI508-forceReveal");
		}
	});
};

//Previous Element Button override
$("#ANDI508-button-prevElement").off("click").click(function(){
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
	
	if(isNaN(index))
		//there is no active element, so focus on last force-revealed element
		andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").last().attr("data-ANDI508-index")));
	else{
		var prevElement;
	
		//Find the previous element with data-ANDI508-index
		//This will skip over elements that may have been removed from the DOM and are not force revealed
		for(var x=index; x>0; x--){
			prevElement = $("#ANDI508-testPage [data-ANDI508-index='"+(x - 1)+"']");
			if($(prevElement).length && $(prevElement).hasClass("ANDI508-forceReveal")){
				andiFocuser.focusByIndex(x - 1);
				break;
			}					
		}
	}
});

//Next Element Button override
$("#ANDI508-button-nextElement").off("click").click(function(){
	//get the active element
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
	
	if(isNaN(index))
		//there is no active element, so focus on first force-revealed element
		andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").first().attr("data-ANDI508-index")));
	else{
		var nextElement;
		//Find the next element with data-ANDI508-index
		//This will skip over elements that may have been removed from the DOM and are not force revealed
		//var nextElement;
		for(var x=index; x<testPageData.andiElementIndex; x++){
			//nextElement = $("#ANDI508-testPage [data-ANDI508-index='"+(x + 1)+"']");
			//if($(nextElement).length && $(nextElement).is(":visible")){
			nextElement = $("#ANDI508-testPage [data-ANDI508-index='"+(x + 1)+"']");
			if($(nextElement).length && $(nextElement).hasClass("ANDI508-forceReveal")){
				andiFocuser.focusByIndex(x + 1);
				break;
			}
		}
	}
});

hANDI.analyze();
hANDI.results();

}//end init
