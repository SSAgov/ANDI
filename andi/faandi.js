//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration    //
//=============================================//
function init_module() {
    var fandiVersionNumber = "7.0.0", fANDI;

    //create fANDI instance
    fANDI = new AndiModule(fandiVersionNumber, "fa");

    AndiModule.initActiveActionButtons({
        tabOrder: false,
        titleAttributes: false,
        labelTags: false
    });

    //This object class is used to store data about each focusable element. Object instances will be placed into an array.
    function Focusable(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the focusable elements on the page
    function Focusables() {
        this.list = [];
        this.count = 0;
    }

    fANDI.viewList_tableReady = false;
    fANDI.index = 1;

    //This function will analyze the test page for focusable element related markup relating to accessibility
    fANDI.analyze = function () {
        fANDI.focusables = new Focusables();

        fANDI.accesskeys = new AndiAccesskeys();

        //Loop through every visible element and run tests
        //NOTE: If getting rid of "if ($(this).is(":focusable,canvas"))", use:
        //      $(TestPageData.allElements).not( ....).each(function ())
        $(TestPageData.allElements).each(function () {
            fANDI.focusables.list.push(new Focusable(this, fANDI.index));
            fANDI.focusables.count += 1;
            andiData = new AndiData(this);

            andiCheck.commonFocusableElementChecks(andiData, $(this));
            andiCheck.lookForCanvasFallback(this);
            if (andiData.accesskey) {
                fANDI.accesskeys.push(this, andiData.accesskey, fANDI.index);
            }
            testPageData.firstLaunchedModulePrep(this, andiData);
            AndiData.attachDataToElement(this);
            fANDI.index += 1;
        });

        andiCheck.areLabelForValid();
        andiCheck.areThereDisabledElements("elements");
    };

    function AndiAccesskeys() {
        //Raw accesskey values will be stored here and checked against
        var duplicateComparator = "";

        //Stores HTML to display the accesskeys
        var list = "";

        this.getListHtml = function () {
            return list;
        };

        this.push = function (element, accesskey, index) {
            if (accesskey) {
                //Is accesskey value more than one character?
                if (accesskey.length > 1) { //TODO: could be a non-issue if browsers are supporting space delimited accesskey lists
                    andiAlerter.throwAlert(alert_0052, [accesskey]);
                    addToList(accesskey, alert_0052);
                } else { //Check for duplicate accesskey
                    if (duplicateComparator.includes(accesskey)) {
                        if ($(element).is("button,input:submit,input:button,input:reset,input:image")) {
                            //duplicate accesskey found on button
                            andiAlerter.throwAlert(alert_0054, [accesskey]);
                            addToList(accesskey, alert_0054);
                        } else if ($(element).is("a[href]")) { //duplicate accesskey found on link
                            andiAlerter.throwAlert(alert_0056, [accesskey]);
                            addToList(accesskey, alert_0056);
                        } else { //duplicate accesskey found
                            andiAlerter.throwAlert(alert_0055, [accesskey]);
                            addToList(accesskey, alert_0055);
                        }
                    } else {
                        addToList(accesskey);
                        duplicateComparator += accesskey;
                    }
                }
            }

            function addToList(accesskey, alertObject) {
                var addClass = "";
                var titleText = "";
                if (alertObject) {
                    addClass = "class='ANDI508-display-" + alertObject.level + "'";
                    titleText = alertObject.level + ": " + alertObject.message + accesskey;
                } else {
                    titleText = "AccessKey " + accesskey + " found, focus on element";
                }
                if (index === 0) {
                    list += "<span tabindex='0' " + addClass + " title='" + titleText + "'>" + accesskey + "</span> ";
                } else {
                    list += "<a href='#' data-andi508-relatedindex='" + index + "' title='" + titleText + "'><span " + addClass + ">" + accesskey + "</span></a> ";
                }
            }
        };
    }

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    //Inserts some counter totals, displays the accesskey list
    fANDI.results = function () {
        andiBar.updateResultsSummary("Focusable Elements Found: " + testPageData.andiElementIndex);

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewFocusablesList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view focusable items list</button>");

        //Focusable Elements List Button
        $("#ANDI508-viewFocusablesList-button").click(function () {
            if (!fANDI.viewList_tableReady) {
                fANDI.viewList_buildTable("focusable elements");
                fANDI.viewList_attachEvents();
                fANDI.viewList_tableReady = true;
            }
            fANDI.viewList_toggle("focusable elements", this);
            andiResetter.resizeHeights();
            return false;
        });

        //Accesskeys List:
        if (fANDI.accesskeys.getListHtml()) {
            $("#ANDI508-additionalPageResults").append("<p id='ANDI508-accesskeysFound'>AccessKeys: " + "{ " + fANDI.accesskeys.getListHtml() + "}</p>");
            $("#ANDI508-accesskeysFound").find("a").each(function () {
                andiFocuser.addFocusClick($(this));
                $(this).on("mouseover", andiLaser.drawAlertLaser);
                $(this).on("click", andiLaser.eraseLaser);
                $(this).on("mouseleave", andiLaser.eraseLaser);
            });
            $("#ANDI508-accesskeysFound").show();
        }

        //Tab Order button
        var moduleActionButtons = "<button id='ANDI508-tabOrder-button' aria-label='Tab Order Indicators' aria-pressed='false'>tab order" + overlayIcon + "</button>";
        moduleActionButtons += "<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes" + overlayIcon + "</button>";
        moduleActionButtons += "<button id='ANDI508-labelTags-button' aria-label='Label Tags' aria-pressed='false'>label tags" + overlayIcon + "</button>";

        $("#ANDI508-module-actions").append(moduleActionButtons);

        //Define tabOrder button functionality
        $("#ANDI508-tabOrder-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));
                andiOverlay.overlayTabOrder();
                AndiModule.activeActionButtons.tabOrder = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-tabSequence");
                AndiModule.activeActionButtons.tabOrder = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define titleAttributes button functionality
        $("#ANDI508-titleAttributes-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));
                andiOverlay.overlayTitleAttributes();
                AndiModule.activeActionButtons.titleAttributes = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-titleAttributes");
                AndiModule.activeActionButtons.titleAttributes = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define titleAttributes button functionality
        $("#ANDI508-labelTags-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));
                andiOverlay.overlayLabelTags();
                AndiModule.activeActionButtons.labelTags = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-labelTags");
                AndiModule.activeActionButtons.labelTags = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        andiBar.focusIsOnInspectableElement();
        andiBar.showElementControls();
        andiBar.showStartUpSummary("Discover accessibility markup for focusable elements by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every focusable element.", true);

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons([
            "tabOrder",
            "titleAttributes",
            "labelTags"
        ]);

        $("#ANDI508").focus();
    };

    //This function builds the table for the view list
    fANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='fANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='fANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='fANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='fANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        for (var x = 0; x < fANDI.focusables.list.length; x++) {
            //determine if there is an alert
            rowClasses = "";
            var nextTabButton = "";
            // if (fANDI.focusables.list[x].alerts.includes("Alert"))
            //     rowClasses += "ANDI508-table-row-alert ";

            tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                "<th scope='row'>" + fANDI.focusables.list[x].index + "</th>" +
                "<td class='ANDI508-alert-column'></td>" +
                //"<td class='ANDI508-alert-column'>" + fANDI.focusables.list[x].alerts + "</td>" +
                "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + fANDI.focusables.list[x].index + "'>" + fANDI.focusables.list[x].element + "</a></td>" +
                "</tr>";
        }

        appendHTML += nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:85%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>";

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    fANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") {  //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#fANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "focusable elements") {
                AndiModule.activeActionButtons.viewLinksList = true;
            }
        } else { //hide List, show alert list
            $("#fANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();
            $("#ANDI508-alerts-list").show();

            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view " + mode + " list")
                .attr("aria-expanded", "false");
            if (mode === "focusable elements") {
                AndiModule.activeActionButtons.viewLinksList = false;
            } else {
                AndiModule.activeActionButtons.viewButtonsList = false;
            }
        }
    };

    //This function attaches the click,hover,focus events to the items in the view list
    fANDI.viewList_attachEvents = function () {
        //Add focus click to each link (output) in the table
        $("#ANDI508-viewList-table td a[data-andi508-relatedindex]").each(function () {
            andiFocuser.addFocusClick($(this));
            var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + $(this).attr("data-andi508-relatedindex") + "]").first();
            andiLaser.createLaserTrigger($(this), $(relatedElement));
            $(this)
                .hover(function () {
                    if (!event.shiftKey)
                        AndiModule.inspect(relatedElement[0]);
                })
                .focus(function () {
                    AndiModule.inspect(relatedElement[0]);
                });
        });

        //This will define the click logic for the table sorting.
        //Table sorting does not use aria-sort because .removeAttr("aria-sort") crashes in old IE
        $("#ANDI508-viewList-table th a").click(function () {
            var table = $(this).closest("table");
            $(table).find("th").find("i").html("")
                .end().find("a"); //remove all arrow

            var rows = $(table).find("tr:gt(0)").toArray().sort(sortCompare($(this).parent().index()));
            this.asc = !this.asc;
            if (!this.asc) {
                rows = rows.reverse();
                $(this).attr("title", "descending")
                    .parent().find("i").html("&#9650;"); //up arrow
            } else {
                $(this).attr("title", "ascending")
                    .parent().find("i").html("&#9660;"); //down arrow
            }
            for (var i = 0; i < rows.length; i++) {
                $(table).append(rows[i]);
            }

            //Table Sort Functionality
            function sortCompare(index) {
                return function (a, b) {
                    var valA = getCellValue(a, index);
                    var valB = getCellValue(b, index);
                    return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
                };
                function getCellValue(row, index) {
                    return $(row).children("td,th").eq(index).text();
                }
            }
        });

        //Define listLinks next button
        $("#fANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#fANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var focusGoesOnThisIndex;

            if (index == testPageData.andiElementIndex || isNaN(index)) {
                //No link being inspected yet, get first element according to selected tab
                focusGoesOnThisIndex = $("#ANDI508-testPage ." + selectedTabClass).first().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to first
            } else {
                //Find the next element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for (var x = index; x < testPageData.andiElementIndex; x++) {
                    //Get next element within set of selected tab type
                    if ($("#ANDI508-testPage ." + selectedTabClass + "[data-andi508-index='" + (x + 1) + "']").length) {
                        focusGoesOnThisIndex = x + 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            fANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLinks prev button
        $("#fANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#fANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
            var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));
            var firstElementInListIndex = $("#ANDI508-testPage ." + selectedTabClass).first().attr("data-andi508-index");
            var focusGoesOnThisIndex;

            if (isNaN(index)) { //no active element yet
                //get first element according to selected tab
                andiFocuser.focusByIndex(firstElementInListIndex); //loop back to first
                focusGoesOnThisIndex = firstElementInListIndex;
            } else if (index == firstElementInListIndex) {
                //Loop to last element in list
                focusGoesOnThisIndex = $("#ANDI508-testPage ." + selectedTabClass).last().attr("data-andi508-index");
                andiFocuser.focusByIndex(focusGoesOnThisIndex); //loop back to last
            } else {
                //Find the previous element with class from selected tab and data-andi508-index
                //This will skip over elements that may have been removed from the DOM
                for (var x = index; x > 0; x--) {
                    //Get next element within set of selected tab type
                    if ($("#ANDI508-testPage ." + selectedTabClass + "[data-andi508-index='" + (x - 1) + "']").length) {
                        focusGoesOnThisIndex = x - 1;
                        andiFocuser.focusByIndex(focusGoesOnThisIndex);
                        break;
                    }
                }
            }

            //Highlight the row in the links list that associates with this element
            fANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function will overlay the tab order sequence.
    //It will take into account, tabindexes that are greater than zero and less than zero
    AndiOverlay.prototype.overlayTabOrder = function () {
        var tabindex;
        var tabSequence = 0;
        var overlayObject;
        //PASS 1: Get tabindexes greater than 0:
        var greaterThanZeroArray = []; //Will store elements with tabindex greater than 0
        $("#ANDI508-testPage [tabindex].ANDI508-element").each(function () {
            tabindex = $(this).attr("tabindex");
            if (tabindex > 0)//tab index is greater than 0
                greaterThanZeroArray.push(this); //Add to the array
        });
        //loop through the greater than zero array until all elements have been addressed
        var i = 1;
        var z = greaterThanZeroArray.length;
        while (z > 0) {
            for (var x = 0; x < greaterThanZeroArray.length; x++) {
                if ($(greaterThanZeroArray[x]).attr("tabindex") == i) {
                    tabSequence += 1;
                    overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence ANDI508-overlay-tabSequence-greaterThanZero", tabSequence, "tabIndex=" + i, i);
                    andiOverlay.insertAssociatedOverlay($(greaterThanZeroArray[x]), overlayObject, true);
                    z--;
                }
            }
            i += 1;
        }

        //PASS 2: Get tabindex=0 and natively tabbable:
        var titleText;
        var lastRadioGroupName;
        $("#ANDI508-testPage .ANDI508-element").each(function () {
            tabindex = $(this).attr("tabindex");
            if (tabindex < 0) {
                //tab index is negative
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-tabSequence", "X", "not in tab order", 0);
                andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
            } else if (tabindex == 0 || ($(this).is(":tabbable") && !(tabindex > 0))) {
                //tabindex is 0 or natively tabbable and tabindex is not greater than zero

                if ($(this).is("input[type=radio][name]")) {
                    if (lastRadioGroupName !== undefined && lastRadioGroupName === $(this).attr("name")) {
                        return; //this is a subsequent radio button, don't add overlay
                    } else {
                        lastRadioGroupName = $(this).attr("name");
                    }
                }
                tabSequence += 1;
                titleText = (tabindex == 0) ? "tabIndex=0" : "natively tabbable";
                overlayObject = andiOverlay.createOverlay("ANDI508-overlay-tabSequence", tabSequence, titleText, 0);
                andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
            }
        });
    };

    //This function will overlay the label elements.
    AndiOverlay.prototype.overlayLabelTags = function () {
        var labelText, labelFor, overlayClasses, overlayObject, titleText;
        $("#ANDI508-testPage label").filter(":visible").each(function () {
            labelText = "&lt;label";
            overlayClasses = "ANDI508-overlay-labelTags";
            titleText = "";
            labelFor = $(this).attr("for");

            if (labelFor) {
                labelText += " for=" + labelFor;
                if (!document.getElementById(labelFor)) { //id that matches for cannot be found
                    overlayClasses += " ANDI508-overlay-alert";
                    titleText += "no matching [id]";
                }
            } else {
                titleText += "no [for] attribute";
            }
            labelText += "&gt;";

            overlayObject = andiOverlay.createOverlay(overlayClasses, labelText, titleText, 0);
            andiOverlay.insertAssociatedOverlay(this, overlayObject, true);
            $(this).after(andiOverlay.createOverlay(overlayClasses, "&lt;/label&gt;", "", 0));
        });

    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);
    };

    fANDI.analyze();
    fANDI.results();

}//end init
