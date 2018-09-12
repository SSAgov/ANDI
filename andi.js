//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
var andiVersionNumber = "23.1.2";

//==============//
// ANDI CONFIG: //
//==============//
//URLs
var host_url = "https://www.ssa.gov/accessibility/andi/";
var help_url = host_url+"help/";
var icons_url = host_url+"icons/";

//Load andi.css file immediately to minimize page flash
(function(){
	var head = document.getElementsByTagName("head")[0];
	var andiCss = document.createElement("link");
	andiCss.href = host_url + "andi.css";
	andiCss.type = "text/css";
	andiCss.rel = "stylesheet";
	andiCss.id = "ANDI508-css";
	var prevCss = document.getElementById("ANDI508-css");
	if(prevCss)//remove already inserted CSS to improve performance on consequtive favelet launches
		head.removeChild(prevCss);
	head.appendChild(andiCss);
})();

//Representation of Empty String that will appear on screen
AndiCheck.emptyString = "\"\"";

//This number is 2x breath interval of a screen reader (125 characters)
AndiCheck.characterLimiter = 250;

//Set the global animation speed
AndiSettings.andiAnimationSpeed = 50; //milliseconds

//The element highlights setting (true = on, false = off)
AndiSettings.elementHighlightsOn = true;
//AndiSettings.linearizePageOn = false;

//Default Module
AndiModule.module = "f";

//===============//
// ANDI OBJECTS: //
//===============//
var andiResetter = 		new AndiResetter();		//Resets things ANDI changed
var andiSettings = 		new AndiSettings();		//Stores Settings
var andiBar = 			new AndiBar();			//Main Display
var andiHotkeyList = 	new AndiHotkeyList();	//Hotkey assignments/display panel
var andiCheck = 		new AndiCheck();		//Alert Testing
var andiAlerter = 		new AndiAlerter();		//Alert Throwing
var andiLaser = 		new AndiLaser();		//Laser Functionality
var andiFocuser = 		new AndiFocuser();		//Focusing Funtionality
var andiUtility = 		new AndiUtility();		//String Manipulation
var andiOverlay = 		new AndiOverlay();		//Used to create overlays
var testPageData; 								//Test Page Data Storage/Analysis, instantiated within module launch
var andiData;									//Element Data Storage/Analysis, instatiated within module's analysis logic

var browserSupports = {
	//Does the browser support SVG?
	svg: typeof SVGRect !== "undefined"
};

//Define the overlay and find icons (not using background-image because of ie7 issues with sizing)
var overlayIcon = "<img src='"+icons_url+"overlay-off.png' class='ANDI508-overlayIcon' aria-label='overLay' />";
var findIcon = "<img src='"+icons_url+"find-off.png' class='ANDI508-findIcon' aria-label='find' />";
var listIcon = "<img src='"+icons_url+"list-off.png' class='ANDI508-listIcon' alt='' />";

//==================//
// ANDI INITIALIZE: //
//==================//
//This main function is called when jQuery is ready.
function launchAndi(){(window.andi508 = function(){

	//Ensure that $ is mapped to jQuery
	window.jQuery = window.$ = jQuery;
	
	//Check <html> and <body> elements for aria-hidden=true
	if($("html").first().attr("aria-hidden") === "true" || $("body").first().attr("aria-hidden") === "true"){
		if(confirm("ANDI has detected aria-hidden=true on the <html> or <body> elements which would render this page invisible to a screen reader.\n\nPress OK to remove the aria-hidden=true from the <html> and <body> elements to continue.")){
			$("html").removeAttr("aria-hidden");
			$("body").removeAttr("aria-hidden");
		}		
		else{
			alert("ANDI will not continue while aria-hidden=true is on <html> or <body> elements.");
			return; //Stops ANDI
		}
	}

	//Frames handling
	if(document.getElementsByTagName("frameset")[0]){
		if(confirm("ANDI has detected frames:\nPress OK to stay on the page.\n\nPress Cancel to test an individual frame.") !== true){
			var framesSelectionLinks = "<head><title>ANDI Frame Selection</title></head><body id='ANDI508-frameSelectionUI'><h1 style='font:bold 20pt Verdana'>ANDI</h1>"+
				"<p style='font:12pt Verdana'>This page, '"+document.title+"', uses frames. Each frame must be tested individually. <br />Select a frame from the list below, then launch ANDI.</p>"+
				"<h2 style='font:bold 13pt Verdana'>Frames:</h2><ol>";
			var title, titleDisplay;
			
			$("frame").each(function(){
				//Build Title Display
				title = $(this).attr("title");
				titleDisplay = " ";
				if(!title)
					titleDisplay += "<span style='color:red; font-family:verdana'>Alert: <img style='width:18px' src='"+icons_url+"danger.png' alt='danger: ' /> No title attribute on this &lt;frame&gt;.";
				else
					titleDisplay += '<span style=\"font-family:verdana\">title=\"'+ title + '\"';
				titleDisplay += "</span>";
				
				framesSelectionLinks += "<li><a href='"+$(this).attr("src")+"' style='font-family:monospace'>"+$(this).attr("src")+"</a>"+titleDisplay+"</li>";
			});
			
			framesSelectionLinks += "</ol><button style='font:10pt Verdana;' onclick='window.history.back()'>Go Back</button></body>";
			document.write(framesSelectionLinks);
		}
		else{
			//Reload the test page so that the ANDI files that were added are removed.
			location.reload();
		}
		return; //Stops ANDI
	}
	//Prevent running ANDI on the frame selection UI
	if(document.getElementById("ANDI508-frameSelectionUI")){
		//ANDI was launched while the frame selection UI was open.
		alert("Select a frame, then launch ANDI.");
		return;
	}
	
	//Get ANDI ready to launch the first module
	andiReady();

	//Default Module Launch
	AndiModule.launchModule(AndiModule.module);
	
	//Load previously saved settings.
	andiSettings.loadANDIsettings();

	//Push down test page so ANDI display can be fixed at top of screen.
	andiResetter.resizeHeightsOnWindowResize();

})();}

//==============//
// ANDI MODULE: //
//==============//

//This class defines an Andi Module.
//Should be instantiated in the module's js file.
//All ANDI modules (besides the default) should have a *andi.css file which will be loaded when the module is launched.
function AndiModule(moduleVersionNumber, moduleLetter){

	//Display the module letter in the logo when the module is instantiated
	var moduleName = $("#ANDI508-module-name");
	$(moduleName).attr("data-ANDI508-module-version",moduleLetter+"ANDI: "+moduleVersionNumber);
	if(moduleLetter == "f"){
		$(moduleName).html("&nbsp;"); //do not display default module letter
		document.getElementById("ANDI508-toolName-link").setAttribute("aria-label", "andi "+andiVersionNumber); //using setAttribute because jquery .attr("aria-label") is not recognized by ie7
	}
	else{
		$(moduleName).html(moduleLetter);
		document.getElementById("ANDI508-toolName-link").setAttribute("aria-label", moduleLetter+"andi "+moduleVersionNumber); //using setAttribute because jquery .attr("aria-label") is not recognized by ie7
		$("head").append("<link id='andiModuleCss' href='"+host_url+moduleLetter+"andi.css' type='text/css' rel='stylesheet' />");
	}
	
	//Module Selection Menu Operation
	$("#ANDI508-moduleMenu")
		.on("mouseover",AndiModule.showMenu)
		.on("mouseleave",AndiModule.hideMenu);
	$("#ANDI508-moduleMenu button")
		.on("focusout",AndiModule.hideMenu)
		.on("focus",AndiModule.showMenu)
		.on("keydown",function(event){
			var keyCode = event.keyCode || event.which;
			switch(keyCode){
			case 40: //down
				$(this).nextAll().filter(":visible").first().focus();
				break;
			case 38: //up
				$(this).prevAll().filter(":visible").first().focus();
				break;
			case 27: //esc
				$("#ANDI508-moduleMenu").children("button").first().focus();
				break;
			}
		});

	//The module should implement these priveleged methods
	this.analyze = undefined;
	this.results = undefined;
	this.inspect = undefined;
		
	//Previous Element Button - modules may overwrite this
	//Instantiating a module will reset any overrides
	$("#ANDI508-button-prevElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
		if(isNaN(index)) //no active element yet
			andiFocuser.focusByIndex(1); //first element
		else if(index == 1)
			andiFocuser.focusByIndex(testPageData.andiElementIndex); //loop back to last
		else{
			//Find the previous element with data-ANDI508-index
			//This will skip over elements that may have been removed from the DOM
			for(var x=index; x>0; x--){
				if($("#ANDI508-testPage [data-ANDI508-index='"+(x - 1)+"']").length){
					andiFocuser.focusByIndex(x - 1);
					break;
				}					
			}
		}
	});

	//Next Element Button - modules may overwrite this
	//Instantiating a module will reset any overrides
	$("#ANDI508-button-nextElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
		if(index == testPageData.andiElementIndex || isNaN(index))
			andiFocuser.focusByIndex(1); //loop back to first
		else{
			//Find the next element with data-ANDI508-index
			//This will skip over elements that may have been removed from the DOM
			for(var x=index; x<testPageData.andiElementIndex; x++){
				if($("#ANDI508-testPage [data-ANDI508-index='"+(x + 1)+"']").length){
					andiFocuser.focusByIndex(x + 1);
					break;
				}					
			}
		}
	});
}
//The module should implement these public methods
AndiModule.prototype.andiElementHoverability = undefined;
AndiModule.prototype.andiElementFocusability = undefined;

//This defines the core output logic for ANDI
AndiModule.outputLogic = function(elementData, element){
	if(!elementData.isAriaHidden && !(elementData.isPresentation && !$(element).is(":focusable"))){
		var usingTitleAsNamer = false;
		var usingSummaryAsNamer = false;
		//groupingText
		if(andiBar.output.groupingText(elementData));
		//legend
		if(!elementData.ignoreLegend && andiBar.output.legend(elementData));
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
		//summary
		else if(andiBar.output.summary(elementData)) usingSummaryAsNamer=true;
		//innerText/child
		else if(andiBar.output.innerText(elementData));
		//title
		else if(andiBar.output.title(elementData)) usingTitleAsNamer=true;
	//Accessible Description
		//aria-describedby
		if(andiBar.output.ariaDescribedby(elementData));
	//HTML Describers
		//summary
		else if(!usingSummaryAsNamer && andiBar.output.summary(elementData));
		//title
		else if(!usingTitleAsNamer && andiBar.output.title(elementData));
	//Add-On Properties
		if(andiBar.output.addOnProperties(elementData));
	}
};

//The modules will keep track of the pressed action buttons using this variable.
//When the module is refreshed, the buttons remain pressed.
//If a different module is selected, the buttons will be unpressed.
AndiModule.activeActionButtons = {};

//These functions show/hide the module selection menu
AndiModule.showMenu = function(){
	$("#ANDI508-moduleMenu").addClass("ANDI508-moduleMenu-expanded");
	//Hide tANDI
	if(!TestPageData.page_using_table)
		AndiModule.disableModuleButton("t");
	//Hide iANDI
	if($(TestPageData.allVisibleElements).filter("iframe").length == 0)
		AndiModule.disableModuleButton("i");
};
AndiModule.hideMenu = function(){
	//setTimeout and :focus check are needed to fix a timing issue in firefox and chrome
	setTimeout(function(){ 
		if(!$(":focus").hasClass("ANDI508-moduleMenu-option"))
			$("#ANDI508-moduleMenu").removeClass("ANDI508-moduleMenu-expanded");
	}, 5);
};

//This function will launch a module.
//Parameters:
//	module:	the letter of the module
AndiModule.launchModule = function(module){
	
	//Remove previously selected modules
	$("#ANDI508-moduleMenu button")
		.attr("tabindex","-1")
		.removeClass("ANDI508-moduleMenu-selected ANDI508-moduleMenu-unavailable")
		.removeAttr("aria-selected")
		.find("img").first().remove();
	
	//Select this module
	$("#ANDI508-moduleMenu-button-"+module)
		.addClass("ANDI508-moduleMenu-selected")
		.attr("tabindex","0")
		.attr("aria-selected","true")
		.append("<img src='"+icons_url+"dropdown.png' role='presentation' />");
	
	andiBar.showModuleLoading();

	setTimeout(function(){//Slight delay so that the ANDI bar appears earlier
		$("#ANDI508-testPage")
			.addClass(module+"ANDI508-testPage")
			.attr("data-ANDI508-moduleLaunched",module+"ANDI");
		
		//if current module is not this module
		if(AndiModule.module != module){
			AndiModule.module = module; //Set current module to launched module
			AndiModule.activeActionButtons = {}; //Reset action buttons
		}
		
		testPageData = new TestPageData(); //get fresh test page data

		//Global Checks
		andiCheck.isThereExactlyOnePageTitle();
		andiCheck.areThereMoreExclusiveChildrenThanParents();
		
		//Load the module's script
		var script = document.createElement("script");
		var done = false;
		script.src = host_url + module + "andi.js";
		script.type="text/javascript";
		script.id="andiModuleScript";
		script.onload = script.onreadystatechange = function(){if(!done && (!this.readyState || this.readyState=="loaded" || this.readyState=="complete")){done=true; init_module();}};

		$("#andiModuleScript").remove(); //Remove previously added module script
		$("#andiModuleCss").remove();//remove previously added module css
		
		//Execute the module's script
		document.getElementsByTagName("head")[0].appendChild(script);
		
		$("#ANDI508").removeClass().addClass("ANDI508-module-"+module).show();
		
		andiBar.hideModuleLoading();
		
		andiResetter.resizeHeights();
		
	},1);//end setTimeout
};

//This function will hide the module corresponding to the letter passed in
//unless the active module is the letter passed in
AndiModule.disableModuleButton = function(letter){
	if(AndiModule.module != letter) //This prevents disabling the module that is currently selected when no corresponding
		$("#ANDI508-moduleMenu-button-"+letter).addClass("ANDI508-moduleMenu-unavailable");
};

//================//
// ALERT MESSAGES //
//================//

//This defines the class Alert
function Alert(level, group, message, info, alertButton){
	this.level = level; 		//danger, warning, or caution
	this.group = group; 	//belongs to this alert group id
	this.message = message;	//message text
	this.info = info; 		//the id corresponding to the help page documentation
	this.alertButton = alertButton; //(optional) an alert button object
	this.list = ""; 	//variable for holding a list
}
//Define Alerts used by all modules
var alert_0001 = new Alert("danger","0"," has no accessible name, associated &lt;label&gt;, or [title].","#no_name");
var alert_0002 = new Alert("danger","0"," has no accessible name, innerText, or [title].","#no_name");
var alert_0003 = new Alert("danger","0"," has no accessible name, [alt], or [title].","#no_name");
var alert_0004 = new Alert("danger","0","Table has no accessible name, &lt;caption&gt;, or [title].","#no_name");
var alert_0005 = new Alert("danger","0","Figure has no accessible name, &lt;figcaption&gt;, or [title].","#no_name");
var alert_0006 = new Alert("danger","0","[placeholder] provided, but element has no accessible name.","#placeholder_no_name");
var alert_0007 = new Alert("warning","0","Iframe is in the keyboard tab order and has no accessible name or [title].","#iframe_tab_order");
var alert_0008 = new Alert("danger","0"," has no accessible name.","#no_name");

var alert_0011 = new Alert("danger","1","%%%; Element ids should be unique.","#dup_id", 
							new AlertButton("show ids", "ANDI508-alertButton-duplicateIdOverlay", function(){andiOverlay.overlay_duplicateIds();}, overlayIcon));
var alert_0012 = new Alert("danger","1","More than one &lt;label[for=%%%]&gt; associates with this element [id=%%%].","#dup_for");

var alert_0021 = new Alert("danger","2","Using [aria-describedby] alone on this element causes screen reader inconsistencies.","#dby_alone");
var alert_0022 = new Alert("danger","2","Using &lt;legend&gt; alone on this element causes screen reader inconsistencies.","#legend_alone");

var alert_0031 = new Alert("danger","3","[aria-labeledby] is mispelled, use [aria-labelledby].","#misspell");
var alert_0032 = new Alert("danger","3","[aria-role] not a valid attribute, use [role] instead.","#aria_role");

var alert_0041 = new Alert("warning","4","Presentation table has data table markup; Is this a data table?","#pres_table_not_have");
var alert_0043 = new Alert("caution","4","Table has more than %%% levels of [scope=%%%].","#too_many_scope_levels");
var alert_0044 = new Alert("danger","4","Scope attribute value [scope=%%%] is invalid.","#scope_invalid");
var alert_0045 = new Alert("danger","4","[headers] attribute only valid on &lt;th&gt; or &lt;td&gt;.","#headers_only_for_th_td");
var alert_0046 = new Alert("danger","4","Table has no &lt;th&gt; cells.","#table_has_no_th");
var alert_0047 = new Alert("warning","4","Scope association needed at intersection of &lt;th&gt;.","#no_scope_at_intersection");
var alert_0048 = new Alert("caution","4","Table has no [scope] associations.","#table_has_no_scope");
var alert_0049 = new Alert("danger","4","Table using both [scope] and [headers], may cause screen reader issues.","#table_mixing_scope_and_headers");
var alert_004A = new Alert("danger","4","Table has no [headers/id] associations.","#table_has_no_headers");
var alert_004B = new Alert("danger","4","Table has no [scope] but does have [headers], switch to 'headers/id mode'.","#switch_table_analysis_mode");
var alert_004C = new Alert("danger","4","Table has no [headers/id] but does have [scope], switch to 'scope mode'.","#switch_table_analysis_mode");
var alert_004E = new Alert("danger","4","Table has no &lt;th&gt; or &lt;td&gt; cells.","#table_has_no_th_or_td");
var alert_004F = new Alert("danger","4","ARIA %%% has no %%% cells.","#aria_table_grid_structure");
var alert_004G = new Alert("danger","4","ARIA %%% has no [role=columnheader] or [role=rowheader] cells.","#aria_table_grid_structure");
var alert_004H = new Alert("danger","4","ARIA %%% has no [role=row] rows.","#aria_table_grid_structure");
var alert_004I = new Alert("warning","4","&lt;table&gt; with [role=%%%] is not recognized as a data table.","#table_nontypical_role");

var alert_0052 = new Alert("danger","5","[accessKey] value \"%%%\" has more than one character.","#accesskey_more_one");
var alert_0054 = new Alert("danger","5","Duplicate [accessKey=%%%] found on button.","#accesskey_duplicate");
var alert_0055 = new Alert("caution","5","Duplicate [accessKey=%%%] found.","#accesskey_duplicate");
var alert_0056 = new Alert("danger","5","Duplicate [accessKey=%%%] found on link.","#accesskey_duplicate");

var alert_0061 = new Alert("danger","6","Element\'s [aria-labelledby] references provide no name text.","#lby_refs_no_text");
var alert_0062 = new Alert("warning","6","Element\'s [aria-describedby] references provide no description text.","#dby_refs_no_text");
var alert_0063 = new Alert("warning","6","Element referenced by [%%%] with [id=%%%] not found.","#ref_id_not_found");
var alert_0064 = new Alert("caution","6","[%%%] reference contains [aria-label].","#ref_has_aria_label");
var alert_0065 = new Alert("danger","6","Improper use of [%%%] possible: Referenced ids \"%%%\" not found.","#improper_ref_id_usage");
var alert_0066 = new Alert("danger","6","Element referenced by [headers] attribute with [id=%%%] is not a &lt;th&gt;.","#headers_ref_not_th");
var alert_0067 = new Alert("warning","6","[headers] attribute with [id=%%%] is referencing a &lt;td&gt;.","#headers_ref_is_td");
var alert_0068 = new Alert("warning","6","Element\'s [headers] references provide no association text.","#headers_refs_no_text");
var alert_0069 = new Alert("warning","6","In-page anchor target with [id=%%%] not found.","#anchor_target_not_found");
var alert_006A = new Alert("danger","6","&lt;img&gt; referenced by image map %%% not found.","#image_map_ref_not_found");

var alert_0071 = new Alert("danger","7","Page &lt;title&gt; cannot be empty.","#page_title_empty");
var alert_0072 = new Alert("danger","7","Page has no &lt;title&gt;.","#page_title_none");
var alert_0073 = new Alert("danger","7","Page has more than one &lt;title&gt; tag.","#page_title_multiple");
var alert_0074 = new Alert("danger","7","There are more legends (%%%) than fieldsets (%%%).","#too_many_legends");
var alert_0075 = new Alert("danger","7","There are more figcaptions (%%%) than figures (%%%).","#too_many_figcaptions");
var alert_0076 = new Alert("danger","7","There are more captions (%%%) than tables (%%%).","#too_many_captions");
var alert_0077 = new Alert("danger","7","Tabindex value \"%%%\" is not a number.","#tabindex_not_number");
var alert_0078 = new Alert("warning","7","Using HTML5, found deprecated %%%.","#deprecated_html");
var alert_0079 = new Alert("danger","7","List item %%% is not contained by a list container %%%.","#li_no_container");
var alert_007A = new Alert("danger","7","Description list item is not contained by a description list container &lt;dl&gt;.","#dd_dt_no_container");

