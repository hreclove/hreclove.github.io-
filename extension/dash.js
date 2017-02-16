(function(ext) {
    var extDevice = null;
    var rawData = null;
    
    var HeaderStart = 0x3C;
    var HeaderEnd = 0x3E;
    
    // Command ID
    var SysCmdID = 0;
    var RollCmdID = 1;
    var LedCmdID = 2;
    var SoundCmdID = 3;

    // Command type
    var TailLampID = 0x01; // for LED Command
    var TopButtonLampID = 0x02;
    var LeftEarLampID = 0x03;
    var RightEarLampID = 0x04;
    var ChestLampID = 0x05;
    var EyesLampID = 0x06;
    
    var HeadMoveID = 0x03;   // for ROLL Command
    
    var SoundPlayID = 0x01;  // for SOUND Command
    
    var SensorConfigID = 0xA0;   // for SYSTEM Command
   
    // Senser id for SensorConfigID
    var SensorButtonID = 0x01;
    var SensorDistanceID = 0x02;

    
    // Reported Sensor ID
    var SensorRes_Button = 0x10;
    var SensorRes_Distance = 0x20;
    
    var extDeviceOnline = false;
    
    var channels = {
        sensor: 1,
        system: 0
    };
    
    var colorTable = {
        'red': 0,
        'bright red': 1, 
        'yellow': 2, 
        'green': 3, 
        'bright blue': 4,
        'blue': 5, 
        'magenta': 6,
        'white': 7,
        'off' : 8
    };
    
    var dirTable = {
        'forward': 0, 
        'backward': 1, 
        'left': 2, 
        'right': 3
    };
    
    var lightLampRgbTable = {
        'left ear': 0,
        'right ear': 1,
        'chest': 2,
    }
    
    var lightLampTable = {
        'tail': 0,
        'top button': 1
    };
    
    var onOffTable = {
        'off': 0,
        'on': 1
    }
    
    var headPositionTable = {
        'left' : 0,
        'right' : 1,
        'center' : 2,
        'top' : 3,
        'bottom' : 4
    }

    var TxCmdBuffer = new Uint8Array(8);
    
    // Top button pressed
    ext.whenButtonPressed = function () {
        if (!extDevice || !extDeviceOnline) return false;
        if (inputSensor[0] == SensorRes_Button) {
            if(inputSensor[1] != 0) {
                // TODO : check button mask
                inputSensor[0] = 0;  // clear
                inputSensor[1] = 0;  // clear
                return true;
            }
        }
        return false;
    };
   
    ext.buttonSetEnable = function(vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Button Sensor:'+vOnOff);
        
        initCmdBuffer(SysCmdID); // System command

        TxCmdBuffer[2] = SensorConfigID; // sensor config
        TxCmdBuffer[3] = SensorButtonID;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[4] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[4] = 1;}

        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.distanceSetEnable = function(vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Distance Sensor:'+vOnOff);
        
        initCmdBuffer(SysCmdID); // System command

        TxCmdBuffer[2] = SensorConfigID; // sensor config
        TxCmdBuffer[3] = SensorDistanceID;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[4] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[4] = 1;}

        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.bodyMove = function(angularVelocity, linearVelocity) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Rolling angularVelocity:'+angularVelocity+' linearVelocity:'+linearVelocity);

        if(angularVelocity>389) angularVelocity = 389;
        if(angularVelocity<-389) angularVelocity = -389;
        
        if(linearVelocity>100) linearVelocity = 100;
        if(linearVelocity<-100) linearVelocity =-100;
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = 0; // roll mode
        TxCmdBuffer[3] = getByte_High(angularVelocity);
        TxCmdBuffer[4] = getByte_Low(angularVelocity);
        TxCmdBuffer[5] = getByte_High(linearVelocity);
        TxCmdBuffer[6] = getByte_Low(linearVelocity);

        extDevice.send(TxCmdBuffer.buffer);

    };

    ext.bodyMoveDir = function(dir, linearVelocity) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Rolling dir:'+dir+' linearVelocity:'+linearVelocity);
        
        if(dir == menus[lang]['direction'][dirTable['forward']]) ext.bodyMove(0,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['backward']]) ext.bodyMove(0,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['left']]) ext.bodyMove(90,linearVelocity);
        else if(dir == menus[lang]['direction'][dirTable['right']]) ext.bodyMove(-90,linearVelocity);
    };
    
    ext.stopMove = function() {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('rollStop');
        
        ext.bodyMove(0,0);
    };

    ext.headPosition = function(angleX, angleY) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Head Posion angleX:'+angleX+' angleY:'+angleY);
        
        if(angleX < -120) angleX = -120;
        if(angleX > 120) angleX = 120;
        
        if(angleY > 7) angleY = 7;
        if(angleY < -20) angleY = -20;
        
        initCmdBuffer(RollCmdID);  // Roll command
        
        TxCmdBuffer[2] = HeadMoveID; // roll mode
        TxCmdBuffer[3] = getByte_High(angleX);
        TxCmdBuffer[4] = getByte_Low(angleX);
        TxCmdBuffer[5] = getByte_High(angleY);
        TxCmdBuffer[6] = getByte_Low(angleY);

        extDevice.send(TxCmdBuffer.buffer);

    };

    ext.headViewPosition = function(viewDir) {
        // Code that gets executed when the block is run

        if(!extDevice || !extDeviceOnline) return;

        console.log('Head View Position :'+viewDir);
        
        if(viewDir == menus[lang]['headDirection'][headPositionTable['left']]) ext.headPosition(90,0);
        else if(viewDir == menus[lang]['headDirection'][headPositionTable['right']]) ext.headPosition(-90,0);
        else if(viewDir == menus[lang]['headDirection'][headPositionTable['top']]) ext.headPosition(0,-12);
        else if(viewDir == menus[lang]['headDirection'][headPositionTable['bottom']]) ext.headPosition(0,7);
        else if(viewDir == menus[lang]['headDirection'][headPositionTable['center']]) ext.headPosition(0,0);
    };

    ext.light = function(vName, vColor) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED name :'+vName + ' color:'+vColor);

        if(vColor == menus[lang]['lightColor'][colorTable['red']]) {ext.lightRGB(vName,255,0,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['bright red']]) {ext.lightRGB(vName,255,128,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['yellow']]) {ext.lightRGB(vName,255,255,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['green']]) {ext.lightRGB(vName,0,255,0);}
        else if(vColor == menus[lang]['lightColor'][colorTable['bright blue']]) {ext.lightRGB(vName,0,128,255);}	
        else if(vColor == menus[lang]['lightColor'][colorTable['blue']]) {ext.lightRGB(vName,0,0,255);}
        else if(vColor == menus[lang]['lightColor'][colorTable['magenta']]) {ext.lightRGB(vName,255,0,255);}	
        else if(vColor == menus[lang]['lightColor'][colorTable['white']]) {ext.lightRGB(vName,255,255,255);}
        else if(vColor == menus[lang]['lightColor'][colorTable['off']]) {ext.lightRGB(vName,0,0,0);}
    };

    ext.lightRGB = function(vName, vRed,vGreen,vBlue) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('LED name:'+vName+' R:'+vRed+' G:'+vGreen+' B:'+vBlue);
                      
        initCmdBuffer(LedCmdID); // LED command
        
        if(vRed>255) vRed=255; if(vRed < 0) vRed = 0;
        if(vGreen>255) vGreen=255; if(vGreen < 0) vGreen = 0;
        if(vBlue>255) vBlue=255; if(vBlue < 0) vBlue = 0;
        
        if(vName == menus[lang]['ledName'][lightLampRgbTable['left ear']]) {TxCmdBuffer[2] =LeftEarLampID;}
        else if(vName == menus[lang]['ledName'][lightLampRgbTable['right ear']]) {TxCmdBuffer[2] = RightEarLampID;}
        else if(vName == menus[lang]['ledName'][lightLampRgbTable['chest']]) {TxCmdBuffer[2] = ChestLampID;}
 
        TxCmdBuffer[3] = vRed;
        TxCmdBuffer[4] = vGreen;
        TxCmdBuffer[5] = vBlue;
        TxCmdBuffer[6] = 0; // backlight

        extDevice.send(TxCmdBuffer.buffer);
    };

    ext.lightLamp = function(vName, vBrightness) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Light Lamp name:'+vName+' Brightness:'+vBrightness);
                      
        initCmdBuffer(LedCmdID); // LED command
        
        if(vBrightness>255) vBrightness=255; if(vBrightness<0) vBrightness=0;
        
        if(vName == menus[lang]['lampName'][lightLampTable['tail']]) {TxCmdBuffer[2] = TailLampID;}
        else if(vName == menus[lang]['lampName'][lightLampTable['top button']]) {TxCmdBuffer[2] = TopButtonLampID; }

        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = 0;
        TxCmdBuffer[6] = vBrightness; // backlight

        extDevice.send(TxCmdBuffer.buffer);
    };


    ext.lightEyes = function(vEyesLampID, vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;

        console.log('Eyes '+vEyesLampID+' OnOff:'+vOnOff);
                      
        initCmdBuffer(LedCmdID); // LED command

        TxCmdBuffer[2] = EyesLampID; // which lamp
        TxCmdBuffer[3] = 0;
        TxCmdBuffer[4] = 0;
        TxCmdBuffer[5] = menus[lang]['eyeLamp'].indexOf(vEyesLampID) + 1;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[6] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[6] = 255;}

        extDevice.send(TxCmdBuffer.buffer);
    };
    

    ext.lightEyesMask = function(vHexMask, vOnOff) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        var vDec = parseInt(vHexMask,16);
        console.log('Eyes Mask:'+vHexMask+' dec='+vDec);
                      
        initCmdBuffer(LedCmdID); // LED command

        TxCmdBuffer[2] = EyesLampID; // which lamp
        TxCmdBuffer[3] = getByte_High(vDec);
        TxCmdBuffer[4] = getByte_Low(vDec);
        TxCmdBuffer[5] = 0;

        if(vOnOff == menus[lang]['onOff'][onOffTable['off']]) {TxCmdBuffer[6] = 0;}
        else if(vOnOff == menus[lang]['onOff'][onOffTable['on']]) {TxCmdBuffer[6] = 255;}

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.soundPlay = function(vSndIndex, vVolume) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        console.log('Sound index:'+vSndIndex+' volume:'+vVolume);

        if(vVolume > 100) vVolume = 100; if(vVolume<0) vVolume = 0;
                      
        initCmdBuffer(SoundCmdID); // Sound command

        TxCmdBuffer[2] = SoundPlayID; // which sound type
        TxCmdBuffer[3] = menus[lang]['soundGroup'].indexOf(vSndIndex);
        TxCmdBuffer[4] = vVolume;
        TxCmdBuffer[5] = 0;

        extDevice.send(TxCmdBuffer.buffer);
    };
    
    ext.soundPlayExt = function(vSndIndex,vVolume) {
        // Code that gets executed when the block is run

        if(!extDevice  || !extDeviceOnline) return;
        
        console.log('Sound GroupExt index:'+vSndIndex + ' volume:'+vVolume);
    
        if(vVolume > 100) vVolume = 100; if(vVolume<0) vVolume = 0;
                      
        initCmdBuffer(SoundCmdID); // Sound command

        TxCmdBuffer[2] = SoundPlayID; // which sound type
        TxCmdBuffer[3] = 0x80 + menus[lang]['soundGroupExt'].indexOf(vSndIndex);
        TxCmdBuffer[4] = vVolume;
        TxCmdBuffer[5] = 0;

        extDevice.send(TxCmdBuffer.buffer);
     };

    function initCmdBuffer(cmdType) {
    	TxCmdBuffer[0] = HeaderStart;
    	TxCmdBuffer[1] = cmdType;
    	TxCmdBuffer[7] = HeaderEnd;
    	for (var i = 2;i < 7;i++) {
    		TxCmdBuffer[i] = 0;
    	}
    }

    function getByte_High(vBits16) {
    	return ((vBits16 >> 8) & 0xFF);
    }
    
    function getByte_Low(vBits16) {
    	return (vBits16 & 0xFF);
    }

    var inputSystem = [];
    var inputSensor = [];

    function processData() {
        var bytes = new Uint8Array(rawData);
        
        var channel = bytes[1];
        if(channel == channels['system']) {
            for (var i = 2; i < 7; i++) {
                //console.log('inputSystem='+bytes[i].toString(16));
                inputSystem[i-2] = bytes[i];  // received data without Header < >
            }
        } 
        else if(channel == channels['sensor']) {
            for (var i = 2; i < 7; i++) {
                //console.log('inputSensor='+bytes[i].toString(16));
                inputSensor[i-2] = bytes[i];  // received data without Header < >
            }
        }
        
        if(inputSystem[0] == 2) {
            extDeviceOnline = true;
        }
        else {
            extDeviceOnline = false;
        }

        if (watchdog) {
            clearTimeout(watchdog);
            watchdog = setTimeout(watchdog_func, 3000);
        }
        
        rawData = null;
    }

    function appendBuffer(buffer1, buffer2) {
        var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
        tmp.set(new Uint8Array(buffer1), 0);
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
        return tmp.buffer;
    }

    // Extension API interactions
    var potentialDevices = [];
    ext._deviceConnected = function (dev) {
        potentialDevices.push(dev);

        if (!extDevice) {
            tryNextDevice();
        }
    };

    function tryNextDevice() {
        // If potentialDevices is empty, device will be undefined.
        // That will get us back here next time a device is connected.
        extDevice = potentialDevices.shift();
        try{
            if (extDevice) {
                extDevice.open({stopBits: 0, bitRate: 38400, ctsFlowControl: 0}, deviceOpened);
            }
        } 
        catch(err) {
            console.log('Device Open Error');
        }
    }

    var poller = null;
    var watchdog = null;

    function deviceOpened(dev) {
        if (!dev) {
            // Opening the port failed.
            tryNextDevice();
            return;
        }
        extDevice.set_receive_handler(function (data) {
            console.log('Received: ' + data.byteLength);
            if (!rawData || rawData.byteLength == 8) {
                rawData = new Uint8Array(data);
            } else {
                rawData = appendBuffer(rawData, data);
            }

            if (rawData.byteLength >= 8) {
                console.log(rawData);
                processData();
                //extDevice.send(pingCmd.buffer);
            }
        });

        sendStartPing();
        
        watchdog = setTimeout(watchdog_func, 3000);
    }
    
    function watchdog_func() {
        // This device didn't get good data in time, so give up on it. Clean up and then move on.
        // If we get good data then we'll terminate this watchdog.
        if(poller) clearInterval(poller);
        poller = null;
        extDevice.set_receive_handler(null);
        extDevice.close();
        extDevice = null;
        extDeviceOnline = false;
        tryNextDevice();
    }

    function sendStartPing() {
        // Tell the DASH to send a input data every 1000ms       
        var pingCmd = new Uint8Array(2);
        pingCmd[0] = HeaderStart;
        pingCmd[1] = HeaderEnd;
        poller = setInterval(function () {
            extDevice.send(pingCmd.buffer);
        }, 1000);
    }
    
    function stopPing() {
        // Stop send PING
        if (poller) poller = clearInterval(poller);
        poller = null;
    }

    ext._deviceRemoved = function (dev) {
        if (extDevice != dev) return;
        if (poller) poller = clearInterval(poller);
        poller = null;
        extDevice = null;
        extDeviceOnline = false;
    };

    ext._shutdown = function () {
        if (poller) poller = clearInterval(poller);
        poller = null;
        if (extDevice) extDevice.close();
        extDevice = null;
        extDeviceOnline = false;
    };

    ext._getStatus = function () {
        if(!extDevice) return {status: 1, msg: 'DASH disconnected'};
        if(extDeviceOnline) return {status: 2, msg: 'DASH connected'};
        return {status: 1, msg: 'Probing for DASH'};
    };

    // Check for GET param 'lang'
    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split("&");
    var lang = 'en';
    for (var i=0; i<vars.length; i++) {
    var pair = vars[i].split('=');
      if (pair.length > 1 && pair[0]=='lang')
        lang = pair[1];
    }
    
    var blocks = {
            // [ Type, String, Callback, Default menu values ]
            // Types: 
            // ' ' 	Synchronous command
            // 'w' 	Asynchronous command
            // 'r' 	Synchronous reporter
            // 'R' 	Asynchronous reporter
            // 'h' 	Hat block (synchronous, returns boolean, true = run stack)
            en: [
              [' ', 'Moving, Angular %n degrees/sec, Linear %n cm/sec', 'bodyMove', '0', '20'],
              [' ', 'Moving, %m.direction , Linear %n cm/sec', 'bodyMoveDir', 'forward', '20'],
              [' ', 'Stop Move','stopMove'],
              ['-'],
              [' ', 'Head position to %m.headDirection', 'headViewPosition','center'],
              [' ', 'Head position to Horizontal %n , Vertical %n degrees', 'headPosition','0','0'],
              ['-'],
              [' ', 'Color %m.ledName to %m.lightColor', 'light', 'chest', 'red'],
              [' ', 'Color %m.ledName with Red:%n Green:%n Blue:%n', 'lightRGB', 'chest', '255', '0', '0'],
              [' ', 'Lamp %m.lampName with Brightness:%n', 'lightLamp', 'top button','255'],
              [' ', 'Eye Lamp #%m.eyeLamp %m.onOff', 'lightEyes', '1', 'on'],
              [' ', 'Eye Lamp Pattern 0x%n for %m.onOff', 'lightEyesMask', '0FFF', 'on'],
              ['-'],
              [' ', 'Sound, Emotion %m.soundGroup with volume %n', 'soundPlay','ok','80'],
              [' ', 'Sound, Effect %m.soundGroupExt with volume %n', 'soundPlayExt','airplane','80'],
              ['-'],
              [' ', 'Button Sensing %m.onOff', 'buttonSetEnable', 'off'],
              [' ', 'Distance Sensing %m.onOff', 'distanceSetEnable', 'off'],
              ['h', 'when Button Pressed', 'whenButtonPressed'],
              ['-']
            ],
            ko: [
              [' ', '이동, 초당 %n 도 회전, 초당 %n cm직진', 'bodyMove', '0', '50'],
              [' ', '이동, %m.direction 방향, 초당 %n cm직진', 'bodyMoveDir', '앞으로', '30'],
              [' ', '이동 정지','stopMove'],
              ['-'],
              [' ', '머리 방향, %m.headDirection', 'headViewPosition','정면'],
              [' ', '머리 방향, 좌우 %n 도, 상하 %n 도', 'headPosition','0','0'],
              ['-'],
              [' ', '색 바꾸기,%m.ledName %m.lightColor', 'light', '가슴', '빨강'],
              [' ', '색 바꾸기,%m.ledName 빨강:%n 초록:%n 파랑:%n', 'lightRGB', '가슴', '255', '0', '0'],
              [' ', '램프 %m.lampName 밝기:%n', 'lightLamp', '큰 버튼','255'],
              [' ', '눈 조명 #%m.eyeLamp %m.onOff', 'lightEyes', '1', '켜기'],
              [' ', '눈 조명, 모양값 0x%n 으로 %m.onOff', 'lightEyesMask', '0FFF', '켜기'],
              ['-'],
              [' ', '소리, 느낌 %m.soundGroup , 음량 %n', 'soundPlay','좋아','80'],
              [' ', '소리, 효과음 %m.soundGroupExt , 음량 %n', 'soundPlayExt','비행기','80'],
              ['-'],
              [' ', '버튼 감지 %m.onOff', 'buttonSetEnable', '끄기'],
              [' ', '거리 감지 %m.onOff', 'distanceSetEnable', '끄기'],
              ['h', '버튼을 누르면', 'whenButtonPressed'],
              ['-']
            ]
    };

    var menus = {
          en: {
            direction: ['forward', 'backward', 'left', 'right'],
            headDirection: ['left','right','center','top','bottom'],
            lightColor: ['red', 'bright red', 'yellow', 'green', 'bright blue', 'blue', 'magenta','white','off'],
            ledName: ['left ear', 'right ear', 'chest'],
            lampName: ['tail', 'top button'],
            eyeLamp: ['1','2','3','4','5','6','7','8','9','10','11','12'],
            soundGroup:['ok','bye','sigh','bragging','confused','cool','huh','hi','wah','wow','wee','woohoo','haha','ooh','grunt','lets go','tah dah','snoring','surprised','weehee','uh huh','uh oh','yawn','yippe'],
            soundGroupExt:['airplane','bot cute','crocodile','dinosaur','elephant','engine rev','goat','cat','dog','lion','gobble','helicopter','horse','squeak1','squeak2','short boost','tire squeal','train','truck horn','lip trumpet','tugboat','lip buzz','siren'],
            onOff: ['off','on']
          },
          ko: {
            direction: ['앞으로', '뒤로', '왼쪽', '오른쪽'],
            headDirection: ['왼쪽','오른쪽','정면','위','아래'],
            lightColor: ['빨강', '주황', '노랑', '초록', '하늘', '파랑', '보라', '흰', '끄기'],
            ledName: ['왼쪽 귀', '오른쪽 귀', '가슴'],
            lampName: ['꼬리등', '큰 버튼'],
            eyeLamp: ['1','2','3','4','5','6','7','8','9','10','11','12'],
            soundGroup:['좋아','잘가','하아','랄라랄라','정신차려','멋진걸','으음','안녕','어어','와우','아아','유후','하하히히','우우','으라차','출발','짜쟌','그르릉','우우우','랄랄라','예우후','어-어','하품','야호'],
            soundGroupExt:['비행기','귀여운 로봇','악어','공룡','코끼리','엔진 회전','염소','고양이','개','사자','칠면조','헬리콥터','말','찍찍1','찍찍2','발사','타이어 소리','기차 경적','트럭 경적','트럼펫 흉내','뱃고동','부르릉 흉내','사이렌'],
            onOff: ['끄기','켜기']
          }
    };
  
    // Block and block menu descriptions
    var descriptor = {
        blocks: blocks[lang],
        menus: menus[lang],
        url: 'http://hreclove.github.io/extension/dash/'
    };

    // Register the extension
    ScratchExtensions.register('DASH', descriptor, ext, {type: 'serial'});

})({});