//==========================================//
//gANDI: graphics ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var gandiVersionNumber = "4.0.2";

//TODO: add <video>
						 
//create gANDI instance
var gANDI = new AndiModule(gandiVersionNumber,"g");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey) //check for holding shift key
		gANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	gANDI.inspect(this);
	andiResetter.resizeHeights();
};

var inlineImageCount = 0; 		//total number of inline images
var backgroundImageCount = 0;	//total number of elements with background images
var decorativeImg = 0;			//total number of <img> declared as decorative
var fontIconCount = 0;			//total number of font icons

var imageLinkCount = 0;			//total number of <img> contained in links
var imageButtonCount = 0;		//total number of <img> contained in buttons
var containedByLinkOrButton;	//boolean if <img> is contained by link or button

//AndiModule.activeActionButtons
if($.isEmptyObject(AndiModule.activeActionButtons)){
	$.extend(AndiModule.activeActionButtons,{fadeInlineImages:false});
	$.extend(AndiModule.activeActionButtons,{highlightDecorativeImages:false});
	$.extend(AndiModule.activeActionButtons,{removeBackgroundImages:false});
	$.extend(AndiModule.activeActionButtons,{highlightBackgroundImages:false});
	$.extend(AndiModule.activeActionButtons,{highlightFontIcons:false});
}