var alert_0081 = new Alert("warning","8","[alt] attribute is meant for &lt;img&gt;.","#alt_only_for_images");

var alert_0091 = new Alert("warning","9","Explicit &lt;label[for]&gt; only works with form elements.","#explicit_label_for_forms");
var alert_0092 = new Alert("warning","9","Explicit &lt;label[for]&gt; shouldn't be used with buttons.","#explicit_label_not_for_buttons");

var alert_0101 = new Alert("warning","10","Combining %%% produces inconsistent screen reader results.","#unreliable_component_combine");

var alert_0112 = new Alert("caution","11","JavaScript event %%% may cause keyboard accessibility issues; investigate.","#javascript_event_caution");

var alert_0121 = new Alert("caution","12","Focusable element not in keyboard tab order.","#not_in_tab_order");
var alert_0122 = new Alert("caution","12","Focusable element not in keyboard tab order and has no accessible name.","#not_in_tab_order_no_name");
var alert_0124 = new Alert("caution","12","Iframe is in the keyboard tab order.","#iframe_tab_order");
var alert_0125 = new Alert("warning","12","Element with [role=%%%] not in the keyboard tab order.","#role_tab_order");
var alert_0126 = new Alert("danger","12","Image defined as decorative is in the keyboard tab order.","#decorative_image_tab_order");

var alert_0131 = new Alert("caution","13","Empty component:%%%.","#empty_component");
var alert_0132 = new Alert("caution","13","Empty header cell.","#empty_header_cell");

var alert_0141 = new Alert("caution","14","Child element component%%%has unused text.","#child_unused_text");

var alert_0151 = new Alert("warning","15","[title] attribute length exceeds "+AndiCheck.characterLimiter+" characters.","#character_length");
var alert_0152 = new Alert("warning","15","[alt] attribute length exceeds "+AndiCheck.characterLimiter+" characters.","#character_length");
var alert_0153 = new Alert("warning","15","[aria-label] length exceeds "+AndiCheck.characterLimiter+" characters.","#character_length");

var alert_0161 = new Alert("warning","16","Ambiguous Link: same name/description as another link but different href.","#ambiguous_link");
var alert_0162 = new Alert("caution","16","Ambiguous Link: same name/description as another link but different href.","#ambiguous_link");//caution level thrown for internal links
var alert_0163 = new Alert("caution","16","Link text is vague and does not identify its purpose.","#vague_link");
var alert_0164 = new Alert("warning","16","Link has click event but is not keyboard accessible.","#link_click_no_keyboard_access");
var alert_0165 = new Alert("warning","16","Possible inaccessible link: &lt;a&gt; element has no [href], [id], or [tabindex].","#anchor_purpose_unclear");
var alert_0166 = new Alert("caution","16","Possible inaccessible link: &lt;a&gt; element has no [href], or [tabindex].","#anchor_purpose_unclear");
var alert_0167 = new Alert("caution","16","This &lt;a&gt; element is an anchor target; If clicking performs a function, it's not keyboard accessible.","#is_anchor_target");

var alert_0171 = new Alert("danger","17","&lt;marquee&gt; element found, do not use.","#marquee_found");
var alert_0172 = new Alert("danger","17","&lt;blink&gt; element found, do not use.","#blink_found");
var alert_0173 = new Alert("danger","17","Server side image maps are not accessible.","#server_side_image_map");
var alert_0174 = new Alert("caution","17","Redundant phrase in image [alt] text.","#image_alt_redundant_phrase");
var alert_0175 = new Alert("warning","17","Image [alt] text contains file name.","#image_alt_contains_file_name");
var alert_0176 = new Alert("danger","17","Image [alt] text is not descriptive.","#image_alt_not_descriptive");
var alert_0177 = new Alert("caution","17","Ensure that background images are decorative.","#ensure_bg_images_decorative");
var alert_0178 = new Alert("danger","17","&lt;area&gt; not contained in &lt;map&gt;.","#area_not_in_map");

var alert_0180 = new Alert("warning","18","[aria-level] is not a greater-than-zero integar; level 2 will be assumed.","#arialevel_not_gt_zero_integar");
var alert_0181 = new Alert("danger","18","Element is hidden from screen reader using [aria-hidden=true].","#ariahidden");
var alert_0182 = new Alert("danger","18","Live Region contains a form element.","#live_region_form_element");
var alert_0183 = new Alert("danger","18","[role=image] is invalid; Use [role=img].","#role_image_invalid");

var alert_0190 = new Alert("warning","19","Element visually conveys heading meaning but not using semantic heading markup.","#not_semantic_heading");
var alert_0191 = new Alert("warning","19","Heading element level &lt;%%%&gt; conflicts with [aria-level=%%%].","#conflicting_heading_level");
var alert_0192 = new Alert("caution","18","[role=heading] used without [aria-level]; level 2 will be assumed.","#role_heading_no_arialevel");

var alert_0200 = new Alert("warning","20","Non-unique button: same name/description as another button.","#non_unique_button");

var alert_0210 = new Alert("caution","21","An associated &lt;label&gt; would increase the clickable area of this %%%.","#label_clickable_area");

var alert_0220 = new Alert("danger","22","Text content has been injected using CSS pseudo-elements ::before or ::after.","#pseudo_before_after");

var alert_0230 = new Alert("warning","23","Element has background-image; Perform manual contrast test.","#manual_contrast_test_bgimage");
var alert_0231 = new Alert("caution","23","Page has images; If images contain meaningful text, perform manual contrast test.","#manual_contrast_test_img");
var alert_0232 = new Alert("warning","23","Opacity less than 100%; Perform manual contrast test.","#manual_contrast_test_opacity");

var alert_0240 = new Alert("danger","24","Text does not meet %%%minimum %%% contrast ratio (%%%:1).","#min_contrast");

var alert_0250 = new Alert("warning","25","Page has %%% disabled %%%; Disabled elements are not in the keyboard tab order.","#disabled_elements",
	new AlertButton("show disabled", "ANDI508-alertButton-disabledElementsOverlay", function(){andiOverlay.overlay_disabledElements();}, overlayIcon));
var alert_0251 = new Alert("caution","25","Page has %%% disabled elements; Disabled elements do not require sufficient contrast.","#disabled_contrast",
	new AlertButton("show disabled", "ANDI508-alertButton-disabledElementsOverlay", function(){andiOverlay.overlay_disabledElements(true);}, overlayIcon));

//==================//
// DISPLAY HANDLING //
//==================//

//This private function will get ANDI ready
//Will add dependencies, insert the ANDI bar, add legacy css, define the controls
function andiReady(){
	
	andiResetter.hardReset();
	dependencies();
	appendLegacyCss();
	insertAndiBarHtml();
	defineControls();
	
	//This function creates main html structure of the ANDI Bar.
	function insertAndiBarHtml(){
		var menuButtons =
			"<button id='ANDI508-button-relaunch' aria-label='Refresh ANDI' title='Refresh ANDI' accesskey='"+andiHotkeyList.key_relaunch.key+"'><img src='"+icons_url+"reload.png' alt='' /></button>"+ //refresh
			"<button id='ANDI508-button-settings' aria-label='Advanced Settings' title='Advanced Settings'><img src='"+icons_url+"settings-off.png' alt='' /></button>"+
			"<button id='ANDI508-button-keys' aria-label='ANDI Hotkeys List' title='ANDI Hotkeys List'><img src='"+icons_url+"keys-off.png' alt='' /></button>"+
			"<button id='ANDI508-button-help' aria-label='ANDI Help' title='ANDI Help'><img src='"+icons_url+"help.png' alt='' /></button>"+
			"<button id='ANDI508-button-close' aria-label='Remove ANDI' title='Remove ANDI'><img src='"+icons_url+"close.png' alt='' /></button>";
		var moduleButtons = "<div id='ANDI508-moduleMenu' role='menu'><div id='ANDI508-moduleMenu-prompt'>Select Module:</div>"+
			//Default
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-f'>focusable elements</button>"+
			//gANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-g' aria-label='graphics slash images'>graphics/images</button>"+
			//lANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-l' aria-label='links slash buttons'>links/buttons</button>"+
			//tANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-t'>tables</button>"+
			//sANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-s'>structures</button>";
		if(!oldIE){
			//cANDI
			moduleButtons +="<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-c'>color contrast</button>";
		}
			//hANDI
		moduleButtons += "<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-h'>hidden content</button>"+
			//iframes
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-i'>iframes</button>";
		
		moduleButtons +="</div>";
		
		var andiBar = "\
		<section id='ANDI508' tabindex='0' aria-label='ANDI Accessibility Test Tool' style='display:none'>\
		<div id='ANDI508-header'>\
			<h1 id='ANDI508-toolName-heading' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'><a id='ANDI508-toolName-link' href='#' aria-haspopup='true' aria-label='ANDI "+andiVersionNumber+"'><span id='ANDI508-module-name' data-ANDI508-module-version=''>&nbsp;</span>ANDI</a></h1>\
			<div id='ANDI508-moduleMenu-container'>\
				"+moduleButtons+"\
			</div>\
			<div id='ANDI508-module-actions'></div>\
			<div id='ANDI508-loading'>Loading <div id='ANDI508-loading-animation' /></div>\
			<div id='ANDI508-barControls' aria-label='ANDI Controls' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'>\
				"+menuButtons+"\
			</div>\
		</div>\
		<div id='ANDI508-body' style='display:none'>\
			<div id='ANDI508-activeElementInspection' aria-label='ANDI Active Element Inspection' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'>\
				<div id='ANDI508-activeElementResults'>\
					<div id='ANDI508-elementControls'>\
						<button aria-label='Previous Element' title='Focus on Previous Element' accesskey='"+andiHotkeyList.key_prev.key+"' id='ANDI508-button-prevElement'><img src='"+icons_url+"prev.png' alt='' /></button>\
						<button aria-label='Next Element' title='Focus on Next Element' accesskey='"+andiHotkeyList.key_next.key+"' id='ANDI508-button-nextElement'><img src='"+icons_url+"next.png' alt='' /></button>\
						<br />\
					</div>\
					<div id='ANDI508-startUpSummary' tabindex='0' />\
					<div id='ANDI508-elementDetails'>\
						<div id='ANDI508-elementNameContainer'><h3 class='ANDI508-heading'>Element:</h3>\
							<a href='#' id='ANDI508-elementNameLink' aria-labelledby='ANDI508-elementNameContainer'>&lt;<span id='ANDI508-elementNameDisplay' />&gt;</a>\
						</div>\
						<div id='ANDI508-additionalElementDetails'></div>\
						<div id='ANDI508-accessibleComponentsTableContainer'>\
							<h3 id='ANDI508-accessibleComponentsTable-heading' class='ANDI508-heading' tabindex='0'>Accessibility Components: <span id='ANDI508-accessibleComponentsTotal'></span></h3>\
							<table id='ANDI508-accessibleComponentsTable' aria-labelledby='ANDI508-accessibleComponentsTable-heading'><tbody tabindex='0' /></table>\
						</div>\
						<div id='ANDI508-outputContainer'>\
							<h3 class='ANDI508-heading' id='ANDI508-output-heading'>ANDI Output:</h3>\
							<div id='ANDI508-outputText' tabindex='0' accesskey='"+andiHotkeyList.key_output.key+"' aria-labelledby='ANDI508-output-heading ANDI508-outputText' />\
						</div>\
					</div>\
				</div>\
			</div>\
			<div id='ANDI508-pageAnalysis' aria-label='ANDI Page Analysis' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'>\
				<div id='ANDI508-resultsSummary'>\
					<h3 class='ANDI508-heading' tabindex='0' id='ANDI508-resultsSummary-heading'></h3>\
				</div>\
				<div id='ANDI508-additionalPageResults' />\
				<div id='ANDI508-alerts-list' />\
			</div>\
		</div>\
		</section>\
		";
		
		if(browserSupports.svg)
			andiBar += "<svg id='ANDI508-laser-container'><title>ANDI Laser</title><line id='ANDI508-laser' /></svg>";
		
		var body = $("body");
		
		//Preserve original body padding and margin
		var body_padding = "padding:"+$(body).css("padding-top")+" "+$(body).css("padding-right")+" "+$(body).css("padding-bottom")+" "+$(body).css("padding-left")+"; ";
		var body_margin = "margin:"+$(body).css("margin-top")+" 0px "+$(body).css("margin-bottom")+" 0px; ";
		
		$("html").addClass("ANDI508-testPage");
		$(body)
			.addClass("ANDI508-testPage")
			.wrapInner("<div id='ANDI508-testPage' style='"+body_padding+body_margin+"' />") //Add an outer container to the test page
			.prepend(andiBar); //insert ANDI display into body
		
	}
	
	//This function appends css shims to the head of the page which are needed for old IE versions
	function appendLegacyCss(){
		if(oldIE){
			$("head").append("<!--[if lte IE 7]><link href='"+host_url+"ie7.css' rel='stylesheet' /><![endif]-->"+
				"<!--[if lt IE 9]><link href='"+host_url+"ie8.css' rel='stylesheet' /><![endif]-->");
		}
	}
	
	//This function defines what the ANDI controls/settings do.
	//Controls are: Relaunch, Highlights, Mini Mode, Hotkey List, Help, Close, TagName link, 
	// prev/next button, module laucnhers, active element jump hotkey, version popup
	function defineControls(){
		//ANDI Relaunch Button
		$("#ANDI508-button-relaunch")
			.click(function(){
				$("#ANDI508-moduleMenu-button-"+AndiModule.module).click();
				return false;
			})
			.focus(andiSettings.hideSettingsList);
			
		//ANDI Settings
		$("#ANDI508-button-settings")
			.click(function(){
				if($("#ANDI508-settingsList").css("display") === "none")
					andiSettings.showSettingsList();
				else
					andiSettings.hideSettingsList();
			})
			.focus(andiHotkeyList.hideHotkeysList);
		//Hotkeys List Button
		$("#ANDI508-button-keys")
			.click(function(){
				var hotkeyList = $("#ANDI508-hotkeyList");
				if(!$(hotkeyList).html()){
					//build the hotkeyList after first click
					andiHotkeyList.buildHotkeyList();
					//andiHotkeyList.addArrowNavigation();
					andiHotkeyList.showHotkeysList();
				}
				else if($(hotkeyList).css("display") === "none")
					andiHotkeyList.showHotkeysList();
				else
					andiHotkeyList.hideHotkeysList();
			})
			.focus(andiSettings.hideSettingsList);
		//ANDI Help Button
		$("#ANDI508-button-help")
			.click(function(){
				var helpLocation = "howtouse.html";
				if(AndiModule.module != "f") //jump directly to the module on the help page
					helpLocation = "modules.html#" + AndiModule.module + "ANDI";
				
				window.open(help_url+helpLocation, "_ANDIhelp",'width=810,height=620,scrollbars=yes,resizable=yes').focus();
			})
			.focus(andiHotkeyList.hideHotkeysList);
		//ANDI Remove/Close Button
		$("#ANDI508-button-close").click(function(){
			$("#ANDI508-testPage .ANDI508-element-active").first().removeClass("ANDI508-element-active");
			andiResetter.hardReset();
		});
		//Tag name link
		$("#ANDI508-elementNameLink")
			.click(function(){ //Place focus on active element when click tagname
				andiFocuser.focusByIndex($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
				andiLaser.eraseLaser();
				return false;
			})
			.hover(function(){ //Draw line to active element
				andiLaser.drawLaser($(this).offset(),$("#ANDI508-testPage .ANDI508-element-active").offset(),$("#ANDI508-testPage .ANDI508-element-active"));
			})
			.on("mouseleave", andiLaser.eraseLaser);
		//Active Element Jump Hotkey
		$(document).keydown(function(e){
			if(e.which === andiHotkeyList.key_active.code && e.altKey )
				$("#ANDI508-testPage .ANDI508-element-active").focus();
		});
		//Module Launchers
		$("#ANDI508-moduleMenu").children("button").each(function(){
			$(this).click(function(){
				andiResetter.softReset($("#ANDI508-testPage"));
				AndiModule.launchModule(this.id.slice(-1)); //pass the letter of the module (last character of id)
			});
		});
		//ANDI Version Popup
		$("#ANDI508-toolName-link").click(function(){
			alert("ANDI "+andiVersionNumber+"\n"+$("#ANDI508-module-name").attr("data-ANDI508-module-version"));
			return false;
		});
	}

	//This function sets up several dependencies for running ANDI on the test page.
	function dependencies(){
		
		//Define :focusable and :tabbable pseudo classes. Code from jQuery UI
		$.extend($.expr[ ':' ], {data: $.expr.createPseudo ? $.expr.createPseudo(function(dataName){return function(elem){return !!$.data(elem, dataName);};}) : function(elem, i, match){return !!$.data(elem, match[ 3 ]);},
			focusable: function(element){return focusable(element, !isNaN($.attr(element, 'tabindex')));},
			tabbable: function(element){var tabIndex = $.attr(element, 'tabindex'),isTabIndexNaN = isNaN(tabIndex); return (isTabIndexNaN || tabIndex >= 0) && focusable(element, !isTabIndexNaN);
		}});
		
		//Define :shown
		//Similar to :visible but doesn't include elements with visibility:hidden,
		$.extend(jQuery.expr[':'], {
			shown: function (elem, index, selector){return $(elem).css("visibility") !== "hidden" && !$(elem).is(":hidden");}
		});
		
		//Define isSemantically, Based on jquery .is method
		//Parameters: should be css selector strings
		//	roles:	semantic roles to check against. Example: "[role=link]"
		//	tags:	semantic tags to check against. Example: "a"
		//If the role is a trimmed empty string, gets semantics from the tagName
		$.fn.extend({
			isSemantically:function(roles, tags){
				//If this has one of the roles or (is one of the tags and doesn't have another role that isn't empty)
				return $(this).is(roles) || ($(this).is(tags) && !$.trim($(this).attr("role")))
			}
		});
		
		//Define focusable function: Determines if something is focusable and its ancestors are visible. 
		//Code based on jQuery UI, modifications: disabled links, svg[focusable=true], tabindex=""
		function focusable(element){
			var nodeName = element.nodeName.toLowerCase();
			var tabindex = $.attr(element, "tabindex"); //intentionally using jquery
			var isTabIndexNotNaN = !isNaN(tabindex) && tabindex !== "";
			if(nodeName === "area"){
				var map = element.parentNode; var mapName = map.name; 
				if(!element.href || !mapName || map.nodeName.toLowerCase() !== "map") return false;
				var img = $("img[usemap=\\#" + mapName + "]")[0]; return !!img && visibleParents(img);
			}
			return(
				/^(input|select|textarea|button|object|iframe)$/.test(nodeName) ?
				!element.disabled
				: nodeName === "a" ?
					(element.href && !element.disabled) || isTabIndexNotNaN
					: isTabIndexNotNaN || 
					//check for focusable svg
					(nodeName === "svg" && $.attr(element, "focusable") === "true") || 
					//check for contenteditable="true" or contenteditable=""
					($.attr(element, "contenteditable") === "true" || $.attr(element, "contenteditable") === "")
				) && visibleParents(element); 
			function visibleParents(element){
				return !$(element).parents().addBack().filter(function(){
					return $.css(this, "visibility") === "hidden";
				}).length;
			}
		}
		
		//Define .includes() to make indexOf more readable.
		if (!String.prototype.includes){
			String.prototype.includes = function(search, start){
				'use strict';
				if(typeof start !== "number") start = 0;
				if(start + search.length > this.length) return false;
				else return this.indexOf(search, start) !== -1;
			};
		}
		
		//Define isContainerElement: This support function will return true if an element can contain text (is not a void element)
		(function($){
			var visibleVoidElements = ['area','br','embed','hr','img','input','menuitem','track','wbr'];
			$.fn.isContainerElement = function(){return ($.inArray($(this).prop("tagName").toLowerCase(), visibleVoidElements) == -1);};
		}(jQuery));
		
		//Define Object.keys for old IE
		if (!Object.keys) {Object.keys=(function(){'use strict';var hasOwnProperty = Object.prototype.hasOwnProperty,hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],dontEnumsLength = dontEnums.length;return function(obj) {if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {throw new TypeError('Object.keys called on non-object');}var result = [], prop, i;for (prop in obj) {if (hasOwnProperty.call(obj, prop)) {result.push(prop);}}if (hasDontEnumBug) {for (i = 0; i < dontEnumsLength; i++) {if (hasOwnProperty.call(obj, dontEnums[i])) {result.push(dontEnums[i]);}}}return result;};}());}
		
		//Define Array.indexOf for old IE
		if(!Array.prototype.indexOf){Array.prototype.indexOf = function(obj, start){ for (var i = (start || 0), j = this.length; i < j; i++){if (this[i] === obj) { return i; } } return -1;}}
	}
}

