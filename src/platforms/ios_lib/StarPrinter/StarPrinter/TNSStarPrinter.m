#import "TNSStarPrinter.h"

@implementation TNSStarPrinter

static StarIoExtManager *_starIoExtManager;

+ (void)searchPrinters:(void(^)(NSArray* printers))completionHandler {
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
        NSLog(@"--- native searchPrinters 3");
        NSMutableArray *printers = [NSMutableArray new];

        for (PortInfo *portInfo in  [SMPort searchPrinter]) {
            NSLog(@"starPrinter.portName: %@", [portInfo portName]);
            NSMutableDictionary *dict = [NSMutableDictionary new];
            [dict setObject:[portInfo portName] forKey:@"portName"];
            [dict setObject:[portInfo macAddress] forKey:@"macAddress"];
            [dict setObject:[portInfo modelName] forKey:@"modelName"];
            [printers addObject:dict];
        }

        completionHandler(printers);
    });
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

    if (_starIoExtManager.port != nil) {
        [_starIoExtManager disconnect];
    }
    
    completionHandler([_starIoExtManager connect]);
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
            
            NSLog(@"Going to print %d commands", commandLength);
            
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
            
            NSLog(@"Printed %d commands", total);

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
