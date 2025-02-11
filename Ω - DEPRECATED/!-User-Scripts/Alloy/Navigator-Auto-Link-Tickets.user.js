// ==UserScript==
// @name         [DEPRECATED] Alloy Navigator - Auto-Link Tickets
// @namespace    https://drewj.la/
// @version      1.5.6
// @description  When viewing a ticket, it will automatically create a button to the right of the ticket number, or title, that once pressed will copy the link, to the ticket in Alloy, to your clipboard.
// @author       Andrew Larson
// @license      GPL-3.0-or-later
// @match        https://*/*.aspx*
// @updateURL    https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/%CE%A9%20-%20DEPRECATED/!-User-Scripts/Alloy/Navigator-Auto-Link-Tickets.user.js
// @downloadURL  https://raw.githubusercontent.com/Andrew-J-Larson/Custom-JS/main/%CE%A9%20-%20DEPRECATED/!-User-Scripts/Alloy/Navigator-Auto-Link-Tickets.user.js
// @icon         https://hd.alloysoftware.com/helpdesk/favicon.ico
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

/* Copyright (C) 2024  Andrew Larson (github@drewj.la)
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* globals GetIdFromURL, applicationUrl */

// CONSTANTS

const ticketPattern = /^[a-zA-Z]+[0-9]+$/
const applicationNameSelector = 'meta[name="application-name"]';
const alloyBreadcrumbsID = 'alloy-breadcrumbs';
const headerWrapperSelector = '#form-container > div > div:first-of-type > div:first-of-type > div:last-of-type > div:first-of-type > div:last-of-type > div:first-of-type';
const summaryPartialSelector = '.field--Summary';
const previewFrameSelector = '#PreviewFrame'
const previewDivSelector = '#preview';
const previewHeaderPartialSelector = '.kbarticle-header';
const ticketPartialSelector = '.field--Ticket, .field--OID'; // OID is for any non-tickets, like general objects
const oldHeaderWrapperSelector = '.full-form-header-wrapper';
const oldHeaderSelector1 = '.full-form-header__1_1';
const oldHeaderSelector2 = '.full-form-header__2_1';
const COPY_TOOLTIP = 'Click to copy link to ticket';
const NOT_ALLOY_NAVIGATOR = "[" + GM_info.script.name + "] Aborted script, this website is not running the Alloy Navigator web app.";
const SPEED_SECOND = 1000; // ms
const INTERVAL_SLOW_SPEED = 500; // ms
const INTERVAL_SPEED = 200; // ms
const ticketLinkRandomNumber = function () {
    let length = 18; // 18 is likely overkill, but fine
    return Math.floor(Math.pow(10, length - 1) + Math.random() * (Math.pow(10, length) - Math.pow(10, length - 1) - 1));
}();
let ticketLinkAnchorID = 'ticketLinkWrapper-' + ticketLinkRandomNumber;
let ticketLinkToastID = 'ticketLinkToast-' + ticketLinkRandomNumber;
let ticketLinkButtonID = 'ticketLinkButton-' + ticketLinkRandomNumber;

// VARIABLES

let applicationUrl = window.applicationUrl ? window.applicationUrl : ((window.location.href).split('/')).slice(0, 4).join('/') + '/';
let ticketGoURL = applicationUrl + "Go/";
let ticketViewObjectURL = applicationUrl + "ViewObject.aspx?ID=";

// VECTORS

// link icon via https://fonts.gstatic.com/s/i/materialiconsoutlined/link/v19/24px.svg
const googleFontLinkLightMode = '<svg style="display: inline-block; vertical-align: middle; width: 24;" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z" fill="#333333"/><style xmlns="">@media print{.searchbar5011729485472345{display:none!important;}}</style></svg>';
const googleFontLinkDarkMode = '<svg style="display: inline-block; vertical-align: middle; width: 24;" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z" fill="#c8c3bc"/><style xmlns="">@media print{.searchbar5011729485472345{display:none!important;}}</style></svg>';

// STYLES

