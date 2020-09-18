import * as Axon from '@jlekie/axon';
import { default as Axios, AxiosInstance } from 'axios';

import * as Https from 'https';

export class AxiosTransport extends Axon.AClientTransport {
    public readonly path: string;

    private readonly axiosClient: AxiosInstance;

    public constructor(path: string) {
        super();

        this.path = path;

        this.axiosClient = Axios.create({
            baseURL: path,
            auth: {
                username: 'test',
                password: '123abc'
            },
            httpsAgent: new Https.Agent({
                rejectUnauthorized: false
            })
        });
    }

    public async connect(timeout?: number) {
    }
    public async close() {
    }

    public async send(message: Axon.TransportMessage) {
        this.messageSentEvent.emit(message);

        const response = await this.axiosClient.post('/send', {
            payload: message.payload.toString('base64'),
            metadata: message.metadata.frames.map(frame => ({
                id: frame.id,
                data: frame.data.toString('base64')
            }))
        });
    }
    public async sendTagged(messageId: string, message: Axon.TransportMessage) {
        this.messageSentEvent.emit(message);

        // const service = message.metadata.get('service').toString('utf8');
        // const action = message.metadata.get('action').toString('utf8');
        // const serviceIdentifier = message.metadata.get('serviceIdentifier').toString('utf8');

        // const response = await this.axiosClient.post(`/send-tagged?mid=${messageId}&service=${service}&action=${action}&serviceIdentifier=${serviceIdentifier}`, {
        const response = await this.axiosClient.post(`/send-tagged?mid=${messageId}`, {
            // messageId,
            payload: message.payload.toString('base64'),
            metadata: message.metadata.frames.map(frame => ({
                id: frame.id,
                data: frame.data.toString('base64')
            }))
        });
    }

    public async receive() {
        const response = await this.axiosClient.post('/receive');
        const { payload, metadata } = response.data;

        const message = new Axon.TransportMessage(
            Buffer.from(payload, 'base64'),
            new Axon.VolatileTransportMetadata(metadata.map((m: any) => new Axon.VolatileTransportMetadataFrame(m.id, Buffer.from(m.data, 'base64'))))
        );

        this.messageReceivedEvent.emit(message);

        return message;
    }
    public async receiveTagged(messageId: string) {
        const response = await this.axiosClient.post(`/receive-tagged?mid=${messageId}`, {
            // messageId
        });
        const { payload, metadata } = response.data;

        const message = new Axon.TransportMessage(
            Buffer.from(payload, 'base64'),
            new Axon.VolatileTransportMetadata(metadata.map((m: any) => new Axon.VolatileTransportMetadataFrame(m.id, Buffer.from(m.data, 'base64'))))
        );

        this.messageReceivedEvent.emit(message);

        return message;
    }

    public receiveBufferedTagged(): ReturnType<Axon.AClientTransport['receiveBufferedTagged']> {
        throw new Error('Not Implemented');
    }
    public sendAndReceive(message: Axon.TransportMessage): ReturnType<Axon.AClientTransport['sendAndReceive']> {
        throw new Error('Not Implemented');
    }
}