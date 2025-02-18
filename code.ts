// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__, { width: 280, height: 480 });

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
  invoice: boolean;
  options: {
    dateFormat: 'date' | 'datetime';
    showPortCode: boolean;
    portCase: 'upper' | 'title';
  };
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

function generateDate(format: 'date' | 'datetime'): string {
  const start: Date = new Date(2024, 0, 1);
  const end: Date = new Date(2024, 11, 31);
  const randomDate: Date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  // 格式化日期部分
  const year = randomDate.getFullYear();
  const month = String(randomDate.getMonth() + 1).padStart(2, '0');
  const day = String(randomDate.getDate()).padStart(2, '0');
  const dateStr = `${month}-${day}-${year}`;
  
  if (format === 'datetime') {
    // 格式化時間部分
    const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
    const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}`;
  }
  
  return dateStr;
}

function formatPort(port: string, showCode: boolean, caseFormat: 'upper' | 'title'): string {
  // 先分離城市名稱和代碼
  const [cityPart, codePart] = port.split(' (');
  
  // 處理城市名稱的格式
  let formattedCity = caseFormat === 'upper' ? 
    cityPart : 
    cityPart.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  
  // 如果不需要顯示代碼，直接返回格式化後的城市名稱
  if (!showCode) {
    return formattedCity;
  }
  
  // 返回完整格式（包含代碼）
  return `${formattedCity} (${codePart}`;
}

function generateInvoice(): string {
  const digits = Math.floor(6 + Math.random() * 3); // 生成 6-8 位數
  const number = String(Math.floor(Math.pow(10, digits - 1) + Math.random() * Math.pow(10, digits))).padStart(digits, '0');
  return `INV-${number}`;
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
            const randomPort = ports[Math.floor(Math.random() * ports.length)];
            newText = formatPort(
              randomPort, 
              selections.options.showPortCode,
              selections.options.portCase
            );
          } else if (selections.date) {
            newText = generateDate(selections.options.dateFormat);
          } else if (selections.po) {
            newText = generatePO();
          } else if (selections.carrier) {
            newText = generateCarrier();
          } else if (selections.invoice) {
            newText = generateInvoice();
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
