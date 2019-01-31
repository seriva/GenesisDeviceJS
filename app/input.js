import Hammer from 'hammerjs';
import nipplejs from 'nipplejs';
import Utils from './utils';
import Settings from './settings';
import DOM from './dom';

const h = DOM.h;

DOM.registerCSS({
    '#input': {
        zIndex: 500
    },

    '#cursor': {
        position: 'absolute',
        display: 'block',
        width: '50px',
        height: '50px',
        marginLeft: '-25px',
        marginTop: '-25px',
        background: 'white',
        opacity: 0,
        borderRadius: '50%'
    },

    '#move': {
        width: '200px',
        height: '100%',
        left: '0px',
        bottom: '0px',
        margin: 0,
        padding: 0
    },

    '#look': {
        width: 'calc(100% - 200px)',
        height: '100%',
        right: '0px',
        bottom: '0px',
        margin: 0,
        padding: 0,
        position: 'absolute',
        opacity: 0.01
    }
});

let visibleCursor = true;
let virtualInputVisible = Utils.isMobile();
let cursorMovement = {
    x: 0,
    y: 0
};
let pressed = {};
let upevents = [];
let downevents = [];
let timeout;
let input = null;

window.addEventListener(
    'keyup',
    (event) => {
        delete pressed[event.keyCode];
        for (let l = 0; l < upevents.length; l++) {
            if (upevents[l].key === event.keyCode) {
                upevents[l].event();
            }
        }
        for (let l = 0; l < downevents.length; l++) {
            if (downevents[l].pressed) {
                downevents[l].pressed = false;
            }
        }
    },
    false
);

window.addEventListener(
    'keydown',
    (event) => {
        pressed[event.keyCode] = true;
        for (let l = 0; l < downevents.length; l++) {
            if (downevents[l].key === event.keyCode && !downevents[l].pressed) {
                downevents[l].event();
                downevents[l].pressed = true;
            }
        }
    },
    false
);

window.addEventListener(
    'mousemove',
    (evt) => {
        cursorMovement = {
            x: evt.movementX,
            y: evt.movementY
        };
        if (timeout !== undefined) {
            window.clearTimeout(timeout);
        }
        timeout = window.setTimeout(() => {
            cursorMovement = {
                x: 0,
                y: 0
            };
        }, 50);
    },
    false
);

if (Utils.isMobile()) {
    const move = h('div#move');
    const look = h('div#look');
    const cursor = h('div#cursor');
    input = h('div#input', [move, look, cursor]);
    DOM.append(() => input);

    const lookTouch = new Hammer(look.domNode, {
        touchAction: 'auto',
        inputClass: Hammer.TouchInput
    });
    lookTouch.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    lookTouch.on('panstart panmove panend', (ev) => {
        cursorMovement = {
            x: 0,
            y: 0
        };
        if (ev.type === 'panmove') {
            cursorMovement = {
                x: ev.velocityX * 16 * Settings.looksensitivity,
                y: ev.velocityY * 16 * Settings.looksensitivity
            };
            if (ev.pointers && ev.pointers[0]) {
                cursor.domNode.style.left = `${ev.pointers[0].clientX}px`;
                cursor.domNode.style.top = `${ev.pointers[0].clientY}px`;
            }
        }
        if (ev.type === 'panstart') {
            DOM.animate(
                cursor.domNode,
                { opacity: 0.5 },
                {
                    mobileHA: false,
                    duration: 100,
                    delay: 0,
                    easing: 'ease-in'
                }
            );
        }
        if (ev.type === 'panend') {
            DOM.animate(
                cursor.domNode,
                { opacity: 0.0 },
                {
                    mobileHA: false,
                    duration: 100,
                    delay: 0,
                    easing: 'ease-in'
                }
            );
        }
    });

    // WASD input with virtual joystick
    const moveJoystick = nipplejs.create({
        zone: move.domNode,
        mode: 'static',
        position: { left: '80px', bottom: '80px' },
        color: 'white'
    });
    moveJoystick
        .on('move', (evt, data) => {
            if (data.angle && data.distance && data.distance > 20) {
                delete pressed[Settings.forward];
                delete pressed[Settings.backwards];
                delete pressed[Settings.left];
                delete pressed[Settings.right];
                const a = data.angle.degree;
                if ((a >= 337.5 && a < 360) || (a >= 0 && a < 22.5)) {
                    pressed[Settings.right] = true;
                }
                if (a >= 22.5 && a < 67.5) {
                    pressed[Settings.right] = true;
                    pressed[Settings.forward] = true;
                }
                if (a >= 67.5 && a < 112.5) {
                    pressed[Settings.forward] = true;
                }
                if (a >= 112.5 && a < 157.5) {
                    pressed[Settings.forward] = true;
                    pressed[Settings.left] = true;
                }
                if (a >= 157.5 && a < 202.5) {
                    pressed[Settings.left] = true;
                }
                if (a >= 202.5 && a < 247.5) {
                    pressed[Settings.left] = true;
                    pressed[Settings.backwards] = true;
                }
                if (a >= 247.5 && a < 292.5) {
                    pressed[Settings.backwards] = true;
                }
                if (a >= 292.5 && a < 337.5) {
                    pressed[Settings.backwards] = true;
                    pressed[Settings.right] = true;
                }
            }
        })
        .on('end', () => {
            delete pressed[Settings.forward];
            delete pressed[Settings.backwards];
            delete pressed[Settings.left];
            delete pressed[Settings.right];
        });
}

const Input = {
    cursorMovement() {
        return cursorMovement;
    },

    toggleCursor(show) {
        show === undefined ? (visibleCursor = !visibleCursor) : (visibleCursor = show);
        if (visibleCursor) {
            document.exitPointerLock();
        } else {
            document.body.requestPointerLock();
        }
    },

    toggleVirtualInput(show) {
        if (!Utils.isMobile()) return;
        show === undefined
            ? (virtualInputVisible = !virtualInputVisible)
            : (virtualInputVisible = show);
        if (virtualInputVisible) {
            input.domNode.style.visibility = 'visible';
        } else {
            input.domNode.style.visibility = 'hidden';
        }
    },

    clearInputEvents() {
        pressed = {};
        upevents = [];
        downevents = [];
    },

    addKeyDownEvent(key, event) {
        downevents.push({
            /* eslint-disable */
            key: key,
            event: event,
            /* eslint-disable */
            pressed: false
        });
    },

    addKeyUpEvent(key, event) {
        upevents.push({
            /* eslint-disable */
            key: key,
            event: event
            /* eslint-disable */
        });
    },

    isDown(keyCode) {
        return pressed[keyCode];
    }
};

export { Input as default };
