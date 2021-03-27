import { filter, first } from 'rxjs/operators';
import {
    WebsocketMessage,
    ClientMessageDataType,
    WebsocketConnection,
    LVMessageEvent,
    LVOpenEvent,
    WebsocketMessageClientConnectedData
} from '../public-api';

describe('WebsocketConnection', () => {

    it('open connection', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with no protocol', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with http protocol', (done) => {
        const connection = new WebsocketConnection({
            host: 'http://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with https protocol', (done) => {
        const connection = new WebsocketConnection({
            host: 'http://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with ws protocol', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with wss protocol', (done) => {
        const connection = new WebsocketConnection({
            host: 'wss://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVOpenEvent>(LVOpenEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            done();
        });

        connection.connect();
    });

    it('initialize connection with no format', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
        });

        connection.eventStream<LVMessageEvent<{ value: { format: string; } }>>(LVMessageEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.format).toBe('binary');
            done();
        });

        connection.connect();
    });

    it('initialize connection with text format', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            format: 'text',
        });

        connection.eventStream<LVMessageEvent<{ value: { format: string; } }>>(LVMessageEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.format).toBe('text');
            done();
        });

        connection.connect();
    });

    it('initialize connection with binary format', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            format: 'binary',
        });

        connection.eventStream<LVMessageEvent<{ value: { format: string; } }>>(LVMessageEvent.TYPE).pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.format).toBe('binary');
            done();
        });

        connection.connect();
    });

    it('receive client connected message when connecting to channel', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        connection.eventStream<LVMessageEvent<{
            type: number;
            value: WebsocketMessageClientConnectedData,
        }>>(LVMessageEvent.TYPE).pipe(
            filter(msg => msg.data.type === ClientMessageDataType.CLIENT_CONNECTED),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.client_id).not.toBe('');
            expect(msg.data.value.client_id).not.toBeNull();
            expect(msg.data.value.client_id).not.toBeUndefined();
            done();
        });

        connection.connect();
    });

    it('receive snapshot when connecting to channel', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
            secure: false,
            // format: 'text',
        });

        let msgs = 0;
        let channelSize = 0;

        connection.eventStream<LVMessageEvent<{
            type: number;
            value: WebsocketMessageClientConnectedData;
        }>>(LVMessageEvent.TYPE).pipe(
            filter(msg => msg.data.type === ClientMessageDataType.CLIENT_CONNECTED),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.channel_name).toBe('iss');
            channelSize = +msg.data.value.channel_size;
        });

        connection.eventStream<LVMessageEvent<WebsocketMessage<{ iss_position: { latitude: string; longitude: string; } }>>>(
            LVMessageEvent.TYPE
        ).pipe(
            filter(msg => msg.data.type === ClientMessageDataType.DATA),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            msgs++;

            expect(msg.data.channel).toBe('iss');
            expect(msg.data.value.iss_position.latitude).toBeDefined();
            expect(msg.data.value.iss_position.latitude).not.toBe('');
            expect(msg.data.value.iss_position.longitude).toBeDefined();
            expect(msg.data.value.iss_position.longitude).not.toBe('');

            if (msgs === channelSize) {
                done();
            }
        });

        connection.connect();
    });

});
