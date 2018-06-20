#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <StarIO_Extension/StarIoExtManager.h>

@interface TNSStarPrinter : NSObject

+ (void)searchPrinters:(void(^)(NSArray* printers))completionHandler;

+ (void)connect:(NSString *)portName onComplete:(void(^)(BOOL connected))completionHandler;

+ (void)disconnect:(void(^)(BOOL connected))completionHandler;

+ (NSData *)getBitmapCommand:(UIImage *)image withDiffusion:(BOOL)diffusion andCenterAlignment:(BOOL)alignCenter;

+ (void)sendCommands:(NSData *)commands toPort:(NSString *)portName onComplete:(void(^)(NSString* error))completionHandler;

@end
