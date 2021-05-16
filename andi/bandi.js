//===========================================//
//bANDI: buttons ANDI                        //
//Created By Social Security Administration? //
//lANDI was created by SSA, but I decided to //
//move the buttons code into bANDI           //
//===========================================//
function init_module() {

    var bandiVersionNumber = "8.1.0";

    //TODO: Remove the code for links once the code for bANDI is verified as working

    //create bANDI instance
    var bANDI = new AndiModule(bandiVersionNumber, "b");

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeClass("bANDI508-internalLink bANDI508-externalLink bANDI508-ambiguous bANDI508-anchorTarget");
        }
    };

    //This object class is used to store data about each link. Object instances will be placed into an array.
    function Link(href, nameDescription, index, alerts, target, linkPurpose, ambiguousIndex, element) {
        this.href = href;
        this.nameDescription = nameDescription;
        this.index = index;
        this.alerts = alerts;
        this.target = target;
        this.linkPurpose = linkPurpose;
        this.ambiguousIndex = undefined;
        this.element = element;
    }

    //This object class is used to keep track of the links on the page
    function Links() {
        this.list = [];
        this.count = 0;
        this.ambiguousIndex = 0;
        this.ambiguousCount = 0;
        this.internalCount = 0;
        this.externalCount = 0;
    }

    //This object class is used to store data about each button. Object instances will be placed into an array.
    function Button(nameDescription, index, alerts, accesskey, nonUniqueIndex, element) {
        this.nameDescription = nameDescription;
        this.index = index;
        this.alerts = alerts;
        this.accesskey = accesskey;
        this.nonUniqueIndex = undefined;
        this.element = element;
    }

    //This object class is used to keep track of the buttons on the page
    function Buttons() {
        this.list = [];
        this.nonUniqueIndex = 0;
        this.count = 0;
        this.nonUniqueCount = 0;
    }

    //Alert icons for the links list table
    //Ignore the jslint warning about the "new" declaration. It is needed.
    //TODO: Make sure all alerts are covered by the alertIcons function, then work on adding this to other modules
    var alertIcons = new function () {//new is intentional
        this.danger_noAccessibleName = makeIcon("danger", "No accessible name");
        this.danger_anchorTargetNotFound = makeIcon("warning", "In-page anchor target not found");
        this.warning_ambiguous = makeIcon("warning", "Ambiguous: same name, different href");
        this.caution_ambiguous = makeIcon("caution", "Ambiguous: same name, different href");
        this.caution_vagueText = makeIcon("caution", "Vague: does not identify link purpose.");
        this.warning_nonUnique = makeIcon("warning", "Non-Unique: same name as another button");
        this.warning_tabOrder = makeIcon("warning", "Element not in tab order");
        this.warning_noHrefRecognition = makeIcon("warning", "<a> without [href] may not be recognized as a link; add [role=link] or [href].");
        this.warning_clickEvent = makeIcon("warning", "Link has click event but is not keyboard accessible.");
        this.warning_hrefIDTabindex = makeIcon("warning", "<a> element has no [href], [id], or [tabindex]; This might be a link that only works with a mouse.");
        this.warning_hrefTabindex = makeIcon("warning", "<a> element has no [href], or [tabindex]; This might be a link that only works with a mouse.");
        this.caution_alertTargetLink = makeIcon("caution", "This <a> element is the target of another link; When link is followed, target may not receive visual indication of focus.")

        function makeIcon(alertLevel, titleText) {
            //The sortPriority number allows alert icon sorting
            var sortPriority = "3"; //default to caution
            if (alertLevel == "warning") {
                sortPriority = "2";
            } else if (alertLevel == "danger") {
                sortPriority = "1";
            }
            return "<img src='" + icons_url + alertLevel + ".png' alt='" + alertLevel + "' title='Accessibility Alert: " + titleText + "' /><i>" + sortPriority + " </i>";
        }
    };

    AndiModule.initActiveActionButtons({
        linksMode: true,
        viewLinksList: false,
        highlightAmbiguousLinks: false,
        buttonsMode: false,
        viewButtonsList: false,
        highlightNonUniqueButtons: false
    });

    bANDI.viewList_tableReady = false;
    bANDI.index = 1;

    //This function will analyze the test page for link related markup relating to accessibility
    bANDI.analyze = function () {

        bANDI.links = new Links();
        bANDI.buttons = new Buttons();

        //Variables used to build the links/buttons list array.
        var href, nameDescription, alerts, target, linkPurpose, accesskey, alertIcon, alertObject, relatedElement, nonUniqueIndex, ambiguousIndex;

        //Loop through every visible element and run tests
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=button]", "button,:button,:submit,:reset,:image")) { //ANALYZE BUTTONS
                if (!andiCheck.isThisElementDisabled(this)) {
                    bANDI.buttons.count += 1;

                    if (AndiModule.activeActionButtons.buttonsMode) {
                        andiData = new AndiData(this);

                        nameDescription = getNameDescription(andiData.accName, andiData.accDesc);

                        alerts = "";
                        alertIcon = "";
                        alertObject = "";

                        if (andiData.accesskey) {
                            accesskey = andiData.accesskey;
                        } else {
                            accesskey = "";
                        }

                        if (nameDescription) { //Search through Buttons Array for same name
                            nonUniqueIndex = scanForNonUniqueness(this, nameDescription);

                            if ($(this).is("[role=button]")) { //role=button
                                isElementInTabOrder(this, "button");
                            }
                            if (!alerts) { //Add this for sorting purposes
                                alerts = "<i>4</i>";
                            }
                        } else { //No accessible name or description
                            alerts = alertIcons.danger_noAccessibleName;
                            nameDescription = "<span class='ANDI508-display-danger'>No Accessible Name</span>";
                        }

                        andiCheck.commonFocusableElementChecks(andiData, $(this));
                        AndiData.attachDataToElement(this);

                        //create Button object and add to array
                        bANDI.buttons.list.push(new Button(nameDescription, bANDI.index, alerts, accesskey, nonUniqueIndex, this));
                        bANDI.index += 1;
                    }
                }
            }
        });

        andiCheck.areThereDisabledElements("buttons");

        //This function searches the button list for non-uniqueness.
        function scanForNonUniqueness(element, nameDescription) {
            for (var y = 0; y < bANDI.buttons.list.length; y++) {
                if (nameDescription.toLowerCase() == bANDI.buttons.list[y].nameDescription.toLowerCase()) { //nameDescription matches
                    alertIcon = alertIcons.warning_nonUnique;
                    alertObject = alert_0200;

                    //Throw the alert
                    if (!bANDI.buttons.list[y].alerts.includes(alertIcon)) {
                        //Throw alert on first instance only one time
                        andiAlerter.throwAlertOnOtherElement(bANDI.buttons.list[y].index, alertObject);
                        bANDI.buttons.list[y].alerts = alertIcon;
                    }

                    //Set the nonUniqueIndex
                    var m; //will store the nonUniqueIndex for this match
                    //Does the first instance already have a nonUniqueIndex?
                    relatedElement = $(bANDI.buttons.list[y].element);
                    if (bANDI.buttons.list[y].nonUniqueIndex) { //Yes. Copy the nonUniqueIndex from the first instance
                        m = bANDI.buttons.list[y].nonUniqueIndex;
                        bANDI.buttons.nonUniqueCount += 1;
                    } else { //No. increment nonUniqueIndex and add it to the first instance.
                        bANDI.buttons.nonUniqueCount = bANDI.buttons.nonUniqueCount + 2;
                        bANDI.buttons.nonUniqueIndex += 1;
                        m = bANDI.buttons.nonUniqueIndex;
                        bANDI.buttons.list[y].nonUniqueIndex = m;
                        $(relatedElement).addClass("bANDI508-ambiguous");
                    }

                    $(element).addClass("bANDI508-ambiguous");
                    alerts += alertIcon;
                    andiAlerter.throwAlert(alertObject);
                    return m;//prevents alert from being thrown more than once on an element
                }
            }
            return false;
        }

        //This function searches for anchor target if href is internal and greater than 1 character e.g. href="#x"
        function determineLinkPurpose(href, element) {
            if (typeof href !== "undefined") {
                if (href.charAt(0) === "#" && href.length > 1) {
                    var idRef = href.slice(1); //do not convert to lowercase
                    if (!isAnchorTargetFound(idRef)) {
                        if (element.onclick === null && $._data(element, 'events').click === undefined) {//no click events
                            //Throw Alert, Anchor Target not found
                            alertMessage = "In-page anchor target with [id=" + idRef + "] not found."
                            alerts += "<img src='" + icons_url + "warning.png' alt='warning' title='Accessibility Alert: " + alertMessage + "' /><i>2 </i>";
                            andiAlerter.throwAlert(alert_0069, [idRef]);
                        }
                    } else { //link is internal and anchor target found
                        bANDI.links.internalCount += 1;
                        linkPurpose = "i";
                        $(element).addClass("bANDI508-internalLink");
                    }
                } else if (href.charAt(0) !== "#" && !bANDI.isScriptedLink(href)) {//this is an external link
                    bANDI.links.externalCount += 1;
                    linkPurpose = "e";
                    $(element).addClass("bANDI508-externalLink");
                }
            }

            //This function searches allIds list to check if anchor target exists. return true if found.
            function isAnchorTargetFound(idRef) {
                //for(var z=0; z<testPageData.allIds.length; z++){
                //	if(testPageData.allIds[z].id.toString().toLowerCase() == idRef)
                //		return true;
                //}
                var anchorTarget = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
                if ($(anchorTarget).is(":visible")) {
                    $(anchorTarget).addClass("bANDI508-anchorTarget");
                    return true;
                }
                return false;
            }
        }

        //This function checks the link text for vagueness
        function testForVagueLinkText(nameDescription) {
            var regEx = /^(click here|here|link|edit|select|more|more info|more information|go)$/g;
            if (regEx.test(nameDescription.toLowerCase())) {
                alerts += alertIcons.caution_vagueText;
                andiAlerter.throwAlert(alert_0163);
            }
        }

        //This function determines if an element[role] is in tab order
        function isElementInTabOrder(element, role) {
            if (!!$(element).prop("tabIndex") && !$(element).is(":tabbable")) {//Element is not tabbable and has no tabindex
                //Throw Alert: Element with role=link|button not in tab order
                alertMessage = "Element with [role=" + role + "] not in the keyboard tab order."
                alerts += "<img src='" + icons_url + "warning.png' alt='warning' title='Accessibility Alert: " + alertMessage + "' /><i>2 </i>";
                alerts += alertIcons.warning_tabOrder;
                andiAlerter.throwAlert(alert_0125, [role]);
            }
        }

        //this function will normalize the accessible name and description so that the raw string can be analyzed.
        function getNameDescription(name, desc) {
            var n = "";
            var d = "";
            if (name) {
                n = andiUtility.normalizeOutput(name);
            }
            if (desc) {
                d = andiUtility.normalizeOutput(desc);
                if (n === d) { //matchingTest
                    d = "";
                } else {
                    d = " " + d; //add space
                }
            }
            return n + d;
        }
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    bANDI.results = function () {

        //Add Module Mode Buttons
        var moduleModeButtons = "<button id='ANDI508-linksMode-button' class='bANDI508-mode' aria-label='" + bANDI.links.count + " Links' aria-selected='false'>" + bANDI.links.count + " links</button>" +
            "<button id='ANDI508-buttonsMode-button' class='bANDI508-mode' aria-label='" + bANDI.buttons.count + " Buttons' aria-selected='false'>" + bANDI.buttons.count + " buttons</button>";
        $("#ANDI508-module-actions").html(moduleModeButtons);

        //Define bANDI mode buttons
        $("#ANDI508-buttonsMode-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.buttonsMode = true;
            AndiModule.launchModule("b");
        });

        if (AndiModule.activeActionButtons.buttonsMode) {
            andiBar.updateResultsSummary("Buttons Found: " + bANDI.buttons.count);

            $("#ANDI508-buttonsMode-button").attr("aria-selected", "true").addClass("ANDI508-module-action-active");

            //highlightNonUniqueButtons
            $("#ANDI508-module-actions").append("<span class='ANDI508-module-actions-spacer'>|</span> <button id='ANDI508-highlightNonUniqueButtons-button' aria-label='Highlight " + bANDI.buttons.nonUniqueCount + " Non-Unique Buttons' aria-pressed='false'>" + bANDI.buttons.nonUniqueCount + " non-unique buttons" + findIcon + "</button>");

            //highlightNonUniqueButtons Button
            $("#ANDI508-highlightNonUniqueButtons-button").click(function () {
                var testPage = $("#ANDI508-testPage");
                if (!$(testPage).hasClass("bANDI508-highlightAmbiguous")) { //On
                    $("#bANDI508-listButtons-tab-all").click();
                    $("#ANDI508-testPage").addClass("bANDI508-highlightAmbiguous");
                    andiOverlay.overlayButton_on("find", $(this));
                    AndiModule.activeActionButtons.highlightNonUniqueButtons = true;
                } else { //Off
                    $("#ANDI508-testPage").removeClass("bANDI508-highlightAmbiguous");
                    andiOverlay.overlayButton_off("find", $(this));
                    AndiModule.activeActionButtons.highlightNonUniqueButtons = false;
                }
                andiResetter.resizeHeights();
                return false;
            });

            $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewButtonsList-button' class='ANDI508-viewOtherResults-button' aria-label='View Buttons List' aria-expanded='false'>" + listIcon + "view buttons list</button>");

            //View Button List Button
            $("#ANDI508-viewButtonsList-button").click(function () {
                if (!bANDI.viewList_tableReady) {
                    bANDI.viewList_buildTable("buttons");
                    bANDI.viewList_attachEvents();
                    bANDI.viewList_attachEvents_buttons();
                    bANDI.viewList_tableReady = true;
                }
                bANDI.viewList_toggle("buttons", this);
                andiResetter.resizeHeights();
                return false;
            });

            //Show Startup Summary
            if (!andiBar.focusIsOnInspectableElement()) {
                andiBar.showElementControls();
                andiBar.showStartUpSummary("Discover accessibility markup for <span class='ANDI508-module-name-l'>buttons</span> by hovering over the highlighted elements or pressing the next/previous element buttons. Determine if the ANDI Output conveys a complete and meaningful contextual equivalent for every button.", true);
            }
        }

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons(["viewButtonsList", "highlightNonUniqueButtons"]);

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        if ($(element).hasClass("ANDI508-element")) {

            //Highlight the row in the links list that associates with this element
            bANDI.viewList_rowHighlight($(element).attr("data-andi508-index"));

            andiBar.prepareActiveElementInspection(element);

            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData,
                [["href", bANDI.normalizeHref(element)], "rel", "download", "media",
                    "target", "type"]);

            andiBar.displayOutput(elementData, element, addOnProps);
            andiBar.displayTable(elementData, element, addOnProps);
        }
    };

    //This function builds the table for the view list
    bANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='bANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='bANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='bANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='bANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        if (mode === "links") {
            //BUILD LINKS LIST TABLE
            var displayHref, targetText;
            for (var x = 0; x < bANDI.links.list.length; x++) {
                //get target text if internal link
                displayHref = "";
                targetText = "";
                if (bANDI.links.list[x].href) {//if has an href
                    if (!bANDI.isScriptedLink(bANDI.links.list[x])) {
                        if (bANDI.links.list[x].href.charAt(0) !== "#") { //href doesn't start with # (points externally)
                            targetText = "target='_bANDI'";
                        }
                        displayHref = "<a href='" + bANDI.links.list[x].href + "' " + targetText + ">" + bANDI.links.list[x].href + "</a>";
                    } else { //href contains javascript
                        displayHref = bANDI.links.list[x].href;
                    }
                }

                //determine if there is an alert
                rowClasses = "";
                var nextTabButton = "";
                if (bANDI.links.list[x].alerts.includes("Alert"))
                    rowClasses += "ANDI508-table-row-alert ";

                if (bANDI.links.list[x].linkPurpose == "i") {
                    rowClasses += "bANDI508-listLinks-internal ";
                    var id = bANDI.links.list[x].href;
                    if (id.charAt(0) === "#")
                        id = id.substring(1, id.length);
                    nextTabButton = " <button class='bANDI508-nextTab' data-andi508-relatedid='" +
                        id + "' title='focus on the element after id=" +
                        id + "'>next tab</button>";
                } else if (bANDI.links.list[x].linkPurpose == "e") {
                    rowClasses += "bANDI508-listLinks-external ";
                }

                tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                    "<th scope='row'>" + bANDI.links.list[x].index + "</th>" +
                    "<td class='ANDI508-alert-column'>" + bANDI.links.list[x].alerts + "</td>" +
                    "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + bANDI.links.list[x].index + "'>" + bANDI.links.list[x].nameDescription + "</a></td>" +
                    "<td class='ANDI508-code'>" + displayHref + nextTabButton + "</td>" +
                    "</tr>";
            }

            tabsHTML = "<button id='bANDI508-listLinks-tab-all' aria-label='View All Links' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all links (" + bANDI.links.list.length + ")</button>";
            tabsHTML += "<button id='bANDI508-listLinks-tab-internal' aria-label='View Skip Links' aria-selected='false' data-andi508-relatedclass='bANDI508-internalLink'>skip links (" + bANDI.links.internalCount + ")</button>";
            tabsHTML += "<button id='bANDI508-listLinks-tab-external' aria-label='View External Links' aria-selected='false' data-andi508-relatedclass='bANDI508-externalLink'>external links (" + bANDI.links.externalCount + ")</button>";

            appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:45%'><a href='javascript:void(0)'>href <i aria-hidden='true'></i></a></th>";
        } else { //BUILD BUTTON LIST TABLE
            for (var b = 0; b < bANDI.buttons.list.length; b++) {
                //determine if there is an alert
                rowClasses = "";
                if (bANDI.buttons.list[b].alerts.includes("Alert"))
                    rowClasses += "ANDI508-table-row-alert ";

                tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                    "<th scope='row'>" + bANDI.buttons.list[b].index + "</th>" +
                    "<td class='ANDI508-alert-column'>" + bANDI.buttons.list[b].alerts + "</td>" +
                    "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + bANDI.buttons.list[b].index + "'>" + bANDI.buttons.list[b].nameDescription + "</a></td>" +
                    "<td>" + bANDI.buttons.list[b].accesskey + "</td>" +
                    "</tr>";
            }

            tabsHTML = "<button id='bANDI508-listButtons-tab-all' aria-label='View All Buttons' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all buttons</button>";

            appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='button number'>#<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:75%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>" +
                "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Accesskey <i aria-hidden='true'></i></a></th>";
        }

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    bANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") { //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#bANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "links") {
                AndiModule.activeActionButtons.viewLinksList = true;
            } else {
                AndiModule.activeActionButtons.viewButtonsList = true;
            }
        } else { //hide List, show alert list
            $("#bANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();
            $("#ANDI508-alerts-list").show();

            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view " + mode + " list")
                .attr("aria-expanded", "false");
            if (mode === "links") {
                AndiModule.activeActionButtons.viewLinksList = false;
            } else {
                AndiModule.activeActionButtons.viewButtonsList = false;
            }
        }
    };

    //This function will highlight the text of the row.
    bANDI.viewList_rowHighlight = function (index) {
        $("#ANDI508-viewList-table tbody tr").each(function () {
            $(this).removeClass("ANDI508-table-row-inspecting");
            if ($(this).find("th").first().html() == index) {
                $(this).addClass("ANDI508-table-row-inspecting");
            }
        });
    };

    //This function attaches the click,hover,focus events to the items in the view list
    bANDI.viewList_attachEvents = function () {
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
        $("#bANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#bANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            bANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLinks prev button
        $("#bANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#bANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            bANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function attaches click events to the items specific to the Links view list
    bANDI.viewList_attachEvents_links = function () {
        $("#bANDI508-listLinks-tab-all").click(function () {
            bANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").show();
            //Remove All (glowing) Highlights
            $("#ANDI508-testPage").removeClass("bANDI508-highlightInternal bANDI508-highlightExternal bANDI508-highlightAmbiguous");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#bANDI508-listLinks-tab-internal").click(function () {
            bANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function () {
                if ($(this).hasClass("bANDI508-listLinks-internal"))
                    $(this).show();

                $(this).hide();
            });
            //Add (glowing) Highlight for Internal Links
            $("#ANDI508-testPage").removeClass("bANDI508-highlightExternal bANDI508-highlightAmbiguous").addClass("bANDI508-highlightInternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });
        $("#bANDI508-listLinks-tab-external").click(function () {
            bANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").each(function () {
                if ($(this).hasClass("bANDI508-listLinks-external")) {
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
            //Add (glowing) Highlight for External Links
            $("#ANDI508-testPage").removeClass("bANDI508-highlightInternal bANDI508-highlightAmbiguous").addClass("bANDI508-highlightExternal");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightAmbiguousLinks-button"));
            andiResetter.resizeHeights();
            return false;
        });

        //Define next tab button
        $("#ANDI508-viewList-table button.bANDI508-nextTab").each(function () {
            $(this).click(function () {
                var allElementsInTestPage = $("#ANDI508-testPage *");
                var idRef = $(this).attr("data-andi508-relatedid");
                var anchorTargetElement = document.getElementById(idRef) || document.getElementsByName(idRef)[0];
                var anchorTargetElementIndex = parseInt($(allElementsInTestPage).index($(anchorTargetElement)), 10);
                for (var x = anchorTargetElementIndex; x < allElementsInTestPage.length; x++) {
                    if ($(allElementsInTestPage).eq(x).is(":tabbable")) {
                        $(allElementsInTestPage).eq(x).focus();
                        break;
                    }
                }
            });
        });
    };

    //This function attaches click events to the items specific to the Buttons view list
    bANDI.viewList_attachEvents_buttons = function () {
        $("#bANDI508-listButtons-tab-all").click(function () {
            bANDI.viewList_selectTab(this);
            $("#ANDI508-viewList-table tbody tr").show();
            //Remove All (glowing) Highlights
            $("#ANDI508-testPage").removeClass("bANDI508-highlightAmbiguous");
            //Turn Off Ambiguous Button
            andiOverlay.overlayButton_off("find", $("#ANDI508-highlightNonUniqueButtons-button"));
            andiResetter.resizeHeights();
            return false;
        });
    };

    //This function handles the selection of a tab.
    bANDI.viewList_selectTab = function (tab) {
        $("#bANDI508-viewList-tabs button").removeClass().attr("aria-selected", "false");
        $(tab).addClass("ANDI508-tab-active").attr("aria-selected", "true");
    };

    //This function gets the href
    //if href length is greater than 1 and last char is a slash
    //This elimates false positives during comparisons since with or without slash is essentially the same
    bANDI.normalizeHref = function (element) {
        var href = $(element).attr("href");
        if (typeof href != "undefined") {
            href = $.trim($(element).attr("href"));
            if (href === "") {
                href = "\"\"";
            } else if (href.length > 1 && href.charAt(href.length - 1) == "/") {
                href = href.slice(0, -1);
            }
        }
        return href;
    };

    //This function returns true if the href is a link that fires a script
    bANDI.isScriptedLink = function (href) {
        if (typeof href == "string") {
            //broken up into three substrings so its not flagged in jslint
            return (href.toLowerCase().substring(0, 3) === "jav" && href.toLowerCase().substring(3, 5) === "ascri" && href.toLowerCase().substring(8, 3) === "pt:");
        }
        return false;
    };

    bANDI.analyze();
    bANDI.results();

}//end init