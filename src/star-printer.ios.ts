import { ImageSource } from "@nativescript/core";

import { PrinterFont, PrinterOnlineStatus, PrinterPaperStatus, SPBarcodeCommand, SPCommandsCommon, SPConnectOptions, SPConnectResult, SPDisconnectOptions, SPGetPrinterStatusOptions, SPOpenCashDrawerOptions, SPPrinter, SPPrinterStatusResult, SPPrintOptions, SPSearchPrinterOptions, SPToggleAutoConnectOptions, StarPrinterApi } from "./star-printer.common";

/**
 * Doc: http://www.starmicronics.com/support/Mannualfolder/linemode_cm_en.pdf
 *
 * Note that there's a command builder for iOS as well,
 * but not everything is exposed to the metadata, so we're not using that.
 */
export class SPCommands extends SPCommandsCommon {
  private static CODEPAGE_UTF8: Array<number> = [0x1b, 0x1d, 0x74, 0x80];
  private static CODEPAGE_WINDOWSCP1252: Array<number> = [0x1b, 0x1d, 0x74, 0x04];

  private _commands: any;
  private activeCodePage: Array<number> = SPCommands.CODEPAGE_UTF8;
  private activeEncoding = NSUTF8StringEncoding;

  constructor() {
    super();
    this._commands = NSMutableData.data();
    this.resetCodepage();
    return this;
  }

  private resetCodepage(): void {
    this.appendBytes(this.activeCodePage);
  }

  setCodepageUTF8(): SPCommandsCommon {
    this.activeEncoding = NSUTF8StringEncoding;
    this.activeCodePage = SPCommands.CODEPAGE_UTF8;
    return this.appendBytes(this.activeCodePage);
  }

  setCodepageWindowsCP1252(): SPCommandsCommon {
    this.activeEncoding = NSWindowsCP1252StringEncoding;
    this.activeCodePage = SPCommands.CODEPAGE_WINDOWSCP1252;
    return this.appendBytes(this.activeCodePage);
  }

  setCodepage(codePage: Array<number>): SPCommandsCommon {
    this.activeCodePage = codePage;
    return this.appendBytes(codePage);
  }

  setFont(font: PrinterFont): SPCommandsCommon {
    if (font === "default") {
      return this.appendBytes([0x1b, 0x1e, 0x46, 0x00]);
    } else {
      return this.appendBytes([0x1b, 0x1e, 0x46, 0x01]);
    }
  }

  text(value: string): SPCommandsCommon {
    return this.appendData(value);
  }

  textUnderlined(value: string): SPCommandsCommon {
    this.appendBytes([0x1b, 0x2d, 0x01]); // start underline
    this.text(value);
    this.appendBytes([0x1b, 0x2d, 0x00]); // stop underline
    return this;
  }

  textBold(value: string): SPCommandsCommon {
    this.appendBytes([0x1b, 0x45]);
    this.text(value);
    this.appendBytes([0x1b, 0x46]);
    return this;
  }

  textLarge(value: string): SPCommandsCommon {
    this.appendBytes([0x1b, 0x69, 0x01, 0x01]);
    this.text(value);
    this.appendBytes([0x1b, 0x69, 0x00, 0x00]);
    return this;
  }

  textLargeBold(value: string): SPCommandsCommon {
    this.appendBytes([0x1b, 0x69, 0x01, 0x01]);
    this.appendBytes([0x1b, 0x45]);
    this.text(value);
    this.appendBytes([0x1b, 0x46]);
    this.appendBytes([0x1b, 0x69, 0x00, 0x00]);
    return this;
  }

  alignCenter(): SPCommandsCommon {
    this.appendBytes([0x1b, 0x1d, 0x61, 0x01]);
    return this;
  }

  alignLeft(): SPCommandsCommon {
    this.appendBytes([0x1b, 0x1d, 0x61, 0x00]);
    return this;
  }

  newLine(): SPCommandsCommon {
    return this.appendData("\r\n");
  }