//This object handles the updating of the ANDI Bar
function AndiBar(){
	
	//This private variable will store the text/html that will appear in the output
	var outputText = "";
	
	//This function will add the component to the outputText if it is not empty.
	//Parameters:
	//	accessibleComponentText: text that will appear on the screen as the output
	//	componentType: component type that will be the class and title attribute
	//	doMatchingTest: if true, it will run a matching test before attempting to insert the component text, (prevent double speak).
	function andiFound(accessibleComponentText, componentType, doMatchingTest){
		if(accessibleComponentText !== "" && accessibleComponentText !== undefined && accessibleComponentText != AndiCheck.emptyString){
			if(componentType === "legend" || componentType === "parent")//prepend
				outputText = "<span class='ANDI508-display-"+componentType+"'>"+accessibleComponentText+"</span> " + outputText;
			else if(!doMatchingTest || (doMatchingTest && !matchingTestResult(accessibleComponentText, doMatchingTest)))
				outputText += "<span class='ANDI508-display-"+componentType+"'>"+accessibleComponentText+"</span> ";
			return true;
		}
		return false;
		
		//This function will return false if title or aria-describedby text matches a namer's text
		//Parameters:
		//	accessibleComponentText: text of the describer that will be compared for matches
		//	matchingAgainstObject: the object from which to get the namers text
		//TODO: it's possible to throw an alert here, but it would appear in the alert list dynamically on each inspect and you'd have to handle duplication prevention
		function matchingTestResult(accessibleComponentText, matchingAgainstObject){
			var matchFound = false;
			accessibleComponentText = stripHTML(accessibleComponentText); //ignores andiLaser markup
			var components = ["ariaLabelledby","ariaLabel","label","alt","innerText","value"];
			var text, component;
			for(var x=0; x<components.length; x++){
				component = components[x];
				if(matchingAgainstObject[component] && (component !== "label" || !matchingAgainstObject.ignoreLabel) ){
					text = stripHTML(matchingAgainstObject[component]);
					if(text !== AndiCheck.emptyString){
						if(accessibleComponentText === text)
							matchFound = true;
						break;
					}
				}
			}
			return matchFound;
			
			//This function provides a slick way to remove html and get the inner text
			//but also to escape syntax that would throw a javascript error.
			//Without the <b> container, it will error out on special characters.
			function stripHTML(html){
				return $("<b>"+html+"</b>").text();
			}
		}
	}
	
	//This object is used to display the output text if a component has data
	this.output = {
		//These variables are actually functions. They will be called by the output logic.
		//Return false if the component is empty
		//Return true if not empty and will add html to the output display.
		ariaLabel: 		function(elementData){return andiFound(elementData.ariaLabel,		"aria-label");},
		ariaLabelledby: function(elementData){return andiFound(elementData.ariaLabelledby,	"aria-labelledby");},
		label: 			function(elementData){return andiFound(elementData.label,			"label");},
		alt: 			function(elementData){return andiFound(elementData.alt,				"alt");},
		value: 			function(elementData){return andiFound(elementData.value,			"value");},
		ariaDescribedby:function(elementData){return andiFound(elementData.ariaDescribedby,	"aria-describedby", elementData);},
		title: 			function(elementData){return andiFound(elementData.title,			"title", elementData);},
		summary:		function(elementData){return andiFound(elementData.summary,			"summary");},
		legend: 		function(elementData){return andiFound(elementData.legend,			"legend");},
		figcaption: 	function(elementData){return andiFound(elementData.figcaption,		"figcaption");},
		caption: 		function(elementData){return andiFound(elementData.caption,			"caption");},
		groupingText:	function(elementData){return andiFound(elementData.groupingText,	"parent");},
		//innerText also calls subtree
		innerText: 		function(elementData){
							var innerTextResult = andiFound(elementData.innerText, "innerText");
							andiFound(elementData.subtree, "child"); //comes after innertext
							return innerTextResult;},
		addOnProperties:function(elementData){
							if(elementData.addOnProperties)
								return andiFound(elementData.addOnPropOutput, "addOnProperties");
							else return false;}
	};

	//This function prepares the active element inspection for the next element to display its data
	this.prepareActiveElementInspection = function(element){
		if(!$(element).hasClass("ANDI508-element-active")){
			$("#ANDI508-testPage .ANDI508-element-active").first().removeClass("ANDI508-element-active"); //remove previous active element
			$(element).addClass("ANDI508-element-active"); //mark this as the active element that ANDI is inspecting
		}
		//Display Element Name (tag/role)
		var tagNameDisplay = $(element).prop("tagName").toLowerCase();
		if($(element).is("input") && $(element).attr("type"))
			tagNameDisplay += ' type="' + $(element).attr("type") + '"';
		var role = $.trim($(element).attr("role"));
		if(role)
			tagNameDisplay += ' role="' + role + '"';
		$("#ANDI508-elementNameDisplay").html(tagNameDisplay);
		//Hide the startUpSummary and show the elementDetails/pageAnalysis
		if($("#ANDI508-startUpSummary").html()){
			$("#ANDI508-startUpSummary").html("").hide();
			$("#ANDI508-elementDetails").css("display","inline-block");
			$("#ANDI508-pageAnalysis").show();
		}
	};
	
	//This function will display the output depending on the logic of the module Output Logic
	//which should be defined in each module.
	//It will also add the alerts to the output.
	//No output will be displayed if there are danger level alerts.
	this.displayOutput = function(elementData, isFocusable){
		outputText = ""; //reset - this will hold the output text to be displayed

		if(elementData.dangers.length){
			//dangers were found during load
			for(var d=0; d<elementData.dangers.length; d++)
				andiFound(elementData.dangers[d],"danger");
		}
		else{ //No dangers found during load
			AndiModule.outputLogic(elementData, isFocusable); //Each module should define this within the inspect logic
		}
		
		if(elementData.warnings.length){
			//warnings were found during load
			for(var w=0; w<elementData.warnings.length; w++)
				andiFound(elementData.warnings[w],"warning");
		}
		
		if(elementData.cautions.length){
			//cautions were found during load
			for(var c=0; c<elementData.cautions.length; c++)
				andiFound(elementData.cautions[c],"caution");
		}

		//Place the output display into the container.
		$("#ANDI508-outputText").html(outputText);
	};
	
	//This function displays the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	this.displayTable = function(elementData, components, addOnPropComponents, additionalComponents){
		if(andiCheck.wereComponentsFound(elementData, additionalComponents)){
			appendRow(components);
			if(elementData.addOnPropertiesTotal !== 0 || additionalComponents)
				appendRow(addOnPropComponents, true);
			andiLaser.createReferencedComponentLaserTriggers();
		}
		
		//This function will append a row to the accessibleComponentsTable if the componentText is not empty
		//It will also attach andiLaser functionality if useLaser is true
		//Parameters:
		//	components: 		array of arrays components to add. each item is an array [0] is the type, [1] is the value
		//	isAddOnProperty:	if true will use addOnProperties as the css class to color the component
		function appendRow(components, isAddOnProperty){
			var rows = "";
			for(var x=0, displayType; x<components.length; x++){
				//if this component has a value
				if(components[x][1]){
					//set display type
					displayType = isAddOnProperty ? "addOnProperties" : components[x][0];
					//add to row
					rows += "<tr id='ANDI508-table-"+components[x][0]+"'><th class='ANDI508-display-"+displayType+"' scope='row'>"+components[x][0]+": </th><td class='ANDI508-display-"+displayType+"'>"+components[x][1]+"</td></tr>";
				}
			}
			if(rows)
				$("#ANDI508-accessibleComponentsTable").children("tbody").first().append(rows);
		}
	};
	
	//This function will focus on an element if it is inspectable according to this module
	this.focusIsOnInspectableElement = function(){
		//Is there is an active element on the page? (was ANDI was relaunched?)
		var activeElement = $("#ANDI508-testPage .ANDI508-element-active").first();
		if(activeElement.length && $(activeElement).hasClass("ANDI508-element")){
			//Yes. "re-inspect" the active element
			andiFocuser.focusOn($(activeElement));
			return true;
		} 
		else{
			$("#ANDI508").focus();
			return false; //module logic should show startUpSummary
		}
	};
	
	//This function will show the startUpSummary with the text provided and conditionally show the pageAnalysis.
	//It will also hide the activeElementResults
	//Parameters:
	//	text:				text that will appear in the startUpSummary
	//	showPageAnalysis:	if true will show the pageAnalysis
	this.showStartUpSummary = function(text, showPageAnalysis, elementType){
		var instruction = "";
		if(elementType)
			instruction = "<p>Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every "+elementType+".</p>";
		text = "<p>"+text+"</p>";
		if(showPageAnalysis)
			$("#ANDI508-pageAnalysis").show();
		else
			$("#ANDI508-pageAnalysis").hide();
		$("#ANDI508-elementDetails").hide();
		$("#ANDI508-startUpSummary").html(text+instruction).css("display","inline-block");
	};
	
	//This function updates the resultsSummary
	//	summary:	the summary text
	this.updateResultsSummary = function(summary){
		$("#ANDI508-resultsSummary-heading").html(summary);
	};
	
	//These functions show/hide the elementControls
	this.showElementControls = function(){
		$("#ANDI508-elementControls button").show();
	};
	this.hideElementControls = function(){
		$("#ANDI508-elementControls button").hide();
	};
	
	//These functions show/hide the anmiated loading image
	this.showModuleLoading = function(){
		$("#ANDI508-body").hide();
		$("#ANDI508-loading").css("display","inline-block");
	};
	this.hideModuleLoading = function(){
		setTimeout(function(){
			$("#ANDI508-loading").hide();
			$("#ANDI508-body").show();
		},1);
	};
	
	//This function adds the functionality to any moduleActionGroup
	this.initializeModuleActionGroups = function(){
		$("#ANDI508-module-actions button.ANDI508-moduleActionGroup-toggler").each(function(){
			//Toggler button
			$(this)
				.attr("aria-expanded","false")
				.attr("role","menuitem")
				//Arrow down opens menu. Tab or Shift Tab closes menu
				.on("keydown",function(event){
					var keyCode = event.keyCode || event.which;
					switch(keyCode){
					case 40: //down
						$(this).parent().addClass("ANDI508-moduleActionGroup-visible");
						$(this)
							.attr("aria-expanded","true")
							.next().find("button").first().focus();
						break;
					case 9: //tab (covers shift tab)
						$(this).parent().removeClass("ANDI508-moduleActionGroup-visible");
						$(this).attr("aria-expanded","false");
						break;
					}
				})
				//Clicking toggles menu
				.click(function(){
					if($(this).attr("aria-expanded") === "false"){
						//On
						$(this).attr("aria-expanded","true");
						$(this).parent().addClass("ANDI508-moduleActionGroup-visible");
					}
					else{
						//off
						$(this).attr("aria-expanded","false");
						$(this).parent().removeClass("ANDI508-moduleActionGroup-visible");
					}
				})
				//Add icon
				.append(" <img src='"+icons_url+"dropdown.png' role='presentation' />");
			
			$(this).next()
				//Menu container
				.attr("role","application")
				//Each button within menu container
				.find("button").each(function(){
					$(this)
						.attr("tabindex","-1")
						.on("focusout",function(){
							//setTimeout and :focus check are needed to fix a timing issue in firefox and chrome
							var moduleActionGroup = $(this).parent(); //options container
							setTimeout(function(){
								if(!$(":focus").parent().is(moduleActionGroup)){
									$(moduleActionGroup).parent() //entire container
										.removeClass("ANDI508-moduleActionGroup-visible")
										.find("button.ANDI508-moduleActionGroup-toggler").first().attr("aria-expanded","false");
								}
							}, 5);
						}).on("focus",function(){
							$(this).parent().parent()
								.addClass("ANDI508-moduleActionGroup-visible")
								.find("button.ANDI508-moduleActionGroup-toggler").first().attr("aria-expanded","true");
						}).on("keydown",function(event){
							var keyCode = event.keyCode || event.which;
							switch(keyCode){
							case 40: //down
								$(this).nextAll().first().focus();
								break;
							case 38: //up
								$(this).prevAll().first().focus();
								break;
							case 27: //esc
								$(this).parent().parent().find("button.ANDI508-moduleActionGroup-toggler").first().focus();
								break;
							}
						});
				});
			//Widget container
			$(this).parent()
				.attr("role","menu")
				.on("mouseleave",function(){
					$(this)
						.removeClass("ANDI508-moduleActionGroup-visible")
						.find("button.ANDI508-moduleActionGroup-toggler").first().attr("aria-expanded","false");
				});
		});
	};
}

//This class is used to reset things that ANDI changed.
function AndiResetter(){
	//This function will clean up almost everything that ANDI inserted.
	//Exceptions: 	.ANDI508-element-active (handled on close button press)
	//				css <link> tags (all classes will be removed so it won't affect anything)
	this.hardReset = function(){
		if(document.getElementById("ANDI508")){//check if ANDI was inserted
			var testPage = $("#ANDI508-testPage");
			//if($("#ANDI508-button-linearize").attr("aria-checked") === "true")
			//	AndiSettings.linearizePageOn = true;
			$("#ANDI508").remove(); //removes ANDI
			andiResetter.softReset(testPage);
			andiResetter.restoreTestPageFixedPositionDistances(testPage);
			$(testPage).find(".ANDI508-laserTarget").removeClass("ANDI508-laserTarget");
			$(testPage).contents().unwrap();
			$("#ANDI508-laser-container").remove();
			$("#andiModuleScript").remove();//remove module script
			$("#andiModuleCss").remove();//remove module css
			$("script[src$='andi.js']").eq(1).remove(); //remove the second instance of the script
			$("html.ANDI508-testPage, body.ANDI508-testPage").removeClass("ANDI508-testPage");
		}
	};
	
	//This function is called between module launches.
	this.softReset = function(testPage){
		if(testPage){
			$("#ANDI508-additionalElementDetails").html("");
			$("#ANDI508-additionalPageResults").html("");
			$("#ANDI508-alerts-list").html("");
			$("#ANDI508-module-actions").html("");
			andiBar.showElementControls();

			//get previously launched module name
			var module = $(testPage).attr("data-ANDI508-moduleLaunched");

			//Loop through every ANDI508-element to clean up stuff
			$(testPage).find(".ANDI508-element").each(function(){
				
				//Module specific cleanup
				if(module === "tANDI")
					$(this).removeClass("tANDI508-highlight").removeAttr("data-tANDI508-rowIndex data-tANDI508-colIndex data-tANDI508-rowgroupIndex data-tANDI508-colgroupIndex");
				else if(module === "lANDI")
					$(this).removeClass("lANDI508-internalLink lANDI508-externalLink lANDI508-ambiguous");
				else if(module === "gANDI")
					$(this).removeClass("gANDI508-background");
				else if(module === "hANDI")
					$(this).removeAttr("data-hANDI508-hidingTechniques").removeClass("ANDI508-forceReveal ANDI508-forceReveal-display ANDI508-forceReveal-visibility ANDI508-forceReveal-position ANDI508-forceReveal-opacity ANDI508-forceReveal-overflow ANDI508-forceReveal-fontSize ANDI508-forceReveal-textIndent ANDI508-forceReveal-html5Hidden");

				//All Modules cleanup
				$(this)
					.removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
					.removeData("ANDI508")
					.removeAttr("data-ANDI508-index")
					.off("focus",AndiModule.andiElementFocusability)
					.off("mouseenter",AndiModule.andiElementHoverability);
			});
			//Additional Elements that were manipulated
			if(module === "hANDI"){
				$(testPage).find(".hANDI508-hasHiddenCssContent").removeClass("hANDI508-hasHiddenCssContent");
			}
			else if(module === "gANDI"){
				$(testPage).find(".gANDI508-decorative").removeClass("gANDI508-decorative");
			}
			else if(module === "tANDI"){
				$(testPage).find("tr[data-tANDI508-colgroupSegment]").removeAttr("data-tANDI508-colgroupSegment");
				$("#ANDI508-prevTable-button").remove();
				$("#ANDI508-nextTable-button").remove();
			}
			//Cleanup laser targets
			$(testPage).find(".ANDI508-relatedLaserTarget").removeClass("ANDI508-relatedLaserTarget").removeAttr("data-ANDI508-relatedLaserIndex");
			
			//Remove any custom click logic from prev next buttons (will be reapplied later)
			$("#ANDI508-button-prevElement").off("click");
			$("#ANDI508-button-nextElement").off("click");
			
			//Remove all overlays
			andiOverlay.removeAllOverlays();
			
			//remove module class from test page
			$(testPage).removeClass();
		}
	};

	//This function resizes ANDI's display and the ANDI508-testPage container so that ANDI doesn't overlap with the test page.
	//Should be called any time the height of the ANDI Bar might change.
	this.resizeHeights = function(hideSettingsList){
		var testPage = $("#ANDI508-testPage");
		//Calculate remaining height for testPage
		setTimeout(function(){
			var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
			var andiHeight = $("#ANDI508").outerHeight(true);
			var testPageHeight = (windowHeight - andiHeight) + "px";
			var testPagePaddingLeftRight = parseInt($(testPage).css("padding-left")) + parseInt($(testPage).css("padding-right"));
			var testPageWidth = (window.innerWidth - testPagePaddingLeftRight) + "px";
			andiHeight = andiHeight+"px";
			//alert(windowHeight); alert(andiHeight); alert(testPageHeight);
			$(testPage)
				.css("height", testPageHeight)
				.css("margin-top", andiHeight)
				.css("width", testPageWidth)
				.find("[data-ANDI508-origFixedTopBot]").each(function(){
					//Adjust the top/bottom distance of any fixed elements in the test page
					var origFixedTopBot = $(this).attr("data-ANDI508-origFixedTopBot").split(" ");
					var top = origFixedTopBot[0];
					var bottom = origFixedTopBot[1];
					if(top!="auto") //if attached to top
						$(this).css("top",parseInt(andiHeight) + parseInt(top) + "px"); //add the heights together so there is no overlap
					else if(bottom === "auto") //if attached to bottom
						$(this).css("top",andiHeight);
				});
			andiHotkeyList.hideHotkeysList();
			if(!hideSettingsList)
				andiSettings.hideSettingsList();
		}, AndiSettings.andiAnimationSpeed+50);
	};
	
	//This function will adjust the top distance of all elements on the test page that have css fixed positions.
	//This allows ANDI to not overlap with test page if using fixed positions.
	this.storeTestPageFixedPositionDistances = function(element){
		if(($(element).css("position") === "fixed") && !$(element).attr("data-ANDI508-origFixedTopBot"))
			$(element).attr("data-ANDI508-origFixedTopBot", $(element).css("top")+" "+$(element).css("bottom")); //store the value of the original top distance and bottom distance
	};
	//This function will restore the test page fixed position distances to their original values.
	//It is meant to be called when the close ANDI button is pressed.
	this.restoreTestPageFixedPositionDistances = function(testPage){
		$(testPage).find("[data-ANDI508-origFixedTopBot]").each(function(){
			var origFixedTopBot = $(this).attr("data-ANDI508-origFixedTopBot").split(" ");
			var top = origFixedTopBot[0];
			var bottom = origFixedTopBot[1];
			$(this).removeAttr("data-ANDI508-origFixedTopBot").css("top",top).css("bottom",bottom);
		});
	};
	
	//This will automatically call resizeHeights when the browser window is resized by the user.
	this.resizeHeightsOnWindowResize = function(){
		$(window).resize(andiResetter.resizeHeights);
	};
}

