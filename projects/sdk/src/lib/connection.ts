import ReconnectingWebSocket, { Event, CloseEvent, ErrorEvent } from 'reconnecting-websocket';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CloseXEvent, ErrorXEvent, MessageXEvent, OpenXEvent, XEvent } from './events';

export interface WebsocketConnectionOptions {
    host: string;
    clientId?: string;
    channels: string[];
    secure?: boolean;
    format?: string;
}

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

export class WebsocketConnection {

    private url: string;
    private clientId: string;
    private format: string;
    private transport;
    private connected = false;
    private channels = new Set<string>();
    private events = new Subject<XEvent>();
    private websocketConnection: ReconnectingWebSocket;

    constructor(options: WebsocketConnectionOptions) {
        if (!options.host) {
            throw new Error('host parameter is required');
        }

        if (!options.channels) {
            throw new Error('channels have not been specified');
        }

        if (options.channels.length) {
            throw new Error('channels are empty');
        }

        const protocol = options.secure ? 'wss://' : 'ws://';

        options.channels.forEach((channel) => this.channels.add(channel));

        let url = `${protocol}${options.host}/v1/ws?=channels` + options.channels.join(',');

        if (options.clientId) {
            this.clientId = options.clientId;
            url += `&client_id=${options.clientId}`;
        }

        if (options.format) {
            this.format = options.format;
            url += `&format=${options.format}`;
        }

        this.url = url;
    }

    connect(): (code?: number, reason?: string) => void {
        this.websocketConnection = new ReconnectingWebSocket(this.url);
        this.websocketConnection.addEventListener('error', this.onError);
        this.websocketConnection.addEventListener('close', this.onClose);
        this.websocketConnection.addEventListener('message', this.onMessage);
        this.websocketConnection.addEventListener('open', this.onOpen);
        return (code?: number, reason?: string) => {
            this.websocketConnection.close(code, reason);
            this.websocketConnection.removeEventListener('error', this.onError);
            this.websocketConnection.removeEventListener('close', this.onClose);
            this.websocketConnection.removeEventListener('message', this.onMessage);
            this.websocketConnection.removeEventListener('open', this.onOpen);
        };
    }

    protected onError(event: ErrorEvent) {
        this.events.next(new ErrorXEvent(event));
    }

    protected onClose(event: CloseEvent) {
        this.connected = true;
        this.events.next(new CloseXEvent(event));
    }

    protected onMessage(event: MessageEvent) {
        if (this.channels.has(event.data.Channel)) {

            if (event.data.Type === ClientMessageDataType.CLIENT_CONNECTED) {
                const message = event.data as WebsocketMessage<WebsocketMessageClientConnectedData>;
                this.clientId = message.Value.ClientID;
                this.format = message.Value.Format;
                this.transport = message.Value.Transport;
            }

            this.events.next(new MessageXEvent(event));
        }
    }

    protected onOpen(event: Event) {
        this.connected = true;
        this.events.next(new OpenXEvent(event));
    }

    channelStream<T = any>(channel: string): Observable<WebsocketMessage<T>> {
        return this.events.asObservable().pipe(
            filter(xevent => xevent instanceof MessageXEvent),
            map(xevent => xevent as MessageXEvent),
            filter(xevent => xevent.event.data.Channel === channel),
            map(xevent => xevent.event.data as WebsocketMessage<T>),
        );
    }

    getClientId() {
        return this.clientId;
    }

    getFormat() {
        return this.format;
    }

    getTransport() {
        return this.transport;
    }

    isConnected() {
        return this.connected;
    }

    getUrl() {
        return this.url;
    }

}
