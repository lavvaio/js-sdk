export enum ClientMessageDataType {
    CLIENT_CONNECTED = 0,
    CLIENT_DISCONNECTED = 1,
    CLIENT_SUBSCRIBE = 2,
    CLIENT_SUBSCRIBED = 3,
    CLIENT_UNSUBSCRIBE = 4,
    CLIENT_UNSUBSCRIBED = 5,
    DATA = 6,
    PARTIAL_DATA = 7,
}

export interface WebsocketMessage<T = any> {
    hid?: string;
    pid?: string;
    type: ClientMessageDataType;
    channel: string;
    key: string;
    tag: string;
    value: T;
    timestamp: number;
}

export interface WebsocketMessageClientConnectedData {
    client_id: string;
    user_id?: string;
    format?: string;
    transport?: string;
    channel_name: string;
    channel_size: number;
    channel_encoding: string;
}

export interface WebsocketMessageClientDisconnectedData {
    client_id: string;
    user_id?: string;
    format?: string;
    transport?: string;
    channel_name: string;
    channel_size: number;
    channel_encoding: string;
}