//This class is used to handle ANDI's own hotkeys
function AndiHotkeyList(){
	
	//This class is used to create a hotkey
	function AndiHotkey(key, sp, code){
		this.key = key;		//key character
		this.sp = sp;		//spelling
		this.code = code;	//keyCode (optional)
	}
	
	//Set the hotkeys/accesskeys
	this.key_jump = new AndiHotkey("`","grave");
	this.key_prev = new AndiHotkey(",","comma");
	this.key_next = new AndiHotkey(".","period");
	this.key_output = new AndiHotkey("&apos;","apostrophe");
	this.key_relaunch = new AndiHotkey("=","equals");
	this.key_active = new AndiHotkey("/","slash",191);

	//These functions Show or Hide the ANDI508-hotkeyList
	this.showHotkeysList = function(){
		$("#ANDI508-hotkeyList").slideDown(AndiSettings.andiAnimationSpeed).find("a").first().focus();
		$("#ANDI508-button-keys").attr("aria-expanded","true").children("img").attr("src",icons_url+"keys-on.png");
	};
	this.hideHotkeysList = function(){
		//$("#ANDI508-hotkeyList-items").children("li").attr("tabindex","-2");//reset the hotkey item that may have been arrowed to.
		$("#ANDI508-hotkeyList").slideUp(AndiSettings.andiAnimationSpeed);
		$("#ANDI508-button-keys").attr("aria-expanded","false").children("img").attr("src",icons_url+"keys-off.png");
	};
	
	//This function builds ANDI's hotkey list html
	this.buildHotkeyList = function(){
		
		var firefox, chrome = false;
		
		if(navigator.userAgent.toLowerCase().includes("firefox"))
			firefox = true;
		else if(navigator.userAgent.toLowerCase().includes("chrome"))
			chrome = true;
		
		var hotkeyTrigger = (firefox) ? "shift+alt+" : "alt+";
		
		var hotkeyList = "<div id='ANDI508-hotkeyList'>"+
			"<h3><a rel='help' href='"+ help_url + "howtouse.html#Hotkeys' target='_blank'>Hotkeys:</a></h3>"+
			"<span class='ANDI508-code' aria-hidden='true'>&nbsp;"+hotkeyTrigger+"</span>"+
			"<ul id='ANDI508-hotkeyList-items' aria-label='These hotkeys will help you navigate ANDI.'>"+
			insertHotkeyListItem("Relaunch", andiHotkeyList.key_relaunch.key, andiHotkeyList.key_relaunch.sp)+
			insertHotkeyListItem("Next Element", andiHotkeyList.key_next.key, andiHotkeyList.key_next.sp)+
			insertHotkeyListItem("Prev Element", andiHotkeyList.key_prev.key, andiHotkeyList.key_prev.sp)+
			insertHotkeyListItem("Active Element", andiHotkeyList.key_active.key, andiHotkeyList.key_active.sp);
	
		if(!chrome){
			//chrome cannot put accesskey focus on static element
			hotkeyList += insertHotkeyListItem("ANDI Output", andiHotkeyList.key_output.key, andiHotkeyList.key_output.sp);
			hotkeyList += insertHotkeyListItem("Section Jump", andiHotkeyList.key_jump.key, andiHotkeyList.key_jump.sp);
		}
		
		hotkeyList += "</ul><h3><a rel='help' href='"+ help_url + "howtouse.html#HoverLock' target='_blank'>Hover Lock:</a></h3><ul aria-label='Hover lock is a feature for mouse users.'><li>&nbsp;&nbsp;&nbsp;hold shift</li></ul></div>";
		
		$("#ANDI508-button-keys").after(hotkeyList);
		
		$("#ANDI508-hotkeyList").keydown(function(e){
			switch(e.keyCode){
			case 27: //esc
				andiHotkeyList.hideHotkeysList();
				$("#ANDI508-button-keys").focus();
				break;
			}
		});
		
		//This function will insert a hotkey list item.
		//The screen reader will read the aria-label attribute contents when programmatic focus arrives.
		function insertHotkeyListItem(purpose,key,key_sp){
			return "<li><span class='ANDI508-screenReaderOnly'>"+hotkeyTrigger+key_sp+" </span><span class='ANDI508-code' aria-hidden='true'>"+key+"</span>&nbsp;"+purpose+"</li>";
		}
	};
}

//This class is used to keep track of ANDI settings
function AndiSettings(){
	
	//This function will save ANDI settings
	this.saveANDIsettings = function(){ 
		//If this browser has HTML5 local storage capabilities
		if (typeof(Storage) !== "undefined") {
			try{
				if(window.localStorage){
					//Save the current minimode selection
					localStorage.setItem("ANDI508-minimode", $("#ANDI508-button-minimode").attr("aria-checked"));
					//Save the linearize selection
					localStorage.setItem("ANDI508-linearize", $("#ANDI508-button-linearize").attr("aria-checked"));
				}
			}catch(err){console.error(err);}
		}
	};
	//This function will load ANDI settings
	//If no saved settings were found, it will load with the default settings.
	//Default Minimode: false
	this.loadANDIsettings = function(){
		buildSettingsList();
		addSettingListNavigation();
		addSettingsButtonLogic();
		
		//If this browser has HTML5 local storage capabilities
		if(typeof(Storage) !== "undefined"){
			try{
				if(window.localStorage){
					//Load the Minimode
					if(!localStorage.getItem("ANDI508-minimode"))
						//Default minimode to false
						andiSettings.minimode(false);
					else{//load from local storage
						if(localStorage.getItem("ANDI508-minimode") == "true")
							andiSettings.minimode(true);
						else
							andiSettings.minimode(false);
					}
					
					//Load the Linearize
					if(!localStorage.getItem("ANDI508-linearize"))
						//Default linearize to false
						andiSettings.linearize(false);
					else{//load from local storage
						if(localStorage.getItem("ANDI508-linearize") == "true")
							andiSettings.linearize(true);
						else
							andiSettings.linearize(false);
					}
				}
				else{//no local storage
					andiSettings.linearize(false);
				}
			}catch(err){console.error(err);}
		}
	};
	
	//This function will toggle the state of mini mode
	//Parameters:
	//	state: true or false
	this.minimode = function(state){
		if(state){//minimode on
			$("#ANDI508-body").addClass("ANDI508-minimode");
			$("#ANDI508-accessibleComponentsTableContainer").hide();
			andiSettings.setting_on($("#ANDI508-button-minimode"));
		}
		else{//minimode off
			$("#ANDI508-body").removeClass("ANDI508-minimode");
			$("#ANDI508-accessibleComponentsTableContainer").show();
			andiSettings.setting_off($("#ANDI508-button-minimode"));
		}
		andiResetter.resizeHeights(true);
	};
	
	//This function will toggle the state of linearize
	//Parameters:
	//	state: true or false
	this.linearize = function(state){
		if(state){//linearize on
			//if(AndiSettings.elementHighlightsOn)
				//	$("#ANDI508-button-highlights").click(); //turn off element highlights while this button is on
			
			andiSettings.setting_on($("#ANDI508-button-linearize"));
			var position, display;
			//var isPageNonLinear = false;
			$("#ANDI508-testPage *").filter(":visible").each(function(){
				//check position property
				position = $(this).css("position");
				if(position === "absolute" ||
					position === "fixed" ||
					position === "relative" ||
					position === "sticky")
				{
					if($(this).css("top") !== "auto" ||
						$(this).css("left") !== "auto" ||
						$(this).css("bottom") !== "auto" ||
						$(this).css("right") !== "auto")
					{
						//isPageNonLinear = true;
						$(this).addClass("ANDI508-linearized ANDI508-linearized-position");
					}
				}
				//check display property
				display = $(this).css("display");
				if(display === "flex"){
					//isPageNonLinear = true;
					$(this).addClass("ANDI508-linearized ANDI508-linearized-display");
				}
			});
			//TODO: do i need this?
			//if(!isPageNonLinear)
			//	$("#ANDI508-testPage .ANDI508-linearized").removeClass("ANDI508-linearized ANDI508-linearized-position ANDI508-linearized-display");
			
			//AndiSettings.linearizePageOn = true;
		}
		else{//linearize off
			andiSettings.setting_off($("#ANDI508-button-linearize"));
			$("#ANDI508-testPage .ANDI508-linearized").removeClass("ANDI508-linearized ANDI508-linearized-position ANDI508-linearized-display");
			//AndiSettings.linearizePageOn = false;
		}
		andiResetter.resizeHeights(true);
	};
	
	//These functions show/hide the settings list
	this.showSettingsList = function(){
		$("#ANDI508-settingsList").slideDown(AndiSettings.andiAnimationSpeed).find("a").first().focus();
		$("#ANDI508-button-settings").attr("aria-expanded","true").children("img").first().attr("src",icons_url+"settings-on.png");
	};
	this.hideSettingsList = function(){
		setTimeout(function(){
			$("#ANDI508-settingsList").slideUp(AndiSettings.andiAnimationSpeed);
			$("#ANDI508-button-settings").attr("aria-expanded","false").children("img").first().attr("src",icons_url+"settings-off.png");
		},5);
	};
	
	//This function builds the settings list
	function buildSettingsList(){
		var settingsList = "<div id='ANDI508-settingsList' role='application'>"+
			"<a rel='help' href='"+ help_url + "howtouse.html#AdvancedSettings' aria-label='Advanced Settings Help' target='_blank'>Advanced Settings:</a>"+
			"<button id='ANDI508-button-highlights' aria-checked='true' role='checkbox'><img src='"+icons_url+"checked-on.png' alt='' /> Element Highlights</button>"+
			"<button id='ANDI508-button-linearize' aria-checked='false' role='checkbox'><img src='"+icons_url+"checked-off.png' alt='' /> Linearize Page</button>"+
			"<button id='ANDI508-button-minimode' aria-checked='false' role='checkbox'><img src='"+icons_url+"checked-off.png' alt='' /> Minimode</button>"+
			"</div>";
		$("#ANDI508-button-settings").after(settingsList);
	}
	
	//This function adds the click logic to the settings buttons
	function addSettingsButtonLogic(){
		//Highlights Button
		$("#ANDI508-button-highlights").click(function(){
			if (!AndiSettings.elementHighlightsOn){
				//if(AndiSettings.linearizePageOn)
				//	$("#ANDI508-button-linearize").click(); //turn off linearize while this button is on
				
				//Show Highlights
				$("#ANDI508-testPage .ANDI508-element").addClass("ANDI508-highlight");
				andiSettings.setting_on($(this));
				AndiSettings.elementHighlightsOn = true;
			}else{
				//Hide Highlights
				$("#ANDI508-testPage .ANDI508-highlight").removeClass("ANDI508-highlight");
				andiSettings.setting_off($(this));
				AndiSettings.elementHighlightsOn = false;
			}
			andiResetter.resizeHeights(true);
			return false;
		});
		
		//Define the linearize
		$("#ANDI508-button-linearize").click(function(){
			if($(this).attr("aria-checked") === "false")
				andiSettings.linearize(true);
			else
				andiSettings.linearize(false);
			andiSettings.saveANDIsettings();
			return false;
		});
		
		//Mini Mode Button
		$("#ANDI508-button-minimode").click(function(){
			if($("#ANDI508-body").hasClass("ANDI508-minimode"))
				andiSettings.minimode(false);
			else
				andiSettings.minimode(true);
			andiSettings.saveANDIsettings();
			return false;
		});
	}
	
	function addSettingListNavigation(){
		$("#ANDI508-settingsList").keydown(function(e){
			switch(e.keyCode){
			case 40: //down
				if($("#ANDI508-settingsList").is(":focus"))
					$(this).children("button").first().focus();//focus on first button
				else
					$(":focus").next().focus();//focus on next button
				break;
			case 38: //up
				$(":focus").prev().focus();//focus on prev button
				break;
			case 27: //esc
				andiSettings.hideSettingsList();
				$("#ANDI508-button-settings").focus();
				break;
			}
		});
	}
	
	//These functions handle the on-off state of a settings toggle
	this.setting_on = function(button){
		$(button).attr("aria-checked","true").children("img").first().attr("src",icons_url+"checked-on.png");
	};
	this.setting_off = function(button){
		$(button).attr("aria-checked","false").children("img").first().attr("src",icons_url+"checked-off.png");
	};
}

//This function is used for shifting focus to an element
function AndiFocuser(){
	//Places focus on element at index.
	this.focusByIndex = function(index){
		andiFocuser.focusOn($("#ANDI508-testPage [data-ANDI508-index="+index+"]"));
	};
	//Creates click event handler on the element which will call focusByIndex
	this.addFocusClick = function(element){
		$(element).click(function(){
			var index = $(element).attr("data-ANDI508-relatedIndex");
			if(index) //Add focus on click
				andiFocuser.focusByIndex(index);
			else if(confirm("This alert does not refer to an inspectable element.\nPress OK to open ANDI Help for this alert in a new window.") === true)
				window.open($(element).attr("href"), $(element).attr("target"), 'width=1010,height=768,scrollbars=yes,resizable=yes').focus();
			return false;
		});
	};
	//This function will shift the focus to an element
	//even if the element is not tabbable
	this.focusOn = function(element){
		if(!$(element).attr("tabindex") && !$(element).is(":focusable")){
			//"Flash" the tabindex
			
			//img with usemap cannot be given focus (browser moves focus to the <area>)
			//so temporarily remove the usemap attr, reapply after focus
			var useMapVal;
			if($(element).is("img[usemap]")){
				useMapVal = $(element).attr("usemap")
				$(element).removeAttr("usemap");
			}
			
			$(element)
				.attr("tabindex","-1")
				.focus()
				.removeAttr("tabindex");
				
			if(useMapVal) //Add usemap back on
				$(element).attr("usemap",useMapVal);
		}
		else
			$(element).focus();
	};
}

//This function adds the capability to draw a line to visually connect the elements on the screen.
//It works by showing an svg #ANDI508-laser-container that contains a line tag.
//The coordinates of the line tag are updated to draw the line.
//NOTE: The svg has a high z-index to keep it on top of the test page, therefore, 
//it must be hidden at the right time so that the page can be interacted with.
function AndiLaser(){
	//Draws a laser. Pass in an object containing properties top and left, AKA the result of jQuery offset().
	this.drawLaser = function(fromHereCoords, toHereCoords, targetObject){
		if(browserSupports.svg){
			$("#ANDI508-laser").attr('x1',fromHereCoords.left).attr('y1',fromHereCoords.top)
							   .attr('x2',  toHereCoords.left).attr('y2',  toHereCoords.top);
			$("#ANDI508-laser-container").css("cssText","display:inline !important");
			$(targetObject).addClass("ANDI508-laserTarget");
		}
	};
	//Removes the lasers by hiding the laser container.
	//Should be called during mouseleave, or click functions that shift focus.
	this.eraseLaser = function(){
		if(browserSupports.svg){
			$("#ANDI508-testPage").find(".ANDI508-laserTarget").first().removeClass("ANDI508-laserTarget");
			$("#ANDI508-laser-container").css("cssText","display:none !important");
		}
		return false;
	};
	//Draws a laser for an alert link. It will be displayed when the shift key is held. Call it onmouseover
	this.drawAlertLaser = function(event){
		if(browserSupports.svg){
			if(event.shiftKey){ //check for holding shift key
				var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
				if(relatedIndex){
					var alertCoords = $(this).offset();
					var elementCoords = $("[data-ANDI508-index="+relatedIndex+"]").offset();
					andiLaser.drawLaser(alertCoords,elementCoords,$("[data-ANDI508-index="+relatedIndex+"]"));
				}
			}
			else
				andiLaser.eraseLaser();
		}
	};
	//This function attaches hover/mouseover and mouseleave events to the triggerObject
	//It will call drawLaser on hover and eraseLaser on mouseleave
	//NOTE: Do not use this function if the targetObject will change.
	this.createLaserTrigger = function(triggerObject, targetObject){
		if(browserSupports.svg){
			$(triggerObject).hover(function(){
				if($(targetObject) !== undefined)
					andiLaser.drawLaser($(triggerObject).offset(),$(targetObject).offset(),$(targetObject));
			});
			$(triggerObject).on("mouseleave",andiLaser.eraseLaser);
		}
	};
	//This function creates a laserAimer HTML object 
	//which will store the relatedLaserIndex of the object to point the laser at
	this.createLaserTarget = function(componentType, targetElement, referencedText){
		if(browserSupports.svg && referencedText !== ""){
			var relatedLaserIndex;
			if(!$(targetElement).hasClass("ANDI508-relatedLaserTarget")){
				//increment relatedLaserIndex and store onto targetElement
				relatedLaserIndex = testPageData.relatedLaserIndex++;
				$(targetElement).addClass("ANDI508-relatedLaserTarget").attr("data-ANDI508-relatedLaserIndex", relatedLaserIndex);
			}
			else{
				//get relatedLaserIndex from targetElement
				relatedLaserIndex = $(targetElement).attr("data-ANDI508-relatedLaserIndex");
			}
			return "<span class='ANDI508-laserAimer' data-ANDI508-relatedLaserIndex='"+relatedLaserIndex+"'>"+andiUtility.formatForHtml(referencedText)+"</span>";
		}
		else
			return referencedText;
	};
	
	//This function will createLaserTrigger for each data-ANDI508-relatedLaserIndex in the td cell of the accessibility components table
	//It is used for (aria-labelledby, label, aria-describedby)
	this.createReferencedComponentLaserTriggers = function(){
		if(browserSupports.svg){
			$("#ANDI508-accessibleComponentsTable td span.ANDI508-laserAimer").each(function(){
				andiLaser.createLaserTrigger($(this), $("#ANDI508-testPage .ANDI508-relatedLaserTarget[data-ANDI508-relatedLaserIndex="+$(this).attr("data-ANDI508-relatedLaserIndex")+"]").first());
			});
		}
	};
}

//This class is used to perform common utilities such as regular expressions and string alertations.
function AndiUtility(){
	//This ultility function takes a string and converts any < and > into &lt; and &gt; so that when the 
	//string is displayed on screen, the browser doesn't try to parse the string into html tags.
	this.formatForHtml = function(string){
		if(string !== undefined)
			return string.replace(/>/g, "&gt;").replace(/</g, "&lt;");
	};
	
	this.condenseWhitespace = function(string){
		if(string !== undefined)
			return string.replace(/\s\s/g, " ");
	};

	//This ultility function will parse the html tree of the element 
	//and return the innerText of the element and its children elements that are not hidden.
	//TODO: This function might be able to be improved
	this.getTextOfTree = function(element, dontIgnoreInvisible){
		if($(element).is("svg")){
			var svgInnerText = "";
			svgInnerText = $(element).find("title").text() + " " + $(element).find("desc").text();
			return $.trim(svgInnerText);
		}
		else{
			var clone = $(element).clone();

			if($(clone).html() !== undefined){
				//Element has children
				if(!dontIgnoreInvisible){
					$(clone).children().each(function(){
						if($(this).css("display") === "none" || $(this).attr("hidden") || $(this).attr("aria-hidden") === "true")
							$(this).remove(); //Remove any hidden children
					});
				}
				
				//Remove certain elements whose content should be ignored
				$(clone).find(".ANDI508-overlay,script,noscript,iframe,select,caption,svg,table").remove();
				
				//Remove legend if the element is a fieldset
				if($(element).is("fieldset"))
					$(clone).find("legend").remove();
				
				//Get all elements that have an aria-label and replace them with the text of the aria-label
				$(clone).find("[aria-label]:not(img):not(input[type=image])").each(function(){
					$(this).replaceWith($(this).attr("aria-label"));
				});
				
				//Get all input[type=text] and replace with the value
				$(clone).find("input").each(function(){
					if(this.type === "text" && $(this).attr("value"))
						$(this).replaceWith($(this).val());
				});
					
				var text = andiUtility.formatForHtml(andiUtility.condenseWhitespace($.trim($(clone).text())));
				if(text.length > AndiCheck.characterLimiter){
					text = text.substr(0,AndiCheck.characterLimiter-3) +
						"<span title='..."+text.substr(AndiCheck.characterLimiter-3,text.length)+"'>...</span>";
				}
				//TODO: add space after text of each child
				return text;
			}
			return "";
		}
	};
}

//==================//
// OVERLAYS (GLOBAL)//
//==================//

