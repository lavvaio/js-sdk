export enum ClientMessageDataType {
    CLIENT_CONNECTED = 0,
    CLIENT_DISCONNECTED = 1,
    CLIENT_SUBSCRIBE = 2,
    CLIENT_SUBSCRIBED = 3,
    CLIENT_UNSUBSCRIBE = 4,
    CLIENT_UNSUBSCRIBED = 5,
    DATA = 6,
}

export interface WebsocketMessage<T = any> {
    hid?: string;
    pid?: string;
    Type: ClientMessageDataType;
    Channel: string;
    Key: string;
    Tag: string;
    Value: T;
    Timestamp: number;
}

export interface WebsocketMessageClientConnectedData {
    ClientID: string;
    Format: string;
    Transport: string;
}
