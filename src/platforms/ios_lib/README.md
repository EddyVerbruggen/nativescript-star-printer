Custom StarIO framework for iOS apps.

I'm using this wrapper to circumvent some pointer release issues when using {N}-StarIO SDK interaction.

### Update the dependencies before opening Xcode (if needed)
- Go to http://www.starmicronics.com/support/SDKDocumentation.aspx
- Then browse to the 'Developers' section..
- .. then iOS > etc
- Copy those files to the `ios_lib/StarPrinter/` folder.
- You can now open Xcode.

### Building the framework
- First build for any iOS device
- Then at Build Settings > Excluded Architectures, add 'arm64' and build for a Simulator.
- Right-click the file in the Products folder and open in Finder.
- In a Terminal `cd` to that folder, move up to the `Products` folder.
- Run `lipo -create -output "StarPrinter" "Debug-iphonesimulator/StarPrinter.framework/StarPrinter" "Debug-iphoneos/StarPrinter.framework/StarPrinter"`.
- Use the resulting `StarPrinter` file instead of the one generated inside any of the targets.
