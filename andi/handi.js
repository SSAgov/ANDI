//==========================================//
//hANDI: hidden content ANDI 				//
//Created By Social Security Administration //
//==========================================//
function init_module() {

    var handiVersionNumber = "4.0.2";

    //TODO: report whether an element should be visible or invisible to a screen reader

    //create hANDI instance
    var hANDI = new AndiModule(handiVersionNumber, "h");

    //This object class is used to store data about each hidden content element. Object instances will be placed into an array.
    function HiddenContent(element, index) {
        this.element = element;
        this.index = index;
    }

    //This object class is used to keep track of the hidden content elements on the page
    function HiddenContents() {
        this.list = [];
        this.count = 0;
        this.hiddenDisplay = 0;
        this.hiddenVisibility = 0;
        this.hiddenPosition = 0;
        this.hiddenOpacity = 0;
        this.hiddenOverflow = 0;
        this.hiddenFontSize = 0;
        this.hiddenTextIndent = 0;
        this.hiddenHTML5 = 0;
        this.elementsWithCSS = 0;
    }

    hANDI.viewList_tableReady = false;
    hANDI.index = 1;

    //This function updates the Active Element Inspector when mouseover/hover is on a given to a highlighted element.
    //Holding the shift key will prevent inspection from changing.
    AndiModule.hoverability = function (event) {
        if (!event.shiftKey && $(this).hasClass("ANDI508-forceReveal")) //check for holding shift key
            AndiModule.inspect(this);
    };

    //This function removes markup in the test page that was added by this module
    AndiModule.cleanup = function (testPage, element) {
        if (element) {
            $(element).removeAttr("data-handi508-hidingtechniques").removeClass("ANDI508-forceReveal ANDI508-forceReveal-display ANDI508-forceReveal-visibility ANDI508-forceReveal-position ANDI508-forceReveal-opacity ANDI508-forceReveal-overflow ANDI508-forceReveal-fontSize ANDI508-forceReveal-textIndent");
            if ($(element).hasClass("ANDI508-forceReveal-html5Hidden")) {
                $(element).attr("hidden", "hidden").removeClass("ANDI508-forceReveal-html5Hidden"); //add the hidden attribute back
            }
        } else {
            $(testPage).find(".hANDI508-hasHiddenCssContent").removeClass("hANDI508-hasHiddenCssContent");
        }
    };

    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);
        var hidingTechniques = $(element).attr("data-handi508-hidingtechniques");
        $("#ANDI508-additionalElementDetails").html("");
        if (hidingTechniques) {
            $("#ANDI508-additionalElementDetails").append(hidingTechniques);
        }
    };

    var prevNextBtnsVisible = false;

    AndiModule.initActiveActionButtons({
        forceReveal_display: false,
        forceReveal_visibility: false,
        forceReveal_position: false,
        forceReveal_opacity: false,
        forceReveal_overflow: false,
        forceReveal_fontSize: false,
        forceReveal_textIndent: false,
        forceReveal_html5Hidden: false,
        highlightCssContent: false,
        titleAttributes: false
    });

    if (!prevNextBtnsVisible) {
        andiBar.hideElementControls();
    }

    //This function returns true if the element contains elements that might need accessibility testing, false if not.
    hANDI.containsTestableContent = function (element) {
        var needsTesting = true;
        var isContainerElement = $(element).isContainerElement();
        var elementsNeedingTesting = "img,input,select,textarea,button,a,[tabindex],iframe,table";

        //Does this element contain content that needs testing
        if (isContainerElement &&
            ($.trim($(element).html()) === "" ||
                ($.trim($(element).text()) === "" &&
                    $(element).find(elementsNeedingTesting).length === 0))) {
            needsTesting = false; //this element doesn't need testing
            //Is this element one that needs testing?
        } else if (!isContainerElement && $(element).is(elementsNeedingTesting)) {
            needsTesting = false; //this element doesn't need testing
        }

        return needsTesting;
    };

    //This function will analyze the test page for elements hidden using CSS
    hANDI.analyze = function () {
        var isHidingContent, elementCss;

        hANDI.hiddenContents = new HiddenContents();

        $(TestPageData.allElements).not("area,base,basefont,datalist,link,meta,noembed,noframes,param,rp,script,noscript,source,style,template,track,title").each(function () {
            isHidingContent = false;
            elementCss = "";
            
            if (hANDI.containsTestableContent(this)) {
                if ($(this).css("display") == "none") { //element display is none
                    hANDI.hiddenContents.count += 1;
                    isHidingContent = true;
                    hANDI.hiddenContents.hiddenDisplay += 1;
                    $(this).addClass("ANDI508-forceReveal-display");
                    elementCss += "display:none; ";
                }
                if ($(this).css("visibility") == "hidden") { //element visibility is hidden
                    hANDI.hiddenContents.count += 1;
                    isHidingContent = true;
                    hANDI.hiddenContents.hiddenVisibility += 1;
                    $(this).addClass("ANDI508-forceReveal-visibility");
                    elementCss += "visibility:hidden; ";
                }
                if ($(this).css("position") == "absolute" && ($(this).offset().left < 0 || $(this).offset().top < 0)) { //element is positioned offscreen
                    hANDI.hiddenContents.count += 1;
                    isHidingContent = true;
                    hANDI.hiddenContents.hiddenPosition += 1;
                    $(this).addClass("ANDI508-forceReveal-position");
                    elementCss += "position:absolute; ";
                }
                if ($(this).css("opacity") == "0") { //element opacity is zero
                    hANDI.hiddenContents.count += 1;
                    isHidingContent = true;
                    hANDI.hiddenContents.hiddenOpacity += 1;
                    $(this).addClass("ANDI508-forceReveal-opacity");
                    elementCss += "opacity:0; ";
                }

                if ($(this).isContainerElement() && $.trim($(this).text())) { //if element has innerText
                    if ($(this).css("overflow") == "hidden" &&
                        (parseInt($(this).css("height")) <= 1 || parseInt($(this).css("width")) <= 1)) {
                        //element has overflow hidden and a small height or width
                        hANDI.hiddenContents.count += 1;
                        isHidingContent = true;
                        hANDI.hiddenContents.hiddenOverflow += 1;
                        $(this).addClass("ANDI508-forceReveal-overflow");
                        elementCss += "overflow:hidden; ";
                    }
                    if (parseInt($(this).css("font-size")) === 0) { //element font-size is 0
                        hANDI.hiddenContents.count += 1;
                        isHidingContent = true;
                        hANDI.hiddenContents.hiddenFontSize += 1;
                        $(this).addClass("ANDI508-forceReveal-fontSize");
                        elementCss += "font-size:0; ";
                    }
                }
                if ($(this).css("text-indent") != "0" || $(this).css("text-indent") != "0px") {
                    if (parseInt($(this).css("text-indent")) < -998) { //element has a text-indent that makes it off screen
                        hANDI.hiddenContents.count += 1;
                        isHidingContent = true;
                        hANDI.hiddenContents.hiddenTextIndent += 1;
                        $(this).addClass("ANDI508-forceReveal-textIndent");
                        elementCss += "text-indent:" + $(this).css("text-indent") + "; ";
                    }
                }
                if ($(this).attr("hidden")) { //element has html5 hidden attribute
                    hANDI.hiddenContents.count += 1;
                    isHidingContent = true;
                    hANDI.hiddenContents.hiddenHTML5 += 1;
                    $(this).addClass("ANDI508-forceReveal-html5Hidden");
                    elementCss += "\/*html5 hidden*\/ ";
                }
            }

            if (isHidingContent) { //create data-handi508-hidingtechniques
                if (elementCss !== "") {
                    elementCss = "<h3 class='ANDI508-heading'>Hiding Technique:</h3> <span class='ANDI508-code'>" + $.trim(elementCss) + "</span>";
                    $(this).attr("data-handi508-hidingtechniques", elementCss);
                }

                hANDI.hiddenContents.list.push(new HiddenContent(this, hANDI.index));
                andiData = new AndiData(this, true);
                AndiData.attachDataToElement(this);
                hANDI.index += 1;
            }
        });

        if (!oldIE) {
            hANDI.detectCssInjectedContent();

            if ($("#ANDI508-testPage .hANDI508-hasHiddenCssContent").first().length) {
                andiAlerter.throwAlert(alert_0220, alert_0220.message, 0);
            }
        }
    };

    //This function will detect content hidden using css :before :after content.
    //Current screen readers will not read text injected using this method in some browsers.
    hANDI.detectCssInjectedContent = function () {
        var before_content, before_style, after_content, after_style, hasHiddenCSSContent, cssDisplay;

        //Loop through every element on the page
        for (var x = 0; x < TestPageData.allVisibleElements.length; x++) {
            hasHiddenCSSContent = false; //reset to false
            cssDisplay = "";

            before_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":before");
            if (before_style) {
                before_content = before_style.getPropertyValue("content");
                if (hasContent(before_content)) { //element has injected content using ::before
                    if (isVisible(before_style)) { //pseudoElement is visible
                        hasHiddenCSSContent = true;
                        cssDisplay += before_content + " ";
                    }
                }
            }

            after_style = window.getComputedStyle(TestPageData.allVisibleElements[x], ":after");
            if (after_style) {
                after_content = after_style.getPropertyValue("content");
                if (hasContent(after_content)) { //element has injected content using ::after
                    if (isVisible(after_style)) { //pseudoElement is visible
                        hasHiddenCSSContent = true;
                        cssDisplay += after_content;
                    }
                }
            }

            if (hasHiddenCSSContent) {
                hANDI.hiddenContents.elementsWithCSS += 1;
                $(TestPageData.allVisibleElements[x]).addClass("hANDI508-hasHiddenCssContent");
            }
        }

        //This function will return true if content exists
        function hasContent(content) {
            if (content !== "none" && content !== "normal" && content !== "counter" && content !== "\"\"" && content !== "\" \"") {//content is not empty
                return true;
            }
            return false;
        }

        //This function returns true if the style of an element is not hidden
        //TODO: Can this be replaced by getting the pseudo element and reusing :shown ?
        function isVisible(style) {
            if (style.getPropertyValue("visibility") === "hidden" ||
                style.getPropertyValue("display") === "none" ||
                (style.getPropertyValue("height") === "0" && style.getPropertyValue("width") === "0")
            ) {
                return false;
            }
            return true;
        }
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    var showStartUpSummaryText = "";
    hANDI.results = function () {
        andiBar.updateResultsSummary("Hidden Elements: " + hANDI.hiddenContents.count);

        //Add Module Mode Buttons
        var moduleActionButtons = "";
        var revealButtons = "";

        revealButtons += "<button id='ANDI508-forceReveal_display-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenDisplay + " display:none' aria-pressed='false'>" + hANDI.hiddenContents.hiddenDisplay + " display:none" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_visibility-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenVisibility + " visibility:hidden' aria-pressed='false'>" + hANDI.hiddenContents.hiddenVisibility + " visibility:hidden" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_position-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenPosition + " position:absolute' aria-pressed='false'>" + hANDI.hiddenContents.hiddenPosition + " position:absolute" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_overflow-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenOverflow + " overflow:hidden' aria-pressed='false'>" + hANDI.hiddenContents.hiddenOverflow + " overflow:hidden" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_fontSize-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenFontSize + " font-size:0' aria-pressed='false'>" + hANDI.hiddenContents.hiddenFontSize + " font-size:0" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_textIndent-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenTextIndent + " text-indent' aria-pressed='false'>" + hANDI.hiddenContents.hiddenTextIndent + " text-indent" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_html5Hidden-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenHTML5 + " html5 hidden' aria-pressed='false'>" + hANDI.hiddenContents.hiddenHTML5 + " html5 hidden" + findIcon + "</button>";
        revealButtons += "<button id='ANDI508-forceReveal_opacity-button' class='hANDI-revealButton' aria-label='" + hANDI.hiddenContents.hiddenOpacity + " opacity:0' aria-pressed='false'>" + hANDI.hiddenContents.hiddenOpacity + " opacity:0" + findIcon + "</button>";

        moduleActionButtons = "<button id='ANDI508-forceRevealAll-button' aria-label='Reveal All' aria-pressed='false'>reveal all" + findIcon + "</button><span class='ANDI508-module-actions-spacer'>|</span> ";
        moduleActionButtons += "<div class='ANDI508-moduleActionGroup'><button class='ANDI508-moduleActionGroup-toggler'>css hiding techniques</button><div class='ANDI508-moduleActionGroup-options'>" + revealButtons + "</div></div>";
        moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;";
        moduleActionButtons += "<button id='ANDI508-highlightCssContent-button' aria-label='content ::before ::after " + hANDI.hiddenContents.elementsWithCSS + " CSS Content' aria-pressed='false'>content ::before ::after " + hANDI.hiddenContents.elementsWithCSS + findIcon + "</button>";
        moduleActionButtons += "<span class='ANDI508-module-actions-spacer'>|</span>&nbsp;<button id='ANDI508-titleAttributes-button' aria-label='Title Attributes' aria-pressed='false'>title attributes" + overlayIcon + "</button>";

        $("#ANDI508-module-actions").html(moduleActionButtons);

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewLinksList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view hidden contents list</button>");

        //Hidden Contents List Button
        $("#ANDI508-viewLinksList-button").click(function () {
            if (!hANDI.viewList_tableReady) {
                hANDI.viewList_buildTable("hidden contents");
                hANDI.viewList_attachEvents();
                // NOTE: Uncomment if there is some events that you want to add that are specific to this page
                //hANDI.viewList_attachEvents_hiddenContent();
                hANDI.viewList_tableReady = true;
            }
            hANDI.viewList_toggle("hidden contents", this);
            andiResetter.resizeHeights();
            return false;
        });

        andiBar.initializeModuleActionGroups();

        //Define forceRevealAll button
        $("#ANDI508-forceRevealAll-button").click(function () {
            if ($(this).attr("aria-pressed") === "false") {
                andiOverlay.overlayButton_on("find", $(this));
                //turn on each reveal button
                $("#ANDI508-module-actions .hANDI-revealButton").each(function () {
                    if ($(this).attr("aria-pressed") == "false")
                        $(this).click();
                });
            } else {
                andiOverlay.overlayButton_off("find", $(this));
                //turn off each reveal button
                $("#ANDI508-module-actions .hANDI-revealButton").each(function () {
                    if ($(this).attr("aria-pressed") == "true")
                        $(this).click();
                });
            }
            andiResetter.resizeHeights();
            return false;
        });

        addHiddenContentButtonClickLogic("display");
        addHiddenContentButtonClickLogic("visibility");
        addHiddenContentButtonClickLogic("position");
        addHiddenContentButtonClickLogic("opacity");
        addHiddenContentButtonClickLogic("overflow");
        addHiddenContentButtonClickLogic("fontSize");
        addHiddenContentButtonClickLogic("textIndent");
        addHiddenContentButtonClickLogic("html5Hidden");

        function addHiddenContentButtonClickLogic(technique) {
            $("#ANDI508-forceReveal_" + technique + "-button").click(function () {
                if ($(this).attr("aria-pressed") === "false") {
                    andiOverlay.overlayButton_on("find", $(this));
                    $("#ANDI508-testPage .ANDI508-forceReveal-" + technique).each(function () {
                        $(this).addClass("ANDI508-forceReveal");
                        if (technique === "html5Hidden") { //remove hidden attribute for html5Hidden technique
                            $(this).removeAttr("hidden");
                        }
                    });
                    AndiModule.activeActionButtons["forceReveal_" + technique] = true;
                } else {
                    andiOverlay.overlayButton_off("find", $(this));
                    if (technique === "html5Hidden") { //add the hidden attribute back on
                        $("#ANDI508-testPage .ANDI508-forceReveal-html5Hidden").attr("hidden", "hidden");
                    }
                    AndiModule.activeActionButtons["forceReveal_" + technique] = false;
                    hANDI.unreveal();
                }
                hANDI.toggleRevealAllButton();
                andiResetter.resizeHeights();
                return false;
            });
        }

        //=============================================
        //Define highlightCssContent button
        $("#ANDI508-highlightCssContent-button").click(function () {
            if ($(this).attr("aria-pressed") === "false") {
                andiOverlay.overlayButton_on("find", $(this));
                $("#ANDI508-testPage").addClass("hANDI508-highlightCssContent");
                AndiModule.activeActionButtons.highlightCssContent = true;
            } else {
                $("#ANDI508-testPage").removeClass("hANDI508-highlightCssContent");
                andiOverlay.overlayButton_off("find", $(this));
                AndiModule.activeActionButtons.highlightCssContent = false;
            }
            andiResetter.resizeHeights();
            return false;
        });

        //=============================================
        //Define titleAttributes button functionality
        $("#ANDI508-titleAttributes-button").click(function () {
            if ($(this).attr("aria-pressed") === "false") {
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

        //=============================================
        showStartUpSummaryText += "Discover <span class='ANDI508-module-name-h'>hidden content</span> that should be tested for accessibility using other ANDI modules. " +
            "Use the style toggle buttons to force the hidden content to be revealed. " +
            "The revealed content will not remain revealed after changing modules. ";
        showStartUpSummaryText += "Content injected with CSS may be invisible to a screen reader.";

        andiBar.showStartUpSummary(showStartUpSummaryText, true);

        AndiModule.engageActiveActionButtons([
            "forceReveal_display",
            "forceReveal_visibility",
            "forceReveal_position",
            "forceReveal_opacity",
            "forceReveal_overflow",
            "forceReveal_fontSize",
            "forceReveal_textIndent",
            "forceReveal_html5Hidden",
            "highlightCssContent",
            "titleAttributes-button"
        ]);

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function builds the table for the view list
    hANDI.viewList_buildTable = function (mode) {
        var tableHTML = "";
        var rowClasses, tabsHTML, prevNextButtons;
        var appendHTML = "<div id='hANDI508-viewList' class='ANDI508-viewOtherResults-expanded' style='display:none;'><div id='hANDI508-viewList-tabs'>";
        var nextPrevHTML = "<button id='hANDI508-viewList-button-prev' aria-label='Previous Item in the list' accesskey='" + andiHotkeyList.key_prev.key + "'><img src='" + icons_url + "prev.png' alt='' /></button>" +
            "<button id='hANDI508-viewList-button-next' aria-label='Next Item in the list'  accesskey='" + andiHotkeyList.key_next.key + "'><img src='" + icons_url + "next.png' alt='' /></button>" +
            "</div>" +
            "<div class='ANDI508-scrollable'><table id='ANDI508-viewList-table' aria-label='" + mode + " List' tabindex='-1'><thead><tr>";

        for (var x = 0; x < hANDI.hiddenContents.list.length; x++) {
            //determine if there is an alert
            rowClasses = "";
            var nextTabButton = "";
            // if (hANDI.hiddenContents.list[x].alerts.includes("Alert"))
            //     rowClasses += "ANDI508-table-row-alert ";

            tableHTML += "<tr class='" + $.trim(rowClasses) + "'>" +
                "<th scope='row'>" + hANDI.hiddenContents.list[x].index + "</th>" +
                "<td class='ANDI508-alert-column'></td>" +
                //"<td class='ANDI508-alert-column'>" + hANDI.hiddenContents.list[x].alerts + "</td>" +
                "<td><a href='javascript:void(0)' data-andi508-relatedindex='" + hANDI.hiddenContents.list[x].index + "'>" + hANDI.hiddenContents.list[x].element + "</a></td>"
            "</tr>";
        }

        tabsHTML = "<button id='lANDI508-listLinks-tab-all' aria-label='View All Links' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-element'>all links (" + hANDI.hiddenContents.list.length + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-display' aria-label='View display' aria-selected='false' data-andi508-relatedclass='lANDI508-display'>display:none (" + hANDI.hiddenContents.hiddenDisplay + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-visibility' aria-label='View visibility:hidden' aria-selected='false' data-andi508-relatedclass='lANDI508-visibility'>visibility:hidden (" + hANDI.hiddenContents.hiddenVisibility + ")</button>";
        tabsHTML = "<button id='lANDI508-listLinks-tab-position' aria-label='View position:absolute' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-position'>position:absolute (" + hANDI.hiddenContents.hiddenPosition + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-opacity' aria-label='View opacity:0' aria-selected='false' data-andi508-relatedclass='lANDI508-opacity'>opacity:0 (" + hANDI.hiddenContents.hiddenOpacity + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-overflow' aria-label='View overflow:hidden' aria-selected='false' data-andi508-relatedclass='lANDI508-overflow'>overflow:hidden (" + hANDI.hiddenContents.hiddenOverflow + ")</button>";
        tabsHTML = "<button id='lANDI508-listLinks-tab-fontSize' aria-label='View font-size:0' aria-selected='true' class='ANDI508-tab-active' data-andi508-relatedclass='ANDI508-fontSize'>font-size:0 (" + hANDI.hiddenFontSize + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-textIndent' aria-label='View text-indent' aria-selected='false' data-andi508-relatedclass='lANDI508-textIndent'>text-indent (" + hANDI.hiddenContents.hiddenTextIndent + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-html5Hidden' aria-label='View html5 hidden' aria-selected='false' data-andi508-relatedclass='lANDI508-html5Hidden'>html5 hidden (" + hANDI.hiddenContents.hiddenHTML5 + ")</button>";
        tabsHTML += "<button id='lANDI508-listLinks-tab-css' aria-label='View css' aria-selected='false' data-andi508-relatedclass='lANDI508-css'>css (" + hANDI.hiddenContents.elementsWithCSS + ")</button>";

        appendHTML += tabsHTML + nextPrevHTML + "<th scope='col' style='width:5%'><a href='javascript:void(0)' aria-label='link number'>#<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:10%'><a href='javascript:void(0)'>Alerts&nbsp;<i aria-hidden='true'></i></a></th>" +
            "<th scope='col' style='width:40%'><a href='javascript:void(0)'>Accessible&nbsp;Name&nbsp;&amp;&nbsp;Description&nbsp;<i aria-hidden='true'></i></a></th>";

        $("#ANDI508-additionalPageResults").append(appendHTML + "</tr></thead><tbody>" + tableHTML + "</tbody></table></div></div>");

    };

    //This function hide/shows the view list
    hANDI.viewList_toggle = function (mode, btn) {
        if ($(btn).attr("aria-expanded") === "false") { //show List, hide alert list
            $("#ANDI508-alerts-list").hide();
            andiSettings.minimode(false);
            $(btn)
                .addClass("ANDI508-viewOtherResults-button-expanded")
                .html(listIcon + "hide " + mode + " list")
                .attr("aria-expanded", "true")
                .find("img").attr("src", icons_url + "list-on.png");
            $("#hANDI508-viewList").slideDown(AndiSettings.andiAnimationSpeed).focus();
            if (mode === "images") {
                AndiModule.activeActionButtons.viewLinksList = true;
            }
        } else { //hide List, show alert list
            $("#hANDI508-viewList").slideUp(AndiSettings.andiAnimationSpeed);
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
    hANDI.viewList_attachEvents = function () {
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
        $("#hANDI508-viewList-button-next").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#hANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            hANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });

        //Define listLinks prev button
        $("#hANDI508-viewList-button-prev").click(function () {
            //Get class name based on selected tab
            var selectedTabClass = $("#hANDI508-viewList-tabs button[aria-selected='true']").attr("data-andi508-relatedclass");
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
            hANDI.viewList_rowHighlight(focusGoesOnThisIndex);
            $("#ANDI508-viewList-table tbody tr.ANDI508-table-row-inspecting").first().each(function () {
                this.scrollIntoView();
            });

            return false;
        });
    };

    //This function will toggle the state of the reveal all button depending on the state of the other buttons
    hANDI.toggleRevealAllButton = function () {
        var revealAllOn = true;
        var prevNextBtnsVisible = false;

        //Loop through each reveal button
        $("#ANDI508-module-actions .hANDI-revealButton").each(function () {
            if ($(this).attr("aria-pressed") == "false") {
                revealAllOn = false;
            } else { //a reveal button is pressed
                prevNextBtnsVisible = true; //show the prev/next Buttons
            }
        });

        if (revealAllOn) { //Toggle Reveal All Button
            andiOverlay.overlayButton_on("find", $("#ANDI508-forceRevealAll-button"));
        } else {
            andiOverlay.overlayButton_off("find", $("#ANDI508-forceRevealAll-button"));
        }

        if (prevNextBtnsVisible) { //Toggle Next Prev Buttons
            //$("#ANDI508-elementDetails").show();
            $("#ANDI508-additionalElementDetails").show();
            andiBar.showElementControls();
        } else {
            $("#ANDI508-testPage .ANDI508-element-active").removeClass("ANDI508-element-active");
            $("#ANDI508-elementDetails").hide();
            $("#ANDI508-additionalElementDetails").hide();
            andiBar.hideElementControls();
            andiBar.showStartUpSummary(showStartUpSummaryText, true);
        }
    };

    //This function will remove highlights when the other buttons aren't pressed
    hANDI.unreveal = function () {
        var c = "ANDI508-forceReveal-";
        var okayToRemoveHighlight = true;
        $("#ANDI508-testPage .ANDI508-forceReveal").each(function () {
            okayToRemoveHighlight = true;
            if (AndiModule.activeActionButtons.forceReveal_display && $(this).hasClass(c + "display")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_visibility && $(this).hasClass(c + "visibility")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_position && $(this).hasClass(c + "position")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_opacity && $(this).hasClass(c + "opacity")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_overflow && $(this).hasClass(c + "overflow")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_fontSize && $(this).hasClass(c + "fontSize")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_textIndent && $(this).hasClass(c + "textIndent")) {
                okayToRemoveHighlight = false;
            } else if (AndiModule.activeActionButtons.forceReveal_html5Hidden && $(this).hasClass(c + "html5Hidden")) {
                okayToRemoveHighlight = false;
            }
            if (okayToRemoveHighlight) {
                $(this).removeClass("ANDI508-forceReveal");
            }
        });
    };

    //Previous Element Button override
    $("#ANDI508-button-prevElement").off("click").click(function () {
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

        if (isNaN(index)) { //there is no active element, so focus on last force-revealed element
            andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").last().attr("data-andi508-index")));
        } else {
            var prevElement;

            //Find the previous element with data-andi508-index
            //This will skip over elements that may have been removed from the DOM and are not force revealed
            for (var x = index; x > 0; x--) {
                prevElement = $("#ANDI508-testPage [data-andi508-index='" + (x - 1) + "']");
                if ($(prevElement).length && $(prevElement).hasClass("ANDI508-forceReveal")) {
                    andiFocuser.focusByIndex(x - 1);
                    break;
                }
            }
        }
    });

    //Next Element Button override
    $("#ANDI508-button-nextElement").off("click").click(function () {
        //get the active element
        var index = parseInt($("#ANDI508-testPage .ANDI508-element-active").attr("data-andi508-index"));

        if (isNaN(index)) { //there is no active element, so focus on first force-revealed element
            andiFocuser.focusByIndex(parseInt($("#ANDI508-testPage .ANDI508-forceReveal").first().attr("data-andi508-index")));
        } else {
            var nextElement;
            //Find the next element with data-andi508-index
            //This will skip over elements that may have been removed from the DOM and are not force revealed
            for (var x = index; x < testPageData.andiElementIndex; x++) {
                nextElement = $("#ANDI508-testPage [data-andi508-index='" + (x + 1) + "']");
                if ($(nextElement).length && $(nextElement).hasClass("ANDI508-forceReveal")) {
                    andiFocuser.focusByIndex(x + 1);
                    break;
                }
            }
        }
    });

    hANDI.analyze();
    hANDI.results();

}//end init