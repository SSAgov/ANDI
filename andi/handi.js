//==========================================//
//hANDI: hidden content ANDI 				//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var handiVersionNumber = "4.0.3";

//TODO: report whether an element should be visible or invisible to a screen reader

//create hANDI instance
var hANDI = new AndiModule(handiVersionNumber,"h");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.hoverability = function(event){
	if(!event.shiftKey && $(this).hasClass("ANDI508-forceReveal")) //check for holding shift key
		AndiModule.inspect(this);
};

//This function removes markup in the test page that was added by this module
AndiModule.cleanup = function(testPage, element){
	if(element){
		$(element).removeAttr("data-handi508-hidingtechniques").removeClass("ANDI508-forceReveal ANDI508-forceReveal-display ANDI508-forceReveal-visibility ANDI508-forceReveal-position ANDI508-forceReveal-opacity ANDI508-forceReveal-overflow ANDI508-forceReveal-fontSize ANDI508-forceReveal-textIndent");
		if($(element).hasClass("ANDI508-forceReveal-html5Hidden"))
			$(element).attr("hidden","hidden").removeClass("ANDI508-forceReveal-html5Hidden"); //add the hidden attribute back
	}
	else
		$(testPage).find(".hANDI508-hasHiddenCssContent").removeClass("hANDI508-hasHiddenCssContent");
};

AndiModule.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	var hidingTechniques = $(element).attr("data-handi508-hidingtechniques");
	$("#ANDI508-additionalElementDetails").html("");
	if(hidingTechniques)
		$("#ANDI508-additionalElementDetails").append(hidingTechniques);
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

AndiModule.initActiveActionButtons({
	forceReveal_display:false,
	forceReveal_visibility:false,
	forceReveal_position:false,
	forceReveal_opacity:false,
	forceReveal_overflow:false,
	forceReveal_fontSize:false,
	forceReveal_textIndent:false,
	forceReveal_html5Hidden:false,
	highlightCssContent:false,
	titleAttributes:false
});

if(!prevNextBtnsVisible){
	andiBar.hideElementControls();
}

//This function returns true if the element contains elements that might need accessibility testing, false if not.
hANDI.containsTestableContent = function(element){
	var needsTesting = true;
	var isContainerElement = $(element).isContainerElement();
	var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";

	//Does this element contain content that needs testing
	if(isContainerElement &&
		($.trim($(element).html()) === "" ||
			($.trim($(element).text()) === "" &&
				$(element).find(elementsNeedingTesting).length === 0 )))
	{
		needsTesting = false; //this element doesn't need testing
	}
	//Is this element one that needs testing?
	else if(!isContainerElement && $(element).is(elementsNeedingTesting)){
		needsTesting = false; //this element doesn't need testing
	}

	return needsTesting;
};

//This function will analyze the test page for elements hidden using CSS
hANDI.analyze = function(){
	var isHidingContent, elementCss;
	$(TestPageData.allElements).not("area,base,basefont,datalist,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function(){
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
				if($(this).css("overflow")=="hidden" &&
					(parseInt($(this).css("height"))<=1 || parseInt($(this).css("width"))<=1))
				{
					//element has overflow hidden and a small height or width
					hiddenElements++;
					isHidingContent = true;
					if($(this).closest(".ANDI508-forceReveal-overflow").length === 0)
						hidden_overflow++; //increment count if not contained by another of same hiding technique
					$(this).addClass("ANDI508-forceReveal-overflow");
					elementCss += "overflow:hidden; ";
				}
				if(parseInt($(this).css("font-size")) === 0){
					//element font-size is 0
					hiddenElements++;
					isHidingContent = true;
					if($(this).closest(".ANDI508-forceReveal-fontSize").length === 0)
						hidden_fontSize++; //increment count if not contained by another of same hiding technique
					$(this).addClass("ANDI508-forceReveal-fontSize");
					elementCss += "font-size:0; ";
				}
			}
			if(parseInt($(this).css("text-indent")) < -998){ //-998 chosen because a common technique is to position at -999 to make text offscreen
				//element has a text-indent that makes it off screen
				hiddenElements++;
				isHidingContent = true;
				if($(this).closest(".ANDI508-forceReveal-textIndent").length === 0)
					hidden_textIndent++; //increment count if not contained by another of same hiding technique
				$(this).addClass("ANDI508-forceReveal-textIndent");
				elementCss += "text-indent:"+$(this).css("text-indent")+"; ";
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
			//create data-handi508-hidingtechniques
			if(elementCss !== ""){
				elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
				$(this).attr("data-handi508-hidingtechniques", elementCss);
			}

			andiData = new AndiData(this, true);
			AndiData.attachDataToElement(this);
		}
	});

	if(!oldIE){
		hANDI.detectCssInjectedContent();

		if($("#ANDI508-testPage .hANDI508-hasHiddenCssContent").first().length)
			andiAlerter.throwAlert(alert_0220,alert_0220.message, 0);
	}
};

