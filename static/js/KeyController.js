export class KeyController {
    constructor() {
        //생성자
        this.keys = [];

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
        });

        window.addEventListener('keyup', e => {
            delete this.keys[e.code];
        });
    }
}