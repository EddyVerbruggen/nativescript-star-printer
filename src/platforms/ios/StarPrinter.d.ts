declare var StarPrinterVersionNumber: number;

declare var StarPrinterVersionString: interop.Reference<number>;

declare class TNSStarPrinter extends NSObject {

  static alloc(): TNSStarPrinter; // inherited from NSObject

  static connectOnComplete(portName: string, completionHandler: (p1: NSDictionary<NSString, any>) => void): void;

  static disconnectOnComplete(portName: string, completionHandler: (p1: boolean) => void): void;

  static toggleAutoConnectEnableOnComplete(portName: string, newSetting: boolean, completionHandler: (error: NSString) => void);

  static new(): TNSStarPrinter; // inherited from NSObject

  static searchPrinters(completionHandler: (p1: NSArray<any>) => void): void;

  static getBitmapCommandWithDiffusionAndCenterAlignment(image: UIImage, diffusion: boolean, centerAlignment: boolean): NSData;

  static getBitmapWithFixedWidthCommandWithDiffusionAndCenterAlignmentAndWidthAndBothScaleAndPosition(image: UIImage, diffusion: boolean, centerAlignment: boolean, width: number, bothScale: boolean, position: number): NSData;

  static appendCodePageUTF8(): NSData;

  static appendCodePageCP1252(): NSData;

  static appendCodePage(type: any): NSData;

  static appendInternationalTypeUSA(): NSData;

  static sendCommandsToPortOnComplete(commands: NSData, portName: string, completionHandler: (p1: string) => void): void;
}
