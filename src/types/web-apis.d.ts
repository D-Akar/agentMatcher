// Web API type declarations for missing browser APIs

// Bluetooth Web API types
declare class BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerData?: BluetoothManufacturerDataFilterInit[];
    serviceData?: BluetoothServiceDataFilterInit[];
}

declare type BluetoothServiceUUID = number | string;

declare class BluetoothDevice {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
    readonly uuids: string[];
    readonly watchingAdvertisements: boolean;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
    watchAdvertisements(): Promise<void>;
    unwatchAdvertisements(): void;
}

declare class BluetoothRemoteGATTServer {
    readonly device: BluetoothDevice;
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

declare class BluetoothRemoteGATTService {
    readonly device: BluetoothDevice;
    readonly uuid: string;
    readonly isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

declare class BluetoothRemoteGATTCharacteristic {
    readonly service: BluetoothRemoteGATTService;
    readonly uuid: string;
    readonly properties: BluetoothCharacteristicProperties;
    readonly value?: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
}

declare type BluetoothCharacteristicUUID = number | string;

declare class BluetoothCharacteristicProperties {
    readonly broadcast: boolean;
    readonly read: boolean;
    readonly writeWithoutResponse: boolean;
    readonly write: boolean;
    readonly notify: boolean;
    readonly indicate: boolean;
    readonly authenticatedSignedWrites: boolean;
    readonly reliableWrite: boolean;
    readonly writableAuxiliaries: boolean;
}

declare interface BluetoothManufacturerDataFilterInit {
    companyIdentifier: number;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
}

declare interface BluetoothServiceDataFilterInit {
    service: BluetoothServiceUUID;
    dataPrefix?: BufferSource;
    mask?: BufferSource;
}

// Intl API types for GetComposedRangesOptions
declare interface GetComposedRangesOptions {
    granularity?: 'grapheme' | 'word' | 'sentence' | 'line';
    locale?: string;
}

// Extend the global namespace
declare global {
    interface Navigator {
        bluetooth?: {
            requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
            getAvailability(): Promise<boolean>;
            addEventListener(type: string, listener: EventListener): void;
            removeEventListener(type: string, listener: EventListener): void;
        };
    }

    interface RequestDeviceOptions {
        filters?: BluetoothLEScanFilter[];
        optionalServices?: BluetoothServiceUUID[];
        acceptAllDevices?: boolean;
    }
}

export { };
