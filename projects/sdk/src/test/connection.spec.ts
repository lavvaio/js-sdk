import { LVErrorEvent } from 'dist/sdk/public-api';
import { merge } from 'rxjs';
import { filter, first, take } from 'rxjs/operators';
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
            filter(msg => msg.channel === 'iss'),
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

    it('can connect to both channels', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss', 'fxcm' ],
            apiKey: 'some-api-key',
        });

        let i = 0;

        connection.channelStream().pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
            take(2),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect([ 'iss', 'fxcm' ].includes(msg.value.channel_name)).toEqual(true);

            if (++i === 2) {
                done();
            }
        });

        connection.connect();
    });

    it('can connect to all channels but receive data from 1', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss', 'fxcm' ],
            apiKey: 'some-api-key',
        });

        let i = 0;

        connection.channelStream( 'fxcm' ).pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
            take(1),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect([ 'fxcm' ].includes(msg.value.channel_name)).toEqual(true);

            if (++i === 1) {
                done();
            }
        });

        connection.connect();
    });

    it('can connect with a user id', (done) => {
        const connection = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss', 'fxcm' ],
            apiKey: 'some-api-key',
            userId: 'some-known-user-id',
        });

        let i = 0;

        connection.channelStream( 'iss', 'fxcm' ).pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
            take(2),
        ).subscribe(msg => {
            expect(connection.isConnected()).toBe(true);
            expect([ 'iss', 'fxcm' ].includes(msg.value.channel_name)).toEqual(true);
            expect(msg.value.user_id).toEqual('some-known-user-id');

            if (++i === 2) {
                done();
            }
        });

        connection.connect();
    });

    it('can establish multiple connections with same user id', (done) => {
        const connection1 = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss', 'fxcm' ],
            apiKey: 'some-api-key',
            userId: 'some-known-user-id',
        });

        const connection2 = new WebsocketConnection({
            host: 'localhost:5555',
            channels: [ 'iss', 'fxcm' ],
            apiKey: 'some-api-key',
            userId: 'some-known-user-id',
        });

        let i = 0;

        merge(
            connection1.channelStream(),
            connection2.channelStream(),
        ).pipe(
            filter(msg => msg.type === ClientMessageDataType.CLIENT_CONNECTED),
        ).subscribe(msg => {
            expect(connection1.isConnected()).toBe(true);
            expect(connection2.isConnected()).toBe(true);
            expect([ 'iss', 'fxcm' ].includes(msg.value.channel_name)).toEqual(true);
            expect(msg.value.user_id).toEqual('some-known-user-id');

            if (++i === 4) {
                done();
            }
        });

        connection1.connect();
        connection2.connect();
    });

});
