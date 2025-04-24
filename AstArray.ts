import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@typescript-eslint/typescript-estree';
import estraverse from 'estraverse';
import { default as babelGenerator } from '@babel/generator';
import * as t from '@babel/types';
import axios from 'axios';
import crypto from 'crypto';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
// Get the current directory path
const __dirname = path.dirname(__filename);

// Baidu Translation API configuration
const BAIDU_TRANSLATE_APPID = '20201102000606019'; // Replace with your appid
const BAIDU_TRANSLATE_SECRET_KEY = 'KKD18Jfy5_ooBMqyoXOH'; // Replace with your secret key
const BAIDU_TRANSLATE_API_URL = 'http://api.fanyi.baidu.com/api/trans/vip/translate';

// Delay function
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Request queue related type definition
type TranslationTask = {
    text: string;
    resolve: (value: string) => void;
};

// Request queue
const translationQueue: TranslationTask[] = [];
let isProcessingQueue = false;

/**
 * Process the translation request queue
 */
async function processTranslationQueue() {
    if (isProcessingQueue || translationQueue.length === 0) return;
    isProcessingQueue = true;

    while (translationQueue.length > 0) {
        const { text, resolve } = translationQueue.shift()!;
        try {
            const result = await translateTextWithBaiduAPI(text);
            resolve(result);
        } catch (error) {
            console.error(`Error translating ${text}:`, error);
            resolve(text);
        }
        // Add a delay after each request
        await delay(1000);
    }

    isProcessingQueue = false;
}

/**
 * Translate a single text using Baidu Translation API
 * @param text Chinese text to be translated
 * @returns Translated English text
 */
async function translateTextWithBaiduAPI(text: string): Promise<string> {
    const salt = Date.now();
    const sign = BAIDU_TRANSLATE_APPID + text + salt + BAIDU_TRANSLATE_SECRET_KEY;
    const md5 = crypto.createHash('md5').update(sign).digest('hex');

    const response = await axios.get(BAIDU_TRANSLATE_API_URL, {
        params: {
            q: text,
            from: 'zh',
            to: 'en',
            appid: BAIDU_TRANSLATE_APPID,
            salt,
            sign: md5
        }
    });

    if (response.data && response.data.trans_result) {
        console.log(`Translation successful: ${text} -> ${response.data.trans_result[0].dst}`);
        return response.data.trans_result[0].dst;
    } else {
        console.warn(`No translation result obtained, original text: ${text}, response data:`, response.data);
        return text;
    }
}

/**
 * Exposed translation function, adds the request to the queue
 * @param text Chinese text to be translated
 * @returns Translated English text
 */
async function translateChineseToEnglish(text: string): Promise<string> {
    return new Promise<string>((resolve) => {
        translationQueue.push({ text, resolve });
        processTranslationQueue();
    });
}

/**
 * Convert any node to a Babel node
 * @param node Node to be converted
 * @returns Converted Babel node
 */
function convertToBabelNode(node: any): any {
    if (Array.isArray(node)) {
        return node.map(convertToBabelNode);
    }
    if (node && typeof node === 'object') {
        switch (node.type) {
            case 'ObjectExpression':
                const properties = node.properties.map(convertToBabelNode);
                return t.objectExpression(properties);
            case 'Property':
                const key = convertToBabelNode(node.key);
                const value = convertToBabelNode(node.value);
                return t.objectProperty(key, value);
            case 'Identifier':
                return t.identifier(node.name);
            case 'Literal':
                return t.valueToNode(node.value);
            default:
                const newNode: any = {};
                for (const [key, value] of Object.entries(node)) {
                    newNode[key] = convertToBabelNode(value);
                }
                return newNode;
        }
    }
    return node;
}

/**
 * Process a TypeScript file
 * @param inputFilePath Input file path
 * @param outputFilePath Output file path
 * @param targetObjectName Target object name to find
 */
async function processTypeScriptFile(inputFilePath: string, outputFilePath: string, targetObjectName: string) {
    try {
        // Read file content
        const fileContent = await new Promise<string>((resolve, reject) => {
            fs.readFile(inputFilePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });

        // Parse to AST
        const ast = parse(fileContent, {
            sourceType: 'module',
            ecmaVersion: 2020
        });

        let foundObject: any = null;
        // Define properties of the new object
        const newObjectProperties: any[] = [];

        // Traverse the AST to find the target object
        estraverse.traverse(ast, {
            enter: function (node: any) {
                if (node.type === 'VariableDeclarator' && node.id.name === targetObjectName) {
                    foundObject = node.init;
                    this.break();
                }
            }
        });

        if (foundObject) {
            // Simplify each object in the array, changing only the label property value
            const processElement = async (element: any) => {
                const newProperties: any[] = [];
                let labelPropertyIndex = -1;

                // 遍历元素的所有属性
                for (let i = 0; i < element.properties.length; i++) {
                    const prop = element.properties[i];
                    if (prop.key.name === 'label') {
                        labelPropertyIndex = i;
                        // 当前属性值
                        const chineseText = prop.value.value;
                        // 翻译当前值
                        const englishText = await translateChineseToEnglish(chineseText);
                        // 生成新的值
                        const newKey = `workspace.system_keyboard_${englishText.replace(/\s+/g, '_')}`;
                        const newLabelValue = t.valueToNode(newKey);
                        newProperties.push(t.objectProperty(prop.key, newLabelValue));

                        // 收集到 newObjectProperties 中
                        const valueNode = t.valueToNode(prop.value.value);
                        // 修改此处，使用 t.stringLiteral 来让属性键带双引号
                        newObjectProperties.push(
                            // 生成js属性值
                            // t.objectProperty(t.identifier(newKey), valueNode)
                            // 生成带引号的属性字符
                            t.objectProperty(t.stringLiteral(newKey), valueNode)
                        );
                    } else {
                        newProperties.push(convertToBabelNode(prop));
                    }
                }

                // 如果没有找到 label 属性，直接返回原元素的转换结果
                if (labelPropertyIndex === -1) {
                    return convertToBabelNode(element);
                }

                return t.objectExpression(newProperties);
            };

            foundObject.elements = await Promise.all(foundObject.elements.map(processElement));

            // Create a new object node
            const newObject = t.objectExpression(newObjectProperties);

            // Create a new variable declaration node
            const newVariableDeclaration = t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier('newIndependentObject'), newObject)
            ]);

            // Add the new variable declaration node to the body of the AST
            ast.body.push(newVariableDeclaration);

            // Convert the modified AST back to code
            const generatorResult = babelGenerator.default ? babelGenerator.default(ast, {
                jsescOption: {
                    minimal: true // Ensure Unicode escape sequences are converted to corresponding characters
                }
            }) : babelGenerator(ast, {
                jsescOption: {
                    minimal: true // Ensure Unicode escape sequences are converted to corresponding characters
                }
            });

            const newCode = generatorResult.code;

            // Save the modified content to the file
            await new Promise<void>((resolve, reject) => {
                fs.writeFile(outputFilePath, newCode, 'utf8', (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            });

            console.log('File saved successfully');
        }
    } catch (error) {
        console.error('An error occurred during processing:', error);
    }
}

// Main program entry
function main() {
    // Processed/output file name
    const fileName = 'example.ts';
    // TypeScript file path to be processed
    const inputFilePath = path.join(__dirname, 'source', fileName);
    const outputFilePath = path.join(__dirname, 'dist', fileName);
    // Object name to find
    const targetObjectName = 'defaultOptions';

    processTypeScriptFile(inputFilePath, outputFilePath, targetObjectName);
}

// Start the program
main();