  barcode(options: SPBarcodeCommand): SPCommandsCommon {
    const code128 = 0x06; // according to page 61 of http://www.starmicronics.com/support/Mannualfolder/starline_cm_en.pdf
    const appendEncodedValue = +('0x0' + (options.appendEncodedValue === false ? 1 : 2));
    const height = +('0x' + options.height ? options.height : 40);
    const mode = +('0x0' + (!options.width || options.width === "medium" ? 2 : (options.width === "large" ? 3 : 1)));

    this.appendBytes([0x1b, 0x62, code128, appendEncodedValue, mode, height]);
    this.appendData(options.value);
    this.appendBytes([0x1e]);
    return this;
  }

  image(imageSource: ImageSource, diffuse?: boolean, alignCenter?: boolean): SPCommandsCommon {
    const imageData = TNSStarPrinter.getBitmapCommandWithDiffusionAndCenterAlignment(imageSource.ios, diffuse !== false, alignCenter !== false);
    this._commands.appendData(imageData);

    // reset codepage because the image alters it
    this.resetCodepage();
    return this;
  }

  imagePositioned(imageSource: ImageSource, width: number, position: number, bothScale?: boolean, diffuse?: boolean, alignCenter?: boolean): SPCommandsCommon {
    const imageData = TNSStarPrinter.getBitmapWithFixedWidthCommandWithDiffusionAndCenterAlignmentAndWidthAndBothScaleAndPosition(imageSource.ios, diffuse !== false, alignCenter !== false, width, bothScale !== false, position);
    this._commands.appendData(imageData);

    // reset codepage because the image alters it
    this.resetCodepage();
    return this;
  }

  cutPaper(): SPCommandsCommon {
    return this.appendBytes([0x1b, 0x64, 0x03]);
  }

  private appendData(text: string): SPCommandsCommon {
    this._commands.appendData(NSString.stringWithString(text).dataUsingEncoding(this.activeEncoding));
    return this;
  }

  private appendBytes(numbers: Array<number>): SPCommandsCommon {
    let what = new Uint8Array(numbers);
    this._commands.appendBytesLength(what.buffer, what.length);
    return this;
  }

  getCommands() {
    return this._commands;
  }
}

export class StarPrinter implements StarPrinterApi {

