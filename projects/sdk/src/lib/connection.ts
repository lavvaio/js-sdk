import { ClientMessageDataType, WebsocketMessage, WebsocketMessageClientConnectedData } from './message';
import ReconnectingWebSocket, { Event, CloseEvent, ErrorEvent } from 'reconnecting-websocket';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { CloseXEvent, ErrorXEvent, MessageXEvent, OpenXEvent, XEvent } from './events';
import { WebsocketConnectionOptions } from './connection-options';

export class WebsocketConnection {

    private url: string;
    private format: string;
    private clientId: string;
    private transport: string;
    private websocketConnection: ReconnectingWebSocket;

    private connected = false;
    private channels = new Set<string>();
    private events = new Subject<XEvent>();

    constructor(options: WebsocketConnectionOptions) {
        if (!options.host) {
            throw new Error('host parameter is required');
        }

        if (!options.channels) {
            throw new Error('channels have not been specified');
        }

        if (options.channels.length === 0) {
            throw new Error('channels are empty');
        }

        // use unsecure protocol only if specified and equal to false
        const protocol = (options?.secure === false) ? 'ws://' : 'wss://';

        // remove duplicates
        options.channels.forEach((channel) => this.channels.add(channel));

        // construct url
        let url = `${protocol}${options.host}/v1/ws?=channels` + Array.from(this.channels).join(',');

        // check if there is a client id specified
        // this might orevent you to connect if the client id already in the system
        if (options.clientId) {
            this.clientId = options.clientId;
            url += `&client_id=${options.clientId}`;
        }

        // detect format
        if (options?.format !== 'text') {
            options.format = 'binary';
        }

        // set format
        this.format = options.format;
        url += `&format=${options.format}`;

        // store final url
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
                this.format = message.Value.Format;
                this.clientId = message.Value.ClientID;
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
