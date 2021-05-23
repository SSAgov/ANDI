//==========================================//
//jANDI: lists ANDI                         //
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var jANDIVersionNumber = "4.1.3";

    //create jANDI instance
    var jANDI = new AndiModule(jANDIVersionNumber, "j");
    jANDI.index = 1;
    jANDI.viewList_tableReady = false;

    //This object class is used to store data about each list. Object instances will be placed into an array.
    function List(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the lists on the page
    function Lists() {
        this.list = [];
        this.count = 0;
        this.olCount = 0;
        this.ulCount = 0;
        this.liCount = 0;
        this.dlCount = 0;
        this.ddCount = 0;
        this.dtCount = 0;
        this.listRoleCount = 0;
        this.listItemRoleCount = 0;
    }

    var langAttributesCount = 0;
    var roleAttributesCount = 0;

    AndiModule.initActiveActionButtons({
        readingOrder: false,
        roleAttributes: false,
        langAttributes: false
    });

    //This function will analyze the test page for lists related markup relating to accessibility
    jANDI.analyze = function () {
        jANDI.lists = new Lists();

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=listitem],[role=list]", "ol,ul,li,dl,dd,dt")) {
                //Add to the headings array
                jANDI.lists.list.push(new List(this, jANDI.index));
                jANDI.lists.count += 1;
                jANDI.index += 1;

                if ($(this).isSemantically("[role=list]", "ol,ul,dl")) {
                    if ($(this).is("ul")) {
                        jANDI.lists.ulCount += 1;
                    } else if ($(this).is("ol")) {
                        jANDI.lists.olCount += 1;
                    } else if ($(this).is("dl")) {
                        jANDI.lists.dlCount += 1;
                    } else {
                        jANDI.lists.listRoleCount += 1;
                    }
                    jANDI.lists.count += 1;
                }

                andiData = new AndiData(this);

                //Is the listitem contained by an appropriate list container?
                if ($(this).is("[role=listitem]")) {
                    jANDI.lists.listItemRoleCount += 1;
                    if (!$(this).closest("[role=list]").length) {
                        andiAlerter.throwAlert(alert_0079, ["[role=listitem]", "[role=list]"]);
                    }
                } else if ($(this).is("li")) {
                    jANDI.lists.liCount += 1;
                    var listContainer = $(this).closest("ol,ul");
                    if (!$(listContainer).length) {
                        andiAlerter.throwAlert(alert_0079, ["&lt;li&gt;", "&lt;ol&gt; or &lt;ul&gt;"]);
                    } else { //check if listContainer is still semantically a list
                        var listContainer_role = $(listContainer).attr("role");
                        if (listContainer_role && listContainer_role !== "list")
                            andiAlerter.throwAlert(alert_0185, [listContainer_role]);
                    }
                } else if ($(this).is("dd,dt") && !$(this).closest("dl").length) { //Is the dl,dt contained by a dl?
                    if ($(this).is("dd")) {
                        jANDI.lists.ddCount += 1;
                    } else if ($(this).is("dt")) {
                        jANDI.lists.dtCount += 1;
                    }
                    andiAlerter.throwAlert(alert_007A);
                }

                andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                AndiData.attachDataToElement(this);
            }

            //For all elements on the page
            if ($.trim($(this).attr("role")))
                roleAttributesCount += 1;
            if ($.trim($(this).prop("lang")))
                langAttributesCount += 1;
        });
    };

    //Initialize outline
    jANDI.outline = "<h3 tabindex='-1' id='jANDI508-outline-heading'>List of Lists:</h3><div class='ANDI508-scrollable'>";

    //This function will display the list of lists (lists outline)
    //It should only be called on heading elements
    jANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");
        var ariaLevel = $(element).attr("aria-level");

        //Indent the heading according to the level
        //Results in h1 = 1% left margin, h2 = 2% left margin, etc.
        var indentLevel;
        if (ariaLevel) {
            //Check if positive integer
            if (parseInt(ariaLevel) > 0 && parseInt(ariaLevel) == ariaLevel) {
                indentLevel = parseInt(ariaLevel);
            } else { //aria-level is not a positive integer, default to 2 (defined in ARIA spec, and screen readers are doing this)
                indentLevel = 2;
            }
        } else {
            if (role === "heading") {
                indentLevel = 2; //no aria-level and role=heading, so default to 2 (defined in ARIA spec)
            } else {
                indentLevel = parseInt(tagName.slice(1)); //get second character from h tag
            }
        }

        var outlineItem = "<a style='margin-left:" + indentLevel + "%' href='#' data-andi508-relatedindex='" + $(element).attr('data-andi508-index') + "'>&lt;" + tagName;

        //display relevant attributes
        if (role) {
            outlineItem += " role='" + role + "' ";
        }
        if (ariaLevel) {
            outlineItem += " aria-level='" + ariaLevel + "' ";
        }

        outlineItem += "&gt;";
        outlineItem += "<span class='ANDI508-display-innerText'>";
        outlineItem += $.trim(andiUtility.formatForHtml($(element).text().substring(0, displayCharLength)));
        if ($(element).html().length > displayCharLength) {
            outlineItem += "...";
        }
        outlineItem += "</span>";
        outlineItem += "&lt;/" + tagName + "&gt;</a>";
        outlineItem += "<br />";
        return outlineItem;
    };

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    jANDI.getOutlineItemModule = function (elementToUse) {
        var outlineItem = '"' + elementToUse.index + '" ';

        outlineItem += "<span class='ANDI508-display-innerText'>";
        outlineItem += elementToUse;

        outlineItem += "</span>";
        outlineItem += "</a>";
        outlineItem += "<br />";
        return outlineItem;
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    jANDI.results = function () {
        var startupSummaryText = "";
        var moduleActionButtons = "";
        moduleActionButtons += "<button id='ANDI508-readingOrder-button' aria-pressed='false'>reading order" + overlayIcon + "</button>";

        var moreDetails = "<button id='ANDI508-roleAttributes-button' aria-pressed='false' aria-label='" + roleAttributesCount + " Role Attributes'>" + roleAttributesCount + " role attributes" + overlayIcon + "</button>" +
            "<button id='ANDI508-langAttributes-button' aria-pressed='false' aria-label='" + langAttributesCount + " Lang Attributes'>" + langAttributesCount + " lang attributes" + overlayIcon + "</button>";

        moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        if (document.title) {
            startupSummaryText += "The page title is: " + document.title + ".<br>";
        } else {
            startupSummaryText += "There is no page title.<br>";
        }
        var htmlLangAttribute = $.trim($("html").first().prop("lang"));
        //pop up the lang value of the HTML element
        if (htmlLangAttribute) {
            startupSummaryText += "The <html> element has a lang attribute value of: " + htmlLangAttribute + ".<br>";
        } else {
            startupSummaryText += "The <html> element does not have a lang attribute.<br>";
        }

        andiBar.initializeModuleActionGroups();

        //Define readingOrder button functionality
        $("#ANDI508-readingOrder-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));
                andiOverlay.overlayReadingOrder();
                AndiModule.activeActionButtons.readingOrder = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-readingOrder");
                AndiModule.activeActionButtons.readingOrder = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define the lang attributes button
        $("#ANDI508-langAttributes-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));

                var langOverlayText = "";
                var overlayObject;
                var langOfPartsCount = 0;
                $("#ANDI508-testPage [lang]").filter(":visible").each(function () {
                    if ($(this).prop("lang").trim() != "") {
                        langOverlayText = $(this).prop("tagName").toLowerCase() + " lang=" + $(this).prop("lang");
                        overlayObject = andiOverlay.createOverlay("ANDI508-overlay-langAttributes", langOverlayText);
                        andiOverlay.insertAssociatedOverlay(this, overlayObject);
                        langOfPartsCount += 1;
                    }
                });

                AndiModule.activeActionButtons.langAttributes = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-langAttributes");
                AndiModule.activeActionButtons.langAttributes = false;
            }
            andiResetter.resizeHeights();

            return false;
        });

        //Define the lang attributes button
        $("#ANDI508-roleAttributes-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("overlay", $(this));

                var langOverlayText = "";
                var overlayObject, role;
                $("#ANDI508-testPage [role]:not('.ANDI508-overlay')").filter(":visible").each(function () {
                    role = $.trim($(this).attr("role")).toLowerCase();
                    if (role) { //if role is not empty
                        langOverlayText = $(this).prop("tagName").toLowerCase() + " role=" + role;
                        overlayObject = andiOverlay.createOverlay("ANDI508-overlay-roleAttributes", langOverlayText);
                        andiOverlay.insertAssociatedOverlay(this, overlayObject);
                    }
                });

                AndiModule.activeActionButtons.roleAttributes = true;
            } else {
                andiOverlay.overlayButton_off("overlay", $(this));
                andiOverlay.removeOverlay("ANDI508-overlay-roleAttributes");
                AndiModule.activeActionButtons.roleAttributes = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Deselect all mode buttons
        $("#ANDI508-module-actions button.jANDI508-mode").attr("aria-selected", "false");
        $("#ANDI508-lists-button")
            .attr("aria-selected", "true")
            .addClass("ANDI508-module-action-active");

        //Build Outline
        for (var x = 0; x < jANDI.lists.list.length; x++) {
            jANDI.outline += jANDI.getOutlineItemModule(jANDI.lists.list[x]);
        }
        jANDI.outline += "</div>";

        andiBar.updateResultsSummary("List Elements: " + jANDI.lists.list.length);
        var listCounts = "";
        var delimiter = ", ";
        var listTypesUsed = "";

        listCounts += jANDI.lists.olCount + " ordered list (ol)";
        listTypesUsed += "ol";

        listCounts += delimiter + jANDI.lists.ulCount + " unordered list (ul)";
        listTypesUsed += delimiter + "ul";

        listCounts += delimiter + jANDI.lists.liCount + " list item (li)";
        listTypesUsed += delimiter + "li";

        listCounts += delimiter + jANDI.lists.dlCount + " description list (dl)";
        listTypesUsed += delimiter + "dl";

        listCounts += delimiter + jANDI.lists.ddCount + " description details (dd)";
        listTypesUsed += delimiter + "dd";

        listCounts += delimiter + jANDI.lists.dtCount + " description term (dt)";
        listTypesUsed += delimiter + "dt";

        listCounts += delimiter + jANDI.lists.listRoleCount + " role=list";
        listTypesUsed += delimiter + "[role=list]";

        listCounts += delimiter + jANDI.lists.listItemRoleCount + " role=listitem";
        listTypesUsed += delimiter + "[role=listitem]";

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewListsList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view list of lists</button>");

        //List of Lists Button
        $("#ANDI508-viewListsList-button").click(function () {
            if (!jANDI.viewList_tableReady) {
                jANDI.viewList_buildTable("lists");
                jANDI.viewList_attachEvents();
                jANDI.viewList_tableReady = true;
            }
            jANDI.viewList_toggle("lists", this);
            andiResetter.resizeHeights();
            return false;
        });

        //$("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view list of lists</button><div id='jANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

        //Define outline button
        $("#ANDI508-viewOutline-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                //hide Outline, show alert list
                $("#jANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                $("#ANDI508-alerts-list").show();

                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "hide list of lists")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else { //show Outline, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide list of lists")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#jANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });

        //$("#ANDI508-additionalPageResults").html(listCounts);
        startupSummaryText += "List structure found.<br />Determine if the <span class='ANDI508-module-name-s'>list</span> container types used (" + listTypesUsed + ") are appropriately applied. " + listCounts;
        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary(startupSummaryText, true);
        }

        $("#jANDI508-outline-container")
            .html(jANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
                andiLaser.createLaserTrigger($(this), $(relatedElement));
                $(this)
                    .hover(function () {
                        if (!event.shiftKey) {
                            AndiModule.inspect(relatedElement[0]);
                        }
                    })
                    .focus(function () {
                        AndiModule.inspect(relatedElement[0]);
                    });
            });

        $("#jANDI508-outline-container")
            .html(jANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
                andiLaser.createLaserTrigger($(this), $(relatedElement));
                $(this)
                    .hover(function () {
                        if (!event.shiftKey) {
                            AndiModule.inspect(relatedElement[0]);
                        }
                    })
                    .focus(function () {
                        AndiModule.inspect(relatedElement[0]);
                    });
            });

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons([
            "readingOrder",
            "roleAttributes",
            "langAttributes"
        ]);

        $("#ANDI508").focus();

    };

    //This function builds the table for the view list
    jANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='jANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='jANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='jANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='jANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        for (var x = 0; x < jANDI.lists.list.length; x++) {
            //determine if there is an alert
            rowClasses = "";
            var nextTabButton = "";
            // if (jANDI.lists.list[x].alerts.includes("Alert"))
            //     rowClasses += "ANDI508-table-row-alert ";

            tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                "<th scope='row'>" + jANDI.lists.list[x].index + "</th>" +
                "<td class='ANDI508-alert-column'></td>" +
                //"<td class='ANDI508-alert-column'>" + jANDI.lists.list[x].alerts + "</td>" +
                "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + jANDI.lists.list[x].index + "'>" + jANDI.lists.list[x].element + "</a></td>"
            "</tr>";
        }

        appendHTML += nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>";

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");
    };

    //This function hide/shows the view list
    jANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") { //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#jANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "lists") {
                AndiModule.activeActionButtons.viewLinksList = true;
            }
        } else { //hide List, show alert list
            $("#jANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();

            $("#ANDI508-alerts-list").show();
            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view " + mode + " list")
                .attr("aria-expanded", "false");
            if (mode === "lists") {
                AndiModule.activeActionButtons.viewLinksList = false;
            } else {
                AndiModule.activeActionButtons.viewButtonsList = false;
            }
        }
    };

    //This function attaches the click,hover,focus events to the items in the view list
    jANDI.viewList_attachEvents = function () {
        //Add focus click to each link (output) in the table
        $("#ANDI508-viewList-table td a[data-andi508-relatedindex]").each(function () {
            andiFocuser.addFocusClick($(this));
            var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + $(this).attr("data-andi508-relatedindex") + "]").first();
            andiLaser.createLaserTrigger($(this), $(relatedElement));
            $(this)
                .hover(function () {
                    if (!event.shiftKey) {
                        AndiModule.inspect(relatedElement[0]);
                    }
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

        //Define listLists next button
        $("#jANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#jANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            jANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLists prev button
        $("#jANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#jANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            jANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {
            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");

            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [
                    "aria-level",
                    getDefault_ariaLive(element, elementData),
                    getDefault_ariaAtomic(element, elementData),
                    "aria-busy",
                    "aria-relevant"
                ]);

            andiBar.displayTable(elementData, element, addOnProps);

            andiBar.displayOutput(elementData, element, addOnProps);
        }

        //This function assumes the default values of aria-live based on the element's role as defined by spec
        function getDefault_ariaLive(element, elementData) {
            var val = $.trim($(element).attr("aria-live"));
            if (!val) {
                if (elementData.role === "alert") {
                    val = "assertive";
                } else if (elementData.role === "log" || elementData.role === "status") {
                    val = "polite";
                } else if (elementData.role === "marquee" || elementData.role === "timer") {
                    val = "off";
                } else {
                    return; //no default
                }
            }
            return ["aria-live", val];
        }

        //This function assumes the default values of aria-atomic based on the element's role as defined by spec
        function getDefault_ariaAtomic(element, elementData) {
            var val = $.trim($(element).attr("aria-atomic"));
            if (!val) {
                if (elementData.role === "alert" || elementData.role === "status") {
                    val = "true";
                } else if (elementData.role === "log" || elementData.role === "marquee" || elementData.role === "timer") {
                    val = "false";
                } else {
                    return; //no default
                }
            }
            return ["aria-atomic", val];
        }
    };

    //This function will overlay the reading order sequence.
    AndiOverlay.prototype.overlayReadingOrder = function () {
        //Elements that should be excluded from the scan, hidden elements will automatically be filtered out
        var exclusions = "option,script,style,noscript";
        //Elements that should be included in the scan even if they don't have innerText
        var inclusions = "select,input,textarea";

        var readingSequence = 0;
        var overlayObject;

        traverseReadingOrder(document.getElementById("ANDI508-testPage"));

        //This recursive function traverses the dom tree and inserts the reading order overlay
        //It distinguishes between element nodes and text nodes
        //It will check for aria-hidden=true (with inheritance)
        function traverseReadingOrder(element, ariaHidden) {

            //Check for aria-hidden=true
            ariaHidden = (ariaHidden || $(element).attr("aria-hidden") === "true") ? true : false;

            for (var z = 0; z < element.childNodes.length; z++) { //if child is an element object that is visible
                if (element.childNodes[z].nodeType === 1) {
                    if (!$(element.childNodes[z]).is(exclusions) && $(element.childNodes[z]).is(":shown")) {
                        if ($(element.childNodes[z]).is(inclusions)) {//no need to look at this element's childNodes
                            insertReadingOrder(ariaHidden, element.childNodes[z]);
                            z += 1;//because a new node was inserted, the indexes changed
                        } else { //recursion here:
                            traverseReadingOrder(element.childNodes[z], ariaHidden);
                        }
                    }
                } else if (element.childNodes[z].nodeType === 3) { //otherwise, if child is a text node
                    if ($.trim(element.childNodes[z].nodeValue) !== "") { //Found some text
                        insertReadingOrder(ariaHidden, element.childNodes[z]);
                        z += 1;//because a new node was inserted, the indexes changed
                    }
                }
            }

            //this function inserts the reading order overlay
            //if it's hidden using aria-hidden it will insert an alert overlay
            function insertReadingOrder(ariaHidden, node) {
                if (ariaHidden) {
                    overlayObject = andiOverlay.createOverlay("ANDI508-overlay-alert ANDI508-overlay-readingOrder", "X", "hidden from screen reader using aria-hidden=true");
                } else {
                    readingSequence += 1;
                    overlayObject = andiOverlay.createOverlay("ANDI508-overlay-readingOrder", readingSequence);
                }
                andiOverlay.insertAssociatedOverlay(node, overlayObject);
            }
        }
    };

    jANDI.analyze();
    jANDI.results();

}//end init