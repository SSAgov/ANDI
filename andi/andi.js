//=============================================//
//ANDI: Accessible Name & Description Inspector//
//Created By Social Security Administration    //
//=============================================//
var andiVersionNumber = "28.0.10";

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

//List of valid aria roles from: https://www.w3.org/TR/core-aam-1.1/#mapping_role
AndiCheck.validAriaRoles = ["alert","alertdialog","application","article","banner","button","cell","checkbox","columnheader","combobox","complementary","contentinfo","definition","dialog","directory","document","feed","figure","form","grid","gridcell","group","heading","img","link","list","listbox","listitem","log","main","marquee","math","menu","menubar","menuitem","menuitemcheckbox","menuitemradio","navigation","none","note","option","presentation","progressbar","radio","radiogroup","region","row","rowgroup","rowheader","scrollbar","search","searchbox","separator","slider","spinbutton","status","switch","tab","table","tablist","tabpanel","term","textbox","timer","toolbar","tooltip","tree","treegrid","treeitem"];

//Set the global animation speed
AndiSettings.andiAnimationSpeed = 50; //milliseconds

//The element highlights setting (true = on, false = off)
AndiSettings.elementHighlightsOn = true;

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
	svg: typeof SVGRect !== "undefined",
	isIE: /MSIE|Trident/.test(window.navigator.userAgent)
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
		if(confirm("ANDI has detected frames:\nPress OK to stay on the page.\nPress Cancel to test an individual frame.") !== true){
			var oldLocation = document.location;
			var framesSelectionHead = "<head><title>ANDI Frame Selection</title><style>body{margin-left:1em;}*{font-family:Verdana,Sans-Serif;font-size:12pt}h1{font-weight:bold;font-size:20pt}h2{font-weight:bold;font-size:13pt}li{margin:7px}a{font-family:monospace;margin-right:8px}</style></head>";
			var framesSelectionBody = "<h1 id='ANDI508-frameSelectionUI'>ANDI</h1><p>This page uses frames. The page title is: '"+document.title+"'.<br /><br />Each frame must be tested individually. Select a frame from the list below, then launch ANDI.</p><h2>Frames:</h2><ol>";
			var title, titleDisplay, framesrc;
			$("frame").each(function(){
				//Build Title Display
				title = $(this).attr("title");
				framesrc = $(this).attr("src");
				titleDisplay = (!title) ? " <span style='color:#c4532c'><img style='width:18px' src='"+icons_url+"danger.png' alt='danger: ' /> No title attribute on this &lt;frame&gt;.</span>" : " <span style='color:#058488'>title=\""+ title + "\"</span>";
				framesSelectionBody += "<li><a href='"+framesrc+"'>"+framesrc+"</a>"+titleDisplay+"</li>";
			});
			framesSelectionBody += "</ol><button id='ANDI508-frameSelectionUI-goBack'>Go Back</button>";
			$("frameset").remove();
			$("html head").html(framesSelectionHead);
			$("html").append(document.createElement("body"));
			$("html body").append(framesSelectionBody);
			$("#ANDI508-frameSelectionUI-goBack").click(function(){ document.location = oldLocation; });
		}
		else{//Reload the test page so that the ANDI files that were added are removed.
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
	var moduleName = document.getElementById("ANDI508-module-name");
	$(moduleName).attr("data-andi508-moduleversion",moduleLetter+"ANDI: "+moduleVersionNumber);
	if(moduleLetter == "f"){
		$(moduleName).html("&nbsp;"); //do not display default module letter
		document.getElementById("ANDI508-toolName-link").setAttribute("aria-label", "andi "+andiVersionNumber); //using setAttribute because jquery .attr("aria-label") is not recognized by ie7
	}
	else{
		$(moduleName).html(moduleLetter);
		document.getElementById("ANDI508-toolName-link").setAttribute("aria-label", moduleLetter+"andi "+moduleVersionNumber); //using setAttribute because jquery .attr("aria-label") is not recognized by ie7
		//Append module's css file. The version number is added to the href string (?v=) so that when the module is updated, the css file is reloaded and not pulled from browser cache
		$("head").append("<link id='andiModuleCss' href='"+host_url+moduleLetter+"andi.css?v="+moduleVersionNumber+"' type='text/css' rel='stylesheet' />");
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

	//Set Default Module function logic
	AndiModule.hoverability = function(event){
		//check for holding shift key or if element is excluded from inspection for some reason
		if(!event.shiftKey && !$(this).hasClass("ANDI508-exclude-from-inspection"))
			AndiModule.inspect(this);
	};
	AndiModule.focusability = function(){
		andiLaser.eraseLaser();
		AndiModule.inspect(this);
		andiResetter.resizeHeights();
	};
	AndiModule.cleanup = function(){}; //Cleanup does nothing by default

	//Previous Element Button - modules may overwrite this
	//Instantiating a module will reset any overrides
	$("#ANDI508-button-prevElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
		if(isNaN(index)) //no active element yet
			index = 2; //begin at first element (this number will be subtracted in the loop)
		else if(index == 1)
			index = testPageData.andiElementIndex + 1; //loop back to last element

		//Find the previous element with data-andi508-index
		//Skips over elements that have become hidden, removed from DOM, or excluded from inspection for some reason
		for(var x=index, prev; x>0; x--){
			prev = $("#ANDI508-testPage [data-andi508-index='"+(x - 1)+"']");
			if($(prev).length && $(prev).is(":visible") && !$(prev).hasClass("ANDI508-exclude-from-inspection")){
				andiFocuser.focusByIndex(x - 1);
				break;
			}
		}
	});

	//Next Element Button - modules may overwrite this
	//Instantiating a module will reset any overrides
	$("#ANDI508-button-nextElement").off("click").click(function(){
		var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

		if(index == testPageData.andiElementIndex || isNaN(index)) //if active is last or not established yet
			index = 0; //begin at first element

		//Find the next element with data-andi508-index
		//Skips over elements that have become hidden, removed from DOM, or excluded from inspection for some reason
		for(var x=index, next; x<testPageData.andiElementIndex; x++){
			next = $("#ANDI508-testPage [data-andi508-index='"+(x + 1)+"']");
			if($(next).length && $(next).is(":visible") && !$(next).hasClass("ANDI508-exclude-from-inspection")){
				andiFocuser.focusByIndex(x + 1);
				break;
			}
		}
	});
}
//Each module may implement these public methods
AndiModule.prototype.hoverability = undefined;
AndiModule.prototype.focusability = undefined;
AndiModule.prototype.inspect = undefined;
AndiModule.prototype.cleanup = undefined;

//The modules will keep track of the pressed action buttons using this variable.
//When the module is refreshed, the buttons remain pressed.
//If a different module is selected, the buttons will be unpressed.
AndiModule.activeActionButtons = {};
//This function will initialize the activeActionButtons
AndiModule.initActiveActionButtons = function(buttonsObject){
	if($.isEmptyObject(AndiModule.activeActionButtons)){
		AndiModule.activeActionButtons = buttonsObject;
	}
};
//This function will click any of the activeActionButtons in the buttonsArray that are set to true
AndiModule.engageActiveActionButtons = function(buttonsArray){
	for(var b=0; b<buttonsArray.length; b++){
		if(AndiModule.activeActionButtons[buttonsArray[b]])
			$("#ANDI508-"+buttonsArray[b]+"-button").click();
	}
};

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
			.addClass(module+"ANDI508-testPage");

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
}
//Define Alerts used by all modules
var alert_0001 = new Alert("danger","0"," has no accessible name, associated &lt;label&gt;, or [title].","no_name_form_element");
var alert_0002 = new Alert("danger","0"," has no accessible name, innerText, or [title].","no_name_generic");
var alert_0003 = new Alert("danger","0"," has no accessible name, [alt], or [title].","no_name_image");
var alert_0004 = new Alert("danger","0","Table has no accessible name, &lt;caption&gt;, or [title].","no_name_table");
var alert_0005 = new Alert("danger","0","Figure has no accessible name, &lt;figcaption&gt;, or [title].","no_name_figure");
var alert_0007 = new Alert("danger","0","Iframe has no accessible name or [title].","no_name_iframe");
var alert_0008 = new Alert("danger","0"," has no accessible name.","no_name_generic");
var alert_0009 = new Alert("warning","0","Iframe has no accessible name or [title].","no_name_iframe");

var alert_0011 = new Alert("danger","1","%%%; element ids should be unique.","dup_id",
							new AlertButton("show ids", "ANDI508-alertButton-duplicateIdOverlay", function(){andiOverlay.overlay_duplicateIds();}, overlayIcon));
var alert_0012 = new Alert("danger","1","More than one &lt;label[for=%%%]&gt; associates with this element [id=%%%].","dup_for");

var alert_0021 = new Alert("warning","2","[aria-describedby] should be used in combination with a component that provides an accessible name.","dby_alone");
var alert_0022 = new Alert("danger","2","&lt;legend&gt; should be used in combination with a component that provides an accessible name.","legend_alone");

var alert_0031 = new Alert("danger","3","[aria-labeledby] is mispelled, use [aria-labelledby].","misspell");
var alert_0032 = new Alert("warning","3","'%%%' is an unsupported value for [role].","unsupported_role_value");
var alert_0033 = new Alert("caution","3","Element has multiple roles. Determine if sequence is acceptable.","multiple_roles");
var alert_0134 = new Alert("danger","3","[role=image] is invalid; Use [role=img].","role_image_invalid");

var alert_0041 = new Alert("warning","4","Presentation table has data table markup (%%%); Is this a data table?","pres_table_not_have");
var alert_0043 = new Alert("caution","4","Table has more than %%% levels of [scope=%%%].","too_many_scope_levels");
var alert_0045 = new Alert("danger","4","[headers] attribute only valid on &lt;th&gt; or &lt;td&gt;.","headers_only_for_th_td");
var alert_0046 = new Alert("danger","4","Table has no &lt;th&gt; cells.","table_has_no_th");
var alert_0047 = new Alert("warning","4","Scope association needed at intersection of &lt;th&gt;.","no_scope_at_intersection");
var alert_0048 = new Alert("caution","4","Table has no [scope] associations.","table_has_no_scope");
var alert_0049 = new Alert("danger","4","Table using both [scope] and [headers], may cause screen reader issues.","table_mixing_scope_and_headers");
var alert_004A = new Alert("danger","4","Table has no [headers/id] associations.","table_has_no_headers");
var alert_004B = new Alert("danger","4","Table has no [scope] but does have [headers], switch to 'headers/id mode'.","switch_table_analysis_mode");
var alert_004C = new Alert("danger","4","Table has no [headers/id] but does have [scope], switch to 'scope mode'.","switch_table_analysis_mode");
var alert_004E = new Alert("danger","4","Table has no &lt;th&gt; or &lt;td&gt; cells.","table_has_no_th_or_td");
var alert_004F = new Alert("danger","4","ARIA %%% has no %%% cells.","aria_table_grid_structure");
var alert_004G = new Alert("danger","4","ARIA %%% has no [role=columnheader] or [role=rowheader] cells.","aria_table_grid_structure");
var alert_004H = new Alert("danger","4","ARIA %%% has no [role=row] rows.","aria_table_grid_structure");
var alert_004I = new Alert("warning","4","&lt;table&gt; with [role=%%%] is not recognized as a data table.","table_nontypical_role");
var alert_004J = new Alert("warning","4","&lt;table[role=%%%]&gt; has %%% &lt;th&gt; cells missing columnheader or rowheader role.","header_missing_role");
var alert_004K = new Alert("warning","4","&lt;table[role=%%%]&gt; has %%% cells not contained by [role=row].","cells_not_contained_by_row_role");

var alert_0052 = new Alert("danger","5","[accessKey] value \"%%%\" has more than one character.","accesskey_more_one");
var alert_0054 = new Alert("danger","5","Duplicate [accessKey=%%%] found on button.","accesskey_duplicate");
var alert_0055 = new Alert("caution","5","Duplicate [accessKey=%%%] found.","accesskey_duplicate");
var alert_0056 = new Alert("danger","5","Duplicate [accessKey=%%%] found on link.","accesskey_duplicate");

var alert_0062 = new Alert("danger","6","[headers] attribute is referencing an element [id=%%%] external to its own table.","headers_ref_external");
var alert_0063 = new Alert("warning","6","Element referenced by [%%%] with [id=%%%] not found.","ref_id_not_found");
var alert_0065 = new Alert("danger","6","Improper use of [%%%] possible: Referenced ids \"%%%\" not found.","improper_ref_id_usage");
var alert_0066 = new Alert("danger","6","Element referenced by [headers] attribute with [id=%%%] is not a &lt;th&gt;.","headers_ref_not_th");
var alert_0067 = new Alert("warning","6","[headers] attribute is referencing a &lt;td&gt; with [id=%%%].","headers_ref_is_td");
var alert_0068 = new Alert("warning","6","Element\'s [headers] references provide no association text.","headers_refs_no_text");
var alert_0069 = new Alert("warning","6","In-page anchor target with [id=%%%] not found.","anchor_target_not_found");
var alert_006A = new Alert("danger","6","&lt;img&gt; referenced by image map %%% not found.","image_map_ref_not_found");
var alert_006B = new Alert("warning","6","[%%%] is referencing a legend which may cause speech verbosity.","ref_legend");
var alert_006C = new Alert("warning","6","[%%%] reference contains another [%%%] reference which won't be used for this Output.","ref_has_ref");
var alert_006D = new Alert("warning","6","[%%%] is directly referencing [id=%%%] multiple times which may cause speech verbosity.","ref_is_duplicate");
var alert_006E = new Alert("warning","6","[%%%] is directly and indirectly referencing [id=%%%] which may cause speech verbosity.","ref_is_direct_and_indirect");
var alert_006F = new Alert("warning","6","Element nested in &lt;label&gt; but label[for=%%%] does not match element [id=%%%].","nested_label_for_no_match");

var alert_0071 = new Alert("danger","7","Page &lt;title&gt; cannot be empty.","page_title_empty");
var alert_0072 = new Alert("danger","7","Page has no &lt;title&gt;.","page_title_none");
var alert_0073 = new Alert("warning","7","Page has more than one &lt;title&gt; tag.","page_title_multiple");
var alert_0074 = new Alert("danger","7","There are more legends (%%%) than fieldsets (%%%).","too_many_legends");
var alert_0075 = new Alert("danger","7","There are more figcaptions (%%%) than figures (%%%).","too_many_figcaptions");
var alert_0076 = new Alert("danger","7","There are more captions (%%%) than tables (%%%).","too_many_captions");
var alert_0077 = new Alert("danger","7","Tabindex value \"%%%\" is not a number.","tabindex_not_number");
var alert_0078 = new Alert("warning","7","Using HTML5, found deprecated %%%.","deprecated_html");
var alert_0079 = new Alert("danger","7","List item %%% is not contained by a list container %%%.","li_no_container");
var alert_007A = new Alert("danger","7","Description list item is not contained by a description list container &lt;dl&gt;.","dd_dt_no_container");
var alert_007B = new Alert("caution","7","This &lt;a&gt; element has [name=%%%] which is a deprecated way of making an anchor target; use [id].","deprecated_html_a_name");
var alert_007C = new Alert("warning","7","[scope=%%%] value is invalid; acceptable values are col, row, colgroup, or rowgroup.","scope_value_invalid");