//This function will analyze the test page for graphics/image related markup relating to accessibility
gANDI.analyze = function(){
	
	//Loop through every visible element
	$('#ANDI508-testPage *').filter(':visible').each(function(){
		
		containedByLinkOrButton = false; //reset boolean
		
		if($(this).is("img,input:image,area,svg")){
			inlineImageCount++;
			
			if($(this).is("input:image")){
				andiData = new AndiData($(this));				
				andiData.grabComponents($(this));
				andiCheck.commonFocusableElementChecks(andiData,$(this),true);
				
				altTextAnalysis($.trim($(this).attr("alt")));
				
				andiData.attachDataToElement($(this));
			}
			else if($(this).is("img,svg") && !$(this).attr("usemap")){ //an image used by an image map is handled by the <area>
				//Determine if this image should have an accessible name or if it should be derived from a parent
				//Is Image contained by <a>?
				var closestLinkOrButtonParent = $(this).closest("a");
				if($(closestLinkOrButtonParent).length){
					imageLinkCount++;
					containedByLinkOrButton = true;
				}
				//Is Image contained by <button>?
				else{
					closestLinkOrButtonParent = $(this).closest("button");
					if($(closestLinkOrButtonParent).length){
						imageButtonCount++;
						containedByLinkOrButton = true;
					}
				}
				if(containedByLinkOrButton){
					//Check if parent already has been evaluated (when more than one image is in a link)
					if(!$(closestLinkOrButtonParent).hasClass("ANDI508-element")){
						//Image is contained by <a> or <button>
						andiData = new AndiData($(closestLinkOrButtonParent));			
						andiData.grabComponents($(closestLinkOrButtonParent));
						andiCheck.commonFocusableElementChecks(andiData,$(closestLinkOrButtonParent),true);
						andiData.attachDataToElement($(closestLinkOrButtonParent));
					}
				}
				else{
					//Image is NOT contained by <a> or <button>
					andiData = new AndiData($(this));
					
					andiData.grabComponents($(this));
					
					//if($(this).is("svg")){
					//	//grab svg accessibility components
					//	andiData.grabComponents_svg($(this));
					//}
					
					//Check for server side image map
					if($(this).attr("ismap"))
						andiAlerter.throwAlert(alert_0173);
					else{
						if(($(this).attr("alt") !== undefined && $.trim($(this).attr("alt")) == "")
							|| $(this).attr("aria-hidden") == "true" 
							|| $(this).attr("role") == "presentation" 
							|| $(this).attr("role") == "none")
						{
							decorativeImg++;
							$(this).addClass("gANDI508-decorative");
						}
						else{
							//This image has not been declared decorative
							andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
							altTextAnalysis($.trim($(this).attr("alt")));
						}
						andiData.attachDataToElement($(this));
					}
				}
			}
			else if($(this).is("area")){
				var map = $(this).closest("map");
				if($(map).length){
					//<area> is contained in <map>
					var mapName = "#"+$(map).attr("name");
					if($("#ANDI508-testPage img[usemap='"+mapName+"']").length){
						//<map> references existing <img>
						andiData = new AndiData($(this));
						andiData.grabComponents($(this));
						andiCheck.commonFocusableElementChecks(andiData, $(this));
						altTextAnalysis($.trim($(this).attr("alt")));
						andiData.attachDataToElement($(this));
					}
					else{
						//Image referenced by image map not found
						//TODO: throw this message only once for all area tags that it relates to
						andiAlerter.throwAlert(alert_006A,alert_006A.message,0);
					}
				}
				else{
					//Area tag not contained in map
					andiAlerter.throwAlert(alert_0178,alert_0178.message,0);
				}
			}
		}
		else if($(this).is("marquee")){
			andiData = new AndiData($(this));
			andiAlerter.throwAlert(alert_0171);
			andiData.attachDataToElement($(this));
		}
		else if($(this).is("blink")){
			andiData = new AndiData($(this));
			andiAlerter.throwAlert(alert_0172);
			andiData.attachDataToElement($(this));
		}
		//Check for common font icon classes
		else if($(this).hasClass("fa") //font awesome
			|| $(this).hasClass("glyphicon") //glyphicon
			|| $(this).hasClass("material-icons") //google material icons
			|| $(this).is("[data-icon]")) //common usage of the data-* attribute for icons
		{
			fontIconCount++;
			$(this).addClass("gANDI508-fontIcon");
		}

		
		//Check for background image regardless of tagname
		if($(this).css("background-image").includes("url(")){
			backgroundImageCount++;
			$(this).addClass("gANDI508-background");
		}
	});
	
	if(backgroundImageCount > 0){
		//Page has background images
		andiAlerter.throwAlert(alert_0177,alert_0177.message,0);
	}
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
gANDI.results = function(){

	andiBar.updateResultsSummary("Inline Images Found: "+inlineImageCount);

	//Are There Images?
	if((inlineImageCount + backgroundImageCount + fontIconCount) > 0){
		//Yes, images were found
		
		//Create Image contained by html (number of image links and image buttons)
		var imageContainedBySummary = "";
		if(imageLinkCount > 0)
			imageContainedBySummary += ", " + imageLinkCount + " image links";
		if(imageButtonCount > 0)
			imageContainedBySummary += ", " + imageButtonCount + " image buttons";
		if(fontIconCount > 0)
			imageContainedBySummary += ", " + fontIconCount + " font icons";

		$("#ANDI508-additionalPageResults").append("<p tabindex='0'>"+backgroundImageCount+" background-images"+imageContainedBySummary+"</p>");
		
		//Add Module Mode Buttons
		var moduleActionButtons = "";
		if(inlineImageCount > 0){
			moduleActionButtons += "<button id='ANDI508-fadeInlineImages-button' aria-label='Hide "+inlineImageCount+" Inline Images' aria-pressed='false'>hide "+inlineImageCount+" inline</button>";
			if(decorativeImg > 0)
				moduleActionButtons += "<button id='ANDI508-highlightDecorativeImages-button' aria-label='Highlight "+decorativeImg+" Decorative Inline Images' aria-pressed='false'>"+decorativeImg+" decorative inline"+findIcon+"</button>";
		}
		if(backgroundImageCount > 0){
			if(inlineImageCount > 0)
				moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> ";
			moduleActionButtons += "<button id='ANDI508-removeBackgroundImages-button' aria-label='Hide "+backgroundImageCount+" Background Images' aria-pressed='false'>hide "+backgroundImageCount+" background</button>";
			moduleActionButtons += "<button id='ANDI508-highlightBackgroundImages-button' aria-label='Highlight "+backgroundImageCount+" Background Images' aria-pressed='false'>find "+backgroundImageCount+" background"+findIcon+"</button>";
		}
		if(fontIconCount > 0){
			if(inlineImageCount > 0 || backgroundImageCount > 0)
				moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span> ";
			moduleActionButtons += "<button id='ANDI508-highlightFontIcons-button' aria-label='Find "+fontIconCount+" Font Icons' aria-pressed='false'>"+fontIconCount+" font icons</button>";
		}
		
		$("#ANDI508-module-actions").html(moduleActionButtons);
	
		//Define fadeInlineImages button
		$("#ANDI508-fadeInlineImages-button").click(function(){
			//This button will change the image's opacity to almost zero
			if($(this).attr("aria-pressed")=="false"){
				$(this).attr("aria-pressed","true").addClass("ANDI508-module-action-active");
				$("#ANDI508-testPage").addClass("gANDI508-fadeInline");
				AndiModule.activeActionButtons.fadeInlineImages = true;
			}
			else{
				$(this).attr("aria-pressed","false").removeClass("ANDI508-module-action-active");
				$("#ANDI508-testPage").removeClass("gANDI508-fadeInline");
				AndiModule.activeActionButtons.fadeInlineImages = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define Remove removeBackgroundImages button
		$("#ANDI508-removeBackgroundImages-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				$(this).attr("aria-pressed","true").addClass("ANDI508-module-action-active");
				$("#ANDI508-testPage").addClass("gANDI508-hideBackground");
				AndiModule.activeActionButtons.removeBackgroundImages = true;
			}
			else{
				$(this).attr("aria-pressed","false").removeClass("ANDI508-module-action-active");
				$("#ANDI508-testPage").removeClass("gANDI508-hideBackground");
				AndiModule.activeActionButtons.removeBackgroundImages = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define highlightBackgroundImages button
		$("#ANDI508-highlightBackgroundImages-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage").addClass("gANDI508-highlightBackground");
				AndiModule.activeActionButtons.highlightBackgroundImages = true;
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				$("#ANDI508-testPage").removeClass("gANDI508-highlightBackground");
				AndiModule.activeActionButtons.highlightBackgroundImages = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define highlightDecorativeImages button
		$("#ANDI508-highlightDecorativeImages-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage .ANDI508-element[data-gANDI508-decorative]").addClass("gANDI508-highlightDecorative");
				$("#ANDI508-testPage").addClass("gANDI508-highlightDecorative");
				AndiModule.activeActionButtons.highlightDecorativeImages = true;
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				$("#ANDI508-testPage .gANDI508-highlightDecorative").removeClass("gANDI508-highlightDecorative");
				$("#ANDI508-testPage").removeClass("gANDI508-highlightDecorative");
				AndiModule.activeActionButtons.highlightDecorativeImages = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//Define highlightFontIcons button
		$("#ANDI508-highlightFontIcons-button").click(function(){
			if($(this).attr("aria-pressed")=="false"){
				andiOverlay.overlayButton_on("find",$(this));
				$("#ANDI508-testPage").addClass("gANDI508-highlightFontIcon");
				AndiModule.activeActionButtons.highlightFontIcons = true;
			}
			else{
				andiOverlay.overlayButton_off("find",$(this));
				$("#ANDI508-testPage").removeClass("gANDI508-highlightFontIcon");
				AndiModule.activeActionButtons.highlightFontIcons = false;
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		if(!andiBar.focusIsOnInspectableElement()){
			andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-g'>graphics/images</span> by tabbing to or hovering over the highlighted elements.",true,"non-decorative image");
		}
		
		andiAlerter.updateAlertList();
		
		//Click previously active buttons
		if(AndiModule.activeActionButtons.fadeInlineImages){
			$("#ANDI508-fadeInlineImages-button").click();
		}
		if(AndiModule.activeActionButtons.removeBackgroundImages){
			$("#ANDI508-removeBackgroundImages-button").click();
		}
		if(AndiModule.activeActionButtons.highlightBackgroundImages){
			$("#ANDI508-highlightBackgroundImages-button").click();
		}
		if(AndiModule.activeActionButtons.highlightDecorativeImages){
			$("#ANDI508-highlightDecorativeImages-button").click();
		}
		if(AndiModule.activeActionButtons.highlightFontIcons){
			$("#ANDI508-highlightFontIcons-button").click();
		}
	}
	else{
		//No Focusable Elements were found
		if(testPageData.numberOfAccessibilityAlertsFound==0){
			//No Alerts
			andiBar.showStartUpSummary("No <span class='ANDI508-module-name-g'>graphics/images</span> were found on this page.",false);
		}
		else{
			//Alerts were found
			andiBar.showStartUpSummary("No <span class='ANDI508-module-name-g'>graphics/images</span> were found, <br />however there are some accessibility alerts.",true);
			andiAlerter.updateAlertList();
		}
	}
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
gANDI.inspect = function(element){
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
			//figcaption
			else if(!elementData.ignoreFigcaption && andiBar.output.figcaption(elementData));
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
		
		//format background-image
		var backgroundImage = $(element).css("background-image");
		if(backgroundImage == "none")
			backgroundImage = "";
		else
			backgroundImage = backgroundImage.slice(5, -2); //remove 'url("' and '")'

		var additionalComponents = [
			$(element).attr("longdesc"),
			$(element).attr("ismap"),
			$(element).attr("usemap"),
			backgroundImage
		];

		if(andiCheck.wereComponentsFound(elementData,additionalComponents)){
			//add table rows for components found
			andiBar.appendRow("aria-labelledby",	elementData.ariaLabelledby,false,true);
			andiBar.appendRow("aria-label",			elementData.ariaLabel);
			andiBar.appendRow("alt",				elementData.alt);
			andiBar.appendRow("figcaption",			elementData.figcaption);
			andiBar.appendRow("value",				elementData.value);
			andiBar.appendRow("innerText",			elementData.innerText);
			andiBar.appendRow("child&nbsp;element",	elementData.subtree);
			andiBar.appendRow("imageSrc",			elementData.imageSrc);
			andiBar.appendRow("aria-describedby",	elementData.ariaDescribedby,false,true);
			andiBar.appendRow("title",				elementData.title);
			andiBar.appendRow("longdesc",			additionalComponents[0]);
			andiBar.appendRow("ismap",				additionalComponents[1]);
			andiBar.appendRow("usemap",				additionalComponents[2]);
			andiBar.appendRow("background-image",	additionalComponents[3]);
			
			//add table rows for add-on properties found
			if(elementData.addOnPropertiesTotal != 0){
				andiBar.appendRow("role",			elementData.addOnProperties.role, true);
				andiBar.appendRow("accesskey",		elementData.addOnProperties.accesskey, true);
				andiBar.appendRow("tabindex",		elementData.addOnProperties.tabindex, true);
				
				andiBar.appendRow("aria-controls",	elementData.addOnProperties.ariaControls, true);
				andiBar.appendRow("aria-expanded",	elementData.addOnProperties.ariaExpanded, true);
				andiBar.appendRow("aria-haspopup",	elementData.addOnProperties.ariaHaspopup, true);
				andiBar.appendRow("aria-hidden",	elementData.addOnProperties.ariaHidden, true);
			}
		}
	}
};

//This function will analyze the alt text
function altTextAnalysis(altText){
	if(altText != ""){
		altText = altText.toLowerCase();
		//check for redundant phrase in alt text
		if(altText.includes(" of")
			&& (altText.includes("image of")
				|| altText.includes("photo of")
				|| altText.includes("photograph of")
				|| altText.includes("picture of")
				|| altText.includes("graphic of"))
			)
		{
			//redundant phrase in alt text
			andiAlerter.throwAlert(alert_0174);
		}
		//Check for filename in alt text
		else if(altText.includes(".png")
			|| altText.includes(".jpg")
			|| altText.includes(".jpeg")
			|| altText.includes(".gif")
			|| altText.includes(".pdf"))
		{
			//file name in alt text
			andiAlerter.throwAlert(alert_0175);
		}
		//Check for non-descriptive alt text
		else if(altText == "image"
			|| altText == "photo"
			|| altText == "photograph"
			|| altText == "picture"
			|| altText == "graphic"
			|| altText == "logo"
			|| altText == "icon"
			|| altText == "graph"
			)
		{
			//non-descriptive alt text
			andiAlerter.throwAlert(alert_0176);
		}
	}
}

gANDI.analyze();
gANDI.results();

}//end init
