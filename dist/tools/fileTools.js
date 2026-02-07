"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITE_FILE = exports.READ_FILE = exports.LIST_DIR = void 0;
//const fsManager = new FileSystemManager();
const LIST_DIR = async (fsManager, { path }) => {
    try {
        const files = await fsManager.listFiles(path);
        return {
            content: [{
                    type: "text",
                    text: files.length > 0 ? files.join('\n') : '(empty directory)'
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error listing directory: ${error.message}`
                }]
        };
    }
};
exports.LIST_DIR = LIST_DIR;
const READ_FILE = async (fsManager, { path }) => {
    try {
        const file = await fsManager.readFile(path);
        return {
            content: [{
                    type: "text",
                    text: file
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error reading file: ${error.message}`
                }]
        };
    }
};
exports.READ_FILE = READ_FILE;
const WRITE_FILE = async (fsManager, { path, content }) => {
    try {
        const message = await fsManager.writeFile(path, content);
        return {
            content: [{
                    type: "text",
                    text: message
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error writing file: ${error.message}`
                }]
        };
    }
};
exports.WRITE_FILE = WRITE_FILE;
