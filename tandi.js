//=========================================//
//tANDI: tables ANDI					   //
//Created By Social Security Administration//
//=========================================//

function init_module(mode){

var tandiVersionNumber = "6.1.1";

//create tANDI instance
var tANDI = new AndiModule(tandiVersionNumber,"t");

tANDI.scopeLevelLimit = 4; //a scope at this depth level triggers an alert

tANDI.associatedThDelimeter = " <span aria-hidden='true'>|</span> ";

//This function updates the Active Element Inspector when mouseover is on a given to a highlighted element.
//Holding the shift key will prevent inspection from changing.
AndiModule.andiElementHoverability = function(event){
	//Prevents data tables from being inspected
	if(!event.shiftKey && (!$(this).is("table") || ($(this).is("table") && ($(this).attr("role") == "presentation")))){
		tANDI.inspect(this);
	}
};
//This function updates the Active Element Inspector when focus is given to a highlighted element.
AndiModule.andiElementFocusability = function(){
	andiLaser.eraseLaser();
	tANDI.inspect(this);
	andiResetter.resizeHeights();
};

//Override Previous Element Button to jump to and analyze the previous table:
$("#ANDI508-button-prevElement").off("click").click(function(){
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
	if(isNaN(index)) //no active element yet
		andiFocuser.focusByIndex(1); //first element
	else if(index == 1){
		if(tableCountTotal <= 1)
			//If there is only 1 table, loop back to last cell
			andiFocuser.focusByIndex(testPageData.andiElementIndex);
		else
			//Analyze previous table
			$("#ANDI508-prevTable-button").click();
	}
	else
		//Go to previous element in this table
		andiFocuser.focusByIndex(index - 1);
});

//Override Next Element Button to jump to and analyze the next table:
$("#ANDI508-button-nextElement").off("click").click(function(){
	var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-ANDI508-index"));
	if(index == testPageData.andiElementIndex || isNaN(index)){
		if(tableCountTotal <= 1)
			//If there is only 1 table, loop back to first cell
			andiFocuser.focusByIndex(1);
		else
			//Analyze previous table
			$("#ANDI508-nextTable-button").click();
	}
	else
		//Go to next element in this table
		andiFocuser.focusByIndex(index + 1);
});

//These variables are for the page
var tableCountTotal = 0;			//The total number of tables
var presentationTablesCount = 0;	//The total number of presentation tables
var dataTablesCount = 0;			//The total number of data tables (tables that aren't presentation tables)
var tableArray = [];				//Stores all tables in an array
var activeTableIndex = 0;			//The array index of the active table

//These variables are for the current table being analyzed (the active table)
var cellCount = 0;					//The total number of <th> and <td>
var rowCount = 0;					//The total number of <tr>
var colCount = 0;					//The total number of columns (maximum number of <th> or <td> in a <tr>)
var activeTableType;				//The table type (data or presentation) of the active table

//This function will analyze the test page for table related markup relating to accessibility
tANDI.analyze = function(){
	if(TestPageData.page_using_table){
		//Loop through each visible table
		$("#ANDI508-testPage table").filter(':visible').each(function(){
			//Store this table in the array
			tableArray.push($(this));
			
			//Is this not a presentation table?
			//TODO: does role=none matter?
			if($(this).attr("role") != 'presentation'){
				//It's a data table
				dataTablesCount++;
				tableCountTotal++;
			}
			else{
				//It's a presentation table
				presentationTablesCount++;
				tableCountTotal++;
			}
		});
		
		//Determine if the page has an active element from a previous ANDI launch
		var activeElementFound = false;
		for(x=0; x<tableArray.length; x++){
			//if this table or a cell within has the active element class
			if($(tableArray[x]).hasClass("ANDI508-element-active") 
				|| $(tableArray[x]).find("th.ANDI508-element-active").first().length 
				|| $(tableArray[x]).find("td.ANDI508-element-active").first().length){
				activeTableIndex = x;
				analyzeTable(tableArray[activeTableIndex]);
				activeElementFound = true;
				break;
			}
		}
		if(!activeElementFound)
			//Analyze next table
			analyzeTable(tableArray[activeTableIndex]);

		//If the page has tables
		if(tableCountTotal>0){
			//Display gathered totals for the current table
			$("#ANDI508-additionalPageResults").append("<p id='tANDI508-tablesInfo' tabindex='0'>Page has "+dataTablesCount+" data tables, "+presentationTablesCount+" presentation tables</p>");
			
			var moduleModeButtons = "<button id='ANDI508-headerAssociationMode-button' title='Press to change table analysis mode'>"+mode+"</button>";
			//If there are more than one table
			if(tableCountTotal > 1){
				//Add "prev table" and "next table" buttons
				moduleModeButtons += "<button id='ANDI508-prevTable-button' title='Press to analyze the previous table'>prev table</button>"
									+"<button id='ANDI508-nextTable-button' title='Press to analyze the next table'>next table</button>";
			}
			$("#ANDI508-module-modes").html(moduleModeButtons);
			
			//Define headerAssociationMode button functionality
			$("#ANDI508-headerAssociationMode-button").click(function(){
				if($(this).html()=="scope mode"){
					//Change mode, launch into headers mode
					andiResetter.softReset($("#ANDI508-testPage"));
					AndiModule.launchModule("t","headers/id mode");
				}
				else if($(this).html()=="headers/id mode"){
					//Change mode, launch into scope mode
					andiResetter.softReset($("#ANDI508-testPage"));
					AndiModule.launchModule("t","scope mode");
				}
				andiResetter.resizeHeights();
				
			});
			
			//Define prevTable button functionality
			$("#ANDI508-prevTable-button").click(function(){
				if(activeTableIndex == 0) 
					activeTableIndex = tableArray.length-1;
				else 
					activeTableIndex--;
				
				tANDI.reset();
				analyzeTable(tableArray[activeTableIndex]);
				tANDI.results();
				andiFocuser.focusByIndex(1);
				andiResetter.resizeHeights();
				return false;
			});
			
			//Define nextTable button functionality
			$("#ANDI508-nextTable-button").click(function(){
				if(activeTableIndex == tableArray.length-1) 
					activeTableIndex = 0;
				else 
					activeTableIndex++;
				
				tANDI.reset();
				analyzeTable(tableArray[activeTableIndex]);
				tANDI.results();
				andiFocuser.focusByIndex(1);
				andiResetter.resizeHeights();
				return false;
			});
		}
	}
};

//This function updates the results in the ANDI Bar
tANDI.results = function(){
	
	//Update Results Summary text depending on the active table type (data or presentation)
	var summaryText = activeTableType + " Table: ";
	if(activeTableType == "Data")
		andiBar.updateResultsSummary(summaryText + " <span title='"+colCount+" columns x "+rowCount+" rows'>["+colCount+"x"+rowCount+"]</span> "+cellCount+" cells");
	else // == "Presentation"
		andiBar.updateResultsSummary(summaryText);
	
	if(dataTablesCount > 0){
		if(!andiBar.focusIsOnInspectableElement())
			andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-t'>tables</span> by tabbing to or hovering over the table cells.",true,"table cell");
		else
			$("#ANDI508-pageAnalysis").show();
	}
	else if(presentationTablesCount > 0){
		if(!andiBar.focusIsOnInspectableElement())
			andiBar.showStartUpSummary("Only presentation <span class='ANDI508-module-name-t'>tables</span> were found on this page, no data tables.",true);
		else
			$("#ANDI508-pageAnalysis").show();
	}
	else{
		andiBar.showStartUpSummary("No <span class='ANDI508-module-name-t'>tables</span> were found on this page.",false);
	}
	andiAlerter.updateAlertList();
};

//This function will inspect a table or table cell
tANDI.inspect = function(element){
	andiBar.prepareActiveElementInspection(element);
	
	//Remove other tANDI highlights
	$("#ANDI508-testPage table").find("td,th").filter(':visible').removeClass("tANDI508-highlight");
	//Highlight This Element
	$(element).addClass("tANDI508-highlight");
	
	var associatedThText = "";
	
	if(!$(element).is("table"))
		grabHeadersAndHighlightRelatedCells(element);
	
	var elementData = $(element).data("ANDI508");
	
	displayTable(element);
	
	//This function defines ANDI's output logic for a table, th, or td element.
	AndiModule.outputLogic = function(){
		var usingTitleAsNamer = false;
	//Accessible Name
		//aria-labelledby
		if(andiBar.output.ariaLabelledby(elementData));
		//aria-label
		else if(andiBar.output.ariaLabel(elementData));
	//HTML Namers
		//caption
		else if(!elementData.ignoreCaption && andiBar.output.caption(elementData));
		//innerText/child
		//TODO: grab the child element components, such as alt on an img
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
	
	//insert the associatedThText into the output if there are no danger alerts
	if(elementData.dangers.length == 0){
		var outputText = $("#ANDI508-outputText");
		$(outputText).html(associatedThText + " " + $(outputText).html());
	}
	
	//This function propagates the Accessible Components table.
	//Only shows components containing data.
	//Will display message if no accessible components were found.
	function displayTable(element){

		//Create array of additional components needed by this module
		var additionalComponents = [
			element.id,
			$(element).attr("colspan"),
			$(element).attr("rowspan"),
			associatedThText,
			$(element).attr("summary")
		];
		
		if(andiCheck.wereComponentsFound(elementData, additionalComponents)){
			//add table rows for components found				
			andiBar.appendRow("caption",			elementData.caption);
			
			andiBar.appendRow("aria-labelledby",	elementData.ariaLabelledby, false, true);
			andiBar.appendRow("aria-label",			elementData.ariaLabel);

			andiBar.appendRow("alt",				elementData.alt);
			andiBar.appendRow("innerText",			elementData.innerText);
			andiBar.appendRow("child&nbsp;element",	elementData.subtree);
			andiBar.appendRow("imageSrc",			elementData.imageSrc);

			andiBar.appendRow("aria-describedby",	elementData.ariaDescribedby, false, true);
			andiBar.appendRow("title",				elementData.title);

			andiBar.appendRow("scope",				elementData.scope, true);
			andiBar.appendRow("headers",			elementData.headers, true);
			andiBar.appendRow("id",					additionalComponents[0], true);
			
			//add table rows for add-on properties found
			andiBar.appendRow("colspan",			additionalComponents[1], true);
			andiBar.appendRow("rowspan",			additionalComponents[2], true);
			
			andiBar.appendRow("associated&nbsp;th",	additionalComponents[3]);
			andiBar.appendRow("summary",			additionalComponents[4], true);
			
			if(elementData.addOnPropertiesTotal != 0){
				andiBar.appendRow("role",			elementData.addOnProperties.role, true);
				andiBar.appendRow("aria-sort",		elementData.addOnProperties.ariaSort, true);
				andiBar.appendRow("aria-controls",	elementData.addOnProperties.ariaControls, true);
				andiBar.appendRow("tabindex",		elementData.addOnProperties.tabindex, true);
				andiBar.appendRow("aria-haspopup",	elementData.addOnProperties.ariaHaspopup, true);
			}
		}
	}
	
	//This function will grab associated header cells and add highlights
	function grabHeadersAndHighlightRelatedCells(element){
		var table = $(element).closest("table");
		if($(table).attr("role") != "presentation"){
			//TODO: does role=none matter?
			var rowIndex = $(element).attr('data-tANDI508-rowIndex');
			var rowMember = $(element).attr("data-tANDI508-rowMember");
			var colIndex = $(element).attr('data-tANDI508-colIndex');
			var colMember = $(element).attr("data-tANDI508-colMember");
			var headers = $.trim($(element).attr("headers"));
			var idsArray, referencedId, referencedElement;
			//Find Related <th> cells
			//==HEADERS/ID MODE==//
			if((mode == "headers/id mode") && headers){
				idsArray = headers.split(" ");
				for (var x=0;x<idsArray.length;x++){
					//Can the id be found somewhere on the page?
					referencedId = andiUtility.escapeCssCharactersInId(idsArray[x]);
					referencedElement = $("#"+referencedId);
					
					if($(referencedElement).html() !== undefined){
						if($(referencedElement).is("th") || $(referencedElement).is("td")){
							associatedThText += andiUtility.formatForHtml(andiUtility.getTextOfTree($(referencedElement))) + tANDI.associatedThDelimeter;
							$(referencedElement).addClass("tANDI508-highlight");
						}
					}
				}
			}
			//==SCOPE MODE==//
			else if(mode == "scope mode"){
				if($(element).is("td")){
					//Highlight associating <th> for this <td>
					$(table).find("th.ANDI508-element").filter(':visible').each(function(){
						//get associated th from col
						if(index_greaterThan(rowIndex, $(this).attr("data-tANDI508-rowIndex"))
						&& index_match(colIndex, $(this).attr("data-tANDI508-colIndex"))
						&& !index_match(rowIndex, $(this).attr("data-tANDI508-rowIndex")))
						{//add associatedThText and highlight the cell from whence it came
							$(this).addClass("tANDI508-highlight");
							associatedThText += andiUtility.formatForHtml(andiUtility.getTextOfTree($(this))) + tANDI.associatedThDelimeter;
						}
						
						//get associated th from row
						if(index_greaterThan(colIndex, $(this).attr("data-tANDI508-colIndex"))
						&& index_match(rowIndex, $(this).attr("data-tANDI508-rowIndex"))
						&& !index_match(colIndex, $(this).attr("data-tANDI508-colIndex")))
						{//add associatedThText
							$(this).addClass("tANDI508-highlight");
							associatedThText += andiUtility.formatForHtml(andiUtility.getTextOfTree($(this))) + tANDI.associatedThDelimeter;
						}
					});
				}
			}
			//Highlight associating <th> and <td> for this th
			if($(element).is("th")){
				var scope = $(element).attr("scope");
				var id = $(element).attr("id");
				if((mode == "scope mode")){
					$(table).find("th.ANDI508-element,td.ANDI508-element").filter(':visible').each(function(){
						if(scope){
							//th has scope
							if((scope == "col" || scope == "colgroup")
								&& !index_greaterThan(rowIndex, $(this).attr("data-tANDI508-rowIndex"))
								&& index_match(colIndex,$(this).attr("data-tANDI508-colIndex")))
							{
								//alert(rowIndex+" "+$(this).attr("data-tANDI508-rowIndex"));
								$(this).addClass("tANDI508-highlight");
							}
							else if((scope == "row" || scope == "rowgroup")
								&& !index_greaterThan(colIndex, $(this).attr("data-tANDI508-colIndex"))
								&& index_match(rowIndex,$(this).attr("data-tANDI508-rowIndex")))
							{
								$(this).addClass("tANDI508-highlight");
							}
						}
						else{
							//th has no scope
							//**Assumed associations - this is where it gets sketchy**
							if($(this).is("td")){
								if(index_match(colIndex, $(this).attr("data-tANDI508-colIndex")) || index_match(rowIndex,$(this).attr("data-tANDI508-rowIndex")))
									$(this).addClass("tANDI508-highlight");
							}
							//No scope assumptions relating to other th
							else if($(this).is("th")){
								if(rowIndex == "0"
									&& index_match(colIndex,$(this).attr("data-tANDI508-colIndex"))
									&& !index_greaterThan(rowIndex, $(this).attr("data-tANDI508-rowIndex")))
								{
									$(this).addClass("tANDI508-highlight");
								}
							}
						}
					});
				}
				else if((mode == "headers/id mode") && id){//might have headers attributes pointing to this <th>
					$(table).find("th.ANDI508-element,td.ANDI508-element").filter(':visible').each(function(){
						headers = $(this).attr("headers");
						if(headers){
							idsArray = headers.split(" ");
							for (var x=0;x<idsArray.length;x++){
								if(id==idsArray[x]){
									$(this).addClass("tANDI508-highlight");
								}
							}
						}
					});
				}
			}
		}
	}
};

//This function will remove tANDI markup from every table and rebuild the alert list
tANDI.reset = function(){
	
	var testPage = $("#ANDI508-testPage");
	
	$("#ANDI508-alerts-container-scrollable ul").html("");

	//Every ANDI508-element
	$(testPage).find(".ANDI508-element").each(function(){
		$(this)
			.removeClass("tANDI508-highlight")
			.removeAttr("data-tANDI508-rowIndex")
			.removeAttr("data-tANDI508-colIndex")
			.removeAttr("data-tANDI508-rowMember")
			.removeAttr("data-tANDI508-colMember")
			.removeClass("ANDI508-element ANDI508-element-danger ANDI508-highlight")
			.removeData("ANDI508")
			.removeAttr("data-ANDI508-index")
			.off("focus",AndiModule.andiElementFocusability)
			.off("mouseenter",AndiModule.andiElementHoverability);
	});
	
	andiBar.buildAlertGroupsHtml();
	testPageData = new TestPageData(); //get fresh test page data
};

//This function will a table. Only one table at a time
function analyzeTable(table){
	//loop through the <table> and set data-* attributes
	//Each cell in a row is given a rowIndex
	//Each cell in a column is given a colIndex
	//Cells that are referenced by <th[scope]> are given a rowMember/colMember
	
	//The way tANDI analyzes the table is that it begins looking at the cells first
	//to determine if there is any existing scenarios that should trigger an alert.
	//When each cell has been evaluated, it will then attach alerts to the table element.
	
	//These variables keep track of the <tr>, <th>, <td> on each <table>
	rowCount = 0;
	colCount = 0;
	var thCount = 0;
	var tdCount = 0;
	var hasThRow = false;		//true when there are two or more th in a row
	var hasThCol = false;		//true when two or more rows contain a th
	var scopeRequired = false;	//true when scope is required for this table
	var tableHasScopes = false;	//true when cells in the table have scope
	var tableHasHeaders = false;//true when cells in the table have headers
	var row, cell;
	var colIndex, rowIndex, colspan, rowspan;
	var indexValue;
	var scope, headers;
	var rowIndexPlusRowspan, colIndexPlusColspan;
	var tooManyScopeRowLevels = false;
	var scopeRowLevel = ["","",""];
	var tooManyScopeColLevels = false;
	var scopeColLevel = ["","",""];
	var child;
	
	//This array is used to keep track of the rowspan of the previous row
	//They will be checked against before assigning the colIndex.
	//This technique is only needed for setting colIndex
	//since the rowIndex is handled more "automatically" by the <tr> tags
	var rowspanArray = [];
	
	//temporarily hide any nested tables so they don't interfere with analysis
	$(table).find("table").addClass("ANDI508-temporaryHide");
	
	//Is this not a presentation table and doesn't have nested table? 
	if($(table).attr("role") != 'presentation'){
		//TODO: does role=none matter?
		
		//This is a little hack to force the table tag to go first in the index
		//so that it is inspected first with the previous and next buttons.
		//Skip index 0, so that later the table can be placed at 0
		testPageData.andiElementIndex = 1;
		
		activeTableType = "Data";
		
	//Loop through the table twice:
		
		//Loop 1 (establish the rowIndex/colIndex)
		rowIndex = 0;
		var firstRow = true;
		$(table).find("tr").filter(':visible').each(function(){
			row = $(this);
			rowCount++;
			colIndex = 0;
			
			//Set colCount
			var x = $(row).find("th,td").filter(':visible').length;
			if(colCount < x)
				colCount = x;
			
			//Figure out colIndex/rowIndex
			$(row).find("th,td").filter(':visible').each(function(){
				//Increment cell counters
				cell = $(this);
				if($(cell).is("th")){
					thCount++;
					if(thCount>1)
						hasThRow = true;
					if(rowCount>1)
						hasThCol = true;
				}
				else{
					tdCount++;
				}
				
				//get colspan
				//TODO: mark for alert here if value is invalid
				colspan = $(cell).attr("colspan");
				if(colspan === undefined)
					colspan = 1;
				else
					colspan = parseInt(colspan);
				
				//get rowspan
				//TODO: mark for alert here if value is invalid
				rowspan = $(cell).attr("rowspan");
				if(rowspan === undefined)
					rowspan = 1;
				else
					rowspan = parseInt(rowspan);
				
				//Increase the rowspanArray length if needed
				if((rowspanArray.length == 0) || (rowspanArray[colIndex] === undefined))
					rowspanArray.push(parseInt(rowspan));
				else
					firstRow = false;
				
				//store colIndex
				if(!firstRow){
					//loop through the rowspanArray until a 1 is found
					for(x=colIndex; x<rowspanArray.length; x++){
						if(rowspanArray[x] == 1){
							break;
						}
						else if(rowspanArray[x] > 1){
						//there is a rowspan at this colIndex that is spanning over this row
							//decrement this item in the rowspan array
							rowspanArray[x]--;
							//increment the colIndex an extra amount to essentially skip this colIndex location
							colIndex++;
						}
					}
				}
				
				if(colspan < 2){
					$(cell).attr("data-tANDI508-colIndex",colIndex);
					rowspanArray[colIndex] = rowspan;
					colIndex++;
				}
				else{//colspan > 1
					indexValue = "";
					colIndexPlusColspan = parseInt(colIndex) + colspan;
					for(x=colIndex; x<colIndexPlusColspan; x++){
						indexValue += x + " ";
						rowspanArray[colIndex] = rowspan;
						colIndex++;
					}
					$(cell).attr("data-tANDI508-colIndex", $.trim(indexValue));
				}
				
				//store rowIndex
				if(rowspan < 2){
					$(cell).attr("data-tANDI508-rowIndex",rowIndex);
				}
				else{
					//rowspanArray[colIndex] = rowspan;
					indexValue = "";
					rowIndexPlusRowspan  = parseInt(rowIndex) + rowspan;
					for(x=rowIndex; x<rowIndexPlusRowspan; x++)
						indexValue += x + " ";
					$(cell).attr("data-tANDI508-rowIndex",$.trim(indexValue));
				}
			});
			
			//There are no more cells in this row, however, the rest of the rowspanArray needs to be decremented.
			//Decrement any additional rowspans from previous rows
			for(x=colIndex; x<rowspanArray.length; x++){
				if(rowspanArray[x]>1)
					rowspanArray[x]--;
			}

			rowIndex++;
		});

		//Loop 2 (establish colMember/rowMember, grab the accessibility components)
		$(table).find("th,td").filter(':visible').each(function(){
			cell = $(this);
			
			//scope
			scope = $(cell).attr("scope");
			headers = $(cell).attr("headers");
			
			if(headers)
				tableHasHeaders = true;

			if(scope && $(cell).is("th")){
				colIndex = $(cell).attr("data-tANDI508-colIndex");
				rowIndex = $(cell).attr("data-tANDI508-rowIndex");

				if(scope=="row" || scope=="rowgroup"){
					
					//Determine if there are "too many" scope rows
					for(x=0; x<=tANDI.scopeLevelLimit; x++){
						if(!scopeRowLevel[x] || (!scopeRowLevel[x] && (scopeRowLevel[x-1] != colIndex))){
							//scope found at this colIndex
							scopeRowLevel[x] = colIndex;
							break;
						}
						else if((x == tANDI.scopeLevelLimit) && (colIndex >= x)){
							//scope levelLimit has been exceeeded
							tooManyScopeRowLevels = true;
						}
					}
					
					tableHasScopes = true;
					$(table).find("th,td").filter(':visible').each(function(){
						if(!index_match(colIndex,$(this).attr("data-tANDI508-colIndex")) && index_match(rowIndex,$(this).attr("data-tANDI508-rowIndex"))){
							//mark the cells in this row that are owned by this element's scope
							$(this).attr("data-tANDI508-rowMember","true");
						}
					});
				}
				else if(scope=="col" || scope=="colgroup"){
					
					//Determine if there are too many scope columns
					for(x=0; x<=tANDI.scopeLevelLimit; x++){
						if(!scopeColLevel[x] || (!scopeColLevel[x] && (scopeColLevel[x-1] != rowIndex))){
							//scope found at this rowIndex
							scopeColLevel[x] = rowIndex;
							break;
						}
						else if((x == tANDI.scopeLevelLimit) && (rowIndex >= x)){
							//scope levelLimit has been exceeeded
							tooManyScopeColLevels = true;
						}
					}

					tableHasScopes = true;

					$(table).find("th,td").filter(':visible').each(function(){
						//alert(rowIndex+" "+$(this).attr("data-tANDI508-rowIndex")+" "+colIndex+" "+$(this).attr("data-tANDI508-colIndex"));
						if(!index_match(rowIndex,$(this).attr("data-tANDI508-rowIndex")) && index_match(colIndex,$(this).attr("data-tANDI508-colIndex"))){
						//mark the cells in this column that are owned by this element's scope
							$(this).attr("data-tANDI508-colMember","true");
						}
					});
				}
			}

			//CELLS
			
			//Determine if cell has an interactive child element (link or form element)
			child = undefined;
			if($(cell).has("a").length){
				child = $(cell).find("a").first();
			}
			else if($(cell).has("input").length){
				child = $(cell).find("input").first();
			}
			else if($(cell).has("select").length){
				child = $(cell).find("select").first();
			}
			else if($(cell).has("textarea").length){
				child = $(cell).find("textarea").first();
			}
			else if($(cell).has("button").length){
				child = $(cell).find("button").first();
			}
			else if($(cell).has("img").length){
				child = $(cell).find("img").first();
			}
			
			//Grab accessibility components from the cell
			andiData = new AndiData($(cell));
			andiData.grabComponents($(cell));
			
			if(child){
				//Also grab accessibility components from the child
				andiData.grabComponents($(child), true);//overwrite with components from the child, except for innerText
				//Do alert checks for the child
				andiCheck.commonFocusableElementChecks(andiData,$(child));
			}
			else{
				//Do alert checks for the cell
				andiCheck.commonNonFocusableElementChecks(andiData, $(cell));
			}
			
			if(scope){
				andiData.grab_scope($(cell));
				if(mode == "scope mode"){
					//Only throw scope alerts if in "scope mode"
					if(tooManyScopeRowLevels)
						andiAlerter.throwAlert(alert_0043,alert_0043.message+"(rows).");
					if(tooManyScopeColLevels)
						andiAlerter.throwAlert(alert_0043,alert_0043.message+"(columns).");
					andiCheck.detectDeprecatedHTML($(cell));
				}
			}
				
			if(headers){
				andiData.grab_headers($(cell)); //doesn't actually parse the headers text, just stores the actual value
				//if(mode == "headers/id mode"){}
			}
			
			//If this is not the upper left cell
			if($(cell).is("th") && !andiData.namerFound && !($(this).attr("data-tANDI508-rowIndex")=="1" && $(this).attr("data-tANDI508-colIndex")=="1"))
				//Header cell is empty
				andiAlerter.throwAlert(alert_0132);
			
			andiData.attachDataToElement($(cell));
		});
		
		//==DATA TABLES ONLY==//
		
		//This is a little hack to force the table to go first in the index
		var lastIndex = testPageData.andiElementIndex; //remember the last index
		testPageData.andiElementIndex = 0; //setting this to 0 allows the element to be created at index 1, which places it before the cells
		andiData = new AndiData($(table)); //create the AndiData object
		
		andiData.grabComponents($(table));
		andiCheck.commonNonFocusableElementChecks(andiData, $(table));
		
		//Look at booleans to determine if alerts should be thrown on the table
		
		andiCheck.detectDeprecatedHTML($(table));
		
		if(thCount == 0){
			if(tdCount == 0){
				//No td or th cells
				andiAlerter.throwAlert(alert_004E);
			}
			else{
				//No th cells
				andiAlerter.throwAlert(alert_0046);
			}
		}
		else{
			//Has th cells
			if(mode == "scope mode"){
				if(hasThRow && hasThCol)
					scopeRequired = true;
				
				if(!tableHasScopes){
					//Table Has No Scopes
					if(tableHasHeaders)
						//No Scope, Has Headers
						andiAlerter.throwAlert(alert_004B);
					else
						//No Scope, No Headers
						andiAlerter.throwAlert(alert_0048);
				}
				
				if(scopeRequired){
					//Check intersections for scope
					var xDirectionHasTh, yDirectionHasTh, rowIndex, colIndex, cell;
					$(table).find("th").filter(':visible').each(function(){
						//if this th does not have scope
						xDirectionHasTh = false;
						yDirectionHasTh = false;
						rowIndex = $(this).attr("data-tANDI508-rowIndex");
						colIndex = $(this).attr("data-tANDI508-colIndex");
						cell = $(this);
						if(!$(this).attr("scope")){
							//determine if this is at an intersection of th
							var xDirectionThCount = 0;
							var yDirectionThCount = 0;
							$(table).find("th").filter(':visible').each(function(){
								
								//determine if x direction multiple th at this rowindex
								if(rowIndex == $(this).attr("data-tANDI508-rowIndex")){
									xDirectionThCount++;
								}
								if(colIndex == $(this).attr("data-tANDI508-colIndex")){
									yDirectionThCount++;
								}
								
								if(xDirectionThCount>1){
									xDirectionHasTh = true;
								}
								if(yDirectionThCount>1){
									yDirectionHasTh = true;
								}
								if(xDirectionHasTh && yDirectionHasTh){
									//This cell is at th intersection and doesn't have scope
									if(!$(cell).hasClass("ANDI508-element-danger"))
										$(cell).addClass("ANDI508-element-danger");
									andiAlerter.throwAlertOnOtherElement($(cell).attr("data-ANDI508-index"),alert_0047);
									return false; //breaks out of the loop
								}
							});
						}
					});
				}
			}
			else if(mode == "headers/id mode"){
				if(!tableHasHeaders){
					//Table Has No Headers
					if(tableHasScopes)
						//No Headers, Has Scope
						andiAlerter.throwAlert(alert_004C);
					else
						//No Headers, No Scope
						andiAlerter.throwAlert(alert_004A);
				}
			}
			
			if(tableHasHeaders && tableHasScopes){
				//Table is using both scopes and headers
				andiAlerter.throwAlert(alert_0049);
			}
		}
		
		cellCount = thCount + tdCount;
		
		andiData.attachDataToElement($(table));
		
		testPageData.andiElementIndex = lastIndex; //set the index back to the last element's index so things dependent on this number don't break
	}
	else{
	//==PRESENTATION TABLE==//
		activeTableType = "Presentation";
	
		andiData = new AndiData($(table));
		andiData.grabComponents($(table));
		andiCheck.commonNonFocusableElementChecks(andiData, $(table));
		
		if($(table).find("th").filter(':visible').first().length)
			andiAlerter.throwAlert(alert_0041, alert_0041.message+"&lt;th&gt;.");
	
		if($(table).find("caption").filter(':visible').first().length)
			andiAlerter.throwAlert(alert_0041, alert_0041.message+"&lt;caption&gt;.");
		
		cellCount = 0;
		$(table).find("th,td").filter(':visible').each(function(){
			cellCount++;
			if($(this).attr("scope"))
				andiAlerter.throwAlert(alert_0041, alert_0041.message+"cells with scope attribute.");
			if($(this).attr("headers"))
				andiAlerter.throwAlert(alert_0041, alert_0041.message+"cells with headers attribute.");
		});
		
		if($(table).attr("summary"))
			andiAlerter.throwAlert(alert_0041,alert_0041.message+"summary attribute.");

		andiData.attachDataToElement($(table));
	}
	
	$(table).find("table").removeClass("ANDI508-temporaryHide");
}

//This function returns true if any index match is found.
//The colIndex/rowIndex could contain a space delimited array
function index_match(a,b){
	var match = false;
	var	aX = buildArrayOnIndex(a);
	var	bY = buildArrayOnIndex(b);

	//compare
	for(x=0; x<aX.length; x++){
		for(y=0; y<bY.length; y++){
			if(aX[x] == bY[y]){
				match = true;
				break;
			}
		}
	}
	return match;
}
//This function returns true if any indexes in "a" are greater than "b".
//The colIndex/rowIndex could contain a space delimited array
function index_greaterThan(a,b){
	var greaterThan = false;
	var	aX = buildArrayOnIndex(a);
	var	bY = buildArrayOnIndex(b);
	
	//compare
	for(x=0; x<a.length; x++){
		for(y=0; y<b.length; y++){
			if(aX[x] > bY[y]){
				greaterThan = true;
				break;
			}
		}
	}
	return greaterThan;
}

//This function will build an array based on the value passed in.
//If it is space delimited it returns an array greater than 1.
//If it is not space delimited it returns an array of length 1.
//This is mainly done to fix an IE7 bug with array handling.
function buildArrayOnIndex(value){
	if(value.toString().includes(" "))
		return value.split(" ");
	else
		return [value];
}

//analyze tables
tANDI.analyze();
tANDI.results();

}//end init
