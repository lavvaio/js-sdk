import { ClientMessageDataType, WebsocketMessage } from './message';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter, map, retryWhen } from 'rxjs/operators';

import { webSocket } from 'rxjs/webSocket';
// https://www.learnrxjs.io/learn-rxjs/operators/error_handling/retrywhen
// https://gearheart.io/blog/auto-websocket-reconnection-with-rxjs-with-example/
// https://github.com/ReactiveX/rxjs/blob/6.5.5/src/internal/observable/dom/WebSocketSubject.ts#L150-L387
// import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/observable/dom/WebSocketSubject';

import { WebsocketConnectionOptions } from './connection-options';
import { LVCloseEvent, LVErrorEvent, LVEvent, LVEventMessageType, LVMessageEvent, LVOpenEvent } from './events';
import { genericRetryStrategy } from './retry';

export class WebsocketConnection {

    private host: string;
    private path: string;
    private apiKey: string;
    private secure: boolean;
    private userId: string;
    private clientId: string;
    private format: 'text' | 'binary';

    private connected = false;
    private channels = new Set<string>();
    private events = new Subject<LVEvent>();

    constructor(public options: WebsocketConnectionOptions) {
        if (!options.host) {
            throw new Error('host parameter is required');
        }

        if (!options.channels) {
            throw new Error('channels have not been specified');
        }

        if (options.channels.length === 0) {
            throw new Error('channels are empty');
        }

        if (!options.apiKey || options.apiKey.length === 0) {
            throw new Error('APIKey is required');
        }

        // store secure
        this.secure = (options?.secure === true);

        // store apiKey
        this.apiKey = options.apiKey;

        // store host
        if (options.host.startsWith('ws://')) {
            this.host = options.host.substring(5);
        } else if (options.host.startsWith('wss://')) {
            this.host = options.host.substring(6);
        } else if (options.host.startsWith('http://')) {
            this.host = options.host.substring(7);
        } else if (options.host.startsWith('https://')) {
            this.host = options.host.substring(8);
        } else {
            this.host = options.host;
        }

        // store path
        this.path = options.hasOwnProperty('path') ? options.path : '/v1/ws';

        // detect format
        this.format = options?.format !== 'text' ? 'binary' : 'text';

        // store client id
        // check if there is a client id specified
        this.userId = options?.user_id || '';

        // remove duplicates
        options.channels.forEach((channel) => this.channels.add(channel));
    }

    private getURL() {
        // use unsecure protocol only if specified and equal to false
        const protocol = this.secure ? 'wss://' : 'ws://';

        // construct url
        let url = `${protocol}${this.host}${this.path}?channels=` + Array.from(this.channels).map(ch => {
            return encodeURIComponent(ch);
        }).join(',');

        if (this.userId !== '') {
            url += `&user_id=${encodeURIComponent(this.userId)}`;
        }

        // set api key
        url += `&apiKey=${encodeURIComponent(this.apiKey)}`;

        // set format
        url += `&format=${encodeURIComponent(this.format)}`;

        return url;
    }

    connect(maxRetryAttempts = 10, retryTimeout = 1000): Subscription {
        const params: any = {
            url: this.getURL(),
            openObserver: {
                next: (event: Event) => {
                    this.connected = true;
                    this.events.next(new LVOpenEvent(event));
                }
            },
            closeObserver: {
                next: (event: CloseEvent) => {
                    this.connected = false;
                    this.events.next(new LVCloseEvent(event));
                }
            },
            deserializer: (msg: MessageEvent<any>) => {
                let data;

                if (this.format === 'text') {
                    data = JSON.parse(msg.data);
                } else {
                    data = JSON.parse((new TextDecoder().decode(new Uint8Array(msg.data as ArrayBuffer))));
                }

                return data;
            },
        };

        if (this.format === 'binary') {
            params.binaryType = 'arraybuffer';
        }

        const subject = webSocket<any/*{
            hid?: string;
            pid?: string;
            channel: string;
            type: ClientMessageDataType,
            value: any;
        }*/>(params);

        return subject.pipe(
            filter(data => this.channels.has(data.channel)),
            retryWhen(genericRetryStrategy({ maxRetryAttempts, retryTimeout })),
        ).subscribe(data => {
            if (data.type === ClientMessageDataType.CLIENT_CONNECTED) {
                this.clientId = data.value.client_id;
            }

            this.events.next(new LVMessageEvent(data));
        }, err => {
            this.events.next(new LVErrorEvent(err));
        });
    }

    eventStream<T extends LVEvent>(...events: LVEventMessageType[]): Observable<T> {
        return this.events.asObservable().pipe(
            filter(xevent => events && events.length ? events.includes(xevent.getType()) : true),
            map(xevent => xevent as T),
        );
    }

    channelStream<T = any>(...channels: string[]): Observable<WebsocketMessage<T>> {
        return this.eventStream<LVMessageEvent>(LVMessageEvent.TYPE).pipe(
            filter(xevent => channels.includes(xevent.data.channel)),
            map(xevent => xevent.data as WebsocketMessage<T>),
        );
    }

    getUserId() {
        return this.userId;
    }

    getClientId() {
        return this.clientId;
    }

    getFormat() {
        return this.format;
    }

    isConnected() {
        return this.connected;
    }

}