const clipTextColor = '#666666';
const clipHoverLightModeBackground = '#bedafc';
const clipHoverDarkModeBackground = '#2b2f31';
GM_addStyle('#' + ticketLinkButtonID + ' {border: none !important; background: transparent !important}');
GM_addStyle('#' + ticketLinkButtonID + ':focus, #' + ticketLinkButtonID + ' > svg:focus {outline: none !important}');
GM_addStyle('#' + ticketLinkAnchorID + ' {padding-inline: 0 !important}');
GM_addStyle('#' + ticketLinkAnchorID + ' > #' + ticketLinkButtonID + ' {padding: 0 !important; border-radius: 4px !important; width: 24px !important; height: 24px !important}');
GM_addStyle('#' + ticketLinkAnchorID + ' > #' + ticketLinkButtonID + ' > svg {margin-top: -1.015px !important}');
GM_addStyle('.full-form-header__1_1 > #' + ticketLinkButtonID + ' > svg {margin-inline: -3px !important; padding: 0 3px 0.3333px !important; border-radius: 4px !important}');
GM_addStyle('#' + ticketLinkAnchorID + ':not(.dkDark) :hover, ' +
            '.full-form-header__1_1 > #' + ticketLinkButtonID + ':not(.dkDark) :hover {background-color: ' + clipHoverLightModeBackground + ' !important}');
GM_addStyle('#' + ticketLinkAnchorID + '.dkDark :hover, ' +
            '.full-form-header__1_1 > #' + ticketLinkButtonID + '.dkDark :hover {background-color: ' + clipHoverDarkModeBackground + '40 !important}');
GM_addStyle('#' + ticketLinkAnchorID + ' > #' + ticketLinkToastID + ' {font-size: 12px !important; margin-top: -1.015px !important}');
GM_addStyle('.full-form-header__1_1 > #' + ticketLinkToastID + ' {font-size: 14px !important; padding-bottom: 2.0833px !important; font-weight: 400 !important}');
GM_addStyle('#' + ticketLinkToastID + ', #' + ticketLinkToastID + ':hover, #' + ticketLinkToastID + ':focus {color: ' + clipTextColor + ' !important}');

// FUNCTIONS

// via https://stackoverflow.com/a/50067769
function copyToClip(htmlStr, plainStr) {
    function listener(e) {
        e.clipboardData.setData("text/html", htmlStr);
        e.clipboardData.setData("text/plain", plainStr);
        e.preventDefault();
    }
    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);
};

// VARIABLES

let theme = null; // changes with Dark Reader (at this time)
let currentFade; // gets set dynamically
let ticketNumber; // gets set dynamically
let linkText; // gets set dynamically
let placementElement; // gets set dynamically

// MAIN

