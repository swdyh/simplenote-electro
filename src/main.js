const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')
const ipcMain = electron.ipcMain
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 950,
        height: 600,
        titleBarStyle: 'hidden',
        show: false
    })
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))
    mainWindow.on('closed', () => mainWindow = null)
    mainWindow.on('moved', () => {
        mainWindow.webContents.send('window-moved', mainWindow.getBounds())
    })
    mainWindow.on('resize', () => {
        mainWindow.webContents.send('window-resize', mainWindow.getBounds())
    })
    ipcMain.on('initial-config', (event, arg) => {
        checkMenu(arg.font)
        checkMenu(arg.theme)
        if (arg.bounds) {
            mainWindow.setBounds(arg.bounds)
        }
        mainWindow.show()
    })
}

function findMenu(id, menu) {
    if (menu && menu.id == id) {
        return menu
    }
    let items = []
    if (!menu) {
        items = electron.Menu.getApplicationMenu().items
    }
    else if (menu.submenu && menu.submenu.items) {
        items = menu.submenu.items
    }
    for (var i = 0; i < items.length; i++) {
        let r = findMenu(id, items[i])
        if (r) {
            return r
        }
    }
}

function checkMenu(id) {
    let menu = id && findMenu(id)
    if (menu) {
        menu.checked = true
    }
}

function fontSubMenu() {
    const fonts = ['Default', 'Serif', 'YuGothic', 'Menlo']
    return fonts.map((fontName) => {
        const id = 'font_' + fontName.toLowerCase()
        return {
            id: id,
            label: fontName,
            type: 'radio',
            click () { mainWindow.webContents.send('update-font', id) }
        }
    })
}

function themeSubMenu() {
    const themes = ['Default', 'Night', 'Solarized']
    return themes.map((themeName) => {
        const id = 'theme_' + themeName.toLowerCase()
        return {
            id: id,
            label: themeName,
            type: 'radio',
            click () { mainWindow.webContents.send('update-theme', id) }
        }
    })
}

function setupMenu() {
    const Menu = electron.Menu
    const template = [
        {
            label: 'Edit',
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
            label: 'View',
            submenu: [
                {role: 'reload'},
                {role: 'forcereload'},
                {role: 'toggledevtools'},
                {
                    label: 'Toggle Developer Tools (Webview)',
                    click () { mainWindow.webContents.send('open-dev-tool') },
                    accelerator: 'Alt+Cmd+J'
                },
                {type: 'separator'},
                {role: 'resetzoom'},
                {role: 'zoomin'},
                {role: 'zoomout'},
                {type: 'separator'},
                {role: 'togglefullscreen'}
            ]
        },
        {
            role: 'window',
            submenu: [
                {role: 'minimize'},
                {role: 'close'}
            ]
        },
        {
            label: 'Style',
            submenu: [
                { label: 'Font', submenu: fontSubMenu() },
                { label: 'Theme', submenu: themeSubMenu() }
            ]
        },
        {
            label: 'Tool',
            submenu: [
                {
                    label: 'Toggle SideMenu',
                    accelerator: 'Cmd+b',
                    click () { mainWindow.webContents.send('toggle') },
                },
                {
                    label: 'New Note',
                    accelerator: 'Cmd+n',
                    click () { mainWindow.webContents.send('addnote') }
                },
                {
                    label: 'Delete Note',
                    click () { mainWindow.webContents.send('deletenote') },
                },
                {
                    label: 'Search',
                    accelerator: 'Cmd+f',
                    click () { mainWindow.webContents.send('search') }
                },
                {
                    label: 'Stop Search',
                    accelerator: 'ESC',
                    click () { mainWindow.webContents.send('search-stop') }
                },
                {
                    label: 'Next Note',
                    accelerator: 'Cmd+Shift+n',
                    click () { mainWindow.webContents.send('next-note') }
                },
                {
                    label: 'Prev Note',
                    accelerator: 'Cmd+Shift+p',
                    click () { mainWindow.webContents.send('prev-note') }
                },
                {type: 'separator'},
                {
                     label: 'Sign Out',
                     click () { mainWindow.webContents.send('signout') }
                }
            ]
        }
    ]
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
        template[3].submenu = [
            {role: 'close'},
            {role: 'minimize'},
            {role: 'zoom'},
            {type: 'separator'},
            {role: 'front'}
        ]
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.on('window-all-closed', () => app.quit())

app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
  }
})

app.on('ready', () => {
    createWindow()
    setupMenu()
})
