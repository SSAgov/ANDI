//ANDI: Accessible Name & Description Inspector
var andiVersionNumber = "5.0.8";
//Created By Social Security Administration

//%%%%%%%%%%%%%%%%%%%%%%%%%
//**JQUERY PREPARATION - start
//Load jquery, required for ANDI to work.
var jqueryPreferredVersion = "3.2.1"; //The prefered (latest) version of jQuery we want
var jqueryMinimumVersion = "1.9.1"; //The minimum version of jQuery we allow ANDI to use
var jqueryDownloadSource = "https://ajax.googleapis.com/ajax/libs/jquery/"; //where we are downloading jquery from
var oldIE = false; //used to determine if old version of IE is being used.
//This will check to see if the page being tested already has jquery installed. If not, it downloads the appropriate version from the jquery download source.
(function(){
	if (window.jQuery === undefined || window.jQuery.fn.jquery < jqueryMinimumVersion){//Need jQuery
		var script=document.createElement("script"); var done=false; 
		//Which version is needed?
		if(document.addEventListener){ script.src = jqueryDownloadSource + jqueryPreferredVersion + "/jquery.min.js";}//IE 9 or later is being used, download preferred jquery version.
		else{oldIE = true; script.src = jqueryDownloadSource + jqueryMinimumVersion + "/jquery.min.js";}//Download minimum jquery version.
		//Waits until jQuery is ready before running ANDI
		script.onload = script.onreadystatechange=function(){if(!done && (!this.readyState || this.readyState=="loaded" || this.readyState=="complete")){done=true; initAndi();}};
		document.getElementsByTagName("head")[0].appendChild(script);
	}
	else{ //jQuery already exists
		initAndi();
	}
function initAndi(){(window.andi508 = function(){
	//Ensure that $ is mapped to jQuery
	window.jQuery = window.$ = jQuery;
	//define :focusable and :tabbable pseudo classes. Code from jQuery UI
	$.extend($.expr[ ':' ], {data: $.expr.createPseudo ?$.expr.createPseudo(function(dataName){return function(elem){return !!$.data(elem, dataName);};}) : function(elem, i, match){return !!$.data(elem, match[ 3 ]);},
		focusable: function(element){return focusable(element, !isNaN($.attr(element, 'tabindex')));},
		tabbable: function(element){var tabIndex = $.attr(element, 'tabindex'),isTabIndexNaN = isNaN(tabIndex);return ( isTabIndexNaN || tabIndex >= 0 ) && focusable(element, !isTabIndexNaN);
	}});
	//Define focusable function: Determines if something is focusable and all of its ancestors are visible. Code from jQuery UI
	function focusable(element){var map, mapName, img, nodeName = element.nodeName.toLowerCase(), isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex'));if('area' === nodeName){map = element.parentNode; mapName = map.name;if(!element.href || !mapName || map.nodeName.toLowerCase() !== 'map'){return false;} img = $('img[usemap=\\#' + mapName + ']')[0]; return !!img && visible(img);}return ( /^(input|select|textarea|button|object)$/.test(nodeName) ? !element.disabled : 'a' === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN) && visible(element);function visible(element){return $.expr.filters.visible(element) && !$(element).parents().addBack().filter(function(){return $.css(this, 'visibility') === 'hidden';}).length;}}
	//Define Object.keys function to prevent javascript error on oldIE
	if (!Object.keys) {Object.keys=(function(){'use strict';var hasOwnProperty = Object.prototype.hasOwnProperty,hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),dontEnums = ['toString','toLocaleString','valueOf','hasOwnProperty','isPrototypeOf','propertyIsEnumerable','constructor'],dontEnumsLength = dontEnums.length;return function(obj) {if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {throw new TypeError('Object.keys called on non-object');}var result = [], prop, i;for (prop in obj) {if (hasOwnProperty.call(obj, prop)) {result.push(prop);}}if (hasDontEnumBug) {for (i = 0; i < dontEnumsLength; i++) {if (hasOwnProperty.call(obj, dontEnums[i])) {result.push(dontEnums[i]);}}}return result;};}());}
//**JQUERY PREPARATION - end
//%%%%%%%%%%%%%%%%%%%%%%%%%
	if(isTestPageUsingFrames()) return; //ANDI will not work with frames. Throws an alert and stops running ANDI.
	
	//=====================//
	// ANDI CONFIGURATION: //
	//=====================//
	
	//Set the hotkeys/accesskeys
	var andiAccessKey_jump = "`"; //jump between page sections
	var andiAccessKey_prev = ","; //shift focus to previous element
	var andiAccessKey_next = "."; //shift focus to next element
	var andiAccessKey_output = "/"; //shift focus to the output ruleset
	var andiAccessKey_relaunch = "="; //clicks the Relaunch button
	
	//Set the global animation speed
	var andiAnimationSpeed = 150; //milliseconds
	
	//Set the character limiter
	var characterLimiter = 250; //This number is 2x breath interval of a screen reader (125 characters)
	
	//The Default Output Ruleset
	var andiDefaultOutputRuleset = 'andi';
	
	//Representation of Empty String
	var emptyString = "[empty]";

	//Help Pages
	var help_url = "https://www.ssa.gov/accessibility/andi/help/";
	var help_howToUse = help_url+"howtouse.html";
	var help_alerts = help_url+"alerts.html";
	
	//Location where icons are stored
	var icons_url = "https:///www.ssa.gov/accessibility/andi/icons/";
	
	//Define Alert Groups
	var alertGroups = [
		group_0 = new AlertGroup("danger","0","Elements with No Accessible Name: "),
		group_1 = new AlertGroup("danger","1","Duplicate Attributes Found: "),
		group_2 = new AlertGroup("danger","2","Components That Should Not Be Used Alone: "),
		group_3 = new AlertGroup("danger","3","Misspelled ARIA Attributes: "),
		group_4 = new AlertGroup("danger","4","Table Alerts: "),
		group_5 = new AlertGroup("danger","5","Accesskey Alerts: "),
		group_6 = new AlertGroup("danger","6","ARIA Reference Alerts: "),
		group_7 = new AlertGroup("danger","7","Invalid HTML Alerts: "),
		group_8 = new AlertGroup("warning","8","Misuses of Alt attribute: "),
		group_9 = new AlertGroup("warning","9","Misuses of Label Tag: "),
		group_10 = new AlertGroup("warning","10","Risky Component Combinations: "),
		group_11 = new AlertGroup("caution","11","JavaScript Events to Investigate: "),
		group_12 = new AlertGroup("caution","12","Focusable Elements Not in Tab Order: "),
		group_13 = new AlertGroup("caution","13","Empty Components Found: "),
		group_14 = new AlertGroup("caution","14","Unused Subtree Components: "),
		
		group_16 = new AlertGroup("warning","16","Excessive Text: ")
	];

	//Define Alerts
	var alert_0001 = new Alert("danger","0"," has no accessible name, associated label, or title.","#no_name");
	var alert_0002 = new Alert("danger","0"," has no accessible name, innerText, or title.","#no_name");
	var alert_0003 = new Alert("danger","0"," has no accessible name, alt, or title.","#no_name");
	var alert_0004 = new Alert("danger","0","Table has no accessible name, caption, or title.","#no_name");
	var alert_0005 = new Alert("danger","0","Figure has no accessible name, figcaption, or title.","#no_name");

	var alert_0011 = new Alert("danger","1","Duplicate \'id\' attributes: ","#dup_id");
	var alert_0012 = new Alert("danger","1","Duplicate \'for\' attributes associate with this element's id ","#dup_for");

	var alert_0021 = new Alert("danger","2","Cannot use aria-describedby alone on this element.","#dby_alone");
	var alert_0022 = new Alert("danger","2","Cannot use legend alone on this element.","#legend_alone");

	var alert_0031 = new Alert("danger","3","Misspelled attribute:","#misspell");
	var alert_0032 = new Alert("danger","3","Aria-role not a valid attribute, use role instead.","#aria_role");

	var alert_0041 = new Alert("danger","4","Presentation table should not have a caption.","#pres_table_caption");
	var alert_0042 = new Alert("danger","4","Presentation table should not have a summary.","#pres_table_summary");

	var alert_0051 = new Alert("danger","5","Found accesskey that cannot gain focus: ","#accesskey_focus");
	var alert_0052 = new Alert("danger","5","Accesskey value has more than one character: ","#accesskey_more_one");
	var alert_0053 = new Alert("danger","5","Accesskey is Empty.","#accesskey_empty");
	var alert_0054 = new Alert("danger","5","Duplicate Accesskey found on button: ","#accesskey_duplicate_button");
	var alert_0055 = new Alert("caution","5","Duplicate Accesskey found: ","#accesskey_duplicate");

	var alert_0061 = new Alert("danger","6","Element\'s aria-labelledby references provide no name text.","#lby_refs_no_text");
	var alert_0062 = new Alert("danger","6","Element\'s aria-describedby references provide no description text.","#dby_refs_no_text");
	var alert_0063 = new Alert("danger","6","Element referenced by || with [id=||] not found.","#ref_id_not_found");
	var alert_0064 = new Alert("caution","6"," reference contains aria-label.","#ref_has_aria_label");
	var alert_0065 = new Alert("danger","6","Improper use of || possible: Referenced ids [||] not found.","#improper_ref_id_usage");

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
	
	var alert_0141 = new Alert("caution","14","Subtree contains unused text.","#subtree_unused_text");
		
	var alert_0161 = new Alert("warning","16","Title attribute length exceeds "+characterLimiter+" characters","#character_length");
	var alert_0162 = new Alert("warning","16","Alt attribute length exceeds "+characterLimiter+" characters","#character_length");
	var alert_0163 = new Alert("warning","16","Aria-label attribute length exceeds "+characterLimiter+" characters","#character_length");
	
	//==================//
	// ANDI INITIALIZE: //
	//==================//
	
	//Remove all previously placed ANDI related items (from a previous ANDI test).
	resetANDI();

	//Keeps track of the number of focusable elements ANDI has found, used to assign unique indexes.
	var andiElementIndex = 0; //the first element's index will start at 1.
	
	//Keeps track of the number of accessibility alerts found.
	var numberOfAccessibilityAlertsFound = 0;
	
	//Keeps track of the accesskeys found
	var accesskeysListHtml = "";
	var accesskeysListDuplicateComparator = "";
	
	//For laser pointing
	var laser = new Laser();
	
	//For setting focus on an element
	var focuser = new Focuser();
	
	//Defines the css for classes used.
	defineCssClassStyles();
	
	//Insert ANDI display's html structure onto the page.
	insertANDIdisplay();
	
	//Add javascript event logic to settings/controls.
	defineControls();

	//Scan test page for accessibility alerts and accessibility components.
	testPageScan();

	//Insert final counts/totals into ANDI display. Add some functionality if there are elements and alerts.
	updateDisplayDependingOnResults();
	
	//Load previously saved settings.
	loadANDIsettings();

	//Push down test page so ANDI display can be fixed at top of screen.
	resizeHeights();
	
	//Place starting focus on ANDI.
	$("#ANDI508").focus();
			
	//=================//
	// MAIN FUNCTIONS: //
	//=================//
	
	//Will store all the ids and fors of visible elements on the page for duplicate comparisons
	var allIds, allFors = "";
	//Booleans which will be set if the associated tags are found. Helps with performance.
	var page_using_figure, page_using_fieldset, page_using_table, page_using_label = false;
	//This function will scan the test page for some alert conditions and the existence of certain elements
	function testPageScan(){
		
		//Is page using html5?
		isTheDoctypeHTML5();
		
		//Check for page title
		isThereExactlyOnePageTitle();
	
		//Warn if the total number legends/captions/figcaptions is greater than the total number of fieldsets/tables/figures.
		areThereMoreExclusiveChildrenThanParents();
	
		//Get all ids on the page and store for later comparison
		allIds = $('#ANDI508-testPage [id]').filter(':visible');
		
		//determine if labels are being used on the page?
		if($("#ANDI508-testPage label").filter(":visible").length*1>0){
			page_using_label = true;
			//get all 'for's on the page and store for later comparison
			allFors = $('[for]').filter(':visible');
		}
		
		//Loop through every visible element and run tests
		$('#ANDI508-testPage *').filter(':visible').each(function(){
			//Force Test Page to convert any css fixed positions to absolute. Allows ANDI to be only fixed element at top of page.
			storeTestPageFixedPositionDistances(this);
			
			//If element is focusable, search for accessibility components.
			if($(this).is(":focusable")){
				lookForAccessibityAndDisplayIfFound($(this));
			}
			else{
				areThereAccesskeysThatCanNeverGetFocus(this);
				areThereAnyMouseEventsWithoutKeyboardAccess(this);
			}
			detectDeprecatedHTML(this);
		});
	}
	
	//This function defines the Text Alternative Computation / Output for a ruleset.
	//It uses the ANDI508 data object and orders the accessible components according to the ruleset provided.
	//Parameters:
	//	ruleset: a string representing the ruleset used: "andi"
	//	element: an html element
	function displayOutputFor(ruleset, element){
		var outputDisplay = ""; //output order will be concatenated to this and eventually displayed.

		var dangers = $(element).data("ANDI508").dangers;
		var warnings = $(element).data("ANDI508").warnings;
		var cautions = $(element).data("ANDI508").cautions;

		//These variables are actually functions. They will be called by the output logic.
		//Return false if the component is empty
		//Return true if not empty and will add html to the output display.
		//TODO: use the same variables as was defined for getAccessibleComponents to save memory
		var aria_label = 		(function(){return andiFound($(element).data("ANDI508").ariaLabel,		"aria-label")});
		var aria_labelledby = 	(function(){return andiFound($(element).data("ANDI508").ariaLabelledby,	"aria-labelledby")});
		var label = 			(function(){return andiFound($(element).data("ANDI508").label,			"label")});
		var labelNested = 		(function(){return andiFound($(element).data("ANDI508").labelNested, 	"label")});
		var labelFor = 			(function(){return andiFound($(element).data("ANDI508").labelFor,		"label")});
		var alt = 				(function(){return andiFound($(element).data("ANDI508").alt,			"alt")});
		var value = 			(function(){return andiFound($(element).data("ANDI508").value,			"value")});
		var imageSrc = 			(function(){return andiFound($(element).data("ANDI508").imageSrc,		"imageSrc")});
		var aria_describedby =  (function(){return andiFound($(element).data("ANDI508").ariaDescribedby,"aria-describedby")});
		var title = 			(function(){return andiFound($(element).data("ANDI508").title,			"title")});
		var legend = 			(function(){return andiFound($(element).data("ANDI508").legend,			"legend")});
		var figcaption = 		(function(){return andiFound($(element).data("ANDI508").figcaption,		"figcaption")});
		var caption = 			(function(){return andiFound($(element).data("ANDI508").caption,		"caption")});
		//var subtree = 		(function(){return andiFound($(element).data("ANDI508").subtree,		"&lt;subtree&gt;")});
		//innerText also calls subtree
		var innerText = 		(function(){
									var innerTextResult = andiFound($(element).data("ANDI508").innerText, "innerText");
									andiFound($(element).data("ANDI508").subtree, "&lt;subtree&gt;") //comes after innertext
									return innerTextResult});
		
		var addOnProperties = $(element).data("ANDI508").addOnProperties;
		var readonly = (function(){if(addOnProperties) return andiFound(addOnProperties.readonly, "readonly", "addOnProperties"); else return false});
		var required = (function(){if(addOnProperties) return andiFound(addOnProperties.required, "required", "addOnProperties"); else return false});
		var disabled = (function(){if(addOnProperties) return andiFound(addOnProperties.disabled, "disabled", "addOnProperties"); else return false});
		var invalid =  (function(){if(addOnProperties) return andiFound(addOnProperties.invalid,  "invalid", "addOnProperties"); else return false});
		var haspopup = (function(){if(addOnProperties) return andiFound(addOnProperties.haspopup, "haspopup", "addOnProperties"); else return false});
		var sort = 	   (function(){if(addOnProperties) return andiFound(addOnProperties.sort, 	  "sort", "addOnProperties"); else return false});
		
		var ignoreLegend = $(element).data("ANDI508").ignoreLegend;
		var ignoreFigcaption = $(element).data("ANDI508").ignoreFigcaption;
		var ignoreCaption = $(element).data("ANDI508").ignoreCaption;
		var ignoreLabel = $(element).data("ANDI508").ignoreLabel;
		var ignoreAlt = $(element).data("ANDI508").ignoreAlt;

		//Determine Output
		if("andi"==ruleset){
			if(dangers.length!=0){
				//dangers were found during load
				for(x=0; x<dangers.length; x++){
					andiFound(dangers[x],"danger");
				}
			}
			else{ //No dangers found during load
				andi_logic();
			}
			if(warnings.length!=0){
				//warnings were found during load
				for(x=0; x<warnings.length; x++){
					andiFound(warnings[x],"warning");
				}
			}
			if(cautions.length!=0){
				//cautions were found during load
				for(x=0; x<cautions.length; x++){
					andiFound(cautions[x],"caution");
				}
			}
		}

		$("#ANDI508-outputText").html(outputDisplay); //Place the output display into the container.
		$("#ANDI508-outputContainer").show(); //Place the output display onto the screen.

		//This function will add the component to the outputDisplay if it is not empty.
		//Parameters:
		//	accessibleComponentText: text that will appear on the screen as the output
		//	componentType: component type that will be the class and title attribute
		//	classExtensionOverride: this is used for addon properties
		function andiFound(accessibleComponentText,componentType,classExtensionOverride){
			if(accessibleComponentText!="" && accessibleComponentText !== undefined && accessibleComponentText!=emptyString){
				if(classExtensionOverride){
					//for addon properties
					outputDisplay += "<span class='ANDI508-display-"+classExtensionOverride+"' title='"+classExtensionOverride+" "+componentType+"'>"+accessibleComponentText+"</span> ";
				}
				else if(componentType=='legend'){
					//prepend
					outputDisplay = "<span class='ANDI508-display-"+componentType+"' title='"+componentType+"'>"+accessibleComponentText+"</span> " + outputDisplay;
				}
				else{
					//append
					if(!matchingTest(accessibleComponentText,componentType))
						outputDisplay += "<span class='ANDI508-display-"+componentType+"' title='"+componentType+"'>"+accessibleComponentText+"</span> ";
				}
				return true;
			}
			return false;
		}
		
		//This function will return false if title or aria-describedby text matches a namer's text
		//Parameters:
		//	accessibleComponentText: text that will be compared for matches
		//	componentType: component type (describer) to compare namers against
		function matchingTest(accessibleComponentText,componentType){
			var matchFound = false;
			if(	componentType == 'title' 
				|| componentType == 'aria-describedby'){
				if(
					accessibleComponentText==$(element).data("ANDI508").ariaLabelledby
					|| accessibleComponentText==$(element).data("ANDI508").ariaLabel
					|| accessibleComponentText==$(element).data("ANDI508").label
					|| accessibleComponentText==$(element).data("ANDI508").alt
					|| accessibleComponentText==$(element).data("ANDI508").innerText
					|| accessibleComponentText==$(element).data("ANDI508").value
				)
				matchFound = true;
			}
			return matchFound;
		}
		
		//This function defines ANDI's output logic.
		//Look how simple it is!
		function andi_logic(){
				var usingTitleAsNamer = false;
				if(!ignoreLegend && legend()); //Spec not clear on placement relating to form elements. Screen Readers are prefixing it to form elements.
			//Accessible Name
				if(aria_labelledby());
				else if(aria_label());
			//HTML Namers
				else if(!ignoreLabel && label());
				else if(!ignoreAlt && alt());
				else if(!ignoreFigcaption && figcaption());
				else if(!ignoreCaption && caption());
				else if(value());
				else if(innerText());
				else if(title()) usingTitleAsNamer=true;
			//Accessible Description
				if(aria_describedby());
			//HTML Describers
				else if(!usingTitleAsNamer && title());
				
			//Add-On Properties
				if(readonly() || required());
				else if(sort());
				if(disabled() || invalid());
				if(haspopup());
		}
	}

	//This function marks the elements, assigns an index, gets the element's accessible components, 
	//attaches mouse/keyboard events to the element, and throws alerts for potential accessibility issues.
	function lookForAccessibityAndDisplayIfFound(element){
		andiElementIndex++;//increment index
		$(element).addClass("ANDI508-element")
				  .attr("data-ANDI508-index",andiElementIndex)
				  .on("focus",andiElementFocusability)
				  .on("mouseover",andiElementHoverability);
		getAccessibleComponents(element);

		if($(element).data("ANDI508").dangers.length>0){
			$(element).addClass("ANDI508-element-danger");
		}
		//Highlight the page elements
		if(elementHighlightsSetting){
			$(element).addClass("ANDI508-highlight");
		}
	}

	//This function will get the acccessible components for the element.
	//It will also add dangers as they are found.
	var accessibleComponentsTotal = 0; //used to display the number of accessible components found for the element
	var andi_data = {}; //object used for collecting the components, to be eventually inserted into the element using jquery .data()
	var andi_dangers = []; //object used for collecting dangers. Will be inserted into andi_data
	var andi_warnings = []; //object used for collecting warnings. Will be inserted into andi_data
	var andi_cautions = []; //object used for collecting cautions. Will be inserted into andi_data
	var andi_addOnProperties = {}; //object used for collecting addOnProperties. Will be inserted into andi_data
	var namerFound, describerFound = false;
	var tabbable;
	var ariaLabelledby, ariaLabel, label, alt, value, innerText, title, ariaDescribedby, caption, figcaption, legend, imageSrc, subtree;
	function getAccessibleComponents(element){

		//Reset objects/variables to empty
		andi_data = {};
		andi_dangers = [];
		andi_warnings = [];
		andi_cautions = [];
		andi_addOnProperties = {};
		accessibleComponentsTotal = 0;
		namerFound = false;
		describerFound = false;
		tabbable = true;
		
		//Grab accessible components - set 1:
		ariaLabelledby = 	grab_ariaLabelledby(element);
		ariaLabel = 		grab_ariaLabel(element);
		label = 			grab_label(element);
		//Grab accessible components - set 2:
		alt = 				grab_alt(element);
		value = 			grab_value(element);
		innerText = 		grab_innerText(element);
		caption = 			grab_caption(element);
		figcaption = 		grab_figcaption(element);
		//Grab accessible components - set 3:
		title = 			grab_title(element);
		ariaDescribedby = 	grab_ariaDescribedby(element);
		legend = 			grab_legend(element);
				
		//Insert into andi_data
		andi_data = $.extend(andi_data,{
			ariaLabelledby:ariaLabelledby,
			ariaLabel:ariaLabel,
			label:label,
			alt:alt,
			value:value,
			innerText:innerText,
			title:title,
			ariaDescribedby:ariaDescribedby,
			caption:caption,
			figcaption:figcaption,
			legend:legend
		});
		
		//For these components, there can only ever be one per node tree
		grab_imageSrc(element);
		grab_tagName(element);
		grab_tabindex(element);
		grab_addOnProperties(element);
		grab_accessKey(element);
		
		//Was accessible markup found?
		if(tabbable && !namerFound && !describerFound && !subtree){
			noAccessibleMarkupFound(andi_data.tagName);
		}

		andi_data = $.extend(andi_data,{accessibleComponentsTotal:accessibleComponentsTotal});
		
		//Additional Element-Linkable Alerts:
		areThereComponentsThatShouldntBeCombined();
		areAnyComponentsEmpty();
		areThereAnyMisspelledAria(element);
		areThereAnyDuplicateIds(element);
		areThereAnyDuplicateFors(element);
		areThereAnyTroublesomeJavascriptEvents(element);
				
		//add these objects to the andi_data object
		andi_data = $.extend(andi_data,{
			namerFound:		namerFound,
			describerFound:	describerFound,
			dangers:		andi_dangers,
			warnings:		andi_warnings,
			cautions:		andi_cautions
		});

		//store andi_data onto the html element
		$(element).data("ANDI508",andi_data);
	}
	
	//===========//
	// GRABBERS: //
	//===========//
		
	//**aria-label**
	//This function attempts to grab the aria-label if it exists
	function grab_ariaLabel(element){
		//Does the element contain an aria-label attribute? 
		var aria_label = $(element).attr("aria-label");
		if(aria_label !== undefined){
			accessibleComponentsTotal++;
			if($.trim(aria_label)==""){
				aria_label = addToEmptyComponentList("aria-label");
			}
			else{//not empty
				namerFound = true;
				improperCombinationCheck("aria-label","aria-labelledby");
				//Check length
				if(checkCharacterLimit(aria_label,alert_0163))
					aria_label = insertCharacterLimitMark(aria_label);
				else
					aria_label = formatForHtml(aria_label);
			}
			return aria_label;
		}
		return "";
	}
		
	//**aria-labelledby**
	//This function attempts to grab the aria-labelledby if it exists
	function grab_ariaLabelledby(element){
		//Does the element contain an aria-labelledby attribute? 
		var aria_labelledby = $(element).attr("aria-labelledby");
		if(aria_labelledby !== undefined){
			accessibleComponentsTotal++;
			if($.trim(aria_labelledby)==""){
				return addToEmptyComponentList("aria-labelledby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-labelledby
				return grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-labelledby");
			}
		}
		return "";
	}
	
	//**label**
	//This function attempts to grab the label by calling grab_labelNested and grab_labelFor.
	//For performance increase, check page_using_label before calling this method.
	//NOTE: label nested will take precedence over label for
	function grab_label(element){
		if(page_using_label){
			var labelNestedText = grab_labelNested(element);
			var labelForText = grab_labelFor(element);
			var labelText = false;

			if(labelNestedText!==false)
				labelText = labelNestedText;
			else if(labelForText!==false)
				labelText = labelForText;
				
			if(labelText!==false){
				if(labelText==""){
					labelText = addToEmptyComponentList("label");
				}
				else if(andi_data.ignoreLabel!="true"){
					namerFound = true;
					labelText = laser.createLaserTarget("label",andiElementIndex,formatForHtml(labelText));
				}
				accessibleComponentsTotal++;
				return labelText;
			}
		}
		return "";
	}

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
				andi_data = $.extend(andi_data,{ignoreLabel:"true"}); //ignore the nested label for ANDI output
			$(closestLabel).attr("data-ANDI508-relatedIndex",andiElementIndex);
			var labelObject = $(closestLabel).clone(); //make a copy
			$(labelObject).children().remove();
			var labelText = $.trim($(labelObject).text());
			andi_data = $.extend(andi_data,{labelNested:labelText});
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
					andi_data = $.extend(andi_data,{labelFor:labelText});
					//Is it okay for this element to have a label?
					if($(element).is(":submit") || $(element).is(":button") || $(element).is(":reset")){
						//No, label not valid on a button
						throwAlert(alert_0092);
						andi_data = $.extend(andi_data,{ignoreLabel:"true"}); //ignore the label for ANDI output
					}
					else if( !($(element).not(":submit").not(":button").not(":reset").not(":image").is("input"))
						&& !$(element).is("select") && !$(element).is("textarea")  )
					{
						//No, label not valid on anything that isn't a form element, excluding buttons
						throwAlert(alert_0091);
						andi_data = $.extend(andi_data,{ignoreLabel:"true"}); //ignore the label for ANDI output
					}
					else
						$(this).attr("data-ANDI508-relatedIndex",andiElementIndex);
					return; //ensures that it only retrieves 1 label even if there are more
				}
			});
		}
		return labelText;
	}
	
	//**alt**
	//This function attempts to grab the alt if it exists (for all elements, not just images)
	function grab_alt(element){
		//Does it contain an alt?
		var alt = $(element).attr("alt");
		if(alt !== undefined){
			accessibleComponentsTotal++;
			if($.trim(alt)==""){
				alt = addToEmptyComponentList("alt");
			}
			if(!$(element).is("img") && !$(element).is("input:image") && !$(element).is("area")){
				//alt should not be used on this element
				andi_data = $.extend(andi_data,{ignoreAlt:"true"});
				throwAlert(alert_0081);
			}
			else{//element is an image
				if(alt!=emptyString){
					namerFound = true;
					improperCombinationCheck("alt","aria-labelledby aria-label");
					//Check length
					if(checkCharacterLimit(alt,alert_0162))
						alt = insertCharacterLimitMark(alt);
					else
						alt = formatForHtml(alt);
				}
			}
			return alt;
		}
		return "";
	}
	
	//**value**
	//This function attempts to grab the value of an input button/submit/reset if it is not empty
	function grab_value(element){
		if($(element).is("input:submit") || $(element).is("input:button") || $(element).is("input:reset") || $(element).is("input:image")){
			var valueText = $(element).val();
			if(valueText!=""){
				namerFound = true;
				accessibleComponentsTotal++;
				return formatForHtml(valueText);
			}
		}
		return "";
	}

	//**innerText**
	//This function attempts to grab the innerText of the element if it is not empty
	//NOTE: &nbsp; is considered empty (browser is handling this automatically)
	function grab_innerText(element){
		var innerTextVisible = "";
		if(!$(element).is(":empty") && !$(element).is("select") && !$(element).is("textarea")){
			innerTextVisible = getTextOfTree(element,true);
			if(innerTextVisible != ""){
				namerFound = true;
				accessibleComponentsTotal++;
			}
			//If button or link
			if($(element).is("button") || $(element).is("a")){//TODO: eventually remove this check
				grab_subtreeComponents(element);
			}
		}
		return formatForHtml(innerTextVisible);
	}
	
	//**aria-describedby**
	//This function attempts to grab the aria-describedby if it exists
	//Should be called after the namers in order to throw alert_0021
	function grab_ariaDescribedby(element){
		//Does the element also contain an aria-describedby attribute?
		var aria_describedby = $(element).attr("aria-describedby");
		if(aria_describedby !== undefined){
			accessibleComponentsTotal++;
			if($.trim(aria_describedby)==""){
				aria_describedby = addToEmptyComponentList("aria-describedby");
			}
			else{
				//Yes, search for the tags whose ids are listed in the aria-describedby
				aria_describedby = grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,"aria-describedby");
			}
			improperCombinationCheck("aria-describedby","title");
			if(!namerFound && (!title || title==emptyString)){
				//don't use aria-describedby by itself
				throwAlert(alert_0021);
			}
			return aria_describedby;
		}
		return "";
	}

	//**title**
	//This function attempts to grab the title if it exists
	function grab_title(element){
		//Does it contain a title?
		var title = $(element).attr("title");
		if(title !== undefined){
			accessibleComponentsTotal++;
			if($.trim(title)==""){
				title = addToEmptyComponentList("title");
			}
			else{//not empty
				if(!namerFound)
					namerFound = true;//title is a namer
				else
					describerFound = true;//title is a describer
				//Check length
				if(checkCharacterLimit(title,alert_0161))
					title = insertCharacterLimitMark(title);
				else
					title = formatForHtml(title);
			}
			return title;
		}
		return "";
	}
	
	//**legend/fieldset**
	//This function attempts to grab the legend if it exists and element is or is within a fieldset.
	//For performance increase, check page_using_legend before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	function grab_legend(element){
		if(page_using_fieldset){
			var fieldset;
			if($(element).is("fieldset"))
				fieldset = $(element); //element is a fieldset.
			else{ //Does the element have an ancestor fieldset?
				fieldset = $(element).closest("fieldset"); //element is contained in a fieldset.
			}
			if(fieldset.length){
				//element is contained in a fieldset
				if($(fieldset).has("legend").length == 1){
					var legendText = getTextOfTree($(fieldset).find("legend"),true);
					accessibleComponentsTotal++;
					if(($(element).not(":submit").not(":button").not(":reset").not(":image").is("input"))
						|| $(element).is("select") || $(element).is("textarea") || $(element).is("fieldset")){
						//Check for improper legend combinations
						improperCombinationCheck("legend","aria-label aria-labelledby title aria-describedby");
						//Check if legend is the only component - all namer grabs should have already happened
						if(!namerFound && !$(element).is("fieldset")){
							throwAlert(alert_0022);
						}
						//Check if legend is empty
						if(legendText==""){
							legendText = addToEmptyComponentList("legend");
						}
						else if($(element).is("fieldset"))
							namerFound = true;//legend is a namer for a fieldset
					}
					else
						//This is not an element that legend can be placed on, ignore it.
						andi_data = $.extend(andi_data,{ignoreLegend:"true"});
					return formatForHtml(legendText);
				}
			}
		}
		return "";
	}
	
	//**figcaption/figure**
	//This function attempts to grab the figcaption if it exists and element is or is within a figure.
	//For performance increase, check page_using_figure before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	function grab_figcaption(element){
		if(page_using_figure){
			var figure;
			if($(element).is("figure"))
				figure = $(element); //element is a figure.
			else{ //Does the element have an ancestor figure?
				andi_data = $.extend(andi_data,{ignoreFigcaption:"true"});//only concerned with figcaption on figure, but still display in table
				figure = $(element).closest("figure"); //element is contained in a figure.
			}
			if(figure.length){
				if($(figure).has("figcaption").length == 1){
					var figcaptionText = getTextOfTree($(figure).find("figcaption"),true);
					accessibleComponentsTotal++;
					if(!andi_data.ignoreFigcaption){
						//Check for improper figcaption combinations
						improperCombinationCheck("ficaption","aria-label aria-labelledby");
						//Check if figcaption is empty
						if(figcaptionText==""){
							figcaptionText = addToEmptyComponentList("figcaption");
						}
						else//not empty
							namerFound = true;
					}
					return formatForHtml(figcaptionText);
				}
			}
		}
		return "";
	}
	
	//**caption/table**
	//This function attempts to grab the caption if it exists and element is or is within a table.
	//For performance increase, check page_using_table before calling this method.
	//Should be called toward the end of the grabs since it depends on other fields to throw alerts
	function grab_caption(element){
		if(page_using_table){
			var table;
			if($(element).is("table"))
				table = $(element); //element is a table.
			else{ //Does the element have an ancestor table?
				andi_data = $.extend(andi_data,{ignoreCaption:"true"});//only concerned with caption on table, but still display in components table
				table = $(element).closest("table"); //element is contained in a table.
			}
			if(table.length){
				if($(table).has("caption").length == 1){
					var captionText = getTextOfTree($(table).find("caption"),true);
					accessibleComponentsTotal++;
					if(!andi_data.ignoreCaption){
						//Check for improper caption combinations
						improperCombinationCheck("caption","aria-label aria-labelledby");
						//check if caption is empty
						if(captionText==""){
							captionText = addToEmptyComponentList("caption");
						}
						else//not empty
							namerFound = true;
						if($(table).attr('role')=='presentation'){
							//table has role=presentation and a caption
							throwAlert(alert_0041);
						}
					}
					return formatForHtml(captionText);
				}
			}
		}
		return "";
	}
	
	//**imageSrc**
	//This function attempts to grab the image source from img, input:image, and area
	function grab_imageSrc(element){
		if($(element).is("img") || $(element).is("input:image") || $(element).is("area")){
			var imageSrc;
			if($(element).is("area")){
				var map = $(element).closest("map");
				if(map)
					imageSrc = $('#ANDI508-testPage img[usemap=\\#' + $(map).attr("name") + ']').first().attr('src');
			}
			else{ //img or input:image
				imageSrc = $(element).attr('src');
			}
			
			if(imageSrc){
				accessibleComponentsTotal++;
				if(imageSrc==''){
					imageSrc = addToEmptyComponentList("imageSrc");
				}
				else{
					imageSrc = imageSrc.split("/").pop(); //get the filename and extension only
				}
				andi_data = $.extend(andi_data,{imageSrc:imageSrc});
			}
		}
	}
	
	//**tabindex**
	//This function attempts to grab the tabindex if it exists
	function grab_tabindex(element){
		var tabindex = $.trim($(element).attr("tabindex"));
		if(tabindex){
			accessibleComponentsTotal++;
			andi_data = $.extend(andi_data,{tabindex:tabindex});
			if(isNaN(tabindex) || tabindex==''){
				//tabindex is not a number
				var message = alert_0077.message+"("+tabindex+").";
				throwAlert(alert_0077,message);
			}
			else if(!$(element).is(":tabbable") && $(element).closest(":tabbable").html()===undefined){
				//element and ancestor are not tabbable
				if(namerFound)
					throwAlert(alert_0121);
				else{
					if(!($(element).is("a") && !$(element).attr("href")))
						throwAlert(alert_0122);
				}
				tabbable = false;
			}
			//else element is tabbable
		}
	}
				
	//**add-On Properties**
	//This function will grab add-on properties of the element
	//Properties: readonly, aria-readonly, required, aria-required, aria-invalid, aria-disabled
	function grab_addOnProperties(element){
		if( ( $(element).is("input") || $(element).is("textarea") || $(element).is("select") ) 
			&& (!$(element).is(":submit") && !$(element).is(":button") && !$(element).is(":reset") ) ){
			if($(element).prop('readonly') || $(element).attr('aria-readonly')=='true'){
				andi_addOnProperties = $.extend(andi_addOnProperties,{readonly:'readonly'});
			}
			else if($(element).attr('required') || $(element).attr('aria-required')=='true'){
				andi_addOnProperties = $.extend(andi_addOnProperties,{required:'required'});
			}
			if($(element).attr('aria-invalid')=='true'){
				andi_addOnProperties = $.extend(andi_addOnProperties,{invalid:'invalid'});
			}
		}
		else if($(element).is("th") && $(element).attr('aria-sort') ){
				andi_addOnProperties = $.extend(andi_addOnProperties,{sort:'sortable'});
		}
		if( $(element).is("input") || $(element).is("textarea") || $(element).is("select") || $(element).is("button") ){
			if($(element).attr('aria-disabled')=='true'){
				andi_addOnProperties = $.extend(andi_addOnProperties,{disabled:'unavailable'});
			}
		}
		if($(element).attr('aria-haspopup')=='true'){
			andi_addOnProperties = $.extend(andi_addOnProperties,{haspopup:'popUp'});
		}
		//If add on props were found, add to andi_data object
		if(!$.isEmptyObject(andi_addOnProperties)){
			accessibleComponentsTotal++;
			andi_data = $.extend(andi_data,{addOnProperties:andi_addOnProperties});
		}
	}
	
	//This function will grab the tagName of the element
	//If the element is an input, it will add the type in brackets
	function grab_tagName(element){
		var tagNameText = $(element).prop('tagName').toLowerCase()
		if(tagNameText=='input'){
			tagNameText += "["+$(element).prop('type').toLowerCase()+"]"; //add the type within brackets
		}
		andi_data = $.extend(andi_data,{tagName:tagNameText});
	}
	
	//**subtree components**
	//This function will grab the accessible components of a subtree
	//It will concatenate html namers on the subtree to html namers of the parent element
	//This function will return, in one string, the namers and describers of the subtree if they exist.
	//TODO: For now, this is only being called on img inside links and buttons. Eventually it could become a fully recursive function
	function grab_subtreeComponents(element){
		//Is there a decendant image?
		var img = $(element).clone().find('img');
		if($(img).attr('src')){ //TODO: check for css background images
			//Yes.
			grab_imageSrc(img);

			var subtreeText = "";
			var tempText = "";
			//try to get namers from subtree
			tempText = grab_ariaLabelledby(img);
			if(tempText && tempText!=emptyString)
				subtreeText += addSubtreeComponent(tempText,"aria-labelledby");
			
			tempText = grab_ariaLabel(img);
			if(tempText && tempText!=emptyString)
				subtreeText += addSubtreeComponent(tempText,"aria-label");
			
			tempText = grab_alt(img);
			if(tempText && tempText!=emptyString)
				subtreeText += addSubtreeComponent(tempText,"alt");
			
			tempText = grab_title(img);
			if(tempText && tempText!=emptyString)
				subtreeText += addSubtreeComponent(tempText,"title");
							
			if(subtreeText!=""){
				namerFound = true;
				andi_data = $.extend(andi_data,{subtree:subtreeText});
			}
			
			//Is there already an aria-label or aria-labelledby on the parent element?
			if(subtreeText!="" && (ariaLabel || ariaLabelledby)){
				//Yes. subtree has unused text (components with text)
				//TODO: list the components the text came from
				throwAlert(alert_0141);
			}
		}
		//This function creates a subtree component element
		function addSubtreeComponent(subtreeComponentText,type){
			return "<span class='ANDI508-display-"+type+"'><span class='ANDI508-subtreeComponent'>" + type + ": </span>" + formatForHtml(subtreeComponentText) + "</span> ";
		}
	}
	
	//**accesskey**
	//This function will grab the accesskey and put it in the addToAccessKeysList
	function grab_accessKey(element){
		if($(element).is('[accesskey]')){
			var accesskey = $.trim($(element).attr("accesskey").toUpperCase());
			var key = "[" + accesskey + "]";
			//Is accesskey value more than one character?
			if(accesskey.length>1){ //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
				throwAlert(alert_0052,alert_0052.message+key);
				addToAccessKeysList(accesskey,$(element).attr("data-ANDI508-index"),alert_0052);
			}
			//Is accesskey empty?
			else if(accesskey.length==0){
				throwAlert(alert_0053);
				accesskey = emptyString;
				addToAccessKeysList(accesskey,$(element).attr("data-ANDI508-index"),alert_0053);
			}
			else{
				//Check for duplicate accesskey
				if(accesskeysListDuplicateComparator.indexOf(accesskey) != -1){
					if($(element).is("button") || $(element).is("input:submit") || $(element).is("input:button") || $(element).is("input:reset") || $(element).is("input:image")){
						//duplicate accesskey found on button
						throwAlert(alert_0054,alert_0054.message+key);
						addToAccessKeysList(accesskey,$(element).attr("data-ANDI508-index"),alert_0054);
					}
					else{
						//duplicate accesskey found
						throwAlert(alert_0055,alert_0055.message+key);
						addToAccessKeysList(accesskey,$(element).attr("data-ANDI508-index"),alert_0055);
					}
				}
				else
					addToAccessKeysList(accesskey,$(element).attr("data-ANDI508-index"));
			}
			accessibleComponentsTotal++;
			andi_data = $.extend(andi_data,{accesskey:accesskey});
		}
	}
	
	//===================//
	// HELPER FUNCTIONS: //
	//===================//
	
	//This function will parse the html tree of the element 
	//and return the innerText of its and its children elements that are not hidden.
	function getTextOfTree(element,ignoreInvisible){
		var clone = $(element).clone();
		//var cloneChildren = $(clone).children();
		if($(clone).html() !== undefined){
			//Element has children
			if(ignoreInvisible){
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
	}

	//This function is used to grab the list of the associated html tags containing ids that match a 
	//space delimited accessibility attribute's id reference list such as aria-labelledby and aria-describedby.
	//It will grab the associated element's innerText even if it is hidden (how the screen readers work)
	//Parameters:
	//	element: an html object/tag
	//	attribute: the name of the attribute. e.g. "aria-labelledby" "aria-describedby"
	//Returns:
	//	A space delimited string containing the accumulated text of the referenced elements
	function grabAssociatedTagsUsingSpaceDelimitedListAttribute(element,attribute){
		var ids = $(element).attr(attribute);//get the ids to search for
		var idsArray = ids.split(" "); //split the list on the spaces, store into array. So it can be parsed through one at a time.
		var accumulatedText = "";//this variable is going to store what is found. And will be returned
		//Traverse through the array
		for (var x=0;x<idsArray.length;x++){
			//Can the aria list id be found somewhere on the page?
			var referencedId = idsArray[x].replace(/(:|\.|\[|\]|,|=|@)/g, '\\$1');
			var referencedElement = $("#"+referencedId);//will escape css syntax and treat as literals
			var referencedElementText = "";
			
			if($(referencedElement).attr('aria-label')){
				//Yes, this id was found and it has an aria-label
				referencedElementText += formatForHtml($(referencedElement).attr('aria-label'));
				//Aria-label found on reference element
				var message = attribute + alert_0064.message;
				throwAlert(alert_0064,message);
			}
			else if($(referencedElement).html() !== undefined){
				//Yes, this id was found and it has innerHTML
				referencedElementText += formatForHtml(getTextOfTree(referencedElement,false));
			}
			else{
				//No, this id was not found, add to list.
				alert_0065.list += idsArray[x] + " "; //will be used if more than one idrefs missing
				alert_0063.list = idsArray[x]; //will be used if only one idref missing
			}
			//Add referenceId
			referencedElementText = laser.createLaserTarget(attribute,referencedId,referencedElementText);
			//Add to accumulatedText
			accumulatedText += referencedElementText + " ";
		}
		//Check if any ids were not found
		if(alert_0065.list!=""){
			var missingIdsList = $.trim(alert_0065.list).split(" ");
			var message, splitMessage;
			if(missingIdsList.length > 1){//more than one id missing; Possible misuse
				splitMessage = alert_0065.message.split("||");
				message = splitMessage[0] + attribute + splitMessage[1] + $.trim(alert_0065.list) + splitMessage[2];
				throwAlert(alert_0065,message);
				alert_0063.list = ""; //reset the other list
			}
			else{//only one id missing
				splitMessage = alert_0063.message.split("||");
				message = splitMessage[0] + attribute + splitMessage[1] + alert_0063.list + splitMessage[2];
				throwAlert(alert_0063,message);
				alert_0065.list = ""; //reset the other list
			}
		}
		//Check if references provided text
		accumulatedText = $.trim(accumulatedText);
		if(attribute=="aria-labelledby"){
			if(accumulatedText=="" && alert_0131.list.indexOf("labelled")!=-1){
				//ALL of the aria-labelledby references do not return any text
				throwAlert(alert_0061);
				accumulatedText=emptyString;
			}
			else{
				namerFound = true;
			}
		}
		else if(attribute=="aria-describedby"){
			if(accumulatedText=="" && alert_0131.list.indexOf("described")!=-1){
				//ALL of the aria-describedby references do not return any text
				throwAlert(alert_0062);
				accumulatedText=emptyString;
			}
			else{
				describerFound = true;
			}
		}

		return accumulatedText;
	}
	
	//This function will determine if HTML5 is the doctype being used
	var HTML5;
	function isTheDoctypeHTML5(){
		if(document.doctype !== null && document.doctype.name == 'html' && !document.doctype.publicId && !document.doctype.systemId)
			HTML5 = true;
		else
			HTML5 = false;
	}
	
	//=====================================//
	// ALERTS: Dangers, Warnings, Cautions //
	//=====================================//
	
	//This defines the class Alert
	function Alert(type, group, message, info, list){
		this.type = type;
		this.group = group;
		this.message = message;
		this.info = info;
		this.list = list = "";
	}
	
	//This defines the class AlertGroup. A group of Alerts
	function AlertGroup(type, groupID, heading, count){
		this.type = type;
		this.groupID = groupID;
		this.heading = heading;
		this.count = count = 0;
	}
	
	//These functions will throw Danger/Warning/Caution Alerts
	//They will add the alert to the alert list and attach it to the element
	//Parameters
	//	alertObject:	the alert object
	//	customMessage: 	(optional) message of the alert. If not passed will use default alert.message
	//	customIndex: 	(optional) pass in 0 if this cannot be linked to an element.  If not passed will use andiElementIndex
	function throwAlert(alertObject,customMessage,customIndex){
		var message = "";
		if(customMessage!==undefined)
			message = customMessage; //use custom message
		else
			message = alertObject.message; //use default alert message
		var index = "";
		if(customIndex!==undefined)
			index = customIndex; //use custom message, typically 0, meaning do not attach a link
		else{
			index = andiElementIndex; //use current andiElementIndex
			var infoLinkPre = "<a href='"+ help_alerts + alertObject.info +"' target='_ANDIhelp' title='Open Alerts Help'>";
			switch(alertObject.type){
				//Add the alert to the output text
				case "danger":
					andi_dangers.push(infoLinkPre+message+"</a> "); break; //add to the dangers object
				case "warning":
					andi_warnings.push(infoLinkPre+message+"</a> "); break; //add to the warnings object
				case "caution":
					andi_cautions.push(infoLinkPre+message+"</a> "); break; //add to the cautions object
			}
		}
		addToAlertsList(alertObject,message,index);
		alertObject.list = "";//reset list to empty
	}
	
	//This function is not meant to be used directly.
	//It will add a list item into the Alerts list.
	//It can place a link which when followed, will move focus to the field relating to the alert.
	//Parameters: 
	//	alertObject:	the alert object	
	//  message:		text of the alert message
	//  elementIndex:	element to focus on when link is clicked. expects a number. pass zero 0 if alert is not relating to one particular element
 	function addToAlertsList(alertObject, message, elementIndex){
		var alertMessagePrefix = alertObject.type.substr(0,1).toUpperCase()+alertObject.type.substr(1)+": "; //capitalizes first letter of type
		message = alertMessagePrefix + message;
		//Should this alert be associated with a focusable element?
		var listItemHtml = "<li class='ANDI508-display-"+alertObject.type+"' role='treeitem'><a href='#' tabindex='-1' ";
		if(elementIndex != 0){
			//Yes, this alert should point to a focusable element. Insert as link:
			listItemHtml += focuser.onclick(elementIndex) + " data-ANDI508-relatedIndex='"+elementIndex+"' title='Focus on element #"+elementIndex+"' >"+message+"</a></li>";
		}
		else
			//No, This alert is not specific to one element. Insert message without link.
			listItemHtml += ">"+message+"</a></li>";
		//Is this alert associated with an alertGroup?
		$("#ANDI508-alertGroup_"+alertObject.group).find("ol.ANDI508-alertGroup-list").append(listItemHtml);
		alertGroups[alertObject.group].count++;
		numberOfAccessibilityAlertsFound++;
	}
			
	//This function will throw alert_0001 depending on the tagName passed
	function noAccessibleMarkupFound(tagNameText){
		var message;
		//Is this an input element, excluding input[image]?
		if(tagNameText.indexOf("input")!=-1 && tagNameText != 'input[image]'){
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
				if(andi_data.imageSrc)
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
			default:
				message = "Element"+alert_0002.message;
		} 
		throwAlert(alert_0001,message);
	}
	
	//This function will throw alert_0101 if the alert_0101.list is not empty
	function areThereComponentsThatShouldntBeCombined(){
		if(alert_0101.list!=''){
			var message = alert_0101.message+alert_0101.list;
			throwAlert(alert_0101,message);
		}
	}
	//This function will compare components that shouldn't be combined.
	//Parameters:
	//	componentToTestAgainst: Component to test against
	//	spaceDelimitedListOfComponents: List of components (space delimited) that shouldn't be combined with componentToTestAgainst.
	//									Will test against aria-label aria-labelledby aria-describedby title
	function improperCombinationCheck(componentToTestAgainst,spaceDelimitedListOfComponents){
		var improperCombinationFoundList = "";
		components = spaceDelimitedListOfComponents.split(" ");
		for(x = 0; x < components.length; x++){
			switch(components[x]){
				case "aria-label":
					if(ariaLabel && ariaLabel!=emptyString) improperCombinationFoundList+=components[x]+" "; break;
				case "aria-labelledby":
					if(ariaLabelledby && ariaLabelledby!=emptyString) improperCombinationFoundList+=components[x]+" "; break;
				case "aria-describedby":
					if(ariaDescribedby && ariaDescribedby!=emptyString) improperCombinationFoundList+=components[x]+" "; break;
				case "title":
					if(title && title!=emptyString) improperCombinationFoundList+=components[x]+" "; break;
			}
		}
		if(improperCombinationFoundList != ""){
			alert_0101.list += "[" + componentToTestAgainst + ": " + $.trim(improperCombinationFoundList) + "]";
		}
	}
	
	//This function will count the number of visible fieldset/figure/table tags and compare to the number of legend/figcaption/caption tags
	//If there are more parents than children, it will generate an alert with the message and the counts.
	//Note: The function does not test whether the children are actually contained within the parents, it's strictly concerned with the counts.
	//More children than parents might mean a parent is missing or the child tag isn't being used properly.
	//It will also set the booleans page_using_fieldset, page_using_figure, page_using_table, page_using_label to true if found, which will be used elsewhere for performance enhancements
	function areThereMoreExclusiveChildrenThanParents(){
		var children, parents;
		
		//legend/fieldset
		parents = $("#ANDI508-testPage fieldset").filter(":visible").length*1; //*1 ensures that the var will be a number
		children = $("#ANDI508-testPage legend").filter(":visible").length*1; //*1 ensures that the var will be a number
		if(children > parents) throwAlert(alert_0074,alert_0074.message+"<br />[Legends: "+children+"] [Fieldsets: "+parents+"].",0);
		if(parents>0) page_using_fieldset = true;
		
		//figcaption/figure
		parents = $("#ANDI508-testPage figure").filter(":visible").length*1; //*1 ensures that the var will be a number
		children = $("#ANDI508-testPage figcaption").filter(":visible").length*1; //*1 ensures that the var will be a number
		if(children > parents) throwAlert(alert_0075,alert_0075.message+"<br />[Figcaptions: "+children+"] [Figures: "+parents+"].",0);
		if(parents>0) page_using_figure = true;
		
		//caption/table
		parents = $("#ANDI508-testPage table").filter(":visible").length*1; //*1 ensures that the var will be a number
		children = $("#ANDI508-testPage caption").filter(":visible").length*1; //*1 ensures that the var will be a number
		if(children > parents) throwAlert(alert_0076,alert_0076.message+"<br />[Captions: "+children+"] [Tables: "+parents+"].",0);
		if(parents>0) page_using_table = true;
	}
		
	//This function will search the test page for visible elements with duplicate ids.
	//If found, it will generate an alert
	//Uses global variable allIds
	function areThereAnyDuplicateIds(element){
		var id = $.trim($(element).prop('id'));
		if(id && allIds.length>1){
			var idMatchesFound = 0;
			//loop through allIds and compare
			for (x=0; x<allIds.length; x++){
				if(id === allIds[x].id){
					idMatchesFound++;
					if(idMatchesFound==2) break; //duplicate found so stop searching, for performance
				}
			}
			if(idMatchesFound>1){
				//Duplicate Found
				var message = alert_0011.message+"["+id+"].";
				throwAlert(alert_0011,message);
			}
		}
	}

	//This function will search the html body for visible labels with duplicate 'for' attributes
	//If found, it will throw alert_0012 with a link pointing to the ANDI highlighted element with the matching id.
	//Uses global variable allFors
	function areThereAnyDuplicateFors(element){
		if(page_using_label){
			var id = $.trim($(element).prop('id'));
			if(id && allFors.length>1){
				var forMatchesFound = 0;
				for (x=0; x<allFors.length; x++){
					if(id === $.trim($(allFors[x]).attr('for'))){
						forMatchesFound++;
						if(forMatchesFound==2) break; //duplicate found so stop searching, for performance
					}
				} 
				if(forMatchesFound>1){
					//Duplicate Found
					var message = alert_0012.message+"["+id+"].";
					throwAlert(alert_0012,message);
				}
			}
		}
	}
	
	//This function will throw alert_0112 if commonly troublesome Javascript events are found on the element.
	function areThereAnyTroublesomeJavascriptEvents(element){
		var events = "";
		if($(element).is("[onblur]"))
			events += "[onBlur] ";
		if($(element).is("[onchange]"))
			events += "[onChange] ";
		if(events!=""){
			var message = alert_0112.message+$.trim(events);
			throwAlert(alert_0112,message);
		}
	}

	//This function will search for misspelled aria attributes
	//It will generate an alert and link to the element if the misspelling is on an element that has been highlighted by ANDI.
	function areThereAnyMisspelledAria(element){
		//TODO: eliminate some of these to improve performance
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
					throwAlert(alert_0032);
				}
				else{//all other misspellings
					alert_0031.list += " ["+misspelling+"]";//add to list
				}
			}
		}
		if(alert_0031.list!=""){
			var message = alert_0031.message+alert_0031.list+".";
			throwAlert(alert_0031,message);
		}
	}
	
	//This function will generate an alert if it finds javascript mouse events on an element that has no keyboard access
	function areThereAnyMouseEventsWithoutKeyboardAccess(element){
		//Does this element have a focusable ancestor
		if($(element).closest('.ANDI508-element').length < 1){
			//No, Element has no keyboard access
			var mouseEvents = "";
			if($(element).is('[onmouseover]')) 		mouseEvents += "onMouseOver ";
			//Commented these out because it's a performance hit to check them all. Stick to the most common
			//if($(element).is('[onmouseout]'))		mouseEvents += "onMouseOut ";
			//if($(element).is('[onmouseenter]')) 	mouseEvents += "onMouseEnter ";
			//if($(element).is('[onmouseleave]')) 	mouseEvents += "onMouseLeave ";
			//if($(element).is('[onmousemove]')) 	mouseEvents += "onMouseMove ";
			//if($(element).is('[onmouseup]'))		mouseEvents += "onMouseUp ";
			//if($(element).is('[ondblclick]'))		mouseEvents += "onDblClick ";
			if(mouseEvents!="")
				throwAlert(alert_0111,alert_0111.message+"["+$.trim(mouseEvents)+"]",0);
		}
	}
	
	//This function generates a alert_0131 if the alert_0131.list is not empty
	function areAnyComponentsEmpty(){
		if(alert_0131.list!=''){
			var message = alert_0131.message+alert_0131.list+".";
			throwAlert(alert_0131,message);
		}
	}
	//This function will add the component to the empty component list 
	function addToEmptyComponentList(component){
		alert_0131.list += " " + component;
		return emptyString;
	}
			
	//This function will throw alert_0051 if the element has an accesskey but cannot gain focus.
	function areThereAccesskeysThatCanNeverGetFocus(element){
		if($(element).is('[accesskey]')){
			var accesskey = $.trim($(element).attr("accesskey").toUpperCase());
			var key = "[" + accesskey + "]";
			throwAlert(alert_0051,alert_0051.message+key+".",0);
			addToAccessKeysList(accesskey,0,alert_0051);
		}
	}
		
	//This function checks to see if there is only one page <title> tag within the head
	//If none, empty, or more than one, it will generate an alert.
	function isThereExactlyOnePageTitle(){
		var pageTitleCount = $("head title").length;
		if(document.title == ''){ //check document.title because could have been set by javascript 
			if(pageTitleCount == 0)
				throwAlert(alert_0072,alert_0072.message,0);
			else if(pageTitleCount == 1 && $.trim($("head title").text())=='')
				throwAlert(alert_0071,alert_0071.message,0);
		}
		else if(pageTitleCount > 1)
			throwAlert(alert_0073,alert_0073.message,0);
	}
		
	//This function checks the character length of the componentText.
	//If it exceeds the number defined in the variable characterLimiter, it will throw an alert.
	//Returns true if the limit was exceeded.
	function checkCharacterLimit(componentText,alertObject){
		if(componentText.length > characterLimiter){
			throwAlert(alertObject);
			return true;
		}
		return false;
	}
	//This function inserts a pipe character into the componentText at the characterLimiter position
	//The color of the pipe is the color of a warning
	function insertCharacterLimitMark(componentText){
		var returnThis = formatForHtml(componentText.substring(0, characterLimiter))
						+ "<span class='ANDI508-display-warning'>|</span>"
						+ formatForHtml(componentText.substring(characterLimiter,componentText.length));
		return returnThis;
	}
		
	//This function determines if frames or iframes are being used on the test page.
	//Returns true or false.
	//If frames, stops ANDI. If iframes, continues ANDI.
	function isTestPageUsingFrames(){
		if($("frameset").length>0){
			alert("Frames Detected on Test Page.\nANDI does not work with the frame tag which has been deprecated in HTML 5.");
			return true;
		}
		else if($("iframe").filter(":visible").length>0){
			alert("iframe Detected on Test Page.\nCurrently, ANDI does not scan or highlight iframe contents");
			return false;
		}
		else
			return false;
	}
	
	//This function will scan for deprecated HTML relating to accessibility associated with the element 
	function detectDeprecatedHTML(element){
		if(HTML5){
			if($(element).is("table") && $(element).attr("summary")){
				var message = alert_0078.message+"attribute 'summary' in &lt;table&gt;, use &lt;caption&gt; instead.";
				if($(element).hasClass("ANDI508-element"))
					throwAlert(alert_0078,message);
				else
					throwAlert(alert_0078,message,0);
			}
			else if($(element).is("a") && $(element).attr("name")){
				var message = alert_0078.message+"attribute 'name' in &lt;a&gt;, use 'id' instead.";
				if($(element).hasClass("ANDI508-element"))
					throwAlert(alert_0078,message);
				else
					throwAlert(alert_0078,message,0);
			}
		}
		//not HTML5
		else if(page_using_table){
			if($(element).is("table")){
				//Is table using role=presentation and a summary?
				if($(element).attr('role')=='presentation' && $(element).attr('summary')){
					if($(element).hasClass("ANDI508-element"))
						throwAlert(alert_0042);
					else
						throwAlert(alert_0042,alert_0042.message,0);
				}
			}
		}
	}
			
	//====================//
	// CONTROLS/SETTINGS: //
	//====================//
	
	//This function defines what the ANDI controls/settings do.
	//Controls are Relaunch, Highlights, Mini Mode, Help, Close, TagName link
	var elementHighlightsSetting;
	function defineControls(){
		//ANDI Relaunch button
		$("#ANDI508-button-relaunch").click(function(){
			initAndi();
		});
		//Highlights Checkbox
		elementHighlightsSetting = true; //default to true
		$("#ANDI508-button-highlights").click(function(){
			if (!elementHighlightsSetting){
				//Show Highlights
				$("#ANDI508-testPage .ANDI508-element").addClass("ANDI508-highlight");
				$(this).attr("title","Press to Hide Element Highlights");
				$(this).attr("aria-pressed","true");
				elementHighlightsSetting = true;
				$(this).find("img").attr("src",icons_url+"highlights-on.png");
			}else{
				//Hide Highlights
				$("#ANDI508-testPage .ANDI508-highlight").removeClass("ANDI508-highlight");
				$(this).attr("title","Press to Show Element Highlights");
				$(this).attr("aria-pressed","false");
				elementHighlightsSetting = false;
				$(this).find("img").attr("src",icons_url+"highlights-off.png");
			}
			resizeHeights();
		});
		//Mini Mode Checkbox
		$("#ANDI508-button-minimode").click(function(){
			if ($("#ANDI508_setting_minimode").val()==="false"){
				minimode(true);
			}
			else{
				minimode(false);
			}
			saveANDIsettings();
		});
		//ANDI Help button
		$("#ANDI508-button-help").click(function(){
			if(help_howToUse!==undefined)
				window.open(help_howToUse, "_ANDIhelp");
			else
				alert("ANDI Help Page Under Construction");
		});
		//ANDI Remove/Close button
		$("#ANDI508-button-close").click(function(){
			resetANDI();
		});
		//Tag name link
		$("#ANDI508_tagname_link")
		.click(function(){ //Place focus on active element when click tagname
			focuser.elementAtIndex($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
			laser.eraseLaser();
		})
		.hover(function(){ //Draw line to active element
			laser.drawLaser($(this).offset(),$("#ANDI508-testPage .ANDI508-element-active").offset());
		})
		.on("mouseleave",laser.eraseLaser);
	}
			
	//This function will toggle the state of mini mode
	//Parameters:
	//	state: true or false
	function minimode(state){
		if(state){
			//minimode on
			$("#ANDI508_setting_minimode").val("true");
			$("#ANDI508-accessibleComponentsTableContainer").hide();
			$("#ANDI508-pageAnalysis").hide();
			$("#ANDI508-activeElementInspection").addClass("ANDI508-minimode");
			$("#ANDI508-outputText").addClass("ANDI508-minimode");
			$("#ANDI508-outputContainer").addClass("ANDI508-minimode");
			$("#ANDI508-tagNameContainer").addClass("ANDI508-minimode");
			$("#ANDI508-tagNameContainer h3").hide();
			$("#ANDI508-button-minimode").attr("title","Press to Disengage Mini Mode")
										 .attr("aria-pressed","true")
										 .find("img").attr("src",icons_url+"more.png");
			if($("#ANDI508-startUpSummary")){
				$("#ANDI508-startUpSummary").hide();
				$("#ANDI508-outputText").html($("#ANDI508-startUpSummary").html());
			}
		}
		else{
			//minimode off
			$("#ANDI508_setting_minimode").val("false");
			$("#ANDI508 .ANDI508-minimode").removeClass("ANDI508-minimode");
			$("#ANDI508-accessibleComponentsTableContainer").show();
			$("#ANDI508-pageAnalysis").show();
			$("#ANDI508-activeElementInspection").removeClass("ANDI508-minimode");
			$("#ANDI508-outputContainer").removeClass("ANDI508-minimode");
			$("#ANDI508-outputText").removeClass("ANDI508-minimode");
			$("#ANDI508-tagNameContainer h3").show();
			$("#ANDI508-button-minimode").attr("title","Press to Engage Mini Mode")
										 .attr("aria-pressed","false")
										 .find("img").attr("src",icons_url+"less.png");
			if($("#ANDI508-startUpSummary"))
				$("#ANDI508-startUpSummary").show();
		}
		resizeHeights();
	}
	
	//This function will save ANDI settings
	function saveANDIsettings(){ 
		//If this browser has HTML5 local storage capabilities
		if (typeof(Storage) !== "undefined") {
			if(window.localStorage){
				//Save the current minimode selection
				if($("#ANDI508_setting_minimode").val()==="true")
					localStorage.setItem('ANDI508_setting_minimode',  'true');
				else
					localStorage.setItem('ANDI508_setting_minimode',  'false');
			}
		}
	}
	
	//This function will load ANDI settings
	//If no saved settings were found, it will load with the default settings.
	//Default Minimode: false
	function loadANDIsettings(){
		//If this browser has HTML5 local storage capabilities
		if (typeof(Storage) !== "undefined") {
			if(window.localStorage){
				//Load the Minimode
				if(!localStorage.getItem('ANDI508_setting_minimode'))
					//Default minimode to false
					minimode(false);
				else{//load from local storage
					if(localStorage.getItem('ANDI508_setting_minimode') == 'true')
						minimode(true);
					else
						minimode(false);
				}
			}
		}
	}
	
	//This function defines the functionality of the Alert List
	//It adds key navigation: down, up, left, right, enter, asterisk, home, end,
	//Also adds mouse clickability
	var alertLinksTabbableArray;
	function addAlertListFunctionality(){
		updateAlertLinksTabbableArray();
		$("#ANDI508-alerts-container-scrollable a").each(function(){
			//add keyboard functionality
			$(this)
			.keydown(function(e){
				switch (e.keyCode) {
					case 13: //enter
						if(!$(this).hasClass("ANDI508-alertGroup-toggler"))
							$(this).click(); //follow the link to the element
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
				});
			}
			else{
				//Add laser drawing to the alert links
				$(this).on("mouseover" 	,laser.drawAlertLaser);
				$(this).on("click"		,laser.eraseLaser);
				$(this).on("mouseleave"	,laser.eraseLaser);
			}
		});
				
		//This function stores the tabbable alerts into an array.
		//Should be called anytime the list display changes
		function updateAlertLinksTabbableArray(){
			alertLinksTabbableArray = [];
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
				$(groupListContainer).slideDown(andiAnimationSpeed);
				$(groupListContainer).children().first().find("a").focus();
				$(trigger).attr("title","Hide Group");
				$(trigger).attr("aria-expanded","true");
				tabindex = "0";
			}
			else{
				//hide alertGroup-list
				$(groupListContainer).slideUp(andiAnimationSpeed);
				$(trigger).attr("title","Show Group");
				$(trigger).attr("aria-expanded","false");
				tabindex = "-1";
			}
			//Set the tabindex
			$(groupListContainer).find("a").each(function(){
				$(this).attr("tabindex",tabindex);
			});
			updateAlertLinksTabbableArray();
			resizeHeights();
		}
		
		//This Click function will hide or show the alerts list when clicking on the alerts list header
		$("#ANDI508-alertsList-total")
		.click(function(){
			var scrollable = $("#ANDI508-alerts-container-scrollable");
			if($(scrollable).css("display")!="none"){
				//Hide alerts List
				$(scrollable).slideUp(andiAnimationSpeed);
				$(this).attr("title","Show Alert List");
				$(this).attr("aria-expanded","false");
			}else{
				//Show alerts List
				$(scrollable).slideDown(andiAnimationSpeed);
				$(scrollable).find(":first").focus(); //place focus on first item in Alert List
				$(this).attr("title","Hide Alert List");
				$(this).attr("aria-expanded","true");
			}
			resizeHeights();
			return false; //prevents page scroll
		})
		.keydown(function(e){
			if(e.keyCode==40) //down
				$("#ANDI508-alerts-container-scrollable a").first().focus();
		});
	}
	
	//===============//
	// PRESENTATION: //
	//===============//
	
	//This function will clean up everything that ANDI inserted.
	function resetANDI(){
		$("#ANDI508").remove(); //removes ANDI
		$("#ANDI508-testPage .ANDI508-element").each(function(){
			$(this).removeClass("ANDI508-element")
				   .removeClass("ANDI508-element-danger")
				   .removeClass("ANDI508-element-active")
				   .removeClass("ANDI508-highlight")
				   .removeData("ANDI508")
				   .removeAttr("data-ANDI508-index")
				   .off("focus",andiElementFocusability)
				   .off("mouseover",andiElementHoverability);
		});
		$("#ANDI508-testPage label[data-ANDI508-relatedIndex]").removeAttr("data-ANDI508-relatedIndex");
		restoreTestPageFixedPositionDistances();
		$("#ANDI508-testPage").contents().unwrap();
		$("#ANDI508-laser-container").remove();
		$("#ANDI508-css").remove();//remove the style
		$("script[src$='andi.js']").eq(1).remove(); //remove the second instance of the script
	}

	//This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
	//Inserts some counter totals, adds click methods to the next and previous buttons, 
	//displays the accesskey list, displays the alerts list and alerts group count totals
	function updateDisplayDependingOnResults(){
		var numberOfElements = andiElementIndex;
		$("#ANDI508-numberOfElements").find("span.ANDI508-total").html(numberOfElements);
		//Are There Focusable Elements?
		if(numberOfElements>0){
			//Yes, Focusable Elements were found
			//Total Focusable Elements Link:
			$("#ANDI508-numberOfElements a").click(function(){
				focuser.elementAtIndex(1);
			}).attr("title","Focus on First Element");
			//Previous Element Button:
			$("#ANDI508-button-prevElement")
			.click(function(){
				var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
				if(index == 1)
					focuser.elementAtIndex(numberOfElements); //loop back to last
				else
					focuser.elementAtIndex(index - 1);
			});
			//Next Element Button:
			$("#ANDI508-button-nextElement").click(function(){
				var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
				if(index == numberOfElements)
					focuser.elementAtIndex(1); //loop back to first
				else
					focuser.elementAtIndex(index + 1);
			});
			//Accesskeys List:
			if(accesskeysListHtml!=""){
				$("#ANDI508-accesskeysListContainer").html("{ "+accesskeysListHtml+"}");
				$("#ANDI508-accesskeysListContainer").find("a").each(function(){
					$(this).on("mouseover" 	,laser.drawAlertLaser);
					$(this).on("click"		,laser.eraseLaser);
					$(this).on("mouseleave"	,laser.eraseLaser);
				});
				$("#ANDI508-accesskeysFound").show();
			}
			else
				$("#ANDI508-accesskeysFound").remove();
		}
		else{
			//No Focusable Elements were found
			if(numberOfAccessibilityAlertsFound==0){
				//No Alerts
				$("#ANDI508-pageAnalysis").remove();
				$("#ANDI508-startUpSummary").html("No Focusable Elements were found on this page.");
			}
			else{
				//Alerts were found
				$("#ANDI508-startUpSummary").html("No Focusable Elements were found, however there are some accessibility alerts.");
			}
			$("#ANDI508-controls").remove();
			$("#ANDI508-outputContainer").remove();
			$("#ANDI508-accessibleComponentsTableContainer").remove();
			$("#ANDI508-tagNameContainer").remove();
		}
		//Are There Any Alerts?
		if(numberOfAccessibilityAlertsFound>0){
			//Yes. Accessibility alerts were found.
			$("#ANDI508-numberOfAccessibilityAlerts span.ANDI508-total").html(numberOfAccessibilityAlertsFound);
			//Update the Alert Group Totals
			var alertGroup;
			for(x=0; x<alertGroups.length; x++){
				alertGroup = $("#ANDI508-alertGroup_"+alertGroups[x].groupID);
				if(alertGroups[x].count>0)
					$(alertGroup).show().find("span.ANDI508-total").html(alertGroups[x].count);
				else
					$(alertGroup).remove(); //remove alert groups that aren't needed
			}
			
			//Remove Unused Alert Types
			$("#ANDI508-alerts-container-scrollable ul").each(function(){
				if(!$(this).html())
					$(this).remove();
			});
			
			$("#ANDI508-alerts-list").show();
			
			addAlertListFunctionality();
		}
	}
	
	//This function is used for shifting focus to an element
	function Focuser(){
		//Places focus on element at index.
		this.elementAtIndex = function(index){
			$("#ANDI508-testPage [data-ANDI508-index="+index+"]").focus();
		};
		//Creates and Returns onclick text to be placed on a dynamically built link.
		this.onclick = function(index){
			return "onclick='$(\"#ANDI508-testPage [data-ANDI508-index="+index+"]\").focus();'";
		}
	}

	//This function adds the capability to draw a line to visually connect the elements on the screen.
	//It works by showing an svg #ANDI508-laser-container that contains a line tag.
	//The coordinates of the line tag are updated to draw the line.
	//NOTE: The svg has a high z-index to keep it on top of the test page, therefore, it must be hidden at the right time so that the page can be interacted with.
	function Laser(){
		//Draws a laser. Pass in an object containing properties top and left, aka the result of jQuery offset().
		this.drawLaser = function(fromHereCoords,toHereCoords){
			if(!oldIE){
				$("#ANDI508-laser").attr('x1',fromHereCoords.left).attr('y1',fromHereCoords.top)
								   .attr('x2',  toHereCoords.left).attr('y2',  toHereCoords.top);
				$("#ANDI508-laser-container").css("cssText","display:inline !important");
			}
		};
		//Removes the lasers by hiding the laser container.
		//Should be called during mouseleave, or click functions that shift focus.
		this.eraseLaser = function(){
			if(!oldIE)
				$("#ANDI508-laser-container").css("cssText","display:none !important");
		};
		//Draws a laser for an alert link. It will be displayed when the shift key is held. Call it onmouseover
		this.drawAlertLaser = function(event){
			if(!oldIE){
				if(event.shiftKey){ //check for holding shift key
					var alertCoords = $(this).offset();
					var relatedIndex = $(this).attr("data-ANDI508-relatedIndex");
					var elementCoords = $("[data-ANDI508-index="+relatedIndex+"]").offset();
					laser.drawLaser(alertCoords,elementCoords)
				}
				else
					laser.eraseLaser();
			}
		};
		//This function attaches hover/mouseover and mouseleave events to the triggerObject
		//It will call drawLaser on hover and eraseLaser on mouseleave
		//NOTE: Do not use this function if the targetObject will change.
		this.createLaserTrigger = function(triggerObject,targetObject){
			if(!oldIE){
				$(triggerObject).hover(function(){
					if($(targetObject)!==undefined)
						laser.drawLaser($(triggerObject).offset(),$(targetObject).offset());
				});
				$(triggerObject).on("mouseleave",laser.eraseLaser);
			}
		}
		//This function creates a laserTarget HTML object 
		//which will store the index or id of the object to point the laser at
		this.createLaserTarget = function(componentType, referenceIndex, referencedText){
			if(!oldIE){
				var laserTarget = "<span class='ANDI508-laserTarget' data-ANDI508-";
				if(componentType=="label")
					laserTarget += "relatedIndex='"; //uses the object's data-ANDI508-index attribute
				else
					laserTarget+= "referencedId='"; //uses the object's id
				laserTarget += referenceIndex+"'>"+referencedText+"</span>";
				return laserTarget;
			}
			else
				return referencedText;
		};
	}

	//This function resizes ANDI's display and the ANDI508-testPage container so that ANDI doesn't overlap with the test page.
	//Should be called any time the height of the ANDI might change.
	function resizeHeights(){
		//Calculate remaining height for testPage
		setTimeout(function(){
			var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight; 
			var andiHeight = $("#ANDI508").outerHeight(true);
			var testPageHeight = (windowHeight - andiHeight) + "px";
			var testPageWidth = (window.innerWidth - parseInt($("#ANDI508-testPage").css("padding-left"))) + "px";
			andiHeight = andiHeight+"px";
			//alert(windowHeight); alert(andiHeight); alert(testPageHeight);
			$("#ANDI508-testPage").css("height", testPageHeight)
								  .css("margin-top", andiHeight)
								  .css("width",testPageWidth);
			//Adjust the top/bottom distance of any fixed elements in the test page
			$("#ANDI508-testPage .ANDI508-fixed").each(function(){
				var originalTopDistance = $(this).attr('data-originalTopDistance');
				var originalBottomDistance = $(this).attr('data-originalBottomDistance');
				
				if(originalTopDistance!="auto") //if attached to top
					$(this).css("top",parseInt(andiHeight) + parseInt(originalTopDistance) + "px"); //add the heights together so there is no overlap
				else if(originalBottomDistance=="auto") //if attached to bottom
					$(this).css("top",andiHeight);
			});
		}, andiAnimationSpeed+10);
	}
	//This will call resizeHeights when the browser window is resized by the user.
	$(window).resize(function(){
		resizeHeights();      
	});

	//This function displays the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	function displayTable(element){
		
		$("#ANDI508-accessibleComponentsTable tbody tr").remove(); //Remove previous table contents
		
		var accessibleComponentsCount = $(element).data("ANDI508").accessibleComponentsTotal;
		if(accessibleComponentsCount == 0){
			//No accessible components found
			$("#ANDI508-accessibleComponentsTable tbody").append("<tr><th id='ANDI508-accessibleComponentsTable-noData'>No accessibility markup found for this Element.</th></tr>");
		}else{
			ifComponentFoundAppendTableRow("legend",			$(element).data("ANDI508").legend);
			ifComponentFoundAppendTableRow("figcaption",		$(element).data("ANDI508").figcaption);
			ifComponentFoundAppendTableRow("caption",			$(element).data("ANDI508").caption);
			
			ifComponentFoundAppendTableRow("aria-labelledby",	$(element).data("ANDI508").ariaLabelledby,true);
			ifComponentFoundAppendTableRow("aria-label",		$(element).data("ANDI508").ariaLabel);
			
			ifComponentFoundAppendTableRow("label",				$(element).data("ANDI508").label,true);
			ifComponentFoundAppendTableRow("alt",				$(element).data("ANDI508").alt);
			ifComponentFoundAppendTableRow("value",				$(element).data("ANDI508").value);
			ifComponentFoundAppendTableRow("innerText",			$(element).data("ANDI508").innerText);
			ifComponentFoundAppendTableRow("&lt;subtree&gt;",	$(element).data("ANDI508").subtree);
			ifComponentFoundAppendTableRow("imageSrc",			$(element).data("ANDI508").imageSrc);

			ifComponentFoundAppendTableRow("aria-describedby",	$(element).data("ANDI508").ariaDescribedby,true);
			ifComponentFoundAppendTableRow("title",				$(element).data("ANDI508").title);
			
			ifComponentFoundAppendTableRow("addOnProperties",	$(element).data("ANDI508").addOnProperties);
			ifComponentFoundAppendTableRow("tabindex",			$(element).data("ANDI508").tabindex);
			ifComponentFoundAppendTableRow("accesskey",			$(element).data("ANDI508").accesskey);
			
			$("#ANDI508-table-tagName").html(formatForHtml($(element).data("ANDI508").tagName));
		}
				
		//Insert the accessible components total into the heading/caption
		$("#ANDI508-accessibleComponentsTotal").html(accessibleComponentsCount);
				
		//Show the table
		$("#ANDI508-accessibleComponentsTableContainer").css("visibility","visible");
		
		//This function appends a table row if the component is found.
		function ifComponentFoundAppendTableRow(type,component,useLaser){
			if(component){
				var row = "";
				if(type=="addOnProperties"){
					//add on properties
					row += "<tr id='ANDI508-table-"+type+"'><th class='ANDI508-display-"+type+"'>add-on properties: </th><td class='ANDI508-display-"+type+"'>";
					for (x in component){
						if (component.hasOwnProperty(x))
							row += component[x] + " ";
					}
					row +="</td></tr>";
				}
				else
					//all other components
					row += "<tr id='ANDI508-table-"+type+"'><th class='ANDI508-display-"+type+"'>"+type+": </th><td class='ANDI508-display-"+type+"'>"+component+"</td></tr>";
				$("#ANDI508-accessibleComponentsTable tbody").append(row);
				//Add draw laser functionality which will point to the locations of the references
				if(useLaser){
					$("#ANDI508-table-"+type+" td span").each(function(){
						//find referenced object
						var referencedObject;
						if(type=="label")
							referencedObject = $("#ANDI508-testPage label[data-ANDI508-relatedIndex="+$(this).attr("data-ANDI508-relatedIndex")+"]");
						else
							referencedObject = $("#"+$(this).attr("data-ANDI508-referencedId"));
						
						laser.createLaserTrigger($(this),referencedObject);
					});
				}
			}
		}
	}
	
	//This function will add an accesskey link to the accesskeyList
	function addToAccessKeysList(accesskey,elementIndex,alertObject){
		//TODO: arrange in alphabetical order
		accesskey = accesskey.toUpperCase();
		var addClass = "";
		var titleText = "";
		if(alertObject){
			addClass = "class='ANDI508-display-"+alertObject.type+"'";
			titleText = alertObject.message+accesskey;
		}
		else
			titleText = "Focus on Element with accesskey="+accesskey;
		
		if(elementIndex==0)
			accesskeysListHtml += "<span tabindex='0' "+addClass+" title='"+ titleText +"'>"+accesskey+"</span> ";
		else
			accesskeysListHtml += "<a href='#' "+focuser.onclick(elementIndex)+" data-ANDI508-relatedIndex='"+elementIndex+"' title='"+ titleText +"'><span "+addClass+">"+accesskey+"</span></a> ";
		accesskeysListDuplicateComparator += accesskey;
	}
	
	//This function takes a string and converts any < and > into &lt; and &gt; so that when the 
	//string is displayed on screen, the browser doesn't try to parse the string into html tags.
	function formatForHtml(string){
		if(string!==undefined)
			return string.replace(/>/g, "&gt;").replace(/</g, "&lt;");
	}
	
	//This function will adjust the top distance of all elements on the test page that have css fixed positions.
	//This allows ANDI to not overlap with test page if using fixed positions.
	function storeTestPageFixedPositionDistances(element){
		$(element).filter(function(){
			if($(this).css('position') == 'fixed'){
				$(this).addClass('ANDI508-fixed')
					   .attr("data-originalTopDistance",$(this).css("top")) //store the value of the original top
					   .attr("data-originalBottomDistance",$(this).css("bottom"));//store the value of the original bottom 
			}
		});
	}
	//This function will restore the test page fixed position distances to their original values.
	//It is meant to be called when the close ANDI button is pressed.
	function restoreTestPageFixedPositionDistances(){
		$("#ANDI508-testPage .ANDI508-fixed").each(function(){
			$(this).css("top",$(this).attr("data-originalTopDistance"))
				   .removeAttr("data-originalTopDistance")
				   .css("bottom",$(this).attr("data-originalBottomDistance"))
				   .removeAttr("data-originalBottomDistance")
				   .removeClass("ANDI508-fixed");
		});
	}
	
	//This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
	//Holding the shift key will prevent inspection from changing.
	function andiElementHoverability(event){
		if(!event.shiftKey) //check for holding shift key
			inspectElement(this);
	}
	//This function updates the Active Element Inspector when focus is given to a highlighted element.
	function andiElementFocusability(){
		laser.eraseLaser();
		inspectElement(this);
		resizeHeights();
	}

	//This function will update the info in the Active Element Inspection.
	//Should be called after the mouse hover or focus in event.
	function inspectElement(element){
		$("#ANDI508-testPage .ANDI508-element-active").first().removeClass("ANDI508-element-active"); //remove previous active element
		$(element).addClass("ANDI508-element-active"); //mark this as the active element that ANDI is inspecting
		displayOutputFor(andiDefaultOutputRuleset,element); //grab the output ruleset from the dropdown control
		displayTable(element);
		$("#ANDI508-tagNameDisplay").html($(element).data("ANDI508").tagName);
		$("#ANDI508-tagNameContainer").addClass("ANDI508-tagNameContainer-visible");
		$("#ANDI508_tagname_link").attr("title","Focus on this Element");
		$("#ANDI508-startUpSummary").remove(); //hide the startUpSummary text
	}
	
	//This function will build the html for the alert groups.
	//Alert groups are expandable/collapsable containers for similar alerts.
	//It's purpose is to reduce the size of the Alerts List for repetitive alerts.
	function buildAlertGroupsHtml(){
		
		for(x=0; x<alertGroups.length; x++){
			createAlertGroupContainer(alertGroups[x]);
		}
		
		function createAlertGroupContainer(group){
			var containerHtml = "<li class='ANDI508-alertGroup-container ANDI508-display-"+group.type+"' id='ANDI508-alertGroup_"+group.groupID+"' role='treeitem'>\
							     <h4><a href='#' class='ANDI508-alertGroup-toggler' title='Show Group' tabindex='0'>"+group.heading+
								 " (<span class='ANDI508-total'></span>)</a></h4><ol class='ANDI508-alertGroup-list'></ol></li>";
			$("#ANDI508 #ANDI508-alertType-"+group.type+"s-container").append(containerHtml);
		}
	}

	//This function creates the html for ANDI's Display.
	function insertANDIdisplay(){
		
		var menuButtons = 
		"<div class='ANDI508-control-buttons-container'>"
			+"<button id='ANDI508-button-relaunch' aria-label='Relaunch ANDI' title='Press To Relaunch ANDI' accesskey='"+andiAccessKey_relaunch+"'><img src='"+icons_url+"reload.png' alt='' /></button>" //refresh
			+"<button id='ANDI508-button-highlights' aria-label='Element Highlights' title='Press to Hide Element Highlights' aria-pressed='true'><img src='"+icons_url+"highlights-on.png' alt='' /></button>" //lightbulb
			+"<button id='ANDI508-button-minimode' aria-label='Mini Mode' title='Press To Engage Mini Mode'><img src='"+icons_url+"less.png' alt='' /></button><input type='hidden' value='false' id='ANDI508_setting_minimode' />" //underscore/minimize
			+"<button id='ANDI508-button-help' aria-label='ANDI Help' title='Press To Open ANDI Help Page'><img src='"+icons_url+"help.png' alt='' /></button>"
			+"<button id='ANDI508-button-close' aria-label='Remove ANDI' title='Press To Remove ANDI\'s Display'><img src='"+icons_url+"close.png' alt='' /></button>"
		+"</div>";
		
		var andiDisplay = "\
		<section id='ANDI508' class='ANDI508' tabindex='0' aria-roledescription='ANDI Accessible Name And Description Inspector'>\
		<div id='ANDI508-header'>\
			<h1 id='ANDI508-toolName' tabindex='0' onclick='alert(\"ANDI "+andiVersionNumber+"\");' aria-haspopup='true' aria-label='ANDI Accessibility Test Tool'>ANDI</h1>\
			<div id='ANDI508-controls'><h2 class='ANDI508-screenReaderOnly'>ANDI Controls</h2>\
				"+menuButtons+"\
			</div>\
		</div>\
		<div id='ANDI508-activeElementInspection'><h2 class='ANDI508-screenReaderOnly'>ANDI Active Element Inspection</h2>\
			<p id='ANDI508-startUpSummary' tabindex='0' accesskey='"+andiAccessKey_jump+"'>Discover accessibility markup by tabbing to or hovering over elements on this page.</p>\
			<div id='ANDI508-tagNameContainer'><h3 class='ANDI508-heading'>Element:</h3>\
				<span class='ANDI508-code'><button title='Focus on Previous Element' accesskey='"+andiAccessKey_prev+"' id='ANDI508-button-prevElement'>&lt;</button><a href='#' accesskey='"+andiAccessKey_jump+"' id='ANDI508_tagname_link' aria-labelledby='ANDI508_active_element_tagname'><span id='ANDI508_active_element_tagname'><span id='ANDI508-tagNameDisplay'></span><span class='ANDI508-screenReaderOnly'> tag</span></span></a><button title='Focus on Next Element' accesskey='"+andiAccessKey_next+"' id='ANDI508-button-nextElement'>&gt;</button></span>\
			</div>\
			<div id='ANDI508-accessibleComponentsTableContainer'>\
				<h3 id='ANDI508-accessibleComponentsTable-heading' class='ANDI508-heading' tabindex='0'>Accessibility Components: <span id='ANDI508-accessibleComponentsTotal'></span></h3>\
				<table id='ANDI508-accessibleComponentsTable' aria-labelledby='ANDI508-accessibleComponentsTable-heading'>\
				<tbody tabindex='0' /></table>\
			</div>\
			<div id='ANDI508-outputContainer'>\
				<h3 class='ANDI508-heading' id='ANDI508_heading_output'>ANDI Output:</h3>\
				<div id='ANDI508-outputText' tabindex='0' accesskey='"+andiAccessKey_output+"' aria-labelledby='ANDI508_heading_output ANDI508-outputText' />\
			</div>\
		</div>\
		<div id='ANDI508-pageAnalysis' ><h2 class='ANDI508-screenReaderOnly'>ANDI Page Analysis</h2>\
			<h3 class='ANDI508-heading' id='ANDI508-numberOfElements'><a href='#'>Total Focusable Elements Found: <span class='ANDI508-total'></span></a></h3><br />\
			<p id='ANDI508-accesskeysFound'>Accesskeys List: <span id='ANDI508-accesskeysListContainer' /></p>\
			<div id='ANDI508-alerts-list'>\
				<h3 id='ANDI508-numberOfAccessibilityAlerts' class='ANDI508-heading'>\
				<a id='ANDI508-alertsList-total' aria-labelledby='ANDI508_number_of_accessibility_alerts' title='Hide Alert List' accesskey='"+andiAccessKey_jump+"' href='#' aria-expanded='true'>\
				<span id='ANDI508_number_of_accessibility_alerts'>Accessibility Alerts: <span class='ANDI508-total' /></span>\
				</a></h3>\
				<div id='ANDI508-alerts-container-scrollable' role='tree'>\
					<ul id='ANDI508-alertType-dangers-container' role='group' />\
					<ul id='ANDI508-alertType-warnings-container' role='group' />\
					<ul id='ANDI508-alertType-cautions-container' role='group' />\
				</div>\
			</div>\
		</div>\
		</section>\
		<svg id='ANDI508-laser-container' width='100%' height='100%'><title>ANDI Lasers</title><line id='ANDI508-laser' /></svg>\
		";
		
		$("body").wrapInner("<div id='ANDI508-testPage' accesskey='"+andiAccessKey_jump+"' />") //Add an outer container to the test page
				 .prepend(andiDisplay); //insert ANDI display into body
				 
		buildAlertGroupsHtml();
	}

	//This function defines the css for elements created/modified by ANDI.
	//If additional definitions need to be added, insert a backslash \ character after the line.
	function defineCssClassStyles(){

	var generalCss = "\
	html, body\
		{overflow:hidden !important; padding:0; margin:0; max-width:100%;}\
	.ANDI508\
		{background-color:black !important; color:white !important; box-shadow:0 0 20px 0 gray; padding:4px; margin:0; height:auto; position:fixed; top:0; left:0; z-index:9999; display:block; width:100%; border-radius:0;}\
	#ANDI508 *, #ANDI508 h1, #ANDI508 h4, #ANDI508 h3, #ANDI508 div, #ANDI508 span, #ANDI508 ul, #ANDI508 li, #ANDI508 a, #ANDI508 p, #ANDI508 button  \
		{font:normal normal normal 10pt/normal Verdana; line-height:normal; letter-spacing:normal; text-align:left;\
		 background:black !important; color:white !important; appearance:normal; text-transform:none; opacity:1 !important;\
		 margin:0; padding:0; border:none; border-radius:0; left:0; top:0; vertical-align:baseline;\
		 width:auto; height:auto; min-width:0; max-width:none; min-height:0; max-height:none; overflow:visible; transform:none;}\
	#ANDI508 *:focus\
		{outline:1px solid #dedab7 !important; box-shadow:0 0 6px 0 #dedab7;}\
	#ANDI508 *::before, #ANDI508 *:before, #ANDI508 *::after, #ANDI508 *:after\
		{content:none}\
	#ANDI508 a\
		{text-decoration:none;}\
	#ANDI508 a:hover, #ANDI508 a:active\
		{text-decoration:underline; font-family:'Verdana'; background:none;}\
	#ANDI508 .ANDI508-heading\
		{font-size:12pt; color:white !important; white-space:nowrap; margin:0; display:inline; position:relative; }\
	#ANDI508 .ANDI508-heading a, #ANDI508 .ANDI508-heading a:hover, #ANDI508 .ANDI508-heading span, #ANDI508 .ANDI508-heading a *\
		{font-size:12pt; color:white !important; font-weight:normal;}\
	#ANDI508 .ANDI508-screenReaderOnly\
		{height:0; width:0px; overflow:hidden; position:absolute;}\
	";

	var majorSectionsCss = "\
	#ANDI508 #ANDI508-toolName\
		{font-family:Verdana; font-size:20pt; font-weight:bold; color:white !important; margin:0 5px 1px 5px; float:left; cursor:pointer; text-shadow: 1px 1px 3px #808080;}\
	#ANDI508 #ANDI508-header\
		{float:left; width:100%; display:inline-block; position:relative;}\
	#ANDI508 #ANDI508-activeElementInspection\
		{min-width:300px; width:40%; padding-left:3%; float:left; display:inline-block; min-height:2em}\
	#ANDI508 #ANDI508-pageAnalysis\
		{width: 50%; float:left; padding-left:3%; display:inline-block; margin-bottom:5px; background-color:black !important;}\
	#ANDI508-testPage\
		{padding-left:5px; overflow-y:auto; overflow-x:hidden; position:relative; top:0; width:100%;}\
	";
		
	var lasersCss = "\
	#ANDI508-laser-container\
		{position:absolute; top:0; z-index:9998; display:none; background:none;}\
	#ANDI508-laser, #ANDI508-lasers\
		{stroke:deeppink; stroke-width:2}\
	#ANDI508 .ANDI508-laserTarget\
		{cursor:default;}\
	";

	var accesskeysCss = "\
	#ANDI508 #ANDI508-accesskeysFound\
		{margin-left:3%; display:none; white-space:nowrap}\
	#ANDI508 #ANDI508-accesskeysFound a, #ANDI508 #ANDI508-accesskeysFound a:visited, #ANDI508 #ANDI508-accesskeysFound a:active, #ANDI508 #ANDI508-accesskeysFound a:hover\
		{color:white !important;}\
	";

	var alertsCss = "\
	#ANDI508 #ANDI508-alerts-list\
		{min-width:420px; width:80%; margin:0; clear:both; font-size:12pt; padding:0 5px 5px 0; display:none; margin-top:1px !important;}\
	#ANDI508 li\
		{margin:0 1px 2px 4%; line-height:120%;}\
	#ANDI508 ul li\
		{list-style:disc outside none; vertical-align:top;}\
	#ANDI508 ol li\
		{list-style:decimal outside none;}\
	#ANDI508 ol\
		{margin:0 0 5px 0;}\
	#ANDI508 li, #ANDI508 li a, #ANDI508 li a:hover, #ANDI508 li a:active, #ANDI508 li a:visited\
		{font-size:9pt; font-weight:normal;}\
	\
	#ANDI508 .ANDI508-display-danger, #ANDI508 .ANDI508-display-danger a, #ANDI508 .ANDI508-display-danger a:visited, #ANDI508 .ANDI508-display-danger a:active, #ANDI508 .ANDI508-display-danger a:hover, #ANDI508 .ANDI508-display-danger span\
		{color:#ff6767 !important;}\
	#ANDI508 .ANDI508-display-warning, #ANDI508 .ANDI508-display-warning a, #ANDI508 .ANDI508-display-warning a:visited, #ANDI508 .ANDI508-display-warning a:active, #ANDI508 .ANDI508-display-warning a:hover, #ANDI508 .ANDI508-display-warning span\
		{color:#ffab2e !important;}\
	#ANDI508 .ANDI508-display-caution, #ANDI508 .ANDI508-display-caution a, #ANDI508 .ANDI508-display-caution a:visited, #ANDI508 .ANDI508-display-caution a:active, #ANDI508 .ANDI508-display-caution a:hover, #ANDI508 .ANDI508-display-caution span\
		{color:#ffffb9 !important;}\
	\
	#ANDI508 #ANDI508-alerts-container-scrollable\
		{min-height:3.3em; max-height:10em; margin:3px 0 0 0; padding-top:1px; overflow-y:auto; overflow-x:hidden;\
		 scrollbar-arrow-color:#ff6767 !important; scrollbar-shadow-color:#ff6767 !important; scrollbar-face-color:black !important; scrollbar-highlight-color:black !important; scrollbar-track-color:black !important;}\
	#ANDI508 #ANDI508-alerts-container-scrollable::-webkit-scrollbar\
		{width:1em;}\
	#ANDI508 #ANDI508-alerts-container-scrollable::-webkit-scrollbar-track\
		{background-color:black;border:1px solid #ff6767}\
	#ANDI508 #ANDI508-alerts-container-scrollable::-webkit-scrollbar-thumb\
		{background:#ff6767;}\
	\
	#ANDI508 .ANDI508-alertGroup-container\
		{display:none;}\
	#ANDI508 .ANDI508-alertGroup-container h4\
		{margin-bottom:2px;}\
	#ANDI508 .ANDI508-alertGroup-list\
		{margin-top:3px; margin-left:1.5em; display:none;}\
	#ANDI508 a.ANDI508-alertGroup-toggler, #ANDI508 a.ANDI508-alertGroup-toggler:visited, #ANDI508 a.ANDI508-alertGroup-toggler:active, #ANDI508 a.ANDI508-alertGroup-toggler:hover\
		{font-size:10pt;padding-bottom:1px;}\
	";

	var buttonsCss = "\
	#ANDI508 #ANDI508-controls\
		{padding-top:5px; position:relative; white-space:nowrap; margin-left:100px}\
	#ANDI508 .ANDI508-control-buttons-container\
		{float:right; margin-right:1em;}\
	#ANDI508 .ANDI508-control-buttons-container button\
		{box-shadow: 1px 1px 2px 0px #808080;}\
	#ANDI508 .ANDI508-control-buttons-container button:hover\
		{border:1px solid lemonchiffon !important}\
	#ANDI508 .ANDI508-control-buttons-container button img\
		{width:22px}\
	#ANDI508 #ANDI508-button-relaunch, #ANDI508 #ANDI508-button-highlights, #ANDI508 #ANDI508-button-minimode, #ANDI508 #ANDI508-button-help, #ANDI508 #ANDI508-button-close\
		{margin-left:0.6em; border:1px solid gray; padding:0; text-align:center;\
		 font-weight:bold; display:inline !important; font-size:10pt; height:25px; width:25px}\
	#ANDI508 #ANDI508-button-prevElement, #ANDI508 #ANDI508-button-nextElement\
		{box-shadow:none; background:none; cursor:pointer; display:inline !important; margin-left:2px;}\
	#ANDI508 #ANDI508-button-prevElement\
		{margin-right:2px}\
	#ANDI508 #ANDI508-button-nextElement\
		{margin-right:4px;}\
	";

	var minimodeCss = "\
	#ANDI508 #ANDI508-outputContainer.ANDI508-minimode\
		{display:inline !important}\
	#ANDI508 #ANDI508-outputText.ANDI508-minimode\
		{display:inline !important; margin-left:0;}\
	#ANDI508 #ANDI508-activeElementInspection.ANDI508-minimode\
		{width:100%; max-width:100%; margin-left:0;}\
	#ANDI508 #ANDI508-tagNameContainer.ANDI508-minimode.ANDI508-tagNameContainer-visible\
		{display:inline !important}\
	";

	var activeElementInspectionCss = "\
	#ANDI508 #ANDI508-startUpSummary\
		{font-size:11pt; margin-right:10px; margin-top:5px; padding-left:1em; height:5em; width:250px}\
	#ANDI508 #ANDI508-tagNameContainer\
		{white-space:nowrap; display:none; margin-bottom:1px;}\
	#ANDI508 #ANDI508-tagNameContainer.ANDI508-tagNameContainer-visible\
		{display:block;}\
	#ANDI508 .ANDI508-code *, #ANDI508 .ANDI508-code a, #ANDI508 .ANDI508-code a:hover, #ANDI508 .ANDI508-code a:active\
		{font-family:monospace; font-size:12pt; padding-bottom:2px;}\
	\
	#ANDI508 #ANDI508-accessibleComponentsTableContainer\
		{visibility:hidden;}\
	#ANDI508 #ANDI508-accessibleComponentsTable\
		{width:97%; border-collapse:collapse; line-height:100%; margin-top:2px; margin-left:2%;}\
	#ANDI508 #ANDI508-accessibleComponentsTable th\
		{font:9pt Verdana !important; width:1%; text-align:right; border:none; vertical-align:top; padding:0; margin:0; white-space:nowrap;}\
	#ANDI508 #ANDI508-accessibleComponentsTable td, #ANDI508 #ANDI508-accessibleComponentsTable td *{\
		font:9pt Tahoma !important; white-space:nowrap; display:inline-block;}\
	#ANDI508 #ANDI508-accessibleComponentsTable td\
		{overflow:hidden; text-overflow:ellipsis; max-width:430px; max-height:1.2em; border:none; vertical-align:top; padding:0 0 0 5px; margin:0;}\
	#ANDI508 #ANDI508-accessibleComponentsTable-noData\
		{text-align:left !important; color:#ff6767 !important; font-size:9pt; padding-left:0;}\
	\
	#ANDI508 #ANDI508-outputContainer .ANDI508-heading\
		{margin-right:5px}\
	#ANDI508 #ANDI508-outputContainer\
		{margin-top:2px; margin-right:1px; display:none; padding:1px}\
	#ANDI508 #ANDI508-outputText:hover\
		{overflow:visible; display:block; z-index:9999; position:relative;}\
	#ANDI508 #ANDI508-outputText\
		{word-wrap:break-word; max-height:5em; line-height:0.5; display:block; overflow:hidden; margin-top:1px; padding:1px; margin-left:2%;}\
	#ANDI508 #ANDI508-outputText span\
		{font-size:10pt !important;}\
	#ANDI508 #ANDI508-outputText img\
		{width:1em; display:inline;}\
	#ANDI508 #ANDI508-outputText .ANDI508-subtreeComponent\
		{display:none;}\
	";
		
	var componentsCss = "\
	#ANDI508 .ANDI508-display-legend, #ANDI508 .ANDI508-display-figcaption, #ANDI508 .ANDI508-display-caption\
		{color:#e75dff !important}\
	#ANDI508 .ANDI508-display-aria-label\
		{color:#62ff8f !important}\
	#ANDI508 .ANDI508-display-aria-labelledby, #ANDI508 .ANDI508-display-aria-labelledby *\
		{color:#00e741 !important}\
	#ANDI508 .ANDI508-display-aria-describedby, #ANDI508 .ANDI508-display-aria-describedby *\
		{color:#00dae2 !important}\
	#ANDI508 .ANDI508-display-label, #ANDI508 .ANDI508-display-alt, #ANDI508 .ANDI508-display-label *\
		{color:#9fffba !important}\
	#ANDI508 .ANDI508-display-title\
		{color:#7cfbff !important}\
	#ANDI508 .ANDI508-display-innerText, #ANDI508 .ANDI508-display-value\
		{color:#c1c1c1 !important}\
	#ANDI508 .ANDI508-display-imageSrc\
		{color:#faebd7 !important}\
	#ANDI508 .ANDI508-display-addOnProperties, #ANDI508 .ANDI508-display-tabindex, #ANDI508 .ANDI508-display-accesskey\
		{color:#ffbdeb !important}\
	#ANDI508 .ANDI508-display-&lt;subtree&gt;\
		{color:#ffffff !important}\
	#ANDI508 .ANDI508-subtreeComponent\
		{color: inherit !important}\
	";

	var elementCss = "\
	.ANDI508-element\
		{opacity:1 !important;}\
	.ANDI508-highlight.ANDI508-element\
		{outline:2px dotted orange !important;}\
	.ANDI508-highlight.ANDI508-element-danger\
		{outline:2px dotted red !important;}\
	.ANDI508-highlight.ANDI508-element-active\
		{outline:2px solid deeppink !important}\
	";
	
	var andiCss = generalCss + majorSectionsCss + lasersCss + accesskeysCss + alertsCss + buttonsCss + minimodeCss + activeElementInspectionCss + componentsCss + elementCss;
	var style = "<style type='text/css' id='ANDI508-css'>"+andiCss+"</style>";
	
	if(oldIE){//insert special css if old IE
		//If special css is needed for ie7, put it here:
		var ie7Css = "\
		.ANDI508{background-color:black !important; display:inline-block;}\
		#ANDI508-testPage\
			{position:absolute; left:0; z-index:-1}\
		#ANDI508-testPage .ANDI508-element-container-oldIE\
			{display:inline;}\
		#ANDI508-testPage .ANDI508-highlight.ANDI508-element\
			{border:2px dotted orange !important; outline:none;}\
		#ANDI508-testPage .ANDI508-highlight.ANDI508-element-danger\
			{border:2px dotted red !important; outline:none;}\
		#ANDI508-testPage .ANDI508-highlight.ANDI508-element-active\
			{border:2px solid deeppink !important; outline:none;}\
		#ANDI508 #ANDI508-activeElementInspection\
			{width:400px;}\
		#ANDI508 #ANDI508-alerts-list\
			{width:420px;}\
		#ANDI508 ol li\
			{list-style-type:disc;}\
		#ANDI508 ul li, #ANDI508 #ANDI508-accesskeysFound\
			{margin-left:1.3em}\
		#ANDI508 #ANDI508-accessibleComponentsTable\
		{margin-left:0;}\
		";
		style += "<!--[if lte IE 7]><style type='text/css'>"+ie7Css+"</style><![endif]-->"
	}

		//Append css to the head of the page
		$("head").append(style.replace(/\t/g,'')); //remove tabs and insert style
	}

//%%%%%%%%%%%%%%%%%%%%%%%%%%%%
//**JQUERY Preparation - start
})();}})();
//**JQUERY Preparation - end
//%%%%%%%%%%%%%%%%%%%%%%%%%%%%
