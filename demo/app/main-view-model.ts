import {Observable} from "tns-core-modules/data/observable";
import * as ImageSource from "tns-core-modules/image-source";
import {alert} from "tns-core-modules/ui/dialogs";
import * as AppSettings from "tns-core-modules/application-settings";
import {ObservableArray} from "tns-core-modules/data/observable-array";
import {SPCommands, SPPrinter, StarPrinter} from "nativescript-star-printer";

const pad = require('pad');

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
          console.log("Found printers: " + JSON.stringify(printers));
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

  public doPrintReceiptA(): void {
    // Note that a 3" roll is 48 chars wide
    const commands = new SPCommands()
        .setFont("smaller")
        .alignCenter()
        .textBold("My Awesome Boutique")
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
        .text("300678566     Plain White Tee             €10.99") // testing '€'
        .newLine()
        .text("300692003     Black Dénim                 €29.99") // testing 'é'
        .newLine()
        .text("300651148     Blue Denim                  €29.99")
        .newLine()
        .newLine()
        .newLine()
        .barcode({
          type: "Code128",
          value: "12345678",
          width: "small",
          height: 50,
          appendEncodedValue: false
        })
        .newLine()
        .cutPaper();

    this.starPrinter.print({
      portName: this.selectedPrinterPort,
      commands: commands
    });
  }

  public doPrintReceiptB(): void {
    // Note that a 3" roll is 48 chars wide
    const totalWidth = 48,
        colWidth1 = 9,
        colWidth3 = 12,
        colWidth2 = totalWidth - (colWidth1 + colWidth3);

    const image = ImageSource.fromFile("~/res/mww-logo.png");
    let commands = new SPCommands();

    commands.alignCenter();
    commands.textBold("My offline Superstore");
    commands.newLine();

    commands.text("Moulin Rouge 69").newLine();
    commands.text("3823ED Paris").newLine();

    commands.image(image);

    commands.alignLeft();

    let dateTimeHeader = pad("Order", totalWidth / 2) + pad(totalWidth / 2, "Date/Time");
    let dateTimeText = pad("ORD000456", totalWidth / 2) + pad(totalWidth / 2, `11-11-2018 10:03`);

    commands
        .text(dateTimeHeader)
        .newLine()
        .text(dateTimeText)
        .horizontalLine()
        .newLine() // add another blank line
        .textBold(pad("Amount", colWidth1) + pad("Product", colWidth2) + pad(colWidth3, "Total")).newLine();

    commands.text(pad("1", colWidth1) + pad(HelloWorldModel.fit("Viagra, 12-pack", colWidth2), colWidth2) + pad(colWidth3, "12,99")).newLine();
    commands.text(pad("3", colWidth1) + pad(HelloWorldModel.fit("Condoms, XXL", colWidth2), colWidth2) + pad(colWidth3, "17,97")).newLine();

    // horizontalLine includes a newline
    commands.horizontalLine();

    // textLarge takes twice the amount of space
    commands.text(pad(`Total amount (EUR)`, totalWidth / 2)).textLarge(pad(totalWidth / 4, "30,96")).newLine();

    commands.text(pad(`VAT 21% (EUR)`, totalWidth / 2) + pad(totalWidth / 2, "5,82")).newLine().newLine();

    commands.text(pad(`Payment type:`, totalWidth / 2) + pad(totalWidth / 2, "Maestro")).newLine();

    commands.text(pad(`Auth. code:`, totalWidth / 2) + pad(totalWidth / 2, "567343")).newLine();

    commands.newLine().newLine() // add some blank lines
        .cutPaper(); // makes it easier to tear off the receipt :)

    this.starPrinter.print({
      portName: this.selectedPrinterPort,
      commands: commands
    });
  }

  public doPrintReceiptC(): void {

    // Note that a 3" roll is 48 chars wide with the default font, and 64 with the smaller font
    const totalWidth = 48,
        totalWidthSmallerFont = 64,
        image = ImageSource.fromFile("~/res/mww-logo.png"),
        commands = new SPCommands();

    commands
        .image(image, true, true)
        .alignCenter()
        .textLargeBold("LOCATION NAME").newLine()
        .text("Molenstraat 56").newLine()
        .text("5341GE OSS").newLine()
        .text("▄▄▄▄▄▄▄▄").newLine()
        .newLine()
        .text("Custom header tekst").newLine()
        .newLine()
        .textLarge("COPY").newLine()
        .horizontalLine("▀")
        .text(pad("Order", totalWidth / 2) + pad(totalWidth / 2, "Date/Time")).newLine()
        .text(pad("201800001", totalWidth / 2) + pad(totalWidth / 2, "19-06-2018 12:00"))
        .horizontalLine("▀")
        .newLine()
        .textBold(pad("Product", totalWidth / 2) + pad(totalWidth / 2, "Prijs"))
        .horizontalLine("—")

        .textBold(pad("Lobi Snapback", totalWidth / 2) + pad(totalWidth / 2, "€ 19,99")).newLine()
        .text(pad("  Black", totalWidth)).newLine()
        .setFont("smaller")
        .textBold(pad("Damaged", totalWidthSmallerFont / 2) + pad(totalWidthSmallerFont / 2, "€ -5,00"))
        .setFont("default")

        .horizontalLine(".")

        .textBold(pad("Lobi Snapback", totalWidth)).newLine()
        .text(pad("  Black", totalWidth)).newLine()
        .setFont("smaller")
        .text(pad("2x 19,99", totalWidthSmallerFont / 2))
        .setFont("default")
        .textBold(pad(totalWidth / 2, "€ 38,98")).newLine()
        .setFont("smaller")
        .textBold(pad("Damaged", totalWidthSmallerFont / 2) + pad(totalWidthSmallerFont / 2, "€ -5,00"))
        .setFont("default")
        .horizontalLine(".")

        .newLine()
        .textLarge(pad("TOTAL", totalWidth / 4) + pad(totalWidth / 4, "€ 60,46"))
        .horizontalLine(".")

        .newLine()
        .text(pad("    VAT (21%)", totalWidth / 2) + pad(totalWidth / 2, "€ 10,49    ")).newLine()
        .text(pad("    VAT (6%)", totalWidth / 2) + pad(totalWidth / 2, "€  6,13    ")).newLine()
        .text(pad("    TOTAL VAT", totalWidth / 2) + pad(totalWidth / 2, "€ 16,62    ")).newLine()
        .horizontalLine("—")
        .newLine()

        .text(`┌${"─".repeat(totalWidth - 2)}┐`)
        .text(pad("│ Payment type::", totalWidth / 2) + pad(totalWidth / 2, "MAESTRO │"))
        .text(`├${"─".repeat(totalWidth - 2)}┤`)
        .text(pad("│ Auth. code:", totalWidth / 2) + pad(totalWidth / 2, "6557M9 │"))
        .text(`└${"─".repeat(totalWidth - 2)}┘`).newLine()

        .newLine()
        .text(pad("ALTERNATIVE - double stripes", totalWidth)).newLine()

        .text(`╔${"═".repeat(totalWidth - 2)}╗`)
        .text(pad("║ Payment type:", totalWidth / 2) + pad(totalWidth / 2, "MAESTRO ║"))
        .text(`╠${"═".repeat(totalWidth - 2)}╣`)
        .text(pad("║ Auth. code:", totalWidth / 2) + pad(totalWidth / 2, "6557M9 ║"))
        .text(`╚${"═".repeat(totalWidth - 2)}╝`).newLine()

        .newLine()
        .text("Customer footer tekst").newLine()
        .horizontalLine("—")
        .newLine()

        .barcode({
          type: "Code128",
          value: "12345678",
          width: "medium",
          height: 50,
          appendEncodedValue: false
        })

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
    }).then(result => {
      console.log("Connected: " + result.connected);
      this.set(HelloWorldModel.LOADING_KEY, false);
      if (result.connected) {
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

  public doDisconnect(): void {
    this.starPrinter.disconnect({
      portName: this.lastConnectedPrinterPort
    }).then((disconnected: boolean) => {
      if (disconnected) {
        this.printers.splice(0);
        this.set(HelloWorldModel.SELECTED_PRINTER_KEY, undefined);
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
      portName: this.selectedPrinterPort
    });
  }

  private static fit(what: string, into: number): string {
    return what && what.length > into ?
        what.substring(0, into) :
        what;
  }
}
