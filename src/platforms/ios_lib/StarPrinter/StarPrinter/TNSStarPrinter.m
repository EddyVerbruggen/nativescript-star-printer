#import "TNSStarPrinter.h"
#import <StarIO_Extension/ISCBBuilder.h>
#import <StarIO_Extension/StarIoExt.h>

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

+ (BOOL)online {
    // TODO test. If this doesn't work, use the same method as 'sendCommands:' below
    return _starIoExtManager != nil && _starIoExtManager.printerStatus == StarIoExtManagerPrinterStatusOnline;
}

+ (NSString *)paperStatus {
    if (_starIoExtManager == nil || _starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusInvalid || _starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusImpossible) {
        return @"UNKNOWN";
    } else if (_starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusNearEmpty) {
        return @"NEAR_EMPTY";
    } else if (_starIoExtManager.printerPaperStatus == StarIoExtManagerPrinterPaperStatusEmpty) {
        return @"EMPTY";
    } else {
        return @"READY";
    }
}

+ (void)connect:(NSString *)portName onComplete:(void(^)(BOOL connected))completionHandler {
    if (_starIoExtManager == nil) {
        _starIoExtManager = [[StarIoExtManager alloc] initWithType:StarIoExtManagerTypeStandard
                                                          portName:portName
                                                      portSettings:@""
                                                   ioTimeoutMillis:10000];

        // no need for this currently
//        _starIoExtManager.delegate = self;
    }

//    if (_starIoExtManager.port != nil) {
//        [_starIoExtManager disconnect];
//    }
    
    completionHandler([_starIoExtManager connect]);
}

+ (void)disconnect:(void(^)(BOOL disconnected))completionHandler {
    if (_starIoExtManager != nil) {
        completionHandler([_starIoExtManager disconnect]);
        _starIoExtManager = nil;
    }
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

+ (void)sendCommands:(NSData *)commands toPort:(NSString *)portName onComplete:(void(^)(NSString* error))completionHandler {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{

     //    SMPort *port = [SMPort getPort:portName :@"" :10000];
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