//This class handles overlay creation and removal
function AndiOverlay(){
	
	//This function will create an overlay html element
	this.createOverlay = function(purposeClass, innerText, title, tabindex){
		if(!tabindex)
			tabindex = 0;
		
		var overlay = document.createElement("span");
		
		if(title)
			$(overlay).attr("title",title);
		
		$(overlay)
			.attr("tabindex",tabindex)
			.addClass("ANDI508-overlay "+purposeClass)
			.attr("role","tooltip")
			.append(innerText);
		return overlay;
		//return "<span class='ANDI508-overlay "+purposeClass+"'"+titleText+" tabindex='"+tabindex+"' role='tooltip'>"+innerText+"</span>";
	};
	
	//This function will remove overlays with the class provided
	this.removeOverlay = function(purposeClass){
		$("#ANDI508-testPage span."+purposeClass).remove();
	};
	
	//This function will remove all overlays from the test page
	this.removeAllOverlays = function(){
		$("#ANDI508-testPage span.ANDI508-overlay").remove();
	};
	
	//This function will overlay duplicate ids
	this.overlay_duplicateIds = function(){
		var btn = $("#ANDI508-alertButton-duplicateIdOverlay");
		if($(btn).attr("aria-pressed") === "false"){
			//Show Overlay Duplicate Ids
			$(btn).attr("aria-pressed","true").html("hide ids"+overlayIcon);
			andiOverlay.overlayButton_on("overlay",$(btn));
			var overlayClass, idMatchesFound, overlayTitle;
			$("#ANDI508-testPage [id]").each(function(){
				overlayClass = "ANDI508-overlay-duplicateId";
				overlayTitle = "";
				idMatchesFound = 0;
				//loop through allIds and compare
				for (x=0; x<testPageData.allIds.length; x++){
					if(this.id === testPageData.allIds[x].id){
						idMatchesFound++;
						if(idMatchesFound==2) break; //duplicate found so stop searching, for performance
					}
				}
				if(idMatchesFound > 1){ //Duplicate Found
					overlayClass += " ANDI508-overlay-alert";
					overlayTitle = "duplicate id";
				}
				andiOverlay.insertAssociatedOverlay(this, andiOverlay.createOverlay(overlayClass, "id="+this.id, overlayTitle, $(this).attr("tabindex")));
			});
		}
		else{
			//Hide Overlay Duplicate Ids
			$(btn).attr("aria-pressed","false").html("show ids"+overlayIcon);
			andiOverlay.overlayButton_off("overlay",$(btn));
			andiOverlay.removeOverlay("ANDI508-overlay-duplicateId");
		}
	};
	
	//This function will overlay disabled elements
	this.overlay_disabledElements = function(alsoAriaDisabled){
		var btn = $("#ANDI508-alertButton-disabledElementsOverlay");
		if($(btn).attr("aria-pressed") === "false"){
			//Show Overlay Duplicate Ids
			$(btn).attr("aria-pressed","true").html("hide disabled"+overlayIcon);
			andiOverlay.overlayButton_on("overlay",$(btn));
			var overlayClass = "ANDI508-overlay-disabledElement";
			//Find every disabled element
			$("#ANDI508-testPage [disabled]").each(function(){
				andiOverlay.insertAssociatedOverlay(this, andiOverlay.createOverlay(overlayClass, "disabled", "", $(this).attr("tabindex")));
			});
			if(alsoAriaDisabled){
				//Find every element with aria-disabled="true"
				$("#ANDI508-testPage [aria-disabled=true]").each(function(){
					andiOverlay.insertAssociatedOverlay(this, andiOverlay.createOverlay(overlayClass, "aria-disabled=\"true\"", "", $(this).attr("tabindex")));
				});
			}
		}
		else{
			//Hide Overlay Duplicate Ids
			$(btn).attr("aria-pressed","false").html("show disabled"+overlayIcon);
			andiOverlay.overlayButton_off("overlay",$(btn));
			andiOverlay.removeOverlay("ANDI508-overlay-disabledElement");
		}
	};
	
	//This function will insert an overlay onto the page
	//Set alwaysBefore to true to ensure the overlay won't be prepended, but will be placed before the element
	this.insertAssociatedOverlay = function(element, overlayObject, alwaysBefore){
		
		//Insert the overlay
		if($(element).is("option")){
			var closestSelect = $(element).closest("select");
			$(closestSelect).before(overlayObject);
			associateOverlay(overlayObject, $(closestSelect));
		}
		else if(!alwaysBefore && $(element).isContainerElement() && !$(element).is("select,textarea")){
			$(element).prepend(overlayObject);
			associateOverlay(overlayObject, $(element));
		}
		else{
			$(element).before(overlayObject);
			associateOverlay(overlayObject, $(element));
		}
		
		//Attach association highlighting events.
		function associateOverlay(overlayObject, associatedElement){
			$(overlayObject)
				.on("mouseover",function(){
					$(associatedElement).addClass("ANDI508-overlay-associated");
				}).on("focus",function(){
					$(associatedElement).addClass("ANDI508-overlay-associated");
				}).on("mouseleave",function(){
					$(associatedElement).removeClass("ANDI508-overlay-associated");
				}).on("focusout",function(){
					$(associatedElement).removeClass("ANDI508-overlay-associated");
				});
		}
	};
	
	//This function will overlay the title attributes.
	this.overlayTitleAttributes = function(){
		var title = "";
		$("#ANDI508-testPage *").filter(":visible").not(".ANDI508-overlay").each(function(){
			title = $.trim($(this).attr("title"));
			if(title)
				andiOverlay.insertAssociatedOverlay(this, andiOverlay.createOverlay("ANDI508-overlay-titleAttributes", "title=" + title));
			title = ""; //reset
		});
	};
	
	//These functions handle the on-off state of a find/highlight button
	this.overlayButton_on = function(icon, button){
		$(button)
			.attr("aria-pressed","true")
			.addClass("ANDI508-module-action-active")
			.find("img").attr("src", icons_url+icon+".png");
	};
	this.overlayButton_off = function(icon, button){
		$(button)
			.attr("aria-pressed","false")
			.removeClass("ANDI508-module-action-active")
			.find("img").attr("src", icons_url+icon+"-off.png");
	};
}

//==================//
// ELEMENT ANALYSIS //
//==================//