var alert_0081 = new Alert("warning","8","[alt] attribute is meant for &lt;img&gt; elements.","alt_only_for_images");

var alert_0091 = new Alert("warning","9","Explicit &lt;label[for]&gt; only works with form elements.","explicit_label_for_forms");

var alert_0101 = new Alert("warning","10","Combining %%% may produce inconsistent screen reader results.","unreliable_component_combine");

var alert_0112 = new Alert("caution","11","JavaScript event %%% may cause keyboard accessibility issues; investigate.","javascript_event_caution");

var alert_0121 = new Alert("caution","12","Focusable element is not in keyboard tab order; should it be tabbable?","not_in_tab_order");
var alert_0122 = new Alert("caution","12","Focusable element is not in keyboard tab order and has no accessible name; should it be tabbable?","not_in_tab_order_no_name");
var alert_0123 = new Alert("warning","12","Iframe contents are not in keyboard tab order because iframe has negative tabindex.","iframe_contents_not_in_tab_order");
var alert_0124 = new Alert("warning","12","If &lt;canvas&gt; element is interactive with mouse, it's not keyboard accessible because there is no focusable fallback content.","canvas_not_keyboard_accessible");
var alert_0125 = new Alert("warning","12","Element with [role=%%%] not in the keyboard tab order.","role_tab_order");
var alert_0126 = new Alert("danger","12","Image defined as decorative is in the keyboard tab order.","decorative_image_tab_order");
var alert_0127 = new Alert("caution","12","&lt;canvas&gt; element has focusable fallback content; Test for keyboard equivalency to mouse functionality.","canvas_has_focusable_fallback");
var alert_0128 = new Alert("warning","12","&lt;a&gt; element has no [href], [id], or [tabindex]; This might be a link that only works with a mouse.","anchor_purpose_unclear");
var alert_0129 = new Alert("caution","12","&lt;a&gt; element has no [href], or [tabindex]; This might be a link that only works with a mouse.","anchor_purpose_unclear");
var alert_012A = new Alert("caution","12","This &lt;a&gt; element is the target of another link; When link is followed, target may not receive visual indication of focus.","is_anchor_target_no_focus");

var alert_0132 = new Alert("caution","13","Empty header cell.","empty_header_cell");
var alert_0133 = new Alert("caution","13","Live region has no innerText content.","live_region_empty");

var alert_0142 = new Alert("caution","14","Image is presentational; its [alt] will not be used in output.","image_alt_not_used");

var alert_0151 = new Alert("warning","15","[%%%] attribute length exceeds "+AndiCheck.characterLimiter+" characters; consider condensing.","character_length");

var alert_0161 = new Alert("warning","16","Ambiguous Link: same name/description as another link but different href.","ambiguous_link");
var alert_0162 = new Alert("caution","16","Ambiguous Link: same name/description as another link but different href.","ambiguous_link");//caution level thrown for internal links
var alert_0163 = new Alert("caution","16","Link text is vague and does not identify its purpose.","vague_link");
var alert_0164 = new Alert("warning","16","Link has click event but is not keyboard accessible.","link_click_no_keyboard_access");
var alert_0168 = new Alert("warning","16","&lt;a&gt; without [href] may not be recognized as a link; add [role=link] or [href].","not_recognized_as_link");

var alert_0171 = new Alert("danger","17","&lt;marquee&gt; element found, do not use.","marquee_found");
var alert_0172 = new Alert("danger","17","&lt;blink&gt; element found, do not use.","blink_found");
var alert_0173 = new Alert("danger","17","Server side image maps are not accessible.","server_side_image_map");
var alert_0174 = new Alert("caution","17","Redundant phrase in image [alt] text.","image_alt_redundant_phrase");
var alert_0175 = new Alert("warning","17","Image [alt] text contains file name.","image_alt_contains_file_name");
var alert_0176 = new Alert("danger","17","Image [alt] text is not descriptive.","image_alt_not_descriptive");
var alert_0177 = new Alert("caution","17","Ensure that background images are decorative.","ensure_bg_images_decorative");
var alert_0178 = new Alert("danger","17","&lt;area&gt; not contained in &lt;map&gt;.","area_not_in_map");
var alert_0179 = new Alert("caution","17","Screen reader will not recognize this font icon as an image; Add an appropriate role such as [role=img].","");
var alert_017A = new Alert("caution","17","Font Icon. Is this a meaningful image?","");

var alert_0182 = new Alert("danger","18","Live Region contains a form element.","live_region_form_element");
var alert_0184 = new Alert("danger","18","A live region can only be a container element.","live_region_not_container");

var alert_0190 = new Alert("warning","19","Element visually conveys heading meaning but not using semantic heading markup.","not_semantic_heading");
var alert_0191 = new Alert("warning","19","Heading element level &lt;%%%&gt; conflicts with [aria-level=%%%].","conflicting_heading_level");
var alert_0192 = new Alert("caution","19","[role=heading] used without [aria-level]; level 2 will be assumed.","role_heading_no_arialevel");
var alert_0193 = new Alert("warning","19","[aria-level] is not a greater-than-zero integar; level 2 will be assumed.","arialevel_not_gt_zero_integar");
var alert_0194 = new Alert("danger","19","List item's container is not recognized as a list because it has [role=%%%].","non_list_role");

var alert_0200 = new Alert("warning","20","Non-unique button: same name/description as another button.","non_unique_button");

var alert_0210 = new Alert("caution","21","An associated &lt;label&gt; containing text would increase the clickable area of this %%%.","label_clickable_area");

var alert_0220 = new Alert("warning","22","Content has been injected using CSS pseudo-elements ::before or ::after.","pseudo_before_after");

var alert_0230 = new Alert("warning","23","Element has background-image; Perform manual contrast test.","manual_contrast_test_bgimage");
var alert_0231 = new Alert("caution","23","Page has images; If images contain meaningful text, perform manual contrast test.","manual_contrast_test_img");
var alert_0232 = new Alert("warning","23","Opacity less than 100%; Perform manual contrast test.","manual_contrast_test_opacity");
var alert_0233 = new Alert("caution","23","[role=grid] found; test navigation of design pattern.","grid_navigation_test");

var alert_0240 = new Alert("danger","24","Text does not meet %%%minimum %%% contrast ratio (%%%:1).","min_contrast");

var alert_0250 = new Alert("warning","25","Page has %%% disabled %%%; Disabled elements are not in the keyboard tab order.","disabled_elements",
	new AlertButton("show disabled", "ANDI508-alertButton-disabledElementsOverlay", function(){andiOverlay.overlay_disabledElements();}, overlayIcon));
var alert_0251 = new Alert("caution","25","Page has %%% disabled elements; Disabled elements do not require sufficient contrast.","disabled_contrast",
	new AlertButton("show disabled", "ANDI508-alertButton-disabledElementsOverlay", function(){andiOverlay.overlay_disabledElements(true);}, overlayIcon));

var alert_0260 = new Alert("danger","26","Element is hidden from screen reader using [aria-hidden=true] resulting in no output.","ariahidden");
var alert_0261 = new Alert("warning","26","Element is hidden from screen reader using [aria-hidden=true] resulting in no output.","ariahidden");

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

		var moduleButtons = "<div id='ANDI508-moduleMenu' role='menu' aria-label='Select a Module'><div id='ANDI508-moduleMenu-prompt'>Select Module:</div>"+
			//Default (fANDI)
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-f'>focusable elements</button>"+
			//gANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-g' aria-label='graphics slash images'>graphics/images</button>"+
			//lANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-l' aria-label='links slash buttons'>links/buttons</button>"+
			//tANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-t'>tables</button>"+
			//sANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-s'>structures</button>"+
			//cANDI
			((!oldIE) ? "<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-c'>color contrast</button>" : "")+
			//hANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-h'>hidden content</button>"+
			//iANDI
			"<button role='menuitem' class='ANDI508-moduleMenu-option' id='ANDI508-moduleMenu-button-i'>iframes</button>"+
			"</div>";

		var andiBar = "<section id='ANDI508' tabindex='-1' aria-label='ANDI' style='display:none'>"+
		"<div id='ANDI508-header'>"+
			"<h1 id='ANDI508-toolName-heading'><a id='ANDI508-toolName-link' class='ANDI508-sectionJump' href='#' aria-haspopup='dialog' aria-label='ANDI "+andiVersionNumber+"'><span id='ANDI508-module-name' data-andi508-moduleversion=''>&nbsp;</span>ANDI</a></h1>"+
			"<div id='ANDI508-moduleMenu-container'>"+
				moduleButtons+
			"</div>"+
			"<div id='ANDI508-module-actions'></div>"+
			"<div id='ANDI508-loading'>Loading <div id='ANDI508-loading-animation'></div></div>"+
			"<div id='ANDI508-barControls' aria-label='ANDI Controls' class='ANDI508-sectionJump' tabindex='-1'>"+
				menuButtons+
			"</div>"+
		"</div>"+
		"<div id='ANDI508-body' style='display:none'>"+
			"<div id='ANDI508-activeElementInspection' aria-label='Active Element Inspection' class='ANDI508-sectionJump' tabindex='-1'>"+
				"<div id='ANDI508-activeElementResults'>"+
					"<div id='ANDI508-elementControls'>"+
						"<button title='Previous Element' accesskey='"+andiHotkeyList.key_prev.key+"' id='ANDI508-button-prevElement'><img src='"+icons_url+"prev.png' alt='' /></button>"+
						"<button title='Next Element' accesskey='"+andiHotkeyList.key_next.key+"' id='ANDI508-button-nextElement'><img src='"+icons_url+"next.png' alt='' /></button>"+
						"<br />"+
					"</div>"+
					"<div id='ANDI508-startUpSummary' tabindex='0'></div>"+
					"<div id='ANDI508-elementDetails'>"+
						"<div id='ANDI508-elementNameContainer'><h3 class='ANDI508-heading'>Element:</h3> "+
							"<a href='#' id='ANDI508-elementNameLink' aria-labelledby='ANDI508-elementNameContainer ANDI508-elementNameDisplay'>&lt;<span id='ANDI508-elementNameDisplay'></span>&gt;</a>"+
						"</div>"+
						"<div id='ANDI508-additionalElementDetails'></div>"+
						"<div id='ANDI508-accessibleComponentsTableContainer' class='ANDI508-scrollable' tabindex='0' aria-labelledby='ANDI508-accessibleComponentsTable-heading'>"+
							"<h3 id='ANDI508-accessibleComponentsTable-heading' class='ANDI508-heading'>Accessibility Components: <span id='ANDI508-accessibleComponentsTotal'></span></h3>"+
							"<table id='ANDI508-accessibleComponentsTable' aria-labelledby='ANDI508-accessibleComponentsTable-heading'><tbody></tbody></table>"+
						"</div>"+
						"<div id='ANDI508-outputContainer'>"+
							"<h3 class='ANDI508-heading' id='ANDI508-output-heading'>ANDI Output:</h3>"+
							"<div id='ANDI508-outputText' class='ANDI508-scrollable' tabindex='0' accesskey='"+andiHotkeyList.key_output.key+"' aria-labelledby='ANDI508-output-heading ANDI508-outputText'></div>"+
						"</div>"+
					"</div>"+
				"</div>"+
			"</div>"+
			"<div id='ANDI508-pageAnalysis' aria-label='Page Analysis' class='ANDI508-sectionJump' tabindex='-1'>"+
				"<div id='ANDI508-resultsSummary'>"+
					"<h3 class='ANDI508-heading' tabindex='0' id='ANDI508-resultsSummary-heading'></h3>"+
				"</div>"+
				"<div id='ANDI508-additionalPageResults'></div>"+
				"<div id='ANDI508-alerts-list'></div>"+
			"</div>"+
		"</div>"+
		"</section>";

		if(browserSupports.svg)
			andiBar += "<svg id='ANDI508-laser-container'><title>ANDI Laser</title><line id='ANDI508-laser'></line></svg>";

		var body = $("body").first();

		//Preserve original body padding and margin
		var body_padding = "padding:"+$(body).css("padding-top")+" "+$(body).css("padding-right")+" "+$(body).css("padding-bottom")+" "+$(body).css("padding-left")+"; ";
		var body_margin = "margin:"+$(body).css("margin-top")+" 0px "+$(body).css("margin-bottom")+" 0px; ";

		$("html").addClass("ANDI508-testPage");
		$(body)
			.addClass("ANDI508-testPage")
			.wrapInner("<div id='ANDI508-testPage' style='"+body_padding+body_margin+"' ></div>") //Add an outer container to the test page
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
				andiFocuser.focusByIndex($("#ANDI508-testPage .ANDI508-element-active").first().attr("data-andi508-index"));
				andiLaser.eraseLaser();
				return false;
			})
			.hover(function(){ //Draw line to active element
				var activeElement = $("#ANDI508-testPage .ANDI508-element-active").first();
				andiLaser.drawLaser($(this).offset(),$(activeElement).offset(),$(activeElement));
			})
			.on("mouseleave", andiLaser.eraseLaser);
		//Active Element Jump and Section Jump Hotkeys
		$(document).keydown(function(e){
			if(e.which === andiHotkeyList.key_active.code && e.altKey )
				$("#ANDI508-testPage .ANDI508-element-active").first().focus();
			else if(e.which === andiHotkeyList.key_jump.code && e.altKey){
				//get next element with ANDI508-sectionJump class
				var nextSectionJump = $(".ANDI508-sectionJump").eq( $(".ANDI508-sectionJump").index( $(":focus") ) + 1 );
				if(!nextSectionJump.length)
					$(".ANDI508-sectionJump").first().focus();
				else
					$(nextSectionJump).focus();
			}
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
			alert("ANDI "+andiVersionNumber+"\n"+$("#ANDI508-module-name").attr("data-andi508-moduleversion"));
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
			shown: function (elem){return $(elem).css("visibility") !== "hidden" && $(elem).is(":visible");}
		});

		//Define getValidRole
		//Because an element's role may contain a list of values, need to check walk the list and look for first valid role
		$.fn.extend({
			getValidRole:function(){
				var role = $.trim($(this).attr("role")).toLowerCase();
				if(role){
					var roleList = role.split(" "); //check for a role sequence such as role="link presentation"
					//loop through the element's roles list
					for(var r=0; r<roleList.length; r++){
						//check if value is in validAriaRoles list
						if(AndiCheck.validAriaRoles.includes(roleList[r])){
							return roleList[r];
						}
					}
				}
			}
		});

		//Define isSemantically, Loosely based on jquery .is method
		//	roles:	an array of role values to check against. Example: ["link","button"]
		//	tags:	css selector strings: semantic tags to check against. Example: "a"
		//If the role is a trimmed empty string or unsuppported, gets semantics from the tagName
		$.fn.extend({
			isSemantically:function(roles, tags){
				var role = $(this).getValidRole();

				if(role){ //there is a valid role, so it must take precedence over the tagname
					//check if the computed/valid role matches
					return roles.includes(role);
				}
				else{
					//check if the tagname matches
					return $(this).is(tags);
				}
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
				return function(){ //find matching img[usemap]
					$("img[usemap]").each(function(){ //$("img[usemap=\\#" + $.escapeSelector(mapName) + "]")[0] would be better but not supported in jquery less than 3
						if( $(this).attr("usemap") == ("#" + mapName) )
							return visibleParents($(this));
					});
				}
			}
			return(
				/^(input|select|textarea|button|iframe|summary)$/.test(nodeName) ?
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

		//String.prototype.includes() polyfill
		if (!String.prototype.includes){
			String.prototype.includes = function(search, start){
				'use strict';
				if(typeof start !== "number") start = 0;
				if(start + search.length > this.length) return false;
				else return this.indexOf(search, start) !== -1;
			};
		}
		//Array.prototype.includes() polyfill
		if(!Array.prototype.includes){
		   Array.prototype.includes = function(search){
			return !!~this.indexOf(search);
		  }
		}

		//Define isContainerElement: This support function will return true if an element can contain text (is not a void element)
		(function($){
			var visibleVoidElements = ['area','br','embed','hr','img','input','menuitem','track','wbr'];
			$.fn.isContainerElement = function(){return ($.inArray($(this).prop("tagName").toLowerCase(), visibleVoidElements) == -1);};
		}(jQuery));

		//Define Object.keys for old IE
		if (!Object.keys) {Object.keys=(function(){'use strict';var hasOwnProperty = Object.prototype.hasOwnProperty,hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],dontEnumsLength = dontEnums.length;return function(obj) {if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {throw new TypeError('Object.keys called on non-object');}var result = [], prop, i;for (prop in obj) {if (hasOwnProperty.call(obj, prop)) {result.push(prop);}}if (hasDontEnumBug) {for (i = 0; i < dontEnumsLength; i++) {if (hasOwnProperty.call(obj, dontEnums[i])) {result.push(dontEnums[i]);}}}return result;};}());}

		//Define Array.indexOf for old IE
		if(!Array.prototype.indexOf){Array.prototype.indexOf = function(obj, start){ for (var i = (start || 0), j = this.length; i < j; i++){if (this[i] === obj) { return i; } } return -1;};}
	}
}

