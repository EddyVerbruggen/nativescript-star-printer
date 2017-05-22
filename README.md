# NativeScript Star Printer

[![Build Status][build-status]][build-url]
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[build-status]:https://travis-ci.org/EddyVerbruggen/nativescript-star-printer.svg?branch=master
[build-url]:https://travis-ci.org/EddyVerbruggen/nativescript-star-printer
[npm-image]:http://img.shields.io/npm/v/nativescript-star-printer.svg
[npm-url]:https://npmjs.org/package/nativescript-star-printer
[downloads-image]:http://img.shields.io/npm/dm/nativescript-star-printer.svg
[twitter-image]:https://img.shields.io/twitter/follow/eddyverbruggen.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/eddyverbruggen

<img src="https://github.com/EddyVerbruggen/nativescript-star-printer/raw/master/media/demo-app.gif" width="328px" height="577px" />

_That's [the demo app](https://github.com/EddyVerbruggen/nativescript-star-printer/tree/master/demo) in action, printing on a Star Micronics TSP650II_

## Installation
```bash
tns plugin add nativescript-star-printer
```

## API

### requiring / importing the plugin
All examples below assume you're using TypeScript, but here's how to require the plugin with plain old JS as well:

#### JavaScript
```js
var StarPrinterPlugin = require("nativescript-star-printer");
var starPrinter = new StarPrinterPlugin.StarPrinter();
```

#### TypeScript
```typescript
import { StarPrinter, SPPrinter, SPCommands } from "nativescript-star-printer";

export Class MyPrintingClass {
  private starPrinter: StarPrinter;
  
  constructor() {
    this.starPrinter = new StarPrinter();
  }
}
```

### `searchPrinters`
If you're searching for a Bluetooth printer, enable Bluetooth in the device settings
and pair/connect the printer. Then do:

```typescript
this.starPrinter.searchPrinters().then(
    (printers: Array<SPPrinter>) => {
      console.log(`Found ${printers.length} printers`);
    }, (err: string) => {
      console.log(`Search printers error: ${err}`);
    });
```

The only useful property on the `SPPrinter` class is the `portName` which you will need
in other API methods.

### `print`
Once you've got the port of the printer you want to print on, just do:

```typescript
this.starPrinter.print({
  portName: this.selectedPrinterPort,
  commands: commands
});
```

So what are those `commands`? Let's recreate the receipt below to answer that:

<img src="https://github.com/EddyVerbruggen/nativescript-star-printer/raw/master/media/demo-app-receipt.jpg" width="400px" />

```typescript
// Note that a standard 3 inch roll is 48 characters wide - we use that knowledge for our "columns"
let commands = new SPCommands()
    .alignCenter() // designates the start of center-aligned text. Use alignLeft() to.. guess what :)
    .text(     "My Awesome Boutique").newLine()
    .text(     "In a shop near you").newLine()
    .text(     "Planet Earth").newLine()
    .newLine() // this will draw a blank line
    .text(     "Date: 11/11/2017                   Time: 3:15 PM")
    .horizontalLine() // Note that horizontal lines include newLine() commands as well
    .newLine() // blank line
    .textBold( "SKU           Description                  Total").newLine()
    .text(     "300678566     Plain White Tee              10.99").newLine()
    .text(     "300692003     Black Denim                  29.99").newLine()
    .text(     "300651148     Blue Denim                   29.99").newLine()
    .newLine() // blank line
    .text(     "Subtotal                                   70.97").newLine()
    .text(     "VAT                                         4.03")
    .horizontalLine()
    .text(     "Total                                 ")
    .textLarge("75.00").newLine() // Note that large text takes up double the space
    .newLine()
    .cutPaper(); // this makes the receipt much easier to tear off :)

this.starPrinter.print({
  portName: this.selectedPrinterPort,
  commands: commands
});
```

## Known limitations
On iOS you want to run this on a real device.


## Future work
Test and expose a method called `openCashDrawer`.

Possibly add more `print` formatting options.
