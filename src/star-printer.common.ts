import { ImageSource } from "@nativescript/core";

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

export type PrinterOnlineStatus = "UNKNOWN" | "OFFLINE" | "ONLINE";

export type PrinterPaperStatus = "UNKNOWN" | "NEAR_EMPTY" | "EMPTY" | "READY";

export abstract class SPCommandsCommon {

  abstract getCommands(): any;

  abstract setCodepageUTF8(): SPCommandsCommon;

  abstract setCodepageWindowsCP1252(): SPCommandsCommon;

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

  abstract imagePositioned(imageSource: ImageSource, width: number, position: number, bothScale?: boolean /* default true */, diffuse?: boolean /* default true */, alignCenter?: boolean /* default true */): SPCommandsCommon;

  horizontalLine(character = "─", nrOfCharacters: number = 48 /* 3" paper roll */): SPCommandsCommon {
    this.newLine();
    this.text(character.repeat(nrOfCharacters));
    return this.newLine();
  }
}

export interface SPPrinterPortOptions {
  portName: string;
}

export interface SPOpenCashDrawerOptions extends SPPrinterPortOptions {
}

export interface SPGetPrinterStatusOptions extends SPPrinterPortOptions {
}

export interface SPConnectOptions extends SPPrinterPortOptions {
}

export interface SPDisconnectOptions extends SPPrinterPortOptions {
}

export interface SPToggleAutoConnectOptions extends SPPrinterPortOptions {
  autoConnect: boolean;
}

export interface SPPrintOptions extends SPPrinterPortOptions {
  commands: SPCommandsCommon;
}

export interface SPSearchPrinterOptions {
}

export interface SPPrinterStatusResult {
  online: boolean;
  onlineStatus: PrinterOnlineStatus;
  paperStatus: PrinterPaperStatus;
}

export interface SPConnectResult extends SPPrinterStatusResult {
  connected: boolean;
}

//noinspection JSUnusedGlobalSymbols
export interface StarPrinterApi {
  searchPrinters(options?: SPSearchPrinterOptions): Promise<Array<SPPrinter>>;

  connect(options: SPConnectOptions): Promise<SPConnectResult>;

  disconnect(options: SPDisconnectOptions): Promise<boolean>;

  toggleAutoConnect(options: SPToggleAutoConnectOptions): Promise<boolean>;

  print(options: SPPrintOptions): Promise<any>;

  openCashDrawer(options: SPOpenCashDrawerOptions): Promise<any>;

  /**
   * Make sure you call this AFTER connecting to a printer.
   */
  getPrinterStatus(options: SPGetPrinterStatusOptions): Promise<SPPrinterStatusResult>;
}
