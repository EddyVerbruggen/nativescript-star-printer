#import "TNSStarPrinter.h"
#import <StarIO_Extension/ISCBBuilder.h>
#import <StarIO_Extension/StarIoExt.h>
#import <StarIO_Extension/SMBluetoothManagerFactory.h>
#import <StarIO/SMBluetoothManager.h>

@implementation TNSStarPrinter

static StarIoExtManager *_starIoExtManager;

+ (void)searchPrinters:(void(^)(NSArray* printers))completionHandler {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSMutableArray *printers = [NSMutableArray new];

        for (PortInfo *portInfo in  [SMPort searchPrinter]) {
            NSMutableDictionary *dict = [NSMutableDictionary new];
            [dict setObject:[portInfo portName] forKey:@"portName"];
            [dict setObject:[portInfo macAddress] forKey:@"macAddress"];
            [dict setObject:[portInfo modelName] forKey:@"modelName"];
            [printers addObject:dict];
        }

        completionHandler(printers);
    });
}

+ (NSString *)getPaperStatus {
    if (_starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusInvalid || _starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusImpossible) {
        return @"UNKNOWN";
    } else if (_starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusNearEmpty) {
        return @"NEAR_EMPTY";
    } else if (_starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusEmpty) {
        return @"EMPTY";
    } else {
        return @"READY";
    }
}

+ (NSString *)getOnlineStatus {
    if (_starIoExtManager.printerStatus == StarIoExtManagerPrinterStatusInvalid || _starIoExtManager.printerStatus == StarIoExtManagerPrinterStatusImpossible) {
        return @"UNKNOWN";
    } else if (_starIoExtManager.printerStatus == StarIoExtManagerPrinterStatusOffline) {
        return @"OFFLINE";
    } else {
        return @"ONLINE";
    }
}

+ (void)toggleAutoConnect:(NSString *)portName enable:(BOOL)enable onComplete:(void(^)(NSString* error))completionHandler {
    
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        SMBluetoothManager *mgr = [SMBluetoothManagerFactory getManager:portName emulation:StarIoExtEmulationStarLine];
        if ([mgr open] == YES) {
            if ([mgr loadSetting] == YES) {
                if (mgr.autoConnect == enable) {
                    // already ok
                    completionHandler(nil);
                    [mgr close];
                    return;
                }
                mgr.autoConnect = enable;
                if ([mgr apply] == YES) {
                    completionHandler(nil);
                } else {
                    completionHandler(@"Settings not applied");
                }
            } else {
                completionHandler(@"Settings not loaded");
            }
            [mgr close];
        } else {
            completionHandler(@"Couldn't open port");
        }
    });
}

+ (void)connect:(NSString *)portName onComplete:(void(^)(NSDictionary* info))completionHandler {
    if (_starIoExtManager == nil) {
        _starIoExtManager = [[StarIoExtManager alloc] initWithType:StarIoExtManagerTypeStandard
                                                          portName:portName
                                                      portSettings:@""
                                                   ioTimeoutMillis:10000];
    }
    
    BOOL connected = [_starIoExtManager connect];
    
    // wait a little, otherwise online/paperstatus is not reflected correctly
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.5 * NSEC_PER_SEC), dispatch_get_main_queue(), ^(void){
        completionHandler(@{
                            @"connected": @(connected),
                            @"onlineStatus": [TNSStarPrinter getOnlineStatus],
                            @"paperStatus": [TNSStarPrinter getPaperStatus]
                            });
    });
}

+ (void)getPrinterStatus:(NSString *)portName onComplete:(void(^)(NSDictionary* info))completionHandler {
    if (_starIoExtManager == nil) {
        completionHandler(@{});
        return;
    }
    
    completionHandler(@{
                        @"onlineStatus": [TNSStarPrinter getOnlineStatus],
                        @"paperStatus": [TNSStarPrinter getPaperStatus]
                        });
}

