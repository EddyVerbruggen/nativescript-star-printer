import * as utils from "utils/utils";
import {
  SPCommandsCommon,
  SPConnectOptions,
  SPOpenCashDrawerOptions,
  SPPrinter,
  SPPrintOptions,
  SPSearchPrinterOptions,
  StarPrinterApi
} from "./star-printer.common";

declare let com: any;
const StarIOPort: any = com.starmicronics.stario.StarIOPort;
const ICommandBuilder: any = com.starmicronics.starioextension.ICommandBuilder;

export class SPCommands extends SPCommandsCommon {
  private builder: any;
  private encoding: any;

  constructor() {
    super();
    this.builder = SPCommands.getBuilder();
    this.encoding = java.nio.charset.Charset.forName("UTF-8");
    return this;
  }

  static getBuilder(): void {
    let builder = com.starmicronics.starioextension.StarIoExt.createCommandBuilder(
        com.starmicronics.starioextension.StarIoExt.Emulation.None);
    builder.beginDocument();
    builder.appendCodePage(ICommandBuilder.CodePageType.UTF8);
    builder.appendInternational(ICommandBuilder.InternationalType.USA);
    return builder;
  }

  text(value: string): SPCommandsCommon {
    this.builder.append(this.getEncodedString(value));
    return this;
  }

  textUnderlined(value: string): SPCommandsCommon {
    this.builder.appendUnderLine(this.getEncodedString(value));
    return this;
  }

  textBold(value: string): SPCommandsCommon {
    this.builder.appendEmphasis(this.getEncodedString(value));
    return this;
  }

  textLarge(value: string): SPCommandsCommon {
    this.builder.appendMultiple(this.getEncodedString(value), 2, 2);
    return this;
  }

  newLine(): SPCommandsCommon {
    this.builder.appendLineFeed();
    return this;
  }

  cutPaper(): SPCommandsCommon {
    this.builder.appendCutPaper(ICommandBuilder.CutPaperAction.PartialCutWithFeed);
    return this;
  }

  alignCenter(): SPCommandsCommon {
    this.builder.appendAlignment(ICommandBuilder.AlignmentPosition.Center);
    return this;
  }

  alignLeft(): SPCommandsCommon {
    this.builder.appendAlignment(ICommandBuilder.AlignmentPosition.Left);
    return this;
  }

  getCommands() {
    this.builder.endDocument();
    return this.builder.getCommands();
  }

  private getEncodedString(value: string): any {
    return new java.lang.String(value).getBytes(this.encoding);
  }
}

export class StarPrinter implements StarPrinterApi {

  searchPrinters(options?: SPSearchPrinterOptions): Promise<Array<SPPrinter>> {
    return new Promise((resolve, reject) => {
      let starPrinters = StarIOPort.searchPrinter("BT:"); // TODO TCP: etc, based on options
      console.log(starPrinters);
      let printers: Array<SPPrinter> = [];
      for (let i = 0; i < starPrinters.size(); i++) {
        let starPrinter = starPrinters.get(i);
        printers.push(new SPPrinter(starPrinter.getPortName(), starPrinter.getModelName()));
      }
      resolve(printers);
    });
  }

  print(options: SPPrintOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      let port = StarIOPort.getPort(options.portName, "", 10000, utils.ad.getApplicationContext());
      if (port === null) {
        console.log("no port");
        reject("no port");
        return;
      }

      // not sure this timeout is needed, but it doesn't hurt either
      setTimeout(() => {
        let printerStatus = port.beginCheckedBlock();

        if (printerStatus.offline) {
          reject("printer offline");
          return;
        }

        let commands = options.commands.getCommands();
        port.writePort(commands, 0, commands.length);
        port.setEndCheckedBlockTimeoutMillis(10000);
        printerStatus = port.endCheckedBlock();

        if (printerStatus.coverOpen) {
          reject("Printer cover is open");
        } else if (printerStatus.receiptPaperEmpty) {
          reject("Receipt paper is empty");
        } else if (printerStatus.offline) {
          reject("Printer is offline");
        } else {
          // assuming..
          console.log("Printer success!");
          resolve();
        }
      }, 100);
    });
  }

  connect(options: SPConnectOptions): Promise<boolean> {
    // TODO not sure we need to anyway
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  openCashDrawer(options: SPOpenCashDrawerOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // TODO
        // this.initStarPrinter("BT:Star Micronics");
        // let commands: any = NSMutableData.data();
        // this.appendBytes(commands, [0x07]); // ?
        // this.openDrawer(commands);
        // this.sendCommandsToPrinter(commands);
        resolve();
      } catch (e) {
        console.log("---- caught e: " + e);
        reject(e);
      }
    });
  }
}