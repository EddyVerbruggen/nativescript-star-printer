import { Observable } from "data/observable";
import { alert } from "ui/dialogs";
import * as AppSettings from "application-settings";
import { SPCommands, SPPrinter, StarPrinter } from "nativescript-star-printer";
import { ObservableArray } from "data/observable-array";

export class HelloWorldModel extends Observable {
  private static LOADING_KEY = "isLoading";
  private static SELECTED_PRINTER_KEY = "selectedPrinterPort";
  private static LAST_CONNECTED_PORT_KEY = "lastConnectedPrinterPort";

  public message: string;
  public isLoading: boolean = false;
  private starPrinter: StarPrinter;
  public printers: ObservableArray<SPPrinter> = new ObservableArray<SPPrinter>();
  private selectedPrinterPort: string;
  private lastConnectedPrinterPort: string;

  constructor() {
    super();

    this.starPrinter = new StarPrinter();
    this.set("message", "Search and select a printer");
    this.set(
        HelloWorldModel.LAST_CONNECTED_PORT_KEY,
        AppSettings.getString(HelloWorldModel.LAST_CONNECTED_PORT_KEY, null));
  }

  public doSearchPrinters(): void {
    // reset
    this.printers.splice(0, this.printers.length);
    this.set(HelloWorldModel.SELECTED_PRINTER_KEY, undefined);
    this.set("message", "Search and select a printer");

    this.set(HelloWorldModel.LOADING_KEY, true);

    // search
    this.starPrinter.searchPrinters().then(
        (printers: Array<SPPrinter>) => {
          this.set(
              HelloWorldModel.LAST_CONNECTED_PORT_KEY,
              AppSettings.getString(HelloWorldModel.LAST_CONNECTED_PORT_KEY, null));
          console.log("Found printers: " + printers.length);
          this.printers.push(printers);
          this.set(HelloWorldModel.LOADING_KEY, false);
        }, (err: string) => {
          console.log("Search printers error: " + JSON.stringify(err));
        });
  }

  public onPrinterTap(args): void {
    this.selectedPrinterPort = this.printers.getItem(args.index).portName;
    this.set("message", `Selected: ${this.selectedPrinterPort}`);
    AppSettings.setString(HelloWorldModel.LAST_CONNECTED_PORT_KEY, this.selectedPrinterPort);
  }

  public doPrint(): void {
    // 3" roll is 48 chars wide
    let commands = new SPCommands()
        .alignCenter()
        .text("My Awesome Boutique")
        .newLine()
        .text("In a shop near you")
        .newLine()
        .text("Planet Earth")
        .newLine()
        .newLine()
        .text("Date: 11/11/2017                   Time: 3:15 PM")
        .horizontalLine()
        .newLine()
        .textBold("SKU           Description                  Total")
        .newLine()
        .text("300678566     Plain White Tee              10.99")
        .newLine()
        .text("300692003     Black Denim                  29.99")
        .newLine()
        .text("300651148     Blue Denim                   29.99")
        .newLine()
        .newLine()
        .text("Subtotal                                   70.97")
        .newLine()
        .text("VAT                                         4.03")
        .horizontalLine()
        .text("Total                                 ")
        .textLarge("75.00")
        .newLine()
        .newLine()
        .cutPaper();

    this.starPrinter.print({
      portName: this.selectedPrinterPort,
      commands: commands
    });
  }

  public doConnect(): void {
    this.set(HelloWorldModel.LOADING_KEY, true);
    this.starPrinter.connect({
      portName: this.lastConnectedPrinterPort
    }).then((connected: boolean) => {
      console.log("Connected: " + connected);
      this.set(HelloWorldModel.LOADING_KEY, false);
      if (connected) {
        this.set(HelloWorldModel.SELECTED_PRINTER_KEY, this.lastConnectedPrinterPort);
      } else {
        alert({
          title: "Connection failed?",
          message: "Connect via the Bluetooth settings of your device",
          okButtonText: "OK, will do"
        });
      }
    });
  }

  public doOpenCashDrawer(): void {
    this.starPrinter.openCashDrawer({
      portName: this.selectedPrinter.portName
    });
  }
}