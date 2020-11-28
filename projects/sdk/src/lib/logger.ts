export class LVLogger {

    constructor(
        private label = 'lavva',
        private style = `padding: 3px;
            font-size: 10px;
            font-family: monospace;
            background-color: rgb(51, 102, 255);
            color: #fff;
            border-radius: 3px;`) {
        //
    }

    log(...args: any[]) {
        console.log(`%c${this.label}`, this.style, ...args);
    }

}
