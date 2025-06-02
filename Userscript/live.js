// ==UserScript==
// @name         Live Helper
// @name:zh-CN   直播
// @namespace    KSasougranao
// @version      1.3.3
// @description  B 站、抖音、虎牙、快手直播功能增强
// @author       KSasougranao
// @match        https://live.bilibili.com/*
// @exclude      https://live.bilibili.com/
// @exclude      https://live.bilibili.com/p/*
// @match        https://www.bilibili.com/video/*
// @match        https://live.douyin.com/*
// @exclude      https://live.douyin.com/
// @exclude      https://live.douyin.com/category/*
// @match        https://www.douyu.com/topic/*
// @match        https://www.huya.com/*
// @exclude      https://www.huya.com/
// @exclude      https://www.huya.com/g/*
// @match        https://live.kuaishou.com/u/*
// @run-at       document-start
// @grant        GM_addStyle
// @require      https://gitee.com/KSasougranao/UNK/raw/master/Userscript/toast_utility.js
// ==/UserScript==

(function () {
    'use strict';

    function isGlobalKey(e) {
        if (!['BODY', 'VIDEO'].includes(e.target.tagName)) return false;
        if (e.ctrlKey || e.altKey || e.metaKey) return false;
        return true;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function waitNode(selector, interval=100, limit=-1) {
        while (limit !== 0) {
            limit -= 1;
            const e = document.querySelector(selector);
            if (e) { return e; }
            await sleep(interval);
        }
    }

    // 模拟鼠标移动，用于唤醒播放器按钮
    function imitataMouseMove(e, x, y) {
        const document_ = e.ownerDocument;
        const window = document_.defaultView || document_.parentWindow;
        const options = {
            bubbles: true,
            cancelable: true,
            view: window,
            screenX: x,
            screenY: y,
            clientX: x,
            clientY: y,
        };
        e.dispatchEvent(new MouseEvent('mousemove', options));
        e.dispatchEvent(new MouseEvent('mouseenter', options));
    }

function _toast() {
    if (!arguments[0]) return;
    toast.apply(this, arguments);
}

class LiveController {
    constructor() {
        this.ignoreKeys = new Set();
    }

    async adjustVolume(d, mute=null) {
        let video = await waitNode('video');

        if (mute) {
            video.muted = !video.muted;
            return video.muted ? '静音' : '取消静音';
        } else {
            let volume = Math.max(0, Math.min(100, Math.floor(video.volume * 100) + d));
            video.volume = volume / 100;
            video.muted = false;
            return `音量 ${volume}`;
        }
    }

    async keyEventHandler(e) {
        if (!isGlobalKey(e)) return;
        if (this.ignoreKeys.has(e.key)) return;
        if (e.key === ' ') {
            this.togglePlay?.();
        } else if (e.key === 'e') {
            this.refresh?.();
        } else if (e.key === '+') {
            _toast(await this.adjustPlayRate?.(1));
        } else if (e.key === '_') {
            _toast(await this.adjustPlayRate?.(-1));
        } else if (e.key === 'd') {
            this.rotate?.();
        } else if (e.key === 's') {
            this.toggleDanmu?.();
        } else if (e.key === 'ArrowRight') {
            _toast(await this.adjustVolume?.(5));
        } else if (e.key === 'ArrowLeft') {
            _toast(await this.adjustVolume?.(-5));
        } else if (e.key === 'm') {
            _toast(await this.adjustVolume?.(0, true));
        } else if (e.key === '.') {
            this.adjustQuality?.(1);
        } else if (e.key === ',') {
            this.adjustQuality?.(-1);
        } else if (e.key === '>') {
            this.adjustQuality?.(10);
        } else if (e.key === '<') {
            this.adjustQuality?.(-10);
        } else if (e.key === '\\') {
            this.toggleSidebar?.();
        } else if (e.key === ';') {
            this.toggleWide?.();
        } else if (e.key === ':' || e.key === '[' || e.key === '-') {
            this.toggleFullPage?.();
        } else if (e.key === '"' || e.key === ']' || e.key === '=') {
            this.toggleFullScreen?.();
        }
    }
}

class Bili extends LiveController {
    async toggleDanmu() {
        const video = document.querySelector('video');
        imitataMouseMove(video, 0, 0);
        document.querySelectorAll('.right-area .icon')[3].click();
    }

    async adjustQuality(d) {
        const video = document.querySelector('video');
        imitataMouseMove(video, 0, 0);
        await sleep(20);
        const qualityWrap = document.querySelector('.quality-wrap');
        imitataMouseMove(qualityWrap, 0, 0);
        await waitNode('.quality-wrap .list-it');
        let options = [];
        for (let i = 0; options.length === 0 && i < 50; i += 1) {
            options = Array.from(document.querySelectorAll('.quality-wrap .list-it'));
            await sleep(20);
        }
        options = options.filter(e => e.children.length == 0);
        const selectedIndex = options.findIndex(e => e.classList.contains('selected'));
        const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - d));
        if (newIndex != selectedIndex) {
            options[newIndex].click();
        }
    }

    async toggleSidebar() {
        // 网页全屏时会显示收起右侧栏的按钮
        // 实际上该按钮一直可用
        document.querySelector('#aside-area-toggle-btn')?.click();
    }

    async toggleWide() {
        // 隐藏右侧栏和标题栏，将播放器居中并放大，模拟视频页“宽屏模式”的效果
        const lst = document.querySelector('main').classList;
        if (lst.contains('wide')) {
            lst.remove('wide');
        } else {
            lst.add('wide');
            // 根据播放器尺寸、位置和网页窗口尺寸、当前位置计算垂直居中位置
            const player = document.querySelector('#player-ctnr');
            const rect = player.getBoundingClientRect();
            // 播放器顶部相对于页面顶部的距离
            const playerTop = rect.top + window.scrollY;
            const playerCenter = playerTop + rect.height / 2;
            window.scrollTo({top: playerCenter - window.innerHeight / 2, behavior: 'instant'});
        }
    }

    async toggleFullPage() {
        const video = document.querySelector('video');
        imitataMouseMove(video, 0, 0);
        document.querySelectorAll('.right-area .icon')[1].click();
        document.querySelector('#aside-area-vm').style.display = '';
    }

    async toggleFullScreen() {
        const video = document.querySelector('video');
        imitataMouseMove(video, 0, 0);
        document.querySelectorAll('.right-area .icon')[0].click();
    }

    async init() {
        GM_addStyle(`
main.wide :is(.link-navbar-ctnr, #head-info-vm, #side-area-vm) {
    display: none !important;
}
main.wide #player-ctnr {
    width: 100% !important;
}
main.wide .app-body {
    max-width: 1920px !important;
    width: 85% !important;
}
        `);
        await waitNode('video');
        await sleep(200);
        await this.toggleFullPage();
        await this.adjustQuality(10);
    }
}

class BiliVideo extends LiveController {
    constructor() {
        super();
        ['ArrowRight', 'ArrowLeft', '[', ']', 'm'].forEach(key => this.ignoreKeys.add(key));
    }

    async adjustPlayRate(d) {
        const video = await waitNode('video');
        const rate = Math.max(0, Math.floor(video.playbackRate * 4) + d);
        video.playbackRate = rate / 4;
        return `速度 ${rate}`;
    }

    async toggleDanmu() {
        document.querySelector('.bpx-player-dm-switch input').click();
    }

    async toggleWide() {
        const headerHeight = document.querySelector('.bili-header__bar').getBoundingClientRect().height;
        const state0 = document.querySelector('.bpx-player-container').getAttribute('data-screen');
        document.querySelector('.bpx-player-ctrl-wide').click();
        for (let i = 0; i < 100; ++i) {
            const state = document.querySelector('.bpx-player-container').getAttribute('data-screen');
            if (state !== state0) break;
            await sleep(100);
        }
        const player = document.querySelector('video');
        const rect = player.getBoundingClientRect();
        const playerTop = rect.top + window.scrollY;
        const playerCenter = playerTop + rect.height / 2;
        window.scrollTo({top: playerCenter - (window.innerHeight + headerHeight) / 2, behavior: 'instant'});
    }

    async toggleFullPage() {
        document.querySelector('.bpx-player-ctrl-web').click();
    }

    async toggleFullScreen() {
        document.querySelector('.bpx-player-ctrl-full').click();
    }
}

class Douyin extends LiveController{
    async toggleDanmu() {
        document.querySelector('.danmu-icon').click();
    }

    async adjustQuality(d) {
        const options = Array.from((await waitNode('[data-e2e=quality-selector]')).children);
        const selectedIndex = options.reduce((acc, e, i) => e.children[0].style.background === '' ? acc : i, 0);
        const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - d));
        if (newIndex !== selectedIndex) {
            options[newIndex].click();
        }
    }

    async toggleSidebar() {
        const fold = document.querySelector('.chat_room_fold');
        if (fold) {
            fold.click();
        } else {
            document.querySelector('.chatroom_close').click();
        }
    }

    async toggleFullPage() {
        const sidebar = !document.querySelector('.chat_room_fold');
        document.querySelector('xg-icon[data-index="0.5"] > div > div:nth-of-type(2)').click();
        if (!sidebar) {
            while (document.querySelector('.chat_room_fold')) { await sleep(100); }
            document.querySelector('.chatroom_close').click();
        }
    }

    async toggleFullScreen() {
        const sidebar = !document.querySelector('.chat_room_fold');
        document.querySelector('.xgplayer-fullscreen').click();
        if (!sidebar) {
            while (document.querySelector('.chat_room_fold')) { await sleep(100); }
            document.querySelector('.chatroom_close').click();
        }
    }

    async init() {
        // 初始选择最高画质
        await waitNode('[data-e2e=quality-selector]');
        await this.adjustQuality(10);

        await this.toggleFullPage();
        // 根据视频宽高比适配
        {
            await waitNode('.chatroom_close');
            const video = await waitNode('video');
            const vw = video.videoWidth, vh = video.videoHeight;
            const player = await waitNode('.basicPlayer');
            const container = await waitNode('.app-container');
            const w0 = player.clientWidth * container.clientWidth, h0 = player.clientHeight * container.clientHeight;
            if (w0 * vh * vh < h0 * vw * vw) {
                await this.toggleSidebar();
            }
        }

        {
            const present = (await waitNode('.xgplayer-volume + xg-icon[data-index="1"]', 100, 100))?.querySelector('div');
            if (present?.textContent === '屏蔽礼物特效') {
                present.querySelector('div:nth-of-type(2)').click();
            }
        }
    }
}

