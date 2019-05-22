/*
 temhumi package
*/
//% weight=6 icon="\uf293" color=#2896ff
namespace temhumi {
    export enum TempSensor { 
        //% block="Port 4"
        port4 = 0x04,       
        //% block="Port 9"
        port9 = 0x09              
    }

    export enum Temp_humi {
        //% block="Temperature"
        Temperature = 0x01,
        //% block="Humidity"
        Humidity = 0x02
    }

    let ATH10_I2C_ADDR = 0x38;
    function temp_i2cwrite(value: number): number {
        let buf = pins.createBuffer(3);
        buf[0] = value >> 8;
        buf[1] = value & 0xff;
        buf[2] = 0;
        basic.pause(80);
        let rvalue = pins.i2cWriteBuffer(ATH10_I2C_ADDR, buf);
        // serial.writeString("writeback:");
        // serial.writeNumber(rvalue);
        // serial.writeLine("");
        return rvalue;
    }

    function temp_i2cread(bytes: number): Buffer {
        let val = pins.i2cReadBuffer(ATH10_I2C_ADDR, bytes);
        return val;
    }

    /**
      * Temperature and humidity sensor init
      */
    //% weight=58 blockId="initTempHumiSensor" block="Initialize temperature and humidity sensor at port%"   
   export function initTempHumiSensor(port: TempSensor) {
        for (let i = 0; i < 10; i++) {
            if (qdee_GetInitStatus()) {
                return;
            }
            basic.pause(500);
        }
       // serial.writeString("init erro");
    }

    function qdee_GetInitStatus(): boolean {
        temp_i2cwrite(0xe108);
        let value = temp_i2cread(1);
        if ((value[0] & 0x68) == 0x08)
            return true;
        else
            return false;
    }

    function qdee_getAc() {
        temp_i2cwrite(0xac33);
        basic.pause(100)
        let value = temp_i2cread(1);
        for (let i = 0; i < 100; i++) {
            if ((value[0] & 0x80) != 0x80) {
                basic.pause(20)
            }
            else
                break;
        }
    }

    function readTempHumi(select: Temp_humi): number {
        while (!qdee_GetInitStatus()) {
            basic.pause(30);
        }
        qdee_getAc();
        let buf = temp_i2cread(6);
        if (buf.length != 6) {
            // serial.writeLine("444444")
            return 0;
        }
        let humiValue: number = 0;
        humiValue = (humiValue | buf[1]) << 8;
        humiValue = (humiValue | buf[2]) << 8;
        humiValue = humiValue | buf[3];
        humiValue = humiValue >> 4;
        let tempValue: number = 0;
        tempValue = (tempValue | buf[3]) << 8;
        tempValue = (tempValue | buf[4]) << 8;
        tempValue = tempValue | buf[5];
        tempValue = tempValue & 0xfffff;
        if (select == Temp_humi.Temperature) {
            tempValue = tempValue * 200 * 10 / 1024 / 1024 - 500;
            return Math.round(tempValue);
        }
        else {
            humiValue = humiValue * 1000 / 1024 / 1024;
            return Math.round(humiValue);
        }
    }

    /**
      * Get sensor temperature and humidity
      */
    //% weight=60 blockId="gettemperature" block="Get %select"   
    export function gettemperature(select: Temp_humi): number {
        return readTempHumi(select);
    }
}