+ (void)disconnect:(NSString *)portName onComplete:(void(^)(BOOL disconnected))completionHandler {
    if (_starIoExtManager == nil) {
        _starIoExtManager = [[StarIoExtManager alloc] initWithType:StarIoExtManagerTypeStandard
                                                          portName:portName
                                                      portSettings:@""
                                                   ioTimeoutMillis:10000];
    }

    completionHandler([_starIoExtManager disconnect]);
    _starIoExtManager = nil;
}

+ (NSData *)getBitmapCommand:(UIImage *)image withDiffusion:(BOOL)diffusion andCenterAlignment:(BOOL)alignCenter {
    ISCBBuilder *builder = [StarIoExt createCommandBuilder:StarIoExtEmulationStarLine];
    
    [builder beginDocument];
    
    [builder appendBitmapWithAlignment:image
                             diffusion:diffusion
                              position:(alignCenter ? SCBAlignmentPositionCenter : SCBAlignmentPositionLeft)];
    
    [builder endDocument];
    
    return [builder.commands copy];
}

+ (NSData *)getBitmapWithFixedWidthCommand:(UIImage *)image withDiffusion:(BOOL)diffusion andCenterAlignment:(BOOL)alignCenter andWidth:(NSInteger)width andBothScale:(BOOL)bothScale andPosition:(NSInteger)position{
    ISCBBuilder *builder = [StarIoExt createCommandBuilder:StarIoExtEmulationStarLine];
    
    [builder beginDocument];
    
    [builder appendBitmapWithAbsolutePosition:image
                                    diffusion:diffusion
                                        width:width
                                    bothScale:bothScale
                                     position:(alignCenter ? SCBAlignmentPositionCenter : SCBAlignmentPositionLeft)];
    
    [builder endDocument];
    
    return [builder.commands copy];
}

+ (void)sendCommands:(NSData *)commands toPort:(NSString *)portName onComplete:(void(^)(NSString* error))completionHandler {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        SMPort *port = nil;
        
        BOOL result = NO;
        
        if (_starIoExtManager == nil || _starIoExtManager.port == nil) {
            port = [SMPort getPort:portName :@"" :10000];
        } else {
            port = [_starIoExtManager port];
        }
        
        if (_starIoExtManager != nil) {
            [_starIoExtManager.lock lock];
        }
        
        uint32_t commandLength = (uint32_t) commands.length;
        unsigned char *commandsBytes = (unsigned char *) commands.bytes;
        
        @try {
            while (YES) {
                if (port == nil) {
                    completionHandler(@"Fail to Open Port");
                    break;
                }
                
                StarPrinterStatus_2 printerStatus;
                
                [port beginCheckedBlock:&printerStatus :2];
                
                if (printerStatus.offline == SM_TRUE) {
                    completionHandler(@"Printer is offline (beginCheckedBlock)");
                    break;
                }
                
                NSDate *startDate = [NSDate date];
                
                uint32_t total = 0;
                
                while (total < commandLength) {
                    uint32_t written = [port writePort:commandsBytes :total :commandLength - total];
                    total += written;
                    if ([[NSDate date] timeIntervalSinceDate:startDate] >= 30.0) { // 30000ms
                        break;
                    }
                }
                
                if (total < commandLength) {
                    completionHandler(@"Write port timed out");
                    break;
                }
                
                port.endCheckedBlockTimeoutMillis = 30000; // 30000ms
                
                [port endCheckedBlock:&printerStatus :2];
                
                if (printerStatus.offline == SM_TRUE) {
                    completionHandler(@"Printer is offline (endCheckedBlock)");
                    break;
                }
                
                result = YES;
                break;
            }
        }
        @catch (PortException *exc) {
            completionHandler(@"Write port timed out (PortException)");
        }
        
        if (_starIoExtManager != nil) {
            [_starIoExtManager.lock unlock];
        }
        
        completionHandler(nil);
    });
}

@end
