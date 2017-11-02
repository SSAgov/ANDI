//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
var andiVersionNumber = "11.1.2";

//==============//
// ANDI CONFIG: //
//==============//

//URLs
var host_url = "https://www.ssa.gov/accessibility/andi/";
var help_url = host_url+"help/";
var icons_url = host_url+"icons/";

//Load andi.css file immediately to minimize page flash
var andiCss = document.createElement("link");
andiCss.href = host_url + "andi.css";
andiCss.type = "text/css";
andiCss.rel = "stylesheet";
document.getElementsByTagName("head")[0].appendChild(andiCss);

//Define the overlay icon (not using background-image because of ie7 issues with sizing)
var overlayIcon = "<img src='"+icons_url+"overlay.png' class='ANDI508-overlayIcon' role='presentation' />";

//Representation of Empty String that will appear on screen
AndiCheck.emptyString = "[empty]";

//This number is 2x breath interval of a screen reader (125 characters)
AndiCheck.characterLimiter = 250;

//Set the global animation speed
AndiSettings.andiAnimationSpeed = 150; //milliseconds

//The element highlights setting (true = on, false = off)
AndiSettings.elementHighlightsOn = true;

//Default Module
AndiModule.module = "f";

//Define Alert Groups Array
//Alert messages are categorized into these major groups.
//If more groups are added to the end, ANDI will adjust.
//NOTE: Do not remove groups from the middle of the Array or there will be javascript errors.
AndiAlerter.alertGroups = [
	new AlertGroup("danger","0","Elements with No Accessible Name: "),
	new AlertGroup("danger","1","Duplicate Attributes Found: "),
	new AlertGroup("danger","2","Components That Should Not Be Used Alone: "),
	new AlertGroup("danger","3","Misspelled ARIA Attributes: "),
	new AlertGroup("danger","4","Table Alerts: "),
	new AlertGroup("danger","5","AccessKey Alerts: "),
	new AlertGroup("danger","6","Reference Alerts: "),
	new AlertGroup("danger","7","Invalid HTML Alerts: "),
	new AlertGroup("warning","8","Misuses of Alt attribute: "),
	new AlertGroup("warning","9","Misuses of Label Tag: "),
	new AlertGroup("warning","10","Risky Component Combinations: "),
	new AlertGroup("caution","11","JavaScript Events to Investigate: "),
	new AlertGroup("caution","12","Focusable Elements Not in Tab Order: "),
	new AlertGroup("caution","13","Empty Components Found: "),
	new AlertGroup("caution","14","Unused Child Components: "),
	new AlertGroup("warning","15","Excessive Text: "),
	new AlertGroup("warning","16","Link Alerts: "),
	new AlertGroup("danger","17","Graphics Alerts: ")
];

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
var focusedElementAtLaunch;						//Stores element which had focus at launch

//==================//
// ANDI INITIALIZE: //
//==================//
//This main function is called when jQuery is ready.
function launchAndi(){(window.andi508 = function(){

	//Get ANDI ready to launch the first module
	andiReady();
	
	//Store element that had focus at launch
	focusedElementAtLaunch = $(":focus");

	//Default Module Launch
	AndiModule.launchModule(AndiModule.module);

	//Load previously saved settings.
	andiSettings.loadANDIsettings();

	//Push down test page so ANDI display can be fixed at top of screen.
	andiResetter.resizeHeightsOnWindowResize();
	andiResetter.resizeHeights();

})();}

//==============//
// ANDI MODULE: //
//==============//