class Douyu extends LiveController {
    async toggleSidebar() {
        (await waitNode('.layout-Player-asidetoggleButton')).click();
    }
}

class Huya extends LiveController {
    async togglePlay() {
        document.querySelector('#player-btn').click();
    }

    async refresh() {
        document.querySelector('.player-refresh-btn').click();
    }

    async toggleDanmu() {
        document.querySelector('#player-danmu-btn').click();
    }

    async adjustVolume(d, mute=null) {
        if (mute) {
            const btn = document.querySelector('#player-sound-btn');
            btn.click();
            return btn.classList.contains('player-sound-off') ? '静音' : '取消静音';
        }
    }

    async adjustQuality(d) {
        const options = Array.from((await waitNode('.player-videotype-list')).children)
            .filter(e => !e.querySelector('div'));
        const selectedIndex = options.findIndex(e => e.classList.contains('on'));
        const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - d));
        if (newIndex !== selectedIndex) {
            options[newIndex].click();
        }
    }

    async adjustVideoLine() {
        const options = Array.from((await waitNode('.player-videoline-list')).children);
        const selectedIndex = options.findIndex(e => e.classList.contains('on'));
        let newIndex = selectedIndex;
        let changed = this.lastLine !== options[newIndex].getAttribute('line');
        // 跳过已屏蔽的 p2p 线路
        while (!changed || options[newIndex].getAttribute('line') === '66') {
            changed = true;
            newIndex = (newIndex + 1) % options.length;
        }
        if (newIndex !== selectedIndex) {
            options[0].click();
        }
        this.lastLine = options[newIndex].getAttribute('line');
    }

    async toggleSidebar() {
        (await waitNode('#player-fullpage-right-btn')).click();
    }

    async toggleFullPage() {
        (await waitNode('#player-fullpage-btn')).click();
    }

    async toggleFullScreen() {
        (await waitNode('#player-fullscreen-btn')).click();
    }

    async init() {
        GM_addStyle(`
.link-toast {
    z-index: 20000;
}
        `);
        function isShow(selector) {
            return document.querySelector(selector)?.style.display === 'block';
        }
        // 等待线路、清晰度等加载完毕
        while (!isShow('#player-caption-swich-wrap')) { await sleep(100); }
        // 调整视图
        await this.toggleSidebar();
        await this.toggleFullPage();
        await this.adjustVideoLine();
        await this.adjustQuality(10);
        // 在重新加载时自动跳过 P2P 线路
        while (true) {
            // 等待加载失败出现切换线路提示
            const check = () => isShow('#player-loading') && isShow('.player-loading-changeline');
            while (true) {
                while (!check()) { await sleep(500); }
                // 即使加载成功也会有也可能会短暂出现切换线路提示，继续等待以确认加载状态
                await sleep(5000);
                if (check()) { break; }
            }
            await this.adjustVideoLine();
        }
    }
}