//This object grabs the accessible components and attaches the components and alerts to the element
//Should be re-instantiated for each element to be inspected
//If a child is passed in, it will grab the accessibility components from the child instead.
function AndiData(element){
			
	//**aria-label**
	//This function attempts to grab the aria-label if it exists
	this.grab_ariaLabel = function(element){
		//Does the element contain an aria-label attribute? 
		var ariaLabelText = $(element).attr("aria-label");
		if(ariaLabelText !== undefined){
			this.accessibleComponentsTotal++;
			if($.trim(ariaLabelText) === ""){
				ariaLabelText = andiCheck.addToEmptyComponentList("aria-label");
			}
			else{//not empty
				this.namerFound = true;
				andiCheck.improperCombination("[aria-label]","ariaLabelledby",this);
				//Check length
				if(andiCheck.checkCharacterLimit(ariaLabelText,alert_0153))
					ariaLabelText = andiCheck.insertCharacterLimitMark(ariaLabelText);
				else
					ariaLabelText = andiUtility.formatForHtml(ariaLabelText);
			}
		}
		return ariaLabelText;
	};
		
	//**aria-labelledby**
	//This function attempts to grab the aria-labelledby if it exists
	this.grab_ariaLabelledby = function(element){
		//Does the element contain an aria-labelledby attribute? 
		var ariaLabelledbyText = $(element).attr("aria-labelledby");
		if(ariaLabelledbyText !== undefined){
			this.accessibleComponentsTotal++;
			if($.trim(ariaLabelledbyText) === ""){
				ariaLabelledbyText = andiCheck.addToEmptyComponentList("aria-labelledby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-labelledby
				ariaLabelledbyText = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-labelledby");

				if(ariaLabelledbyText === ""){
					//ALL of the aria-labelledby references do not return any text
					andiAlerter.throwAlert(alert_0061);
					ariaLabelledbyText = AndiCheck.emptyString;
				}
				else
					this.namerFound = true;
			}
		}
		return ariaLabelledbyText;
	};
	
	//**label**
	//This function attempts to grab the label by calling grab_labelNested and grab_labelFor.
	//For performance increase, check page_using_label before calling this method.
	//NOTE: label nested will take precedence over label/for
	this.grab_label = function(element){
		var labelText = undefined;
		var labelElement = undefined;
		var andiElementIndex = this.andiElementIndex;
		if(testPageData.page_using_label && !$(element).is("label")){
			//Page is using labels and this element is not a label
			
			//Is this an element that should pay attention to nested labels?
			if($(element).not(":submit,:button,:reset,:image").is("input") || 
				$(element).is("select,textarea,[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio],[contenteditable=true]"))
			{
				labelText = grab_labelNested(element);
			}
			else{
				this.ignoreLabel = true; //ignore the label for ANDI output
			}
			
			if(labelText === undefined){
				labelText = grab_labelFor(element);
			}

			if(labelText !== undefined){
				if(labelText === ""){
					labelText = andiCheck.addToEmptyComponentList("label");
				}
				else if(!this.ignoreLabel){
					this.namerFound = true;
					labelText = andiLaser.createLaserTarget("label", labelElement, labelText);
				}
				this.accessibleComponentsTotal++;
			}
		}
		return labelText;
		
		//**label nested**
		//This function attempts to grab the nested label if it exists
		//Returns true or false if found
		//Will only grab it for certain element types for performance reasons
		function grab_labelNested(element){
			//Is the element nested inside a label?
			var closestLabel = $(element).closest("label");
			if(closestLabel.length){
				//Yes, the element is nested inside a label
				labelElement = closestLabel;
				var labelObject = $(closestLabel).clone(); //make a copy
				var labelText = andiUtility.getTextOfTree($(labelObject));
				return labelText;
			}
			return undefined;
		}
		
		//**label for**
		//This function attempts to grab the label with a 'for' whose value matches the value of the element's id
		//returns true or false if found
		function grab_labelFor(element){
			var labelText = undefined;
			//Does it contain an id, and therefore, possibly an associated label with 'for' attribute value that matches value of this elemtent's id?
			if(element[0].id !== ""){

				//Loop through the labels that have 'for' attributes and search for a match with this id
				var labelFor = undefined;
				for(var x=0; x<testPageData.allFors.length; x++){
					if($(testPageData.allFors[x]).attr("for") == element[0].id){
						labelFor = $(testPageData.allFors[x]);
						break;
					}
				}

				if(labelFor){
					//Yes, a label with matching 'for' was found
					labelElement = labelFor;
					labelText = $.trim($(labelFor).text());
					//Is it okay for this element to have a label?
					if($(element).is(":submit,:button,:reset,[role=button]")){
						//No, label not valid on a button
						andiAlerter.throwAlert(alert_0092);
					}
					else if(!($(element).not(":submit,:button,:reset,:image").is("input")) && 
						!$(element).is("select,textarea,[role=textbox],[role=combobox],[role=listbox],[role=checkbox],[role=radio],[contenteditable=true]"))
					{
						//No, label not valid on anything that isn't a form element, excluding buttons
						andiAlerter.throwAlert(alert_0091);
					}
					else{
						//Check if this is referencing an element with a duplicate id
						andiCheck.areThereAnyDuplicateIds("label[for]", element[0].id);
					}
				}
			}
			return labelText;
		}
	};
	
	//**alt**
	//This function attempts to grab the alt if it exists (for all elements, not just images so that it can throw alerts)
	this.grab_alt = function(element){
		var alt;
		//Does it contain an alt?
		if($(element).is("svg")){
			alt = $(element).find("image").first().attr("alt");
		}
		else{
			alt = $(element).attr("alt");
		}
		if(alt !== undefined){
			this.accessibleComponentsTotal++;
			
			//if(alt === ""){//do not trim so that alt=" " doesn't throw alert
			if($.trim(alt) === ""){
				if(!$(this).is("img"))
					alt = andiCheck.addToEmptyComponentList("alt");
			}
			
			if(!$(element).is("img,input:image,area,svg,image")){
				//alt should not be used on this element
				this.ignoreAlt = true;
				andiAlerter.throwAlert(alert_0081);
			}
			else{//element is an image
				if(alt !== AndiCheck.emptyString){
					this.namerFound = true;
					andiCheck.improperCombination("[alt]","ariaLabelledby ariaLabel",this);
					//Check length
					if(andiCheck.checkCharacterLimit(alt,alert_0152))
						alt = andiCheck.insertCharacterLimitMark(alt);
					else
						alt = andiUtility.formatForHtml(alt);
				}
			}
		}
		return alt;
	};
	
	//**value**
	//This function attempts to grab the value of an input button/submit/reset if it is not empty
	this.grab_value = function(element){
		var valueText;
		if($(element).is("input:submit,input:button,input:reset,input:image")){
			valueText = $(element).val();
			if(valueText === ""){
				this.accessibleComponentsTotal++;
				valueText = andiCheck.addToEmptyComponentList("value");
			}
			else if(valueText !== undefined){
				this.namerFound = true;
				this.accessibleComponentsTotal++;
				valueText = andiUtility.formatForHtml(valueText);
			}
		}
		return valueText;
	};

	//**innerText**
	//This function attempts to grab the innerText of the element if it is not empty
	//NOTE: &nbsp; is considered empty (browser is handling this automatically)
	this.grab_innerText = function(element){
		var innerTextVisible = "";
		if(!$(element).is(":empty,select,textarea")){
			innerTextVisible = andiUtility.getTextOfTree(element);
			if(innerTextVisible !== ""){
				this.namerFound = true;
				this.accessibleComponentsTotal++;
			}
			//If button or link
			if($(element).is("button,a,li")){//TODO: eventually remove this check
				this.subtree = this.grab_subtreeComponents(element);
			}
		}
		return innerTextVisible;
	};
		
	//**aria-describedby**
	//This function attempts to grab the aria-describedby if it exists
	//Should be called after the namers in order to throw alert_0021
	this.grab_ariaDescribedby = function(element){
		//Does the element also contain an aria-describedby attribute?
		var ariaDescribedbyText = $(element).attr("aria-describedby");
		if(ariaDescribedbyText !== undefined){
			this.accessibleComponentsTotal++;
			if($.trim(ariaDescribedbyText) === ""){
				ariaDescribedbyText = andiCheck.addToEmptyComponentList("aria-describedby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-describedby
				ariaDescribedbyText = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-describedby");
				if(ariaDescribedbyText === ""){
					//ALL of the aria-describedby references do not return any text
					andiAlerter.throwAlert(alert_0062);
					ariaDescribedbyText=AndiCheck.emptyString;
				}
				else
					this.describerFound = true;
			}
			andiCheck.improperCombination("[aria-describedby]","title",this);
			if(!this.namerFound && (!this.title || this.title==AndiCheck.emptyString)){
				//don't use aria-describedby by itself
				andiAlerter.throwAlert(alert_0021);
			}
		}
		return ariaDescribedbyText;
	};

	//**title**
	//This function attempts to grab the title if it exists
	this.grab_title = function(element){
		//Does it contain a title?
		var titleText = $(element).attr("title");
		if(titleText !== undefined){
			TestPageData.page_using_titleAttr = true;
			this.accessibleComponentsTotal++;
			if($.trim(titleText) === ""){
				titleText = andiCheck.addToEmptyComponentList("title");
			}
			else{//not empty
				if(!this.namerFound)
					this.namerFound = true;//title is a namer
				else
					this.describerFound = true;//title is a describer
				//Check length
				if(andiCheck.checkCharacterLimit(titleText,alert_0151))
					titleText = andiCheck.insertCharacterLimitMark(titleText);
				else
					titleText = andiUtility.formatForHtml(titleText);
			}
		}
		return titleText;
	};
	
	//**legend/fieldset**
	//This function attempts to grab the legend if it exists and element is or is within a fieldset.
	//For performance increase, check page_using_legend before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	this.grab_legend = function(element){
		var legendText;
		if(testPageData.page_using_fieldset && !$(element).is("legend")){
			//Page is using fieldset and element is not a legend
			var fieldset;
			if($(element).is("fieldset"))
				fieldset = $(element); //element is a fieldset.
			else{ //Does the element have an ancestor fieldset?
				fieldset = $(element).closest("fieldset"); //element is contained in a fieldset.
			}
			if(fieldset.length){
				var legend = $(fieldset).find("legend").first();
				if($(legend).length){
					legendText = andiUtility.getTextOfTree($(legend));
					this.accessibleComponentsTotal++;
					legendText = andiLaser.createLaserTarget("legend", legend, legendText);
					if(($(element).not(":submit,:button,:reset,:image").is("input")) || $(element).is("select,textarea,fieldset")){
						//Check for improper legend combinations
						andiCheck.improperCombination("&lt;legend&gt;","ariaLabel ariaLabelledby title ariaDescribedby",this);
						//Check if legend is the only component - all namer grabs should have already happened
						if(!this.namerFound && !$(element).is("fieldset"))
							andiAlerter.throwAlert(alert_0022);
						//Check if legend is empty
						if(legendText === "")
							legendText = andiCheck.addToEmptyComponentList("legend");
						else if($(element).is("fieldset"))
							this.namerFound = true;//legend is a namer for a fieldset
					}
					else
						//This is not an element that legend can be placed on, ignore it.
						this.ignoreLegend = true;
					legendText = legendText;
				}
			}
		}
		return legendText;
	};
	
	//**figcaption/figure**
	//This function attempts to grab the figcaption if it exists and element is or is within a figure.
	//For performance increase, check page_using_figure before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	this.grab_figcaption = function(element){
		var figcaptionText;
		if(testPageData.page_using_figure && !$(element).is("figcaption")){
			//Page is using figure and element is not figcaption
			var figure;
			if($(element).is("figure"))
				figure = $(element); //element is a figure.
			else{ //Does the element have an ancestor figure?
				this.ignoreFigcaption = true;//only concerned with figcaption on figure, but still display in table
				figure = $(element).closest("figure"); //element is contained in a figure.
			}
			if(figure.length){
				var figcaption = $(figure).children("figcaption").first();
				if($(figcaption).length){
					figcaptionText = andiUtility.getTextOfTree($(figcaption));
					this.accessibleComponentsTotal++;
					legendText = andiLaser.createLaserTarget("figcaption", figcaption, figcaptionText);
					if(!this.ignoreFigcaption){
						//Check for improper figcaption combinations
						andiCheck.improperCombination("&lt;ficaption&gt;","ariaLabel ariaLabelledby",this);
						//Check if figcaption is empty
						if(figcaptionText === ""){
							figcaptionText = andiCheck.addToEmptyComponentList("figcaption");
						}
						else//not empty
							this.namerFound = true;
					}
					figcaptionText = figcaptionText;
				}
			}
		}
		return figcaptionText;
	};
	
	//**caption/table**
	//This function attempts to grab the caption if it exists and element is or is within a table.
	//For performance increase, check page_using_table before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	this.grab_caption = function(element){
		var captionText;
		if(TestPageData.page_using_table && TestPageData.page_using_caption && !$(element).is("caption")){
			//Page is using figure and element is not caption
			var table;
			if($(element).is("table"))
				table = $(element); //element is a table.
			else{ //Does the element have an ancestor table?
				this.ignoreCaption = true;//only concerned with caption on table, but still display in components table
				table = $(element).closest("table"); //element is contained in a table.
			}
			if(table.length){
				//Get the first caption
				var caption = $(table).children("caption").first();
				if($(caption).length){
					captionText = andiUtility.getTextOfTree($(caption));
					this.accessibleComponentsTotal++;
					legendText = andiLaser.createLaserTarget("caption", caption, captionText);
					if(!this.ignoreCaption){
						//Check for improper caption combinations
						andiCheck.improperCombination("&lt;caption&gt;","ariaLabel ariaLabelledby",this);
						//check if caption is empty
						if(captionText === ""){
							captionText = andiCheck.addToEmptyComponentList("caption");
						}
						else//not empty
							this.namerFound = true;
					}
					captionText = captionText;
				}
			}
		}
		return captionText;
	};
	
	//**summary**
	//This function attempts to grab the summary attribute if the element is a table
	this.grab_summary = function(element){
		var summaryText;
		if(TestPageData.page_using_table && $(element).is("table")){
			//Page is using figure and element is not caption
			summaryText = $(element).attr("summary");
			if(summaryText !== undefined){
				this.accessibleComponentsTotal++;
				this.describerFound = true;//summary is a describer
				summaryText = andiUtility.formatForHtml(summaryText);
			}
		}
		return summaryText;
	}
	
	//**placeholder**
	//This function attempts to grab the value of an input button/submit/reset if it is not empty
	this.grab_placeholder = function(element){
		var placeholderText;
		if($(element).is("input,textarea")){
			placeholderText = $(element).attr("placeholder");
			if(placeholderText !== undefined){
				this.accessibleComponentsTotal++;
				placeholderText = andiUtility.formatForHtml(placeholderText);
			}
		}
		return placeholderText;
	};
	
	//**scope**
	//This function attempts to grab the scope of a th
	//It will add it to the addOnPropertiesObject object
	this.grab_scope = function(element){
		var scope = $.trim($(element).attr("scope"));
		if(scope !== undefined){
			if($(element).is("th")){
				if(scope!="row" && scope!="col" && scope!="rowgroup" && scope!="colgroup" && scope!="auto")
					andiAlerter.throwAlert(alert_0044, [scope]);
			}
			this.accessibleComponentsTotal++;
		}
		this.scope = scope;
	};

	//**headers**
	//This function attempts to grab the text of the headers references in a table cell
	this.grab_headers = function(element){
		var headers = $.trim($(element).attr("headers"));
		var headersText = "";
		if(headers !== undefined){
			if(!$(element).is("th") && !$(element).is("td"))
				andiAlerter.throwAlert(alert_0045);
			else{
				headersText = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"headers");
				
				if(headersText === ""){
					//ALL of the headers references do not return any text
					andiAlerter.throwAlert(alert_0068);
					headersText = AndiCheck.emptyString;
				}
			}
			this.accessibleComponentsTotal++;
		}
		//stores the actual vaule of the headers, not the parsed (grabbed) headersText
		this.headers = headers;
	};
	
	//**imageSrc**
	//This function attempts to grab the image source from img, input:image, and area
	this.grab_imageSrc = function(element){
		var imageSrc;
		if($(element).is("img,input:image,area")){
			if($(element).is("area")){
				var map = $(element).closest("map");
				if(map)
					imageSrc = $("#ANDI508-testPage img[usemap=\\#" + $(map).attr("name") + "]").first().attr("src");
			}
			else
				//img or input:image
				imageSrc = $(element).attr("src");
		}
		else if($(element).is("svg")){
			imageSrc = ($(element).find("image").first().attr("src"));
		}
		
		if(imageSrc){
			this.accessibleComponentsTotal++;
			if(imageSrc === ""){
				imageSrc = andiCheck.addToEmptyComponentList("imageSrc");
			}
			else{
				imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
			}
		}
		
		return imageSrc;
	};
	
	//**tabindex**
	//This function attempts to grab the tabindex if it exists
	//It will add it to the addOnPropertiesObject object
	this.grab_tabindex = function(element){
		var tabindex = $.trim($(element).attr("tabindex"));
		if(tabindex){
			//Put tabindex in table
			addOnPropertiesObject = $.extend(addOnPropertiesObject,{tabindex:tabindex});
			
			if(tabindex < 0){
				this.isTabbable = false;
				if(!$(element).is("iframe") && $(element).closest(":tabbable").html() === undefined){
					//element and ancestors are not tabbable
					if(this.namerFound)
						andiAlerter.throwAlert(alert_0121);
					else
						andiAlerter.throwAlert(alert_0122);
				}
			}
			else if(isNaN(tabindex)){
				//tabindex is not a number
				andiAlerter.throwAlert(alert_0077, [tabindex]);
				if(!$(element).is("a[href],button,input,select,textarea,object,iframe,area,[contenteditable=true]"))
					this.isTabbable = false;
			}
			//else element is tabbable
		}
		else if(!$(element).is("a[href],button,input,select,textarea,object,iframe,area,[contenteditable=true]")){
			this.isTabbable = false;
		}
	};
	
	//**accesskey**
	//This function will grab the accesskey and add it to the addOnPropertiesObject object
	this.grab_accessKey = function(element){
		var accesskey = $(element).prop("accessKey");
		if(accesskey){
			if(accesskey !== " ") //accesskey is not the space character
				accesskey = $.trim(accesskey.toUpperCase());
			addOnPropertiesObject = $.extend(addOnPropertiesObject,{accesskey:accesskey});
			addOnPropOutputText += "{"+accesskey+"}, ";
		}
	};

	//**add-On Properties**
	//This function will grab add-on properties of the element
	//Returns Nothing. Concatenates the output text in case it needs to be called for multiple elements
	this.grab_addOnProperties = function(element){
		addOnPropOutputText = "";//reset
		
		addOnPropertiesObject = {};
		
		//These AddOnProperties add to the Output
		grab_otherAddOnProperties(element);
		this.grab_accessKey(element);
		
		//These AddOnProperties do not add to the Output
		this.grab_tabindex(element);

		//If add on props were found, prepare addOnPropOutputText
		if(!$.isEmptyObject(addOnPropertiesObject)){
			this.addOnPropertiesTotal = Object.keys(addOnPropertiesObject).length;
			if(addOnPropOutputText !== ""){
				//Slice off last two characters the comma and the space: ", "
				this.addOnPropOutput += addOnPropOutputText.slice(0, -2); //Concatenates
			}
			this.accessibleComponentsTotal = this.accessibleComponentsTotal + this.addOnPropertiesTotal;
			this.addOnProperties = addOnPropertiesObject;
		}
		
		//**other add-On Properties**
		//This function will grab other add-on properties of the element:
		function grab_otherAddOnProperties(element){
			if($(element).is("input,textarea,select,[role=radio],[role=checkbox],[role=textbox]") && !$(element).is(":submit,:button,:reset")){
				var readonlyInOutput = false; //makes sure readonly isn't added to output twice
				if($(element).attr('aria-readonly')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaReadonly:$(element).attr('aria-readonly')});
					if($(element).attr('aria-readonly')==='true'){
						addOnPropOutputText += 'readonly' + ", ";
						readonlyInOutput = true;
					}
				}
				if($(element).prop('readonly')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{readonly:'readonly'});
					if(!readonlyInOutput && !$(element).is("[type=radio],[type=checkbox]")){
						//readonly does not work with radio buttons and checkboxes, and does not get spoken by screen readers
						addOnPropOutputText += 'readonly' + ", ";
					}
				}
				if($(element).attr('required')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{required:'required'});
					addOnPropOutputText += 'required' + ", ";
				}
				else if($(element).attr('aria-required')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaRequired:$(element).attr('aria-required')});
					if($(element).attr('aria-required')==='true')
						addOnPropOutputText += 'required' + ", ";
				}
				if($(element).attr('aria-invalid')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaInvalid:$(element).attr('aria-invalid')});
					if($(element).attr('aria-invalid')==='true')
						addOnPropOutputText += 'invalid entry' + ", ";
				}
				if($(element).attr('aria-multiline')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaMultiline:$(element).attr('aria-multiline')});
				}
			}
			else if($(element).is("th") && $(element).attr('aria-sort')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaSort:$(element).attr('aria-sort')});
					//if the th contains a link, the aria-sort will have already been added
					if($(element).attr('aria-sort') != 'none' && !$(element).find('a').length)
						addOnPropOutputText += $(element).attr('aria-sort') + ", ";
			}
			else if($(element).is("a") && TestPageData.page_using_table){
				var th = $(element).parent();
				if($(th).is("th") && $(th).attr('aria-sort')){
					//this link's parent is a th and the th has aria-sort
					//Note: using .parent() instead of .closest() to help with performance
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaSort:$(th).attr('aria-sort')});
					if($(th).attr('aria-sort') != 'none')
						addOnPropOutputText += $(th).attr('aria-sort') + ", ";
				}
			}
			
			if($(element).is("input,textarea,select,button,[role=radio],[role=checkbox],[role=button],[role=textbox]")){
				if($(element).attr('aria-checked')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaChecked:$(element).attr('aria-checked')});
					if($(element).is("[role=radio],[role=checkbox]")){
						if($(element).attr('aria-checked')==='true')
							addOnPropOutputText += 'checked' + ", ";
						else if($(element).attr('aria-checked')==='mixed')
							addOnPropOutputText += 'mixed' + ", ";
					}
				}
				if($(element).attr('aria-pressed')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaPressed:$(element).attr('aria-pressed')});
					if($(element).attr('aria-pressed')==='true')
						addOnPropOutputText += 'pressed' + ", ";
				}
				
				if($(element).is("input[type=checkbox],input[type=radio]")){
					if($(element).prop("checked")){
						addOnPropertiesObject = $.extend(addOnPropertiesObject,{checked:"checked"});
						addOnPropOutputText += "checked" + ", ";
					}
				}
			}

			if($(element).isSemantically("[role=heading]","h1,h2,h3,h4,h5,h6")){
				var headingLevel = "2"; //default to 2 (defined in spec)
				if($(element).is("[role=heading]")){
					var ariaLevel = $(element).attr("aria-level");
					if(parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel)
						headingLevel = ariaLevel;
				}
				else{//native heading tag
					headingLevel = $(element).prop("tagName").charAt(1);
				}
				addOnPropOutputText += "heading level " + headingLevel + ", ";
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{headingLevel:headingLevel});
			}
			
			//Global ARIA
			if($(element).attr('aria-disabled')){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaDisabled:$(element).attr('aria-disabled')});
				if($(element).attr('aria-disabled')==='true')
					addOnPropOutputText += 'unavailable' + ", ";
			}
			if($(element).attr('aria-haspopup')){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaHaspopup:$(element).attr('aria-haspopup')});
				if($(element).attr('aria-haspopup')==='true')
					addOnPropOutputText += 'hasPopUp' + ", ";
			}
			if($(element).attr('aria-expanded')){
				var value = $(element).attr('aria-expanded');
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaExpanded:value});
				if(value=="true")
					addOnPropOutputText += "expanded" + ", ";
				else if(value=="false")
					addOnPropOutputText += "collapsed" + ", ";
			}
			if($(element).attr('aria-controls')){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaControls:"["+$(element).attr("aria-controls")+"]"});
				addOnPropOutputText += "controls[" + $(element).attr('aria-controls') + "], ";
			}
			if($(element).attr("aria-hidden")){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaHidden:$(element).attr("aria-hidden")});
			}
			if($(element).attr("contenteditable") === "true" || $(element).attr("contenteditable") === ""){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{contenteditable:"true"});
			}
		}
	};
	
	//This function will grab the tagName of the element
	//If the element is an input, it will add the type in brackets
	this.grab_tagName = function(element){
		var tagNameText = $(element).prop("tagName").toLowerCase();
		if(tagNameText=="input")
			tagNameText += "["+$(element).prop("type").toLowerCase()+"]"; //add the type within brackets
		return tagNameText;
	};
	
	//This function will grab the role of the element
	//TODO: check for valid roles here
	this.grab_role = function(element){
		return $.trim($(element).attr("role")).toLowerCase();
	};
	
	//this function will grab accessibility components from ancestors
	this.grab_supertreeComponents = function(element){
		var anscestor;
		var supertreeHtml = ""; //This is used to display in the AC table and the ANDI Output
		var anscestorRole; //This will be displayed in the AC table
		
		if($(element).is("[role=radio],input[type=radio]")){
			anscestor = $(element).closest("[role=radiogroup],[role=group]");
			if(anscestor)
				anscestorRole = "role=" + $(anscestor).attr("role");
		}
		else if(TestPageData.page_using_role_group){
			if($(element).is("input,select,textarea,button,[role=button],[role=checkbox],[role=link],[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=option],[role=radio],[role=slider],[role=textbox]")){ //is an interactive element
				//Check parent for role=group
				if($(element).parent().is("[role=group]")){
					anscestor = $(element).parent();
					anscestorRole = "role=group";
				}
			}
		}
		
		if(anscestor){
			var tempText = "";
			var excludeFromOutput = false;
			var supertreeHasNamer = false;

			//try to get namers from supertree
			tempText = this.grab_ariaLabelledby(anscestor);
			if(tempText && tempText!=AndiCheck.emptyString){
				supertreeHtml += addSupertreeComponent(tempText,"aria-labelledby",anscestorRole);
				supertreeHasNamer = true;
			}
			
			tempText = this.grab_ariaLabel(anscestor);
			if(tempText && tempText!=AndiCheck.emptyString){
				if(supertreeHasNamer){
					excludeFromOutput = true;
					//TODO: ancestor has unused text
					//childHasUnusedText += "aria-label ";
				}
				supertreeHtml += addSupertreeComponent(tempText,"aria-label",anscestorRole,excludeFromOutput);
				supertreeHasNamer = true;
			}
			
			tempText = this.grab_title(anscestor);
			if(tempText && tempText!=AndiCheck.emptyString){
				if(supertreeHasNamer){
					excludeFromOutput = true;
					//childHasUnusedText += "title ";
				}
				supertreeHtml += addSupertreeComponent(tempText,"title",anscestorRole,excludeFromOutput);
				supertreeHasNamer = true;
			}
			
			tempText = this.grab_ariaDescribedby(anscestor);
			if(tempText && tempText!=AndiCheck.emptyString){
				supertreeHtml += addSupertreeComponent(tempText,"aria-describedby",anscestorRole,false);
			}
		}
		
		//This function creates a subtree component element
		function addSupertreeComponent(supertreeComponentText,type,role,excludeFromOutput){
			var excludeFromOutputClass = "";
			if(excludeFromOutput)
				excludeFromOutputClass = " ANDI508-treeComponent-excludeFromOutput";
			return "<span class='ANDI508-display-"+type+excludeFromOutputClass+"'><span class='ANDI508-treeComponent'>" + "<span class='ANDI508-treeComponent-nodeName'>[" + role + "]</span> " + type + ":</span> " + supertreeComponentText + "</span> <br class='ANDI508-treeComponent-excludeFromOutput' />";
		}
		
		return supertreeHtml;
	};
	
	//**child/subtree components**
	//This function will grab the accessible components of a subtree
	//It will concatenate html namers on the subtree to html namers of the parent element
	//This function will return, in one string, namers from the subtree if it has any.
	//TODO: For now, this is only being called on img inside <a>, <button>, and <li>. Eventually it could become a fully recursive function
	this.grab_subtreeComponents = function(element){
		//Is there a decendant image?
		var subtreeText = ""; //This is only needed for accessible name pre-calculation (lANDI)
		var subtreeHtml = ""; //This is used to display in the AC table and the ANDI Output
		var subtreeTextArray = []; //This is used to check for matching text
		var img = $(element).clone().find("img:not([role=presentation],[role=none]),svg image").first();
		if($(img).attr("src")){
			//Yes.
			this.imageSrc = this.grab_imageSrc(img);
			
			var imageTagName = $(img).prop("tagName").toLowerCase();
			
			var tempText = "";
			var excludeFromOutput = false;
			var subtreeHasNamer = false;
			var childHasUnusedText = "";
			
			//try to get namers from subtree
			tempText = this.grab_ariaLabelledby(img);
			if(tempText && tempText != AndiCheck.emptyString){
				subtreeTextArray.push(tempText);
				subtreeHtml += addSubtreeComponent(tempText,"aria-labelledby",imageTagName,excludeFromOutput);
				subtreeHasNamer = true;
			}
			
			tempText = this.grab_ariaLabel(img);
			if(tempText && tempText != AndiCheck.emptyString){
				subtreeTextArray.push(tempText);
				if(subtreeHasNamer){
					excludeFromOutput = true;
					childHasUnusedText += "aria-label ";
				}
				subtreeHtml += addSubtreeComponent(tempText,"aria-label",imageTagName,excludeFromOutput);
				subtreeHasNamer = true;
			}
			
			tempText = this.grab_alt(img);
			if(tempText && tempText != AndiCheck.emptyString){
				subtreeTextArray.push(tempText);
				if(subtreeHasNamer){
					excludeFromOutput = true;
					childHasUnusedText += "alt ";
				}
				subtreeHtml += addSubtreeComponent(tempText,"alt",imageTagName,excludeFromOutput);
				subtreeHasNamer = true;
			}
			
			tempText = this.grab_title(img);
			if(tempText && tempText != AndiCheck.emptyString){
				subtreeTextArray.push(tempText);
				if(subtreeHasNamer){
					excludeFromOutput = true;
					if(tempText != $(element).attr("title") && subtreeTextDoesNotMatch(tempText))
						childHasUnusedText += "title ";
				}
				subtreeHtml += addSubtreeComponent(tempText,"title",imageTagName,excludeFromOutput);
				subtreeHasNamer = true;
			}

			if(subtreeHtml !== ""){
				//Loop through the subtreeTextArray, gather the text into subtreeText:
				for(var x=0; x<subtreeTextArray.length; x++){
					subtreeText += subtreeTextArray[x];
					if(x != subtreeTextArray.length-1)
						subtreeText += " ";
				}
				this.subtreeText = subtreeText;
				
				this.namerFound = true;
			}
			
			//Is there already an aria-label or aria-labelledby on the parent element?
			if(subtreeHtml !== "" && (this.ariaLabel || this.ariaLabelledby)){
				//The aria-label or aria-labelledby would override the child's text, therefore, information would be lost.
				andiAlerter.throwAlert(alert_0141,[" "]);
			}
			else if(childHasUnusedText){
				andiAlerter.throwAlert(alert_0141,[" ["+$.trim(childHasUnusedText)+"] "]);
			}
		}
		//This function creates a subtree component element
		function addSubtreeComponent(subtreeComponentText,type,tagName,excludeFromOutput){
			var excludeFromOutputClass = "";
			if(excludeFromOutput)
				excludeFromOutputClass = " ANDI508-treeComponent-excludeFromOutput";
			return "<span class='ANDI508-display-"+type+excludeFromOutputClass+"'><span class='ANDI508-treeComponent'>" + "<span class='ANDI508-treeComponent-nodeName'>&lt;" + tagName + "&gt;</span> " + type + ":</span> " + subtreeComponentText + "</span> <br class='ANDI508-treeComponent-excludeFromOutput' />";
		}
		
		//This function returns true if the text of a subtree component is different from the text of another subtree component.
		function subtreeTextDoesNotMatch(tempText){
			for(var x=0; x<subtreeTextArray.length; x++){
				if(tempText != subtreeTextArray[x])
					return true;
			}
			return false;
		}
		
		return subtreeHtml;
	};
	
	//This private function is used to grab the list of the associated html tags containing ids that match a 
	//space delimited accessibility attribute's id reference list such as aria-labelledby, aria-describedby, headers.
	//It will grab the associated element's innerText even if it is hidden (how the screen readers work)
	//Parameters:
	//	element: an html object/tag
	//	attribute: the name of the attribute. e.g. "aria-labelledby" "aria-describedby"
	//Returns:
	//	A space delimited string containing the accumulated text of the referenced elements
	function grabAssociatedTagsUsingSpaceDelimitedListAttribute(element, attribute){
		var ids = $.trim($(element).attr(attribute));//get the ids to search for
		var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
		var accumulatedText = "";//this variable is going to store what is found. And will be returned
		var message, splitMessage = "";
		var referencedElement, referencedElementText;
		//Traverse through the array
		for (var x=0;x<idsArray.length;x++){
			//Can the aria list id be found somewhere on the page?
			if(idsArray[x] !== ""){
				//Check if this is referencing an element with a duplicate id
				andiCheck.areThereAnyDuplicateIds(attribute, idsArray[x]);
				
				referencedElement = document.getElementById(idsArray[x]);
				referencedElementText = "";
				
				if($(referencedElement).attr("aria-label")){
					//Yes, this id was found and it has an aria-label
					referencedElementText += andiUtility.formatForHtml($(referencedElement).attr("aria-label"));
					//Aria-label found on reference element
					andiAlerter.throwAlert(alert_0064,[attribute]);
				}
				else if($(referencedElement).html() !== undefined){
					//Yes, this id was found
					
					if($(referencedElement).is("input") && $(referencedElement).prop("type") === "text" && $(referencedElement).attr("value") !== ""){
						//referencing an input
						referencedElementText += andiUtility.formatForHtml($(referencedElement).val());
					}
					else if($(referencedElement).is("img") && $(referencedElement).attr("alt") !== ""){
						//referencing an img
						referencedElementText += andiUtility.formatForHtml($(referencedElement).attr("alt"));
					}
					else{
						referencedElementText += andiUtility.formatForHtml(andiUtility.getTextOfTree(referencedElement, true));
					
						//headers
						if(attribute == "headers" && !$(referencedElement).is("th")){
							//referenced element is not a th
							if($(referencedElement).is("td"))
								andiAlerter.throwAlert(alert_0067, [idsArray[x]]);
							else
								andiAlerter.throwAlert(alert_0066, [idsArray[x]]);
						}
					}
				}
				else{
					//No, this id was not found, add to list.
					alert_0065.list += idsArray[x] + " "; //will be used if more than one idrefs missing
					alert_0063.list = idsArray[x]; //will be used if only one idref missing
				}
				
				if(referencedElementText !== "") //Add referenceId
					referencedElementText = andiLaser.createLaserTarget(attribute, referencedElement, referencedElementText);
				
				//Add to accumulatedText
				accumulatedText += referencedElementText + " ";
			}
		}
		//Check if any ids were not found
		if(alert_0065.list !== ""){
			var missingIdsList = $.trim(alert_0065.list).split(" ");
			if(missingIdsList.length > 1){//more than one id missing; Possible misuse
				andiAlerter.throwAlert(alert_0065, [attribute,  $.trim(alert_0065.list)]);
				alert_0063.list = ""; //reset the other list
			}
			else{//only one id missing
				andiAlerter.throwAlert(alert_0063, [attribute, alert_0063.list]);
				alert_0065.list = ""; //reset the other list
			}
		}
		return $.trim(accumulatedText);
	}
	
	//This function will calculate the output and store it to this.nameDescription
	//This function does not have to be called to get the output.
	//It is used when the output needs to be calculated and displayed before inspection.
	//TODO: incorporate matching test
	this.preCalculateNameDescription = function(){
		if(!this.isAriaHidden){
			var usingTitleAsNamer = false;
			//Legend
			if(!this.ignoreLegend && has(this.legend))
				this.nameDescription += this.legend + " ";
			//Accessible Name
			if(has(this.ariaLabelledby))
				this.nameDescription += this.ariaLabelledby + " ";
			else if(has(this.ariaLabel))
				this.nameDescription += this.ariaLabel + " ";
			else if(!this.ignoreLabel && has(this.label))
				this.nameDescription += this.label + " ";
			else if(!this.ignoreAlt && has(this.alt))
				this.nameDescription += this.alt + " ";
			else if(!this.ignoreFigcaption && has(this.figcaption))
				this.nameDescription += this.figcaption + " ";
			else if(!this.ignoreCaption && has(this.caption))
				this.nameDescription += this.caption + " ";
			else if(has(this.value))
				this.nameDescription += this.value + " ";
			else if(has(this.innerText) || has(this.subtreeText))
				this.nameDescription += this.innerText + " " + this.subtreeText + " ";
			else if(has(this.title)){
				usingTitleAsNamer = true;
				this.nameDescription += this.title + " ";
			}
			//Accessible Description
			if(has(this.ariaDescribedby))
				this.nameDescription += this.ariaDescribedby + " ";
			else if(!usingTitleAsNamer && has(this.title))
				this.nameDescription += this.title + " ";
			
			this.nameDescription = $.trim(this.nameDescription);
		}
		return this.nameDescription;
		
		//This function checks if text is not empty
		function has(componentText){
			if(componentText === undefined || componentText === "" || componentText == AndiCheck.emptyString)
				return false;
			else
				return true;
		}
	};
	
	//This function will call each component grab.
	//Parameters:
	//	elementIsChild:	when true, the child's innerText will not overwrite the parent's innerText
	this.grabComponents = function(element,elementIsChild){
		this.role = this.grab_role(element);
		
		//Grab accessible components - set 1:
		this.imageSrc = 		this.grab_imageSrc(element);
		this.placeholder = 		this.grab_placeholder(element);
		this.ariaLabelledby = 	this.grab_ariaLabelledby(element);
		this.ariaLabel = 		this.grab_ariaLabel(element);
		this.label = 			this.grab_label(element);
		//Grab accessible components - set 2: (dependent on set 1)
		this.alt = 				this.grab_alt(element);
		this.value = 			this.grab_value(element);
		if(!elementIsChild) //prevents overwrite
			this.innerText = 	this.grab_innerText(element);
		this.caption = 			this.grab_caption(element);
		this.figcaption = 		this.grab_figcaption(element);
		//Grab accessible components - set 3: (dependent on set 1,2)
		this.title = 			this.grab_title(element);
		this.ariaDescribedby = 	this.grab_ariaDescribedby(element);
		this.summary = 			this.grab_summary(element);
		this.legend = 			this.grab_legend(element);
		this.groupingText = 	this.grab_supertreeComponents(element);
		
		this.grab_addOnProperties(element);
		
		this.isAriaHidden = (this.addOnProperties.ariaHidden === "true") ? true: false;
		this.isPresentation = (this.role === "presentation" || this.role === "none") ? true: false;
	};

	//AndiData Constructor:
	
	this.nameDescription = "";
	
	andiAlerter.reset();
	
	testPageData.andiElementIndex++;
	this.andiElementIndex = testPageData.andiElementIndex;
	
	$(element)
		.addClass("ANDI508-element")
		.attr("data-ANDI508-index",this.andiElementIndex)
		.on("focus",AndiModule.andiElementFocusability)
		.on("mouseenter",AndiModule.andiElementHoverability);
		
	//Variables used to keep track of status of the element's accessibility
	this.accessibleComponentsTotal = 0;
	this.addOnPropertiesTotal = 0;
	this.namerFound = false;
	this.describerFound =  false;
	this.isTabbable = true;
	this.isAriaHidden = false;
	this.isPresentation = false;
	
	//Variables used to ignore certain components in the output calculation
	this.ignoreLabel = false;
	this.ignoreLegend = false;
	this.ignoreCaption = false;
	this.ignoreFigcaption = false;
	this.ignoreAlt = false;

	this.tagName = this.grab_tagName(element);
	this.role = "";
	
	this.subtree = "";
	this.subtreeText = "";
	this.imageSrc = "";
	this.placeholder = "";
	this.ariaLabelledby = "";
	this.ariaLabel = "";
	this.label = "";
	this.alt = "";
	this.value = "";
	this.innerText = "";
	this.caption = "";
	this.figcaption = "";
	this.title = "";
	this.ariaDescribedby = "";
	this.summary = "";
	this.legend = "";
	this.groupingText = "";
	
	//Object used for collecting addOnProperties. Will be inserted into andi_data
	this.addOnProperties = {};
	this.addOnPropOutput = "";
}
//Public Methods for AndiData
AndiData.prototype.attachDataToElement = function(element){
	//Store andi_data onto the html element
	$(element).data("ANDI508",{
		ariaLabelledby: this.ariaLabelledby,
		ariaLabel: 		this.ariaLabel,
		label: 			this.label,
		alt: 			this.alt,
		value: 			this.value,
		innerText: 		this.innerText,
		title: 			this.title,
		ariaDescribedby:this.ariaDescribedby,
		summary:		this.summary,
		caption: 		this.caption,
		figcaption: 	this.figcaption,
		legend: 		this.legend,
		subtree:		this.subtree,
		groupingText:	this.groupingText,
		
		placeholder:	this.placeholder,
		imageSrc:		this.imageSrc,
		tagName:		this.tagName,
		scope:			this.scope,
		headers:		this.headers,
		
		namerFound:		this.namerFound,
		describerFound:	this.describerFound,
		isTabbable:		this.isTabbable,
		isAriaHidden:	this.isAriaHidden,
		isPresentation:	this.isPresentation,
		
		ignoreLabel: 		this.ignoreLabel,
		ignoreLegend: 		this.ignoreLegend,
		ignoreCaption: 		this.ignoreCaption,
		ignoreFigcaption: 	this.ignoreFigcaption,
		ignoreAlt: 			this.ignoreAlt,
		
		addOnPropOutput:			this.addOnPropOutput,
		addOnProperties:			this.addOnProperties,
		addOnPropertiesTotal: 		this.addOnPropertiesTotal,
		
		accessibleComponentsTotal: 	this.accessibleComponentsTotal,

		dangers:	andiAlerter.dangers,
		warnings:	andiAlerter.warnings,
		cautions:	andiAlerter.cautions
	});
	
	//Attach danger class
	if(andiAlerter.dangers.length > 0){
		$(element).addClass("ANDI508-element-danger");
	}
	//Highlight this element
	if(AndiSettings.elementHighlightsOn){
		$(element).addClass("ANDI508-highlight");
	}
};

