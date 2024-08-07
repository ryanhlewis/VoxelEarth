"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderComponent = void 0;
var icon_png_1 = __importDefault(require("../../../res/static/icon.png"));
var config_1 = require("../../config");
var localiser_1 = require("../../localiser");
var ui_util_1 = require("../../util/ui_util");
var icons_1 = require("../icons");
var base_1 = require("./base");
var toolbar_item_1 = require("./toolbar_item");
var HeaderComponent = /** @class */ (function (_super) {
    __extends(HeaderComponent, _super);
    function HeaderComponent() {
        var _this = _super.call(this) || this;
        _this._githubButton = new toolbar_item_1.ToolbarItemComponent({ id: 'gh', iconSVG: icons_1.AppIcons.GITHUB })
            .onClick(function () {
            window.open('https://github.com/LucasDower/ObjToSchematic');
        })
            .setTooltip('toolbar.open_github_repo');
        _this._bugButton = new toolbar_item_1.ToolbarItemComponent({ id: 'bug', iconSVG: icons_1.AppIcons.BUG })
            .onClick(function () {
            window.open('https://github.com/LucasDower/ObjToSchematic/issues');
        })
            .setTooltip('toolbar.open_github_issues');
        _this._discordButton = new toolbar_item_1.ToolbarItemComponent({ id: 'disc', iconSVG: icons_1.AppIcons.DISCORD })
            .onClick(function () {
            window.open('https://discord.gg/McS2VrBZPD');
        })
            .setTooltip('toolbar.join_discord');
        _this._kofiButton = new toolbar_item_1.ToolbarItemComponent({ id: 'kofi', iconSVG: icons_1.AppIcons.KOFI })
            .onClick(function () {
            window.open('https://ko-fi.com/lucasdower');
        })
            .setTooltip('toolbar.kofi_donate');
        return _this;
    }
    Object.defineProperty(HeaderComponent, "Get", {
        get: function () {
            return this._instance || (this._instance = new this());
        },
        enumerable: false,
        configurable: true
    });
    // Header element shouldn't be
    HeaderComponent.prototype._onEnabledChanged = function () {
        return;
    };
    HeaderComponent.prototype.generateHTML = function () {
        return "\n            <div class=\"col-container announcement\">\n                The next release of ObjToSchematic will be a major overhaul with new features coming later in 2024. Join the Discord for updates.\n            </div>\n            <div class=\"col-container header-cols\">\n                <div class=\"col-container\">\n                    <div class=\"col-item\">\n                        <img class=\"logo\" alt=\"Logo\" src=\"".concat(icon_png_1.default, "\">\n                    </div>\n                    <div class=\"col-item\">\n                        <div class=\"row-container\">\n                            <div class=\"row-item title\">\n                                ObjToSchematic\n                            </div>\n                            <div class=\"row-item subtitle\">\n                                ").concat(config_1.AppConfig.Get.getVersionString(), " \u2022 Minecraft ").concat(config_1.AppConfig.Get.MINECRAFT_VERSION, "\n                            </div>\n                        </div>\n                    </div>\n                </div>\n                <div class=\"toolbar-group\">\n                    ").concat(this._githubButton.generateHTML(), "\n                    ").concat(this._bugButton.generateHTML(), "\n                    ").concat(this._discordButton.generateHTML(), "\n                    ").concat(this._kofiButton.generateHTML(), "\n                </div>\n            </div>\n            <div class=\"row-container header-cols\">\n                <div class=\"row-container\" style=\"padding-top: 5px;\" id=\"header-desc\">\n                    ").concat((0, localiser_1.LOC)('description'), "\n                </div>\n                <div class=\"row-container privacy-disclaimer\" style=\"padding-top: 5px;\">\n                    This site may use cookies and similar tracking technologies (like web beacons) to access and store information about usage.\n                </div>\n            </div>\n        ");
    };
    HeaderComponent.prototype.refresh = function () {
        ui_util_1.UIUtil.getElementById('header-desc').innerText = (0, localiser_1.LOC)('description');
        this._githubButton.updateTranslation();
        this._bugButton.updateTranslation();
        this._discordButton.updateTranslation();
        this._kofiButton.updateTranslation();
    };
    HeaderComponent.prototype.registerEvents = function () {
        this._githubButton.registerEvents();
        this._bugButton.registerEvents();
        this._discordButton.registerEvents();
        this._kofiButton.registerEvents();
    };
    HeaderComponent.prototype.finalise = function () {
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
    };
    return HeaderComponent;
}(base_1.BaseComponent));
exports.HeaderComponent = HeaderComponent;
//# sourceMappingURL=header.js.map