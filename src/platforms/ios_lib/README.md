Custom StarIO framework for iOS apps.

I'm using this wrapper to circumvent some pointer release issues when using {N}-StarIO SDK interaction.

### Building the framework
- Run the target for simulator and device (disconnect the device to be sure), make sure to not only build for the active architecture.
- Right-click the file in the Products folder and open in Finder.
- In a Terminal `cd` to that folder, move up to the `Products` folder.
- Run `lipo -create -output "StarPrinter" "Debug-iphonesimulator/StarPrinter.framework/StarPrinter" "Debug-iphoneos/StarPrinter.framework/StarPrinter"`.
- Use the resulting `StarPrinter` file instead of the one generated inside any of the targets.