// wait for the page to be fully loaded
window.addEventListener('load', function () {
    // need to confirm we are running on Alloy Navigator, and confirm features
    let applicationNameElement = (document.head).querySelector(applicationNameSelector);
    let applicationName = applicationNameElement ? applicationNameElement.content : null;
    let applicationNameSplit = applicationName ? applicationName.split(' ') : null;
    let applicationVersion = applicationNameSplit ? applicationNameSplit[applicationNameSplit.length - 1] : null;
    let applicationVersionSplit = applicationVersion ? applicationVersion.split('.') : null;

    // avoids breaking some websites that assume all errors are their own
    try {
        if (!applicationName || !applicationName.startsWith("Alloy Navigator")) throw new Error(NOT_ALLOY_NAVIGATOR);

        // only version 2022.2 and newer have the breadcrumb trails
        let hasBreadcrumbs = (applicationVersionSplit && applicationVersionSplit[0] > 2022 || (applicationVersionSplit[0] = 2022 && applicationVersionSplit[1] >= 2));

        // need to wait for element(s) to be available
        let waitForAlloyElements = setInterval(function () {
            let oldTicketHeader = document.querySelector(oldHeaderWrapperSelector);
            let previewFrame = document.querySelector(previewFrameSelector);
            let ticketHeader = oldTicketHeader || document.querySelector(headerWrapperSelector) || (previewFrame ? previewFrame.contentDocument.querySelector(previewDivSelector) : null);
            let alloyBreadcrumbs = document.getElementById(alloyBreadcrumbsID);
            if (ticketHeader && !document.hidden && (hasBreadcrumbs ? alloyBreadcrumbs : true)) {
                clearInterval(waitForAlloyElements);

                // Pre 2023.2 versions need to look at headers rather than fields in the newer versions
                let oldTicketHeader1 = document.querySelector(oldHeaderSelector1);
                let oldTicketHeader2 = document.querySelector(oldHeaderSelector2);
                let summaryElement = oldTicketHeader1 || ticketHeader.querySelector(summaryPartialSelector) || ticketHeader.querySelector(previewHeaderPartialSelector);
                let ticketElement = ticketHeader.querySelector(ticketPartialSelector); // leaving out oldTicketHeader2 from this is on purpose

                // continue with the process
                let alloyObjectDirectoryItems = alloyBreadcrumbs ? alloyBreadcrumbs.querySelectorAll('div > div > div > a > span') : null;
                let ticketNumberElement; // gets set dynamically


                // create a link if ticket information found
                if (hasBreadcrumbs && alloyObjectDirectoryItems && alloyObjectDirectoryItems.length > 0) {
                    // get ticket number from breadcrumbs
                    ticketNumberElement = alloyObjectDirectoryItems[alloyObjectDirectoryItems.length - 1];
                    ticketNumber = ticketNumberElement.innerText;
                }
                // newer Alloy versions make finding the ticket number easy
                if (!ticketNumber && ticketElement) ticketNumber = ticketElement.innerText;
                // older Alloy versions are harder to figure out ticket numbers
                if (!ticketNumber && oldTicketHeader2) {
                    // get ticket number from website title - format example: "T000001 - Title of Ticket" => T000001
                    let wordsWebsiteTitle = (document.title).split(' ');
                    let possibleTicketNumber = wordsWebsiteTitle[wordsWebsiteTitle.length - 1];
                    ticketNumber = ticketPattern.test(possibleTicketNumber) ? possibleTicketNumber : false;
                }
                if (!ticketNumber && oldTicketHeader2) {
                    // get ticket number from sub title - format example: "Incident T000001" => T000001
                    let ticketHeader = oldTicketHeader2.innerText;
                    let wordsTicketHeader = ticketHeader.split(' ');
                    let possibleTicketNumber = wordsTicketHeader[wordsTicketHeader.length - 1];
                    ticketNumber = /^[a-zA-Z]+[0-9]+$/.test(possibleTicketNumber) ? possibleTicketNumber : false;
                }
                if (!ticketNumber && summaryElement) {
                    // set link text to ticket title - format example: "Title of Ticket" => Title of Ticket
                    linkText = summaryElement.innerText;
                }
                if (!linkText) linkText = ticketNumber;

                // create copy to clipboard button if we have the information we needed
                if ((ticketNumberElement || summaryElement) && linkText) {
                    // need to craft rich-text link
                    let linkURL = ticketNumber ? (ticketGoURL + ticketNumber) : (ticketViewObjectURL + window.GetIdFromURL(window.location.href));
                    let ticketRichTextLink = `<a href="${linkURL}">${linkText}</a>`;

                    // modify element to create clickable copy link
                    let ticketLinkToast = document.createElement('span');
                    ticketLinkToast.innerText = '(copied to clipboard)';
                    ticketLinkToast.id = ticketLinkToastID;
                    ticketLinkToast.style.display = 'none';
                    let ticketLinkButton = document.createElement('button');
                    ticketLinkButton.type = 'button';
                    ticketLinkButton.id = ticketLinkButtonID;
                    ticketLinkButton.title = COPY_TOOLTIP;
                    ticketLinkButton.alt = COPY_TOOLTIP;
                    ticketLinkButton.onclick = function () {
                        copyToClip(ticketRichTextLink, linkURL);
                        // need to remove active fade first
                        if (currentFade) clearTimeout(currentFade);
                        ticketLinkToast.style.transition = '';
                        ticketLinkToast.style.display = '';
                        ticketLinkToast.style.opacity = '1';
                        currentFade = setTimeout(function () {
                            ticketLinkToast.style.transition = 'opacity 1s ease-in-out';
                            ticketLinkToast.style.opacity = '0';
                            currentFade = setTimeout(function () { ticketLinkToast.style.display = 'none' }, SPEED_SECOND);
                        }, SPEED_SECOND);
                    };

                    // button injection depends on if Alloy version has breadcrumbs
                    if (hasBreadcrumbs) {
                        let fixMissingButton = setInterval(function () {
                            if (!document.getElementById(ticketLinkButtonID)) {
                                alloyBreadcrumbs = document.getElementById(alloyBreadcrumbsID);
                                alloyObjectDirectoryItems = alloyBreadcrumbs ? alloyBreadcrumbs.querySelectorAll('div > div > div > a > span') : null;
                                ticketNumberElement = alloyObjectDirectoryItems[alloyObjectDirectoryItems.length - 1];
                                let alloyObjectDirectoyDivAnchor = ticketNumberElement.parentElement;
                                let alloyObjectDirectoyDiv = alloyObjectDirectoyDivAnchor.parentElement;
                                let alloyObjectDirectoy = alloyObjectDirectoyDiv.parentElement;

                                let ticketLinkDiv = document.createElement('div')
                                ticketLinkDiv.classList = alloyObjectDirectoyDiv.classList;
                                let ticketLinkAnchor = document.createElement('a');
                                ticketLinkAnchor.classList = alloyObjectDirectoyDivAnchor.classList;
                                ticketLinkAnchor.style = "padding-inline: 4px";
                                let ticketLinkButtonAnchor = ticketLinkAnchor.cloneNode(true);
                                ticketLinkButtonAnchor.id = ticketLinkAnchorID;
                                let ticketLinkToastAnchor = ticketLinkAnchor.cloneNode(true);
                                ticketLinkToastAnchor.ariaSelected = "true";
                                ticketLinkToastAnchor.style.background = "transparent";
                                ticketLinkToast.classList = ticketNumberElement.classList

                                ticketLinkButtonAnchor.appendChild(ticketLinkButton);
                                ticketLinkToastAnchor.appendChild(ticketLinkToast);
                                ticketLinkDiv.appendChild(ticketLinkButtonAnchor);
                                ticketLinkDiv.appendChild(ticketLinkToastAnchor);

                                alloyBreadcrumbs = document.getElementById(alloyBreadcrumbsID);
                                alloyObjectDirectoryItems = alloyBreadcrumbs.querySelectorAll('div > div > div > a > span');
                                ticketNumberElement = alloyObjectDirectoryItems[alloyObjectDirectoryItems.length - 1];

                                alloyObjectDirectoy.appendChild(ticketLinkDiv);
                            }
                        }, INTERVAL_SLOW_SPEED);
                    } else {
                        summaryElement.appendChild(ticketLinkButton);
                        summaryElement.appendChild(ticketLinkToast);
                    }

                    // monitor page theme to change link button colors appropriately
                    let htmlPage = document.querySelector('html');
                    setInterval(function () {
                        if ((!theme || theme === "light") && htmlPage.hasAttribute('data-darkreader-scheme') && htmlPage.getAttribute('data-darkreader-scheme') === "dark") {
                            theme = "dark";
                            ticketLinkButton.innerHTML = googleFontLinkDarkMode;
                            ticketLinkButton.classList.add('dkDark');
                        } else if ((!theme || theme === "dark") && (!htmlPage.hasAttribute('data-darkreader-scheme') || htmlPage.getAttribute('data-darkreader-scheme') === "light")) {
                            theme = "light";
                            ticketLinkButton.innerHTML = googleFontLinkLightMode;
                            ticketLinkButton.classList.remove('dkDark');
                        }
                    }, INTERVAL_SPEED);
                }
            }
        }, INTERVAL_SPEED);
    } catch (e) {
        console.warn(e.message);
    }
}, false);
