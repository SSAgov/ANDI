//==========================================//
//sANDI: structures ANDI 					//
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var sANDIVersionNumber = "4.1.3";

    //create sANDI instance
    var sANDI = new AndiModule(sANDIVersionNumber, "s");
    sANDI.index = 1;

    //This object class is used to store data about each header. Object instances will be placed into an array.
    function Header(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the headers on the page
    function Headers() {
        this.list = [];
        this.count = 0;
    }

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

    //This object class is used to store data about each live region. Object instances will be placed into an array.
    function LiveRegion(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the live regions on the page
    function LiveRegions() {
        this.list = [];
        this.count = 0;
    }

    var langAttributesCount = 0;
    var roleAttributesCount = 0;

    AndiModule.initActiveActionButtons({
        headings: true, //default
        lists: false,
        landmarks: false,
        liveRegions: false,
        readingOrder: false,
        roleAttributes: false,
        langAttributes: false
    });

    //This function will analyze the test page for graphics/image related markup relating to accessibility
    sANDI.analyze = function () {
        sANDI.headers = new Headers();
        sANDI.lists = new Lists();
        sANDI.landmarks = new Landmarks();
        sANDI.liveRegions = new LiveRegions();

        //Loop through every visible element
        $(TestPageData.allElements).each(function () {
            if ($(this).isSemantically("[role=heading]", "h1,h2,h3,h4,h5,h6")) {
                //Add to the headings array
                sANDI.headers.list.push($(this));
                sANDI.headers.count += 1;

                if (AndiModule.activeActionButtons.headings) {
                    andiData = new AndiData(this);

                    if (andiData.role === "heading") {
                        var ariaLevel = $(this).attr("aria-level");
                        if (ariaLevel) {
                            if ($(this).is("h1,h2,h3,h4,h5,h6")) {
                                if (andiData.tagNameText.charAt(1) !== ariaLevel) {
                                    //heading tag name level doesn't match aria-level
                                    andiAlerter.throwAlert(alert_0191, [andiData.tagNameText, ariaLevel]);
                                }
                            }
                            if (parseInt(ariaLevel) < 0 || parseInt(ariaLevel) != ariaLevel) { //Not a positive integer
                                andiAlerter.throwAlert(alert_0180);
                            }
                        } else { //role=heading without aria-level
                            andiAlerter.throwAlert(alert_0192);
                        }
                    }

                    andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                    AndiData.attachDataToElement(this);
                }
            } else if ($(this).isSemantically("[role=listitem],[role=list]", "ol,ul,li,dl,dd,dt")) {
                //Add to the headings array
                sANDI.lists.list.push(new List(this, sANDI.index));
                sANDI.lists.count += 1;
                sANDI.index += 1;

                if ($(this).isSemantically("[role=list]", "ol,ul,dl")) {
                    if ($(this).is("ul")) {
                        sANDI.lists.ulCount += 1;
                    } else if ($(this).is("ol")) {
                        sANDI.lists.olCount += 1;
                    } else if ($(this).is("dl")) {
                        sANDI.lists.dlCount += 1;
                    } else {
                        sANDI.lists.listRoleCount += 1;
                    }
                    sANDI.lists.count += 1;
                }

                if (AndiModule.activeActionButtons.lists) {
                    andiData = new AndiData(this);

                    //Is the listitem contained by an appropriate list container?
                    if ($(this).is("[role=listitem]")) {
                        sANDI.lists.listItemRoleCount += 1;
                        if (!$(this).closest("[role=list]").length) {
                            andiAlerter.throwAlert(alert_0079, ["[role=listitem]", "[role=list]"]);
                        }
                    } else if ($(this).is("li")) {
                        sANDI.lists.liCount += 1;
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
                            sANDI.lists.ddCount += 1;
                        } else if ($(this).is("dt")) {
                            sANDI.lists.dtCount += 1;
                        }
                        andiAlerter.throwAlert(alert_007A);
                    }

                    andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                    AndiData.attachDataToElement(this);
                }
            } else if ($(this).isSemantically("[role=banner],[role=complementary],[role=contentinfo],[role=form],[role=main],[role=navigation],[role=search],[role=region]", "main,header,footer,nav,form,aside")) {
                if (AndiModule.activeActionButtons.landmarks) {
                    sANDI.landmarks.list.push(new Landmark(this, sANDI.index));
                    sANDI.landmarks.count += 1;
                    sANDI.index += 1;
                    andiData = new AndiData(this);

                    andiCheck.commonNonFocusableElementChecks(andiData, $(this));
                    AndiData.attachDataToElement(this);
                }
            } else if (AndiModule.activeActionButtons.headings && sANDI.headers.list.length === 0 && $(this).is("p,div,span,strong,em")) {
                //Since sANDI has not found a heading yet, check if this element is a fake headings

                if (sANDI.isFakeHeading(this)) {
                    andiData = new AndiData(this);

                    andiAlerter.throwAlert(alert_0190);
                    AndiData.attachDataToElement(this);
                }
            }

            if ($(this).is("[role=alert],[role=status],[role=log],[role=marquee],[role=timer],[aria-live=polite],[aria-live=assertive]")) {

                if (AndiModule.activeActionButtons.liveRegions) {
                    andiData = new AndiData(this);

                    if ($(this).isContainerElement()) {
                        var innerText = andiUtility.getVisibleInnerText(this);
                        if (innerText) {
                            //For live regions, screen readers only use the innerText
                            //override the accName to just the innerText
                            andiData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
                        } else { //no visible innerText
                            andiAlerter.throwAlert(alert_0133);
                            andiData.accName = "";
                        }
                        //accDesc should not appear in output
                        delete andiData.accDesc;
                    } else { //not a container element
                        andiAlerter.throwAlert(alert_0184);
                    }
                    if ($(this).find("textarea,input:not(:hidden,[type=submit],[type=button],[type=image],[type=reset]),select").length) {
                        andiAlerter.throwAlert(alert_0182);
                    }
                    sANDI.liveRegions.list.push(new LiveRegion(this, sANDI.index));
                    sANDI.liveRegions.count += 1;
                    sANDI.index += 1;
                    AndiData.attachDataToElement(this);
                }
            }

            //For all elements on the page
            if ($.trim($(this).attr("role")))
                roleAttributesCount += 1;
            if ($.trim($(this).prop("lang")))
                langAttributesCount += 1;
        });
    };

    //This function determine's if the element looks like a heading but is not semantically a heading
    sANDI.isFakeHeading = function (element) {

        var isFakeHeading = false;

        var limit_textLength = 30; //text longer than this will not be considered a fake heading

        var limit_fontSize = 22; //px  (an h2 starts around 24px)
        var limit_boldFontSize = 15; //px

        var text = $.trim($(element).text());
        if (text.length > 0 && text.length < limit_textLength) {
            //text is not empty, but less than char limit

            var fakeHeading_fontSize = parseInt($(element).css("font-size"));
            var fakeHeading_fontWeight = $(element).css("font-weight");

            if (fakeHeading_fontSize > limit_fontSize ||
                (isBold(fakeHeading_fontWeight) && fakeHeading_fontSize > limit_boldFontSize)
            ) { //fakeHeading_fontSize is greater than size limit

                var nextElement = $(element).next().filter(":visible");

                if ($.trim($(nextElement).text()) !== "") { //next element has text

                    var nextElement_fontWeight = $(nextElement).css("font-weight");
                    var nextElement_fontSize = parseInt($(nextElement).css("font-size"));

                    if (nextElement_fontSize < fakeHeading_fontSize) {
                        //next element's font-size is smaller than fakeHeading font-size
                        isFakeHeading = true;
                    } else if (isBold(fakeHeading_fontWeight) && !isBold(nextElement_fontWeight)) {
                        //next element's font-weight is lighter than fakeHeading font-weight
                        isFakeHeading = true;
                    }
                }
            }
        }
        return isFakeHeading;

        function isBold(weight) {
            return (weight === "bold" || weight === "bolder" || weight >= 700);
        }
    };

    //Initialize outline
    sANDI.headerOutline = "<h3 tabindex='-1' id='sANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";
    sANDI.outline = "<h3 tabindex='-1' id='sANDI508-outline-heading'>Headings List (ordered by occurance):</h3><div class='ANDI508-scrollable'>";

    //This function will display the heading list (headings outline)
    //It should only be called on heading elements
    sANDI.getOutlineItem = function (element) {
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
    sANDI.getOutlineItemModule = function (elementToUse) {
        var outlineItem = '"' + elementToUse.index + '" ';

        outlineItem += "<span class='ANDI508-display-innerText'>";
        outlineItem += elementToUse;

        outlineItem += "</span>";
        outlineItem += "</a>";
        outlineItem += "<br />";
        return outlineItem;
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    sANDI.results = function () {
        var startupSummaryText = "";
        var moduleActionButtons = "";
        moduleActionButtons += "<button id='ANDI508-headings-button' class='sANDI508-mode' aria-label='" + sANDI.headers.list.length + " Headings'>" + sANDI.headers.list.length + " headings</button>";
        moduleActionButtons += "<button id='ANDI508-lists-button' class='sANDI508-mode' aria-label='" + sANDI.lists.count + " Lists'>" + sANDI.lists.count + " lists</button>";
        moduleActionButtons += "<button id='ANDI508-landmarks-button' class='sANDI508-mode' aria-label='" + sANDI.landmarks.list.length + " Landmarks'>" + sANDI.landmarks.list.length + " landmarks</button>";
        moduleActionButtons += "<button id='ANDI508-liveRegions-button' class='sANDI508-mode' aria-label='" + sANDI.liveRegions.list.length + " Live Regions'>" + sANDI.liveRegions.list.length + " live regions</button>";
        moduleActionButtons += "<button id='ANDI508-readingOrder-button' aria-pressed='false'>reading order" + overlayIcon + "</button>";

        var moreDetails = "<button id='ANDI508-roleAttributes-button' aria-pressed='false' aria-label='" + roleAttributesCount + " Role Attributes'>" + roleAttributesCount + " role attributes" + overlayIcon + "</button>" +
            "<button id='ANDI508-langAttributes-button' aria-pressed='false' aria-label='" + langAttributesCount + " Lang Attributes'>" + langAttributesCount + " lang attributes" + overlayIcon + "</button>";

        moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>more details</button><div class='ANDI508-moduleActionGroup-options'>" + moreDetails + "</div></div>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        andiBar.initializeModuleActionGroups();

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

        //Define sANDI mode buttons (headings, lists, landmarks)
        $("#ANDI508-headings-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.headings = true;
            AndiModule.activeActionButtons.lists = false;
            AndiModule.activeActionButtons.landmarks = false;
            AndiModule.activeActionButtons.liveRegions = false;
            AndiModule.launchModule("s");
        });
        $("#ANDI508-lists-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.headings = false;
            AndiModule.activeActionButtons.lists = true;
            AndiModule.activeActionButtons.landmarks = false;
            AndiModule.activeActionButtons.liveRegions = false;
            AndiModule.launchModule("s");
        });
        $("#ANDI508-landmarks-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.headings = false;
            AndiModule.activeActionButtons.lists = false;
            AndiModule.activeActionButtons.landmarks = true;
            AndiModule.activeActionButtons.liveRegions = false;
            AndiModule.launchModule("s");
        });
        $("#ANDI508-liveRegions-button").click(function () {
            andiResetter.softReset($("#ANDI508-testPage"));
            AndiModule.activeActionButtons.headings = false;
            AndiModule.activeActionButtons.lists = false;
            AndiModule.activeActionButtons.landmarks = false;
            AndiModule.activeActionButtons.liveRegions = true;
            AndiModule.launchModule("s");
        });

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
        $("#ANDI508-module-actions button.sANDI508-mode").attr("aria-selected", "false");

        if (AndiModule.activeActionButtons.headings) { //HEADINGS
            $("#ANDI508-headings-button")
                .attr("aria-selected", "true")
                .addClass("ANDI508-module-action-active");

            andiBar.updateResultsSummary("Headings: " + sANDI.headers.list.length);

            //Build Outline
            for (var x = 0; x < sANDI.headers.list.length; x++) {
                sANDI.outline += sANDI.getOutlineItem(sANDI.headers.list[x]);
            }
            sANDI.outline += "</div>";

            $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view headings list</button><div id='sANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

            //Define outline button
            $("#ANDI508-viewOutline-button").click(function () {
                if ($(this).attr("aria-expanded") === "true") { //hide Outline, show alert list
                    $("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                    $("#ANDI508-alerts-list").show();

                    $(this)
                        .addClass("ANDI508-viewOtherResults-button-expanded")
                        .html(listIcon + "view headings list")
                        .attr("aria-expanded", "false")
                        .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
                } else { //show Outline, hide alert list
                    $("#ANDI508-alerts-list").hide();

                    andiSettings.minimode(false);
                    $(this)
                        .html(listIcon + "hide headings list")
                        .attr("aria-expanded", "true")
                        .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                        .find("img").attr("src", icons_url + "list-on.png");
                    $("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
                }
                andiResetter.resizeHeights();
                return false;
            });

            
            startupSummaryText += "Heading structure found.<br />Determine if <span class='ANDI508-module-name-s'>headings</span> are appropriately applied.";

            if (!andiBar.focusIsOnInspectableElement()) {
                andiBar.showElementControls();
                andiBar.showStartUpSummary(startupSummaryText, true);
            }
        } else if (AndiModule.activeActionButtons.lists) { //LISTS
            $("#ANDI508-lists-button")
                .attr("aria-selected", "true")
                .addClass("ANDI508-module-action-active");

            //Build Outline
            for (var x = 0; x < sANDI.lists.list.length; x++) {
                sANDI.outline += sANDI.getOutlineItemModule(sANDI.lists.list[x]);
            }
            sANDI.outline += "</div>";

            andiBar.updateResultsSummary("List Elements: " + sANDI.lists.list.length);
            var listCounts = "";
            var delimiter = ", ";
            var listTypesUsed = "";

            listCounts += sANDI.lists.olCount + " ordered list (ol)";
            listTypesUsed += "ol";

            listCounts += delimiter + sANDI.lists.ulCount + " unordered list (ul)";
            listTypesUsed += delimiter + "ul";

            listCounts += delimiter + sANDI.lists.liCount + " list item (li)";
            listTypesUsed += delimiter + "li";

            listCounts += delimiter + sANDI.lists.dlCount + " description list (dl)";
            listTypesUsed += delimiter + "dl";

            listCounts += delimiter + sANDI.lists.ddCount + " description details (dd)";
            listTypesUsed += delimiter + "dd";

            listCounts += delimiter + sANDI.lists.dtCount + " description term (dt)";
            listTypesUsed += delimiter + "dt";

            listCounts += delimiter + sANDI.lists.listRoleCount + " role=list";
            listTypesUsed += delimiter + "[role=list]";

            listCounts += delimiter + sANDI.lists.listItemRoleCount + " role=listitem";
            listTypesUsed += delimiter + "[role=listitem]";

            $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view list of lists</button><div id='sANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

            //Define outline button
            $("#ANDI508-viewOutline-button").click(function () {
                if ($(this).attr("aria-expanded") === "true") {
                    //hide Outline, show alert list
                    $("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
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
                    $("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
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
        } else if (AndiModule.activeActionButtons.landmarks) { //LANDMARKS
            $("#ANDI508-landmarks-button")
                .attr("aria-selected", "true")
                .addClass("ANDI508-module-action-active");

            //Build Outline
            for (var x = 0; x < sANDI.landmarks.list.length; x++) {
                sANDI.outline += sANDI.getOutlineItemModule(sANDI.landmarks.list[x]);
            }
            sANDI.outline += "</div>";

            $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view landmarks list</button><div id='sANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

            //Define outline button
            $("#ANDI508-viewOutline-button").click(function () {
                if ($(this).attr("aria-expanded") === "true") {
                    //hide Outline, show alert list
                    $("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
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
                    $("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
                }
                andiResetter.resizeHeights();
                return false;
            });

            startupSummaryText += "Landmark structure found.<br />Ensure that each <span class='ANDI508-module-name-s'>landmark</span> is applied appropriately to the corresponding section of the page.";
            andiBar.updateResultsSummary("Landmarks: " + sANDI.landmarks.list.length);
            if (!andiBar.focusIsOnInspectableElement()) {
                andiBar.showElementControls();
                andiBar.showStartUpSummary(startupSummaryText, true);
            }
        } else if (AndiModule.activeActionButtons.liveRegions) { //LIVE REGIONS
            $("#ANDI508-liveRegions-button")
                .attr("aria-selected", "true")
                .addClass("ANDI508-module-action-active");

            //Build Outline
            for (var x = 0; x < sANDI.liveRegions.list.length; x++) {
                sANDI.outline += sANDI.getOutlineItemModule(sANDI.liveRegions.list[x]);
            }
            sANDI.outline += "</div>";

            $("#ANDI508-additionalPageResults").html("<button id='ANDI508-viewOutline-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view live regions list</button><div id='sANDI508-outline-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'></div>");

            //Define outline button
            $("#ANDI508-viewOutline-button").click(function () {
                if ($(this).attr("aria-expanded") === "true") {
                    //hide Outline, show alert list
                    $("#sANDI508-outline-container").slideUp(AndiSettings.andiAnimationSpeed);
                    $("#ANDI508-alerts-list").show();

                    $(this)
                        .addClass("ANDI508-viewOtherResults-button-expanded")
                        .html(listIcon + "hide live regions list")
                        .attr("aria-expanded", "false")
                        .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
                } else { //show Outline, hide alert list
                    $("#ANDI508-alerts-list").hide();

                    andiSettings.minimode(false);
                    $(this)
                        .html(listIcon + "hide live regions list")
                        .attr("aria-expanded", "true")
                        .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                        .find("img").attr("src", icons_url + "list-on.png");
                    $("#sANDI508-outline-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
                }
                andiResetter.resizeHeights();
                return false;
            });

            startupSummaryText += "<span class='ANDI508-module-name-s'>Live regions</span> found.<br />Discover the Output of the <span class='ANDI508-module-name-s'>live regions</span> by hovering over the highlighted areas or using the next/previous buttons. For updated Output, refresh ANDI whenever the Live Region changes.";
            andiBar.updateResultsSummary("Live Regions: " + sANDI.liveRegions.list.length);
            if (!andiBar.focusIsOnInspectableElement()) {
                andiBar.showElementControls();
                andiBar.showStartUpSummary(startupSummaryText, true);
            }
        }

        $("#sANDI508-outline-container")
            .html(sANDI.outline)
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

        $("#sANDI508-outline-container")
            .html(sANDI.outline)
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

            if (AndiModule.activeActionButtons.liveRegions) { //For Live Region mode, update the output live
                //Copy from the AC table
                var innerText = $("#ANDI508-accessibleComponentsTable td.ANDI508-display-innerText").first().html();
                if (innerText) {
                    elementData.accName = "<span class='ANDI508-display-innerText'>" + innerText + "</span>";
                }
            }

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

    sANDI.analyze();
    sANDI.results();

}//end init