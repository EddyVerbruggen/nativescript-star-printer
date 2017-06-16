export class SPPrinter {
  portName: string;
  modelName: string;

  constructor(portName: string, modelName: string) {
    this.portName = portName;
    this.modelName = modelName;
  }
}

export abstract class SPCommandsCommon {
  constructor() {
  }

  abstract getCommands(): any;

  abstract text(value: string): SPCommandsCommon;
  // could add textUnderlinedStart/End when requested, but this keeps the API simple for now
  abstract textUnderlined(value: string): SPCommandsCommon;
  abstract textBold(value: string): SPCommandsCommon;
  abstract textLarge(value: string): SPCommandsCommon;
  abstract newLine(): SPCommandsCommon;
  abstract cutPaper(): SPCommandsCommon;
  abstract alignCenter(): SPCommandsCommon;
  abstract alignLeft(): SPCommandsCommon;

  horizontalLine(): SPCommandsCommon {
    this.newLine();
    // assuming 3" paper roll
    this.text("------------------------------------------------");
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
}