//This function will detect content hidden using css :before :after content.
//Current screen readers will not read text injected using this method in some browsers.
hANDI.detectCssInjectedContent = function(){
	var before_content, before_style, after_content, after_style, hasHiddenCSSContent, cssDisplay;

	//Loop through every element on the page
	for(var x=0; x<TestPageData.allVisibleElements.length; x++){
		hasHiddenCSSContent = false; //reset to false
		cssDisplay = "";

		before_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":before");
		if(before_style){
			before_content = before_style.getPropertyValue("content");
			if(hasContent(before_content)){ //element has injected content using ::before
				if(isVisible(before_style)){ //pseudoElement is visible
					hasHiddenCSSContent = true;
					cssDisplay += before_content + " ";
				}
			}
		}

		after_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":after");
		if(after_style){
			after_content = after_style.getPropertyValue("content");
			if(hasContent(after_content)){ //element has injected content using ::after
				if(isVisible(after_style)){ //pseudoElement is visible
					hasHiddenCSSContent = true;
					cssDisplay += after_content;
				}
			}
		}

		if(hasHiddenCSSContent){
			elementsWithCssInjectedContent++;
			$(TestPageData.allVisibleElements[x]).addClass("hANDI508-hasHiddenCssContent");
		}
	}

	//This function will return true if content exists
	function hasContent(content){
		if(content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"" && content !== "\" \""){//content is not empty
			return true;
		}
		return false;
	}

	//This function returns true if the style of an element is not hidden
	//TODO: Can this be replaced by getting the pseudo element and reusing :shown ?
	function isVisible(style){
		if(	style.getPropertyValue("visibility") === "hidden" ||
			style.getPropertyValue("display") === "none" ||
			( style.getPropertyValue("height") === "0" && style.getPropertyValue("width") === "0" )
		){
			return false;
		}
		return true;
	}
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
var showStartUpSummaryText = "";
hANDI.results = function(){

	andiBar.updateResultsSummary("Hidden Elements: "+hiddenElements);

	//Are There Hidden Elements?
	if(hiddenElements > 0 || elementsWithCssInjectedContent > 0){
		//Yes, Hidden Elements were found

		//Add Module Mode Buttons
		var moduleActionButtons = "";
		var revealButtons = "";

		addForceRevealButton("display", hidden_display, "display:none");
		addForceRevealButton("visibility", hidden_visibility, "visibility:hidden");
		addForceRevealButton("position", hidden_position, "position:absolute");
		addForceRevealButton("overflow", hidden_overflow, "overflow:hidden");
		addForceRevealButton("fontSize", hidden_fontSize, "font-size:0");
		addForceRevealButton("textIndent", hidden_textIndent, "text-indent");
		addForceRevealButton("html5Hidden", hidden_html5Hidden, "html5 hidden");
		addForceRevealButton("opacity", hidden_opacity, "opacity:0");

		function addForceRevealButton(technique, count, buttonText){
			if(count > 0){
				hidingTechniquesUsed++;
				revealButtons += "<button id='ANDI508-forceReveal_"+technique+"-button' class='hANDI-revealButton' aria-label='"+count+" "+buttonText+"' aria-pressed='false'>"+count+" "+buttonText+findIcon+"</button>";
			}
		}

		if(hidingTechniquesUsed > 0){
			if(hidingTechniquesUsed > 1)
				moduleActionButtons = "<button id='ANDI508-forceRevealAll-button' aria-label='Reveal All' aria-pressed='false'>reveal all"+findIcon+"</button><span class='ANDI508-module-actions-spacer'>|</span> ";
			moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>css hiding techniques</button><div class='ANDI508-moduleActionGroup-options'>" + revealButtons + "</div></div>";
		}

		if(elementsWithCssInjectedContent > 0){
			if(hidingTechniquesUsed > 0)
				moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;";
			moduleActionButtons += "<button id='ANDI508-highlightCssContent-button' aria-label='content ::before ::after "+elementsWithCssInjectedContent+" CSS Content' aria-pressed='false'>content ::before ::after "+elementsWithCssInjectedContent+findIcon+"</button>";
		}

		if(TestPageData.page_using_titleAttr)
			//Title Attributes Button
			moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes"+overlayIcon+"</button>";

		moduleActionButtons += "<button id='ANDI508-ariaHiddenScan-button' aria-label='aria-hidden scan' aria-pressed='false'>aria-hidden scan</button>";

		$("#ANDI508-module-actions").html(moduleActionButtons);

		andiBar.initializeModuleActionGroups();

		//Define forceRevealAll button
		$("#ANDI508-forceRevealAll-button").click(function(){
			if($(this).attr("aria-pressed") === "false"){
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

		addHiddenContentButtonClickLogic("display");
		addHiddenContentButtonClickLogic("visibility");
		addHiddenContentButtonClickLogic("position");
		addHiddenContentButtonClickLogic("opacity");
		addHiddenContentButtonClickLogic("overflow");
		addHiddenContentButtonClickLogic("fontSize");
		addHiddenContentButtonClickLogic("textIndent");
		addHiddenContentButtonClickLogic("html5Hidden");

		function addHiddenContentButtonClickLogic(technique){
			$("#ANDI508-forceReveal_"+technique+"-button").click(function(){
				if($(this).attr("aria-pressed") === "false"){
					andiOverlay.overlayButton_on("find",$(this));
					$("#ANDI508-testPage .ANDI508-forceReveal-"+technique).each(function(){
						$(this).addClass("ANDI508-forceReveal");
						if(technique === "html5Hidden")//remove hidden attribute for html5Hidden technique
							$(this).removeAttr("hidden");
					});
					AndiModule.activeActionButtons["forceReveal_"+technique] = true;
				}
				else{
					andiOverlay.overlayButton_off("find",$(this));
					if(technique === "html5Hidden")//add the hidden attribute back on
						$("#ANDI508-testPage .ANDI508-forceReveal-html5Hidden").attr("hidden","hidden");
					AndiModule.activeActionButtons["forceReveal_"+technique] = false;
					hANDI.unreveal();
				}
				hANDI.toggleRevealAllButton();
				andiResetter.resizeHeights();
				return false;
			});
		}

		//=============================================
		//Define highlightCssContent button
		$("#ANDI508-highlightCssContent-button").click(function(){
			if($(this).attr("aria-pressed") === "false"){
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
			if($(this).attr("aria-pressed") === "false"){
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

		$("#ANDI508-ariaHiddenScan-button").click(function(){
			if($(this).attr("aria-pressed") === "false"){
				alert('aria-hidden="true" was found on ' + $("#ANDI508-testPage [aria-hidden]").length + ' elements');
				andiOverlay.overlayButton_on("overlay",$(this));
				$("#ANDI508-testPage").addClass("hANDI508-highlightAriaHidden");
				AndiModule.activeActionButtons.highlightAriaHidden = true;
			}
			else{
				$("#ANDI508-testPage").removeClass("hANDI508-highlightAriaHidden");
				andiOverlay.overlayButton_off("find",$(this));
				AndiModule.activeActionButtons.highlightAriaHidden = false;
			}
			andiResetter.resizeHeights();
			return false;
		});

		//=============================================
		if(hiddenElements > 0){
			showStartUpSummaryText += "Discover <span class='ANDI508-module-name-h'>hidden content</span> that should be tested for accessibility using other ANDI modules. "+
				"Use the style toggle buttons to force the hidden content to be revealed. "+
				"The revealed content will not remain revealed after changing modules. ";
		}
		else if(elementsWithCssInjectedContent > 0){
			showStartUpSummaryText += "Content injected with CSS may be invisible to a screen reader.";
		}

		andiBar.showStartUpSummary(showStartUpSummaryText, true);

		AndiModule.engageActiveActionButtons([
			"forceReveal_display",
			"forceReveal_visibility",
			"forceReveal_position",
			"forceReveal_opacity",
			"forceReveal_overflow",
			"forceReveal_fontSize",
			"forceReveal_textIndent",
			"forceReveal_html5Hidden",
			"highlightCssContent",
			"titleAttributes-button"
		]);
	}
	else{
		andiBar.showStartUpSummary("No CSS <span class='ANDI508-module-name-h'>hidden content</span> detected.");
	}

	andiAlerter.updateAlertList();

	$("#ANDI508").focus();
};

//This function will toggle the state of the reveal all button depending on the state of the other buttons
hANDI.toggleRevealAllButton = function(){
	var revealAllOn = true;
	var prevNextBtnsVisible = false;

	//Loop through each reveal button
	$("#ANDI508-module-actions .hANDI-revealButton").each(function(){
		if($(this).attr("aria-pressed")=="false")
			revealAllOn = false;
		else //a reveal button is pressed
			prevNextBtnsVisible = true; //show the prev/next Buttons
	});

	//Toggle Reveal All Button
	if(revealAllOn)
		andiOverlay.overlayButton_on("find",$("#ANDI508-forceRevealAll-button"));
	else
		andiOverlay.overlayButton_off("find",$("#ANDI508-forceRevealAll-button"));

	//Toggle Next Prev Buttons
	if(prevNextBtnsVisible){
		//$("#ANDI508-elementDetails").show();
		$("#ANDI508-additionalElementDetails").show();
		andiBar.showElementControls();
	}
	else{
		$("#ANDI508-testPage .ANDI508-element-active").removeClass("ANDI508-element-active");
		$("#ANDI508-elementDetails").hide();
		$("#ANDI508-additionalElementDetails").hide();
		andiBar.hideElementControls();
		andiBar.showStartUpSummary(showStartUpSummaryText, true);
	}
};

//This function will remove highlights when the other buttons aren't pressed
hANDI.unreveal = function(){
	var c = "ANDI508-forceReveal-";
	var okayToRemoveHighlight = true;
	$("#ANDI508-testPage .ANDI508-forceReveal").each(function(){
		okayToRemoveHighlight = true;
		if(AndiModule.activeActionButtons.forceReveal_display && $(this).hasClass(c+"display"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_visibility && $(this).hasClass(c+"visibility"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_position && $(this).hasClass(c+"position"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_opacity && $(this).hasClass(c+"opacity"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_overflow && $(this).hasClass(c+"overflow"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_fontSize && $(this).hasClass(c+"fontSize"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_textIndent && $(this).hasClass(c+"textIndent"))
			okayToRemoveHighlight = false;
		else if(AndiModule.activeActionButtons.forceReveal_html5Hidden && $(this).hasClass(c+"html5Hidden"))
			okayToRemoveHighlight = false;

		if(okayToRemoveHighlight){
			$(this).removeClass("ANDI508-forceReveal");
		}
	});
};

//Previous Element Button override
$("#ANDI508-button-prevElement").off("click").click(function(){
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

	if(isNaN(index))//there is no active element, so focus on last force-revealed element
		andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").last().attr("data-andi508-index")));
	else{
		var prevElement;

		//Find the previous element with data-andi508-index
		//This will skip over elements that may have been removed from the DOM and are not force revealed
		for(var x=index; x>0; x--){
			prevElement = $("#ANDI508-testPage [data-andi508-index='"+(x - 1)+"']");
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
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

	if(isNaN(index))//there is no active element, so focus on first force-revealed element
		andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").first().attr("data-andi508-index")));
	else{
		var nextElement;
		//Find the next element with data-andi508-index
		//This will skip over elements that may have been removed from the DOM and are not force revealed
		for(var x=index; x<testPageData.andiElementIndex; x++){
			nextElement = $("#ANDI508-testPage [data-andi508-index='"+(x + 1)+"']");
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
