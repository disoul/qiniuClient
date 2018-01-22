'use strict'

import {app, BrowserWindow, Menu, ipcMain, dialog} from 'electron'

//const {download} = require('electron-dl');
const {download} = require('../libs/electron-dl');

import * as util from './util'
import * as trayUtil from './trayUtil';

let mainWindow;

app.on('ready', initApp);

function initApp() {
    //注册菜单
    const menu = Menu.buildFromTemplate(getMenuData());
    Menu.setApplicationMenu(menu);

    //创建主窗口
    createMainWindow();
    //托盘处理
    // util.isMac() && trayUtil.createTray(mainWindow.id);

    registerIPC();
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        height: 750,
        width: 1000,
        // frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            webSecurity: false
        }
    });

    mainWindow.loadURL(util.winURL);

    mainWindow.on('closed', () => {
        mainWindow = null
    });
}

app.on('window-all-closed', () => {
    if (!util.isMac()) {
        app.quit()
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow()
    }
});

/**
 * 注册IPC事件
 */
const registerIPC = function () {
    //选择文件
    ipcMain.on('open-file-dialog', function (event, option) {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }, function (files) {
            if (files) event.sender.send('selected-directory', files)
        })
    });

    //选择目录
    ipcMain.on('choiceFolder', function (event, option) {
        dialog.showOpenDialog(option, function (files) {
            if (files) event.sender.send('choiceFolder', files)
        })
    });

    //下载文件
    ipcMain.on('downloadFile', function (event, file, option) {
        option.onItemProgress = function (num, item) {
            event.sender.send('updateDownloadProgress', num, item.getURL().split('?')[0], null);
        };

        console.log('downloadFIle', option);
        download(BrowserWindow.getFocusedWindow(), file, option)
            .then(dl => {
                if (dl.getURL() !== file) return;
                console.log('getSavePath:' + dl.getSavePath());
                event.sender.send('updateDownloadProgress', 1, file.split('?')[0], null);
            })
            .catch(error => {
                if (dl.getURL() !== file) return;
                console.error(error);
                event.sender.send('updateDownloadProgress', 1, file.split('?')[0], error);
            });
    });

    /*    ipcMain.on('previewFile', function (event, filePath) {
            if (mainWindow) {
                mainWindow.previewFile(filePath);
            }
        });*/
};

/**
 * 注册菜单
 * @returns {[*,*,*,*]}
 */
const getMenuData = function () {
    const template = [
        {
            label: '修改',
            submenu: [
                {role: 'undo'},
                {role: 'redo'},
                {type: 'separator'},
                {role: 'cut'},
                {role: 'copy'},
                {role: 'paste'},
                {role: 'pasteandmatchstyle'},
                {role: 'delete'},
                {role: 'selectall'}
            ]
        },
        {
            label: '视图',
            submenu: [
                {
                    label: '重新加载',
                    click() {
                        if (mainWindow) {
                            mainWindow.loadURL(util.winURL);
                        }
                    }
                },
                {role: 'forcereload'},
                {role: 'toggledevtools'},
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            label: '窗口',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            label: '帮助',
            submenu: [
                {
                    label: '关于项目',
                    click() {
                        require('electron').shell.openExternal('https://github.com/willnewii/qiniuClient')
                    }
                },
                {
                    label: '提交异常或需求',
                    click() {
                        require('electron').shell.openExternal('https://github.com/willnewii/qiniuClient/issues')
                    }
                }
            ]
        }
    ];

    if (process.platform === 'darwin') {
        template.unshift({
            label: app.getName(),
            submenu: [
                {role: 'about'},
                {type: 'separator'},
                {role: 'services', submenu: []},
                {type: 'separator'},
                {role: 'hide'},
                {role: 'hideothers'},
                {role: 'unhide'},
                {type: 'separator'},
                {role: 'quit'}
            ]
        })

        /*        // Edit menu
                template[1].submenu.push(
                    {type: 'separator'},
                    {
                        label: 'Speech',
                        submenu: [
                            {role: 'startspeaking'},
                            {role: 'stopspeaking'}
                        ]
                    }
                )*/

        // Window menu
        template[3].submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ]
    }
    return template;
};

