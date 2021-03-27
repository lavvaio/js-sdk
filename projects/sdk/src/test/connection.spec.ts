import { LVErrorEvent } from 'dist/sdk/public-api';
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
        });

        connection.openConnectionStream().pipe(
            first(),
        ).subscribe(_ => {
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
        });

        connection.openConnectionStream().pipe(
            first(),
        ).subscribe(_ => {
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
        });

        connection.openConnectionStream().pipe(
            first(),
        ).subscribe(_ => {
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
        });

        connection.openConnectionStream().pipe(
            first(),
        ).subscribe(_ => {
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
        });

        connection.openConnectionStream().pipe(
            first(),
        ).subscribe(_ => {
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
        });

        connection.openConnectionStream().subscribe(_ => {
            expect(connection.isConnected()).toBe(false);
        });

        connection.closeConnectionStream().subscribe(_ => {
            expect(connection.isConnected()).toBe(false);
            done();
        });

        connection.errorConnectionStream().subscribe(errorEvent => {
            expect(errorEvent).toBeDefined();
            expect(errorEvent.data).toBeDefined();
            expect(connection.isConnected()).toBe(false);
            done();
        });

        connection.connect();
    });

    it('initialize connection with no format', (done) => {
        const connection = new WebsocketConnection({
            host: 'ws://localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
        });

        connection.dataConnectionStream<{ format: string; }>().pipe(
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
            format: 'text',
        });

        connection.dataConnectionStream<{ format: string; }>().pipe(
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
            format: 'binary',
        });

        connection.dataConnectionStream<{ format: string; }>().pipe(
            first(),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.data.value.format).toBe('binary');
            done();
        });

        connection.connect();
    });

    it('receive client connected message when connecting to all channels', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
        });

        connection.channelStream().pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.value.client_id).not.toBe('');
            expect(msg.value.client_id).not.toBeNull();
            expect(msg.value.client_id).not.toBeUndefined();
            expect(connection.getClientId()).not.toBe('');
            expect(connection.getClientId()).not.toBeNull();
            expect(connection.getClientId()).not.toBeUndefined();
            expect(connection.getClientId()).toEqual(msg.value.client_id);
            done();
        });

        connection.connect();
    });

    it('receive snapshot when connecting', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss' ],
            apiKey: 'some-api-key',
        });

        let msgs = 0;
        let channelSize = 0;

        connection.channelStream().pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect(msg.value.channel_name).toBe('iss');
            channelSize = +msg.value.channel_size;
        });

        connection.channelStream('iss').pipe(
            filter(msg => msg.type === ClientMessageDataType.DATA),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            msgs++;

            expect(msg.channel).toBe('iss');
            expect(msg.value.iss_position.latitude).toBeDefined();
            expect(msg.value.iss_position.latitude).not.toBe('');
            expect(msg.value.iss_position.longitude).toBeDefined();
            expect(msg.value.iss_position.longitude).not.toBe('');

            if (msgs === channelSize) {
                done();
            }
        });

        connection.connect();
    });

});
