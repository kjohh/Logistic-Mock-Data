// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 240, height: 320 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
const ports: string[] = [
  'HONG KONG (HKG)',
  'SHANGHAI (SHA)',
  'SINGAPORE (SIN)',
  'BUSAN (PUS)',
  'KAOHSIUNG (KHH)',
  'TOKYO (TYO)',
  'LOS ANGELES (LAX)',
  'ROTTERDAM (RTM)'
];

interface SelectionOptions {
  hbl: boolean;
  mbl: boolean;
  container: boolean;
  port: boolean;
  date: boolean;
  po: boolean;
  carrier: boolean;
}

interface PluginMessage {
  type: 'generate';
  selections: SelectionOptions;
}

const hblPrefixes: string[] = [
  'HKGL', 'SGGL', 'CNGL', 'JPGL', 'KRGL', 'TWGL',
  'HLCU', 'COSU', 'MAEU', 'OOLU', 'MSCU'
];

const carriers: string[] = [
  'COSCO SHIPPING Lines',
  'MAERSK LINE',
  'MSC',
  'CMA CGM',
  'HAPAG-LLOYD',
  'OOCL',
  'EVERGREEN LINE',
  'ONE'
];

// MBL前綴使用 SCAC Code (Standard Carrier Alpha Code)
const mblPrefixes: string[] = [
  'COSU', // COSCO
  'MAEU', // MAERSK
  'MSCU', // MSC
  'CMDU', // CMA CGM
  'HLCU', // HAPAG-LLOYD
  'OOLU', // OOCL
  'EGLV', // EVERGREEN
  'ONEY'  // ONE
];

function generateHBL(): string {
  const prefix: string = hblPrefixes[Math.floor(Math.random() * hblPrefixes.length)];
  const number: string = String(Math.floor(10000000 + Math.random() * 90000000));
  return `${prefix}${number}`;
}

function generateMBL(): string {
  const prefix: string = mblPrefixes[Math.floor(Math.random() * mblPrefixes.length)];
  const number: string = String(Math.floor(100000000 + Math.random() * 900000000));
  return `${prefix}${number}`;
}

function generatePO(): string {
  const prefix: string = ['PO', 'P/O', ''][Math.floor(Math.random() * 3)];
  const number: string = String(Math.floor(1000000 + Math.random() * 9000000));
  return prefix ? `${prefix}${number}` : number;
}

function generateCarrier(): string {
  return carriers[Math.floor(Math.random() * carriers.length)];
}

function generateContainer(): string {
  const prefix: string = ['CMAU', 'OOLU', 'MAEU', 'MSCU'][Math.floor(Math.random() * 4)];
  const number: string = String(Math.floor(100000 + Math.random() * 900000));
  const checkDigit: number = Math.floor(Math.random() * 10);
  return `${prefix}${number}${checkDigit}`;
}

function generateDate(): string {
  const start: Date = new Date(2024, 0, 1);
  const end: Date = new Date(2024, 11, 31);
  const randomDate: Date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'generate') {
    const selections = msg.selections;
    let nodes: SceneNode[] = [...figma.currentPage.selection];

    try {
      // 如果沒有選擇任何圖層，創建新的文字圖層
      if (nodes.length === 0) {
        const text = figma.createText();
        // 設置文字圖層位置在視窗中心
        const center = figma.viewport.center;
        text.x = center.x;
        text.y = center.y;
        
        // 載入預設字體
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        nodes = [text];
      }

      // 載入所有需要的字體
      for (const node of nodes) {
        if (node.type === 'TEXT') {
          const fontName = node.fontName;
          if (fontName !== figma.mixed) {
            await figma.loadFontAsync(fontName);
          }
        }
      }

      for (const node of nodes) {
        if (node.type === 'TEXT') {
          let newText: string = '';
          
          if (selections.hbl) {
            newText = generateHBL();
          } else if (selections.mbl) {
            newText = generateMBL();
          } else if (selections.container) {
            newText = generateContainer();
          } else if (selections.port) {
            newText = ports[Math.floor(Math.random() * ports.length)];
          } else if (selections.date) {
            newText = generateDate();
          } else if (selections.po) {
            newText = generatePO();
          } else if (selections.carrier) {
            newText = generateCarrier();
          }
          
          node.characters = newText;
        }
      }
      
      figma.notify('假資料已生成！');
      
      // 如果是新創建的文字圖層，選中它
      if (figma.currentPage.selection.length === 0) {
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      figma.notify('生成過程中發生錯誤：' + errorMessage);
      console.error(error);
    }
  }

  // 將關閉插件的操作移到UI中控制，這裡先註釋掉
  // figma.closePlugin();
};