//This object handles the updating of the ANDI Bar
function AndiBar(){
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
	this.displayOutput = function(elementData, element, addOnProps){
		var outputText = ""; //reset - this will hold the output text to be displayed

		if(!checkAlerts("dangers")){ //No dangers found during load

			if(!elementData.isAriaHidden && !(((elementData.role === "presentation" || elementData.role === "none")) && !elementData.isFocusable )){

				if(elementData.accGroup)
					outputText += elementData.accGroup + " ";
				if(elementData.accName){
					outputText += elementData.accName;

					//Matching: if accessible name matches accessible description, don't output the description
					if(elementData.accDesc && matchingTest(elementData.accName, elementData.accDesc))
						outputText += " " + elementData.accDesc;
				}
				else if(elementData.accDesc){ //no accessible name, provide accessible description
					outputText += " " + elementData.accDesc;
				}

				if(addOnProps && addOnProps[0])
					outputText += " " + wrapText("addOnProperties", addOnProps[0]);
			}
		}
		checkAlerts("warnings");
		checkAlerts("cautions");

		//Place the output display into the container.
		$("#ANDI508-outputText").html(outputText);

		function checkAlerts(alertType){
			if(elementData[alertType].length){
				for(var a=0; a<elementData[alertType].length; a++)
					outputText += wrapText(alertType.slice(0, -1), elementData[alertType][a]);
				return true;
			}
			return false;
		}

		function wrapText(displayType, text){
			return " <span class='ANDI508-display-"+displayType+"'>" + text + "</span>";
		}

		function matchingTest(a, b){
			a = andiUtility.normalizeOutput(a);
			b = andiUtility.normalizeOutput(b);
			return (a !== b);
		}
	};

	//This function displays the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	this.displayTable = function(elementData, element, addOnProps){
		var accessibleComponentsTableBody = $("#ANDI508-accessibleComponentsTable").children("tbody").first();

		//Reset the table to empty
		$(accessibleComponentsTableBody).html("");

		var rows = "";
		buildTableBody();
		if(rows)
			$(accessibleComponentsTableBody).append(rows);

		andiCheck.wereComponentsFound(elementData.isTabbable, accessibleComponentsTableBody);
		andiLaser.createReferencedComponentLaserTriggers();

		function buildTableBody(){

			if(!elementData.isAriaHidden){
				displayGrouping(elementData.grouping);
				displayEmptyComponents(elementData.empty);
				displayConcatenatedInnerText();
				displayComponents(elementData.components);
				displayAddOnProps();
				displaySubtreeComponents();
			}
			else{
				//Don't display any other components because the aria-hidden=true makes them not matter
				displayAriaHiddenOnly();
			}

			function buildRow(displayClass, headerText, cellText){
				return "<tr><th class='ANDI508-display-"+displayClass+"' scope='row'>"+
					headerText+": </th><td class='ANDI508-display-"+displayClass+"'>"+
					cellText+"</td></tr>";
			}

			function displayGrouping(grouping){
				if(grouping)
					rows += buildRow("grouping", grouping.role, grouping.text);
			}

			function displayEmptyComponents(emptyComponents){
				for(var componentName in emptyComponents){
					if(emptyComponents.hasOwnProperty(componentName)){
						rows += buildRow(componentName, formatComponentName(componentName), emptyComponents[componentName]);
					}
				}
			}

			function displayConcatenatedInnerText(){
				if(!$(element).is("table") || $(element).isSemantically(["presentation","none"]) ){ //other exclusions are handled by the getVisibleInnerText
					var innerText = andiUtility.formatForHtml($.trim(andiUtility.getVisibleInnerText(element, element)));
					if(innerText)
						rows += buildRow("innerText", "innerText", innerText);
				}
			}

			function displayComponents(components){
				for(var component in components){
					if(component === "ariaLabelledby" || component === "ariaDescribedby"){
						//build rows with a rowspan
						rows += "<tr><th class='ANDI508-display-"+component+"' scope='row'"+
							" rowspan='"+components[component].length+"'>" +
							formatComponentName(component) + ": </th><td>"+
							components[component][0] + "</td></tr>";
						//add additional rows for each stored reference
						for(var i=1; i<components[component].length; i++){
							rows += "<tr><td>" + components[component][i] + "</td></tr>";
						}
					}
					else if(component !== "innerText" && component !== "subtree"){
						rows += buildRow(component, formatComponentName(component), components[component]);
					}
				}
			}

			function displayAddOnProps(){
				for(var x=1; x<addOnProps.length; x++){
					if(addOnProps[x].val)//if this addOnProperty exists, add to row
						rows += buildRow("addOnProperties", addOnProps[x].name, addOnProps[x].val);
				}

				if(elementData.src)
					rows += buildRow("addOnProperties", "src", elementData.src);
			}

			function displayAriaHiddenOnly(){
				rows += buildRow("addOnProperties", "aria-hidden", "true");
			}

			function displaySubtreeComponents(){
				if(elementData.components.subtree)
					loopThroughSubtrees(elementData.components);

				function loopThroughSubtrees(components){
					for(var x=0; x<components.subtree.length; x++){
						var rowspan = 0;
						var subtree = components.subtree[x];
						var subtreeComponents = "";
						for(var component in subtree){
							if(component === "subtree"){
								loopThroughSubtrees(subtree);
							}
							else if(component !== "innerText" && component !== "role" && component !== "tagNameText"){
								rowspan++;

								if(rowspan > 1) //start new row
									subtreeComponents += "<tr>";

								subtreeComponents += "<td><span class='ANDI508-display-"+component+"'>" +
									formatComponentName(component) + ":</span> " +
									subtree[component] + "</td></tr>";
							}
						}

						//Add the <th>
						if(subtreeComponents){
							rows += "<tr><th rowspan="+rowspan+"><span class='ANDI508-display-id'>child</span>";
							if(subtree.role)
								rows += subtree.role;
							else
								rows += "&lt;"+subtree.tagNameText+"&gt;";
							rows += "</th>" + subtreeComponents;
						}
					}

				}
			}

			function formatComponentName(componentName){
				if(componentName.substring(0, 4) === "aria")
					return "aria-" + componentName.charAt(4).toLowerCase() + componentName.substring(5, componentName.length);
				return componentName;
			}
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
	this.showStartUpSummary = function(summary, showPageAnalysis){
		if(showPageAnalysis || testPageData.numberOfAccessibilityAlertsFound > 0)
			$("#ANDI508-pageAnalysis").show();
		else
			$("#ANDI508-pageAnalysis").hide();
		$("#ANDI508-elementDetails").hide();
		$("#ANDI508-startUpSummary").html("<p>"+summary+"</p>").css("display","inline-block");
	};

	//This function updates the resultsSummary
	this.updateResultsSummary = function(summary){
		$("#ANDI508-resultsSummary-heading").html(summary);
	};

	//These functions show/hide the elementControls
	this.showElementControls = function(){
		$("#ANDI508-elementControls button").css("display","inline-block");
	};
	this.hideElementControls = function(){
		$("#ANDI508-elementControls button").hide();
	};

	//These functions show/hide the anmiated loading image
	this.showModuleLoading = function(){
		document.getElementById("ANDI508-body").style.display = "none";
		document.getElementById("ANDI508-loading").style.display = "inline-block";
	};
	this.hideModuleLoading = function(){
		setTimeout(function(){
			document.getElementById("ANDI508-loading").style.display = "none";
			document.getElementById("ANDI508-body").style.display = "block";
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
			var testPage = document.getElementById("ANDI508-testPage");
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

			//Loop through every ANDI508-element to clean up stuff
			$(testPage).find(".ANDI508-element").each(function(){

				//Module specific cleanup for this element
				if(AndiModule.cleanup !== undefined)
					AndiModule.cleanup(testPage, this);

				//Global cleanup
				$(this)
					.removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight ANDI508-exclude-from-inspection")
					.removeData("ANDI508")
					.removeAttr("data-andi508-index")
					.off("focus",AndiModule.focusability)
					.off("mouseenter",AndiModule.hoverability);
			});

			//Module specific cleanup for all elements
			if(AndiModule.cleanup !== undefined)
				AndiModule.cleanup(testPage);

			andiLaser.cleanupLaserTargets(testPage);

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
		var testPage = document.getElementById("ANDI508-testPage");
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
				.find("[data-andi508-origfixedtopbot]").each(function(){
					//Adjust the top/bottom distance of any fixed elements in the test page
					var origFixedTopBot = $(this).attr("data-andi508-origfixedtopbot").split(" ");
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
		if(($(element).css("position") === "fixed") && !$(element).attr("data-andi508-origfixedtopbot"))
			$(element).attr("data-andi508-origfixedtopbot", $(element).css("top")+" "+$(element).css("bottom")); //store the value of the original top distance and bottom distance
	};
	//This function will restore the test page fixed position distances to their original values.
	//It is meant to be called when the close ANDI button is pressed.
	this.restoreTestPageFixedPositionDistances = function(testPage){
		$(testPage).find("[data-andi508-origfixedtopbot]").each(function(){
			var origFixedTopBot = $(this).attr("data-andi508-origfixedtopbot").split(" ");
			var top = origFixedTopBot[0];
			var bottom = origFixedTopBot[1];
			$(this).removeAttr("data-andi508-origfixedtopbot").css("top",top).css("bottom",bottom);
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
	this.key_jump = new AndiHotkey("`","grave",192);
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
		$("#ANDI508-hotkeyList").slideUp(AndiSettings.andiAnimationSpeed);
		$("#ANDI508-button-keys").attr("aria-expanded","false").children("img").attr("src",icons_url+"keys-off.png");
	};

	//This function builds ANDI's hotkey list html
	this.buildHotkeyList = function(){

		var isMac = navigator.platform.toLowerCase().indexOf('mac') >= 0;
		var isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

		var hotkeyTrigger = (isMac) ? "ctrl+alt+" : (isFirefox) ? "shift+alt+" : "alt+";

		var hotkeyList = "<div id='ANDI508-hotkeyList'>"+
			"<h3><a rel='help' href='"+ help_url + "howtouse.html#Hotkeys' target='_blank'>Hotkeys:</a></h3>"+
			"<span class='ANDI508-code' aria-hidden='true'>&nbsp;"+hotkeyTrigger+"</span>"+
			"<ul id='ANDI508-hotkeyList-items' aria-label='These hotkeys will help you navigate ANDI.'>"+
			insertHotkeyListItem("Relaunch", andiHotkeyList.key_relaunch.key, andiHotkeyList.key_relaunch.sp)+
			insertHotkeyListItem("Next Element", andiHotkeyList.key_next.key, andiHotkeyList.key_next.sp)+
			insertHotkeyListItem("Prev Element", andiHotkeyList.key_prev.key, andiHotkeyList.key_prev.sp)+
			insertHotkeyListItem("Active Element", andiHotkeyList.key_active.key, andiHotkeyList.key_active.sp)+
			insertHotkeyListItem("ANDI Output", andiHotkeyList.key_output.key, andiHotkeyList.key_output.sp)+
			insertHotkeyListItem("Section Jump", andiHotkeyList.key_jump.key, andiHotkeyList.key_jump.sp);

		hotkeyList += "</ul><h3><a rel='help' href='"+ help_url + "howtouse.html#HoverLock' target='_blank'>Hover Lock:</a></h3><ul aria-label='Hover lock is a feature for mouse users.'><li>&nbsp;&nbsp;&nbsp;hold shift</li></ul></div>";

		$("#ANDI508-button-keys").after(hotkeyList);

		$("#ANDI508-hotkeyList").keydown(function(e){
			if(e.keyCode === 27){//esc
				andiHotkeyList.hideHotkeysList();
				$("#ANDI508-button-keys").focus();
			}
		});

		//This function will insert a hotkey list item.
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
		if(typeof(Storage) !== "undefined"){
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
				else//no local storage
					andiSettings.linearize(false);
			}catch(err){console.error(err);}
		}
	};

	//This function will toggle the state of mini mode
	//	state: true or false
	this.minimode = function(state){
		if(state){//minimode on
			$("#ANDI508-body").addClass("ANDI508-minimode");
			document.getElementById("ANDI508-accessibleComponentsTableContainer").style.display = "none";
			andiSettings.setting_on(document.getElementById("ANDI508-button-minimode"));
		}
		else{//minimode off
			$("#ANDI508-body").removeClass("ANDI508-minimode");
			document.getElementById("ANDI508-accessibleComponentsTableContainer").style.display = "block";
			andiSettings.setting_off(document.getElementById("ANDI508-button-minimode"));
		}
		andiResetter.resizeHeights(true);
	};

	//This function will toggle the state of linearize
	//	state: true or false
	this.linearize = function(state){
		if(state){//linearize on
			andiSettings.setting_on(document.getElementById("ANDI508-button-linearize"));
			var css_position, css_float;
			$("#ANDI508-testPage *").filter(":visible:not(.ANDI508-overlay)").each(function(){
				//check position property
				css_position = $(this).css("position");
				if(css_position === "absolute" ||
					css_position === "fixed" ||
					css_position === "relative" ||
					css_position === "sticky")
				{
					if($(this).css("top") !== "auto" ||
						$(this).css("left") !== "auto" ||
						$(this).css("bottom") !== "auto" ||
						$(this).css("right") !== "auto")
					{
						$(this).addClass("ANDI508-linearized ANDI508-linearized-position");
					}
				}

				//check float property
				css_float = $(this).css("float");
				if(css_float === "left" || css_float === "right"){
					$(this).addClass("ANDI508-linearized ANDI508-linearized-float");
				}

			});
		}
		else{//linearize off
			andiSettings.setting_off(document.getElementById("ANDI508-button-linearize"));
			$("#ANDI508-testPage .ANDI508-linearized").removeClass("ANDI508-linearized ANDI508-linearized-position ANDI508-linearized-float");
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
		//The button removes .ANDI508-highlight from any element with .ANDI508-element
		$("#ANDI508-button-highlights").click(function(){
			if(!AndiSettings.elementHighlightsOn){
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
		andiFocuser.focusOn($("#ANDI508-testPage [data-andi508-index="+index+"]"));
	};
	//Creates click event handler on the element which will call focusByIndex
	this.addFocusClick = function(element){
		$(element).click(function(){
			var index = $(element).attr("data-andi508-relatedindex");
			if(index) //Add focus on click
				andiFocuser.focusByIndex(index);
			else if(confirm("This alert does not refer to an inspectable element.\nPress OK to open ANDI Help for this alert in a new window.") === true)
				window.open($(element).attr("href"), $(element).attr("target"), 'width=1010,height=768,scrollbars=yes,resizable=yes').focus();
			return false;
		});
	};
	//This function will shift the focus to an element even if the element is not tabbable
	this.focusOn = function(element){
		if(!element.length){
			alert("Element removed from DOM. Refresh ANDI.");
		}
		else if(!$(element).attr("tabindex") && ((browserSupports.isIE && $(element).is("summary")) || !$(element).is(":focusable"))){
			//"Flash" the tabindex

			//img with usemap cannot be given focus (browser moves focus to the <area>)
			//so temporarily remove the usemap attr, reapply after focus
			var useMapVal;
			if($(element).is("img[usemap]")){
				useMapVal = $(element).attr("usemap");
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
		if(browserSupports.svg && !!targetObject.length){
			$("#ANDI508-laser").attr("x1",fromHereCoords.left).attr("y1",fromHereCoords.top)
							   .attr("x2",  toHereCoords.left).attr("y2",  toHereCoords.top);
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
				var relatedIndex = $(this).attr("data-andi508-relatedindex");
				if(relatedIndex){
					var alertCoords = $(this).offset();
					var elementCoords = $("[data-andi508-index="+relatedIndex+"]").offset();
					andiLaser.drawLaser(alertCoords,elementCoords,$("[data-andi508-index="+relatedIndex+"]"));
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
	this.createLaserTarget = function(targetElement, referencedText){
		if(browserSupports.svg && referencedText !== ""){
			var relatedLaserIndex;
			if(!$(targetElement).hasClass("ANDI508-relatedLaserTarget")){
				//increment relatedLaserIndex and store onto targetElement
				relatedLaserIndex = testPageData.relatedLaserIndex++;
				$(targetElement).addClass("ANDI508-relatedLaserTarget").attr("data-andi508-relatedlaserindex", relatedLaserIndex);
			}
			else //get relatedLaserIndex from targetElement
				relatedLaserIndex = $(targetElement).attr("data-andi508-relatedlaserindex");
			return "<span class='ANDI508-laserAimer' data-andi508-relatedlaserindex='"+relatedLaserIndex+"'>"+referencedText+"</span>";
		}
		else
			return referencedText;
	};

	//This function will remove all laser targets
	this.cleanupLaserTargets = function(testPage){
		$(testPage).find(".ANDI508-relatedLaserTarget").removeClass("ANDI508-relatedLaserTarget").removeAttr("data-andi508-relatedlaserindex");
	};

	//This function will createLaserTrigger for each data-andi508-relatedlaserindex in the td cell of the accessibility components table
	//It is used for (aria-labelledby, label, aria-describedby)
	this.createReferencedComponentLaserTriggers = function(){
		if(browserSupports.svg){
			$("#ANDI508-accessibleComponentsTable td span.ANDI508-laserAimer").each(function(){
				andiLaser.createLaserTrigger($(this), $("#ANDI508-testPage .ANDI508-relatedLaserTarget[data-andi508-relatedlaserindex="+$(this).attr("data-andi508-relatedlaserindex")+"]").first());
			});
		}
	};
}

//This class is used to perform common utilities such as regular expressions and string alertations.
function AndiUtility(){

	//cache the regex for performance gains
	this.greaterthan_regex = />/g;
	this.lessthanthan_regex = /</g;
	this.ampersand_regex = /&/g;
	this.whitespace_regex = /\s+/g;

	//This ultility function takes a string and converts &, < and > into &amp;, &lt; and &gt; so that when the
	//string is displayed on screen, the browser doesn't try to parse the string into html tags.
	this.formatForHtml = function(string){
		if(string !== undefined)
			return string.replace(this.ampersand_regex, "&amp;").replace(this.greaterthan_regex, "&gt;").replace(this.lessthanthan_regex, "&lt;");
	};

	this.condenseWhitespace = function(string){
		if(string !== undefined)
			return string.replace(this.whitespace_regex, " ");
	};

	this.stripHTML = function(string){
		return $("<b>"+string+"</b>").text();
	};

	this.getVisibleInnerText = function(element, root){
		var innerText = "";
		var exclusions = ".ANDI508-overlay,script,noscript,iframe";
		var node;
		if(!$(element).is(exclusions) && element.childNodes){
			//Loop through this element's child nodes
			lookForPseudoContent("before",element);

			for(var z=0; z<element.childNodes.length; z++){
				node = element.childNodes[z];
				if(node.nodeType === 1){//element node
					if($(node).is(":shown") && !$(node).is("[aria-hidden=true]")){
						if(root != node && !isEmbeddedControl(node))
							innerText += this.getVisibleInnerText(node, root);

						if(andiUtility.isBlockElement(node))
							innerText += " ";
					}
				}
				else if(node.nodeType === 3){//text node
					innerText += andiUtility.condenseWhitespace(node.nodeValue);
				}
			}

			lookForPseudoContent("after",element);
		}
		return innerText;

		//This function is essentially StepE of the TAC
		function isEmbeddedControl(node){
			var component;
			if($(node).is("input[type=text]")){ //get value
				innerText += $(node).val();
				return true;
			}
			else if($(node).isSemantically(["combobox","listbox"])){ //get chosen option
				component = $(node).find("[role=option][aria-selected=true]").first().text();
				if(component && $.trim(component) !== ""){
					innerText += component;
				}
				return true;
			}
			else if($(node).is("select")){ //get chosen option
				component = $(node).find("option:selected").first().text();
				if(component && $.trim(component) !== ""){
					innerText += component;
				}
				return true;
			}
			else if($(node).isSemantically(["progressbar","scrollbar","slider","spinbutton"])){
				component = $(node).attr("aria-valuetext");
				if(component && $.trim(component) !== ""){
					innerText += component;
				}
				else{
					component = $(node).attr("aria-valuenow");
					if(component && $.trim(component) !== ""){
						innerText += component;
					}
				}
				return true;
			}
			return false;
		}

		//This function checks for pseudo element content and adds to the innerText
		function lookForPseudoContent(pseudo, element, data){
			var pseudoObject = andiUtility.getPseudoContent(pseudo, element);
			if(pseudoObject){
				innerText += pseudoObject[0];
			}
		}
	};

	//This function checks for pseudo element content
	//Return: Array [displayText, contentLiteral]
	this.getPseudoContent = function(pseudo, element){
		if(!oldIE && window.getComputedStyle(element, ":"+pseudo).display !== "none"){
			//pseudo element is not display:none
			var contentLiteral = window.getComputedStyle(element, ":"+pseudo).content;

			if(contentLiteral !== "none" && contentLiteral !== "normal" && contentLiteral !== "counter" && contentLiteral !== "\"\""){//content is not none or empty string
				var displayText = "";
				if(!!hasReadableCharacters(contentLiteral));
					return [displayText, contentLiteral];
			}
		}
		return undefined;

		function hasReadableCharacters(content){
			var unicode, c;

			//replaces \a with a space
			content = content.replace(/\\a /," ");

			content = stripContentKeywords(content);

			for(var i=0; i<content.length; i++){
				unicode = content.charCodeAt(i);

				c = content.charAt(i);
				if( //if unicode is not in a private use range
					(unicode < 57344) ||
					!(
						(unicode >= 57344 && unicode <= 63743) ||
						(unicode >= 983040 && unicode <= 1048573) ||
						(unicode >= 1048576 && unicode <= 1114109)
					)
				){
					displayText += c;
				}
			}

			//strip double quotes
			//TODO: do it more "carefully"
			var regex_everydoublequote = /"/g;
			displayText = displayText.replace(regex_everydoublequote,'');

			return displayText;
		}

		//This function removes CSS content keywords for display purposes
		function stripContentKeywords(c){
			//gets common content keywords and their values between parens and the parens
			var regex_keywords = /(url\()(.*)(\))|(counter\()(.*)(\))|(counters\()(.*)(\))/;

			//removes common content keywords and their values between parens and the parens
			c = c.replace(regex_keywords,'');

			return c;
		}
	};

	this.isBlockElement = function(node){
		var blockStyles = {
			display: ["block", "grid", "table", "flex", "list-item"],
			position: ["absolute", "fixed"],
			float: ["left", "right", "inline"],
			clear: ["left", "right", "both", "inline"]
		};

		var blockElements = ["address","article","aside","blockquote","br","caption","dd","div","dl","dt","fieldset",
			"figcaption","figure","footer","h1","h2","h3","h4","h5","h6","hr","header","legend",
			"li","main","nav","ol","output","p","pre","section","table","td","tfoot","th","tr","ul"];

		for(var prop in blockStyles){
			if(blockStyles.hasOwnProperty(prop)){
				var values = blockStyles[prop];
				var style = $(node).css(prop);
				for(var i = 0; i < values.length; i++){
					if(style &&
						((values[i].indexOf("!") === 0 &&
						[values[i].slice(1), "inherit", "initial", "unset"].indexOf(style) === -1) ||
						style.indexOf(values[i]) !== -1)
					){
						return true;
					}
				}
			}
		}
		if(node.nodeName && blockElements.indexOf(node.nodeName.toLowerCase()) !== -1){
			return true;
		}
		return false;
	};

	//this function does a trim, strips html, and removes the refid
	this.normalizeOutput = function(text){
		var regex_idRef = /<span class='ANDI508-display-id'>#(.*?)<\/span>/;
		return $.trim( andiUtility.stripHTML( text.replace(regex_idRef,"") ) );
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

		if(element.nodeType === 3){//this is a text node, not an element
			//using parentNode because parentElement doesn't work on text nodes in IE
			element.parentNode.insertBefore(overlayObject,element);
			element = element.parentNode;
		}
		else{
			if($(element).is("option")){
				element = $(element).closest("select");
				$(element).before(overlayObject);
			}
			else if($(element).is("summary")){
				element = $(element).closest("details");
				$(element).before(overlayObject);
			}
			else if(!alwaysBefore && $(element).isContainerElement() && !$(element).is("select,textarea")){
				$(element).prepend(overlayObject);
			}
			else{
				$(element).before(overlayObject);
			}
		}

		//Attach association highlighting events.
		$(overlayObject)
			.on("mouseover",function(){
				$(element).addClass("ANDI508-overlay-associated");
			}).on("focus",function(){
				$(element).addClass("ANDI508-overlay-associated");
			}).on("mouseleave",function(){
				$(element).removeClass("ANDI508-overlay-associated");
			}).on("focusout",function(){
				$(element).removeClass("ANDI508-overlay-associated");
			});
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
function AndiData(element, skipTAC){

	andiAlerter.reset();

	testPageData.andiElementIndex++;

	AndiData.data = {
		andiElementIndex: testPageData.andiElementIndex,
		components: {} //will store the accessible components as they are gathered
		};

	AndiData.grab_semantics(element, AndiData.data);

	if(!skipTAC){
		//do the text alternative computation
		AndiData.textAlternativeComputation(element);
		AndiData.grab_coreProperties(element);
	}

	$(element)
		.addClass("ANDI508-element")
		.attr("data-andi508-index",AndiData.data.andiElementIndex)
		.on("focus",AndiModule.focusability)
		.on("mouseenter",AndiModule.hoverability);

	return AndiData.data;
}

AndiData.grab_coreProperties = function(element){

	grab_tabindex();
	grab_accesskey();
	grab_imageSrc();

	function grab_tabindex(){
		AndiData.data.isTabbable = true; //assume true (prove to be false)
		AndiData.data.isFocusable = true; //assume true (prove to be false)
		var tabindex = $.trim($(element).attr("tabindex"));
		var nativelyTabbableElements = "a[href],button,input,select,textarea,iframe,area,[contenteditable=true],[contenteditable='']";
		if(tabindex){
			if(tabindex < 0){
				AndiData.data.isTabbable = false;
				if($(element).is("iframe")){
					//check if iframe has focusable contents
					if($(element).contents().find(":focusable").length)
						andiAlerter.throwAlert(alert_0123);
				}
				else if(!$(element).parent().is(":tabbable")){
					//element and parent are not tabbable
					if(AndiData.data.accName)
						andiAlerter.throwAlert(alert_0121);
					else
						andiAlerter.throwAlert(alert_0122);
				}
			}
			else if(isNaN(tabindex)){//tabindex is not a number
				andiAlerter.throwAlert(alert_0077, [tabindex]);
				if(!$(element).is(nativelyTabbableElements)){
					AndiData.data.isTabbable = false;
					AndiData.data.isFocusable = false;
				}
			}
			//else element is tabbable
			AndiData.data.tabindex = tabindex;
		}
		else if(!$(element).is(nativelyTabbableElements)){
			AndiData.data.isTabbable = false;
			AndiData.data.isFocusable = false;
		}
	}

	function grab_accesskey(){
		var accesskey = $(element).attr("accesskey");
		if(accesskey && accesskey !== " "){ //accesskey is not the space character
			accesskey = $.trim(accesskey.toUpperCase());
			AndiData.data.accesskey = accesskey;
		}
	}

	function grab_imageSrc(){
		var imageSrc;
		if($(element).is("area")){
			var map = $(element).closest("map");
			if(map){
				var mapName = $(map).attr("name");
				$("#ANDI508-testPage img[usemap]").each(function(){ //$.escapeSelector() would be better but not supported in jquery less than 3
					if( $(this).attr("usemap") == ("#" + mapName) )
						return $(this).attr("src");
				});
			}
		}
		else if($(element).is("img,input[type=image]"))
			imageSrc = $(element).attr("src");
		else if($(element).is("svg"))
			imageSrc = ($(element).find("image").first().attr("src"));

		if(imageSrc){
			imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
			AndiData.data.src = imageSrc;
		}
	}
};

//================//
// Grab Semantics://
//================//
AndiData.grab_semantics = function(element, data){

	grab_tagName();
	grab_role();

	function grab_tagName(){
		var tagNameText = $(element).prop("tagName").toLowerCase();
		if(tagNameText === "input")
			tagNameText += "[type="+$(element).prop("type").toLowerCase()+"]"; //add the type within brackets
		data.tagNameText = tagNameText;
	}

	function grab_role(){
		//var role = $(element).getValidRole();
		var role = $.trim($(element).attr("role")).toLowerCase();

		if(role){

			//Replace multiple spaces with a single space
			role = role.replace(/  +/g, ' ');
			//If there are multiple roles, store them. Throw alert elsewhere
			data.roleList = role.split(" ");

			//valid role value found in role attribute
			data.role = $(element).getValidRole();
		}

	}
};

//==============================//
// Text Alternative Computation://
//==============================//
AndiData.textAlternativeComputation = function(root){

	var isAriaHidden = traverseAriaHidden(root);
	var isNamed = false;
	var isDescribed = false;
	var component;
	var stepF_exclusions = "figure,iframe,select,table,textarea";
	var usedInName = {};
	var isNameFromContent;
	//check against this list to prevent infinite loops
	var nodesTraversed;
	var isCalcAccDesc = false;

	//This function recursively travels up the anscestor tree looking for aria-hidden=true.
	//Stops at #ANDI508-testPage because another check will stop ANDI if aria-hidden=true is on body or html
	function traverseAriaHidden(element){
		if(element.id === "ANDI508-testPage")
			return false;
		if(element.getAttribute("aria-hidden") === "true")
			return true;
		else
			return traverseAriaHidden(element.parentElement);
	}

	function calcAccName(result){
		if(!isNamed && result){
			isNamed = true;
			AndiData.data.accName = $.trim(result);
			//determine if components that could also be describers where used in the name
			checkIfUsedInName(["value","caption","title"]);
		}

		function checkIfUsedInName(list){
			for(var u=0; u<list.length; u++){
				if(AndiData.data.components[list[u]]){
					usedInName[list[u]] = true;
					break;
				}
			}
		}
	}
	function calcAccDesc(result){
		if(!isDescribed && result){
			isDescribed = true;
			AndiData.data.accDesc = $.trim(result);
		}
	}
	function checkIfGroupFound(result){
		if(result){
			AndiData.data.accGroup = $.trim(result);
		}
	}

	if(!isAriaHidden){

		//Calculate Accessible Name
		nodesTraversed = [];
		calcAccName(stepB(root, AndiData.data.components));
		calcAccName(stepC(root, AndiData.data.components));
		calcAccName(stepD(root, AndiData.data.components));
		if(!$(root).is(stepF_exclusions))
			calcAccName(stepF(root, AndiData.data.components));
		calcAccName(stepI(root, AndiData.data.components));
		calcAccName(stepJ(root, AndiData.data.components));

		//Calculate Accessible Description
		isCalcAccDesc = true;
		nodesTraversed = [];
		calcAccDesc(stepB(root, AndiData.data.components));
		calcAccDesc(stepD(root, AndiData.data.components));
		calcAccDesc(stepI(root, AndiData.data.components));

		//Calculate Element Grouping
		nodesTraversed = [];
		checkIfGroupFound(stepZ(root, AndiData.data));

	}
	else{
		AndiData.data.isAriaHidden = true;
	}

	//stepB: aria-labelledby or aria-describedby
	//Params:	isProcessRefTraversal - keeps track of whether the calculation is already doing a reference traversal to prevent infinite looping
	function stepB(element, data, isProcessRefTraversal){
		var accumulatedText = "";
		if(!isProcessRefTraversal){
			var componentType = (isCalcAccDesc) ? "ariaDescribedby" : "ariaLabelledby";
			var attribute = (isCalcAccDesc) ? "aria-describedby" : "aria-labelledby";
			var component = $(element).attr(attribute);

			if(component !== undefined){
				if(!isEmptyComponent(component, componentType, element)){
					var idsArray = component.split(" ");
					var refElement;
					var missingReferences = [];
					var firstRefInstances = []; //stores refIds that have been found for the first time
					var duplicateRefInstances = []; //will store any duplicate refIds (prevents alert being thown multiple times for same id)

					for(var x=0; x<idsArray.length; x++){ //for each id in the array the array
						if(idsArray[x] !== ""){
							if(firstRefInstances.indexOf(idsArray[x]) === -1){
								//id has not been referenced yet
								firstRefInstances.push(idsArray[x]);
								refElement = document.getElementById(idsArray[x]);

								if(refElement){
									if($(refElement).is("legend")) //is directly referencing a legend
										andiAlerter.throwAlert(alert_006B, [attribute]);

									if(!hasNodeBeenTraversed(refElement)){
										andiCheck.areThereAnyDuplicateIds(attribute, idsArray[x]);

										//Don't call stepB again to avoid infinite loops (spec explicitely defines this)
										if(element != refElement && $(refElement).attr(attribute)){//reference contains another reference
											andiAlerter.throwAlert(alert_006C, [attribute, attribute]);
											AndiData.addComp(data, componentType, [(AndiCheck.emptyString+" "), refElement, idsArray[x]]);
										}

										var refData = {}; //will be discarded
										if(calcRefName(stepC(refElement, refData))); //aria-label
										else if(calcRefName(stepD(refElement, refData))); //native markup
										else if(calcRefName(stepE(refElement, refData))); //embedded control
										else if(calcRefName(stepF(refElement, refData, true, true))); //name from content
										else if(calcRefName(stepI(refElement, refData))); //title attribute
										else if(calcRefName(stepJ(refElement, refData))); //placeholder
									}
									else{//Referenced Element has already been traversed.
										andiAlerter.throwAlert(alert_006E, [attribute, idsArray[x]]);
										var refData = {}; //will be discarded
										var alreadyTraversedText = (
											stepC(refElement, refData) ||
											stepD(refElement, refData) ||
											//stepE(refElement, refData) ||
											stepF(refElement, refData, true, true) ||
											stepI(refElement, refData) ||
											stepJ(refElement, refData)
											);
										AndiData.addComp(data, componentType, [alreadyTraversedText, refElement, idsArray[x]]);
									}
								}
								else{//No, this id was not found, add to list.
									missingReferences.push(idsArray[x]);
									AndiData.addComp(data, componentType, [" ", undefined, idsArray[x]]);
								}
							}
							else{ //id has already been directly referenced, this is a duplicate
								if(duplicateRefInstances.indexOf(idsArray[x]) === -1){
									duplicateRefInstances.push(idsArray[x]);
									andiAlerter.throwAlert(alert_006D, [attribute, idsArray[x]]);
								}
							}
						}
					}//end for loop

					if(idsArray.length === missingReferences.length){//none of the id references return anything useful
						addEmptyComponent(componentType, data[componentType][0]); //add empty component
						delete data[componentType]; //remove from component list
					}

					andiCheck.areThereMissingReferences(attribute, missingReferences);
				}
			}
		}
		return accumulatedText;

		function calcRefName(result){
			if(result){
				accumulatedText += AndiData.addComp(data, componentType, [(result + " "), refElement, refElement.id]);
				return true;
			}
			return false;
		}
	}

	//stepC: aria-label
	function stepC(element, data){
		var accumulatedText = "";
		component = $(element).attr("aria-label");
		if(component !== undefined){
			if(!isEmptyComponent(component, "ariaLabel", element)){
				accumulatedText += AndiData.addComp(data, "ariaLabel", component) + " ";
			}
		}
		return accumulatedText;
	}

	//stepD: native markup
	//isRecursion is used to prevent an input from grabbing its label twice
	function stepD(element, data, isRecursion){
		var accumulatedText = "";
		var component;
		var role = $(element).getValidRole();

		if(!isCalcAccDesc){
			component = $(element).attr("alt");
			if(component !== undefined){
				//TODO: what about svg <image>
				if( $(element).is("img,input[type=image],area") ){
					if(!isEmptyComponent(component, "alt", element)){
						accumulatedText += AndiData.addComp(data, "alt", component, hasNodeBeenTraversed(element));
					}
				}
				else if($.trim(component) !== ""){//because alt="" is allowed for images only
					if($(element).is("img") && $(element).isSemantically(["presentation","none"]) )
						andiAlerter.throwAlert(alert_0142);
					else
						andiAlerter.throwAlert(alert_0081);
					AndiData.addComp(data, "alt", component);
				}
			}
		}

		if($(element).is("input[type=image],input[type=button],input[type=submit],input[type=reset]")){
			//value (can be namer or describer)
			if(!data.value){
				if(!accumulatedText){
					component = $(element).attr("value");
					if(component){
						accumulatedText += AndiData.addComp(data, "value", component, hasNodeBeenTraversed(element));
					}
					else{//if type is submit or reset, add component
						var type = $(element).attr("type");
						if(type === "submit")
							accumulatedText += AndiData.addComp(data, "value", "Submit", hasNodeBeenTraversed(element));
						else if(type === "reset")
							accumulatedText += AndiData.addComp(data, "value", "Reset", hasNodeBeenTraversed(element));
					}
				}
			}
			else if(isCalcAccDesc && !usedInName.value){
				accumulatedText += data.value;
			}
		}

		if(TestPageData.page_using_table && $(element).is("table")){
			//caption
			if(TestPageData.page_using_caption){
				//caption (can be namer or describer)
				if(!data.caption){
					component = grab_caption(element);
					if(component && !accumulatedText){
						var caption = AndiData.addComp(data, "caption", component, hasNodeBeenTraversed(element));
						if(role !== "presentation" && role !== "none")
							accumulatedText += caption;
					}
				}
				else if(isCalcAccDesc && !usedInName.caption){
					accumulatedText += data.caption;
				}
			}

			//summary
			if(!isCalcAccDesc){
				component = $(element).attr("summary");
				if(component !== undefined){
					if(!isEmptyComponent(component, "summary", element)){
						var summary = AndiData.addComp(data, "summary", component, hasNodeBeenTraversed(element));
						if(!accumulatedText && role !== "presentation" && role !== "none")
							accumulatedText += summary;
					}
				}
			}
		}
		else if(!isCalcAccDesc){
			if($(element).isSemantically(["textbox","combobox","listbox","checkbox","radio"],"input,select,textarea,[contenteditable=true],[contenteditable='']")){
				component = grab_label(element);
				if(component !== undefined){
					if(!isEmptyComponent(component[0], "label", element)){
						accumulatedText += AndiData.addComp(data, "label", component, (isRecursion || hasNodeBeenTraversed(element)) );
					}
				}
			}
			else if(testPageData.page_using_fieldset && $(element).is("fieldset")){
				component = grab_legend(element);
				if(component !== undefined){
					accumulatedText += AndiData.addComp(data, "legend", component, hasNodeBeenTraversed(element));
				}
			}
			else if(testPageData.page_using_figure && $(element).is("figure")){
				component = grab_figcaption(element);
				if(component !== undefined){
					accumulatedText += AndiData.addComp(data, "figcaption", component, hasNodeBeenTraversed(element));
				}
			}
			else if(browserSupports.svg && ( $(element).is("svg") || element instanceof SVGElement) ){
				if(!hasNodeBeenTraversed(element)){
					component = $(element).find("title").first().text();
					if(component !== undefined){
						accumulatedText += AndiData.addComp(data, "svgTitle", component);
					}

					component = $(element).find("desc").first().text();
					if(component !== undefined){
						if(data.svgTitle)
							accumulatedText += " ";
						accumulatedText += AndiData.addComp(data, "svgDesc", component);
					}
				}
			}
		}

		return accumulatedText;
	}

	//stepE: embedded control
	function stepE(element, data){
		var accumulatedText = "";
		if($(element).is("input[type=text]")){
			accumulatedText += $(element).val();
		}
		else if($(element).is("select")){
			var selectedOption = $(element).find("option:selected").first();
			if(selectedOption)
				accumulatedText += andiUtility.getVisibleInnerText(selectedOption[0], root);
		}
		else if($(element).isSemantically(["combobox","listbox","progressbar","scrollbar","slider","spinbutton"])){
			accumulatedText += andiUtility.getVisibleInnerText(element, root);
		}
		return accumulatedText;
	}

	//stepF: name from content
	function stepF(element, data, isNameFromContent, isProcessRefTraversal){
		var accumulatedText = "";

		var exclusions = ".ANDI508-overlay,script,noscript,iframe,text";

		var node, beforePseudo, afterPseudo;
		var nameFromContent_roles = ["button","cell","checkbox","columnheader","gridcell","heading","link","menuitem","menuitemcheckbox","menuitemradio","option","radio","row","rowgroup","rowheader","switch","tab","tooltip","tree","treeitem"];
		var nameFromContent_tags = "label,button,a,th,td,h1,h2,h3,h4,h5,h6";

		if(!data) //create data object if not passed
			data = {};

		if(!isNameFromContent) //determine name from content unless passed
			isNameFromContent = $(element).isSemantically(nameFromContent_roles, nameFromContent_tags);

		//get CSS ::before content
		lookForPseudoContent("before", element, data);

		//Loop through this element's child nodes
		for(var z=0; z<element.childNodes.length; z++){
			node = element.childNodes[z];
			if($(node).attr("aria-hidden") !== "true"){//this node is not hidden
				//TODO: the following line prevents a node from being traversed more than once
				//if(node.nodeType === 1 && (!isProcessRefTraversal || !hasNodeBeenTraversed(node))){//element node
				if(node.nodeType === 1){//element node
					if(root != node && $(node).is("select")){
						//loop through selected options to accumulate text
						$(node).find("option:selected").each(function(){
							if(this.childNodes.length)
								accumulatedText += AndiData.addComp(data, "innerText", stepG(this.childNodes[0], data));
						});
					}
					else if(!$(node).is(exclusions) && $(node).is(":shown")){
						var subtreeData;
						if(isNameFromContent || $(node).isSemantically(nameFromContent_roles, nameFromContent_tags)){
							//Recurse through subtree
							subtreeData = {};

							if(!isProcessRefTraversal && calcSubtreeName( stepB(node, subtreeData) ) ); //aria-labelledby
							else if(calcSubtreeName( stepC(node, subtreeData) ) ); //aria-label
							else if(calcSubtreeName( stepD(node, subtreeData, true) ) ); //native markup
							else if(root != node && calcSubtreeName( stepE(node, subtreeData) ) ); //embedded control
							else if(root != node && calcSubtreeName( stepF(node, subtreeData, true, isProcessRefTraversal), true) ); //name from content
							else if(calcSubtreeName( stepI(node, subtreeData, true) ) ); //title attribute
							else if(calcSubtreeName( stepJ(node, subtreeData) ) ); //placeholder

							pushSubtreeData(data, subtreeData, node);
						}
						else{//not a name from content element
							subtreeData = {};
							accumulatedText += stepF(node, subtreeData, false, isProcessRefTraversal);
							if(accumulatedText !== "" && andiUtility.isBlockElement(node))
								accumulatedText += " "; //add extra space after block elements
							pushSubtreeData(data, subtreeData, node);
						}
					}
					else if($(element).is("svg") && $(node).is("title,descr")){ //check if element is <svg> and has <title> or <descr>
						accumulatedText += $(node).text();
					}
				}
				else if(node.nodeType === 3){//text node
					accumulatedText += AndiData.addComp(data, "innerText", stepG(node, data));
				}
			}
		}

		//get CSS ::after content
		lookForPseudoContent("after", element, data);

		return accumulatedText;

		function calcSubtreeName(result, checkForBlockLevelElement){
			if(result)
				accumulatedText += result;
			if(checkForBlockLevelElement && accumulatedText !== "" && andiUtility.isBlockElement(node))
				accumulatedText += " "; //add extra space after block elements
			return !!result;
		}

		function pushSubtreeData(data, subtreeData, node){
			if(!$.isEmptyObject(subtreeData)){
				AndiData.grab_semantics(node, subtreeData);
				if(!data.subtree)//create subtree
					data.subtree = [];
				data.subtree.push(subtreeData);
			}
		}

		//This function checks for pseudo element content and accumulates text and adds a component to the data object
		function lookForPseudoContent(pseudo, element, data){
			var pseudoObject = andiUtility.getPseudoContent(pseudo, element);
			if(pseudoObject){
				accumulatedText += pseudoObject[0];
				AndiData.addComp(data, "::"+pseudo, pseudoObject[1]);
			}
		}
	}

	//stepG: text node
	function stepG(textNode, data){
		var accumulatedText = "";
		var text = textNode.nodeValue;
		if($.trim(text) !== ""){
			if(!data.ariaLabelledby && !data.ariaLabel && !data.title){
				accumulatedText += andiUtility.condenseWhitespace(text);
			}
		}
		return accumulatedText;
	}

	//stepI: title attribute
	function stepI(element, data, isCheckRolePresentation){
		var accumulatedText = "";

		if(!data.title){
			component = $(element).attr("title");
			if(component !== undefined){
				if(!isEmptyComponent(component, "title", element)){
					TestPageData.page_using_titleAttr = true;
					accumulateText(AndiData.addComp(data, "title", component));
				}
			}
		}
		else if(isCalcAccDesc && !usedInName.title){
			accumulateText(data.title);
		}
		return accumulatedText;

		//This function will check for role=presentation|none which should only occur on stepD
		function accumulateText(text){
			if(isCheckRolePresentation){
				if(data.role && (data.role === "presentation" || data.role === "none") )
					return "";
			}
			accumulatedText += text;
		}
	}

	//stepJ - placeholder
	function stepJ(element, data){
		var accumulatedText = "";

		if(!isCalcAccDesc){
			if($(element).is("textarea") || ( $(element).is("input") && $(element).is(":not([type]),[type=text],[type=password],[type=search],[type=tel],[type=email],[type=url],[type=number]") ) ){
				component = $(element).attr("placeholder");
				if($.trim(component) != ""){
					accumulatedText += AndiData.addComp(data, "placeholder", component);
				}
			}
		}

		return accumulatedText;
	}

	//stepZ: //grouping
	function stepZ(element, data){
		var groupingText = "";

		//role=radiogroup
		if(TestPageData.page_using_role_radiogroup && $(element).isSemantically(["radio"],"input[type=radio]")){
			getGroupingText($(element).closest("[role=radiogroup],[role=group]"));
		}
		//role=group
		if(!groupingText && TestPageData.page_using_role_group){
			if($(element).isSemantically(["button","checkbox","link","menuitem","menuitemcheckbox","menuitemradio","option","radio","slider","textbox","treeitem"],"input,select,textarea,button")){ //is an interactive element
				getGroupingText($(element).closest("[role=group]"));
			}
		}
		//role=combobox
		if(!groupingText && TestPageData.page_using_role_combobox && (data.role === "textbox" || data.role === "listbox" || data.role === "tree" || data.role === "grid" || data.role === "dialog") ){
			getGroupingText($(element).closest("[role=combobox]"));
		}
		//role=listbox
		if(!groupingText && TestPageData.page_using_role_listbox && data.role === "option"){
			getGroupingText($(element).closest("[role=listbox]"));
		}
		//role=menu || role=menubar
		if(!groupingText && TestPageData.page_using_role_menu && (data.role === "menuitem" || data.role === "menuitemcheckbox")){
			getGroupingText($(element).closest("[role=menu],[role=menubar]"));
		}
		//legend
		if(!groupingText && testPageData.page_using_fieldset && $(element).isSemantically(["checkbox","radio","textbox","option"],"input,select,textarea")){
			component = grab_legend(element);
			if(component !== undefined){
				groupingText += AndiData.addComp(data.components, "legend", component);
			}
		}

		return groupingText;

		function getGroupingText(groupingElement){
			if(groupingElement){
				component = getNameforGroupingElement(groupingElement);
				groupingText += addComp_grouping(data, component, groupingElement);
			}

			function getNameforGroupingElement(groupingElement){
				var accumulatedText = "";
				var discard = {};

				isCalcAccDesc = false;
				if(calcGroupingName(stepB(groupingElement, discard)));
				else if(calcGroupingName(stepC(groupingElement, discard)));

				return accumulatedText;

				function calcGroupingName(result){
					if(result)
						accumulatedText += result;
					return !!result;
				}
			}

			function addComp_grouping(data, component, groupingElement){
				var displayText = "";

				if($.trim(component) !== ""){
					displayText = "<span class='ANDI508-display-grouping'>" + component + "</span>";

					if($(groupingElement).is("[aria-required=true]"))
						displayText += "<span class='ANDI508-display-grouping'> required group</span>";
				}

				if(displayText){
					if(!data.grouping) //create grouping object
						data.grouping = {};

					if(!data.grouping.role) //store grouping role
						data.grouping.role = $(groupingElement).attr("role");

					data.grouping.text = displayText;
				}
				return displayText;
			}
		}
	}

	//Support Functions

	function isEmptyComponent(component, componentType, element){
		if($.trim(component) == ""){
			if(element == root)//only record empty components for the root
				addEmptyComponent(componentType, AndiCheck.emptyString);
			return true;
		}
		return false;
	}

	function addEmptyComponent(componentType, component){
		if(!AndiData.data.empty)
			AndiData.data.empty = {};
		AndiData.data.empty[componentType] = component;
	}

	function hasNodeBeenTraversed(node){
		if(nodesTraversed.indexOf(node) === -1){
			nodesTraversed.push(node);
			return false; //not traversed
		}
		return true; //has been traversed
	}

	function grab_label(element){
		var labelElement;

		//check if label is being used on page
		var accumulatedText = grab_labelNested(element);
		if(accumulatedText === undefined)
			accumulatedText = grab_labelFor(element);

		return (accumulatedText !== undefined) ? [accumulatedText, labelElement] : undefined;

		//This function attempts to grab the nested label if it exists
		function grab_labelNested(element){
			var labelText;
			//Is the element nested inside a label?
			var closestLabel = $(element).closest("label","body");
			if(closestLabel.length){//element is nested inside a label
				//Is this label explictly associated with something else?
				var forAttr = $(closestLabel).attr("for");
				if(forAttr && forAttr != element.id){
					andiAlerter.throwAlert(alert_006F,[forAttr,element.id]);
				}
				else{
					labelElement = closestLabel;
					//TODO: Need to call the full text alt comp here instead of getVisibleInnerText
					labelText = andiUtility.getVisibleInnerText(closestLabel[0], element);
				}
			}
			return labelText;
		}

		//This function attempts to grab the label with a [for] value that matches the element's id
		function grab_labelFor(element){
			var labelText;
			//Does it contain an id, and therefore, possibly an associated label with 'for' attribute value that matches value of this elemtent's id?
			if(element.id !== ""){
				//Loop through the labels that have [for] attributes and search for a match with this id
				var labelFor;
				for(var x=0; x<testPageData.allFors.length; x++){
					if($(testPageData.allFors[x]).attr("for") == element.id){
						labelFor = $(testPageData.allFors[x]);
						break;
					}
				}

				if(labelFor){//label with matching [for] was found
					labelElement = labelFor;
					//TODO: Need to call the full text alt comp here instead of getVisibleInnerText
					labelText = andiUtility.getVisibleInnerText(labelFor[0], element);

					//Check if this is referencing an element with a duplicate id
					andiCheck.areThereAnyDuplicateIds("label[for]", element.id);
				}
			}
			return labelText;
		}
	}

	function grab_legend(element){
		var legendText;
		var fieldset = ($(element).is("fieldset")) ? $(element) : $(element).closest("fieldset");
		var legend;
		if(fieldset.length){
			legend = $(fieldset).find("legend").first();
			if($(legend).length){
				legendText = $(legend).text();
			}
		}
		return (legendText !== undefined) ? [legendText, legend] : undefined;
	}

	function grab_figcaption(element){
		var figcaptionText;
		var figcaption = $(element).children("figcaption").first();
		if($(figcaption).length){
			figcaptionText = $(figcaption).text();
		}
		return (figcaptionText !== undefined) ? [figcaptionText, figcaption] : undefined;
	}

	function grab_caption(element){
		var captionText;
		var caption = $(element).children("caption").first();
		if($(caption).length){
			captionText = $(caption).text();
		}
		return (captionText !== undefined) ? [captionText, caption] : undefined;
	}
};//end textAlternativeComputation

//Public Methods for AndiData
AndiData.getAddOnProps = function(element, elementData, extraProps){
	//addOnProps[0] will be output generated by the add on properties. The rest are the properties.
	var addOnProps = [""];
	var prop;

	//===Get properties filtered by attribute name
	if(hasProp("aria-owns")){
		displayAsId(prop);
		pushProp();
	}
	if(hasProp("aria-activedescendant")){
		if(hasRole(["application","group","textbox","combobox","grid","listbox","menu","menubar","radiogroup","row","rowgroup","select","tablist","toolbar","tree","treegrid"])){
			if(prop.val){
				var activedescendant = document.getElementById(prop.val);
				if(activedescendant && $(activedescendant).is(":shown")){//active descendant is visible
					//TODO: check if it's a true descendant
					var text = andiUtility.getVisibleInnerText(activedescendant, element);
					if(text)
						prop.out = text += " selected";
				}
				displayAsId(prop);
			}
		}
		pushProp();
	}
	if(hasProp("aria-checked")){
		if(hasRole(["option","radio","switch","menuitemcheckbox","menuitemradio","treeitem"]))
			prop.out = (prop.val === "true") ? "checked" : "not checked";
		else if(hasRole("checkbox"))
			prop.out = (prop.val === "true") ? "checked" : (prop.val === "mixed") ? "partially checked" : "unchecked";
		pushProp();
	}
	if(hasProp("aria-controls")){
		displayAsId(prop);
		prop.out = "controls element";
		pushProp();
	}
	if(hasProp("aria-current")){
		prop.out = "current " + prop.val;
		pushProp();
	}
	if(hasProp("aria-details")){
		displayAsId(prop);
		prop.out = "has details";
		pushProp();
	}
	if(hasProp("aria-disabled") && prop.val === "true"){
		prop.out = "unavailable";
		pushProp();
	}
	if(hasProp("aria-errormessage")){
		displayAsId(prop);
		pushProp();
	}
	if(hasProp("aria-haspopup")){
		prop.out = (prop.val === "true" || prop.val === "menu") ? "menu" : (prop.val === "listbox") ? "listbox" : (prop.val === "tree") ? "tree" : (prop.val === "grid") ? "grid" : (prop.val === "dialog") ? "dialog" : "";
		pushProp();
	}
	if(elementData.isAriaHidden){
		prop.name = "aria-hidden";
		prop.val = "true";
		prop.out = "";
		pushProp();
	}
	if(hasProp("aria-invalid") && prop.val === "true"){
		prop.out = "invalid entry";
		pushProp();
	}
	if(hasProp("aria-keyshortcuts")){
		pushProp();
	}
	if(hasProp("aria-multiline")){
		if(prop.val === "true" && hasRole(["textbox","searchbox"]))
			prop.out = "multi-line";
		pushProp();
	}
	if(hasProp("aria-multiselectable")){
		if(prop.val === "true" && hasRole(["grid","listbox","tablist","tree","treegrid"]))
			prop.out = "multi-selectable";
		pushProp();
	}
	if(hasProp("aria-placeholder")){
		pushProp();
	}
	if(hasProp("aria-pressed")){
		if(hasRole(["button"],"button,input[type=button],input[type=submit],input[type=image],input[type=reset]"))
			prop.out = (prop.val === "true") ? "pressed" : "not pressed";
		pushProp();
	}
	if(hasProp("aria-roledescription")){
		pushProp();
	}
	if(hasProp("aria-selected")){
		if(hasRole(["gridcell","option","row","tab","columnheader","rowheader","treeitem"]))
			prop.out = (prop.val === "true") ? "selected" : "";
		pushProp();
	}
	if(hasProp("contenteditable")){
		if(prop.val === "")//set to true
			prop.val = "true";
		pushProp();
	}

	//===Get properties filtered by role/tag name

	if($(element).is("input")){
		//checked
		if(hasRole([""],"input[type=checkbox],input[type=radio]")){
			prop = {name:"", val:""};
			if(element.checked)
				prop.out = "checked";
			else
				prop.out = "not checked";
			pushProp();
		}
	}

	//expanded/collapsed
	var expandedInOutput = false;
	if(!browserSupports.isIE && $(element).is("summary")){
		if($(element).closest("details").attr("open"))
			prop = {name:"open", val:"open", out:"expanded"};
		else
			prop = {name:"", val:"", out:"collapsed"};
		pushProp();
	}
	if(hasProp("aria-expanded")){
		if(!expandedInOutput && hasRole(["button","combobox","document","link","section","sectionhead","window"],"button,a,section"))
			prop.out = (prop.val === "true") ? "expanded" : "collapsed";
		pushProp();
	}

	//heading level
	if(hasRole(["heading"],"h1,h2,h3,h4,h5,h6")){
		var headingLevel = "2"; //default to 2 (defined in spec)
		if($(element).isSemantically(["heading"])){
			var ariaLevel = $(element).attr("aria-level");

			if(parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel)
				headingLevel = ariaLevel;
		}
		else{//native heading tag
			headingLevel = $(element).prop("tagName").charAt(1);
		}
		prop = {name:"", val:"", out:"heading level " + headingLevel};
		pushProp();
	}

	//multiple
	if($(element).is("select,input[type=file]")){
		if(hasProp("multiple")){
			prop.out = "multi-selectable";
			pushProp();
		}
	}

	//readonly
	var readonlyInOutput = false;
	if($(element).is("input:not([type=radio],[type=checkbox]),textarea")){
		if(hasProp("readonly")){
			readonlyInOutput = true;
			prop.out = "readonly";
			pushProp();
		}
	}
	if(hasProp("aria-readonly")){
		if(!readonlyInOutput && prop.val === "true" && hasRole(["checkbox","combobox","grid","gridcell","listbox","radio","radiogroup","slider","spinbutton","textbox","columnheader","menuitemcheckbox","menuitemradio","rowheader","searchbox","switch","treegrid"],"input:not([type=submit],[type=button],[type=image],[type=reset]),select,textarea")){
			readonlyInOutput = true;
			prop.out = "readonly";
		}
		pushProp();
	}

	//required
	var requiredInOutput = false;
	if($(element).is("input:not([type=submit],[type=button],[type=image],[type=reset]),textarea,select")){
		if(hasProp("required")){
			if(!readonlyInOutput){//don't put required in output, if readonly is already there
				requiredInOutput = true;
				prop.out = "required";
			}
			pushProp();
		}
	}
	if(hasProp("aria-required")){
		if(!readonlyInOutput && hasRole(["checkbox","combobox","gridcell","listbox","radio","radiogroup","slider","spinbutton","textbox"],"input:not([type=submit],[type=button],[type=image],[type=reset]),select,textarea"))
			prop.out = (!requiredInOutput && prop.val === "true") ? "required" : "";
		pushProp();
	}

	//radio button index
	if(hasRole(["radio","menuitemradio"],"input[type=radio]")){
		prop = {name:"", val:""};
		var group, radioIndex, radioCount = 0;
		if(elementData.role === "radio"){
			group = $(element).closest("[role=radiogroup]").find("[role=radio]");
		}
		else if(elementData.role === "menuitemradio"){
			group = $(element).closest("[role=group],[role=menu],[role=menubar]").find("[role=menuitemradio]");
		}
		else{//input[type=radio]
			var name = $(element).attr("name");
			if(name){ //get all radio buttons with this name
				group = $("#ANDI508-testPage input[type=radio][name]").filter(function(){ return $(this).attr("name") === name; });
			}
			else //no name attribute. group of 1
				group = $(element);
		}
		if(group){
			$(group).filter(":shown").each(function(){
				radioCount++;
				if($(this).is(element)) //check if the radio button is this one
					radioIndex = radioCount; //set the index
			});
			prop.out = radioIndex + " of " + radioCount;
		}
		pushProp();
	}

	//sort
	if(hasRole(["columnheader","rowheader"],"th")){
		if(hasProp("aria-sort")){
			prop.out = (prop.val === "ascending") ? "ascending" : (prop.val === "descending") ? "descending" : (prop.val === "other") ? "other" : "";
			pushProp();
		}
	}
	else if(hasRole(["link"],"a") && TestPageData.page_using_table){
		var header = $(element).parent();//using .parent() instead of .closest() to help with performance
		if($(header).is("th,[role=columnheader],[role=rowheader]")){
			var ariaSort = $(header).attr("aria-sort");
			if(ariaSort){
				prop = {
					name:	"aria-sort",
					val:	ariaSort,
					out:	(ariaSort === "ascending") ? "ascending" : (ariaSort === "descending") ? "descending" : (ariaSort === "other") ? "other" : ""
				};
				pushProp();
			}
		}
	}

	if(hasRole(["range","scrollbar","separator","slider","spinbutton"])){
		if(hasProp("aria-valuemax"))
			pushProp();
		if(hasProp("aria-valuemin"))
			pushProp();

		var valuetextInOutput = false;
		if(hasRole(["range","separator","slider"])){
			if(hasProp("aria-valuetext")){
				valuetextInOutput = true;
				prop.out = prop.val;
				pushProp();
			}
		}
		if(hasProp("aria-valuenow")){
			if(!valuetextInOutput) //valuetext overrides valuenow
				prop.out = prop.val;
			pushProp();
		}
	}

	//===Get properties already in AndiData
	if(elementData.accesskey){
		prop = {
			name:"accesskey",
			val: (elementData.accesskey !== " ") ? $.trim(elementData.accesskey.toUpperCase()) : " ",
			out: "accesskey \"" + elementData.accesskey + "\""
		};
		pushProp();
	}
	if(elementData.tabindex){
		prop = {name:"tabindex", val:elementData.tabindex};
		pushProp();
	}

	//===Get properties added by the module
	if(extraProps){
		for(var p=0; p<extraProps.length; p++){
			if(extraProps[p]){
				if(typeof extraProps[p] == "string")
					prop = {name: extraProps[p], val: $(element).attr(extraProps[p])};
				else //typeof array (val needed extra logic that was done in module)
					prop = {name: extraProps[p][0], val: extraProps[p][1]};

				if(prop.val)
					pushProp();
			}
		}
	}

	//This function determines if the element has a role or tagname
	function hasRole(roles, tagNames){
		return $(element).isSemantically(roles, tagNames);
	}
	//This function determines if the element has an attribute
	function hasProp(attribute){
		prop = {
			name:	attribute,
			val:	$(element).attr(attribute)
		};
		if(prop.val !== undefined)
			return true;
		return false;
	}
	//This function concatenates the output to addOnProps[0] and adds the property to the array
	function pushProp(){
		if(prop.out)
			addOnProps[0] += prop.out + ", ";
		addOnProps.push(prop);
	}

	function displayAsId(prop){
		prop.val = "<span class='ANDI508-display-id'>#"+prop.val.replace(andiUtility.whitespace_regex," #")+"</span>";
	}

	if(addOnProps[0] !== "")//Slice off last two characters: the comma and space: ", "
		addOnProps[0] = addOnProps[0].slice(0, -2);

	return addOnProps; //returns an array
};
AndiData.attachDataToElement = function(element){
	//Store elementData onto the html element's data-andi508 attribute

	//TODO: add alerts directly to data object instead of copying here.
	AndiData.data.dangers = andiAlerter.dangers;
	AndiData.data.warnings = andiAlerter.warnings;
	AndiData.data.cautions = andiAlerter.cautions;

	$(element).data("andi508", AndiData.data);

	//Attach danger class
	if(AndiData.data.dangers.length > 0)
		$(element).addClass("ANDI508-element-danger");
	//Highlight this element
	if(AndiSettings.elementHighlightsOn)
		$(element).addClass("ANDI508-highlight");
};

AndiData.addComp = function(data, componentType, component, hasNodebeenTraversed){
	var displayText = "";

	if(typeof component === "string"){
		if($.trim(component) !== ""){
			displayText = "<span class='ANDI508-display-"+componentType+"'>" +
				andiCheck.checkCharacterLimit(component, componentType) + "</span>";
		}
	}
	else{//component is an array [text, refElement, id]
		if($.trim(component[0]) !== "" || component[2]){ //add the text
			displayText = "<span class='ANDI508-display-"+componentType+"'>";

			if(component[2]) //add the referenced id
				displayText += "<span class='ANDI508-display-id'>#" + component[2] + "</span>";

			if(component[1]) //ref element laser
				displayText += andiLaser.createLaserTarget(component[1], andiUtility.formatForHtml(andiUtility.stripHTML(component[0])));

			displayText += "</span>";
		}
	}

	if(displayText){
		if(componentType === "ariaLabelledby" || componentType === "ariaDescribedby"){
			if(data[componentType])
				data[componentType].push(displayText);//push to array
			else
				data[componentType] = [displayText];//create array
		}
		else{//do not create an array
			if(data[componentType])
				data[componentType] += displayText;//append
			else
				data[componentType] = displayText;//create
		}
	}

	//if node is traversed return empty string, otherwise return displayText
	return (!hasNodebeenTraversed) ? displayText : "";
};

//This object sets up the check logic to determine if an alert should be thrown.
function AndiCheck(){
	//==Mult-Point Checks==//

	//This function is used to check for alerts related to focusable elements
	this.commonFocusableElementChecks = function(andiData, element){
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData, true);
		this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAriaIssues(element, andiData);
		this.areThereAnyDuplicateFors(element, andiData);
		this.areThereAnyTroublesomeJavascriptEvents(element);
		this.clickableAreaCheck(element, andiData);
	};

	//This function is used to check for alerts related to non-focusable elements
	this.commonNonFocusableElementChecks = function(andiData, element, isElementMustHaveName){
		this.hasThisElementBeenHiddenFromScreenReader(element, andiData);
		if(isElementMustHaveName)
			this.wasAccessibleNameFound(andiData);
		this.areThereComponentsThatShouldntBeCombined(andiData);
		this.areThereAriaIssues(element, andiData);
	};

	//==Test Page Checks==//

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

	//==Element Checks==//

	//This function resets the accessibleComponentsTable
	//returns true if components were found that should appear in the accessibleComponentsTable
	this.wereComponentsFound = function(isTabbable, accessibleComponentsTableBody){
		//calculate total
		var total = $(accessibleComponentsTableBody).find("tr").length;
		//Display total
		$("#ANDI508-accessibleComponentsTotal").html(total);

		if(total === 0){//No components. Display message in table
			var alertLevel = "danger"; //tabbable elements with no components, default to red
			if(!isTabbable)
				alertLevel = "caution"; //non-tabbable elements with no components, default to yellow
			$(accessibleComponentsTableBody).html(
				"<tr><th id='ANDI508-accessibleComponentsTable-noData' class='ANDI508-display-"+
				alertLevel+"'>No accessibility markup found for this Element.</th></tr>");
		}
	};

	//This function will throw No Accessible Name alert depending on the tagName passed
	this.wasAccessibleNameFound = function(elementData){
		if(!elementData.isAriaHidden){ //element is not aria-hidden=true and not contained by aria-hidden=true
			var tagNameText = elementData.tagNameText;
			if(!elementData.accName){

				if(elementData.components.ariaDescribedby)
					//element has no name but has ariaDescribedby
					andiAlerter.throwAlert(alert_0021);
				else { //throw No Accessible Name Alert
					if(tagNameText === "iframe"){
						if(elementData.tabindex)
							andiAlerter.throwAlert(alert_0007);
						else//no tabindex
							andiAlerter.throwAlert(alert_0009);
					}
					else if(elementData.isTabbable){
						//Does this element have a role?
						if(elementData.role){
							var roleCapitalized = elementData.role.charAt(0).toUpperCase()+elementData.role.slice(1);
							andiAlerter.throwAlert(alert_0008, roleCapitalized+" Element"+alert_0008.message);
						}
						//Is this an input element, excluding input[image]?
						else if(tagNameText.includes("input") && tagNameText != "input[type=image]"){
							switch(tagNameText){
							case "input[type=text]":
								andiAlerter.throwAlert(alert_0001, "Textbox"+alert_0001.message); break;
							case "input[type=radio]":
								andiAlerter.throwAlert(alert_0001, "Radio Button"+alert_0001.message); break;
							case "input[type=checkbox]":
								andiAlerter.throwAlert(alert_0001, "Checkbox"+alert_0001.message); break;
							default:
								andiAlerter.throwAlert(alert_0001, "Input Element"+alert_0001.message);
							}
						}
						//All other elements:
						else switch(tagNameText){
							case "a":
								andiAlerter.throwAlert(alert_0002, "Link"+alert_0002.message); break;
							case "img":
							case "input[type=image]":
								andiAlerter.throwAlert(alert_0003, "Image"+alert_0003.message); break;
							case "button":
								andiAlerter.throwAlert(alert_0002, "Button"+alert_0002.message); break;
							case "select":
								andiAlerter.throwAlert(alert_0001, "Select"+alert_0001.message); break;
							case "textarea":
								andiAlerter.throwAlert(alert_0001, "Textarea"+alert_0001.message); break;
							case "table":
								andiAlerter.throwAlert(alert_0004, alert_0004.message); break;
							case "figure":
								andiAlerter.throwAlert(alert_0005, alert_0005.message); break;
							case "th":
							case "td":
								andiAlerter.throwAlert(alert_0002, "Table Cell"+alert_0002.message); break;
							case "canvas":
								andiAlerter.throwAlert(alert_0008, "Canvas"+alert_0008.message); break;
							default:
								andiAlerter.throwAlert(alert_0002, "Element"+alert_0002.message);
						}
					}
					else{//not tabbable
						if(tagNameText === "canvas"){
							if(elementData.isFocusable || ( elementData.role != "presentation" && elementData.role != "none") ){
								andiAlerter.throwAlert(alert_0008, "Canvas"+alert_0008.message);
							}
						}
						else{
							if(elementData.role === "img"){
								andiAlerter.throwAlert(alert_0008, "[role=img] Element"+alert_0008.message);
							}
							else if(!elementData.role){
								if(tagNameText === "img" || tagNameText === "input[type=image]")
									andiAlerter.throwAlert(alert_0003, "Image"+alert_0003.message);
							}
						}
					}

				}

				if(elementData.components.legend)
					//element has no name but has legend
					andiAlerter.throwAlert(alert_0022);
			}
		}
	};

	//This function will search the test page for elements with duplicate ids.
	//If found, it will generate an alert
	//TODO: add this check when these components are detected: aria-activedescendant,aria-colcount,aria-colindex,aria-colspan,aria-controls,aria-details,aria-errormessage,aria-flowto,aria-owns,aria-posinset,aria-rowcount,aria-rowindex,aria-rowspan,aria-setsize
	this.areThereAnyDuplicateIds = function(component, id){
		if(id && testPageData.allIds.length > 1){
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (var x=0; x<testPageData.allIds.length; x++){
				if(id === testPageData.allIds[x].id){
					idMatchesFound++;
					if(idMatchesFound === 2) break; //duplicate found so stop searching, for performance
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
	this.areThereAnyDuplicateFors = function(element, data){
		if(testPageData.page_using_label && data.components.label){
			var id = $.trim($(element).prop("id"));
			if(id && testPageData.allFors.length > 1){
				var forMatchesFound = 0;
				for(var x=0; x<testPageData.allFors.length; x++){
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

	//This function goes through the LabelFor array and checks if is pointing to valid form element
	this.areLabelForValid = function(){
		if(testPageData.page_using_label){
			var referencedElement;
			for(var f=0; f<testPageData.allFors.length; f++){
				referencedElement = document.getElementById(testPageData.allFors[f].htmlFor);
				if(referencedElement && $(referencedElement).hasClass("ANDI508-element")){
					if(!$(referencedElement).isSemantically(["textbox","combobox","listbox","checkbox","radio"],"input,select,textarea,button,[contenteditable=true],[contenteditable='']"))
						//is not a form element
						andiAlerter.throwAlertOnOtherElement($(referencedElement).attr("data-andi508-index"), alert_0091);
				}
			}
		}
	};

	//This function will throw alert_0112 if commonly troublesome Javascript events are found on the element.
	this.areThereAnyTroublesomeJavascriptEvents = function(element){
		var events = "";
		if($(element).is("[onblur]"))
			events += "[onBlur] ";
		if($(element).is("input,select,textarea") && $(element).is("[onchange]"))
			events += "[onChange] ";
		if($(element).is("[ondblclick]"))
			events += "[ondblclick] ";
		if(events !== "")
			andiAlerter.throwAlert(alert_0112,[$.trim(events)]);
	};

	//This function will check the clickable area of the element.
	this.clickableAreaCheck = function(element, andiData){
		if(!andiData.components.label && $(element).is("input[type=checkbox],input[type=radio]")){
			//the element is a radio button or checkbox and does not have an associated label
			var height = $(element).height();
			var width = $(element).width();
			var clickableAreaLimit = 21; //px
			if(height < clickableAreaLimit && width < clickableAreaLimit){
				//The height and with of the element is smaller than the clickableAreaLimit
				if(andiData.tagNameText == "input[type=radio]")
					andiAlerter.throwAlert(alert_0210,["radio button"]);
				else if(andiData.tagNameText == "input[type=checkbox]")
					andiAlerter.throwAlert(alert_0210,["checkbox"]);
			}
		}
	};

	//This function will search for special aria issues and throw an alert if found.
	this.areThereAriaIssues = function(element, data){

		if($(element).is("[aria-labeledby]"))
			andiAlerter.throwAlert(alert_0031);

		if(data.roleList){
			for(var r=0; r<data.roleList.length; r++){
				if(!AndiCheck.validAriaRoles.includes(data.roleList[r])){
					andiAlerter.throwAlert(alert_0032,[data.roleList[r]]); //unsupported/invalid role
				}
			}
			if(data.roleList.length > 1)
				andiAlerter.throwAlert(alert_0033); //multiple roles
		}
	};

	//This function will throw alert_0260 or alert_0261
	//if the element has aria-hidden=true or is a child of an element with aria-hidden=true
	//NOTE: role=presentation/none are not factored in here
	//      because browsers automatically ignore them if the element is focusable
	this.hasThisElementBeenHiddenFromScreenReader = function(element, elementData, isDangerous){
		if(elementData.isAriaHidden){
			if(isDangerous) //this type of element should not be hidden from screen reader
				andiAlerter.throwAlert(alert_0260); //danger level alert
			else //this type of element could be hidden by a screen reader, but tester should investigate
				andiAlerter.throwAlert(alert_0261); //warning level alert
		}
	};

	//This function will increment the testPageData.disabledElementsCount
	//Returns true if the element is disabled
	this.isThisElementDisabled = function(element){
		if(element.disabled){
			//if the element has aria-hidden=true, assume intentiality behind making this element disabled. Therefore don't complain about this element's disabled state.
			if($(element).attr("aria-hidden") !== "true"){
				testPageData.disabledElementsCount++;
				return true;
			}
		}
		return false;
	};

	//This function will throw alert_0250 if there are disabled elements
	this.areThereDisabledElements = function(type){
		if(testPageData.disabledElementsCount > 0)
			andiAlerter.throwAlert(alert_0250,[testPageData.disabledElementsCount, type],0);
	};

	//This function will throw an alert if the canvas has no focusable children
	this.lookForCanvasFallback = function(element){
		if($(element).is("canvas")){
			if(!$(element).children().filter(":focusable").length)
				andiAlerter.throwAlert(alert_0124);
			else //has focusable fallback content
				andiAlerter.throwAlert(alert_0127);
		}
	};

	//This function will scan for deprecated HTML relating to accessibility associated with the element
	this.detectDeprecatedHTML = function(element){
		if(document.doctype !== null && document.doctype.name == "html" && !document.doctype.publicId && !document.doctype.systemId){
			var message;
			if($(element).is("table") && $(element).attr("summary")){
				var role = $(element).getValidRole();
				if(role !== "presentation" && role !== "none")
					message = ["attribute [summary] in &lt;table&gt;, use &lt;caption&gt; or [aria-label] instead"];
			}
			else if($(element).is("a") && $(element).attr("name"))
				message = ["attribute [name] in &lt;a&gt;, use [id] instead"];
			else if($(element).is("td") && $(element).attr("scope"))
				message = ["attribute [scope] on &lt;td&gt;, in HTML5 [scope] only valid on &lt;th&gt;"];

			if(message){
				if($(element).hasClass("ANDI508-element"))
					andiAlerter.throwAlert(alert_0078,message);
				else
					andiAlerter.throwAlert(alert_0078,message,0);
			}
		}
	};

	//==Component Quality Checks==//

	//this function will throw an alert if there are missingReferences
	this.areThereMissingReferences = function(attribute, missingReferences){
		//Check if any ids were not found
		if(missingReferences.length === 1){//one reference is missing
			andiAlerter.throwAlert(alert_0063, [attribute, missingReferences]);
		}
		else if(missingReferences.length > 1){//more than one reference missing
			andiAlerter.throwAlert(alert_0065, [attribute, missingReferences]);
		}
	};

	//This function will throw alert_0101
	this.areThereComponentsThatShouldntBeCombined = function(data){
		if(data.components.ariaLabel && data.components.ariaLabelledby)
			andiAlerter.throwAlert(alert_0101,["[aria-label] with [aria-labelledby]"]);
	};

	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//If the limit was exceeded, it will insert a scissors unicode
	this.checkCharacterLimit = function(componentText, componentName){
		if( componentText &&
			(componentName === "ariaLabel" || componentName === "title" || componentName === "alt") &&
			componentText.length > AndiCheck.characterLimiter
		){
			if(componentName === "ariaLabel")
				componentName = "aria-label";
			andiAlerter.throwAlert(alert_0151,[componentName]);
			return insertCharacterLimitMark(componentText);
		}
		return componentText;

		//This function inserts a pipe character into the componentText at the characterLimiter position
		//The color of the pipe is the color of a warning
		function insertCharacterLimitMark(componentText){//inject scissors unicode
			return andiUtility.formatForHtml(componentText.substring(0, AndiCheck.characterLimiter)) +
				"<span class='ANDI508-display-warning'>&hellip;&#9986;&hellip;</span>" +
				andiUtility.formatForHtml(componentText.substring(AndiCheck.characterLimiter,componentText.length));
		}
	};
}

//This function handles the throwing of alerts.
function AndiAlerter(){
	//These functions will throw Danger/Warning/Caution Alerts
	//They will add the alert to the alert list and attach it to the element
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
	//	index:			andiElementIndex of the element
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alertObject.message
	this.throwAlertOnOtherElement = function(index, alertObject, customMessage){
		var message = alertMessage(alertObject, customMessage);
		$("#ANDI508-testPage [data-andi508-index="+index+"]").data("andi508")[alertObject.level+"s"].push(messageWithHelpLink(alertObject, message));
		this.addToAlertsList(alertObject, message, index);
	};

	//This private function will add an icon to the message
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
		return "<a href='"+ help_url + "alerts.html?" + alertObject.info +"' target='_blank' "+
			"aria-label='"+alertObject.level+": "+message+" Select to Open ANDI Help"+"'>"+
			"<img alt='"+alertObject.level+"' title='Get more info about this' role='presentation' src='"+icons_url+alertObject.level+".png' />"+
			message+"</a> ";
	}

	//This function is not meant to be used directly.
	//It will add a list item into the Alerts list.
	//It can place a link which when followed, will move focus to the field relating to the alert.
	//	alertObject:	the alert object
	//  message:		text of the alert message
	//  elementIndex:	element to focus on when link is clicked. expects a number. pass zero 0 if alert is not relating to one particular element
 	this.addToAlertsList = function(alertObject, message, elementIndex){
		//Should this alert be associated with a focusable element?
		var listItemHtml = " tabindex='-1' ";
		if(elementIndex !== 0){
			//Yes, this alert should point to a focusable element. Insert as link:
			listItemHtml += "href='javascript:void(0)' data-andi508-relatedindex='"+elementIndex+"' aria-label='"+alertObject.level+": "+message+" Element #"+elementIndex+"'>"+
			"<img alt='"+alertObject.level+"' role='presentation' src='"+icons_url+alertObject.level+".png' />"+
			message+"</a></li>";
		}
		else{
			//No, This alert is not specific to an indexed element. Insert message with link to help page.
			listItemHtml += "href='"+ help_url + "alerts.html?" + alertObject.info +"' target='_blank' aria-label='"+alertObject.level+": "+message+"'>"+
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
				"<div id='ANDI508-alerts-container' class='ANDI508-scrollable' role='application'>"+
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
						group.heading+": (<span class='ANDI508-total' style='display:inline'>"+totalAlerts+"</span>)</a><ol class='ANDI508-alertGroup-list'>";
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

				$("#ANDI508-alerts-container a").each(function(){
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
							$("#ANDI508-alerts-container a.ANDI508-alertGroup-toggler").each(function(){
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
					$("#ANDI508-alerts-container a[tabindex=0]").each(function(){
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
			}
		}

		//This function will show the alert buttons that were added to the alertButtons array
		function showAlertButtons(){

			for(var x=0; x<alertButtons.length; x++){
				$("#ANDI508-alertGroup_"+alertButtons[x].group).children("a").first().after(
					"<button id='"+alertButtons[x].alertButton.id+
					"' aria-pressed='false'>"+alertButtons[x].alertButton.label +
					alertButtons[x].alertButton.overlayIcon+"</button>"
					);
				$("#"+alertButtons[x].alertButton.id).on("click",alertButtons[x].alertButton.clickLogic);
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
		new AlertGroup("ARIA Alerts"),
		new AlertGroup("Table Alerts"),
		new AlertGroup("AccessKey Alerts"),							//5
		new AlertGroup("Reference Alerts"),
		new AlertGroup("Invalid HTML Alerts"),
		new AlertGroup("Misuses of Alt attribute"),
		new AlertGroup("Misuses of Label Tag"),
		new AlertGroup("Unreliable Component Combinations"),		//10
		new AlertGroup("JavaScript Event Cautions"),
		new AlertGroup("Keyboard Access Alerts"),
		new AlertGroup("Empty Components Found"),
		new AlertGroup("Unused Components"),
		new AlertGroup("Excessive Text"),							//15
		new AlertGroup("Link Alerts"),
		new AlertGroup("Graphics Alerts"),
		new AlertGroup("Live Region Alerts"),
		new AlertGroup("Structure Alerts"),
		new AlertGroup("Button Alerts"),							//20
		new AlertGroup("Small Clickable Areas"),
		new AlertGroup("CSS Content Alerts"),
		new AlertGroup("Manual Tests Needed"),
		new AlertGroup("Contrast Alerts"),
		new AlertGroup("Disabled Element Alerts"),					//25
		new AlertGroup("Aria-Hidden Alerts")
		];
	};

	//Keeps track of alert buttons that need to be added.
	var alertButtons = [];

	this.dangers = [];
	this.warnings = [];
	this.cautions = [];

	//This function resets the alert data associated with a single element
	this.reset = function(){
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
TestPageData.allElements = undefined;
//This class is used to store temporary variables for the test page
function TestPageData(){
	//Creates the alert groups
	AndiAlerter.alertGroups = andiAlerter.createAlertGroups();

	TestPageData.allElements = $("#ANDI508-testPage *");

	//all the visible elements or elements within a canvas on the test page
	TestPageData.allVisibleElements = $(TestPageData.allElements).filter(":shown,canvas *");

	//all the ids of elements on the page for duplicate comparisons
	this.allIds = $(TestPageData.allElements).filter("[id]");

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
	this.page_using_role_radiogroup = false;
	this.page_using_role_combobox = false;
	this.page_using_role_listbox = false;
	this.page_using_role_menu  = false;

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
	this.firstLaunchedModulePrep = function(element, elementData){

		//Force Test Page to convert any css fixed positions to absolute.
		//Allows ANDI to be only fixed element at top of page.
		andiResetter.storeTestPageFixedPositionDistances(element);

		//get role from elementData if possible
		var role = (elementData) ? elementData.role : $(element).getValidRole();

		//Determine if role=group is being used
		if(!TestPageData.page_using_role_group && role === "group")
			TestPageData.page_using_role_group = true;
		if(!TestPageData.page_using_role_radiogroup && role === "radiogroup")
			TestPageData.page_using_role_radiogroup = true;
		if(!TestPageData.page_using_role_combobox && role === "combobox")
			TestPageData.page_using_role_combobox = true;
		if(!TestPageData.page_using_role_listbox && role === "listbox")
			TestPageData.page_using_role_listbox = true;
		if(!TestPageData.page_using_role_menu && role === "menu" || role === "menubar")
			TestPageData.page_using_role_menu = true;

		//Determine if role=table/grid is being used
		if(!TestPageData.page_using_table && (role === "table" || role === "grid"))
			TestPageData.page_using_table = true;
	};
}
//These variables store whether the testPage is using certain elements.
TestPageData.page_using_table = false;
TestPageData.page_using_caption = false;

//==============//
// jQuery Load: //
//==============//
//This function will check to see if the page being tested already has jquery installed.
//If not, it downloads the appropriate version from the jquery download source.
//It will also determine if an old IE version is being used
var jqueryPreferredVersion = "3.6.0"; //The preferred (latest) version of jQuery we want
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