//This class defines an Andi Module.
//Should be instantiated in the module's js file.
//All ANDI modules (besides the default) should have a *andi.css file which will be loaded when the module is launched.
function AndiModule(moduleVersionNumber,moduleLetter){

	//Display the module letter in the logo when the module is instantiated
	var moduleName = $("#ANDI508-module-name");
	$(moduleName).attr("data-ANDI508-module-version",moduleLetter+"ANDI: "+moduleVersionNumber);
	if(moduleLetter == "f")
		$(moduleName).html("&nbsp;"); //do not display default module letter
	else{
		$(moduleName).html(moduleLetter);
		$("head").append("<link id='andiModuleCss' href='"+host_url+moduleLetter+"andi.css' type='text/css' rel='stylesheet' />");
	}

	//The module should implement these priveleged methods
	this.analyze = undefined;
	this.results = undefined;
	this.inspect = undefined;
		
	//Previous Element Button - automatically removes any overrides
	$("#ANDI508-button-prevElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
		if(isNaN(index)) //no active element yet
			andiFocuser.focusByIndex(1); //first element
		else if(index == 1)
			andiFocuser.focusByIndex(testPageData.andiElementIndex); //loop back to last
		else{
			//Find the previous element with data-ANDI508-index
			//This will skip over elements that may have been removed from the DOM
			for(x=index; x>0; x--){
				if($("#ANDI508-testPage [data-ANDI508-index='"+(x - 1)+"']").length){
					andiFocuser.focusByIndex(x - 1);
					break;
				}					
			}
		}
	});

	//Next Element Button - automatically removes any overrides
	$("#ANDI508-button-nextElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
		if(index == testPageData.andiElementIndex || isNaN(index))
			andiFocuser.focusByIndex(1); //loop back to first
		else{
			//Find the next element with data-ANDI508-index
			//This will skip over elements that may have been removed from the DOM
			for(x=index; x<testPageData.andiElementIndex; x++){
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
AndiModule.prototype.outputLogic = undefined;

//This function will launch a module.
//Parameters:
//	module:	the letter of the module
//	mode:	mode of the module used to run different logic or present different results.
AndiModule.launchModule = function(module, mode){
	
	$("#ANDI508-module-launchers button").removeClass("ANDI508-module-active").removeAttr("aria-pressed");
	$("#ANDI508-module-button-"+module).addClass("ANDI508-module-active").attr("aria-pressed","true");
	
	//Display Loading Text
	$("#ANDI508-numberOfElements-resultsSummary").html("Loading Module...");
	
	if(module!="f")
		AndiModule.enableModuleButton("f");
	
	var testPage = $("#ANDI508-testPage");
	$(testPage).addClass(module+"ANDI508-testPage");
	
	andiBar.buildAlertGroupsHtml();
	testPageData = new TestPageData(); //get fresh test page data
	
	//Global Checks
	andiCheck.isThereExactlyOnePageTitle();
	andiCheck.areThereMoreExclusiveChildrenThanParents();
	
	var script = document.createElement("script");
	var done = false;
	script.src = host_url + module + "andi.js";
	script.type='text/javascript';
	script.id='andiModuleScript';
	script.onload = script.onreadystatechange = function(){if(!done && (!this.readyState || this.readyState=="loaded" || this.readyState=="complete")){done=true; init_module(mode);}};

	$("#andiModuleScript").remove(); //Remove previously added module script
	document.getElementsByTagName("head")[0].appendChild(script);
	
	$("#ANDI508").removeClass().addClass("ANDI508-module-"+module).show();
	
	//if current module is not this module
	if(AndiModule.module != module){
		//$(testPage).find(".ANDI508-element-active").removeClass("ANDI508-element-active");
		AndiModule.module = module;
	}
};

//This function will show the module corresponding to the letter passed in
AndiModule.enableModuleButton = function(letter){
	$("#ANDI508-module-button-"+letter).show();
};
//This function will hide the module corresponding to the letter passed in
//Doing it this way because this is faster than css
//If the button has display:none in the css, sometimes the buttons don't appear 
//because the css load happens after this javascript
AndiModule.disableModuleButton = function(letter){
	$("#ANDI508-module-button-"+letter).hide();
};

//================//
// ALERT MESSAGES //
//================//

//This defines the class Alert
function Alert(type, group, message, info, alertButton, list){
	this.type = type; 		//danger, warning, or caution
	this.group = group; 	//belongs to this alert group id
	this.message = message;	//message text
	this.info = info; 		//the id corresponding to the help page documentation
	this.alertButton = alertButton; //(optional) an alert button object
	this.list = list = ""; 	//variable for holding a list
}
//Define Alerts used by all modules
var alert_0001 = new Alert("danger","0"," has no accessible name, associated label, or title.","#no_name");
var alert_0002 = new Alert("danger","0"," has no accessible name, innerText, or title.","#no_name");
var alert_0003 = new Alert("danger","0"," has no accessible name, alt, or title.","#no_name");
var alert_0004 = new Alert("danger","0","Table has no accessible name, caption, or title.","#no_name");
var alert_0005 = new Alert("danger","0","Figure has no accessible name, figcaption, or title.","#no_name");
var alert_0006 = new Alert("warning","0","Placeholder provided, but element has no accessible name.","#placeholder_no_name");

var alert_0011 = new Alert("danger","1","Duplicate \'id\' attributes: ","#dup_id", 
							new AlertButton("show ids", "ANDI508-alertButton-duplicateIdOverlay", "press to overlay ids", function(){andiOverlay.overlay_duplicateIds();}, overlayIcon));
var alert_0012 = new Alert("danger","1","Duplicate \'for\' attributes associate with this element's id ","#dup_for");

var alert_0021 = new Alert("danger","2","Cannot use aria-describedby alone on this element.","#dby_alone");
var alert_0022 = new Alert("danger","2","Cannot use legend alone on this element.","#legend_alone");

var alert_0031 = new Alert("danger","3","Misspelled attribute:","#misspell");
var alert_0032 = new Alert("danger","3","Aria-role not a valid attribute, use role instead.","#aria_role");

var alert_0041 = new Alert("warning","4","Presentation tables should not have ","#pres_table_not_have");
var alert_0043 = new Alert("warning","4","Too many levels of scope ","#too_many_scope_levels");
var alert_0044 = new Alert("danger","4","Scope attribute value is invalid: ","#scope_invalid");
var alert_0045 = new Alert("danger","4","Headers attribute only allowed on th and td tags.","#headers_only_for_th_td");
var alert_0046 = new Alert("danger","4","Table has no th cells.","#table_has_no_th");
var alert_0047 = new Alert("warning","4","Scope association missing at &lt;th&gt; intersection.","#no_scope_at_intersection");
var alert_0048 = new Alert("caution","4","Table has no scope associations.","#table_has_no_scope");
var alert_0049 = new Alert("danger","4","Table using both scope and headers, choose one association method.","#table_mixing_scope_and_headers");
var alert_004A = new Alert("danger","4","Table has no headers/id associations.","#table_has_no_headers");
var alert_004B = new Alert("danger","4","Table has no scope but does have headers, switch Table Analysis Mode to headers.","#switch_table_analysis_mode");
var alert_004C = new Alert("danger","4","Table has no headers/id but does have scope, switch Table Analysis Mode to scope.","#switch_table_analysis_mode");
//var alert_004D = new Alert("warning","4","Table has no td cells.","#table_has_no_td");
var alert_004E = new Alert("danger","4","Table has no th or td cells.","#table_has_no_th_or_td");

var alert_0051 = new Alert("warning","5","Found AccessKey that might not gain visual focus: ","#accesskey_focus");
var alert_0052 = new Alert("danger","5","AccessKey value has more than one character: ","#accesskey_more_one");
var alert_0053 = new Alert("danger","5","AccessKey is Empty.","#accesskey_empty");
var alert_0054 = new Alert("danger","5","Duplicate AccessKey found on button: ","#accesskey_duplicate_button");
var alert_0055 = new Alert("caution","5","Duplicate AccessKey found: ","#accesskey_duplicate");

var alert_0061 = new Alert("danger","6","Element\'s aria-labelledby references provide no name text.","#lby_refs_no_text");
var alert_0062 = new Alert("danger","6","Element\'s aria-describedby references provide no description text.","#dby_refs_no_text");
var alert_0063 = new Alert("danger","6","Element referenced by || with [id=||] not found.","#ref_id_not_found");
var alert_0064 = new Alert("caution","6"," reference contains aria-label.","#ref_has_aria_label");
var alert_0065 = new Alert("danger","6","Improper use of || possible: Referenced ids [||] not found.","#improper_ref_id_usage");
var alert_0066 = new Alert("danger","6","Element referenced by headers attribute with [id=||] is not a &lt;th&gt;","#headers_ref_not_th");
var alert_0067 = new Alert("warning","6","Headers attribute with [id=||] is referencing a &lt;td&gt;","#headers_ref_is_td");
var alert_0068 = new Alert("warning","6","Element\'s headers references provide no associating text.","#headers_refs_no_text");
var alert_0069 = new Alert("warning","6","In-page anchor target not found ","#anchor_target_not_found");

var alert_0071 = new Alert("danger","7","Page title cannot be empty.","#page_title_empty");
var alert_0072 = new Alert("danger","7","Page has no title.","#page_title_none");
var alert_0073 = new Alert("danger","7","Page has more than one title tag.","#page_title_multiple");
var alert_0074 = new Alert("danger","7","There are more legends than fieldsets: ","#too_many_legends");
var alert_0075 = new Alert("danger","7","There are more figcaptions than figures: ","#too_many_figcaptions");
var alert_0076 = new Alert("danger","7","There are more captions than tables: ","#too_many_captions");
var alert_0077 = new Alert("danger","7","Tabindex value is not a number: ","#tabindex_not_number");
var alert_0078 = new Alert("warning","7","Using HTML5, found deprecated ","#deprecated_html");

var alert_0081 = new Alert("warning","8","Alt attribute only allowed on Images.","#alt_only_for_images");

var alert_0091 = new Alert("warning","9","Explicit Label only allowed on form elements, excluding buttons.","#explicit_label_for_forms");
var alert_0092 = new Alert("warning","9","Explicit Label not allowed on buttons.","#explicit_label_not_for_buttons");

var alert_0101 = new Alert("warning","10","Do not combine components: ","#bad_component_combine");

var alert_0111 = new Alert("caution","11","Mouse event found on Element without Keyboard Access: ","#mouse_event_no_keyboard");
var alert_0112 = new Alert("caution","11","JavaScript event found: ","#javascript_event_caution");

var alert_0121 = new Alert("caution","12","Focusable element not in tab order.","#not_in_tab_order");
var alert_0122 = new Alert("caution","12","Focusable element not in tab order and has no accessible name","#not_in_tab_order_no_name");

var alert_0131 = new Alert("caution","13","Empty Component:","#empty_component");
var alert_0132 = new Alert("caution","13","Empty header cell","#empty_header_cell");

var alert_0141 = new Alert("caution","14","Child contains unused text.","#child_unused_text");

var alert_0151 = new Alert("warning","15","Title attribute length exceeds "+AndiCheck.characterLimiter+" characters","#character_length");
var alert_0152 = new Alert("warning","15","Alt attribute length exceeds "+AndiCheck.characterLimiter+" characters","#character_length");
var alert_0153 = new Alert("warning","15","Aria-label attribute length exceeds "+AndiCheck.characterLimiter+" characters","#character_length");

var alert_0161 = new Alert("warning","16","Ambiguous Link: same name/description as another link but different href.","#ambiguous_link");
var alert_0162 = new Alert("caution","16","Ambiguous Link: same name/description as another link but different href.","#ambiguous_link");//caution level thrown for internal links
var alert_0163 = new Alert("caution","16","Link text is vague and does not identify its purpose.","#vague_link");
//var alert_0164 = new Alert("caution","16","Link has role=button, check for spacebar key click handling.","#link_role_button_spacebar");
//var alert_0165 = new Alert("warning","16","Link opens new window or tab without notification.","#xxx");

var alert_0171 = new Alert("danger","17","Marquee element found, scrolling text causes accessibility problems. ","#marquee_found");
var alert_0172 = new Alert("danger","17","Blink element found, blinking text causes accessibility problems. ","#blink_found");
var alert_0173 = new Alert("danger","17","Server side image map found.","#server_side_image_map");
var alert_0174 = new Alert("caution","17","Redundant phrase in image alt text.","#image_alt_redundant_phrase");
var alert_0175 = new Alert("warning","17","Image alt text contains file name.","#image_alt_contains_file_name");
var alert_0176 = new Alert("danger","17","Image alt text is not descriptive.","#image_alt_not_descriptive");
var alert_0177 = new Alert("caution","17","Ensure that background images are decorative. ","#xxx");

//==================//
// DISPLAY HANDLING //
//==================//

//This private function will get ANDI ready
//it will add dependencies, insert the Andi bar, add legacy css, define the controls
function andiReady(){
	
	andiResetter.hardReset();
	
	dependencies();
	appendLegacyCss();
	insertAndiBarHtml();
	defineControls();
	
	//This function creates main html structure of the ANDI Bar.
	function insertAndiBarHtml(){
		var menuButtons = 
		"<div id='ANDI508-control-buttons-container'>"
			+"<button id='ANDI508-button-relaunch' aria-label='Relaunch ANDI' title='Press To Relaunch ANDI' accesskey='"+andiHotkeyList.key_relaunch.key+"'><img src='"+icons_url+"reload.png' alt='' /></button>" //refresh
			+"<button id='ANDI508-button-highlights' aria-label='Element Highlights' title='Press to Hide Element Highlights' aria-pressed='true'><img src='"+icons_url+"highlights-on.png' alt='' /></button>" //lightbulb
			+"<button id='ANDI508-button-minimode' aria-label='Mini Mode' title='Press to Engage Mini Mode'><img src='"+icons_url+"more.png' alt='' /></button><input type='hidden' value='false' id='ANDI508-setting-minimode' />" //underscore/minimize
			+"<button id='ANDI508-button-keys' aria-label='ANDI Hotkeys List' title='Press to Show ANDI Hotkeys List'><img src='"+icons_url+"keys-off.png' alt='' /></button>"
			+andiHotkeyList.buildHotkeyList()
			+"<button id='ANDI508-button-help' aria-label='ANDI Help' title='Press to Open ANDI Help Page in New Window'><img src='"+icons_url+"help.png' alt='' /></button>"
			+"<button id='ANDI508-button-close' aria-label='Remove ANDI' title='Press to Remove ANDI'><img src='"+icons_url+"close.png' alt='' /></button>"
		+"</div>";
		var moduleButtons = 
		"<div id='ANDI508-module-launchers'>"
			+"<button id='ANDI508-module-button-f' aria-label='andi focusable elements'>focusable elements</button>"
			//+"<button id='ANDI508-module-button-l' aria-label='landi links'>links</button>"
			//+"<button id='ANDI508-module-button-g' aria-label='gandi graphics'>graphics</button>"
			+"<button id='ANDI508-module-button-t' aria-label='tandi tables' data-ANDI508-moduleMode='scope mode'>tables</button>"
		+"</div>";
		var andiBar = "\
		<section id='ANDI508' tabindex='0' aria-label='ANDI Accessibility Test Tool' aria-roledescription='ANDI Accessible Name And Description Inspector' style='display:none'>\
		<div id='ANDI508-header'>\
			<h1 id='ANDI508-toolName-heading'><a id='ANDI508-toolName-link' href='#' aria-haspopup='true' aria-label='ANDI "+andiVersionNumber+"'><span id='ANDI508-module-name' data-ANDI508-module-version=''>&nbsp;</span>ANDI</a></h1>\
			<div id='ANDI508-module-modes' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'></div>\
			<div id='ANDI508-controls' tabindex='-1' accesskey='"+andiHotkeyList.key_jump.key+"'><h2 class='ANDI508-screenReaderOnly'>ANDI Controls</h2>\
				"+moduleButtons+"\
				"+menuButtons+"\
			</div>\
		</div>\
		<div id='ANDI508-body'>\
			<div id='ANDI508-activeElementInspection'><h2 class='ANDI508-screenReaderOnly'>ANDI Active Element Inspection</h2>\
				<div id='ANDI508-startUpSummary' tabindex='0' accesskey='"+andiHotkeyList.key_jump.key+"' />\
				<div id='ANDI508-activeElementResults'>\
					<div id='ANDI508-tagNameContainer'><h3 class='ANDI508-heading'>Element:</h3>\
						<a href='#' accesskey='"+andiHotkeyList.key_jump.key+"' id='ANDI508-tagNameLink'>&lt;<span id='ANDI508-tagNameDisplay' />&gt;</a>\
					</div>\
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
			<div id='ANDI508-pageAnalysis'><h2 class='ANDI508-screenReaderOnly'>ANDI Page Analysis</h2>\
				<h3 class='ANDI508-heading' tabindex='0' id='ANDI508-numberOfElements-resultsSummary'></h3>\
				<button aria-label='Previous Element' title='Focus on Previous Element' accesskey='"+andiHotkeyList.key_prev.key+"' id='ANDI508-button-prevElement'><img src='"+icons_url+"prev.png' alt='' /></button>\
				<button aria-label='Next Element' title='Focus on Next Element' accesskey='"+andiHotkeyList.key_next.key+"' id='ANDI508-button-nextElement'><img src='"+icons_url+"next.png' alt='' /></button><br />\
				<div id='ANDI508-additionalPageResults' />\
				<div id='ANDI508-alerts-list'>\
					<h3 id='ANDI508-numberOfAccessibilityAlerts' accesskey='"+andiHotkeyList.key_jump.key+"' class='ANDI508-heading' tabindex='0'>Accessibility Alerts: <span class='ANDI508-total' /></h3>\
					<div id='ANDI508-alerts-container-scrollable'>\
						<ul id='ANDI508-alertType-dangers-container' />\
						<ul id='ANDI508-alertType-warnings-container' />\
						<ul id='ANDI508-alertType-cautions-container' />\
					</div>\
				</div>\
			</div>\
		</div>\
		</section>\
		<svg id='ANDI508-laser-container'><title>ANDI Laser</title><line id='ANDI508-laser' /></svg>\
		";
		$("html")
			.addClass("ANDI508-testPage")
			.find("body")
				.addClass("ANDI508-testPage")
				.wrapInner("<div id='ANDI508-testPage' accesskey='"+andiHotkeyList.key_jump.key+"' />") //Add an outer container to the test page
				.prepend(andiBar); //insert ANDI display into body
	}
	
	//This function append css shims to the head of the page which are needed for old IE versions
	function appendLegacyCss(){
		$("head").append("<!--[if lte IE 7]><link href='"+host_url+"ie7.css' rel='stylesheet' /><![endif]-->"
						+"<!--[if lt IE 9]><link href='"+host_url+"ie8.css' rel='stylesheet' /><![endif]-->");
	}
	
	//This function defines what the ANDI controls/settings do.
	//Controls are:
	//Relaunch, Highlights, Mini Mode, Hotkey List, Help, Close, TagName link, 
	//prev/next button, module laucnhers, active element jump hotkey, version popup
	function defineControls(){
		//ANDI Relaunch Button
		$("#ANDI508-button-relaunch").click(function(){
			if(AndiModule.module == "f")
				launchAndi();
			else
				$("#ANDI508-module-button-"+AndiModule.module).click();
			return false;
		});
		//Highlights Button
		$("#ANDI508-button-highlights").click(function(){
			if (!AndiSettings.elementHighlightsOn){
				//Show Highlights
				$("#ANDI508-testPage .ANDI508-element").addClass("ANDI508-highlight");
				$(this)
					.attr("title","Press to Hide Element Highlights")
					.attr("aria-pressed","true")
					.children("img").first().attr("src",icons_url+"highlights-on.png");
				AndiSettings.elementHighlightsOn = true;
			}else{
				//Hide Highlights
				$("#ANDI508-testPage .ANDI508-highlight").removeClass("ANDI508-highlight");
				$(this)
					.attr("title","Press to Show Element Highlights")
					.attr("aria-pressed","false")
					.children("img").first().attr("src",icons_url+"highlights-off.png");
				AndiSettings.elementHighlightsOn = false;
			}
			andiResetter.resizeHeights();
		});
		//Mini Mode Button
		$("#ANDI508-button-minimode").click(function(){
			if ($("#ANDI508-setting-minimode").val()==="false"){
				andiSettings.minimode(true);
			}
			else{
				andiSettings.minimode(false);
			}
			andiSettings.saveANDIsettings();
		});
		//Hotkeys List Button
		$("#ANDI508-button-keys")
			.click(function(){
				if($("#ANDI508-hotkeyList-container").css("display")=="none"){
					andiHotkeyList.showHotkeysList();
				}
				else{
					andiHotkeyList.hideHotkeysList();
				}
			})
			.focus(function(){
				andiHotkeyList.hideHotkeysList();
			});
		andiHotkeyList.addArrowNavigation();
		//ANDI Help Button
		$("#ANDI508-button-help")
			.click(function(){
				var moduleJump = "";
				if(AndiModule.module != "f")
					//jump directly to the module on the help page
					moduleJump = "#" + AndiModule.module + "ANDI";
				window.open(help_url+"howtouse.html"+moduleJump, "_ANDIhelp",'width=1010,height=768,scrollbars=yes,resizable=yes').focus();
			})
			.focus(function(){
				andiHotkeyList.hideHotkeysList();
			});
		//ANDI Remove/Close Button
		$("#ANDI508-button-close").click(function(){
			$("#ANDI508-testPage .ANDI508-element-active").first().removeClass("ANDI508-element-active");
			andiResetter.hardReset();
		});
		//Tag name link
		$("#ANDI508-tagNameLink")
			.click(function(){ //Place focus on active element when click tagname
				andiFocuser.focusByIndex($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
				andiLaser.eraseLaser();
				return false;
			})
			.hover(function(){ //Draw line to active element
				andiLaser.drawLaser($(this).offset(),$("#ANDI508-testPage .ANDI508-element-active").offset(),$("#ANDI508-testPage .ANDI508-element-active"));
			})
			.on("mouseleave",andiLaser.eraseLaser);
		//Active Element Jump Hotkey
		$(document).keydown(function(e){
			if(e.which === andiHotkeyList.key_active.code && e.altKey )
				$("#ANDI508-testPage .ANDI508-element-active").focus();
		});
		//Module Launchers
		$("#ANDI508-module-launchers").children("button").each(function(){
			$(this).click(function(){
				andiResetter.softReset($("#ANDI508-testPage"));
				AndiModule.launchModule(this.id.slice(-1),$(this).attr("data-ANDI508-moduleMode")); //pass the letter of the module (last character of id)
				andiResetter.resizeHeights();
			});
		});
		//ANDI Version Popup
		$("#ANDI508-toolName-link").click(function(){
			alert("ANDI "+andiVersionNumber+"\n"+$("#ANDI508-module-name").attr("data-ANDI508-module-version"));
			return false;
		});
	}

	//This function sets up several dependencies for running ANDI On the test page.
	function dependencies(){
		//Ensure that $ is mapped to jQuery
		window.jQuery = window.$ = jQuery;
		
		//Define :focusable and :tabbable pseudo classes. Code from jQuery UI
		$.extend($.expr[ ':' ], {data: $.expr.createPseudo ? $.expr.createPseudo(function(dataName){return function(elem){return !!$.data(elem, dataName);};}) : function(elem, i, match){return !!$.data(elem, match[ 3 ]);},
			focusable: function(element){return focusable(element, !isNaN($.attr(element, 'tabindex')));},
			tabbable: function(element){var tabIndex = $.attr(element, 'tabindex'),isTabIndexNaN = isNaN(tabIndex);return ( isTabIndexNaN || tabIndex >= 0 ) && focusable(element, !isTabIndexNaN);
		}});
		
		//Define :shown
		//This is needed because jQuery's default :visible includes elements with visibility:hidden.
		$.extend(jQuery.expr[':'], {
			shown: function (elem, index, selector){return $(elem).css('visibility') != 'hidden' && $(elem).css('display') != 'none' && !$(elem).is(':hidden');}
		});
		
		//Define focusable function: Determines if something is focusable and all of its ancestors are visible. Code from jQuery UI
		function focusable(element){var map, mapName, img, nodeName = element.nodeName.toLowerCase(), isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex'));if('area' === nodeName){map = element.parentNode; mapName = map.name;if(!element.href || !mapName || map.nodeName.toLowerCase() !== 'map'){return false;} img = $('img[usemap=\\#' + mapName + ']')[0]; return !!img && visible(img);}return ( /^(input|select|textarea|button|object)$/.test(nodeName) ? !element.disabled : 'a' === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN) && visible(element);function visible(element){return $.expr.filters.visible(element) && !$(element).parents().addBack().filter(function(){return $.css(this, 'visibility') === 'hidden';}).length;}}
		
		//Define Object.keys function to prevent javascript error on oldIE
		if (!Object.keys) {Object.keys=(function(){'use strict';var hasOwnProperty = Object.prototype.hasOwnProperty,hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],dontEnumsLength = dontEnums.length;return function(obj) {if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {throw new TypeError('Object.keys called on non-object');}var result = [], prop, i;for (prop in obj) {if (hasOwnProperty.call(obj, prop)) {result.push(prop);}}if (hasDontEnumBug) {for (i = 0; i < dontEnumsLength; i++) {if (hasOwnProperty.call(obj, dontEnums[i])) {result.push(dontEnums[i]);}}}return result;};}());}

		//Define isContainerElement function: This support function will return true if an element can contain text (is not a void element)
		(function($){
			var visibleVoidElements = ['area', 'br', 'embed', 'hr', 'img', 'input', 'menuitem', 'track', 'wbr'];
			$.fn.isContainerElement = function(){return ($.inArray($(this).prop('tagName').toLowerCase(), visibleVoidElements) == -1);};
		}(jQuery));
		
		//Define .includes() to make indexOf more readable.
		if (!String.prototype.includes) {
			String.prototype.includes = function(search, start){
				'use strict';
				if(typeof start !== 'number') start = 0;

				if(start + search.length > this.length) return false;
				else return this.indexOf(search, start) !== -1;
			};
		}

		//If frames on test page, stops ANDI. If iframes, continues ANDI.
		if($("frameset").length>0){
			alert("Frames Detected on Test Page.\nANDI does not work with the frame tag which has been deprecated in HTML 5.");
			return; //stop running ANDI
		}
		else if($("iframe").filter(":visible").length>0)
			alert("iframe Detected on Test Page.\nCurrently, ANDI does not scan or highlight iframe contents");
	}
}

//This object handles updating of the ANDI Bar
function AndiBar(){
	
	//This private variable will store the text/html that will appear in the output
	var outputText = "";
	
	//This function will add the component to the outputText if it is not empty.
	//Parameters:
	//	accessibleComponentText: text that will appear on the screen as the output
	//	componentType: component type that will be the class and title attribute
	//	doMatchingTest: if true, it will run a matching test before attempting to insert the component text, (prevent double speak).
	function andiFound(accessibleComponentText,componentType,doMatchingTest){
		if(accessibleComponentText!="" && accessibleComponentText !== undefined && accessibleComponentText!=AndiCheck.emptyString){
			if(componentType=='legend'){
				//prepend
				outputText = "<span class='ANDI508-display-"+componentType+"'>"+accessibleComponentText+"</span> " + outputText;
			}
			else{
				//append
				if(!doMatchingTest || (doMatchingTest && !matchingTestResult(accessibleComponentText,doMatchingTest)))
					outputText += "<span class='ANDI508-display-"+componentType+"'>"+accessibleComponentText+"</span> ";
			}
			return true;
		}
		return false;
		
		//This function will return false if title or aria-describedby text matches a namer's text
		//Parameters:
		//	accessibleComponentText: text of the describer that will be compared for matches
		//	matchingAgainstObject: the object from which to get the namers text
		//TODO: it's possible to throw an alert here, but it would appear in the alert list dynamically on each inspect and you'd have to handle duplication prevention
		function matchingTestResult(accessibleComponentText,matchingAgainstObject){
			var matchFound = false;
			accessibleComponentText = stripHTML(accessibleComponentText); //ignores andiLaser markup
			if(accessibleComponentText == stripHTML(matchingAgainstObject.ariaLabelledby) //ignores andiLaser markup
			|| accessibleComponentText == matchingAgainstObject.ariaLabel
			|| accessibleComponentText == stripHTML(matchingAgainstObject.label) //ignores andiLaser markup
			|| accessibleComponentText == matchingAgainstObject.alt
			|| accessibleComponentText == matchingAgainstObject.innerText
			|| accessibleComponentText == matchingAgainstObject.value){
				matchFound = true;
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
		legend: 		function(elementData){return andiFound(elementData.legend,			"legend");},
		figcaption: 	function(elementData){return andiFound(elementData.figcaption,		"figcaption");},
		caption: 		function(elementData){return andiFound(elementData.caption,			"caption");},
		//innerText also calls subtree
		innerText: 		function(elementData){
							var innerTextResult = andiFound(elementData.innerText, "innerText");
							andiFound(elementData.subtree, "child&nbsp;element"); //comes after innertext
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
		$("#ANDI508-tagNameDisplay").html($(element).data("ANDI508").tagName);
		this.hideStartUpSummary();
	};
	
	//This function will display the output depending on the logic of the module Output Logic
	//which should be defined in each module.
	//It will also add the alerts to the output.
	//No output will be displayed if there are danger level alerts.
	this.displayOutput = function(elementData){
		outputText = ""; //reset - this will hold the output text to be displayed

		if(elementData.dangers.length!=0){
			//dangers were found during load
			for(x=0; x<elementData.dangers.length; x++){
				andiFound(elementData.dangers[x],"danger");
			}
		}
		else{ //No dangers found during load
			AndiModule.outputLogic(); //Each module should define this within the inspect logic
		}
		if(elementData.warnings.length!=0){
			//warnings were found during load
			for(x=0; x<elementData.warnings.length; x++){
				andiFound(elementData.warnings[x],"warning");
			}
		}
		if(elementData.cautions.length!=0){
			//cautions were found during load
			for(x=0; x<elementData.cautions.length; x++){
				andiFound(elementData.cautions[x],"caution");
			}
		}

		//Place the output display into the container.
		$("#ANDI508-outputText").html(outputText);
	};
	
	//This function will build the html for the alert groups.
	//Alert groups are expandable/collapsable containers which categorize similar alerts.
	this.buildAlertGroupsHtml = function(){
		$("#ANDI508-alerts-list").hide();
		//Loop through the alertGroups and create the html
		for(x=0; x<AndiAlerter.alertGroups.length; x++){
			AndiAlerter.alertGroups[x].count = 0;
			createAlertGroupContainer(AndiAlerter.alertGroups[x]);
		}
		
		//This function creates the html for an alert group.
		function createAlertGroupContainer(group){
			var containerHtml = "<li class='ANDI508-alertGroup-container ANDI508-display-"+group.type+"' id='ANDI508-alertGroup_"+group.groupID+"'>\
							     <h4><a href='#' class='ANDI508-alertGroup-toggler' tabindex='0' aria-expanded='false'>"+group.heading+
								 " (<span class='ANDI508-total'></span>)</a></h4><ol class='ANDI508-alertGroup-list'></ol></li>";
			$("#ANDI508-alertType-"+group.type+"s-container").append(containerHtml);
		}
	};

	//This function will append a row to the accessibleComponentsTable if the componentText is not empty
	//It will also attach andiLaser functionality if useLaser is true
	//Parameters:
	//	type: 					component type will be used for 1) the css class to color the component 2) the th cell text
	//	componentText: 			table td cell text
	//	addOnPropertyBoolean:	if true will use addOnProperties as the css class to color the component
	//	useLaser:				if true will createReferencedComponentLaserTrigger (aria-labelledby, label, aria-describedby)
	this.appendRow = function(type,componentText,addOnPropertyBoolean,useLaser){
		if(componentText){
			var displayType = type;
			if(addOnPropertyBoolean)
				displayType = "addOnProperties";
			$("#ANDI508-accessibleComponentsTable").children("tbody").first().append("<tr id='ANDI508-table-"+type+"'><th class='ANDI508-display-"+displayType+"' scope='row'>"+type+": </th><td class='ANDI508-display-"+displayType+"'>"+componentText+"</td></tr>");
			if(useLaser){
				//Add draw andiLaser functionality which will point to the locations of the references
				andiLaser.createReferencedComponentLaserTrigger(type);
			}
		}
	};
	
	//This function will focus on an element if it is inspectable according to this module
	this.focusIsOnInspectableElement = function(){
		//Is there is an active element on the page? (was ANDI was relaunched?)
		var activeElement = $("#ANDI508-testPage .ANDI508-element-active").first();
		if($(focusedElementAtLaunch).hasClass("ANDI508-element")){
			//inspect the element that had focus if it is inspectable by this module
			$(focusedElementAtLaunch).focus();
			return true;
		}
		else if(activeElement.length && $(activeElement).hasClass("ANDI508-element")){
			//Yes. "re-inspect" the active element
			$(activeElement).focus();
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
	this.showStartUpSummary = function(text,showPageAnalysis,elementType){
		var instruction = "";
		if(elementType)
			instruction = "<p>Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every "+elementType+".</p>";
		text = "<p>"+text+"</p>";
		if(showPageAnalysis){
			$("#ANDI508-pageAnalysis").show();
		}
		else{
			$("#ANDI508-pageAnalysis").hide();
		}
		$("#ANDI508-startUpSummary").html(text+instruction).show();
		$("#ANDI508-activeElementResults").hide();
	};
	//This function will empty and hide the startUpSummary and show the activeElementResults
	this.hideStartUpSummary = function(){
		$("#ANDI508-startUpSummary").html("").hide();
		$("#ANDI508-activeElementResults").show();
	};
	
	//This function updates the resultsSummary
	//Parameters:
	//	summary:	the summary text
	this.updateResultsSummary = function(summary){
		$("#ANDI508-numberOfElements-resultsSummary").html(summary);
	};
}

//This class is used to reset things that ANDI changed.
function AndiResetter(){
	//This function will clean up almost everything that ANDI inserted.
	//Exceptions: 	.ANDI508-element-active (handled on close button press)
	//				css <link> tags (all classes will be removed so it won't affect anything)
	this.hardReset = function(){
		if(document.getElementById("ANDI508")){//check if ANDI was inserted
			$("#ANDI508").remove(); //removes ANDI
			var testPage = $("#ANDI508-testPage");
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
		
		$("#ANDI508-additionalPageResults").html("");
		$("#ANDI508-alerts-container-scrollable ul").html("");
		$("#ANDI508-module-modes").html("");
		//$("#ANDI508-outputText").removeAttr("role").off("keydown");

		//Every ANDI508-element
		$(testPage).find(".ANDI508-element").each(function(){
			//fANDI only
			if($(testPage).hasClass("fANDI508-testPage")){
				
			}
			//tANDI only
			else if($(testPage).hasClass("tANDI508-testPage")){
				$(this)
					.removeClass("tANDI508-highlight")
					.removeAttr("data-tANDI508-rowIndex")
					.removeAttr("data-tANDI508-colIndex")
					.removeAttr("data-tANDI508-rowMember")
					.removeAttr("data-tANDI508-colMember");
			}
			else if($(testPage).hasClass("lANDI508-testPage")){
				$(this)
					.removeAttr("data-lANDI508-ambiguousIndex")
					.removeClass("lANDI508-background");
			}
			else if($(testPage).hasClass("gANDI508-testPage")){

			}
			//All Modules
			$(this)
				.removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
				.removeData("ANDI508")
				.removeAttr("data-ANDI508-index")
				.off("focus",AndiModule.andiElementFocusability)
				.off("mouseenter",AndiModule.andiElementHoverability);
		});
		//Additional Elements that were manipulated
		if($(testPage).hasClass("fANDI508-testPage")){
			$(testPage).find("label[data-ANDI508-relatedIndex]").removeAttr("data-ANDI508-relatedIndex");
		}
		
		//Remove Click logic from prev next buttons
		$("#ANDI508-button-prevElement").off("click");
		$("#ANDI508-button-nextElement").off("click");
		
		//Remove all overlays
		andiOverlay.removeAllOverlays();
		
		$(testPage).removeClass();//remove module class
	};

	//This function resizes ANDI's display and the ANDI508-testPage container so that ANDI doesn't overlap with the test page.
	//Should be called any time the height of the ANDI might change.
	this.resizeHeights = function(){
		var testPage = $("#ANDI508-testPage");
		//Calculate remaining height for testPage
		setTimeout(function(){
			var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
			var andiHeight = $("#ANDI508").outerHeight(true);
			var testPageHeight = (windowHeight - andiHeight) + "px";
			var testPageWidth = (window.innerWidth - parseInt($(testPage).css("padding-left"))) + "px";
			andiHeight = andiHeight+"px";
			//alert(windowHeight); alert(andiHeight); alert(testPageHeight);
			$(testPage)
				.css("height", testPageHeight)
				.css("margin-top", andiHeight)
				.css("width", testPageWidth)
				.find(".ANDI508-fixed").each(function(){
					//Adjust the top/bottom distance of any fixed elements in the test page
					var originalTopDistance = $(this).attr('data-originalTopDistance');
					var originalBottomDistance = $(this).attr('data-originalBottomDistance');
					
					if(originalTopDistance!="auto") //if attached to top
						$(this).css("top",parseInt(andiHeight) + parseInt(originalTopDistance) + "px"); //add the heights together so there is no overlap
					else if(originalBottomDistance=="auto") //if attached to bottom
						$(this).css("top",andiHeight);
				});
			andiHotkeyList.hideHotkeysList();
		}, AndiSettings.andiAnimationSpeed+50);
	};
	
	//This function will adjust the top distance of all elements on the test page that have css fixed positions.
	//This allows ANDI to not overlap with test page if using fixed positions.
	this.storeTestPageFixedPositionDistances = function(element){
		$(element).filter(function(){
			if(($(this).css('position') == 'fixed') && !$(this).hasClass('ANDI508-fixed')){
				$(this).addClass('ANDI508-fixed')
					   .attr("data-originalTopDistance",$(this).css("top")) //store the value of the original top
					   .attr("data-originalBottomDistance",$(this).css("bottom"));//store the value of the original bottom 
			}
		});
	};
	//This function will restore the test page fixed position distances to their original values.
	//It is meant to be called when the close ANDI button is pressed.
	this.restoreTestPageFixedPositionDistances = function(testPage){
		$(testPage).find(".ANDI508-fixed").each(function(){
			$(this).css("top",$(this).attr("data-originalTopDistance"))
				   .removeAttr("data-originalTopDistance")
				   .css("bottom",$(this).attr("data-originalBottomDistance"))
				   .removeAttr("data-originalBottomDistance")
				   .removeClass("ANDI508-fixed");
		});
	};
	
	//This will automatically call resizeHeights when the browser window is resized by the user.
	this.resizeHeightsOnWindowResize = function(){
		$(window).resize(function(){
			andiResetter.resizeHeights();
		});
	};
}

//This class is used to handle ANDI's own hotkeys
function AndiHotkeyList(){
	
	//This class is used to create a hotkey
	function AndiHotkey(key,sp,code){
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

	//These functions Show or Hide the ANDI508-hotkeyList-container
	this.showHotkeysList = function(){
		$("#ANDI508-hotkeyList-container").slideDown(AndiSettings.andiAnimationSpeed)
							   .focus();
		$("#ANDI508-button-keys").attr("title","Press to Hide ANDI Hotkeys List")
								 .children("img").attr("src",icons_url+"keys-on.png");
	};
	this.hideHotkeysList = function(){
		$("#ANDI508-hotkeyList").children("li").attr("tabindex","-2");//reset the hotkey item that may have been arrowed to.
		$("#ANDI508-hotkeyList-container").slideUp(AndiSettings.andiAnimationSpeed);
		$("#ANDI508-button-keys").attr("title","Press to Show ANDI Hotkeys List")
								 .children("img").attr("src",icons_url+"keys-off.png");
	};
	
	//This function builds ANDI's hotkey list html
	this.buildHotkeyList = function(){
		
		var hotkeyTrigger = "alt+";
		if(navigator.userAgent.toLowerCase().includes('firefox')){
			//the key combination for firefox is different:
			hotkeyTrigger = "shift+alt+";
		}

		return "<div id='ANDI508-hotkeyList-container' role='application' tabindex='-1' aria-label='Hotkey List, arrow down to hear hotkeys'>"
			+"<ul id='ANDI508-hotkeyList' role='presentation'><h3 aria-hidden='true'>Hotkeys:</h3>&nbsp;<span class='ANDI508-code'>"+hotkeyTrigger+"</span>"
			+insertHotkeyListItem("Relaunch",		andiHotkeyList.key_relaunch.key,	andiHotkeyList.key_relaunch.sp)
			+insertHotkeyListItem("Output",			andiHotkeyList.key_output.key,		andiHotkeyList.key_output.sp)
			+insertHotkeyListItem("Active Element",	andiHotkeyList.key_active.key,		andiHotkeyList.key_active.sp)
			+insertHotkeyListItem("Next",			andiHotkeyList.key_next.key,		andiHotkeyList.key_next.sp)
			+insertHotkeyListItem("Previous",		andiHotkeyList.key_prev.key,		andiHotkeyList.key_prev.sp)
			+insertHotkeyListItem("Section Jump",	andiHotkeyList.key_jump.key,		andiHotkeyList.key_jump.sp)
			+"<li tabindex='-2' aria-label='End of List'></li>"
			+"</ul></div>";
			
		//This function will insert a hotkey list item.
		//The screen reader will read the aria-label attribute contents when programmatic focus arrives.
		function insertHotkeyListItem(purpose,key,key_sp){
			return "<li tabindex='-2' aria-label='"+hotkeyTrigger+" "+key_sp+", "+purpose+"'>"
			+"<span class='ANDI508-code'>"+key+"</span>&nbsp;"
			+purpose+"</li>";
		}
	};
	
	//This function attaches the arrow key navigation to the hotkeyList 
	//so that a screen reader user can navigate slowly throught the list one item at a time.
	//Assigns tabindex -1 to the focused element, maintains other items tabindex -2
	//Using negative tabindex allows user to hit tab to jump out of hotkey list.
	//NOTE: When the hotkey list container is closed, the closing method should reset all li tabindex to -2
	//In order to allow arrow keys to work with a screen reader, the hotkeyList-container must have role=application
	//In order for the screen reader to not say "list item" on every li, each li must have role=presentation
	//For these li items, the focus indicator/outline does not appear by design.
	this.addArrowNavigation = function(){
		$("#ANDI508-hotkeyList-container").keydown(function(e){
			var hotkeyList = $("#ANDI508-hotkeyList");
			var hotkeyNavFocus = $(hotkeyList).children("[tabindex=-1]");
			var followingElement;
			switch(e.keyCode){
			case 40: //down
				if($(hotkeyNavFocus).length){
					followingElement = $(hotkeyNavFocus).next("li");
					if($(followingElement).length){
						$(hotkeyNavFocus).attr("tabindex","-2");
						$(followingElement).attr("tabindex","-1").focus();
					}
				}
				else{
					$(hotkeyList).children("[tabindex]").first().attr("tabindex","-1").focus();
				}
				break;
			case 38: //up
				if($(hotkeyNavFocus).length){
					followingElement = $(hotkeyNavFocus).prev("li");
					if($(followingElement).length){
						$(hotkeyNavFocus).attr("tabindex","-2");
						$(followingElement).attr("tabindex","-1").focus();
					}
				}
				break;
			}
		});
	};
}

//This class is used to keep track of ANDI settings
function AndiSettings(){
	
	//This function will save ANDI settings
	this.saveANDIsettings = function(){ 
		//If this browser has HTML5 local storage capabilities
		if (typeof(Storage) !== "undefined") {
			if(window.localStorage){
				//Save the current minimode selection
				if($("#ANDI508-setting-minimode").val()==="true")
					localStorage.setItem('ANDI508-setting-minimode', 'true');
				else
					localStorage.setItem('ANDI508-setting-minimode', 'false');
			}
		}
	};
	//This function will load ANDI settings
	//If no saved settings were found, it will load with the default settings.
	//Default Minimode: false
	this.loadANDIsettings = function(){
		//If this browser has HTML5 local storage capabilities
		if (typeof(Storage) !== "undefined") {
			if(window.localStorage){
				//Load the Minimode
				if(!localStorage.getItem('ANDI508-setting-minimode'))
					//Default minimode to false
					andiSettings.minimode(false);
				else{//load from local storage
					if(localStorage.getItem('ANDI508-setting-minimode') == 'true')
						andiSettings.minimode(true);
					else
						andiSettings.minimode(false);
				}
			}
		}
	};
	
	//This function will toggle the state of mini mode
	//Parameters:
	//	state: true or false
	this.minimode = function(state){
		if(state){
			//minimode on
			$("#ANDI508-setting-minimode").val("true");
			$("#ANDI508-body").addClass("ANDI508-minimode");
			$("#ANDI508-accessibleComponentsTableContainer").hide();
			$("#ANDI508-tagNameContainer").children("h3").hide();
			$("#ANDI508-button-minimode").attr("title","Press to Disengage Mini Mode")
										 .attr("aria-pressed","true")
										 .children("img").first().attr("src",icons_url+"less.png");
		}
		else{
			//minimode off
			$("#ANDI508-setting-minimode").val("false");
			$("#ANDI508-body").removeClass("ANDI508-minimode");
			$("#ANDI508-accessibleComponentsTableContainer").show();
			$("#ANDI508-tagNameContainer").children("h3").show();
			$("#ANDI508-button-minimode").attr("title","Press to Engage Mini Mode")
										 .attr("aria-pressed","false")
										 .children("img").first().attr("src",icons_url+"more.png");
		}
		andiResetter.resizeHeights();
	};
}

//This function is used for shifting focus to an element
function AndiFocuser(){
	//Places focus on element at index.
	this.focusByIndex = function(index){
		var focusOnThis = $("#ANDI508-testPage [data-ANDI508-index="+index+"]");
		if(!$(focusOnThis).attr("tabindex") && !$(focusOnThis).is(":focusable")){
			$(focusOnThis)
				.attr("tabindex","-1")
				.focus()
				.removeAttr("tabindex");
		}
		else
			$(focusOnThis).focus();
	};
	//Creates click event handler on the element which will call focusByIndex
	this.addFocusClick = function(element){
		$(element).click(function(){
			//Add focus on click
			andiFocuser.focusByIndex($(element).attr("data-ANDI508-relatedIndex"));
			return false;
		});
	};
}

//This function adds the capability to draw a line to visually connect the elements on the screen.
//It works by showing an svg #ANDI508-laser-container that contains a line tag.
//The coordinates of the line tag are updated to draw the line.
//NOTE: The svg has a high z-index to keep it on top of the test page, therefore, 
//it must be hidden at the right time so that the page can be interacted with.
function AndiLaser(){
	//Draws a andiLaser. Pass in an object containing properties top and left, aka the result of jQuery offset().
	this.drawLaser = function(fromHereCoords,toHereCoords,targetObject){
		if(!oldIE){
			$("#ANDI508-laser").attr('x1',fromHereCoords.left).attr('y1',fromHereCoords.top)
							   .attr('x2',  toHereCoords.left).attr('y2',  toHereCoords.top);
			$("#ANDI508-laser-container").css("cssText","display:inline !important");
			$(targetObject).addClass("ANDI508-laserTarget");
		}
	};
	//Removes the andiLasers by hiding the andiLaser container.
	//Should be called during mouseleave, or click functions that shift focus.
	this.eraseLaser = function(){
		if(!oldIE){
			$("#ANDI508-testPage").find(".ANDI508-laserTarget").first().removeClass("ANDI508-laserTarget");
			$("#ANDI508-laser-container").css("cssText","display:none !important");
		}
		return false;
	};
	//Draws a andiLaser for an alert link. It will be displayed when the shift key is held. Call it onmouseover
	this.drawAlertLaser = function(event){
		if(!oldIE){
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
	this.createLaserTrigger = function(triggerObject,targetObject){
		if(!oldIE){
			$(triggerObject).hover(function(){
				if($(targetObject) !== undefined)
					andiLaser.drawLaser($(triggerObject).offset(),$(targetObject).offset(),$(targetObject));
			});
			$(triggerObject).on("mouseleave",andiLaser.eraseLaser);
		}
	};
	//This function creates a andiLaserTarget HTML object 
	//which will store the index or id of the object to point the andiLaser at
	this.createLaserTarget = function(componentType, referenceIndex, referencedText){
		if(!oldIE){
			var andiLaserTarget = "<span class='ANDI508-laserAimer' data-ANDI508-";
			if(componentType=="label")
				andiLaserTarget += "relatedIndex='"; //uses the object's data-ANDI508-index attribute
			else
				andiLaserTarget+= "referencedId='"; //uses the object's id
			andiLaserTarget += referenceIndex+"'>"+andiUtility.formatForHtml(referencedText)+"</span>";
			return andiLaserTarget;
		}
		else
			return referencedText;
	};
	
	//This function will createLaserTrigger for each ANDI508-laserAimer in the td cell of the accessibility components table
	//It is used for (aria-labelledby, label, aria-describedby)
	this.createReferencedComponentLaserTrigger = function(type){
		$("#ANDI508-table-"+type+" td span.ANDI508-laserAimer").each(function(){
			//find referenced object
			var referencedObject;
			if(type=="label")
				referencedObject = $("#ANDI508-testPage label[data-ANDI508-relatedIndex="+$(this).attr("data-ANDI508-relatedIndex")+"]").first();
			else
				referencedObject = $("#"+$(this).attr("data-ANDI508-referencedId"));

			andiLaser.createLaserTrigger($(this),referencedObject);
		});
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
	
	//This ultility function will bypass css escape characters to prevent jquery javascript errors when parsing selectors
	this.escapeCssCharactersInId = function(string){
		if(string)
			return string.replace(/(:|\.|\[|\]|,|=|@)/g, '\\$1');
		else
			return "";
	};
	
	//This ultility function will parse the html tree of the element 
	//and return the innerText of the element and its children elements that are not hidden.
	//TODO: This function might be able to be improved
	this.getTextOfTree = function(element,dontIgnoreInvisible){
		var clone = $(element).clone();
		//var cloneChildren = $(clone).children();
		if($(clone).html() !== undefined){
			//Element has children
			if(!dontIgnoreInvisible){
				$(clone).children().each(function(){
					if($(this).css("display")=="none" || $(this).attr("hidden") || $(this).attr("aria-hidden")=="true"){
						$(this).remove(); //Remove any hidden children
					}
				});
			}
			//TODO: is there a better way of doing this?
			$(clone).find("script").remove();
			$(clone).find("noscript").remove();
			$(clone).find("iframe").remove();
			$(clone).find("select").remove();
			$(clone).find("caption").remove();
			$(clone).find("svg").remove(); //TODO: ignoring svg for now
			$(clone).find("table").remove(); //Don't include the contents of nested tables since it can get too large
			if($(element).is("fieldset")) $(clone).find("legend").remove();
			//TODO: add space after text of each child
			return $.trim($(clone).text());
		}
		return "";
	};
}

//==================//
// OVERLAYS (GLOBAL)//
//==================//

//This class handles overlay creation and removal
function AndiOverlay(){
	
	//This function will create an overlay html element
	this.createOverlay = function(purposeClass, innerText, title, tabindex){
		var titleText = "";
		if(title)
			titleText = " title='"+title+"'";
		if(!tabindex)
			tabindex = 0;
		return "<span class='ANDI508-overlay "+purposeClass+"'"+titleText+" tabindex='"+tabindex+"'>"+innerText+"</span>";
	};
	
	//This function will remove overlays with the class provided
	this.removeOverlay = function(purposeClass){
		$("#ANDI508-testPage span."+purposeClass).remove();
	};
	
	//This function will remove all overlays from the test page
	this.removeAllOverlays = function(){
		$("#ANDI508-testPage span.ANDI508-overlay").remove();
	};
	
	//This function will add an overlay that displays duplicate ids
	this.overlay_duplicateIds = function(){
		var duplicateIdOverlay_button = $("#ANDI508-alertButton-duplicateIdOverlay");
		if($(duplicateIdOverlay_button).html().includes("show ids")){
			//Show Overlay Duplicate Ids
			$(duplicateIdOverlay_button).html("hide ids"+overlayIcon).attr("title","press to overlay ids");
			var overlayClass, idMatchesFound, overlayObject, overlayTitle;
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
				if(idMatchesFound > 1){
					//Duplicate Found
					overlayClass += " ANDI508-overlay-alert";
					overlayTitle = "duplicate id";
				}
				
				overlayObject = andiOverlay.createOverlay(overlayClass, "id="+this.id, overlayTitle, $(this).attr("tabindex"));
				
				//Insert the overlay
				//TODO: make this reusable
				if($(this).isContainerElement())
					$(this).append(overlayObject);
				else
					this.insertAdjacentHTML("afterEnd",overlayObject);
			});
		}
		else{
			//Hide Overlay Duplicate Ids
			$(duplicateIdOverlay_button).html("show ids"+overlayIcon).attr("title","press to hide id overlays");
			andiOverlay.removeOverlay("ANDI508-overlay-duplicateId");
		}
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
			if($.trim(ariaLabelText)==""){
				ariaLabelText = andiCheck.addToEmptyComponentList("aria-label");
			}
			else{//not empty
				this.namerFound = true;
				andiCheck.improperCombination("aria-label","aria-labelledby",this);
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
			if($.trim(ariaLabelledbyText)==""){
				ariaLabelledbyText = andiCheck.addToEmptyComponentList("aria-labelledby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-labelledby
				ariaLabelledbyText = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-labelledby");

				if(ariaLabelledbyText==""){
					//ALL of the aria-labelledby references do not return any text
					ariaLabelledbyText = andiCheck.addToEmptyComponentList("aria-labelledby");
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
		var ignoreLabel = false;
		var labelText;
		var andiElementIndex = this.andiElementIndex;
		if(testPageData.page_using_label && !$(element).is("label")){
			//Page is using labels and this element is not a label
			var labelNestedText = grab_labelNested(element);
			var labelForText = grab_labelFor(element);
			
			if(labelNestedText !== false)
				labelText = labelNestedText;
			else if(labelForText !== false)
				labelText = labelForText;

			if(labelText !== undefined){
				if(labelText==""){
					labelText = andiCheck.addToEmptyComponentList("label");
				}
				else if(ignoreLabel != true){
					this.namerFound = true;
					labelText = andiLaser.createLaserTarget("label",this.andiElementIndex,labelText);
				}
				this.accessibleComponentsTotal++;
			}
		}
		this.ignoreLabel = ignoreLabel;
		return labelText;
		
		//**label nested**
		//This function attempts to grab the nested label if it exists
		//returns true or false if found
		function grab_labelNested(element){
			//Is the element nested inside a label?
			var closestLabel = $(element).closest("label");
			if(closestLabel.length > 0){
				//Yes, the element is nested inside a label
				//Is this an element that should pay attention to nested labels?
				if(!($(element).not(":submit").not(":button").not(":reset").not(":image").is("input")
					|| $(element).is("select") || $(element).is("textarea")))
					ignoreLabel = true; //ignore the nested label for ANDI output
				$(closestLabel).attr("data-ANDI508-relatedIndex",andiElementIndex);
				var labelObject = $(closestLabel).clone(); //make a copy
				var labelText = andiUtility.getTextOfTree($(labelObject));
				return labelText;
			}
			return false;
		}
		
		//**label for**
		//This function attempts to grab the label with a 'for' whose value matches the value of the element's id
		//returns true or false if found
		function grab_labelFor(element){
			var labelText = false;
			//Does it contain an id, and therefore, possibly an associated label with 'for' attribute value that matches value of this elemtent's id?
			if(element[0].id != ''){
				//Yes, it has an id attribute.
				//Can a label be found elsewhere on the page with a for attribute that matches this element's id?
				$("#ANDI508-testPage label").each(function(){
					if($(this).attr('for') == element[0].id){ //NOTE: not using jquery to get id so that oldIE browser doesn't break
						//Yes, the label with matching 'for' was found
						labelText = $.trim($(this).text());
						//Is it okay for this element to have a label?
						if($(element).is(":submit") || $(element).is(":button") || $(element).is(":reset")){
							//No, label not valid on a button
							andiAlerter.throwAlert(alert_0092);
							ignoreLabel = true; //ignore the label for ANDI output
						}
						else if( !($(element).not(":submit").not(":button").not(":reset").not(":image").is("input"))
							&& !$(element).is("select") && !$(element).is("textarea")  )
						{
							//No, label not valid on anything that isn't a form element, excluding buttons
							andiAlerter.throwAlert(alert_0091);
							ignoreLabel = true; //ignore the label for ANDI output
						}
						else{
							$(this).attr("data-ANDI508-relatedIndex",andiElementIndex);
						}
						return; //ensures that it only retrieves 1 label even if there are more
					}
				});
			}
			return labelText;
		}
	};
	
	//**alt**
	//This function attempts to grab the alt if it exists (for all elements, not just images so that it can throw alerts)
	this.grab_alt = function(element){
		//Does it contain an alt?
		var alt = $(element).attr("alt");
		if(alt !== undefined){
			this.accessibleComponentsTotal++;
			if(alt == ""){//do not trim so that alt=" " doesn't throw alert
				alt = andiCheck.addToEmptyComponentList("alt");
			}
			if(!$(element).is("img") && !$(element).is("input:image") && !$(element).is("area")){
				//alt should not be used on this element
				this.ignoreAlt = true;
				andiAlerter.throwAlert(alert_0081);
			}
			else{//element is an image
				if(alt!=AndiCheck.emptyString){
					this.namerFound = true;
					andiCheck.improperCombination("alt","aria-labelledby aria-label",this);
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
		if($(element).is("input:submit") || $(element).is("input:button") || $(element).is("input:reset") || $(element).is("input:image")){
			valueText = $(element).val();
			if(valueText == ""){
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
		if(!$(element).is(":empty") && !$(element).is("select") && !$(element).is("textarea")){
			innerTextVisible = andiUtility.getTextOfTree(element);
			if(innerTextVisible != ""){
				this.namerFound = true;
				this.accessibleComponentsTotal++;
			}
			//If button or link
			if($(element).is("button") || $(element).is("a")){//TODO: eventually remove this check
				this.subtree = this.grab_subtreeComponents(element);
			}
		}
		return andiUtility.formatForHtml(innerTextVisible);
	};
		
	//**aria-describedby**
	//This function attempts to grab the aria-describedby if it exists
	//Should be called after the namers in order to throw alert_0021
	this.grab_ariaDescribedby = function(element){
		//Does the element also contain an aria-describedby attribute?
		var ariaDescribedbyText = $(element).attr("aria-describedby");
		if(ariaDescribedbyText !== undefined){
			this.accessibleComponentsTotal++;
			if($.trim(ariaDescribedbyText)==""){
				ariaDescribedbyText = andiCheck.addToEmptyComponentList("aria-describedby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-describedby
				ariaDescribedbyText = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-describedby");
				if(ariaDescribedbyText==""){
					//ALL of the aria-describedby references do not return any text
					ariaDescribedbyText = andiCheck.addToEmptyComponentList("aria-describedby");
					andiAlerter.throwAlert(alert_0062);
					ariaDescribedbyText=AndiCheck.emptyString;
				}
				else
					this.describerFound = true;
			}
			andiCheck.improperCombination("aria-describedby","title",this);
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
			this.accessibleComponentsTotal++;
			if($.trim(titleText)==""){
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
				//element is contained in a fieldset
				if($(fieldset).has("legend").length == 1){
					legendText = andiUtility.getTextOfTree($(fieldset).find("legend"));
					this.accessibleComponentsTotal++;
					if(($(element).not(":submit").not(":button").not(":reset").not(":image").is("input"))
						|| $(element).is("select") || $(element).is("textarea") || $(element).is("fieldset")){
						//Check for improper legend combinations
						andiCheck.improperCombination("legend","aria-label aria-labelledby title aria-describedby",this);
						//Check if legend is the only component - all namer grabs should have already happened
						if(!this.namerFound && !$(element).is("fieldset")){
							andiAlerter.throwAlert(alert_0022);
						}
						//Check if legend is empty
						if(legendText==""){
							legendText = andiCheck.addToEmptyComponentList("legend");
						}
						else if($(element).is("fieldset"))
							this.namerFound = true;//legend is a namer for a fieldset
					}
					else
						//This is not an element that legend can be placed on, ignore it.
						this.ignoreLegend = true;
					legendText = andiUtility.formatForHtml(legendText);
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
				if($(figure).has("figcaption").length == 1){
					figcaptionText = andiUtility.getTextOfTree($(figure).find("figcaption"));
					this.accessibleComponentsTotal++;
					if(!this.ignoreFigcaption){
						//Check for improper figcaption combinations
						andiCheck.improperCombination("ficaption","aria-label aria-labelledby",this);
						//Check if figcaption is empty
						if(figcaptionText==""){
							figcaptionText = andiCheck.addToEmptyComponentList("figcaption");
						}
						else//not empty
							this.namerFound = true;
					}
					figcaptionText = andiUtility.formatForHtml(figcaptionText);
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
		if(TestPageData.page_using_table && !$(element).is("caption")){
			//Page is using figure and element is not caption
			var table;
			if($(element).is("table"))
				table = $(element); //element is a table.
			else{ //Does the element have an ancestor table?
				this.ignoreCaption = true;//only concerned with caption on table, but still display in components table
				table = $(element).closest("table"); //element is contained in a table.
			}
			if(table.length){
				if($(table).has("caption").length == 1){
					captionText = andiUtility.getTextOfTree($(table).find("caption"));
					this.accessibleComponentsTotal++;
					if(!this.ignoreCaption){
						//Check for improper caption combinations
						andiCheck.improperCombination("caption","aria-label aria-labelledby",this);
						//check if caption is empty
						if(captionText==""){
							captionText = andiCheck.addToEmptyComponentList("caption");
						}
						else//not empty
							this.namerFound = true;
					}
					captionText = andiUtility.formatForHtml(captionText);
				}
			}
		}
		return captionText;
	};
	
	//**placeholder**
	//This function attempts to grab the value of an input button/submit/reset if it is not empty
	this.grab_placeholder = function(element){
		var placeholderText;
		if($(element).is("input") || $(element).is("textarea")){
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
					andiAlerter.throwAlert(alert_0044+"["+scope+"]");
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
				
				if(headersText==""){
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
		if($(element).is("img") || $(element).is("input:image") || $(element).is("area")){
			if($(element).is("area")){
				var map = $(element).closest("map");
				if(map)
					imageSrc = $('#ANDI508-testPage img[usemap=\\#' + $(map).attr("name") + ']').first().attr('src');
			}
			else{ //img or input:image
				imageSrc = $(element).attr('src');
			}
			
			if(imageSrc){
				this.accessibleComponentsTotal++;
				if(imageSrc==''){
					imageSrc = andiCheck.addToEmptyComponentList("imageSrc");
				}
				else{
					imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
				}
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
			addOnPropertiesObject = $.extend(addOnPropertiesObject,{tabindex:tabindex});
			if(isNaN(tabindex) || tabindex==''){
				//tabindex is not a number
				var message = alert_0077.message+"("+tabindex+").";
				andiAlerter.throwAlert(alert_0077,message);
			}
			else if(tabindex < 0 && $(element).closest(":tabbable").html()===undefined){
				//element and ancestors are not tabbable
				if(this.namerFound)
					andiAlerter.throwAlert(alert_0121);
				else{
					if(!($(element).is("a") && !$(element).attr("href")))
						andiAlerter.throwAlert(alert_0122);
				}
				this.tabbable = false;
			}
			//else element is tabbable
		}
		else if(!$(element).is(":tabbable") /*&& $(element).closest(":tabbable").html()===undefined*/){
			this.tabbable = false;
		}
	};
	
	//**accesskey**
	//This function will grab the accesskey and put it in the addToAccessKeysList
	//It will add it to the addOnPropertiesObject object
	this.grab_accessKey = function(element){
		if($(element).is('[accesskey]')){
			var accesskey = $.trim($(element).attr("accesskey").toUpperCase());
			var key = "[" + accesskey + "]";
			//Is accesskey value more than one character?
			if(accesskey.length>1){ //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
				andiAlerter.throwAlert(alert_0052,alert_0052.message+key);
				testPageData.addToAccessKeysList(accesskey,this.andiElementIndex,alert_0052);
			}
			//Is accesskey empty?
			else if(accesskey.length==0){
				andiAlerter.throwAlert(alert_0053);
				accesskey = AndiCheck.emptyString;
				testPageData.addToAccessKeysList(accesskey,this.andiElementIndex,alert_0053);
			}
			else{
				//Check for duplicate accesskey
				if(testPageData.accesskeysListDuplicateComparator.includes(accesskey)){
					if($(element).is("button") || $(element).is("input:submit") || $(element).is("input:button") || $(element).is("input:reset") || $(element).is("input:image")){
						//duplicate accesskey found on button
						andiAlerter.throwAlert(alert_0054,alert_0054.message+key);
						testPageData.addToAccessKeysList(accesskey,this.andiElementIndex,alert_0054);
					}
					else{
						//duplicate accesskey found
						andiAlerter.throwAlert(alert_0055,alert_0055.message+key);
						testPageData.addToAccessKeysList(accesskey,this.andiElementIndex,alert_0055);
					}
				}
				else
					testPageData.addToAccessKeysList(accesskey,this.andiElementIndex);
			}
			addOnPropertiesObject = $.extend(addOnPropertiesObject,{accesskey:accesskey});
			addOnPropOutputText += "{"+accesskey+"}, ";
		}
	};
	
	//**role**
	//This function attempts to grab the role
	//It will add it to the addOnPropertiesObject object
	this.grab_role = function(element){
		var role = $.trim($(element).attr("role"));
		if(role!="")
			addOnPropertiesObject = $.extend(addOnPropertiesObject,{role:role});
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
		this.grab_role(element);

		//If add on props were found, prepare addOnPropOutputText
		if(!$.isEmptyObject(addOnPropertiesObject)){
			this.addOnPropertiesTotal = Object.keys(addOnPropertiesObject).length;
			if(addOnPropOutputText!=""){
				//Slice off last two characters the comma and the space: ", "
				this.addOnPropOutput += addOnPropOutputText.slice(0, -2); //Concatenates
			}
			this.accessibleComponentsTotal = this.accessibleComponentsTotal + this.addOnPropertiesTotal;
			this.addOnProperties = addOnPropertiesObject;
		}
		
		//**other add-On Properties**
		//This function will grab other add-on properties of the element:
		//readonly, aria-readonly, required, aria-required, aria-invalid, aria-disabled, 
		//aria-sort, aria-haspopup, aria-expanded, aria-controls, aria-pressed
		function grab_otherAddOnProperties(element){
			if( ( $(element).is("input") || $(element).is("textarea") || $(element).is("select") ) 
				&& (!$(element).is(":submit") && !$(element).is(":button") && !$(element).is(":reset") ) ){
				if($(element).prop('readonly')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{readonly:'readonly'});
					addOnPropOutputText += 'readonly' + ", ";
				}
				else if($(element).attr('aria-readonly')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaReadonly:$(element).attr('aria-readonly')});
					if($(element).attr('aria-readonly')=='true')
						addOnPropOutputText += 'readonly' + ", ";
				}
				if($(element).attr('required')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{required:'required'});
					addOnPropOutputText += 'required' + ", ";
				}
				else if($(element).attr('aria-required')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaRequired:$(element).attr('aria-required')});
					if($(element).attr('aria-required')=='true')
						addOnPropOutputText += 'required' + ", ";
				}
				if($(element).attr('aria-invalid')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaInvalid:$(element).attr('aria-invalid')});
					if($(element).attr('aria-invalid')=='true')
						addOnPropOutputText += 'invalid entry' + ", ";
				}
			}
			else if($(element).is("th") && $(element).attr('aria-sort')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaSort:$(element).attr('aria-sort')});
					if($(element).attr('aria-sort') != 'none')
						addOnPropOutputText += $(element).attr('aria-sort') + ", ";
			}
			if( $(element).is("input") || $(element).is("textarea") || $(element).is("select") || $(element).is("button") ){
				if($(element).attr('aria-disabled')){
					addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaDisabled:$(element).attr('aria-disabled')});
					if($(element).attr('aria-disabled')=='true')
						addOnPropOutputText += 'unavailable' + ", ";
				}
			}
			if($(element).attr('aria-haspopup')){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaHaspopup:$(element).attr('aria-haspopup')});
				if($(element).attr('aria-haspopup')=='true')
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
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaControls:"["+$(element).attr('aria-controls')+"]"});
				addOnPropOutputText += "controls[" + $(element).attr('aria-controls') + "], ";
			}
			if($(element).attr('aria-pressed')){
				addOnPropertiesObject = $.extend(addOnPropertiesObject,{ariaPressed:$(element).attr('aria-pressed')});
				if($(element).attr('aria-pressed')=='true')
					addOnPropOutputText += 'pressed' + ", ";
			}
		}
	};
	
	//This function will grab the tagName of the element
	//If the element is an input, it will add the type in brackets
	this.grab_tagName = function(element){
		var tagNameText = $(element).prop('tagName').toLowerCase();
		if(tagNameText=='input'){
			tagNameText += "["+$(element).prop('type').toLowerCase()+"]"; //add the type within brackets
		}
		return tagNameText;
	};
	
	//**child/subtree components**
	//This function will grab the accessible components of a subtree
	//It will concatenate html namers on the subtree to html namers of the parent element
	//This function will return, in one string, the namers and describers of the subtree if they exist.
	//TODO: For now, this is only being called on img inside links and buttons. Eventually it could become a fully recursive function
	this.grab_subtreeComponents = function(element){
		//Is there a decendant image?
		var subtreeText = "";
		var subtreeHtml = "";
		var img = $(element).clone().find('img');
		if($(img).attr('src')){ //TODO: check for css background images
			//Yes.
			this.imageSrc = this.grab_imageSrc(img);
			
			var imageTagName = 'img';
			
			var tempText = "";
			//try to get namers from subtree
			tempText = this.grab_ariaLabelledby(img);
			if(tempText && tempText!=AndiCheck.emptyString){
				subtreeText += tempText + " ";
				subtreeHtml += addSubtreeComponent(tempText,"aria-labelledby",imageTagName);
			}
			
			tempText = this.grab_ariaLabel(img);
			if(tempText && tempText!=AndiCheck.emptyString){
				subtreeText += tempText + " ";
				subtreeHtml += addSubtreeComponent(tempText,"aria-label",imageTagName);
			}
			
			tempText = this.grab_alt(img);
			if(tempText && tempText!=AndiCheck.emptyString){
				subtreeText += tempText + " ";
				subtreeHtml += addSubtreeComponent(tempText,"alt",imageTagName);
			}
			
			tempText = this.grab_title(img);
			if(tempText && tempText!=AndiCheck.emptyString){
				subtreeText += tempText + " ";
				subtreeHtml += addSubtreeComponent(tempText,"title",imageTagName);
			}
							
			if(subtreeHtml!=""){
				this.namerFound = true;
			}
			
			//Is there already an aria-label or aria-labelledby on the parent element?
			if(subtreeHtml!="" && (this.ariaLabel || this.ariaLabelledby)){
				//Yes. subtree has unused text (components with text)
				andiAlerter.throwAlert(alert_0141);
			}
		}
		//This function creates a subtree component element
		function addSubtreeComponent(subtreeComponentText,type,tagName){
			return "<span class='ANDI508-display-"+type+"'><span class='ANDI508-subtreeComponent'>" + "<span class='ANDI508-subtreeComponent-tagName'>&lt;" + tagName + "&gt;</span> " + type + ":</span> " + subtreeComponentText + "</span> ";
		}
		
		this.subtreeText = $.trim(subtreeText);
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
	function grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,attribute){
		var ids = $.trim($(element).attr(attribute));//get the ids to search for
		var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
		var accumulatedText = "";//this variable is going to store what is found. And will be returned
		var message, splitMessage = "";
		//Traverse through the array
		for (var x=0;x<idsArray.length;x++){
			//Can the aria list id be found somewhere on the page?
			var referencedId = andiUtility.escapeCssCharactersInId(idsArray[x]);
			var referencedElement = $("#"+referencedId);//will escape css syntax and treat as literals
			var referencedElementText = "";
			
			if($(referencedElement).attr('aria-label')){
				//Yes, this id was found and it has an aria-label
				referencedElementText += andiUtility.formatForHtml($(referencedElement).attr('aria-label'));
				//Aria-label found on reference element
				message = attribute + alert_0064.message;
				andiAlerter.throwAlert(alert_0064,message);
			}
			else if($(referencedElement).html() !== undefined){
				//Yes, this id was found
				referencedElementText += andiUtility.formatForHtml(andiUtility.getTextOfTree(referencedElement,true));
				
				if(referencedElementText != ""){
					//Add referenceId
					referencedElementText = andiLaser.createLaserTarget(attribute,referencedId,referencedElementText);
				}
				
				//headers
				if(attribute == "headers" && !$(referencedElement).is("th")){
					//referenced element is not a th
					if($(referencedElement).is("td")){
						splitMessage = alert_0067.message.split("||");
						message = splitMessage[0] + idsArray[x] + splitMessage[1];
						andiAlerter.throwAlert(alert_0067,message);
					}
					else{
						splitMessage = alert_0066.message.split("||");
						message = splitMessage[0] + idsArray[x] + splitMessage[1];
						andiAlerter.throwAlert(alert_0066,message);
					}
				}
			}
			else{
				//No, this id was not found, add to list.
				alert_0065.list += idsArray[x] + " "; //will be used if more than one idrefs missing
				alert_0063.list = idsArray[x]; //will be used if only one idref missing
			}
			
			//Add to accumulatedText
			accumulatedText += referencedElementText + " ";
		}
		//Check if any ids were not found
		if(alert_0065.list!=""){
			var missingIdsList = $.trim(alert_0065.list).split(" ");
			if(missingIdsList.length > 1){//more than one id missing; Possible misuse
				splitMessage = alert_0065.message.split("||");
				message = splitMessage[0] + attribute + splitMessage[1] + $.trim(alert_0065.list) + splitMessage[2];
				andiAlerter.throwAlert(alert_0065,message);
				alert_0063.list = ""; //reset the other list
			}
			else{//only one id missing
				splitMessage = alert_0063.message.split("||");
				message = splitMessage[0] + attribute + splitMessage[1] + alert_0063.list + splitMessage[2];
				andiAlerter.throwAlert(alert_0063,message);
				alert_0065.list = ""; //reset the other list
			}
		}
		return $.trim(accumulatedText);
	}
	
	//This function will calculate the output and store it to this.nameDescription
	//This function does not have to be called to get the output.
	//It is used when the output needs to be calculated and displayed before inspection.
	this.preCalculateNameDescription = function(){

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

		//This function checks if text is not empty
		function has(componentText){
			if(componentText == undefined || componentText == "" || componentText == AndiCheck.emptyString)
				return false;
			else
				return true;
		}
	};
	
	//This function will call each component grab.
	//Parameters:
	//	elementIsChild:	when true, the child's innerText will not overwrite the parent's innerText
	this.grabComponents = function(element,elementIsChild){
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
		this.legend = 			this.grab_legend(element);
		
		this.grab_addOnProperties(element);
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
	this.tabbable = true;
	
	//Variables used to ignore certain components in the output calculation
	this.ignoreLabel = false;
	this.ignoreLegend = false;
	this.ignoreCaption = false;
	this.ignoreFigcaption = false;
	this.ignoreAlt = false;

	this.tagName = this.grab_tagName(element);
	
	this.subtree = "";
	this.subtreeText = "";
	this.imageSrc = ""
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
	this.legend = "";
	
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
		caption: 		this.caption,
		figcaption: 	this.figcaption,
		legend: 		this.legend,
		subtree:		this.subtree,
		
		placeholder:	this.placeholder,
		imageSrc:		this.imageSrc,
		tagName:		this.tagName,
		scope:			this.scope,
		headers:		this.headers,
		
		namerFound:		this.namerFound,
		describerFound:	this.describerFound,
		tabbable:		this.tabbable,
		
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
	if(andiAlerter.dangers.length>0){
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
	this.commonFocusableElementChecks = function(andiData,element){
		this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined();
		this.areAnyComponentsEmpty();
		this.areThereAnyMisspelledAria(element);
		this.areThereAnyDuplicateIds(element);
		this.areThereAnyDuplicateFors(element);
		this.areThereAnyTroublesomeJavascriptEvents(element);
	};
	
	//This function is used to check for alerts related to non-focusable elements
	this.commonNonFocusableElementChecks = function(andiData,element,elementMustHaveName){
		if(elementMustHaveName)
			this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined();
		this.areAnyComponentsEmpty();
		this.areThereAnyMisspelledAria(element);
		this.areThereAnyDuplicateIds(element);
		this.areThereAnyMouseEventsWithoutKeyboardAccess(element);
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
		var testPage = $("#ANDI508-testPage");
		
		//legend/fieldset
		parents = $(testPage).find("fieldset").filter(":visible").length*1; //*1 ensures that the var will be a number
		children = $(testPage).find("legend").filter(":visible").length*1; //*1 ensures that the var will be a number
		if(children > parents) andiAlerter.throwAlert(alert_0074,alert_0074.message+"<br />[Legends: "+children+"] [Fieldsets: "+parents+"].",0);
		if(parents>0) testPageData.page_using_fieldset = true;
		
		//figcaption/figure
		parents = $(testPage).find("figure").filter(":visible").length*1; //*1 ensures that the var will be a number
		children = $(testPage).find("figcaption").filter(":visible").length*1; //*1 ensures that the var will be a number
		if(children > parents) andiAlerter.throwAlert(alert_0075,alert_0075.message+"<br />[Figcaptions: "+children+"] [Figures: "+parents+"].",0);
		if(parents>0) testPageData.page_using_figure = true;
		
		//caption/table
		if(TestPageData.page_using_table){
			parents = $(testPage).find("table").filter(":visible").length*1; //*1 ensures that the var will be a number
			children = $(testPage).find("caption").filter(":visible").length*1; //*1 ensures that the var will be a number
			if(children > parents) andiAlerter.throwAlert(alert_0076,alert_0076.message+"<br />[Captions: "+children+"] [Tables: "+parents+"].",0);
		}
	};
	
	//This function checks to see if there is only one page <title> tag within the head
	//If none, empty, or more than one, it will generate an alert.
	//It also looks at document.title
	this.isThereExactlyOnePageTitle = function(){
		var pageTitleCount = $("head title").length;
		if(document.title == ''){ //check document.title because could have been set by javascript 
			if(pageTitleCount == 0)
				andiAlerter.throwAlert(alert_0072,alert_0072.message,0);
			else if(pageTitleCount == 1 && $.trim($("head title").text())=='')
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
			for(x=0; x<additionalComponents.length; x++){
				if((additionalComponents[x] !== undefined) && ($.trim(additionalComponents[x]) != ""))
					additionalComponentsFound++;
			}
			total += additionalComponentsFound;
		}
		//Display total
		$("#ANDI508-accessibleComponentsTotal").html(total);
		
		if(total == 0){//Not components. Display message in table
			var alertType = "danger"; //tabbable elements with no components, default to red
			if(!elementData.tabbable)
				alertType = "caution"; //non-tabbable elements with no components, default to yellow
			$(accessibleComponentsTable)
				.children("tbody").first()
				.html("<tr><th id='ANDI508-accessibleComponentsTable-noData' class='ANDI508-display-"
						+alertType+"'>No accessibility markup found for this Element.</th></tr>");
			return false;
		}
		else{//There are components, prepare/empty the table
			$(accessibleComponentsTable).children("tbody").children("tr").remove(); //Remove previous table contents
			return true;
		}
	};

	//This function will throw alert_0001 depending on the tagName passed
	this.wasAccessibleNameFound = function(elementData){
		if(/*elementData.tabbable &&*/ !elementData.namerFound && !elementData.describerFound && !elementData.subtree){
			var tagNameText = elementData.tagName;
			var message;
			//Is this an input element, excluding input[image]?
			if(tagNameText.includes("input") && tagNameText != 'input[image]'){
				switch(tagNameText){
				case 'input[text]':
					message = "Text box"+alert_0001.message; break;
				case 'input[radio]':
					message = "Radio Button"+alert_0001.message; break;
				case 'input[checkbox]':
					message = "Checkbox"+alert_0001.message; break;
				default:
					message = "Input Element"+alert_0001.message;
				}
			}
			//All other elements:
			else switch(tagNameText){
				case 'a':
					if(elementData.imageSrc)
						message = "Image Link"+alert_0003.message; //It's a link containing an image.
					else
						message = "Link"+alert_0002.message;
					break;
				case 'img':
				case 'input[image]':
					message = "Image"+alert_0003.message;
					break;
				case 'button':
					message = "Button"+alert_0002.message; break;
				case 'select':
					message = "Select"+alert_0001.message; break;
				case 'textarea':
					message = "Textarea"+alert_0001.message; break;
				case 'table':
					message = alert_0004.message; break;
				case 'figure':
					message = alert_0005.message; break;
				case 'th':
				case 'td':
					message = "Table Cell"+alert_0002.message; break;
				default:
					message = "Element"+alert_0002.message;
			}
			//If element has placeholder and there no accessible name, throw alert_0006
			if(elementData.placeholder && message)
				andiAlerter.throwAlert(alert_0006);
			//Element has no accessible name and no placeholder
			else
				andiAlerter.throwAlert(alert_0001,message);
		}
	};

	//This function will search the test page for elements with duplicate ids.
	//If found, it will generate an alert
	this.areThereAnyDuplicateIds = function(element){
		var id = $.trim($(element).prop('id'));
		if(id && testPageData.allIds.length>1){
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (x=0; x<testPageData.allIds.length; x++){
				if(id === testPageData.allIds[x].id){
					idMatchesFound++;
					if(idMatchesFound==2) break; //duplicate found so stop searching, for performance
				}
			}
			if(idMatchesFound>1){
				//Duplicate Found
				var message = alert_0011.message+"["+id+"].";
				andiAlerter.throwAlert(alert_0011,message);
			}
		}
	};

	//This function will search the html body for labels with duplicate 'for' attributes
	//If found, it will throw alert_0012 with a link pointing to the ANDI highlighted element with the matching id.
	this.areThereAnyDuplicateFors = function(element){
		if(testPageData.page_using_label){
			var id = $.trim($(element).prop('id'));
			if(id && testPageData.allFors.length>1){
				var forMatchesFound = 0;
				for (x=0; x<testPageData.allFors.length; x++){
					if(id === $.trim($(testPageData.allFors[x]).attr('for'))){
						forMatchesFound++;
						if(forMatchesFound==2) break; //duplicate found so stop searching, for performance
					}
				}
				if(forMatchesFound>1){
					//Duplicate Found
					var message = alert_0012.message+"["+id+"].";
					andiAlerter.throwAlert(alert_0012,message);
				}
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
		if(events!=""){
			var message = alert_0112.message+$.trim(events);
			andiAlerter.throwAlert(alert_0112,message);
		}
	};

	//This function will search for misspelled aria attributes and throw an alert if found.
	this.areThereAnyMisspelledAria = function(element){
		//TODO: eliminate some of these uncommon ones to improve performance
		searchForMisspelledAria("aria-labeledby",	element);
		searchForMisspelledAria("arialabelledby",	element);
		searchForMisspelledAria("labelledby",		element);
		searchForMisspelledAria("ariadescribedby",	element);
		searchForMisspelledAria("describedby",		element);
		searchForMisspelledAria("arialabel",		element);
		searchForMisspelledAria("aria-role",		element);
		
		function searchForMisspelledAria(misspelling,element){
			if($(element).is('['+misspelling+']')){
				//misspelling found
				if(misspelling=='aria-role'){//intending to use role
					andiAlerter.throwAlert(alert_0032);
				}
				else{//all other misspellings
					alert_0031.list += " ["+misspelling+"]";//add to list
				}
			}
		}
		if(alert_0031.list!=""){
			var message = alert_0031.message+alert_0031.list+".";
			andiAlerter.throwAlert(alert_0031,message);
		}
	};
	
	//This function will generate an alert if it finds javascript mouse events on an element that has no keyboard access
	this.areThereAnyMouseEventsWithoutKeyboardAccess = function(element){
		//Does this element have a focusable ancestor
		if($(element).closest('.ANDI508-element').length < 1){
			//No, Element has no keyboard access
			var mouseEvents = "";
			if($(element).is('[onmouseover]')) 		mouseEvents += "onMouseOver ";
			if($(element).is('[ondblclick]'))		mouseEvents += "onDblClick ";
			//Commented these out because it's a performance hit to check them all. Stick to the most common
			//if($(element).is('[onmouseout]'))		mouseEvents += "onMouseOut ";
			//if($(element).is('[onmouseenter]')) 	mouseEvents += "onMouseEnter ";
			//if($(element).is('[onmouseleave]')) 	mouseEvents += "onMouseLeave ";
			//if($(element).is('[onmousemove]')) 	mouseEvents += "onMouseMove ";
			//if($(element).is('[onmouseup]'))		mouseEvents += "onMouseUp ";
			if(mouseEvents!="")
				andiAlerter.throwAlert(alert_0111,alert_0111.message+"["+$.trim(mouseEvents)+"]",0);
		}
	};
	
	//This function will throw alert_0051 if the element has an accesskey but cannot gain focus.
	this.areThereAccesskeysThatMightNotGetVisualFocus = function(element){
		if($(element).is('[accesskey]')){
			var accesskey = $.trim($(element).attr("accesskey").toUpperCase());
			var key = "[" + accesskey + "]";
			andiAlerter.throwAlert(alert_0051,alert_0051.message+key+".",0);
			testPageData.addToAccessKeysList(accesskey,0,alert_0051);
		}
	};
	
	//This function will scan for deprecated HTML relating to accessibility associated with the element 
	this.detectDeprecatedHTML = function(element){
		if(document.doctype !== null && document.doctype.name == 'html' && !document.doctype.publicId && !document.doctype.systemId){
			var message;

			if($(element).is("table") && $(element).attr("summary")){
				if($(element).attr('role')!='presentation'){
					message = alert_0078.message+"attribute 'summary' in &lt;table&gt;, use &lt;caption&gt; instead.";
				}
			}
			else if($(element).is("a") && $(element).attr("name")){
				message = alert_0078.message+"attribute 'name' in &lt;a&gt;, use 'id' instead.";
			}
			else if($(element).is("td") && $(element).attr("scope")){
				message = alert_0078.message+"attribute 'scope' on &lt;td&gt;, scope is only a property of &lt;th&gt; in HTML5.";
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
		if(alert_0101.list!=''){
			var message = alert_0101.message+alert_0101.list;
			andiAlerter.throwAlert(alert_0101,message);
		}
	};
	//This function will compare components that shouldn't be combined.
	//Parameters:
	//	componentToTestAgainst: Component to test against
	//	spaceDelimitedListOfComponents: List of components (space delimited) that shouldn't be combined with componentToTestAgainst.
	//									Will test against aria-label aria-labelledby aria-describedby title
	//	andiData:	AndiData object
	this.improperCombination = function(componentToTestAgainst,spaceDelimitedListOfComponents,andiData){
		var improperCombinationFoundList = "";
		var components = spaceDelimitedListOfComponents.split(" ");
		for(x = 0; x < components.length; x++){
			switch(components[x]){
			case "aria-label":
				if(andiData.ariaLabel && andiData.ariaLabel!=AndiCheck.emptyString)
					improperCombinationFoundList+=components[x]+" "; break;
			case "aria-labelledby":
				if(andiData.ariaLabelledby && andiData.ariaLabelledby!=AndiCheck.emptyString)
					improperCombinationFoundList+=components[x]+" "; break;
			case "aria-describedby":
				if(andiData.ariaDescribedby && andiData.ariaDescribedby!=AndiCheck.emptyString)
					improperCombinationFoundList+=components[x]+" "; break;
			case "title":
				if(andiData.title && andiData.title!=AndiCheck.emptyString)
					improperCombinationFoundList+=components[x]+" "; break;
			}
		}
		if(improperCombinationFoundList != ""){
			alert_0101.list += "[" + componentToTestAgainst + ": " + $.trim(improperCombinationFoundList) + "]";
		}
	};
	
	//This function will add the component to the empty component list 
	this.addToEmptyComponentList = function(component){
		alert_0131.list += " " + component;
		return AndiCheck.emptyString;
	};
	//This function generates an alert_0131 if the alert_0131.list is not empty
	this.areAnyComponentsEmpty = function(){
		if(alert_0131.list!=''){
			var message = alert_0131.message+alert_0131.list+".";
			andiAlerter.throwAlert(alert_0131,message);
		}
	};
		
	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//Returns true if the limit was exceeded.
	this.checkCharacterLimit = function(componentText,alertObject){
		if(componentText.length > AndiCheck.characterLimiter){
			andiAlerter.throwAlert(alertObject);
			return true;
		}
		return false;
	};
	//This function inserts a pipe character into the componentText at the characterLimiter position
	//The color of the pipe is the color of a warning
	this.insertCharacterLimitMark = function(componentText){
		var returnThis = andiUtility.formatForHtml(componentText.substring(0, AndiCheck.characterLimiter))
						+ "<span class='ANDI508-display-warning'>|</span>"
						+ andiUtility.formatForHtml(componentText.substring(AndiCheck.characterLimiter,componentText.length));
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
	//	customIndex: 	(optional) pass in 0 if this cannot be linked to an element.  If not passed will use andiElementIndex
	this.throwAlert = function(alertObject,customMessage,customIndex){
		if(alertObject){
			var message = messageWithIcon(alertObject,customMessage);
			var index = "";
			if(customIndex !== undefined)
				index = customIndex; //use custom message, typically 0, meaning do not attach a link
			else{
				index = testPageData.andiElementIndex; //use current andiElementIndex
				switch(alertObject.type){
				//Add the alert to the output text (push the alert onto the array)
				case "danger":
					this.dangers.push(messageWithHelpLink(alertObject,message)); break; //add to the dangers object
				case "warning":
					this.warnings.push(messageWithHelpLink(alertObject,message)); break; //add to the warnings object
				case "caution":
					this.cautions.push(messageWithHelpLink(alertObject,message)); break; //add to the cautions object
				}
			}
			this.addToAlertsList(alertObject,message,index);
			
			if(alertObject.alertButton)
				this.addAlertButton(alertObject);
			
			alertObject.list = "";//reset list to empty
		}
	};
	
	//This function will add an alert button to an alert group
	//TODO: make private
	this.addAlertButton = function(alertObject){
		var alertGroupHeading = $("#ANDI508-alertGroup_"+alertObject.group).children("h4").first();
		if($(alertGroupHeading).find("button").length==0){
			$(alertGroupHeading).append("<button title='"+alertObject.alertButton.title+"' id='"+alertObject.alertButton.id+"'>"+alertObject.alertButton.label + alertObject.alertButton.overlayIcon+"</button>");
			$("#"+alertObject.alertButton.id).click(function(){
				alertObject.alertButton.clickLogic();
			});
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
	this.throwAlertOnOtherElement = function(index,alertObject,customMessage){
		var message = messageWithIcon(alertObject,customMessage);
		switch(alertObject.type){
		//Add the alert to the output text (push the alert onto the array)
		case "danger":
			$("#ANDI508-testPage [data-ANDI508-index="+index+"]").data("ANDI508").dangers.push(messageWithHelpLink(alertObject,message)); break; //add to the dangers object
		case "warning":
			$("#ANDI508-testPage [data-ANDI508-index="+index+"]").data("ANDI508").warnings.push(messageWithHelpLink(alertObject,message)); break; //add to the warnings object
		case "caution":
			$("#ANDI508-testPage [data-ANDI508-index="+index+"]").data("ANDI508").cautions.push(messageWithHelpLink(alertObject,message)); break; //add to the cautions object
		}
		this.addToAlertsList(alertObject,message,index);
	};
	
	//This private function will add an icon to the message
	//Parameters
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	function messageWithIcon(alertObject,customMessage){
		var message = "<img alt='"+alertObject.type+": ' src='"+icons_url+alertObject.type+".png' />";
		if(customMessage !== undefined)
			message += customMessage; //use custom message
		else
			message += alertObject.message; //use default alert message
		return message;
	}
	
	//This private function will add a help link to the alert message
	function messageWithHelpLink(alertObject,message){
		return "<a href='"+ help_url + "alerts.html" + alertObject.info +"' target='_ANDIhelp'>"
				+message
				+" <span class='ANDI508-screenReaderOnly'>, Open Alerts Help</span></a> ";
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
		var listItemHtml = "<li class='ANDI508-display-"+alertObject.type+"'><a href='#' tabindex='-1' ";
		if(elementIndex != 0){
			//Yes, this alert should point to a focusable element. Insert as link:
			listItemHtml += " data-ANDI508-relatedIndex='"+elementIndex+"'>"+message+" <span class='ANDI508-screenReaderOnly'>Element #"+elementIndex+"</span></a></li>";
		}
		else
			//No, This alert is not specific to one element. Insert message without link.
			listItemHtml += ">"+message+"</a></li>";
		//Is this alert associated with an alertGroup?
		$("#ANDI508-alertGroup_"+alertObject.group).children("ol.ANDI508-alertGroup-list").first().append(listItemHtml);
		AndiAlerter.alertGroups[alertObject.group].count++;
		testPageData.numberOfAccessibilityAlertsFound++;
	};
	
	//This function will update the ANDI508-alerts-list.
	this.updateAlertList = function(){
		if(testPageData.numberOfAccessibilityAlertsFound>0){
			//Yes. Accessibility alerts were found.
			$("#ANDI508-numberOfAccessibilityAlerts").children("span.ANDI508-total").first().html(testPageData.numberOfAccessibilityAlertsFound);
			
			//Update the Alert Group Totals
			var alertGroup;

			for(x=0; x<AndiAlerter.alertGroups.length; x++){
				alertGroup = $("#ANDI508-alertGroup_"+AndiAlerter.alertGroups[x].groupID);
				if(AndiAlerter.alertGroups[x].count>0)
					$(alertGroup).show().find("span.ANDI508-total").first().html(AndiAlerter.alertGroups[x].count);
				else
					$(alertGroup).hide();
			}
			
			//Remove Unused Alert Types
			$("#ANDI508-alerts-container-scrollable ul").each(function(){
				if(!$(this).html())
					$(this).remove();
			});
			$("#ANDI508-alerts-list").show();
			
			this.addAlertListFunctionality();
		}
	};
	
	//This function defines the functionality of the Alert List
	//It adds key navigation: down, up, left, right, enter, asterisk, home, end,
	//Also adds mouse clickability
	var alertLinksTabbableArray;
	this.addAlertListFunctionality = function(){
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
					if($(this).hasClass("ANDI508-alertGroup-toggler") && $(this).parent().next().css("display")=="none")
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
			//TODO: can this be made faster, maybe using .filter?
			$("#ANDI508-alerts-container-scrollable a:tabbable").each(function(){
				alertLinksTabbableArray.push(this);
			});
		}
		
		//This function toggles the alertGroup display
		function toggleAlertGroupList(trigger){
			var groupListContainer = $(trigger).parent().next();
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
	
	this.dangers = [];
	this.warnings = [];
	this.cautions = [];
	
	this.reset = function(){
		this.dangers = [];
		this.warnings = [];
		this.cautions = [];
	};
}
//This defines the class AlertGroup
function AlertGroup(type, groupID, heading, count){
	this.type = type;		//danger, warning, or caution
	this.groupID = groupID;	//the alerts will refer to this id
	this.heading = heading;	//heading text for the group
	this.count = count = 0; //total number of alerts within this group
}

//This defines the class AlertButton
function AlertButton(label, id, title, clickLogic, overlayIcon){
	this.label = label; //button's innerText
	this.id = id;		//button's id
	this.title = title; //button's initial title attribute
	this.clickLogic = clickLogic; //buttons clicklogic
	this.overlayIcon = overlayIcon; //if button should contain overlayIcon, pass in overlayIcon. else pass in empty string ""
}

//This class is used to store temporary variables for the test page
function TestPageData(){
		
	//Will store all the ids and fors of visible elements on the page for duplicate comparisons
	this.allIds = "";
	this.allFors = "";
	
	//Keeps track of accesskeys
	this.accesskeysListHtml = "";
	
	//Keeps track of the number of focusable elements ANDI has found, used to assign unique indexes.
	//the first element's index will start at 1.
	//When ANDI is done analyzing the page, this number will equal the total number of elements found.
	this.andiElementIndex = 0;

	//Keeps track of the number of accessibility alerts found.
	this.numberOfAccessibilityAlertsFound = 0;
	
	//Accesskeys will be stored here and checked against
	this.accesskeysListDuplicateComparator = "";
	
	var testPage = $("#ANDI508-testPage");
	this.allIds = $(testPage).find("[id]").filter(':visible'); //Can be heavy on performance

	//Booleans which will be set if the associated tags are found. Helps with performance.
	this.page_using_figure = false;
	this.page_using_fieldset = false;
	
	//Get all fors on the page and store for later comparison
	//Determine if labels are being used on the page
	this.page_using_label = false;
	if($(testPage).find("label").filter(":visible").length*1>0){
		this.page_using_label = true;
		//get all 'for's on the page and store for later comparison
		this.allFors = $('[for]').filter(':visible');
	}
	
	if($(testPage).find("table").filter(':visible').first().length){
		AndiModule.enableModuleButton("t"); //tANDI
		TestPageData.page_using_table = true;
	}
	else
		AndiModule.disableModuleButton("t");

	if($(testPage).find("a").first().length){
		AndiModule.enableModuleButton("l"); //lANDI
	}
	else
		AndiModule.disableModuleButton("l");
	
	if($(testPage).find("img").first().length){
		TestPageData.page_using_images = true;
		AndiModule.enableModuleButton("g"); //gANDI
	}
	else if(!TestPageData.page_using_images){
		AndiModule.disableModuleButton("g");
	}
	
	//This function checks for background images, input[image], and area to enable gANDI
	this.hasImageCheck = function(element){
		if(!TestPageData.page_using_images && 
			( $(element).css("background-image").includes("url(") || $(element).is("input:image") || $(element).is("area")) )
		{
			TestPageData.page_using_images = true;
			AndiModule.enableModuleButton("g"); //gANDI
		}
	};
	
	//This function should be called by the first module that is launched
	//It should be placed in a loop that looks at every visible element on the page.
	this.firstLaunchedModulePrep = function(element){
		
		//Force Test Page to convert any css fixed positions to absolute.
		//Allows ANDI to be only fixed element at top of page.
		andiResetter.storeTestPageFixedPositionDistances(element);
		
		//Check if this page has images.
		this.hasImageCheck(element);
	};
}
//This public function will add an accesskey link to the accesskeyList
TestPageData.prototype.addToAccessKeysList = function(accesskey,elementIndex,alertObject){
	//TODO: insert in alphabetical order
	accesskey = accesskey.toUpperCase();
	var addClass = "";
	var titleText = "";
	if(alertObject){
		addClass = "class='ANDI508-display-"+alertObject.type+"'";
		titleText = alertObject.type+": "+alertObject.message+accesskey;
	}
	else
		titleText = "AccessKey "+accesskey+" found, focus on element";
	
	if(elementIndex==0)
		this.accesskeysListHtml += "<span tabindex='0' "+addClass+" title='"+ titleText +"'>"+accesskey+"</span> ";
	else
		this.accesskeysListHtml += "<a href='#' data-ANDI508-relatedIndex='"+elementIndex+"' title='"+ titleText +"'><span "+addClass+">"+accesskey+"</span></a> ";
	this.accesskeysListDuplicateComparator += accesskey;
};
//These variables store whether the testPage is using certain elements.
//It will not be reset when TestPageData is reinstantiated.
TestPageData.page_using_images = false;
TestPageData.page_using_table = false;

//==============//
// jQuery Load: //
//==============//
//This function will check to see if the page being tested already has jquery installed. 
//If not, it downloads the appropriate version from the jquery download source.
//It will also determine if an old IE version is being used
var jqueryPreferredVersion = "3.2.1"; //The preferred (latest) version of jQuery we want
var jqueryMinimumVersion = "1.9.1"; //The minimum version of jQuery we allow ANDI to use
var jqueryDownloadSource = "https://ajax.googleapis.com/ajax/libs/jquery/"; //where we are downloading jquery from
var oldIE = false; //used to determine if old version of IE is being used.
(function(){
	if (window.jQuery === undefined || window.jQuery.fn.jquery < jqueryMinimumVersion){//Need jQuery
		var script=document.createElement("script"); var done=false;
		//Which version is needed?
		if(document.addEventListener){ script.src = jqueryDownloadSource + jqueryPreferredVersion + "/jquery.min.js";}//IE 9 or later is being used, download preferred jquery version.
		else{oldIE = true; script.src = jqueryDownloadSource + jqueryMinimumVersion + "/jquery.min.js";}//Download minimum jquery version.
		//Waits until jQuery is ready before running ANDI
		script.onload = script.onreadystatechange = function(){if(!done && (!this.readyState || this.readyState=="loaded" || this.readyState=="complete")){done=true; launchAndi();}};
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	else{ //jQuery already exists
		launchAndi(); //initialize ANDI
	}
})();
