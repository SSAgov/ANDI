//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module(){

var iandiVersionNumber = "1.0.3";

//create iANDI instance
var iANDI = new AndiModule(iandiVersionNumber,"i");

//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	if(!event.shiftKey) //check for holding shift key
		iANDI.inspect(this);
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	iANDI.inspect(this);
	andiResetter.resizeHeights();
};

//This function will analyze the test page for focusable element related markup relating to accessibility
iANDI.analyze = function(){
	$(TestPageData.allVisibleElements).each(function(){
		if($(this).is("iframe")){
			andiData = new AndiData($(this));
			andiData.grabComponents($(this));
			andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
			andiData.attachDataToElement($(this));
		}
	});
};

//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
//Inserts some counter totals, displays the accesskey list
iANDI.results = function(){
	andiBar.updateResultsSummary("Iframes with Content: "+testPageData.andiElementIndex);
	
	if(testPageData.andiElementIndex > 0){
		var iframesSelectionMenu = "";
		var iframesSelectionLinks = "";
		
		$("#ANDI508-testPage .ANDI508-element").each(function(){
			//Build iFrame List
			iframesSelectionLinks += "<li><a href='javascript:void(0)' data-ANDI508-relatedIndex='"+$(this).attr('data-ANDI508-index')+"'>";
			if($(this).attr("src"))
				iframesSelectionLinks += $(this).attr("src");
			else
				iframesSelectionLinks += "No src";
			iframesSelectionLinks += "</a></li>";
		});
		//iframes contain body content
		if(iframesSelectionLinks){
			iframesSelectionMenu += "<p>Select iframe to open in new window, then launch ANDI.</p>"+
			"<ol>" + iframesSelectionLinks + "</ol>";
		}
		
		$("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewIframeList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>"+listIcon+"view iframe list</button><div id='iANDI508-iframeList-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'><div class='sANDI508-outline-scrollable'>"+iframesSelectionMenu+"</div></div>");
		
		$("#iANDI508-iframeList-container").find("a").click(function(){
			var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
			var relatedIframe = $("#ANDI508-testPage .ANDI508-element[data-ANDI508-index="+relatedIndex+"]");
			iANDI.openIframeInNewWindow(relatedIframe);
		});
		
		//Define outline button
		$("#ANDI508-viewIframeList-button").click(function(){
			if($(this).attr("aria-expanded") === "true"){
				//hide iframe list, show alert list
				$("#iANDI508-iframeList-container").slideUp(AndiSettings.andiAnimationSpeed);
				if(testPageData.numberOfAccessibilityAlertsFound > 0){
					$("#ANDI508-alerts-list").show();
				}
				$(this)
					.addClass("ANDI508-viewOtherResults-button-expanded")
					.html(listIcon+"view iframe list")
					.attr("aria-expanded","false")
					.removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
			}
			else{
				//show iframe list, hide alert list
				$("#ANDI508-alerts-list").hide();
				
				andiSettings.minimode(false);
				$(this)
					.html(listIcon+"hide iframe list")
					.attr("aria-expanded","true")
					.addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
					.find("img").attr("src",icons_url+"list-on.png");
				$("#iANDI508-iframeList-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
			}
			andiResetter.resizeHeights();
			return false;
		});
		
		//For iframe list links, add hoverability, focusability, clickability 
		$("#iANDI508-iframeList-container").find("a[data-ANDI508-relatedIndex]").each(function(){
			andiFocuser.addFocusClick($(this));
			var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
			var relatedElement = $("#ANDI508-testPage [data-ANDI508-index="+relatedIndex+"]").first();
			andiLaser.createLaserTrigger($(this),$(relatedElement));
			$(this)
			.hover(function(){
				if(!event.shiftKey)
					iANDI.inspect($(relatedElement));
			})
			.focus(function(){
				iANDI.inspect($(relatedElement));
			});
		});
		
		andiBar.showStartUpSummary("To test the contents of <span class='ANDI508-module-name-i'>iframes</span>, each must be viewed independently.<br />Inspect an iframe, press the \"test in new window\" button, then launch ANDI.",true);
		
		andiAlerter.updateAlertList();
	}
	else{
		andiBar.showStartUpSummary("No visible <span class='ANDI508-module-name-i'>iframes</span>.",false);
	}
	
	$("#ANDI508").focus();
};

//This function will update the info in the Active Element Inspection.
//Should be called after the mouse hover or focus in event.
iANDI.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);

	var elementData = $(element).data("ANDI508");

	var additionalComponents = [
			$(element).attr("src")
		];
	
	andiBar.displayTable(elementData,
		[
			["aria-labelledby", elementData.ariaLabelledby],
			["aria-label", elementData.ariaLabel],
			["alt", elementData.alt],
			["aria-describedby", elementData.ariaDescribedby],
			["title", elementData.title],
			["src", additionalComponents[0]]
		],
		[]
	);
	
	andiBar.displayOutput(elementData);
	
	$("#ANDI508-additionalElementDetails").html("<button>test in new window</button>");
	$("#ANDI508-additionalElementDetails button").click(function(){
		iANDI.openIframeInNewWindow(element);
		return false;
	});
};

//This function will open an iframe in a new window 
iANDI.openIframeInNewWindow = function(iframe, src){
	var iframeWindow;
	var url = $(iframe).attr("src");
	var specs = "toolbar=yes,location=yes,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes";
	var name = "_blank";
	
	if(url){
		iframeWindow = window.open(url, name, specs);
		iframeWindow.focus();
	}
	else{
		alert("This iframe has no [src] and cannot be opened independently in a new window. ANDI cannot be used to test the contents of this iframe.");
	}
};

iANDI.analyze();
iANDI.results();

}//end init
