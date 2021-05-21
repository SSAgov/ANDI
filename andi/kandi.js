//==========================================//
//kANDI: landmarks ANDI                     //
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var kANDIVersionNumber = "4.1.3";

    //create kANDI instance
    var kANDI = new AndiModule(kANDIVersionNumber, "k");
    kANDI.index = 1;

    //This object class is used to store data about each landmark. Object instances will be placed into an array.
    function Landmark(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the landmarks on the page
    function Landmarks() {
        this.list = [];
        this.count = 0;
    }

    var langAttributesCount = 0;
    var roleAttributesCount = 0;

    AndiModule.initActiveActionButtons({
        readingOrder: false,
        roleAttributes: false,
        langAttributes: false
    });

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    kANDI.analyze = function () {
        kANDI.landmarks = new Landmarks();

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=banner],[role=complementary],[role=contentinfo],[role=form],[role=main],[role=navigation],[role=search],[role=region]", "main,header,footer,nav,form,aside")) {
                kANDI.landmarks.list.push(new Landmark(this, kANDI.index));
                kANDI.landmarks.count += 1;
                kANDI.index += 1;
                andiData = new AndiData(this);

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
    kANDI.outline = "<h3 tabindex='-1' id='kANDI508-outline-heading'>Landmarks List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    kANDI.getOutlineItem = function (element) {
        var displayCharLength = 60; //for truncating innerText
        var tagName = $(element).prop("tagName").toLowerCase();
        var role = $(element).attr("role");
        var ariaLevel = $(element).attr("aria-level");

        var outlineItem = "<a href='#' data-andi508-relatedindex='" + $(element).attr('data-andi508-index') + "'>&lt;" + tagName;

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
    kANDI.getOutlineItemModule = function (elementToUse) {
        var outlineItem = '"' + elementToUse.index + '" ';

        outlineItem += "<span class='ANDI508-display-innerText'>";
        outlineItem += elementToUse;

        outlineItem += "</span>";
        outlineItem += "</a>";
        outlineItem += "<br />";
        return outlineItem;
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    kANDI.results = function () {
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
        $("#ANDI508-module-actions button.kANDI508-mode").attr("aria-selected", "false");

        $("#ANDI508-landmarks-button")
            .attr("aria-selected", "true")
            .addClass("ANDI508-module-action-active");

        //Build Outline
        for (var x = 0; x < kANDI.landmarks.list.length; x++) {
            kANDI.outline += kANDI.getOutlineItemModule(kANDI.landmarks.list[x]);
        }
        kANDI.outline += "</div>";

        $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view landmarks list</button><div id='kANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

        //Define outline button
        $("#ANDI508-viewOutline-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") {
                //hide Outline, show alert list
                $("#kANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                $("#ANDI508-alerts-list").show();

                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "hide landmarks list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else { //show Outline, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide landmarks list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#kANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });
        startupSummaryText += "Landmark structure found.<br />Ensure that each <span class='ANDI508-module-name-s'>landmark</span> is applied appropriately to the corresponding section of the page.";
        andiBar.updateResultsSummary("Landmarks: " + kANDI.landmarks.list.length);
        if (!andiBar.focusIsOnInspectableElement()) {
            andiBar.showElementControls();
            andiBar.showStartUpSummary(startupSummaryText, true);
        }

        $("#kANDI508-outline-container")
            .html(kANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
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

        $("#kANDI508-outline-container")
            .html(kANDI.outline)
            .find("a[data-andi508-relatedindex]").each(function () {
                andiFocuser.addFocusClick($(this));
                var relatedIndex = $(this).attr("data-andi508-relatedindex");
                var relatedElement = $("#ANDI508-testPage [data-andi508-index=" + relatedIndex + "]").first();
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

        andiAlerter.updateAlertList();

        AndiModule.engageActiveActionButtons([
            "readingOrder",
            "roleAttributes",
            "langAttributes"
        ]);

        $("#ANDI508").focus();

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

    kANDI.analyze();
    kANDI.results();

}//end init