  private initStarPrinter(portName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // note that the native lib caches the connection, so this is very quick the second time
      this.connect({portName}).then(result => resolve(result.connected));
    });
  }

  searchPrinters(options?: SPSearchPrinterOptions): Promise<Array<SPPrinter>> {
    return new Promise((resolve, reject) => {
      TNSStarPrinter.searchPrinters((starPrinters: any) => {
        let printers: Array<SPPrinter> = [];
        for (let i = 0; i < starPrinters.count; i++) {
          let starPrinter = starPrinters.objectAtIndex(i);
          printers.push(new SPPrinter(
              // could add constants to the lib and use those instead of these strings
              starPrinter.objectForKey("portName"),
              starPrinter.objectForKey("modelName")));
        }
        resolve(printers);
      });
    });
  }

  print(options: SPPrintOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.initStarPrinter(options.portName).then((connected: boolean) => {
          if (!connected) {
            reject("Not connected");
            return;
          }

          TNSStarPrinter.sendCommandsToPortOnComplete(options.commands.getCommands(), options.portName, (error: string) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  connect(options: SPConnectOptions): Promise<SPConnectResult> {
    return new Promise((resolve, reject) => {
      try {
        // Note that non-LE Bluetooth devices need to be connected through a picker of EAAccessoryManager,
        // which is not implemented at the moment. Workaround: go to settings > Bluetooth and connect the device.
        TNSStarPrinter.connectOnComplete(options.portName, (result: NSDictionary<NSString, any>) => {
          resolve({
            connected: result.valueForKey("connected"),
            online: <PrinterOnlineStatus>result.valueForKey("onlineStatus") === "ONLINE",
            onlineStatus: <PrinterOnlineStatus>result.valueForKey("onlineStatus"),
            paperStatus: <PrinterPaperStatus>result.valueForKey("paperStatus")
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  getPrinterStatus(options: SPGetPrinterStatusOptions): Promise<SPPrinterStatusResult> {
    return new Promise((resolve, reject) => {
      try {
        (<any>TNSStarPrinter).getPrinterStatusOnComplete(options.portName, (result: NSDictionary<NSString, any>) => {
          resolve({
            online: <PrinterOnlineStatus>result.valueForKey("onlineStatus") === "ONLINE",
            onlineStatus: <PrinterOnlineStatus>result.valueForKey("onlineStatus"),
            paperStatus: <PrinterPaperStatus>result.valueForKey("paperStatus")
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect(options: SPDisconnectOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        TNSStarPrinter.disconnectOnComplete(options.portName, (disconnected: boolean) => resolve(disconnected));
      } catch (e) {
        reject(e);
      }
    });
  }

  toggleAutoConnect(options: SPToggleAutoConnectOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        TNSStarPrinter.toggleAutoConnectEnableOnComplete(options.portName, options.autoConnect, (error: NSString) => {
          if (error === null) {
            resolve(true);
          } else {
            reject(error);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  openCashDrawer(options: SPOpenCashDrawerOptions): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.initStarPrinter(options.portName).then((connected: boolean) => {
          if (!connected) {
            reject("Not connected");
            return;
          }

          let commands: any = NSMutableData.data();
          let openDrawerCommand = new Uint8Array([0x07]);
          commands.appendBytesLength(openDrawerCommand.buffer, openDrawerCommand.length);

          TNSStarPrinter.sendCommandsToPortOnComplete(commands, options.portName, (error: string) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  // Note: could expose this as a property and read these stats (not for v1 though)
  //  console.log("cash drawer open? " + _starIoExtManager.cashDrawerOpenStatus);
  //  console.log("barcode reader connected? " + _starIoExtManager.barcodeReaderConnectStatus);
  //  console.log("printer cover open status " + _starIoExtManager.printerCoverOpenStatus);
  //  console.log("printer online status " + _starIoExtManager.printerOnlineStatus);
  //  console.log("printer paper ready status " + _starIoExtManager.printerPaperReadyStatus);

  // private columnSeparator(commands: any): void {
  //   this.enableColumns(commands); // needs to be done once actually
  //   this.appendBytes(commands, [0x09]);
  // }

  // private writeColumns(commands: any, columnTexts: Array<string>): void {
  //   this.enableColumns(commands);
  //   columnTexts.forEach((text: string, index: number) => {
  //     this.write(commands, text);
  //     if (index < columnTexts.length - 1) {
  //       this.columnSeparator(commands);
  //     }
  //   });
  // }

  // private enableColumns(commands: any): void {
  //   this.appendBytes(commands, [0x1b, 0x44, 0x02, 0x10, 0x22, 0x00]);
  // }
}

/*
 class StarIoExtManagerDelegateImpl extends NSObject {
 public static ObjCProtocols = [StarIoExtManagerDelegate];

 private _owner: WeakRef<any>;

 static new(): StarIoExtManagerDelegateImpl {
 return <StarIoExtManagerDelegateImpl>super.new();
 }

 public static initWithOwner(owner: WeakRef<any>): StarIoExtManagerDelegateImpl {
 let delegate = <StarIoExtManagerDelegateImpl>StarIoExtManagerDelegateImpl.new();
 delegate._owner = owner;
 return delegate;
 }

 public didCashDrawerClose(): void {
 console.log("delegate: didCashDrawerClose @ " + new Date().getTime());
 }

 public didCashDrawerOpen(): void {
 console.log("delegate: didCashDrawerOpen @ " + new Date().getTime());
 }

 public didPrinterCoverClose(): void {
 console.log("delegate: didPrinterCoverClose @ " + new Date().getTime());
 }

 public didPrinterCoverOpen(): void {
 console.log("delegate: didPrinterCoverOpen @ " + new Date().getTime());
 }

 public didPrinterPaperEmpty(): void {
 console.log("delegate: didPrinterPaperEmpty @ " + new Date().getTime());
 }

 public didPrinterPaperNearEmpty(): void {
 console.log("delegate: didPrinterPaperNearEmpty @ " + new Date().getTime());
 }

 public didPrinterPaperReady(): void {
 console.log("delegate: didPrinterPaperReady @ " + new Date().getTime());
 }
 }
 */
