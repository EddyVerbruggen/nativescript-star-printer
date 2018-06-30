import {ImageSource} from "tns-core-modules/image-source";

export class SPPrinter {
  portName: string;
  modelName: string;

  constructor(portName: string, modelName: string) {
    this.portName = portName;
    this.modelName = modelName;
  }
}

export interface SPBarcodeCommand {
  value: string;
  width?: "small" | "medium" | "large"; // default "medium"
  height?: number; // default 40
  type?: "Code128"; // default "Code128" because that's currently the only option ;)
  appendEncodedValue?: boolean; // default false
}

export type PrinterFont = "default" | "smaller";

export type PrinterPaperStatus = "UNKNOWN" | "NEAR_EMPTY" | "EMPTY" | "READY";

export abstract class SPCommandsCommon {

  abstract getCommands(): any;

  abstract text(value: string): SPCommandsCommon;

  abstract setFont(font: PrinterFont): SPCommandsCommon;

  // could add textUnderlinedStart/End when requested, but this keeps the API simple for now
  abstract textUnderlined(value: string): SPCommandsCommon;

  abstract textBold(value: string): SPCommandsCommon;

  abstract textLarge(value: string): SPCommandsCommon;

  abstract textLargeBold(value: string): SPCommandsCommon;

  abstract newLine(): SPCommandsCommon;

  abstract cutPaper(): SPCommandsCommon;

  abstract alignCenter(): SPCommandsCommon;

  abstract alignLeft(): SPCommandsCommon;

  abstract barcode(options: SPBarcodeCommand): SPCommandsCommon;

  abstract image(imageSource: ImageSource, diffuse?: boolean /* default true */, alignCenter?: boolean /* default true */): SPCommandsCommon;

  horizontalLine(character = "─"): SPCommandsCommon {
    this.newLine();
    // assuming 3" paper roll (48 characters)
    this.text(character.repeat(48));
    return this.newLine();
  }
}

export interface SPOpenCashDrawerOptions {
  portName: string;
}

export interface SPConnectOptions {
  portName: string;
}

export interface SPSearchPrinterOptions {
}

export interface SPPrintOptions {
  portName: string;
  commands: SPCommandsCommon;
}

//noinspection JSUnusedGlobalSymbols
export interface StarPrinterApi {
  searchPrinters(options?: SPSearchPrinterOptions): Promise<Array<SPPrinter>>;

  connect(options: SPConnectOptions): Promise<boolean>;

  disconnect(): Promise<boolean>;

  print(options: SPPrintOptions): Promise<any>;

  openCashDrawer(options: SPOpenCashDrawerOptions): Promise<any>;

  online(): boolean;

  paperStatus(): PrinterPaperStatus;
}