//This object sets up the check logic to determine if an alert should be thrown.
function AndiCheck(){
	//=====================//
	//==Mult-Point Checks==//
	//=====================//

	//This function is used to check for alerts related to focusable elements
	this.commonFocusableElementChecks = function(andiData, element){
		this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined();
		this.areAnyComponentsEmpty();
		this.areThereAnyMisspelledAria(element);
		this.areThereAnyDuplicateFors(element);
		this.areThereAnyTroublesomeJavascriptEvents(element);
		this.clickableAreaCheck(element,andiData);
		this.hasThisElementBeenHiddenFromScreenReader(element,andiData.isTabbable);
	};
	
	//This function is used to check for alerts related to non-focusable elements
	this.commonNonFocusableElementChecks = function(andiData, element, elementMustHaveName){
		if(elementMustHaveName)
			this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined();
		this.areAnyComponentsEmpty();
		this.areThereAnyMisspelledAria(element);
		this.hasThisElementBeenHiddenFromScreenReader(element);
	};
	
	//====================//
	//==Test Page Checks==//
	//====================//
	
	//This function will count the number of visible fieldset/figure/table tags and compare to the number of legend/figcaption/caption tags
	//If there are more parents than children, it will generate an alert with the message and the counts.
	//Note: The function does not test whether the children are actually contained within the parents, it's strictly concerned with the counts.
	//More children than parents might mean a parent is missing or the child tag isn't being used properly.
	//It will also set the booleans page_using_fieldset, page_using_figure to true if found, which will be used elsewhere for performance enhancements
	this.areThereMoreExclusiveChildrenThanParents = function(){
		var children, parents;
		
		//legend/fieldset
		parents = $(TestPageData.allVisibleElements).filter("fieldset").length*1; //*1 ensures that the var will be a number
		children = $(TestPageData.allVisibleElements).filter("legend").length*1; //*1 ensures that the var will be a number
		if(children > parents) andiAlerter.throwAlert(alert_0074,[children, parents],0);
		if(parents>0) testPageData.page_using_fieldset = true;

		//figcaption/figure
		parents = $(TestPageData.allVisibleElements).filter("figure").length*1; //*1 ensures that the var will be a number
		children = $(TestPageData.allVisibleElements).filter("figcaption").length*1; //*1 ensures that the var will be a number
		if(children > parents) andiAlerter.throwAlert(alert_0075,[children, parents],0);
		if(parents>0) testPageData.page_using_figure = true;

		//caption/table
		if(TestPageData.page_using_table){
			parents = $(TestPageData.allVisibleElements).filter("table").length*1; //*1 ensures that the var will be a number
			children = $(TestPageData.allVisibleElements).filter("caption").length*1; //*1 ensures that the var will be a number
			if(children)
				TestPageData.page_using_caption = true;
			if(children > parents) andiAlerter.throwAlert(alert_0076,[children, parents],0);
		}
	};
	
	//This function checks to see if there is only one page <title> tag within the head
	//If none, empty, or more than one, it will generate an alert.
	//It also looks at document.title
	this.isThereExactlyOnePageTitle = function(){
		var pageTitleCount = $("head title").length;
		if(document.title === ""){ //check document.title because could have been set by javascript 
			if(pageTitleCount === 0)
				andiAlerter.throwAlert(alert_0072,alert_0072.message,0);
			else if(pageTitleCount === 1 && $.trim($("head title").text()) === "")
				andiAlerter.throwAlert(alert_0071,alert_0071.message,0);
		}
		else if(pageTitleCount > 1)
			andiAlerter.throwAlert(alert_0073,alert_0073.message,0);
	};
	
	//==================//
	//==Element Checks==//
	//==================//
	
	//This function resets the accessibleComponentsTable
	//returns true if components were found that should appear in the accessibleComponentsTable
	//Parameters:
	//	elementData:			elementData object from data-ANDI508 property
	//	additionalComponents:	array of additional components that are unique to a module
	this.wereComponentsFound = function(elementData,additionalComponents){
		var accessibleComponentsTable = $("#ANDI508-accessibleComponentsTable");
		var total = elementData.accessibleComponentsTotal;

		//If a additionalComponents were provided by the module for this component
		if(additionalComponents){
			//Add them to the accessibleComponentsTotal for display purposes
			var additionalComponentsFound = 0;
			for(var x=0; x<additionalComponents.length; x++){
				if((additionalComponents[x] !== undefined) && ($.trim(additionalComponents[x]) !== ""))
					additionalComponentsFound++;
			}
			total += additionalComponentsFound;
		}
		//Display total
		$("#ANDI508-accessibleComponentsTotal").html(total);
		
		if(total === 0){//Not components. Display message in table
			var alertLevel = "danger"; //tabbable elements with no components, default to red
			if(!elementData.isTabbable)
				alertLevel = "caution"; //non-tabbable elements with no components, default to yellow
			$(accessibleComponentsTable).children("tbody").first().html(
				"<tr><th id='ANDI508-accessibleComponentsTable-noData' class='ANDI508-display-"+
				alertLevel+"'>No accessibility markup found for this Element.</th></tr>");
			return false;
		}
		else{//There are components, prepare/empty the table
			$(accessibleComponentsTable).children("tbody").children("tr").remove(); //Remove previous table contents
			return true;
		}
	};

	//This function will throw alert_0001 depending on the tagName passed
	this.wasAccessibleNameFound = function(elementData){
		var tagNameText = elementData.tagName;
		if(tagNameText === "iframe"){
			if(elementData.isTabbable){
				//Element is iframe in the tab order
				if(!elementData.namerFound && !elementData.describerFound){
					//Iframe in tab order has no name warning
					andiAlerter.throwAlert(alert_0007);
				}
				else{
					//iframe in tab order has name caution
					andiAlerter.throwAlert(alert_0124);
				}
			}
		}
		else if(!elementData.namerFound && !elementData.describerFound){
			var placeholderCheck = false;
			if(elementData.isTabbable && !elementData.subtree){
				var message;
				//Does this element have a role?
				if(elementData.role){
					var roleCapitalized = elementData.role.charAt(0).toUpperCase()+elementData.role.slice(1);
					message = roleCapitalized+" Element"+alert_0008.message;
				}
				//Is this an input element, excluding input[image]?
				else if(tagNameText.includes("input") && tagNameText != "input[image]"){
					switch(tagNameText){
					case "input[text]":
						message = "Text box"+alert_0001.message; placeholderCheck = true; break;
					case "input[radio]":
						message = "Radio Button"+alert_0001.message; break;
					case "input[checkbox]":
						message = "Checkbox"+alert_0001.message; break;
					default:
						message = "Input Element"+alert_0001.message;
					}
				}
				//All other elements:
				else switch(tagNameText){
					case "a":
						if(elementData.imageSrc)
							message = "Image Link"+alert_0003.message; //It's a link containing an image.
						else
							message = "Link"+alert_0002.message;
						break;
					case "img":
					case "input[image]":
						message = "Image"+alert_0003.message;
						break;
					case "button":
						message = "Button"+alert_0002.message; break;
					case "select":
						message = "Select"+alert_0001.message; break;
					case "textarea":
						message = "Textarea"+alert_0001.message; placeholderCheck = true; break;
					case "table":
						message = alert_0004.message; break;
					case "figure":
						message = alert_0005.message; break;
					case "th":
					case "td":
						message = "Table Cell"+alert_0002.message; break;
					case "input[search]":
					case "input[url]":
					case "input[tel]":
					case "input[email]":
					case "input[password]":
						placeholderCheck = true;
					default:
						message = "Element"+alert_0002.message;
				}
			}
			else{//not tabbable
				switch(tagNameText){
				case "img":
				case "input[image]":
					message = "Image"+alert_0003.message;
					break;
				}
			}
			
			if(message){
				//If element has placeholder and no accessible name, throw alert_0006
				if(elementData.placeholder && placeholderCheck)
					andiAlerter.throwAlert(alert_0006);
				else //Element has no accessible name and no placeholder
					andiAlerter.throwAlert(alert_0001,message);
			}
		}
	};

	//This function will search the test page for elements with duplicate ids.
	//If found, it will generate an alert
	//TODO: add this check when these components are detected: aria-activedescendant,aria-colcount,aria-colindex,aria-colspan,aria-controls,aria-details,aria-errormessage,aria-flowto,aria-owns,aria-posinset,aria-rowcount,aria-rowindex,aria-rowspan,aria-setsize
	this.areThereAnyDuplicateIds = function(component, id){
		//var id = $.trim($(element).prop("id"));
		if(id && testPageData.allIds.length>1){
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (x=0; x<testPageData.allIds.length; x++){
				if(id === testPageData.allIds[x].id){
					idMatchesFound++;
					if(idMatchesFound==2) break; //duplicate found so stop searching, for performance
				}
			}
			if(idMatchesFound > 1){//Duplicate Found
				var message = "";
				if(component === "label[for]") //label[for]
					message = "Element has duplicate id [id="+id+"] and is referenced by a &lt;label[for]&gt;";
				else //anything else
					message = "["+component+"] is referencing a duplicate id [id="+id+"]";
				andiAlerter.throwAlert(alert_0011, [message]);
			}
		}
	};

	//This function will search the html body for labels with duplicate 'for' attributes
	//If found, it will throw alert_0012 with a link pointing to the ANDI highlighted element with the matching id.
	this.areThereAnyDuplicateFors = function(element){
		if(testPageData.page_using_label){
			var id = $.trim($(element).prop("id"));
			if(id && testPageData.allFors.length > 1){
				var forMatchesFound = 0;
				for (x=0; x<testPageData.allFors.length; x++){
					if(id === $.trim($(testPageData.allFors[x]).attr("for"))){
						forMatchesFound++;
						if(forMatchesFound == 2) break; //duplicate found so stop searching, for performance
					}
				}
				if(forMatchesFound > 1) //Duplicate Found
					andiAlerter.throwAlert(alert_0012,[id,id]);
			}
		}
	};

	//This function will throw alert_0112 if commonly troublesome Javascript events are found on the element.
	this.areThereAnyTroublesomeJavascriptEvents = function(element){
		var events = "";
		if($(element).is("[onblur]"))
			events += "[onBlur] ";
		if($(element).is("[onchange]"))
			events += "[onChange] ";
		if($(element).is("[ondblclick]"))
			events += "[ondblclick] ";
		if(events !== "")
			andiAlerter.throwAlert(alert_0112,[$.trim(events)]);
	};
	
	//This function will check the clickable area of the element.
	this.clickableAreaCheck = function(element,andiData){
		var label = andiData.label;
		if($(element).is("input[type=checkbox],input[type=radio]") && !label){
			//the element is a radio button or checkbox and does not have an associated label
			var height = $(element).height();
			var width = $(element).width();
			var clickableAreaLimit = 21; //px
			
			if(height < clickableAreaLimit && width < clickableAreaLimit){
				//The height and with of the element is smaller than the clickableAreaLimit
				if(andiData.tagName == "input[radio]")
					andiAlerter.throwAlert(alert_0210,["radio button"]);
				else if(andiData.tagName == "input[checkbox]")
					andiAlerter.throwAlert(alert_0210,["checkbox"]);
			}
		}
	};

	//This function will search for misspelled aria attributes and throw an alert if found.
	this.areThereAnyMisspelledAria = function(element){
		if($(element).is("[aria-role]"))
			andiAlerter.throwAlert(alert_0032);
		
		if($(element).is("[aria-labeledby]"))
			andiAlerter.throwAlert(alert_0031);
	};
	
	//This function will throw alert_0181
	//if the element has aria-hidden=true or is a child of an element with aria-hidden=true
	//NOTE: role=presentation/none are not factored in here 
	//      because browsers automatically ignore them if the element is focusable
	this.hasThisElementBeenHiddenFromScreenReader = function(element){
		if(TestPageData.page_using_ariahidden){
			if(isAriaHidden(element))
				andiAlerter.throwAlert(alert_0181);
			
			//This function recursively travels up the anscestor tree looking for aria-hidden=true.
			//Stops at #ANDI508-testPage because another check will stop ANDI if aria-hidden=true is on body or html
			function isAriaHidden(element){
				if($(element).is("#ANDI508-testPage"))
					return false;
				else if($(element).attr("aria-hidden") === "true")
					return true;
				else
					return isAriaHidden($(element).parent());
			}
		}
	};
	
	//This function will increment the testPageData.disabledElementsCount
	//Returns true if the element is disabled
	this.isThisElementDisabled = function(element){
		if(element.disabled){
			testPageData.disabledElementsCount++;
			return true;
		}
		else return false;
	};
	
	//This function will throw alert_0250 if there are disabled elements
	this.areThereDisabledElements = function(type){
		if(testPageData.disabledElementsCount > 0)
			andiAlerter.throwAlert(alert_0250,[testPageData.disabledElementsCount, type],0);
	};

	//This function will scan for deprecated HTML relating to accessibility associated with the element 
	this.detectDeprecatedHTML = function(element){
		if(document.doctype !== null && document.doctype.name == "html" && !document.doctype.publicId && !document.doctype.systemId){
			var message;

			if($(element).is("table") && $(element).attr("summary")){
				var role = $(element).attr("role");
				if(role !== "presentation" && role !== "none"){
					message = ["attribute [summary] in &lt;table&gt;, use &lt;caption&gt; or [aria-label] instead"];
				}
			}
			else if($(element).is("a") && $(element).attr("name")){
				message = ["attribute [name] in &lt;a&gt;, use [id] instead"];
			}
			else if($(element).is("td") && $(element).attr("scope")){
				message = ["attribute [scope] on &lt;td&gt;, in HTML5 [scope] only valid on &lt;th&gt;"];
			}
			
			if(message){
				if($(element).hasClass("ANDI508-element"))
					andiAlerter.throwAlert(alert_0078,message);
				else
					andiAlerter.throwAlert(alert_0078,message,0);
			}
		}
	};
	
	//============================//
	//==Component Quality Checks==//
	//============================//
	
	//This function will throw alert_0101 if the alert_0101.list is not empty
	this.areThereComponentsThatShouldntBeCombined = function(){
		if(alert_0101.list !== "")
			andiAlerter.throwAlert(alert_0101,[alert_0101.list]);
	};
	//This function will compare components that shouldn't be combined.
	//Parameters:
	//	componentToTestAgainst: Component to test against
	//	spaceDelimitedListOfComponents: List of components (space delimited) that shouldn't be combined with componentToTestAgainst.
	//									Will test against aria-label aria-labelledby aria-describedby title
	//	andiData:	AndiData object
	this.improperCombination = function(componentToTestAgainst, spaceDelimitedListOfComponents, andiData){
		var improperCombinationFoundList = "";
		var components = spaceDelimitedListOfComponents.split(" ");
		for(var x=0; x<components.length; x++){
			if(andiData[components[x]] && andiData[components[x]] != AndiCheck.emptyString)
				improperCombinationFoundList += "["+components[x]+"] ";
		}
		if(improperCombinationFoundList !== "")
			alert_0101.list += componentToTestAgainst + " with " + $.trim(improperCombinationFoundList);
	};
	
	//This function will add the component to the empty component list 
	this.addToEmptyComponentList = function(component){
		//if the component is not already in the list
		if(!alert_0131.list.includes(component))
			alert_0131.list += " [" + component + "=\"\"]";
		return AndiCheck.emptyString;
	};
	//This function generates an alert_0131 if the alert_0131.list is not empty
	this.areAnyComponentsEmpty = function(){
		if(alert_0131.list !== "")
			andiAlerter.throwAlert(alert_0131,[alert_0131.list]);
	};
		
	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//Returns true if the limit was exceeded.
	this.checkCharacterLimit = function(componentText, alertObject){
		if(componentText.length > AndiCheck.characterLimiter){
			andiAlerter.throwAlert(alertObject);
			return true;
		}
		return false;
	};
	//This function inserts a pipe character into the componentText at the characterLimiter position
	//The color of the pipe is the color of a warning
	this.insertCharacterLimitMark = function(componentText){
		var returnThis = andiUtility.formatForHtml(componentText.substring(0, AndiCheck.characterLimiter))+
			"<span class='ANDI508-display-warning'>|</span>"+
			andiUtility.formatForHtml(componentText.substring(AndiCheck.characterLimiter,componentText.length));
		return returnThis;
	};
}

