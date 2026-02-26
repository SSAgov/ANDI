//==========================================//
//cANDI: colors ANDI 						//
//Created By Social Security Administration //
//==========================================//
function init_module(){

var cANDIVersionNumber = "4.1.5";

//TODO: select box, check for selected

//create cANDI instance
var cANDI = new AndiModule(cANDIVersionNumber,"c");

var imgCount = 0;
var elementsContainingTextCount = 0;

//This function will set the values of the require ratios for a given WCAG level
var wcagLevel = {
	level: "AA",
	smallTextReqRatio: 4.5,
	largeTextReqRatio: 3
};

AndiModule.initActiveActionButtons({
	contrastPlayground:false,
	grayscale:false
});

//This function will run tests on text containing elements
cANDI.analyze = function(){

	//Elements that are disabled or have aria-disabled="true" do not need to be tested
	$(TestPageData.allVisibleElements).filter("*:not(option)").each(function(){

		if($(this).is("img[src],input:image[src],svg,canvas")){
			imgCount++;
		}
		else{
			if(hasTextExcludingChildren(this)){
				if(!hasAdditionalHidingTechniques(this)){
					//Element is not hidden and contains text.

					elementsContainingTextCount++;

					//Try to get the contrast ratio automatically
					var cANDI_data = cANDI.getContrast($(this));

					if(!cANDI_data.disabled){
						andiData = new AndiData(this, true);

						$(this).data("candi508",cANDI_data);

						//Throw alerts if necessary
						cANDI.processResult($(this));

						AndiData.attachDataToElement(this);
					}
					else
						testPageData.disabledElementsCount++;
				}
			}
		}
	});

	//This function checks for additional hiding techniques and returns true if it has one
	//Techniques such as font-size:0, large text-indent, overflow:hidden width small height and width
	function hasAdditionalHidingTechniques(element){
		if( //font-size:0
			parseInt($(element).css("font-size")) === 0 ||
			//text-indent is pushing the element off the page
			(
			$(element).css("text-indent") != "0" || $(element).css("text-indent") != "0px") && parseInt($(element).css("text-indent")) < -998 ||
			//overflow:hidden and height:1 width:1
			$(element).css("overflow")=="hidden" && (parseInt($(element).css("height"))<=1 || parseInt($(element).css("width"))<=1)
			)
		{
			return true; //has an additional hiding technique
		}
		return false;
	}

	//This function returns true if one of the immediate children has text
	function hasTextExcludingChildren(element){
		//Loop through the child nodes of this element looking for text
		var l = element.childNodes.length;
		if(l){//has child nodes
			for(var x=0; x<l; x++){
				if(element.childNodes[x].nodeType === Node.TEXT_NODE && element.childNodes[x].nodeValue.trim() !== ""){
					return true; //one of the immediate children has text
				}
			}
		}
		else if($(element).is("input:not([type=radio],[type=checkbox])")){//element has no child nodes but still can contain text
			return true;
		}
		return false;
	}
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
cANDI.results = function(){

	andiBar.updateResultsSummary("Elements Containing Text: "+elementsContainingTextCount);

	if(imgCount > 0)
		andiAlerter.throwAlert(alert_0231,alert_0231.message,0);

	//Contrast Playground HTML
	$("#ANDI508-additionalPageResults").append(
	"<button id='ANDI508-contrastPlayground-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"show contrast playground</button>"+
	"<div id='cANDI508-contrastPlayground' tabindex='0' class='ANDI508-viewOtherResults-expanded'><h3 class='ANDI508-heading'>Contrast Playground:</h3><div id='cANDI508-contrastPlayground-area'>"+
	"<div id='cANDI508-playground-instructions'>Enter two hex color values to get the contrast ratio.</div>"+
	"<input type='color' id='cANDI508-colorSelectorWidget-fg' value='#000000' style='width:1px; opacity:0;' tabindex='-1' />"+
	"<button class='cANDI508-colorSelector' id='cANDI508-playground-colorSelector-fg' style='background-color:#000000 !important' aria-label='visual color picker, select text color'></button>"+
	"<input type='text' id='cANDI508-playground-fg' maxlength='7' title='Text Color Hex' value='#000000' aria-describedby='cANDI508-playground-instructions-controls' spellcheck='false' />/&nbsp;"+
	"<input type='color' id='cANDI508-colorSelectorWidget-bg' value='#ffffff' style='width:1px; opacity:0;' tabindex='-1' />"+
	"<button class='cANDI508-colorSelector' id='cANDI508-playground-colorSelector-bg' style='background-color:#ffffff !important' aria-label='visual color picker, select background color'></button>"+
	"<input type='text' id='cANDI508-playground-bg' maxlength='7' title='Background Color Hex' value='#ffffff' aria-describedby='cANDI508-playground-instructions-controls' spellcheck='false' />= "+
	"<div tabindex='0' id='cANDI508-playground-result' aria-describedby='cANDI508-playground-instructions'><span id='cANDI508-playground-ratio'>21</span>:1</div><br />"+
	"<div id='cANDI508-playground-instructions-controls'>Arrow keys adjust brightness: &uarr; lightens, &darr; darkens.</div>"+
	"<div id='cANDI508-playground-buttons'>"+
	"<button id='cANDI508-playground-suggest-small' class='ANDI508-viewOtherResults-button'>get 4.5:1 suggestion</button>"+
	"<button id='cANDI508-playground-suggest-large' class='ANDI508-viewOtherResults-button'>get 3:1 suggestion</button>"+
	"</div></div></div>");

	enableColorWidget("fg");
	enableColorWidget("bg");

	//Define contrastPlayground button
	$("#ANDI508-contrastPlayground-button").click(function(){
		if($(this).attr("aria-expanded")=="false"){
			//show Contrast Playground, hide alert list
			$("#ANDI508-alerts-list").hide();
			andiSettings.minimode(false);
			$(this)
				.addClass("ANDI508-viewOtherResults-button-expanded")
				.html(listIcon+"hide contrast playground")
				.attr("aria-expanded","true")
				.find("img").attr("src",icons_url+"list-on.png");
			cANDI.playground_open();
			$("#cANDI508-contrastPlayground").slideDown(AndiSettings.andiAnimationSpeed).focus();
			AndiModule.activeActionButtons.contrastPlayground = true;
		}
		else{
			//hide Contrast Playground, show alert list
			$("#cANDI508-contrastPlayground").slideUp(AndiSettings.andiAnimationSpeed);
			if(testPageData.numberOfAccessibilityAlertsFound > 0)
				$("#ANDI508-alerts-list").show();
			$(this)
				.removeClass("ANDI508-viewOtherResults-button-expanded")
				.html(listIcon+"show contrast playground ")
				.attr("aria-expanded","false");
			AndiModule.activeActionButtons.contrastPlayground = false;
		}
		andiResetter.resizeHeights();
		return false;
	});

	//This handles the javascript key event on the inputs.
	//It handles validation of the fields.
	//If passes validation, looks for up or down arrow key presses, calculates the contrast
	$("#cANDI508-playground-bg,#cANDI508-playground-fg").keyup(function(){
		if(cANDI.playground_validate("#cANDI508-playground-bg,#cANDI508-playground-fg")){
			//Check if user presses up or down
			var keyCode = event.keyCode || event.which;
			switch(keyCode){
			case 40: //down - make darker
				cANDI.playground_adjustShade(this,"darker");
				break;
			case 38: //up - make lighter
				cANDI.playground_adjustShade(this,"lighter");
				break;
			}
			//Calculate the contrast ratio
			cANDI.playground_calc();
		}
	});

	$("#cANDI508-playground-suggest-small").click(function(){
		cANDI.playground_suggest(wcagLevel.smallTextReqRatio);
		$("#cANDI508-playground-result").focus();
	});
	$("#cANDI508-playground-suggest-large").click(function(){
		cANDI.playground_suggest(wcagLevel.largeTextReqRatio);
		$("#cANDI508-playground-result").focus();
	});

	//Add Module Mode Buttons
	var moduleActionButtons = "";

	//Does the browser support CSS filter:grayscale?
	if((function(){var el = document.createElement("a"); el.style.cssText = (document.body.style.webkitFilter !== undefined ? '-webkit-' : '') + 'filter:grayscale(100%)'; return !!el.style.length && !oldIE; }()))
		moduleActionButtons += "<button id='ANDI508-grayscale-button' aria-pressed='false'>grayscale</button>";

	$("#ANDI508-module-actions").html(moduleActionButtons);

	//Grayscale Button
	$("#ANDI508-grayscale-button").click(function(){
		if($(this).attr("aria-pressed") === "false"){
			$(this).attr("aria-pressed","true").addClass("ANDI508-module-action-active");
			$("#ANDI508-testPage").addClass("cANDI508-grayscale");
			AndiModule.activeActionButtons.grayscale = true;
		}
		else{
			$(this).attr("aria-pressed","false").removeClass("ANDI508-module-action-active");
			$("#ANDI508-testPage").removeClass("cANDI508-grayscale");
			AndiModule.activeActionButtons.grayscale = false;
		}
		andiResetter.resizeHeights();
		return false;
	});

	if(elementsContainingTextCount > 0){
		if(!andiBar.focusIsOnInspectableElement()){
			andiBar.showElementControls();
			andiBar.showStartUpSummary("Discover the <span class='ANDI508-module-name-c'>color contrast</span> for elements containing text.",true);
		}
		if(testPageData.disabledElementsCount > 0)
			andiAlerter.throwAlert(alert_0251,[testPageData.disabledElementsCount],0);
	}
	else{
		//No text containing elements were found
		andiBar.hideElementControls();
		andiBar.showStartUpSummary("No elements containing text were found on this page.");
	}

	andiAlerter.updateAlertList();

	AndiModule.engageActiveActionButtons([
		"contrastPlayground",
		"grayscale"
	]);

	$("#ANDI508").focus();

	//This function will allow the color selection widget to work
	function enableColorWidget(fgbg){
		$("#cANDI508-playground-colorSelector-"+fgbg)
			.attr("tabindex","0")
			.click(function(){
				var val = rgbToHex(new Color($(this).css("background-color")));
				$("#cANDI508-colorSelectorWidget-"+fgbg)
					.val(val) //set the value of the widget
					.click() //open the widget
					.off("change") //so that there is only one listener
					.on("change", function(){
						$("#cANDI508-playground-colorSelector-"+fgbg).attr("style", "background-color:"+this.value+" !important;");
						$("#cANDI508-playground-"+fgbg).val(this.value);
						cANDI.playground_calc();
					});
				return false;
			});
	}
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
AndiModule.inspect = function(element){

	andiBar.prepareActiveElementInspection(element);
	var elementData = $(element).data("andi508");

	if($(element).hasClass("ANDI508-element")){

		$("#ANDI508-additionalElementDetails").html(
			"<div tabindex='0' style='margin-bottom:1px' accesskey='"+andiHotkeyList.key_output.key+"'>"+
				"<h3 class='ANDI508-heading'>Contrast Ratio<span aria-hidden='true'>:</span></h3> <span id='cANDI508-ratio'></span> <span id='cANDI508-result'></span> "+
				"<span id='cANDI508-minReq'><span class='ANDI508-screenReaderOnly'>, </span>Min<span class='ANDI508-screenReaderOnly'>imum</span> Req<span class='ANDI508-screenReaderOnly'>uirement</span><span aria-hidden='true'>:</span></span> <span id='cANDI508-minReqRatio'></span>"+
			"</div>"+
			"<h3 class='ANDI508-heading' id='cANDI508-heading-style'>Style:</h3>"+
			"<table id='cANDI508-table-style' aria-labelledby='cANDI508-heading-style'><tbody tabindex='0'>"+
				"<tr><th scope='row' class='cANDI508-label'>Text&nbsp;Color:</th><td><div class='cANDI508-colorSelector' id='cANDI508-colorSelector-foreground'></div><span id='cANDI508-fg'></span></td></tr>"+
				"<tr><th scope='row' class='cANDI508-label'>Background:</th><td><div class='cANDI508-colorSelector' id='cANDI508-colorSelector-background'></div><span id='cANDI508-bg'></span></td></tr>"+
				"<tr><th scope='row' class='cANDI508-label'>Font:</th><td><span id='cANDI508-fontweight'></span> <span id='cANDI508-fontsize'></span> <span id='cANDI508-fontfamily'></span></td></tr>"+
			"</tbody></table>"
		).show();

		cANDI.contrastDisplay(element);

		andiBar.displayOutput(elementData, element); //just to display any alerts

		//Grab the alert text from the outputText
		var alertHtml = $("#ANDI508-outputText").html();
		if(alertHtml)
			$("#ANDI508-additionalElementDetails").append("<div id='cANDI508-alertContainer'><h3 class='ANDI508-heading'>Alerts:</h3> "+alertHtml+"</div>");

		$("#cANDI508-colorSelector-foreground").click(function(){
			if($("#ANDI508-contrastPlayground-button").attr("aria-expanded") === "true"){
				displayColorValue("#cANDI508-playground-fg", new Color($(this).css("background-color")));
				cANDI.playground_calc();
			}
		});
		$("#cANDI508-colorSelector-background").click(function(){
			if($("#ANDI508-contrastPlayground-button").attr("aria-expanded") === "true"){
				displayColorValue("#cANDI508-playground-bg", new Color($(this).css("background-color")));
				cANDI.playground_calc();
			}
		});
	}
};

//This function will adjust the shade of the color in the playground
//It is meant to be called on arrow key presses
cANDI.playground_adjustShade = function(inputElement, shade){
	var colorSelectorBox = $(inputElement).prev();
	var color = new Color($(colorSelectorBox).css("background-color"));

	if(shade == "lighter"){
		for(var l=0; l<3; l++){
			if(color.rgba[l] < 255)
				color.rgba[l]++;
		}
	}
	else{ //darker
		for(var d=0; d<3; d++){
			if(color.rgba[d] > 0)
				color.rgba[d]--;
		}
	}

	//Update Color
	displayColorValue("#"+inputElement.id, color);
};

//This function will grab the colors from the active element, if it is available.
cANDI.playground_open = function(){

	//Try to get fg color from active element
	if(!getColorFromActive("fg")){
		//No color to get, default to black
		displayColorValue("#cANDI508-playground-fg", Color.BLACK);
	}

	//Try to get fg color from active element
	if(!getColorFromActive("bg")){
		//No color to get, default to white
		displayColorValue("#cANDI508-playground-bg", Color.WHITE);
	}

	//Calculate the contrast ratio in the playground
	cANDI.playground_calc();

	//This function will get the colors from the active element
	//If the color grab is successful, it returns true. Else (doesn't contain a color) returns false.
	function getColorFromActive(fgBg){
		var element = $("#cANDI508-"+fgBg);
		if($("#ANDI508-additionalElementDetails").html() && $(element).children().length === 0){
			var hexColor = $(element).html();
			$("#cANDI508-playground-"+fgBg).val(hexColor);
			$("#cANDI508-playground-colorSelector-"+fgBg).attr("style", "background-color:"+hexColor+" !important");
			return true;
		}
		else return false;
	}
};

//This function will calculate the contrast ratio of the playground color values
cANDI.playground_calc = function(){
	//get colors as rgb
	var bgColor = new Color($("#cANDI508-playground-colorSelector-fg").css("background-color"));
	var fgColor = new Color($("#cANDI508-playground-colorSelector-bg").css("background-color"));

	var ratio = fgColor.contrast(bgColor).ratio;

	$("#cANDI508-playground-ratio").removeClass("cANDI508-invalid").html(ratio);

	//Hide or Show Suggestion Buttons
	if(ratio < wcagLevel.largeTextReqRatio)
		$("#cANDI508-playground-suggest-large").css("visibility","visible");
	else
		$("#cANDI508-playground-suggest-large").css("visibility","hidden");

	if(ratio < wcagLevel.smallTextReqRatio)
		$("#cANDI508-playground-suggest-small").css("visibility","visible");
	else
		$("#cANDI508-playground-suggest-small").css("visibility","hidden");
};

//This function checks the colors entered into the playground and determines if they are valid
cANDI.playground_validate = function(queryString){

	var valid = true;
	var validHex = /^#([a-fA-F0-9]{6})$/;

	$(queryString).each(function(){
		var value = $(this).val();
		var colorSelectorBox = $(this).prev();

		//Is this a 6 digit hex value with #
		if(value.length === 7 && validHex.test(value)){
			//Set this element's color selector box
			$(colorSelectorBox).attr("style", "background-color:"+value+" !important; background-image:none;");
			$(this).removeAttr("aria-invalid");
		}
		else{
			$(this).attr("aria-invalid","true");
			$(colorSelectorBox).attr("style", "background:black url("+icons_url+"invalid.png) no-repeat top !important; background-size:1.3em !important");
			valid = false;
		}
	});

	if(valid){
		return true;
	}
	else{
		//Cannot calculate the contrast ratio
		$("#cANDI508-playground-ratio").addClass("cANDI508-invalid").html("?");
		$("#cANDI508-playground-suggest-large").css("visibility","hidden");
		$("#cANDI508-playground-suggest-small").css("visibility","hidden");
		return false;
	}
};

//This function suggests color values that meet the required ratio
cANDI.playground_suggest = function(minReq){
	if(cANDI.playground_validate("#cANDI508-playground-bg,#cANDI508-playground-fg")){

		//Get Suggested Color
		var cANDI_data = {
			bgColor: new Color($("#cANDI508-playground-colorSelector-bg").css("background-color")),
			fgColor: new Color($("#cANDI508-playground-colorSelector-fg").css("background-color")),
			minReq:  minReq
		};

		var suggestedFgColor = cANDI.getSuggestedColor(cANDI_data,"fg");
		var suggestedBgColor = cANDI.getSuggestedColor(cANDI_data,"bg");

		if(cANDI.suggestForegroundChange(cANDI_data, suggestedFgColor, suggestedBgColor)){
			//Suggest Foreground Color
			displayColorValue("#cANDI508-playground-fg",suggestedFgColor);
		}
		else{
			//Suggest Background Color
			displayColorValue("#cANDI508-playground-bg",suggestedBgColor);
		}

		//Calculate the contrast ratio
		cANDI.playground_calc();
	}
};

//This function will get the contrast
cANDI.getContrast = function(fgElement){
	var disabled = isThisDisabled(fgElement);
	var semiTransparency = false;
	var opacity = false;

	//Get background color
	var bgColor = new Color($(fgElement).css("background-color"));
	var bgElement = getBgElement(fgElement);

	//Get foreground color
	var fgColor = new Color($(fgElement).css("color"));
	if(fgColor.alpha < 1){
		semiTransparency = true;
		fgColor = fgColor.overlayOn(bgColor);
	}

	var contrast = fgColor.contrast(bgColor);
	var ratio = contrast.ratio;

	var cANDI_data = {
		bgColor:			bgColor,
		fgColor:			fgColor,
		contrast:			contrast,
		ratio: 				ratio,
		semiTransparency:	semiTransparency,
		opacity:			opacity,
		bgImage:			$(bgElement).css("background-image"),
		size:				parseFloat($(fgElement).css("font-size")),
		weight:				$(fgElement).css("font-weight"),
		family:				$(fgElement).css("font-family"),
		minReq:				undefined,
		result:				undefined,
		disabled:			disabled
	};

	if(!disabled) //Run the contrast test
		contrastTest(cANDI_data);

	//send cANDI_data back
	return cANDI_data;

	//This function does the contrast test
	function contrastTest(cANDI_data){

		//AA Requirements (default)
		var ratio_small = wcagLevel.smallTextReqRatio;
		var ratio_large = wcagLevel.largeTextReqRatio;

		//Set minReq (minimum requirement)
		cANDI_data.minReq = ratio_small;

		if(cANDI_data.size >= 24)
			cANDI_data.minReq = ratio_large;
		else if(cANDI_data.size >= 18.66 && cANDI_data.weight >= 700) //700 is where bold begins, 18.66 is approx equal to 14pt
			cANDI_data.minReq = ratio_large;

		if(cANDI_data.bgImage === "none" && !cANDI_data.opacity){
			//No, Display PASS/FAIL Result and Requirement Ratio
			if(cANDI_data.ratio >= cANDI_data.minReq){
				cANDI_data.result = "PASS";
			}
			else{
				cANDI_data.result = "FAIL";
			}
		}
	}

	//This function will recursively get the element that contains the background-color or background-image.
	function getBgElement(element, recursion){
		if(!disabled)
			disabled = isThisDisabled(element);

		if(parseInt($(element).css("opacity")) < 1)
			opacity = true;

		if($(element).css("background-image") !== "none"){
			return element;
		}
		else{
			//Store this background color
			var thisBgColor = new Color($(element).css("background-color"));

			//Overlay the accumulated bgColor with the the previous background color that was semi-transparent
			if(recursion)
				bgColor = bgColor.overlayOn(thisBgColor);
			else
				bgColor = thisBgColor;

			if($(element).is("html")){
				//transparent or semi-transparent
				if(thisBgColor.alpha < 1){
					bgColor = bgColor.overlayOn(Color.WHITE);
					if(thisBgColor.alpha > 0)
						semiTransparency = true;
				}
			}
			else if(thisBgColor.alpha < 1){
				//Look at parent element
				if(thisBgColor.alpha > 0)
					semiTransparency = true;
				return getBgElement($(element).parent(), true);
			}
			return element;
		}
	}

	function isThisDisabled(element){
		return !!($(element).prop("disabled") || $(element).attr("aria-disabled") === "true");
	}
};

//This function will throw alerts depending on the results of the contrast test.
cANDI.processResult = function(element){
	var cANDI_data = $(element).data("candi508");

	//Throw Alerts if Necessary:
	if(cANDI_data.result === "FAIL"){
		//Text does not meet minimum contrast ratio
		var minReq = $(element).data("candi508").minReq;
		if(minReq === wcagLevel.largeTextReqRatio)
			andiAlerter.throwAlert(alert_0240,["large text ", wcagLevel.level, minReq]);
		else
			andiAlerter.throwAlert(alert_0240,[" ", wcagLevel.level, minReq]);
	}
	else if(!cANDI_data.result){
		//Opacity Less Than 1
		if($(element).data("candi508").opacity)
			andiAlerter.throwAlert(alert_0232);

		//Has Background Image
		if($(element).data("candi508").bgImage !== "none")
			andiAlerter.throwAlert(alert_0230);
	}
};

//This function will return the suggested color HTML
//if cANDI_data not passed in, returns a message about suggested color not being possible
cANDI.getSuggestedColorHTML = function(cANDI_data){

	var suggestedColorHtml = "<tr><th class='cANDI508-label' scope='row'>Suggested&nbsp;";
	if(cANDI_data){
		//Get Suggested Color
		var suggestedFgColor = cANDI.getSuggestedColor(cANDI_data,"fg");
		var suggestedBgColor = cANDI.getSuggestedColor(cANDI_data,"bg");

		var suggestedColor;

		if(cANDI.suggestForegroundChange(cANDI_data, suggestedFgColor, suggestedBgColor)){
			//Suggest Foreground Color
			suggestedColor = suggestedFgColor;
			suggestedColorHtml += "Text&nbsp;Color";
		}
		else{
			//Suggest Background Color
			suggestedColor = suggestedBgColor;
			suggestedColorHtml += "Background";
		}

		suggestedColor = rgbToHex(suggestedColor);

		suggestedColorHtml += ":</th><td><div class='cANDI508-colorSelector' style='background-color:"+suggestedColor+" !important;'></div>";
		suggestedColorHtml += "<span id='cANDI508-suggested'>"+suggestedColor+"</span></td></tr>";
	}
	else{
		suggestedColorHtml += "Color:</th>"+
			"<td><a href='"+help_url+"modules.html#cANDI-style' target='_ANDIhelp' class='cANDI508-suggestionNotPossible'>"+
			"Semi-transparency present; cannot provide specific suggestion."+
			"</a></td></tr>";
	}
	return suggestedColorHtml;
};

//This function will suggest a foreground color that satisfies the minReq
cANDI.getSuggestedColor = function(cANDI_data, fgbg){

	var contrastingColor;
	var suggestedColor;

	if(fgbg == "fg"){
		contrastingColor = cANDI_data.bgColor;
		suggestedColor = cANDI_data.fgColor.clone();
	}
	else{
		contrastingColor = cANDI_data.fgColor;
		suggestedColor = cANDI_data.bgColor.clone();
	}

	var contrastOnBlack = Color.BLACK.contrast(contrastingColor).ratio;
	var contrastOnWhite = Color.WHITE.contrast(contrastingColor).ratio;

	if(contrastOnBlack > contrastOnWhite){
		//Original Color is closer to black
		//Suggest lighter foreground color
		for(var x=0; x<256; x++){

			for(var i=0; i<3; i++){
				if(suggestedColor.rgba[i] > 0)
					suggestedColor.rgba[i]--;
			}

			if(suggestedColor.contrast(contrastingColor).ratio >= cANDI_data.minReq){
				break;
			}
		}
	}
	else{
		//Original Color is closer to white
		//Suggest darker foreground color
		for(var y=0; y<256; y++){

			for(var j=0; j<3; j++){
				if(suggestedColor.rgba[j] < 255)
					suggestedColor.rgba[j]++;
			}

			if(suggestedColor.contrast(contrastingColor).ratio >= cANDI_data.minReq){
				break;
			}
		}
	}

	return suggestedColor;
};

//This function returns true if the suggested foreground color is closer to the actual foreground color.
//Returns false if the suggested background color is closer to the actual background color
cANDI.suggestForegroundChange = function(cANDI_data, suggestedFgColor, suggestedBgColor){
	if(getColorDifferenceValue(cANDI_data.fgColor, suggestedFgColor) <= getColorDifferenceValue(cANDI_data.bgColor, suggestedBgColor))
		return true;
	else
		return false;

	//This function compares two colors and returns a "color difference value" that can be used in comparisons.
	//Formula: The Color Difference Value = abs(r1 - r2) + abs(g1 - g2) + abs(b1 - b2)
	function getColorDifferenceValue(color1, color2){

		var r = Math.abs(color1.rgba[0] - color2.rgba[0]);
		var g = Math.abs(color1.rgba[1] - color2.rgba[1]);
		var b = Math.abs(color1.rgba[2] - color2.rgba[2]);

		//Return the Color Difference Value
		return r + g + b;
	}
};

//This function will check the contrast for an element
//It takes into consideration the font-size and font-weight
cANDI.contrastDisplay = function(element){

	var cANDI_data = $(element).data("candi508");

	$("#cANDI508-fontsize").html(convertPxToPt(cANDI_data.size) + "pt");

	//Display Font-weight (if bold)
	if(cANDI_data.weight >= 700)
		$("#cANDI508-fontweight").html("bold");

	//Display Font-family
	//$("#cANDI508-fontfamily").html(cANDI_data.family);

	//Display Text Color
	displayColorValue("#cANDI508-fg", cANDI_data.fgColor);

	//Display Minimum Required Ratio
	$("#cANDI508-minReqRatio").html(cANDI_data.minReq+"<span class='cANDI508-ratio-darker'>:1</span>");

	//Display text-shadow color if it exists
	//TODO: display the color in a color box, however, browsers order this property's value differently
	if($(element).css("text-shadow") != "none")
		$("#cANDI508-table-style tbody").append("<tr><th scope='row' class='cANDI508-label'>Text-Shadow:</th><td><span id='cANDI508-textshadow'>"+$(element).css("text-shadow")+"</span></td></tr>");

	//If Result is PASS or FAIL
	if(cANDI_data.result){

		//Display Background Color
		displayColorValue("#cANDI508-bg", cANDI_data.bgColor);

		//Display Contrast Ratio
		$("#cANDI508-ratio").html(cANDI_data.ratio+"<span class='cANDI508-ratio-darker'>:1</span>");

		//Display Resylt
		if(cANDI_data.result === "PASS"){
			$("#cANDI508-result").html("PASS").addClass("cANDI508-pass");
		}
		else{ //FAIL
			$("#cANDI508-result").html("FAIL").addClass("cANDI508-fail");

			if(!cANDI_data.semiTransparency){
				//There is no transparency involved, therefore, a suggestion can be made.
				//Suggest a color that meets the contrast ratio minimum:
				$("#cANDI508-table-style tbody").append(cANDI.getSuggestedColorHTML(cANDI_data));
			}
			else{
				//Cannot suggest color due to semi-transparency
				$("#cANDI508-table-style tbody").append(cANDI.getSuggestedColorHTML());
			}
		}
	}
	else{
		//MANUAL TEST NEEDED - Cannot determine pass or fail status

		//Remove Background Color Selector Box
		$("#cANDI508-colorSelector-background").remove();

		//Insert the reason:
		if(cANDI_data.bgImage != "none")
			$("#cANDI508-bg").html("<span class='cANDI508-attention'>has background image</span>");
		else if(cANDI_data.opacity){
			$("#cANDI508-bg").closest("tr").remove();
			$("#cANDI508-fg").closest("tr").remove();
		}

		$("#cANDI508-result").html("MANUAL TEST NEEDED").addClass("cANDI508-manual");
	}

	//This function converts px units to pt
	function convertPxToPt(px){
		var pt;
		//convert px to inches (divide by 96)
		pt = (px / 96 );
		//convert inches to pt (multiply by 72)
		pt = pt * 72;
		//round to 2 decimals
		pt = Math.round(pt, 2);
		//truncate the decimal
		pt = Math.floor(pt);
		return pt;
	}
};

//This function will diplay the color
function displayColorValue(id, rgbaColor){
	var hexColor = rgbToHex(rgbaColor);
	//Change color display value of this element
	if($(id).is("input"))
		$(id).val(hexColor);
	else
		$(id).html(hexColor);
	//Change color on the colorSelector
	$(id).prev().attr("style", "background-color:"+hexColor+" !important");
}

//This function will convert an rgb value to a hex value
function rgbToHex(rgbaColor){
	return "#" + valueToHex(Math.round(rgbaColor.rgba[0])) + valueToHex(Math.round(rgbaColor.rgba[1])) + valueToHex(Math.round(rgbaColor.rgba[2]));

	function valueToHex(c){
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
}

//===============
//https://github.com/LeaVerou/contrast-ratio
//Copyright (c) 2013 Lea Verou
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
//to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
//and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

//color.js Start (modified by SSA)

// Extend Math.round to allow for precision
Math.round = (function(){
	var round = Math.round;
	return function (number, decimals){
		decimals = +decimals || 0;
		var multiplier = Math.pow(10, decimals);
		return round(number * multiplier) / multiplier;
	};
})();

// Simple class for handling sRGB colors
(function(){

var _ = self.Color = function(rgba){
	if(rgba === 'transparent'){
		rgba = [0,0,0,0];
	}
	else if(typeof rgba === 'string'){
		var rgbaString = rgba;
		rgba = rgbaString.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);

		if(rgba){
			rgba.shift();
		}
		else {
			throw new Error('Invalid string: ' + rgbaString);
		}
	}

	if(rgba[3] === undefined){
		rgba[3] = 1;
	}

	rgba = rgba.map(function (a){ return Math.round(a, 3); });

	this.rgba = rgba;
};

_.prototype = {
	get rgb (){
		return this.rgba.slice(0,3);
	},

	get alpha (){
		return this.rgba[3];
	},

	set alpha (alpha){
		this.rgba[3] = alpha;
	},

	get luminance (){
		// Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
		var rgba = this.rgba.slice();

		for(var i=0; i<3; i++){
			var rgb = rgba[i];

			rgb /= 255;

			rgb = rgb < 0.03928 ? rgb / 12.92 : Math.pow((rgb + 0.055) / 1.055, 2.4);

			rgba[i] = rgb;
		}

		return 0.2126 * rgba[0] + 0.7152 * rgba[1] + 0.0722 * rgba[2];
	},

	get inverse (){
		return new _([
			255 - this.rgba[0],
			255 - this.rgba[1],
			255 - this.rgba[2],
			this.alpha
		]);
	},

	toString: function(){
		return 'rgb' + (this.alpha < 1? 'a' : '') + '(' + this.rgba.slice(0, this.alpha >= 1? 3 : 4).join(', ') + ')';
	},

	clone: function(){
		return new _(this.rgba);
	},

	//Overlay a color over another
	overlayOn: function (color){
		var overlaid = this.clone();

		var alpha = this.alpha;

		if(alpha >= 1){
			return overlaid;
		}

		//Modified code (Mod 1): (moved this line before the for loop)
		overlaid.rgba[3] = alpha + (color.rgba[3] * (1 - alpha));

		for(var i=0; i<3; i++){
			//Modified code (Mod 2): (divide by the overlaid alpha if not zero) (Formula: https://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending)
			if(overlaid.rgba[3] !== 0)
				overlaid.rgba[i] = (overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha)) / overlaid.rgba[3];
			else
			//Modified code (Mod 2) End
				overlaid.rgba[i] = overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha);
		}

		//Original code (Mod 1):
		//overlaid.rgba[3] = alpha + (color.rgba[3] * (1 - alpha));

		return overlaid;
	},

	contrast: function (color){
		// Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
		var alpha = this.alpha;

		if(alpha >= 1){
			if(color.alpha < 1){
				color = color.overlayOn(this);
			}

			var l1 = this.luminance + 0.05,
				l2 = color.luminance + 0.05,
				ratio = l1/l2;

			if(l2 > l1){
				ratio = 1 / ratio;
			}

			//Original Code (Mod 3):
			//ratio = Math.round(ratio, 1);
			//Modified code (Mod 3): increased the contrast rounding precision to two decimals
			ratio = Math.round(ratio, 2);

			return {
				ratio: ratio,
				error: 0,
				min: ratio,
				max: ratio
			};
		}

		// If we’re here, it means we have a semi-transparent background
		// The text color may or may not be semi-transparent, but that doesn't matter

		var onBlack = this.overlayOn(_.BLACK),
		    onWhite = this.overlayOn(_.WHITE),
		    contrastOnBlack = onBlack.contrast(color).ratio,
		    contrastOnWhite = onWhite.contrast(color).ratio;

		var max = Math.max(contrastOnBlack, contrastOnWhite);

		// This is here for backwards compatibility and not used to calculate
		// `min`.  Note that there may be other colors with a closer luminance to
		// `color` if they have a different hue than `this`.
		var closest = this.rgb.map(function(c, i){
			return Math.min(Math.max(0, (color.rgb[i] - c * alpha)/(1-alpha)), 255);
		});

		closest = new _(closest);

		var min = 1;
		if(onBlack.luminance > color.luminance){
			min = contrastOnBlack;
		}
		else if(onWhite.luminance < color.luminance){
			min = contrastOnWhite;
		}

		return {
			ratio: Math.round((min + max) / 2, 2),
			error: Math.round((max - min) / 2, 2),
			min: min,
			max: max,
			closest: closest,
			farthest: onWhite == max? _.WHITE : _.BLACK
		};
	}
};

_.BLACK = new _([0,0,0]);
_.GRAY = new _([127.5, 127.5, 127.5]);
_.WHITE = new _([255,255,255]);

})();
//color.js End
//===============

cANDI.analyze();
cANDI.results();

}//end init
