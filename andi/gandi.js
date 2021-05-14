//==========================================//
//gANDI: graphics ANDI                      //
//Created By Social Security Administration //
//==========================================//
function init_module() {
    var gandiVersionNumber = "6.0.2";

    //TODO: add <video>

    //create gANDI instance
    var gANDI = new AndiModule(gandiVersionNumber, "g");

    gANDI.viewList_tableReady = false;
    gANDI.index = 1;

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeClass("gANDI508-background gANDI508-fontIcon");
        } else {
            $(testPage).find(".gANDI508-decorative").removeClass("gANDI508-decorative");
        }
    };

    //This object class is used to store data about each image. Object instances will be placed into an array.
    function Image(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the images on the page
    function Images() {
        this.list = [];
        this.count = 0;
        this.inlineCount = 0;      //inline images
        this.backgroundCount = 0;  //elements with background images
        this.decorativeCount = 0;  //images explicetly declared as decorative
        this.fontIconCount = 0;    //font icons
        this.imageLinkCount = 0;   //images contained in links
        this.imageButtonCount = 0; //images contained in buttons
    }

    AndiModule.initActiveActionButtons({
        fadeInlineImages: false,
        highlightDecorativeImages: false,
        removeBackgroundImages: false,
        highlightBackgroundImages: false,
        highlightFontIcons: false
    });

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    gANDI.analyze = function () {
        var isImageContainedByInteractiveWidget; //boolean if image is contained by link or button

        gANDI.images = new Images();

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            var closestWidgetParent;
            //Determine if the image is contained by an interactive widget (link, button)
            isImageContainedByInteractiveWidget = false; //reset boolean
            if ($(this).not("[tabindex]").is("img,[role=img]")) {
                //Is Image contained by a link or button?
                closestWidgetParent = $(this).closest("a,button,[role=button],[role=link]");
                if ($(closestWidgetParent).length) {
                    if ($(closestWidgetParent).isSemantically("[role=link]", "a")) {
                        gANDI.images.imageLinkCount += 1;
                    } else if ($(closestWidgetParent).isSemantically("[role=button]", "button")) {
                        gANDI.images.imageButtonCount += 1;
                    }
                    gANDI.images.inlineCount += 1;
                    isImageContainedByInteractiveWidget = true;
                }
            }

            if (isImageContainedByInteractiveWidget || $(this).is("[role=img],[role=image],img,input[type=image],svg,canvas,area,marquee,blink")) {
                if (isImageContainedByInteractiveWidget) {
                    //Check if parent already has been evaluated (when more than one image is in a link)
                    if (!$(closestWidgetParent).hasClass("ANDI508-element")) {
                        //Image is contained by <a> or <button>
                        andiData = new AndiData(closestWidgetParent[0]);
                        andiCheck.commonFocusableElementChecks(andiData, $(closestWidgetParent));
                        AndiData.attachDataToElement(closestWidgetParent);
                    }
                } else { //not contained by interactive widget
                    andiData = new AndiData(this);
                }
                gANDI.images.list.push(new Image(this, gANDI.index));
                gANDI.index += 1;
                //Check for conditions based on semantics
                if ($(this).is("marquee")) {
                    gANDI.images.inlineCount += 1;
                    andiAlerter.throwAlert(alert_0171);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("blink")) {
                    gANDI.images.inlineCount += 1;
                    andiAlerter.throwAlert(alert_0172);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("canvas")) {
                    gANDI.images.inlineCount += 1;
                    andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("input:image")) {
                    gANDI.images.inlineCount += 1;
                    andiCheck.commonFocusableElementChecks(andiData, $(this));
                    altTextAnalysis($.trim($(this).attr("alt")));
                    AndiData.attachDataToElement(this);
                    //Check for server side image map
                } else if ($(this).is("img") && $(this).attr("ismap")) {//Code is written this way to prevent bug in IE8
                    gANDI.images.inlineCount += 1;
                    andiAlerter.throwAlert(alert_0173);
                    AndiData.attachDataToElement(this);
                } else if (!isImageContainedByInteractiveWidget && $(this).is("img,svg,[role=img]")) { //an image used by an image map is handled by the <area>
                    gANDI.images.inlineCount += 1;
                    if (isElementDecorative(this, andiData)) {
                        gANDI.images.decorativeCount += 1;
                        $(this).addClass("gANDI508-decorative");

                        if ($(this).prop("tabIndex") >= 0) { //Decorative image is in the tab order
                            andiAlerter.throwAlert(alert_0126);
                        }
                    } else { //This image has not been declared decorative
                        if (andiData.tabbable) {
                            andiCheck.commonFocusableElementChecks(andiData, $(this));
                        } else {
                            andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                        }
                        altTextAnalysis($.trim($(this).attr("alt")));
                    }
                    AndiData.attachDataToElement(this);
                } else if ($(this).is("area")) {
                    gANDI.images.inlineCount += 1;
                    var map = $(this).closest("map");
                    if ($(map).length) { //<area> is contained in <map>
                        var mapName = "#" + $(map).attr("name");
                        if ($("#ANDI508-testPage img[usemap='" + mapName + "']").length) {
                            //<map> references existing <img>
                            andiCheck.commonFocusableElementChecks(andiData, $(this));
                            altTextAnalysis($.trim($(this).attr("alt")));
                            AndiData.attachDataToElement(this);
                        } else { //Image referenced by image map not found
                            //TODO: throw this message only once for all area tags that it relates to
                            andiAlerter.throwAlert(alert_006A, ["&ltmap name=" + mapName + "&gt;"], 0);
                        }
                    } else { //Area tag not contained in map
                        andiAlerter.throwAlert(alert_0178, alert_0178.message, 0);
                    }
                } else if ($(this).is("[role=image]")) {
                    //gANDI.images.inlineCount += 1;
                    andiAlerter.throwAlert(alert_0183);
                    AndiData.attachDataToElement(this);
                }
            } else if ($(this).css("background-image").includes("url(")) {
                gANDI.images.list.push(new Image(this, gANDI.index));
                gANDI.index += 1;
                gANDI.images.backgroundCount += 1;
                $(this).addClass("gANDI508-background");
            }

            //Check for common font icon classes
            if (!$(this).is("[role=img],img") &&
                ($(this).hasClass("fa fab fas fal fad") || //font awesome
                    $(this).hasClass("glyphicon") || //glyphicon
                    $(this).hasClass("material-icons") || //google material icons
                    $(this).is("[data-icon]") ||//common usage of the data-* attribute for icons
                    lookForPrivateUseUnicode(this))) {
                if (!$(this).hasClass("ANDI508-element")) {
                    andiData = new AndiData(this);
                    AndiData.attachDataToElement(this);
                }
                gANDI.images.list.push(new Image(this, gANDI.index));
                gANDI.index += 1;
                gANDI.images.fontIconCount += 1;
                $(this).addClass("gANDI508-fontIcon");
                //Throw alert
                if (andiData.accName && !andiData.isTabbable) {
                    //has accessible name. Needs role=img if meaningful image.
                    andiAlerter.throwAlert(alert_0179);
                } else { //no accessible name. Is it meaningful?
                    //andiAlerter.throwAlert(alert_017A);
                }
            }
        });
        if (gANDI.images.backgroundCount > 0) { //Page has background images
            andiAlerter.throwAlert(alert_0177, alert_0177.message, 0);
        }

        //This returns true if the image is decorative.
        function isElementDecorative(element, elementData) {
            if ($(element).attr("aria-hidden") === "true") {
                return true;
                //TODO: this logic may need to change if screen readers support spec that says aria-label
                //		should override role=presentation, thus making it not decorative
            } else {
                if (elementData.role === "presentation" || elementData.role === "none") { //role is presentation or none
                    return true;
                } else if ($(element).is("img") && elementData.empty && elementData.empty.alt) { //<img> and empty alt
                    return true;
                }
            }
            return false;
        }

        //This function looks at the CSS content psuedo elements looking for unicode in the private use range which usually means font icon
        function lookForPrivateUseUnicode(element) {
            return (hasPrivateUseUnicode("before") || hasPrivateUseUnicode("after"));

            function hasPrivateUseUnicode(psuedo) {
                var content = (oldIE) ? "" : window.getComputedStyle(element, ":" + psuedo).content;
                if (content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"") {//content is not none or empty string
                    var unicode;
                    //starts at 1 and end at length-1 to ignore the starting and ending double quotes
                    for (var i = 1; i < content.length - 1; i++) {
                        unicode = content.charCodeAt(i);
                        if (unicode >= 57344 && unicode <= 63743) {
                            //unicode is in the private use range
                            return true;
                        }
                    }
                }
                return false;
            }
        }
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    gANDI.results = function () {

        var imagesCount = gANDI.images.inlineCount + gANDI.images.backgroundCount + gANDI.images.fontIconCount;

        andiBar.updateResultsSummary("Images Found: " + imagesCount);

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewImagesList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view images list</button>");

        //Images List Button
        $("#ANDI508-viewImagesList-button").click(function () {
            if (!gANDI.viewList_tableReady) {
                gANDI.viewList_buildTable("images");
                gANDI.viewList_attachEvents();
                // NOTE: Uncomment if there is some events that you want to add that are specific to this page
                //gANDI.viewList_attachEvents_images();
                gANDI.viewList_tableReady = true;
            }
            gANDI.viewList_toggle("images", this);
            andiResetter.resizeHeights();
            return false;
        });

        //Create Image contained by html (number of image links and image buttons)
        var resultsDetails = "";

        resultsDetails += gANDI.images.inlineCount + " inline images, ";
        resultsDetails += gANDI.images.imageLinkCount + " image links, ";
        resultsDetails += gANDI.images.imageButtonCount + " image buttons, ";
        resultsDetails += gANDI.images.fontIconCount + " font icons, ";
        resultsDetails += gANDI.images.backgroundCount + " background-images.";

        $("#ANDI508-additionalPageResults").append("<p tabindex='0'>" + resultsDetails + "</p>");

        //Add Module Mode Buttons
        var moduleActionButtons = "";

        moduleActionButtons += "<button id='ANDI508-fadeInlineImages-button' aria-label='Hide " + gANDI.images.inlineCount + " Inline Images' aria-pressed='false'>hide " + gANDI.images.inlineCount + " inline</button>";
        moduleActionButtons += "<button id='ANDI508-highlightDecorativeImages-button' aria-label='Highlight " + gANDI.images.decorativeCount + " Decorative Inline Images' aria-pressed='false'>" + gANDI.images.decorativeCount + " decorative inline" + findIcon + "</button>";
        moduleActionButtons += "<button id='ANDI508-removeBackgroundImages-button' aria-label='Hide " + gANDI.images.backgroundCount + " Background Images' aria-pressed='false'>hide " + gANDI.images.backgroundCount + " background</button>";
        moduleActionButtons += "<button id='ANDI508-highlightBackgroundImages-button' aria-label='Highlight " + gANDI.images.backgroundCount + " Background Images' aria-pressed='false'>find " + gANDI.images.backgroundCount + " background" + findIcon + "</button>";
        moduleActionButtons += "<button id='ANDI508-highlightFontIcons-button' aria-label='Find " + gANDI.images.fontIconCount + " Font Icons' aria-pressed='false'>" + gANDI.images.fontIconCount + " font icons</button>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        //Define fadeInlineImages button
        $("#ANDI508-fadeInlineImages-button").click(function () {
            //This button will change the image's opacity to almost zero
            if ($(this).attr("aria-pressed") == "false") {
                $(this).attr("aria-pressed", "true").addClass("ANDI508-module-action-active");
                $("#ANDI508-testPage").addClass("gANDI508-fadeInline");
                AndiModule.activeActionButtons.fadeInlineImages = true;
            } else {
                $(this).attr("aria-pressed", "false").removeClass("ANDI508-module-action-active");
                $("#ANDI508-testPage").removeClass("gANDI508-fadeInline");
                AndiModule.activeActionButtons.fadeInlineImages = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define Remove removeBackgroundImages button
        $("#ANDI508-removeBackgroundImages-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                $(this).attr("aria-pressed", "true").addClass("ANDI508-module-action-active");
                $("#ANDI508-testPage").addClass("gANDI508-hideBackground");
                AndiModule.activeActionButtons.removeBackgroundImages = true;
            } else {
                $(this).attr("aria-pressed", "false").removeClass("ANDI508-module-action-active");
                $("#ANDI508-testPage").removeClass("gANDI508-hideBackground");
                AndiModule.activeActionButtons.removeBackgroundImages = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define highlightBackgroundImages button
        $("#ANDI508-highlightBackgroundImages-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("find", $(this));
                $("#ANDI508-testPage").addClass("gANDI508-highlightBackground");
                AndiModule.activeActionButtons.highlightBackgroundImages = true;
            } else {
                andiOverlay.overlayButton_off("find", $(this));
                $("#ANDI508-testPage").removeClass("gANDI508-highlightBackground");
                AndiModule.activeActionButtons.highlightBackgroundImages = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define highlightDecorativeImages button
        $("#ANDI508-highlightDecorativeImages-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("find", $(this));
                $("#ANDI508-testPage").addClass("gANDI508-highlightDecorative");
                AndiModule.activeActionButtons.highlightDecorativeImages = true;
            } else {
                andiOverlay.overlayButton_off("find", $(this));
                $("#ANDI508-testPage").removeClass("gANDI508-highlightDecorative");
                AndiModule.activeActionButtons.highlightDecorativeImages = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //Define highlightFontIcons button
        $("#ANDI508-highlightFontIcons-button").click(function () {
            if ($(this).attr("aria-pressed") == "false") {
                andiOverlay.overlayButton_on("find", $(this));
                $("#ANDI508-testPage").addClass("gANDI508-highlightFontIcon");
                AndiModule.activeActionButtons.highlightFontIcons = true;
            } else {
                andiOverlay.overlayButton_off("find", $(this));
                $("#ANDI508-testPage").removeClass("gANDI508-highlightFontIcon");
                AndiModule.activeActionButtons.highlightFontIcons = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        var startupSummaryText = "";
        andiBar.showElementControls();
        if (!andiBar.focusIsOnInspectableElement()) {
            startupSummaryText += "Discover accessibility markup for inline <span class='ANDI508-module-name-g'>graphics/images</span> by hovering over the highlighted elements or pressing the next/previous element buttons. ";
        }
        startupSummaryText += "Ensure that every meaningful/non-decorative image has a text equivalent.";
        andiBar.showStartUpSummary(startupSummaryText, true);

        AndiModule.engageActiveActionButtons([
            "fadeInlineImages", "removeBackgroundImages", "highlightBackgroundImages",
            "highlightDecorativeImages", "highlightFontIcons"]);

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function builds the table for the view list
    gANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='gANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='gANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='gANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='gANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        for (var x = 0; x < gANDI.images.list.length; x++) {
            //determine if there is an alert
            rowClasses = "";
            var nextTabButton = "";
            // if (gANDI.images.list[x].alerts.includes("Alert"))
            //     rowClasses += "ANDI508-table-row-alert ";

            tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                "<th scope='row'>" + gANDI.images.list[x].index + "</th>" +
                "<td class='ANDI508-alert-column'></td>" +
                //"<td class='ANDI508-alert-column'>" + gANDI.images.list[x].alerts + "</td>" +
                "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + gANDI.images.list[x].index + "'>" + gANDI.images.list[x].element + "</a></td>"
            "</tr>";
        }

        // this.imageButtonCount = 0; //images contained in buttons

        tabsHTML = "<button id='gANDI508-listImages-tab-all' aria-label='View All Images' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all images (" + gANDI.images.list.length + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-inline' aria-label='View Inline Images' aria-selected='false' data-andi508-relatedclass='gANDI508-inline'>inline images (" + gANDI.images.inlineCount + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-background' aria-label='View Background Images' aria-selected='false' data-andi508-relatedclass='gANDI508-background'>background images (" + gANDI.images.backgroundCount + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-decorative' aria-label='View Decorative Images' aria-selected='false' data-andi508-relatedclass='gANDI508-decorative'>decorative images (" + gANDI.images.decorativeCount + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-fontIcon' aria-label='View Font Icon Images' aria-selected='false' data-andi508-relatedclass='gANDI508-fontIcon'>font icon images (" + gANDI.images.fontIconCount + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-imageLink' aria-label='View Image Links' aria-selected='false' data-andi508-relatedclass='gANDI508-imageLink'>image links (" + gANDI.images.imageLinkCount + ")</button>";
        tabsHTML += "<button id='gANDI508-listImages-tab-imageButton' aria-label='View Image Buttons' aria-selected='false' data-andi508-relatedclass='gANDI508-imageButton'>imageButton (" + gANDI.images.imageButtonCount + ")</button>";


        appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>";

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    gANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") { //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#gANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "images") {
                AndiModule.activeActionButtons.viewLinksList = true;
            }
        } else { //hide List, show alert list
            $("#gANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
            //$("#ANDI508-resultsSummary").show();

            $("#ANDI508-alerts-list").show();
            $(btn)
                .removeClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "view " + mode + " list")
                .attr("aria-expanded", "false");
            if (mode === "images") {
                AndiModule.activeActionButtons.viewLinksList = false;
            } else {
                AndiModule.activeActionButtons.viewButtonsList = false;
            }
        }
    };

    //This function attaches the click,hover,focus events to the items in the view list
    gANDI.viewList_attachEvents = function () {
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

        //Define listImages next button
        $("#gANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#gANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            gANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listImages prev button
        $("#gANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#gANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            gANDI.viewList_rowHighlight(focusGoesOnThisIndex);
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

            //format background-image
            var bgImgUrl = $(element).css("background-image");
            if (bgImgUrl.slice(0, 4) === "url(") {
                bgImgUrl = bgImgUrl.slice(5, -2); //remove 'url("' and '")'
            } else {
                bgImgUrl = "";
            }
            var elementData = $(element).data("andi508");
            var addOnProps = AndiData.getAddOnProps(element, elementData,
                ["longdesc", "ismap", "usemap", ["background-image", bgImgUrl]]);

            andiBar.displayOutput(elementData, element, addOnProps);
            andiBar.displayTable(elementData, element, addOnProps);
        }
    };

    //This function will analyze the alt text
    function altTextAnalysis(altText) {
        var regEx_redundantPhrase = /(image of|photo of|picture of|graphic of|photograph of)/g;
        var regEx_fileTypeExt = /\.(png|jpg|jpeg|gif|pdf|doc|docx|svg)$/g;
        var regEx_nonDescAlt = /^(photo|photograph|picture|graphic|logo|icon|graph|image)$/g;

        if (altText !== "") {
            altText = altText.toLowerCase();
            //check for redundant phrase in alt text
            if (regEx_redundantPhrase.test(altText)) {
                //redundant phrase in alt text
                andiAlerter.throwAlert(alert_0174);
                //Check for filename in alt text
            } else if (regEx_fileTypeExt.test(altText)) {
                //file name in alt text
                andiAlerter.throwAlert(alert_0175);
                //Check for non-descriptive alt text
            } else if (regEx_nonDescAlt.test(altText)) {
                //non-descriptive alt text
                andiAlerter.throwAlert(alert_0176);
            }
        }
    }

    gANDI.analyze();
    gANDI.results();

}//end init
