"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderComponent = void 0;
const icon_png_1 = require("../../../res/static/icon.png");
const config_1 = require("../../config");
const localiser_1 = require("../../localiser");
const ui_util_1 = require("../../util/ui_util");
const icons_1 = require("../icons");
const base_1 = require("./base");
const toolbar_item_1 = require("./toolbar_item");
class HeaderComponent extends base_1.BaseComponent {
    static get Get() {
        return this._instance || (this._instance = new this());
    }
    constructor() {
        super();
        this._githubButton = new toolbar_item_1.ToolbarItemComponent({ id: 'gh', iconSVG: icons_1.AppIcons.GITHUB })
            .onClick(() => {
            window.open('https://github.com/LucasDower/ObjToSchematic');
        })
            .setTooltip('toolbar.open_github_repo');
        this._bugButton = new toolbar_item_1.ToolbarItemComponent({ id: 'bug', iconSVG: icons_1.AppIcons.BUG })
            .onClick(() => {
            window.open('https://github.com/LucasDower/ObjToSchematic/issues');
        })
            .setTooltip('toolbar.open_github_issues');
        this._discordButton = new toolbar_item_1.ToolbarItemComponent({ id: 'disc', iconSVG: icons_1.AppIcons.DISCORD })
            .onClick(() => {
            window.open('https://discord.gg/McS2VrBZPD');
        })
            .setTooltip('toolbar.join_discord');
        this._kofiButton = new toolbar_item_1.ToolbarItemComponent({ id: 'kofi', iconSVG: icons_1.AppIcons.KOFI })
            .onClick(() => {
            window.open('https://ko-fi.com/lucasdower');
        })
            .setTooltip('toolbar.kofi_donate');
    }
    // Header element shouldn't be
    _onEnabledChanged() {
        return;
    }
    generateHTML() {
        return `
            <div class="col-container announcement">
                The next release of ObjToSchematic will be a major overhaul with new features coming later in 2024. Join the Discord for updates.
            </div>
            <div class="col-container header-cols">
                <div class="col-container">
                    <div class="col-item">
                        <img class="logo" alt="Logo" src="${icon_png_1.default}">
                    </div>
                    <div class="col-item">
                        <div class="row-container">
                            <div class="row-item title">
                                ObjToSchematic
                            </div>
                            <div class="row-item subtitle">
                                ${config_1.AppConfig.Get.getVersionString()} • Minecraft ${config_1.AppConfig.Get.MINECRAFT_VERSION}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="toolbar-group">
                    ${this._githubButton.generateHTML()}
                    ${this._bugButton.generateHTML()}
                    ${this._discordButton.generateHTML()}
                    ${this._kofiButton.generateHTML()}
                </div>
            </div>
            <div class="row-container header-cols">
                <div class="row-container" style="padding-top: 5px;" id="header-desc">
                    ${(0, localiser_1.LOC)('description')}
                </div>
                <div class="row-container privacy-disclaimer" style="padding-top: 5px;">
                    This site may use cookies and similar tracking technologies (like web beacons) to access and store information about usage.
                </div>
            </div>
        `;
    }
    refresh() {
        ui_util_1.UIUtil.getElementById('header-desc').innerText = (0, localiser_1.LOC)('description');
        this._githubButton.updateTranslation();
        this._bugButton.updateTranslation();
        this._discordButton.updateTranslation();
        this._kofiButton.updateTranslation();
    }
    registerEvents() {
        this._githubButton.registerEvents();
        this._bugButton.registerEvents();
        this._discordButton.registerEvents();
        this._kofiButton.registerEvents();
    }
    finalise() {
        this._githubButton.finalise();
        this._bugButton.finalise();
        this._discordButton.finalise();
        this._kofiButton.finalise();
        // const updateElement = UIUtil.getElementById('update-checker') as HTMLDivElement;
        // updateElement.style.animation = 'pulse-opacity 1.5s infinite';
        // updateElement.innerHTML = '<i style="animation: pulse-opacity 1.5s infinite;">Checking for updates...</i>';
        // fetch('https://api.github.com/repos/LucasDower/ObjToSchematic/releases/latest')
        //     .then((response) => response.json())
        //     .then((data) => {
        //         const latest: string = data.tag_name; // e.g. v0.7.0
        //         const versionString = latest.substring(1); // e.g. 0.7.0
        //         const versionValues = versionString.split('.').map((x) => parseInt(x));
        //         // Is the local version older than the latest release on GitHub?
        //         let isGitHubVersionNewer = false;
        //         if (versionValues[0] > AppConfig.Get.MAJOR_VERSION) {
        //             isGitHubVersionNewer = true;
        //         } else {
        //             if (versionValues[1] > AppConfig.Get.MINOR_VERSION) {
        //                 isGitHubVersionNewer = true;
        //             } else {
        //                 if (versionValues[2] > AppConfig.Get.HOTFIX_VERSION) {
        //                     isGitHubVersionNewer = true;
        //                 }
        //             }
        //         }
        //         /*
        //         let isLocalVersionNewer = false;
        //         if (versionValues[0] < AppConfig.Get.MAJOR_VERSION) {
        //             isLocalVersionNewer = true;
        //         } else {
        //             if (versionValues[1] < AppConfig.Get.MINOR_VERSION) {
        //                 isLocalVersionNewer = true;
        //             } else {
        //                 if (versionValues[2] > AppConfig.Get.HOTFIX_VERSION) {
        //                     isLocalVersionNewer = true;
        //                 }
        //             }
        //         }
        //         */
        //         LOG(`[VERSION]: Current: ${[AppConfig.Get.MAJOR_VERSION, AppConfig.Get.MINOR_VERSION, AppConfig.Get.HOTFIX_VERSION]}, Latest: ${versionValues}`);
        //         updateElement.style.animation = '';
        //         if (isGitHubVersionNewer) {
        //             updateElement.innerHTML = `<a href="#" id="update-link">New ${versionString} update available!</a>`;
        //             const linkElement = UIUtil.getElementById('update-link') as HTMLLinkElement;
        //             linkElement.onclick = () => {
        //                 window.open('https://github.com/LucasDower/ObjToSchematic/releases/latest');
        //             };
        //         } else {
        //             // Either using most up-to-date version or local version is newer (using unreleased dev or alpha build)
        //             updateElement.innerHTML = `Version up-to-date!`;
        //         }
        //     })
        //     .catch((error) => {
        //         LOG_ERROR(error);
        //         updateElement.style.animation = '';
        //         updateElement.innerHTML = 'Could not check for updates';
        //     });
    }
}
exports.HeaderComponent = HeaderComponent;
