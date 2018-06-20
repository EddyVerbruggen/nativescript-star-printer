import {ImageSource} from "tns-core-modules/image-source";
import * as utils from "tns-core-modules/utils/utils";
import {
  PrinterFont,
  SPBarcodeCommand,
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

/**
 * Doc: http://www.starmicronics.com/support/SDKDocumentation.aspx
 */
export class SPCommands extends SPCommandsCommon {
  private builder: any;
  private encoding: any;

  constructor() {
    super();
    this.builder = SPCommands.getBuilder();
    this.encoding = java.nio.charset.Charset.forName("UTF-8");
    return this;
  }

  private static getBuilder(): void {
    let builder = com.starmicronics.starioextension.StarIoExt.createCommandBuilder(
        com.starmicronics.starioextension.StarIoExt.Emulation.None);
    builder.beginDocument();
    builder.appendCodePage(ICommandBuilder.CodePageType.UTF8);
    builder.appendInternational(ICommandBuilder.InternationalType.USA);
    return builder;
  }

  raw(value: any): SPCommandsCommon {
    this.builder.append(value);
    return this;
  }

  setFont(font: PrinterFont): SPCommandsCommon {
    this.builder.appendFontStyle(font === "default" ? ICommandBuilder.FontStyleType.A : ICommandBuilder.FontStyleType.B);
    return this;
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

  textLargeBold(value: string): SPCommandsCommon {
    this.builder.appendEmphasis(true);
    this.builder.appendMultiple(this.getEncodedString(value), 2, 2);
    this.builder.appendEmphasis(false);
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

  barcode(options: SPBarcodeCommand): SPCommandsCommon {
    this.builder.appendBarcodeWithAlignment(
        this.getEncodedString("{B0" + options.value),
        ICommandBuilder.BarcodeSymbology.Code128,
        (!options.width || options.width === "medium" ? ICommandBuilder.BarcodeWidth.Mode2 : (options.width === "large" ? ICommandBuilder.BarcodeWidth.Mode3 : ICommandBuilder.BarcodeWidth.Mode1)),
        options.height,
        options.appendEncodedValue,
        ICommandBuilder.AlignmentPosition.Center
    );
    return this;
  }

  image(imageSource: ImageSource, diffuse?: boolean, alignCenter?: boolean): SPCommandsCommon {
    this.builder.appendBitmapWithAlignment(
        imageSource.android,
        diffuse !== false,
        alignCenter !== false ? ICommandBuilder.AlignmentPosition.Center : ICommandBuilder.AlignmentPosition.Left);
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
    // doesn't look like we need to do this
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  disconnect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // same as connect
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });
  }

  openCashDrawer(options: SPOpenCashDrawerOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
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

          let spCommands = new SPCommands();
          spCommands.raw(0x07);

          let commands: any = spCommands.getCommands();
          port.writePort(commands, 0, commands.length);
          port.setEndCheckedBlockTimeoutMillis(10000);
          printerStatus = port.endCheckedBlock();

          // assuming
          console.log("Open drawer success! printerStatus: " + printerStatus);
          resolve();
        }, 100);

        resolve();
      } catch (e) {
        console.log("---- caught e: " + e);
        reject(e);
      }
    });
  }
}