//This function handles the throwing of alerts.
function AndiAlerter(){
	//These functions will throw Danger/Warning/Caution Alerts
	//They will add the alert to the alert list and attach it to the element
	//Parameters
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	//	index: 	(optional) pass in 0 if this cannot be linked to an element.  If not passed will use andiElementIndex
	this.throwAlert = function(alertObject, customMessage, index){
		if(alertObject){
			var message = alertMessage(alertObject, customMessage);
			if(index === undefined){
				index = testPageData.andiElementIndex; //use current andiElementIndex
				this[alertObject.level+"s"].push(messageWithHelpLink(alertObject, message));
			}
			this.addToAlertsList(alertObject, message, index);
			
			//Add the Alert Button to the alertButtons array (to be displayed later)
			
			if(alertObject.alertButton && alertButtons.indexOf(alertObject) < 0)
				alertButtons.push(alertObject);
		}
	};
		
	//This function will add an alert another element's alert object.
	//It is used to add an alert to a related (different) element than the element being currently analyzed.
	//For example: non-unique link text: since the second instance triggers the alert, use this method to add the alert to the first instance
	//NOTE: this function will not check if the alert has already been placed on the element, therefore such logic should be added by the caller before this function is called.
	//Parameters
	//	index:			andiElementIndex of the element
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	this.throwAlertOnOtherElement = function(index, alertObject, customMessage){
		var message = alertMessage(alertObject, customMessage);
		$("#ANDI508-testPage [data-ANDI508-index="+index+"]").data("ANDI508")[alertObject.level+"s"].push(messageWithHelpLink(alertObject, message));
		this.addToAlertsList(alertObject, message, index);
	};
	
	//This private function will add an icon to the message
	//Parameters
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. if string, use the string. If array, get values from array
	function alertMessage(alertObject, customMessage){
		//var message = "<img alt='"+alertObject.level+": ' src='"+icons_url+alertObject.level+".png' />";
		var message = "";
		if(typeof customMessage === "string")
			message += customMessage;
		else if(customMessage !== undefined)
			message += getParams(alertObject, customMessage); //use custom message
		else
			message += alertObject.message; //use default alert message
		return message;
		
		//This function will fill in the parameters of the alert message with the string in the array
		function getParams(alertObject, paramArray){
			var m = alertObject.message.split("%%%");
			var message = "";
			for(var x=0; x<paramArray.length; x++)
				message += m[x] + paramArray[x];
			message += m[m.length-1];
			return message;
		}
	}
	
	//This private function will add a help link to the alert message
	function messageWithHelpLink(alertObject, message){
		return "<a href='"+ help_url + "alerts.html" + alertObject.info +"' target='_blank' "+
			"aria-label='"+alertObject.level+": "+message+" Select to Open ANDI Help"+"'>"+
			"<img alt='"+alertObject.level+"' role='presentation' src='"+icons_url+alertObject.level+".png' />"+
			message+"</a> ";
	}
	
	//This function is not meant to be used directly.
	//It will add a list item into the Alerts list.
	//It can place a link which when followed, will move focus to the field relating to the alert.
	//Parameters: 
	//	alertObject:	the alert object	
	//  message:		text of the alert message
	//  elementIndex:	element to focus on when link is clicked. expects a number. pass zero 0 if alert is not relating to one particular element
 	this.addToAlertsList = function(alertObject, message, elementIndex){
		//Should this alert be associated with a focusable element?
		var listItemHtml = " tabindex='-1' ";
		if(elementIndex !== 0){
			//Yes, this alert should point to a focusable element. Insert as link:
			listItemHtml += "href='javascript:void(0)' data-ANDI508-relatedIndex='"+elementIndex+"' aria-label='"+alertObject.level+": "+message+" Element #"+elementIndex+"'>"+
			"<img alt='"+alertObject.level+"' role='presentation' src='"+icons_url+alertObject.level+".png' />"+
			message+"</a></li>";
		}
		else{
			//No, This alert is not specific to an indexed element. Insert message with link to help page.
			listItemHtml += "href='"+ help_url + "alerts.html" + alertObject.info +"' target='_blank' aria-label='"+alertObject.level+": "+message+"'>"+
			"<img alt='"+alertObject.level+"' role='presentation' src='"+icons_url+alertObject.level+".png' />"+
			message+"</a></li>";
		}
		
		var alertGroup = AndiAlerter.alertGroups[alertObject.group];
		
		//Adds the alert into its group
		//Assign the alert level to the group	
		if(alertObject.level === "danger"){
			alertGroup.dangers.push(listItemHtml);
			alertGroup.level = "danger";
		}
		else if(alertObject.level === "warning"){
			alertGroup.warnings.push(listItemHtml);
			if(alertGroup.level !== "danger")
				alertGroup.level = "warning";
		}
		else{
			alertGroup.cautions.push(listItemHtml);
			if(alertGroup.level !== "danger" && alertGroup.level !== "warning")
				alertGroup.level = "caution";
		}
		testPageData.numberOfAccessibilityAlertsFound++;
	};
	
	//This function will update the ANDI508-alerts-list.
	this.updateAlertList = function(){
		if(testPageData.numberOfAccessibilityAlertsFound > 0){
			//Yes, Accessibility alerts were found.
			buildAlertGroupsHtml(sortAlertGroups());
			showAlertButtons();
		}
		else//No accessibility alerts.
			$("#ANDI508-alerts-list").html("").hide();
		
		//This function sorts the alert groups into their levels
		function sortAlertGroups(){
			var dangers = [];
			var warnings = [];
			var cautions = [];
			var alertGroup;
			for(var x=0; x<AndiAlerter.alertGroups.length; x++){
				alertGroup = AndiAlerter.alertGroups[x];
				if(alertGroup.level === "danger")
					dangers.push(alertGroup);
				else if(alertGroup.level === "warning")
					warnings.push(alertGroup);
				else if(alertGroup.level === "caution")
					cautions.push(alertGroup);
			}
			return {dangers:dangers, warnings:warnings, cautions:cautions};
		}
		
		//This function builds the html for all alert groups
		function buildAlertGroupsHtml(alertGroups){
			$("#ANDI508-alerts-list").append(
				"<h3 id='ANDI508-numberOfAccessibilityAlerts' class='ANDI508-heading' tabindex='0'>Accessibility Alerts: "+
				"<span class='ANDI508-total'>"+testPageData.numberOfAccessibilityAlertsFound+"</span></h3>"+
				"<div id='ANDI508-alerts-container-scrollable' role='application'>"+
				buildAlertLevelList("dangers")+
				buildAlertLevelList("warnings")+
				buildAlertLevelList("cautions")+
				"</div>"
			).show();
			
			addAlertListFunctionality();
			
			function buildAlertLevelList(level){
				var html = "";
				if(alertGroups[level].length > 0){
					html += "<ul id='ANDI508-alertLevel-"+level+"-container'>";
					for(var x=0; x<alertGroups[level].length; x++)
						getAlertsForAlertGroup(alertGroups[level][x]);
					html += "</ul>";
				}
				return html;
				
				//This function build the html for a single alert group
				function getAlertsForAlertGroup(group){
					var totalAlerts = parseInt(group.dangers.length + group.warnings.length + group.cautions.length);
					html += "<li class='ANDI508-alertGroup-container ANDI508-display-"+group.level+
						"' role='group' id='ANDI508-alertGroup_"+$.inArray(group, AndiAlerter.alertGroups)+
						"'><a href='#' class='ANDI508-alertGroup-toggler' tabindex='0' role='treeitem' aria-expanded='false' "+
						"aria-label='"+group.level+" "+totalAlerts+" "+group.heading+"'>"+
						group.heading+": (<span class='ANDI508-total'>"+totalAlerts+"</span>)</a><ol class='ANDI508-alertGroup-list'>";
					for(var d=0; d<group.dangers.length; d++)
						html += "<li class='ANDI508-display-danger'><a " + "aria-posinset='"+parseInt(d+1)+"' aria-setsize='"+totalAlerts+"' " + group.dangers[d];
					for(var w=0; w<group.warnings.length; w++)
						html += "<li class='ANDI508-display-warning'><a " + "aria-posinset='"+parseInt(w+1)+"' aria-setsize='"+totalAlerts+"' " + group.warnings[w];
					for(var c=0; c<group.cautions.length; c++)
						html += "<li class='ANDI508-display-caution'><a " + "aria-posinset='"+parseInt(c+1)+"' aria-setsize='"+totalAlerts+"' " + group.cautions[c];
					html += "</ol></li>";
				}
			}
			
			//This function defines the functionality of the Alert List
			//It adds key navigation: down, up, left, right, enter, asterisk, home, end,
			//Also adds mouse clickability
			function addAlertListFunctionality(){
				//This private variable will keep track of the alert links for keyboard navigation purposes
				var alertLinksTabbableArray;
				updateAlertLinksTabbableArray();
				
				$("#ANDI508-alerts-container-scrollable a").each(function(){
					//add keyboard functionality
					$(this)
					.keydown(function(e){
						switch (e.keyCode) {
						case 13: //enter
							if(!$(this).hasClass("ANDI508-alertGroup-toggler"))
								$(this).click(function(){return false;}); //follow the link to the element
							//else, the mouse click method takes care of the enter key for the alertGroup-toggler
							break;
						case 40: //down
							$(alertLinksTabbableArray[alertLinksTabbableArray.indexOf(this)+1]).focus();//next tabbable link
							break;
						case 38: //up
							$(alertLinksTabbableArray[alertLinksTabbableArray.indexOf(this)-1]).focus();//prev tabbable link
							break;
						case 39: //right
							if($(this).hasClass("ANDI508-alertGroup-toggler") && $(this).parent().find("ol").css("display") == "none")
								toggleAlertGroupList(this); //show associating alertGroup-list
							break;
						case 37: //left
							if(!$(this).hasClass("ANDI508-alertGroup-toggler"))
								$(this).closest(".ANDI508-alertGroup-container").find("a.ANDI508-alertGroup-toggler").focus(); //focus on root
							else if($(this).parent().next().css("display")!="none")
								toggleAlertGroupList(this); //hide associating alertGroup-list
							break;
						case 106: //asterisk
							$("#ANDI508-alerts-container-scrollable a.ANDI508-alertGroup-toggler").each(function(){
								if($(this).css("display")!="none")
									toggleAlertGroupList(this); //show every alertGroup-list
							});
							$(this).focus();//retain focus
							break;
						case 36: //home
							$(alertLinksTabbableArray[0]).focus();//focus on first link
							break;
						case 35: //end
							$(alertLinksTabbableArray[alertLinksTabbableArray.length-1]).focus();//focus on last link
							break;
						}
					});
					
					//Add mouse click method to alertGroupTogglers
					if($(this).hasClass("ANDI508-alertGroup-toggler")){
						$(this).click(function(){
							toggleAlertGroupList(this);
							return false;
						});
					}
					else{
						andiFocuser.addFocusClick($(this));
						//Add andiLaser drawing to the alert links
						$(this).on("mouseover" 	,andiLaser.drawAlertLaser);
						$(this).on("click"		,andiLaser.eraseLaser);
						$(this).on("mouseleave"	,andiLaser.eraseLaser);
					}
				});

				//This function stores the tabbable alerts into an array.
				//Should be called anytime the list display changes
				function updateAlertLinksTabbableArray(){
					alertLinksTabbableArray = [];
					$("#ANDI508-alerts-container-scrollable a[tabindex=0]").each(function(){
						alertLinksTabbableArray.push(this);
					});
				}

				//This function toggles the alertGroup display
				function toggleAlertGroupList(trigger){
					var groupListContainer = $(trigger).parent().find("ol");
					var tabindex;
					if($(groupListContainer).css("display")=="none"){
						//show alertGroup-list
						$(groupListContainer).slideDown(AndiSettings.andiAnimationSpeed);
						$(groupListContainer).children().first().find("a").focus();
						$(trigger).attr("aria-expanded","true");
						tabindex = "0";
					}
					else{
						//hide alertGroup-list
						$(groupListContainer).slideUp(AndiSettings.andiAnimationSpeed);
						$(trigger).attr("aria-expanded","false");
						tabindex = "-1";
					}
					//Set the tabindex
					$(groupListContainer).find("a").each(function(){
						$(this).attr("tabindex",tabindex);
					});
					updateAlertLinksTabbableArray();
					andiResetter.resizeHeights();
				}
			};
		}
		
		//This function will show the alert buttons that were added to the alertButtons array
		function showAlertButtons(){
			for(var x=0; x<alertButtons.length; x++){
				$("#ANDI508-alertGroup_"+alertButtons[x].group).children("a").first().after(
					"<button id='"+alertButtons[x].alertButton.id+
					"' aria-pressed='false'>"+alertButtons[x].alertButton.label + 
					alertButtons[x].alertButton.overlayIcon+"</button>"
					);
				$("#"+alertButtons[x].alertButton.id).bind("click",alertButtons[x].alertButton.clickLogic);
			}
			alertButtons = [];//clear the alertButtons array
		}
	};
	
	//This fucntion returns a new instance of an Alert Groups Array. 
	//Messages are categorized into these major groups.
	this.createAlertGroups = function(){
		return [
		new AlertGroup("Elements with No Accessible Name"),			//0
		new AlertGroup("Duplicate Attributes Found"),
		new AlertGroup("Components That Should Not Be Used Alone"),
		new AlertGroup("Misspelled ARIA Attributes"),
		new AlertGroup("Table Alerts"),
		new AlertGroup("AccessKey Alerts"),							//5
		new AlertGroup("Reference Alerts"),
		new AlertGroup("Invalid HTML Alerts"),
		new AlertGroup("Misuses of Alt attribute"),
		new AlertGroup("Misuses of Label Tag"),
		new AlertGroup("Unreliable Component Combinations"),		//10
		new AlertGroup("JavaScript Event Cautions"),
		new AlertGroup("Tab Order Alerts"),
		new AlertGroup("Empty Components Found"),
		new AlertGroup("Unused Child Components"),
		new AlertGroup("Excessive Text"),							//15
		new AlertGroup("Link Alerts"),
		new AlertGroup("Graphics Alerts"),
		new AlertGroup("Improper ARIA Usage"),
		new AlertGroup("Structure Alerts"),
		new AlertGroup("Button Alerts"),							//20
		new AlertGroup("Small Clickable Areas"),
		new AlertGroup("Inaccessible CSS Content"),
		new AlertGroup("Manual Contrast Tests Needed"),
		new AlertGroup("Contrast Alerts"),
		new AlertGroup("Disabled Element Alerts")							//25
		];
	};
	
	//Keeps track of alert buttons that need to be added.
	var alertButtons = [];
	
	this.dangers = [];
	this.warnings = [];
	this.cautions = [];
	
	//This function resets the alert data associated with a single element
	this.reset = function(){
		//reset the alert lists
		alert_0063.list = "";
		alert_0065.list = "";
		alert_0101.list = "";
		alert_0131.list = "";
		
		this.dangers = [];
		this.warnings = [];
		this.cautions = [];
	};
}

//This defines the class AlertGroup
function AlertGroup(heading){
	this.heading = heading;	//heading text for the group
	this.level = undefined;
	this.dangers = [];
	this.warnings = [];
	this.cautions = [];
}

//This defines the class AlertButton
function AlertButton(label, id, clickLogic, overlayIcon){
	this.label = label; //button's innerText
	this.id = id;		//button's id
	this.clickLogic = clickLogic; //buttons clicklogic
	this.overlayIcon = overlayIcon; //if button should contain overlayIcon, pass in overlayIcon. else pass in empty string ""
}

TestPageData.allVisibleElements = undefined;
//This class is used to store temporary variables for the test page
function TestPageData(){
	//Creates the alert groups
	AndiAlerter.alertGroups = andiAlerter.createAlertGroups();
	
	//Create a variable that refers to all the visible elements on the test page
	TestPageData.allVisibleElements = $("#ANDI508-testPage *").filter(":shown");
	
	//all the ids of elements on the page for duplicate comparisons
	this.allIds = $("#ANDI508-testPage *").filter("[id]");
	
	//all the fors of visible elements on the page for duplicate comparisons
	this.allFors = "";
		
	//Keeps track of the number of focusable elements ANDI has found, used to assign unique indexes.
	//the first element's index will start at 1.
	//When ANDI is done analyzing the page, this number will equal the total number of elements found.
	this.andiElementIndex = 0;
	
	this.relatedLaserIndex = 0;

	//Keeps track of the number of accessibility alerts found.
	this.numberOfAccessibilityAlertsFound = 0;
	
	this.pageAlerts = [];
		
	//Keeps track of the number of disabled elements
	this.disabledElementsCount = 0;

	//Booleans which will be set if the associated tags are found. Helps with performance.
	this.page_using_figure = false;
	this.page_using_fieldset = false;
	this.page_using_titleAttr = false;
	this.page_using_role_group = false;
	
	//Get all fors on the page and store for later comparison
	//Determine if labels are being used on the page
	this.page_using_label = false;
	if($(TestPageData.allVisibleElements).filter("label").length*1 > 0){
		this.page_using_label = true;
		//get all 'for's on the page and store for later comparison
		this.allFors = $(TestPageData.allVisibleElements).filter("label[for]");
	}
	
	if($(TestPageData.allVisibleElements).filter("table").first().length)
		TestPageData.page_using_table = true;
	
	//This function should be called by the first module that is launched
	//It should be placed in a loop that looks at every visible element on the page.
	this.firstLaunchedModulePrep = function(element){
		
		//Force Test Page to convert any css fixed positions to absolute.
		//Allows ANDI to be only fixed element at top of page.
		andiResetter.storeTestPageFixedPositionDistances(element);
		
		var role = $(element).attr("role");
		
		//Determine if role=group is being used
		if(!TestPageData.page_using_role_group && role === "group")
			TestPageData.page_using_role_group = true;
		
		//Determine if role=table is being used
		if(!TestPageData.page_using_table && (role === "table" || role === "grid")){
			TestPageData.page_using_table = true;
		}
		
		//Determine if aria-hidden=true is being used
		if(!TestPageData.page_using_ariahidden && $(element).attr("aria-hidden") === "true"){
			TestPageData.page_using_ariahidden = true;
		}
	};
}

//These variables store whether the testPage is using certain elements.
TestPageData.page_using_table = false;
TestPageData.page_using_caption = false;
TestPageData.page_using_ariahidden = false;

//==============//
// jQuery Load: //
//==============//
//This function will check to see if the page being tested already has jquery installed. 
//If not, it downloads the appropriate version from the jquery download source.
//It will also determine if an old IE version is being used
var jqueryPreferredVersion = "3.3.1"; //The preferred (latest) version of jQuery we want
var jqueryMinimumVersion = "1.9.1"; //The minimum version of jQuery we allow ANDI to use
var jqueryDownloadSource = "https://ajax.googleapis.com/ajax/libs/jquery/"; //where we are downloading jquery from
var oldIE = false; //used to determine if old version of IE is being used.
(function(){
	//Determine if old IE compatability mode
	if(navigator.userAgent.toLowerCase().indexOf("msie") != -1){if(parseInt(navigator.userAgent.toLowerCase().split("msie")[1]) < 9){oldIE = true;}}
	//Determine if Jquery exists
	var j = (window.jQuery !== undefined) ? window.jQuery.fn.jquery.split(".") : undefined;
	var m = jqueryMinimumVersion.split(".");
	var needJquery = true;
	if(j !== undefined){
		for(var i=0; i<3; i++){
			if(parseInt(j[i]) > parseInt(m[i])){
				needJquery = false;
				break; //existing jquery version is greater than required minimum
			}
			else if(parseInt(j[i]) < parseInt(m[i])){
				break; //existing jquery version is less than required minimum
			}
		}
	}
	if(needJquery){
		var script = document.createElement("script"); var done=false;
		//Which version is needed?
		if(!oldIE){script.src = jqueryDownloadSource + jqueryPreferredVersion + "/jquery.min.js";}//IE 9 or later is being used, download preferred jquery version.
		else{script.src = jqueryDownloadSource + jqueryMinimumVersion + "/jquery.min.js";}//Download minimum jquery version.
		//Waits until jQuery is ready before running ANDI
		script.onload = script.onreadystatechange = function(){if(!done && (!this.readyState || this.readyState=="loaded" || this.readyState=="complete")){done=true; launchAndi();}};
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	else{ //sufficient version of jQuery already exists
		launchAndi(); //initialize ANDI
	}
})();