class Kuaishou extends LiveController {
    async togglePlay() {
        document.querySelector('.play-icon').click();
    }

    async refresh() {
        document.querySelector('.refresh-icon').click();
    }

    async rotate() {
        document.querySelector('.rotate-icon').click();
    }

    async adjustQuality(d) {
        const trigger = await waitNode('.kwai-player-quality .tooltip-trigger');
        trigger.click();
        const options = Array.from((await waitNode('.quality-list')).children);
        const selectedIndex = options.findIndex(e => e.classList.contains('actived'));
        const newIndex = Math.max(0, Math.min(options.length - 1, selectedIndex - d));
        if (newIndex !== selectedIndex) {
            options[newIndex].click();
        } else {
            trigger.click();
        }
    }

    async toggleSidebar() {
        const sidebar = await waitNode('#liveroom__sidebar');
        const lst = document.querySelector('.swiper-wrapper').classList;
        if (lst.contains('full')) {
            lst.remove('full');
            sidebar.style['display'] = '';
        } else {
            lst.add('full');
            sidebar.style['display'] = 'none';
        }
    }

    async toggleFullPage() {
        (await waitNode('.theater-icon')).click();
    }

    async toggleFullScreen() {
        (await waitNode('.screen-icon')).click();
    }

    async init() {
        GM_addStyle(`
.swiper-wrapper.full {
    width: 100vw !important;
}
        `);

        await sleep(500);
        await this.toggleSidebar();
        await this.toggleFullPage();
        await this.adjustQuality(10);
        await this.adjustVolume(-100);
        await this.adjustVolume(30);
    }
}

    const reUrls = [
        [/live\.bilibili\.com\/(blanc\/)?[^\/]+$/, Bili],
        [/www\.bilibili\.com\/video\//, BiliVideo],
        [/live\.douyin\.com\/[^\/]+$/, Douyin],
        [/www\.douyu\.com\/.+$/, Douyu],
        [/www\.huya\.com\/[^/]+$/, Huya],
        [/live\.kuaishou\.com\/u\/[^\/]+$/, Kuaishou],
    ];
    const C = reUrls.find(x => document.URL.match(x[0]))[1];
    if (C !== undefined) {
        const c = new C();
        window.addEventListener('keyup', e => c.keyEventHandler(e));
        c.init?.();
    }
})();