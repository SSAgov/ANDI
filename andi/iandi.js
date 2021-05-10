//=============================================//
//fANDI: focusable elements ANDI (default mode)//
//Created By Social Security Administration	   //
//=============================================//
function init_module() {

    var iandiVersionNumber = "3.0.1";

    //create iANDI instance
    var iANDI = new AndiModule(iandiVersionNumber, "i");
    iANDI.index = 1;

    //This object class is used to store data about each iFrame. Object instances will be placed into an array.
    function IFrame(element, index, alert) {
        this.element = element;
        this.index = index;
        this.alert = alert;
    }

    //This object class is used to keep track of the iFrames on the page
    function IFrames() {
        this.list = [];
        this.count = 0;
    }

    //This function will analyze the test page for focusable element related markup relating to accessibility
    iANDI.analyze = function () {
        iANDI.iFrames = new IFrames();

        $(TestPageData.allElements).each(function () {
            if ($(this).is("iframe")) {
                // TODO: Try to add src to element
                iANDI.iFrames.list.push(new IFrame(this, iANDI.index, ""))
                andiData = new AndiData(this);
                andiCheck.commonNonFocusableElementChecks(andiData, $(this), true);
                AndiData.attachDataToElement(this);
                iANDI.index += 1;
            }
        });
    };

    //This function adds the finishing touches and functionality to ANDI's display once it's done scanning the page.
    //Inserts some counter totals, displays the accesskey list
    iANDI.results = function () {
        andiBar.updateResultsSummary("Iframes with Content: " + testPageData.andiElementIndex);

        var iframesSelectionMenu = "";
        var iframesSelectionLinks = "";

        for (var x = 0; x < iANDI.iFrames.list.length; x++) {
            iframesSelectionLinks += "<li><a href='javascript:void(0)' data-andi508-relatedindex='" + iANDI.iFrames.list[x].index + "'>";
            if ($(iANDI.iFrames.list[x].element).attr("src")) {
                iframesSelectionLinks += $(iANDI.iFrames.list[x].element).attr("src");
            } else {
                iframesSelectionLinks += "No src";
            }
            iframesSelectionLinks += "</a></li>";
        }

        //iframes contain body content
        if (iframesSelectionLinks) {
            iframesSelectionMenu += "<p>Select iframe to open in a new tab, then launch ANDI.</p>" +
                "<ol>" + iframesSelectionLinks + "</ol>";
        }

        $("#ANDI508-additionalPageResults").append("<button id='ANDI508-viewIframeList-button' class='ANDI508-viewOtherResults-button' aria-expanded='false'>" + listIcon + "view iframe list</button><div id='iANDI508-iframeList-container' class='ANDI508-viewOtherResults-expanded' tabindex='0'><div class='ANDI508-scrollable'>" + iframesSelectionMenu + "</div></div>");

        $("#iANDI508-iframeList-container").find("a").click(function () {
            var relatedIndex = $(this).attr("data-andi508-relatedindex");
            var relatedIframe = $("#ANDI508-testPage .ANDI508-element[data-andi508-index=" + relatedIndex + "]");
            iANDI.openIframeInNewWindow(relatedIframe);
        });

        //Define outline button
        $("#ANDI508-viewIframeList-button").click(function () {
            if ($(this).attr("aria-expanded") === "true") { //hide iframe list, show alert list
                $("#iANDI508-iframeList-container").slideUp(AndiSettings.andiAnimationSpeed);
                $("#ANDI508-alerts-list").show();
                $(this)
                    .addClass("ANDI508-viewOtherResults-button-expanded")
                    .html(listIcon + "view iframe list")
                    .attr("aria-expanded", "false")
                    .removeClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active");
            } else { //show iframe list, hide alert list
                $("#ANDI508-alerts-list").hide();

                andiSettings.minimode(false);
                $(this)
                    .html(listIcon + "hide iframe list")
                    .attr("aria-expanded", "true")
                    .addClass("ANDI508-viewOtherResults-button-expanded ANDI508-module-action-active")
                    .find("img").attr("src", icons_url + "list-on.png");
                $("#iANDI508-iframeList-container").slideDown(AndiSettings.andiAnimationSpeed).focus();
            }
            andiResetter.resizeHeights();
            return false;
        });

        //For iframe list links, add hoverability, focusability, clickability 
        $("#iANDI508-iframeList-container").find("a[data-andi508-relatedindex]").each(function () {
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

        andiBar.showStartUpSummary("To test the contents of <span class='ANDI508-module-name-i'>iframes</span>, each must be viewed independently.<br />Inspect an iframe, press the \"test in new tab\" button, then launch ANDI.", true);

        andiAlerter.updateAlertList();

        $("#ANDI508").focus();
    };

    //This function will update the info in the Active Element Inspection.
    //Should be called after the mouse hover or focus in event.
    AndiModule.inspect = function (element) {
        andiBar.prepareActiveElementInspection(element);

        var elementData = $(element).data("andi508");
        var addOnProps = AndiData.getAddOnProps(element, elementData, ["src"]);

        andiBar.displayOutput(elementData, element, addOnProps);
        andiBar.displayTable(elementData, element, addOnProps);

        $("#ANDI508-additionalElementDetails").html("<button>test in new tab</button>");
        $("#ANDI508-additionalElementDetails button").click(function () {
            iANDI.openIframeInNewWindow(element, $(element).attr("src"));
            return false;
        });
    };

    //This function will open an iframe in a new window 
    iANDI.openIframeInNewWindow = function (iframe, src) {
        var iframeWindow;
        var url = $(iframe).attr("src");

        if (src) {
            iframeWindow = window.open(url, "_blank"); //opens user preference, usually new tab
            iframeWindow.focus();
        }
    };

    iANDI.analyze();
    iANDI.results();

}//end init
